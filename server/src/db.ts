import Database from 'better-sqlite3';

export type LinkRow = {
  id: string;
  short_code: string;
  original_url: string;
  created_at: number;
  is_active: number;
};

export class DataStore {
  private db: Database.Database;

  constructor(filePath: string) {
    this.db = new Database(filePath);
    this.db.pragma('journal_mode = WAL');
    this.ensureSchema();
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS links (
        id TEXT PRIMARY KEY,
        short_code TEXT UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        is_active INTEGER DEFAULT 1
      );
      CREATE INDEX IF NOT EXISTS idx_short_code ON links(short_code);
    `);
  }

  insertLink(row: LinkRow): void {
    const stmt = this.db.prepare(
      'INSERT INTO links (id, short_code, original_url, created_at, is_active) VALUES (@id, @short_code, @original_url, @created_at, @is_active)'
    );
    stmt.run(row);
  }

  getOriginalUrlByCode(code: string): string | undefined {
    const stmt = this.db.prepare<{ original_url: string }>(
      'SELECT original_url FROM links WHERE short_code = ? AND is_active = 1'
    );
    const row = stmt.get(code) as { original_url?: string } | undefined;
    return row?.original_url;
  }

  codeExists(code: string): boolean {
    const stmt = this.db.prepare('SELECT 1 FROM links WHERE short_code = ?');
    return Boolean(stmt.get(code));
  }
}


