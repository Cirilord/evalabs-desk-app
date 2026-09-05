import Database from '@tauri-apps/plugin-sql';

import type {
  $AutomationPayload,
  $RunPayload,
  AutomationCreateArgs,
  AutomationDatabaseRecord,
  AutomationDeleteArgs,
  AutomationFindUniqueArgs,
  AutomationFindUniqueOrThrowArgs,
  AutomationInput,
  AutomationOutput,
  AutomationUpdateArgs,
  RunDatabaseRecord,
  RunFindManyArgs,
} from '@/data/sqlite/types';

const DATABASE_URL = 'sqlite:eva.db';

const automationColumns = `
  id,
  name,
  description,
  script,
  script_source AS scriptSource,
  script_path AS scriptPath,
  inputs_json AS inputsJson,
  outputs_json AS outputsJson,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

const runColumns = `
  id,
  automation_id AS automationId,
  status,
  inputs_json AS inputsJson,
  outputs_json AS outputsJson,
  logs,
  error,
  started_at AS startedAt,
  finished_at AS finishedAt
`;

function parseAutomationInputs(inputsJson: string): AutomationInput[] {
  try {
    const inputs: unknown = JSON.parse(inputsJson);

    return Array.isArray(inputs) ? (inputs as AutomationInput[]) : [];
  } catch {
    return [];
  }
}

function parseAutomationOutputs(outputsJson: string): AutomationOutput[] {
  try {
    const outputs: unknown = JSON.parse(outputsJson);

    return Array.isArray(outputs) ? (outputs as AutomationOutput[]) : [];
  } catch {
    return [];
  }
}

function mapAutomation({
  inputsJson,
  outputsJson,
  ...automation
}: AutomationDatabaseRecord): $AutomationPayload {
  return {
    ...automation,
    inputs: parseAutomationInputs(inputsJson),
    outputs: parseAutomationOutputs(outputsJson),
  };
}

function parseRunInputs(inputsJson: string): Record<string, unknown> {
  try {
    const inputs: unknown = JSON.parse(inputsJson);

    return inputs && typeof inputs === 'object' && !Array.isArray(inputs)
      ? (inputs as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function parseRunOutputs(outputsJson: string): Record<string, unknown> {
  return parseRunInputs(outputsJson);
}

function mapRun({ inputsJson, outputsJson, ...run }: RunDatabaseRecord): $RunPayload {
  return {
    ...run,
    inputs: parseRunInputs(inputsJson),
    outputs: parseRunOutputs(outputsJson),
  };
}

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
            INSERT INTO automations (
              id,
              name,
              description,
              script,
              script_source,
              script_path,
              inputs_json,
              outputs_json,
              created_at,
              updated_at
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
              strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
            )
          `,
          [
            id,
            name,
            data.description.trim(),
            data.script.trim(),
            data.scriptSource,
            data.scriptPath,
            JSON.stringify(data.inputs),
            JSON.stringify(data.outputs),
          ]
        );

        return this.automation.findUniqueOrThrow({ where: { id } });
      },

      delete: async (args: AutomationDeleteArgs) => {
        const database = await this.db;

        await database.execute('DELETE FROM runs WHERE automation_id = $1', [args.where.id]);
        await database.execute('DELETE FROM automations WHERE id = $1', [args.where.id]);
      },

      findMany: async () => {
        const database = await this.db;

        const automations = await database.select<AutomationDatabaseRecord[]>(`
          SELECT ${automationColumns}
          FROM automations
          ORDER BY updated_at DESC, name COLLATE NOCASE ASC
        `);

        return automations.map(mapAutomation);
      },

      findUnique: async (args: AutomationFindUniqueArgs) => {
        const { where } = args;
        const database = await this.db;
        const records = await database.select<AutomationDatabaseRecord[]>(
          `
            SELECT ${automationColumns}
            FROM automations
            WHERE id = $1
          `,
          [where.id]
        );

        return records[0] ? mapAutomation(records[0]) : null;
      },

      findUniqueOrThrow: async (args: AutomationFindUniqueOrThrowArgs) => {
        const automation = await this.automation.findUnique(args);

        if (!automation) {
          throw new Error(`Automation "${args.where.id}" was not found.`);
        }

        return automation;
      },

      update: async (args: AutomationUpdateArgs) => {
        const database = await this.db;
        const name = args.data.name.trim();

        if (!name) {
          throw new Error('Automation name is required.');
        }

        await database.execute(
          `
            UPDATE automations
            SET
              name = $1,
              description = $2,
              script = $3,
              script_source = $4,
              script_path = $5,
              inputs_json = $6,
              outputs_json = $7,
              updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
            WHERE id = $8
          `,
          [
            name,
            args.data.description.trim(),
            args.data.script.trim(),
            args.data.scriptSource,
            args.data.scriptPath,
            JSON.stringify(args.data.inputs),
            JSON.stringify(args.data.outputs),
            args.where.id,
          ]
        );

        return this.automation.findUniqueOrThrow({ where: args.where });
      },
    };
  }

  public get run() {
    return {
      findMany: async (args: RunFindManyArgs) => {
        const database = await this.db;
        const runs = await database.select<RunDatabaseRecord[]>(
          `
            SELECT ${runColumns}
            FROM runs
            WHERE automation_id = $1
            ORDER BY started_at DESC
          `,
          [args.where.automationId]
        );

        return runs.map(mapRun);
      },
    };
  }
}

const sqlite = new SQLiteClient();

export default sqlite;
