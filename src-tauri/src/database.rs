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
    ]
}
