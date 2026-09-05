mod database;

const PYTHON_RUNNER: &str = include_str!("../scripts/main.py");

use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::SqlitePool;
use std::{
    fs,
    path::PathBuf,
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Emitter, Manager};

static RUN_SEQUENCE: AtomicU64 = AtomicU64::new(0);

#[derive(Serialize)]
struct PythonInterpreter {
    name: String,
    path: String,
    version: String,
}

#[derive(Default)]
struct PythonExecution {
    success: bool,
    outputs: Value,
    logs: String,
    error: String,
}

#[derive(Deserialize)]
struct AutomationOutput {
    name: String,
    r#type: String,
}

#[derive(Serialize)]
struct StartedRun {
    id: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct RunUpdatedEvent {
    automation_id: String,
    run_id: String,
}

struct TemporaryRunDirectory {
    path: PathBuf,
}

impl TemporaryRunDirectory {
    fn create() -> Result<Self, String> {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|error| error.to_string())?
            .as_nanos();
        let path = std::env::temp_dir().join(format!("eva-run-{}-{timestamp}", std::process::id()));

        fs::create_dir(&path)
            .map_err(|error| format!("Failed to prepare run directory: {error}"))?;

        Ok(Self { path })
    }
}

impl Drop for TemporaryRunDirectory {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.path);
    }
}

#[tauri::command]
fn detect_python_interpreter() -> Result<Option<PythonInterpreter>, String> {
    let output = match Command::new("python3")
        .args([
            "-c",
            "import sys; print(sys.executable); print(sys.version.split()[0])",
        ])
        .output()
    {
        Ok(output) if output.status.success() => output,
        _ => return Ok(None),
    };

    let interpreter_output = String::from_utf8_lossy(&output.stdout);
    let mut lines = interpreter_output.lines();
    let Some(path) = lines.next() else {
        return Ok(None);
    };
    let Some(version) = lines.next() else {
        return Ok(None);
    };

    Ok(Some(PythonInterpreter {
        name: "Python".to_owned(),
        path: path.to_owned(),
        version: version.to_owned(),
    }))
}

fn execute_python_script(script: String, inputs: Value) -> Result<PythonExecution, String> {
    let inputs = serde_json::to_string(&inputs).map_err(|error| error.to_string())?;
    let run_directory = TemporaryRunDirectory::create()?;
    let automation_path = run_directory.path.join("automation.py");
    let runner_path = run_directory.path.join("main.py");
    let outputs_path = run_directory.path.join("outputs.json");

    fs::write(&automation_path, script)
        .map_err(|error| format!("Failed to write automation script: {error}"))?;
    fs::write(&runner_path, PYTHON_RUNNER)
        .map_err(|error| format!("Failed to prepare Python runner: {error}"))?;

    let output = Command::new("python3")
        .arg(&runner_path)
        .current_dir(&run_directory.path)
        .env("EVA_INPUTS", inputs)
        .env("EVA_OUTPUTS_PATH", &outputs_path)
        .output()
        .map_err(|error| format!("Failed to start Python: {error}"))?;

    let logs = String::from_utf8_lossy(&output.stdout).trim().to_owned();
    let mut error = String::from_utf8_lossy(&output.stderr).trim().to_owned();
    let mut success = output.status.success();
    let outputs = if success {
        match fs::read_to_string(&outputs_path)
            .map_err(|error| error.to_string())
            .and_then(|contents| {
                serde_json::from_str::<Value>(&contents).map_err(|error| error.to_string())
            }) {
            Ok(outputs) if outputs.is_object() => outputs,
            Ok(_) => {
                success = false;
                error = "process must return a JSON object.".to_owned();
                Value::Object(serde_json::Map::new())
            }
            Err(outputs_error) => {
                success = false;
                error = format!("Failed to read process outputs: {outputs_error}");
                Value::Object(serde_json::Map::new())
            }
        }
    } else {
        Value::Object(serde_json::Map::new())
    };

    Ok(PythonExecution {
        success,
        outputs,
        logs,
        error,
    })
}

fn generate_run_id() -> Result<String, String> {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_nanos();
    let sequence = RUN_SEQUENCE.fetch_add(1, Ordering::Relaxed);

    Ok(format!("run-{}-{timestamp}-{sequence}", std::process::id()))
}

fn uses_interactive_input(script: &str) -> bool {
    let script_without_whitespace: String = script
        .chars()
        .filter(|character| !character.is_whitespace())
        .collect();

    script_without_whitespace.contains("input(")
}

fn validate_outputs(
    outputs: &Value,
    configured_outputs: &[AutomationOutput],
) -> Result<(), String> {
    let outputs = outputs
        .as_object()
        .ok_or_else(|| "process must return a JSON object.".to_owned())?;

    for output_name in outputs.keys() {
        if !configured_outputs
            .iter()
            .any(|output| output.name == *output_name)
        {
            return Err(format!(
                "process returned an unexpected output: \"{output_name}\"."
            ));
        }
    }

    for output in configured_outputs {
        let value = outputs
            .get(&output.name)
            .ok_or_else(|| format!("process must return the \"{}\" output.", output.name))?;
        let matches_type = match output.r#type.as_str() {
            "boolean" => value.is_boolean(),
            "number" => value.is_number(),
            "text" | "file" => value.is_string(),
            _ => false,
        };

        if !matches_type {
            return Err(format!(
                "The \"{}\" output must be a {}.",
                output.name, output.r#type
            ));
        }
    }

    Ok(())
}

async fn open_database(app: &AppHandle) -> Result<SqlitePool, String> {
    let database_path = app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?
        .join("eva.db");
    let database_url = format!("sqlite:{}", database_path.display());

    SqlitePool::connect(&database_url)
        .await
        .map_err(|error| format!("Failed to open database: {error}"))
}

async fn complete_run(
    database: &SqlitePool,
    run_id: &str,
    execution: PythonExecution,
    configured_outputs: &[AutomationOutput],
) -> Result<(), String> {
    let validation_error = if execution.success {
        validate_outputs(&execution.outputs, configured_outputs).err()
    } else {
        None
    };
    let status = if execution.success && validation_error.is_none() {
        "succeeded"
    } else {
        "failed"
    };
    let error = validation_error.unwrap_or(execution.error);

    sqlx::query(
        "UPDATE runs SET status = ?, outputs_json = ?, logs = ?, error = ?, finished_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
    )
    .bind(status)
    .bind(execution.outputs.to_string())
    .bind(execution.logs)
    .bind(error)
    .bind(run_id)
    .execute(database)
    .await
    .map_err(|error| format!("Failed to complete run: {error}"))?;

    Ok(())
}

#[tauri::command]
async fn start_automation_run(
    app: AppHandle,
    automation_id: String,
    script: String,
    outputs: Vec<AutomationOutput>,
    inputs: Value,
) -> Result<StartedRun, String> {
    if uses_interactive_input(&script) {
        return Err("input() is not supported. Define an automation input instead.".to_owned());
    }

    let run_id = generate_run_id()?;
    let inputs_json = serde_json::to_string(&inputs).map_err(|error| error.to_string())?;
    let database = open_database(&app).await?;

    sqlx::query(
        "INSERT INTO runs (id, automation_id, status, inputs_json, started_at) VALUES (?, ?, 'running', ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
    )
    .bind(&run_id)
    .bind(&automation_id)
    .bind(inputs_json)
    .execute(&database)
    .await
    .map_err(|error| format!("Failed to create run: {error}"))?;

    let event = RunUpdatedEvent {
        automation_id: automation_id.clone(),
        run_id: run_id.clone(),
    };
    app.emit("run:updated", &event)
        .map_err(|error| error.to_string())?;

    tauri::async_runtime::spawn(async move {
        let execution = match tauri::async_runtime::spawn_blocking(move || {
            execute_python_script(script, inputs)
        })
        .await
        {
            Ok(Ok(execution)) => execution,
            Ok(Err(error)) => PythonExecution {
                success: false,
                outputs: Value::Object(serde_json::Map::new()),
                logs: String::new(),
                error,
            },
            Err(error) => PythonExecution {
                success: false,
                outputs: Value::Object(serde_json::Map::new()),
                logs: String::new(),
                error: error.to_string(),
            },
        };

        let _ = complete_run(&database, &run_id, execution, &outputs).await;
        let _ = app.emit(
            "run:updated",
            RunUpdatedEvent {
                automation_id,
                run_id,
            },
        );
    });

    Ok(StartedRun { id: event.run_id })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(database::DATABASE_URL, database::migrations())
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            detect_python_interpreter,
            start_automation_run
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
