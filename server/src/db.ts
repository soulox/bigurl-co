import Database from 'better-sqlite3';

export type UserRow = {
  id: string;
  email: string;
  password_hash?: string | null;
  google_id?: string | null;
  name?: string | null;
  created_at: number;
  email_verified: number;
  package: 'free' | 'basic' | 'pro';
  link_limit: number;
  link_count: number;
};

export type LinkRow = {
  id: string;
  user_id: string;
  short_code: string;
  original_url: string;
  title?: string | null;
  description?: string | null;
  created_at: number;
  expires_at?: number | null;
  max_clicks?: number | null;
  click_count?: number;
  is_active: number;
};

export type ClickRow = {
  id: string;
  link_id: string;
  clicked_at: number;
  ip_address?: string;
  country?: string;
  city?: string;
  referrer?: string;
  user_agent?: string;
  device_type?: string;
  browser?: string;
  os?: string;
};

export type TransactionRow = {
  id: string;
  user_id: string;
  package: 'basic' | 'pro';
  amount: number;
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: number;
};

export class DataStore {
  private db: Database.Database;

  constructor(filePath: string) {
    this.db = new Database(filePath);
    this.db.pragma('journal_mode = WAL');
    this.ensureSchema();
  }

  private ensureSchema(): void {
    // Create tables if they don't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        google_id TEXT UNIQUE,
        name TEXT,
        created_at INTEGER NOT NULL,
        email_verified INTEGER DEFAULT 0,
        package TEXT DEFAULT 'free' CHECK(package IN ('free', 'basic', 'pro')),
        link_limit INTEGER DEFAULT 5,
        link_count INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_google_id ON users(google_id);

      CREATE TABLE IF NOT EXISTS links (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        short_code TEXT UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        created_at INTEGER NOT NULL,
        expires_at INTEGER,
        max_clicks INTEGER,
        click_count INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_short_code ON links(short_code);
      CREATE INDEX IF NOT EXISTS idx_created_at ON links(created_at);

      CREATE TABLE IF NOT EXISTS clicks (
        id TEXT PRIMARY KEY,
        link_id TEXT NOT NULL,
        clicked_at INTEGER NOT NULL,
        ip_address TEXT,
        country TEXT,
        city TEXT,
        referrer TEXT,
        user_agent TEXT,
        device_type TEXT,
        browser TEXT,
        os TEXT,
        FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_link_id ON clicks(link_id);
      CREATE INDEX IF NOT EXISTS idx_clicked_at ON clicks(clicked_at);

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        package TEXT NOT NULL CHECK(package IN ('basic', 'pro')),
        amount REAL NOT NULL,
        transaction_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_transaction_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transaction_created_at ON transactions(created_at);
    `);

    // Migrate existing tables to add new columns if they don't exist
    // IMPORTANT: Migrate users first, then links (links depend on users)
    this.migrateUsersTable();
    this.migrateLinksTable();
  }

  private migrateLinksTable(): void {
    try {
      // Get existing columns
      const columns = this.db.prepare("PRAGMA table_info(links)").all() as Array<{ name: string }>;
      const columnNames = columns.map(col => col.name);

      // Add missing columns
      const columnsToAdd = [
        { name: 'user_id', type: 'TEXT' },
        { name: 'title', type: 'TEXT' },
        { name: 'description', type: 'TEXT' },
        { name: 'expires_at', type: 'INTEGER' },
        { name: 'max_clicks', type: 'INTEGER' },
        { name: 'click_count', type: 'INTEGER DEFAULT 0' }
      ];

      for (const col of columnsToAdd) {
        if (!columnNames.includes(col.name)) {
          console.log(`Adding column ${col.name} to links table...`);
          try {
            this.db.exec(`ALTER TABLE links ADD COLUMN ${col.name} ${col.type}`);
          } catch (error) {
            console.error(`Failed to add column ${col.name}:`, error);
          }
        }
      }

      // Update click_count to 0 for existing rows where it's NULL
      try {
        this.db.exec(`UPDATE links SET click_count = 0 WHERE click_count IS NULL`);
      } catch (error) {
        console.error('Failed to update click_count:', error);
      }
      
      // Create a default "anonymous" user for existing links without user_id
      try {
        const hasUserIdNull = this.db.prepare(`SELECT COUNT(*) as count FROM links WHERE user_id IS NULL`).get() as { count: number };
        if (hasUserIdNull.count > 0) {
          console.log(`Found ${hasUserIdNull.count} links without user_id, creating anonymous user...`);
          const anonymousUserId = 'anonymous-user';
          const existingAnonymous = this.db.prepare('SELECT id FROM users WHERE id = ?').get(anonymousUserId);
          if (!existingAnonymous) {
            this.db.prepare(`
              INSERT INTO users (id, email, name, created_at, email_verified, package, link_limit, link_count)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(anonymousUserId, 'anonymous@bigurl.co', 'Anonymous User', Date.now(), 1, 'pro', 999999, 0);
            console.log('Created anonymous user');
          }
          this.db.exec(`UPDATE links SET user_id = '${anonymousUserId}' WHERE user_id IS NULL`);
          console.log(`Updated ${hasUserIdNull.count} links to anonymous user`);
        }
      } catch (error) {
        console.error('Failed to create anonymous user:', error);
      }

      // Now create the user_id index (after the column exists)
      try {
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_user_id ON links(user_id)');
        console.log('Created user_id index');
      } catch (error) {
        console.error('Failed to create user_id index:', error);
      }
    } catch (error) {
      console.error('Error in migrateLinksTable:', error);
      throw error;
    }
  }

  private migrateUsersTable(): void {
    // Check if users table exists
    const tableInfo = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (!tableInfo) return;

    const columns = this.db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
    const columnNames = columns.map(col => col.name);

    const columnsToAdd = [
      { name: 'package', type: "TEXT DEFAULT 'free'" },
      { name: 'link_limit', type: 'INTEGER DEFAULT 5' },
      { name: 'link_count', type: 'INTEGER DEFAULT 0' }
    ];

    for (const col of columnsToAdd) {
      if (!columnNames.includes(col.name)) {
        console.log(`Adding column ${col.name} to users table...`);
        this.db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
      }
    }
  }

  insertLink(row: LinkRow): void {
    const stmt = this.db.prepare(
      'INSERT INTO links (id, user_id, short_code, original_url, title, description, created_at, expires_at, max_clicks, is_active) VALUES (@id, @user_id, @short_code, @original_url, @title, @description, @created_at, @expires_at, @max_clicks, @is_active)'
    );
    stmt.run(row);
    
    // Update user's link count
    this.db.prepare('UPDATE users SET link_count = link_count + 1 WHERE id = ?').run(row.user_id);
  }

  getLinkByCode(code: string): any {
    const stmt = this.db.prepare(
      'SELECT * FROM links WHERE short_code = ? AND is_active = 1'
    );
    return stmt.get(code);
  }

  getOriginalUrlByCode(code: string): string | undefined {
    const stmt = this.db.prepare(
      'SELECT original_url, expires_at, max_clicks, COALESCE(click_count, 0) as click_count FROM links WHERE short_code = ? AND is_active = 1'
    );
    const row = stmt.get(code) as { original_url?: string; expires_at?: number | null; max_clicks?: number | null; click_count: number } | undefined;
    
    if (!row) return undefined;
    
    // Check expiration (null/undefined means no expiration)
    if (row.expires_at && row.expires_at > 0 && row.expires_at < Date.now()) return undefined;
    
    // Check max clicks (null/undefined means no limit)
    if (row.max_clicks && row.max_clicks > 0 && row.click_count >= row.max_clicks) return undefined;
    
    return row.original_url;
  }

  codeExists(code: string): boolean {
    const stmt = this.db.prepare('SELECT 1 FROM links WHERE short_code = ?');
    return Boolean(stmt.get(code));
  }

  incrementClickCount(code: string): void {
    const stmt = this.db.prepare(
      'UPDATE links SET click_count = COALESCE(click_count, 0) + 1 WHERE short_code = ?'
    );
    stmt.run(code);
  }

  insertClick(row: ClickRow): void {
    const stmt = this.db.prepare(
      'INSERT INTO clicks (id, link_id, clicked_at, ip_address, country, city, referrer, user_agent, device_type, browser, os) VALUES (@id, @link_id, @clicked_at, @ip_address, @country, @city, @referrer, @user_agent, @device_type, @browser, @os)'
    );
    stmt.run(row);
  }

  getAllLinks(userId?: string, limit = 100): any[] {
    try {
      // Check if user_id column exists
      const columns = this.db.prepare("PRAGMA table_info(links)").all() as Array<{ name: string }>;
      const hasUserId = columns.some(col => col.name === 'user_id');

      if (!hasUserId) {
        // Fallback for old schema without user_id
        const stmt = this.db.prepare(
          'SELECT id, short_code, original_url, title, description, created_at, expires_at, max_clicks, click_count, is_active FROM links ORDER BY created_at DESC LIMIT ?'
        );
        return stmt.all(limit);
      }

      if (userId) {
        const stmt = this.db.prepare(
          'SELECT id, user_id, short_code, original_url, title, description, created_at, expires_at, max_clicks, click_count, is_active FROM links WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
        );
        return stmt.all(userId, limit);
      } else {
        // For backward compatibility (admin view or migration)
        const stmt = this.db.prepare(
          'SELECT id, user_id, short_code, original_url, title, description, created_at, expires_at, max_clicks, click_count, is_active FROM links ORDER BY created_at DESC LIMIT ?'
        );
        return stmt.all(limit);
      }
    } catch (error) {
      console.error('Error in getAllLinks:', error);
      // Fallback to basic query
      const stmt = this.db.prepare(
        'SELECT id, short_code, original_url, created_at, is_active FROM links ORDER BY created_at DESC LIMIT ?'
      );
      return stmt.all(limit);
    }
  }

  getLinkById(id: string): any {
    const stmt = this.db.prepare('SELECT * FROM links WHERE id = ?');
    return stmt.get(id);
  }

  updateLink(id: string, updates: Partial<LinkRow>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.original_url !== undefined) {
      fields.push('original_url = ?');
      values.push(updates.original_url);
    }
    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.expires_at !== undefined) {
      fields.push('expires_at = ?');
      values.push(updates.expires_at);
    }
    if (updates.max_clicks !== undefined) {
      fields.push('max_clicks = ?');
      values.push(updates.max_clicks);
    }
    if (updates.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.is_active);
    }

    if (fields.length === 0) return;

    values.push(id);
    const stmt = this.db.prepare(`UPDATE links SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  deleteLink(id: string): void {
    // Get user_id before deleting
    const link = this.getLinkById(id) as { user_id?: string } | undefined;
    
    const stmtClicks = this.db.prepare('DELETE FROM clicks WHERE link_id = ?');
    const stmtLink = this.db.prepare('DELETE FROM links WHERE id = ?');
    
    stmtClicks.run(id);
    stmtLink.run(id);
    
    // Update user's link count if link existed and has user_id
    if (link?.user_id) {
      try {
        const count = this.getUserLinkCount(link.user_id);
        this.db.prepare('UPDATE users SET link_count = ? WHERE id = ?').run(count, link.user_id);
      } catch {
        // Ignore if users table doesn't exist yet
      }
    }
  }

  bulkDeleteLinks(ids: string[]): void {
    const placeholders = ids.map(() => '?').join(',');
    
    // Try to get user IDs before deleting (for updating counts)
    let userIds: { user_id: string }[] = [];
    try {
      userIds = this.db.prepare(`SELECT DISTINCT user_id FROM links WHERE id IN (${placeholders})`).all(...ids) as { user_id: string }[];
    } catch {
      // user_id column might not exist yet (during migration)
    }
    
    const stmtClicks = this.db.prepare(`DELETE FROM clicks WHERE link_id IN (${placeholders})`);
    const stmtLinks = this.db.prepare(`DELETE FROM links WHERE id IN (${placeholders})`);
    
    stmtClicks.run(...ids);
    stmtLinks.run(...ids);
    
    // Update link counts for affected users (if we have user_ids)
    if (userIds.length > 0) {
      userIds.forEach(({ user_id }) => {
        try {
          const count = this.getUserLinkCount(user_id);
          this.db.prepare('UPDATE users SET link_count = ? WHERE id = ?').run(count, user_id);
        } catch {
          // Ignore if users table doesn't exist yet
        }
      });
    }
  }

  bulkUpdateLinks(ids: string[], updates: { is_active?: number }): void {
    if (updates.is_active !== undefined) {
      const placeholders = ids.map(() => '?').join(',');
      const stmt = this.db.prepare(`UPDATE links SET is_active = ? WHERE id IN (${placeholders})`);
      stmt.run(updates.is_active, ...ids);
    }
  }

  getAnalytics(code: string): any {
    // Get link info
    const linkStmt = this.db.prepare(
      'SELECT id, short_code, original_url, created_at, click_count FROM links WHERE short_code = ?'
    );
    const link = linkStmt.get(code);
    
    if (!link) return null;

    // Get click details
    const clicksStmt = this.db.prepare(
      'SELECT clicked_at, country, city, referrer, device_type, browser, os FROM clicks WHERE link_id = ? ORDER BY clicked_at DESC LIMIT 1000'
    );
    const clicks = clicksStmt.all((link as any).id);

    // Aggregate data
    const countries: Record<string, number> = {};
    const referrers: Record<string, number> = {};
    const devices: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const osTypes: Record<string, number> = {};
    const clicksByDay: Record<string, number> = {};

    clicks.forEach((click: any) => {
      countries[click.country || 'Unknown'] = (countries[click.country || 'Unknown'] || 0) + 1;
      referrers[click.referrer || 'Direct'] = (referrers[click.referrer || 'Direct'] || 0) + 1;
      devices[click.device_type || 'Unknown'] = (devices[click.device_type || 'Unknown'] || 0) + 1;
      browsers[click.browser || 'Unknown'] = (browsers[click.browser || 'Unknown'] || 0) + 1;
      osTypes[click.os || 'Unknown'] = (osTypes[click.os || 'Unknown'] || 0) + 1;

      const day = new Date(click.clicked_at).toISOString().split('T')[0];
      clicksByDay[day] = (clicksByDay[day] || 0) + 1;
    });

    return {
      link: {
        shortCode: (link as any).short_code,
        originalUrl: (link as any).original_url,
        createdAt: (link as any).created_at,
        totalClicks: (link as any).click_count || 0
      },
      stats: {
        countries: Object.entries(countries).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        referrers: Object.entries(referrers).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        devices: Object.entries(devices).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        browsers: Object.entries(browsers).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        osTypes: Object.entries(osTypes).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        clicksByDay: Object.entries(clicksByDay).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date))
      },
      recentClicks: clicks.slice(0, 50)
    };
  }

  getShortCodeById(id: string): string | undefined {
    const stmt = this.db.prepare('SELECT short_code FROM links WHERE id = ?');
    const row = stmt.get(id) as { short_code?: string } | undefined;
    return row?.short_code;
  }

  getShortCodesByIds(ids: string[]): string[] {
    const placeholders = ids.map(() => '?').join(',');
    const stmt = this.db.prepare(`SELECT short_code FROM links WHERE id IN (${placeholders})`);
    const rows = stmt.all(...ids) as { short_code: string }[];
    return rows.map(r => r.short_code);
  }

  // User Management Methods
  
  createUser(user: UserRow): void {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, google_id, name, created_at, email_verified, package, link_limit, link_count)
      VALUES (@id, @email, @password_hash, @google_id, @name, @created_at, @email_verified, @package, @link_limit, @link_count)
    `);
    stmt.run(user);
  }

  getUserByEmail(email: string): UserRow | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as UserRow | undefined;
  }

  getUserById(id: string): UserRow | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as UserRow | undefined;
  }

  getUserByGoogleId(googleId: string): UserRow | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE google_id = ?');
    return stmt.get(googleId) as UserRow | undefined;
  }

  updateUser(id: string, updates: Partial<UserRow>): void {
    const allowedFields = ['name', 'password_hash', 'email_verified', 'package', 'link_limit'];
    const fields = Object.keys(updates).filter(k => allowedFields.includes(k));
    
    if (fields.length === 0) return;

    const setClause = fields.map(f => `${f} = @${f}`).join(', ');
    const stmt = this.db.prepare(`UPDATE users SET ${setClause} WHERE id = @id`);
    stmt.run({ ...updates, id });
  }

  updateUserPackage(userId: string, packageType: 'free' | 'basic' | 'pro'): void {
    const limits = { free: 5, basic: 20, pro: 100 };
    const stmt = this.db.prepare('UPDATE users SET package = ?, link_limit = ? WHERE id = ?');
    stmt.run(packageType, limits[packageType], userId);
  }

  getUserLinkCount(userId: string): number {
    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM links WHERE user_id = ? AND is_active = 1');
      const result = stmt.get(userId) as { count: number } | undefined;
      return result?.count || 0;
    } catch {
      // If user_id column doesn't exist yet, return 0
      return 0;
    }
  }

  canUserCreateLink(userId: string): boolean {
    try {
      const user = this.getUserById(userId);
      if (!user) return false;
      const linkCount = this.getUserLinkCount(userId);
      return linkCount < user.link_limit;
    } catch {
      // During migration or if tables don't exist, allow creation
      return true;
    }
  }

  verifyUserEmail(userId: string): void {
    this.db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(userId);
  }

  // Link Ownership Verification
  
  userOwnsLink(userId: string, linkId: string): boolean {
    try {
      const stmt = this.db.prepare('SELECT user_id FROM links WHERE id = ?');
      const link = stmt.get(linkId) as { user_id: string } | undefined;
      return link?.user_id === userId;
    } catch {
      // If user_id column doesn't exist yet, assume ownership (migration scenario)
      return true;
    }
  }

  userOwnsLinks(userId: string, linkIds: string[]): boolean {
    try {
      const placeholders = linkIds.map(() => '?').join(',');
      const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM links WHERE id IN (${placeholders}) AND user_id = ?`);
      const result = stmt.get(...linkIds, userId) as { count: number };
      return result.count === linkIds.length;
    } catch {
      // If user_id column doesn't exist yet, assume ownership (migration scenario)
      return true;
    }
  }

  // Transaction Management

  insertTransaction(transaction: TransactionRow): void {
    const stmt = this.db.prepare(`
      INSERT INTO transactions (id, user_id, package, amount, transaction_id, status, created_at)
      VALUES (@id, @user_id, @package, @amount, @transaction_id, @status, @created_at)
    `);
    stmt.run(transaction);
  }

  getTransactionsByUser(userId: string): TransactionRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC
    `);
    return stmt.all(userId) as TransactionRow[];
  }

  getTransactionById(id: string): TransactionRow | undefined {
    const stmt = this.db.prepare('SELECT * FROM transactions WHERE id = ?');
    return stmt.get(id) as TransactionRow | undefined;
  }
}


