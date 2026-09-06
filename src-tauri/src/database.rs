use tauri_plugin_sql::{Migration, MigrationKind};

pub const DATABASE_URL: &str = "sqlite:eva.db";

pub fn migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_automations",
            sql: include_str!("../migrations/0001_create_automations.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_automation_script",
            sql: include_str!("../migrations/0002_add_automation_script.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add_automation_inputs",
            sql: include_str!("../migrations/0003_add_automation_inputs.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add_automation_outputs",
            sql: include_str!("../migrations/0004_add_automation_outputs.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "create_runs",
            sql: include_str!("../migrations/0005_create_runs.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "add_run_outputs",
            sql: include_str!("../migrations/0006_add_run_outputs.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "add_automation_script_source",
            sql: include_str!("../migrations/0007_add_automation_script_source.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "add_run_python_version",
            sql: include_str!("../migrations/0008_add_run_python_version.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "rename_run_python_version",
            sql: include_str!("../migrations/0009_rename_run_python_version.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 10,
            description: "add_automation_libraries",
            sql: include_str!("../migrations/0010_add_automation_libraries.sql"),
            kind: MigrationKind::Up,
        },
    ]
}
