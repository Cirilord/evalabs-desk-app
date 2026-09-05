mod database;

use serde::Serialize;
use serde_json::Value;
use std::process::Command;

#[derive(Serialize)]
struct PythonInterpreter {
    name: String,
    path: String,
    version: String,
}

#[derive(Serialize)]
struct PythonExecution {
    success: bool,
    output: String,
    error: String,
}

#[tauri::command]
fn detect_python_interpreter() -> Result<Option<PythonInterpreter>, String> {
    let output = match Command::new("python3")
        .args(["-c", "import sys; print(sys.executable); print(sys.version.split()[0])"])
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
        let script = format!(
            "import json\nimport os\n\ninputs = json.loads(os.environ['EVA_INPUTS'])\n\n{script}"
        );
        let output = Command::new("python3")
            .arg("-c")
            .arg(script)
            .env("EVA_INPUTS", inputs)
            .output()
            .map_err(|error| format!("Failed to start Python: {error}"))?;

        Ok(PythonExecution {
            success: output.status.success(),
            output: String::from_utf8_lossy(&output.stdout).trim().to_owned(),
            error: String::from_utf8_lossy(&output.stderr).trim().to_owned(),
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
