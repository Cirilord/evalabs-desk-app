import Database from '@tauri-apps/plugin-sql';

import type {
  $AutomationPayload,
  AutomationCreateArgs,
  AutomationFindUniqueArgs,
  AutomationFindUniqueOrThrowArgs,
} from '@/data/sqlite/types';

const DATABASE_URL = 'sqlite:eva.db';

const automationColumns = `
  id,
  name,
  description,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

class SQLiteClient {
  private db: Promise<Database>;

  public constructor() {
    this.db = Database.load(DATABASE_URL);
  }

  public get automation() {
    return {
      create: async (args: AutomationCreateArgs) => {
        const { data } = args;
        const name = data.name.trim();

        if (!name) {
          throw new Error('Automation name is required.');
        }

        const database = await this.db;
        const id = crypto.randomUUID();

        await database.execute(
          `
            INSERT INTO automations (id, name, description, created_at, updated_at)
            VALUES (
              $1,
              $2,
              $3,
              strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
              strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
            )
          `,
          [id, name, data.description.trim()]
        );

        return this.automation.findUniqueOrThrow({ where: { id } });
      },

      findMany: async () => {
        const database = await this.db;

        return database.select<$AutomationPayload[]>(`
          SELECT ${automationColumns}
          FROM automations
          ORDER BY updated_at DESC, name COLLATE NOCASE ASC
        `);
      },

      findUnique: async (args: AutomationFindUniqueArgs) => {
        const { where } = args;
        const database = await this.db;
        const records = await database.select<$AutomationPayload[]>(
          `
            SELECT ${automationColumns}
            FROM automations
            WHERE id = $1
          `,
          [where.id]
        );

        return records[0] ?? null;
      },

      findUniqueOrThrow: async (args: AutomationFindUniqueOrThrowArgs) => {
        const automation = await this.automation.findUnique(args);

        if (!automation) {
          throw new Error(`Automation "${args.where.id}" was not found.`);
        }

        return automation;
      },
    };
  }
}

const sqlite = new SQLiteClient();

export default sqlite;
