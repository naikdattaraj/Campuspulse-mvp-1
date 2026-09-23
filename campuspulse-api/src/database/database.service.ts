import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Pool, PoolClient } from "pg";

export type Queryable = {
  query: <T = any>(text: string, params?: any[]) => Promise<{ rows: T[]; rowCount: number }>;
};

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool = new Pool({ connectionString: process.env.DATABASE_URL });

  async query<T = any>(text: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    const res = await this.pool.query(text, params);
    return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
  }

  /** Run several statements atomically. */
  async transaction<T>(fn: (db: Queryable) => Promise<T>): Promise<T> {
    const client: PoolClient = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const out = await fn({
        query: async (text, params = []) => {
          const r = await client.query(text, params);
          return { rows: r.rows, rowCount: r.rowCount ?? 0 } as any;
        },
      });
      await client.query("COMMIT");
      return out;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
