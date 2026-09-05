mod database;

const PYTHON_RUNNER: &str = include_str!("../scripts/main.py");

use serde::Serialize;
use serde_json::Value;
use std::{
    fs,
    path::PathBuf,
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

#[derive(Serialize)]
struct PythonInterpreter {
    name: String,
    path: String,
    version: String,
}

#[derive(Serialize)]
struct PythonExecution {
    success: bool,
    outputs: Value,
    logs: String,
    error: String,
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

#[tauri::command]
async fn execute_python_script(script: String, inputs: Value) -> Result<PythonExecution, String> {
    tauri::async_runtime::spawn_blocking(move || {
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
    })
    .await
    .map_err(|error| error.to_string())?
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
            execute_python_script
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
