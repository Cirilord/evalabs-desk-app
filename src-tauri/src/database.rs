use tauri_plugin_sql::{Migration, MigrationKind};

pub const DATABASE_URL: &str = "sqlite:eva.db";

pub fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create_automations",
        sql: include_str!("../migrations/0001_create_automations.sql"),
        kind: MigrationKind::Up,
    }]
}
