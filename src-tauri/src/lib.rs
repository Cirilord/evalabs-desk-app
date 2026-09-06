mod database;

const PYTHON_RUNNER: &str = include_str!("../scripts/main.py");

use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::SqlitePool;
use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize};
use tauri_plugin_shell::process::Output as ShellOutput;
use tauri_plugin_shell::ShellExt;

static RUN_SEQUENCE: AtomicU64 = AtomicU64::new(0);

#[derive(Serialize)]
struct PythonInterpreter {
    name: String,
    path: String,
    version: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PythonRunner {
    version: String,
    path: Option<String>,
    installed: bool,
    active: bool,
}

#[derive(Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct RunnerConfiguration {
    python_version: Option<String>,
}

const SUPPORTED_PYTHON_VERSIONS: [&str; 5] = ["3.10", "3.11", "3.12", "3.13", "3.14"];

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

#[derive(Deserialize)]
struct AutomationLibrary {
    name: String,
    version: String,
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
        let path =
            std::env::temp_dir().join(format!("evalabs-run-{}-{timestamp}", std::process::id()));

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

fn runner_configuration_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?
        .join("runners.json"))
}

fn read_runner_configuration(app: &AppHandle) -> Result<RunnerConfiguration, String> {
    let path = runner_configuration_path(app)?;

    if !path.exists() {
        return Ok(RunnerConfiguration::default());
    }

    let contents = fs::read_to_string(path)
        .map_err(|error| format!("Failed to read runner configuration: {error}"))?;

    serde_json::from_str(&contents)
        .map_err(|error| format!("Failed to read runner configuration: {error}"))
}

fn write_runner_configuration(
    app: &AppHandle,
    configuration: &RunnerConfiguration,
) -> Result<(), String> {
    let path = runner_configuration_path(app)?;
    let directory = path
        .parent()
        .ok_or_else(|| "Failed to resolve runner configuration directory.".to_owned())?;

    fs::create_dir_all(directory)
        .map_err(|error| format!("Failed to prepare runner configuration directory: {error}"))?;
    let contents = serde_json::to_string(configuration).map_err(|error| error.to_string())?;

    fs::write(path, contents)
        .map_err(|error| format!("Failed to save runner configuration: {error}"))
}

#[cfg(debug_assertions)]
fn development_uv_path() -> Result<PathBuf, String> {
    let target = match (std::env::consts::OS, std::env::consts::ARCH) {
        ("macos", "aarch64") => "aarch64-apple-darwin",
        ("macos", "x86_64") => "x86_64-apple-darwin",
        ("windows", "aarch64") => "aarch64-pc-windows-msvc.exe",
        ("windows", "x86_64") => "x86_64-pc-windows-msvc.exe",
        ("linux", "aarch64") => "aarch64-unknown-linux-gnu",
        ("linux", "x86_64") => "x86_64-unknown-linux-gnu",
        (operating_system, architecture) => {
            return Err(format!(
                "The bundled uv runner is not available for {operating_system}/{architecture}."
            ))
        }
    };

    Ok(PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("binaries")
        .join(format!("uv-{target}")))
}

async fn run_uv(app: &AppHandle, arguments: &[String]) -> Result<ShellOutput, String> {
    #[cfg(debug_assertions)]
    let command = app.shell().command(development_uv_path()?);
    #[cfg(not(debug_assertions))]
    let command = app
        .shell()
        .sidecar("binaries/uv")
        .map_err(|error| format!("Failed to find the bundled uv runner: {error}"))?;

    command
        .args(arguments)
        .output()
        .await
        .map_err(|error| format!("Failed to run the bundled uv runner: {error}"))
}

async fn find_uv_python(app: &AppHandle, version: &str) -> Result<Option<String>, String> {
    let output = run_uv(
        app,
        &[
            "python".to_owned(),
            "find".to_owned(),
            "--managed-python".to_owned(),
            "--no-project".to_owned(),
            "--no-python-downloads".to_owned(),
            version.to_owned(),
        ],
    )
    .await?;

    if !output.status.success() {
        return Ok(None);
    }

    let path = String::from_utf8_lossy(&output.stdout).trim().to_owned();

    Ok((!path.is_empty()).then_some(path))
}

#[tauri::command]
async fn list_python_runners(app: AppHandle) -> Result<Vec<PythonRunner>, String> {
    let configuration = read_runner_configuration(&app)?;
    let mut runners = Vec::with_capacity(SUPPORTED_PYTHON_VERSIONS.len());

    for version in SUPPORTED_PYTHON_VERSIONS {
        let path = find_uv_python(&app, version).await?;
        runners.push(PythonRunner {
            version: version.to_owned(),
            installed: path.is_some(),
            path,
            active: configuration.python_version.as_deref() == Some(version),
        });
    }

    Ok(runners)
}

#[tauri::command]
async fn install_python_runner(app: AppHandle, version: String) -> Result<PythonRunner, String> {
    if !SUPPORTED_PYTHON_VERSIONS.contains(&version.as_str()) {
        return Err("Unsupported Python version.".to_owned());
    }

    let output = run_uv(
        &app,
        &["python".to_owned(), "install".to_owned(), version.clone()],
    )
    .await?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr).trim().to_owned();
        return Err(if error.is_empty() {
            "uv could not install the requested Python version.".to_owned()
        } else {
            error
        });
    }

    let path = find_uv_python(&app, &version)
        .await?
        .ok_or_else(|| "uv installed Python but its executable could not be located.".to_owned())?;
    let configuration = RunnerConfiguration {
        python_version: Some(version.clone()),
    };
    write_runner_configuration(&app, &configuration)?;

    Ok(PythonRunner {
        version,
        path: Some(path),
        installed: true,
        active: true,
    })
}

#[tauri::command]
async fn select_python_runner(app: AppHandle, version: Option<String>) -> Result<(), String> {
    if let Some(version) = &version {
        if !SUPPORTED_PYTHON_VERSIONS.contains(&version.as_str()) {
            return Err("Unsupported Python version.".to_owned());
        }

        if find_uv_python(&app, version).await?.is_none() {
            return Err("Install this Python version before selecting it.".to_owned());
        }
    }

    write_runner_configuration(
        &app,
        &RunnerConfiguration {
            python_version: version,
        },
    )
}

async fn resolve_python_executable(app: &AppHandle) -> Result<String, String> {
    let configuration = read_runner_configuration(app)?;

    match configuration.python_version {
        Some(version) => find_uv_python(app, &version)
            .await?
            .ok_or_else(|| format!("The active Python {version} runner is no longer installed.")),
        None => Ok("python3".to_owned()),
    }
}

fn detect_runner_version(python_executable: &str) -> Result<String, String> {
    let output = Command::new(python_executable)
        .arg("--version")
        .output()
        .map_err(|error| format!("Failed to inspect Python version: {error}"))?;

    if !output.status.success() {
        return Err("Failed to inspect Python version.".to_owned());
    }

    let version = String::from_utf8_lossy(&output.stdout).trim().to_owned();
    let version = if version.is_empty() {
        String::from_utf8_lossy(&output.stderr).trim().to_owned()
    } else {
        version
    };

    if version.is_empty() {
        return Err("Python did not report its version.".to_owned());
    }

    Ok(version)
}

fn automation_environment_path(app: &AppHandle, automation_id: &str) -> Result<PathBuf, String> {
    if automation_id.is_empty()
        || !automation_id
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || character == '-')
    {
        return Err("Invalid automation identifier.".to_owned());
    }

    Ok(app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("automation-environments")
        .join(automation_id))
}

#[tauri::command]
fn delete_automation_environment(app: AppHandle, automation_id: String) -> Result<(), String> {
    let environment_path = automation_environment_path(&app, &automation_id)?;

    match fs::remove_dir_all(environment_path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(format!("Failed to remove automation environment: {error}")),
    }
}

fn environment_python_path(environment_path: &Path) -> PathBuf {
    if cfg!(windows) {
        environment_path.join("Scripts").join("python.exe")
    } else {
        environment_path.join("bin").join("python")
    }
}

fn runner_metadata_path(environment_path: &Path) -> PathBuf {
    environment_path.join(".evalabs-runner")
}

fn environment_uses_runner(
    environment_path: &Path,
    environment_python: &Path,
    runner_executable: &str,
    runner_version: &str,
) -> bool {
    let expected_metadata = format!("{runner_executable}\n{runner_version}");
    let metadata_matches = fs::read_to_string(runner_metadata_path(environment_path))
        .map(|metadata| metadata == expected_metadata)
        .unwrap_or(false);

    metadata_matches
        && detect_runner_version(&environment_python.to_string_lossy())
            .map(|environment_version| environment_version == runner_version)
            .unwrap_or(false)
}

fn library_requirement(library: &AutomationLibrary) -> Result<String, String> {
    let name = library.name.trim();
    let version = library.version.trim();

    if name.is_empty()
        || !name.chars().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.')
        })
    {
        return Err(format!("Invalid library name: \"{}\".", library.name));
    }

    if version.eq_ignore_ascii_case("latest") {
        return Ok(name.to_owned());
    }

    if version.is_empty()
        || version.chars().any(char::is_whitespace)
        || version.starts_with(['=', '>', '<', '!', '~'])
    {
        return Err(format!("Invalid version for library \"{name}\"."));
    }

    Ok(format!("{name}=={version}"))
}

fn prepare_automation_environment(
    app: &AppHandle,
    automation_id: &str,
    runner_executable: &str,
    runner_version: &str,
    libraries: &[AutomationLibrary],
) -> Result<String, String> {
    let environment_path = automation_environment_path(app, automation_id)?;
    let environment_python = environment_python_path(&environment_path);
    let environment_python_string = environment_python.to_string_lossy().into_owned();

    if environment_path.exists()
        && !environment_uses_runner(
            &environment_path,
            &environment_python,
            runner_executable,
            runner_version,
        )
    {
        fs::remove_dir_all(&environment_path)
            .map_err(|error| format!("Failed to reset automation environment: {error}"))?;
    }

    if !environment_python.exists() {
        let environments_path = environment_path
            .parent()
            .ok_or_else(|| "Failed to locate automation environments directory.".to_owned())?;
        fs::create_dir_all(environments_path)
            .map_err(|error| format!("Failed to prepare automation environment: {error}"))?;

        let output = tauri::async_runtime::block_on(run_uv(
            app,
            &[
                "venv".to_owned(),
                "--python".to_owned(),
                runner_executable.to_owned(),
                environment_path.to_string_lossy().into_owned(),
            ],
        ))?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr).trim().to_owned();
            return Err(if error.is_empty() {
                "Failed to create the automation environment.".to_owned()
            } else {
                format!("Failed to create the automation environment: {error}")
            });
        }

        fs::write(
            runner_metadata_path(&environment_path),
            format!("{runner_executable}\n{runner_version}"),
        )
        .map_err(|error| format!("Failed to record automation runner: {error}"))?;
    }

    let mut requirements = libraries
        .iter()
        .map(library_requirement)
        .collect::<Result<Vec<_>, _>>()?;
    requirements.sort_unstable();
    requirements.dedup();

    let requirements_input_path = environment_path.join("requirements.in");
    let requirements_path = environment_path.join("requirements.txt");
    fs::write(&requirements_input_path, requirements.join("\n"))
        .map_err(|error| format!("Failed to write automation requirements: {error}"))?;

    let output = tauri::async_runtime::block_on(run_uv(
        app,
        &[
            "pip".to_owned(),
            "compile".to_owned(),
            "--python".to_owned(),
            environment_python_string.clone(),
            "--output-file".to_owned(),
            requirements_path.to_string_lossy().into_owned(),
            requirements_input_path.to_string_lossy().into_owned(),
        ],
    ))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr).trim().to_owned();
        return Err(if error.is_empty() {
            "Failed to resolve automation libraries.".to_owned()
        } else {
            format!("Failed to resolve automation libraries: {error}")
        });
    }

    let output = tauri::async_runtime::block_on(run_uv(
        app,
        &[
            "pip".to_owned(),
            "sync".to_owned(),
            "--python".to_owned(),
            environment_python_string.clone(),
            requirements_path.to_string_lossy().into_owned(),
        ],
    ))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr).trim().to_owned();
        return Err(if error.is_empty() {
            "Failed to install automation libraries.".to_owned()
        } else {
            format!("Failed to install automation libraries: {error}")
        });
    }

    Ok(environment_python_string)
}

fn execute_python_script(
    python_executable: String,
    inline_script: Option<String>,
    script_path: Option<PathBuf>,
    inputs: Value,
) -> Result<PythonExecution, String> {
    let inputs = serde_json::to_string(&inputs).map_err(|error| error.to_string())?;
    let run_directory = TemporaryRunDirectory::create()?;
    let runner_path = run_directory.path.join("main.py");
    let outputs_path = run_directory.path.join("outputs.json");

    let automation_path = match inline_script {
        Some(script) => {
            let automation_path = run_directory.path.join("automation.py");
            fs::write(&automation_path, script)
                .map_err(|error| format!("Failed to write automation script: {error}"))?;
            automation_path
        }
        None => script_path.ok_or_else(|| "A Python script path is required.".to_owned())?,
    };

    fs::write(&runner_path, PYTHON_RUNNER)
        .map_err(|error| format!("Failed to prepare Python runner: {error}"))?;

    let output = Command::new(python_executable)
        .arg(&runner_path)
        .current_dir(&run_directory.path)
        .env("EVA_INPUTS", inputs)
        .env("EVA_AUTOMATION_PATH", automation_path)
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
        .join("evalabs.db");
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

async fn update_run_status(
    database: &SqlitePool,
    run_id: &str,
    status: &str,
) -> Result<(), String> {
    sqlx::query("UPDATE runs SET status = ? WHERE id = ?")
        .bind(status)
        .bind(run_id)
        .execute(database)
        .await
        .map_err(|error| format!("Failed to update run status: {error}"))?;

    Ok(())
}

#[tauri::command]
async fn start_automation_run(
    app: AppHandle,
    automation_id: String,
    script: String,
    script_source: String,
    script_path: Option<String>,
    libraries: Vec<AutomationLibrary>,
    outputs: Vec<AutomationOutput>,
    inputs: Value,
) -> Result<StartedRun, String> {
    let (inline_script, script_path, script_contents) = match script_source.as_str() {
        "inline" => (Some(script.clone()), None, script),
        "file" => {
            let path = script_path.ok_or_else(|| "A Python script path is required.".to_owned())?;
            let path = fs::canonicalize(path)
                .map_err(|error| format!("Failed to access Python script: {error}"))?;
            let contents = fs::read_to_string(&path)
                .map_err(|error| format!("Failed to read Python script: {error}"))?;

            (None, Some(path), contents)
        }
        _ => return Err("Unsupported script source.".to_owned()),
    };

    if uses_interactive_input(&script_contents) {
        return Err("input() is not supported. Define an automation input instead.".to_owned());
    }

    let python_executable = resolve_python_executable(&app).await?;
    let runner_version = detect_runner_version(&python_executable)?;

    let run_id = generate_run_id()?;
    let inputs_json = serde_json::to_string(&inputs).map_err(|error| error.to_string())?;
    let database = open_database(&app).await?;

    sqlx::query(
        "INSERT INTO runs (id, automation_id, status, inputs_json, runner_version, started_at) VALUES (?, ?, 'preparing', ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
    )
    .bind(&run_id)
    .bind(&automation_id)
    .bind(inputs_json)
    .bind(&runner_version)
    .execute(&database)
    .await
    .map_err(|error| format!("Failed to create run: {error}"))?;

    let event = RunUpdatedEvent {
        automation_id: automation_id.clone(),
        run_id: run_id.clone(),
    };
    app.emit("run:updated", &event)
        .map_err(|error| error.to_string())?;

    let environment_app = app.clone();
    let environment_automation_id = automation_id.clone();

    tauri::async_runtime::spawn(async move {
        let execution = match tauri::async_runtime::spawn_blocking(move || {
            prepare_automation_environment(
                &environment_app,
                &environment_automation_id,
                &python_executable,
                &runner_version,
                &libraries,
            )
        })
        .await
        {
            Ok(Ok(environment_python)) => {
                if let Err(error) = update_run_status(&database, &run_id, "running").await {
                    PythonExecution {
                        success: false,
                        outputs: Value::Object(serde_json::Map::new()),
                        logs: String::new(),
                        error,
                    }
                } else {
                    let _ = app.emit(
                        "run:updated",
                        RunUpdatedEvent {
                            automation_id: automation_id.clone(),
                            run_id: run_id.clone(),
                        },
                    );

                    match tauri::async_runtime::spawn_blocking(move || {
                        execute_python_script(
                            environment_python,
                            inline_script,
                            script_path,
                            inputs,
                        )
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
                    }
                }
            }
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
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(database::DATABASE_URL, database::migrations())
                .build(),
        )
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .ok_or("Failed to find the main window.")?;

            if let Some(monitor) = window.primary_monitor()? {
                let work_area = monitor.work_area();
                let height = (work_area.size.height as f64 * 0.9).round() as u32;
                let width = (work_area.size.width as f64 * 0.7).round() as u32;
                let x = work_area.position.x + (work_area.size.width as i32 - width as i32) / 2;
                let y = work_area.position.y + (work_area.size.height as i32 - height as i32) / 2;

                window.set_size(PhysicalSize::new(width, height))?;
                window.set_position(PhysicalPosition::new(x, y))?;
            }

            window.show()?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            detect_python_interpreter,
            list_python_runners,
            install_python_runner,
            select_python_runner,
            delete_automation_environment,
            start_automation_run
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
