mod database;

use serde::Serialize;
use std::process::Command;

#[derive(Serialize)]
struct PythonInterpreter {
    name: String,
    path: String,
    version: String,
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(database::DATABASE_URL, database::migrations())
                .build(),
        )
        .invoke_handler(tauri::generate_handler![detect_python_interpreter])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
