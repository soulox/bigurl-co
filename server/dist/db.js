import Database from 'better-sqlite3';
export class DataStore {
    db;
    constructor(filePath) {
        this.db = new Database(filePath);
        this.db.pragma('journal_mode = WAL');
        this.ensureSchema();
    }
    ensureSchema() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS links (
        id TEXT PRIMARY KEY,
        short_code TEXT UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        created_at INTEGER NOT NULL,
        expires_at INTEGER,
        max_clicks INTEGER,
        click_count INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1
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
    `);
    }
    insertLink(row) {
        const stmt = this.db.prepare('INSERT INTO links (id, short_code, original_url, title, description, created_at, expires_at, max_clicks, is_active) VALUES (@id, @short_code, @original_url, @title, @description, @created_at, @expires_at, @max_clicks, @is_active)');
        stmt.run(row);
    }
    getLinkByCode(code) {
        const stmt = this.db.prepare('SELECT * FROM links WHERE short_code = ? AND is_active = 1');
        return stmt.get(code);
    }
    getOriginalUrlByCode(code) {
        const stmt = this.db.prepare('SELECT original_url, expires_at, max_clicks, click_count FROM links WHERE short_code = ? AND is_active = 1');
        const row = stmt.get(code);
        if (!row)
            return undefined;
        // Check expiration
        if (row.expires_at && row.expires_at < Date.now())
            return undefined;
        // Check max clicks
        if (row.max_clicks && row.click_count && row.click_count >= row.max_clicks)
            return undefined;
        return row.original_url;
    }
    codeExists(code) {
        const stmt = this.db.prepare('SELECT 1 FROM links WHERE short_code = ?');
        return Boolean(stmt.get(code));
    }
    incrementClickCount(code) {
        const stmt = this.db.prepare('UPDATE links SET click_count = COALESCE(click_count, 0) + 1 WHERE short_code = ?');
        stmt.run(code);
    }
    insertClick(row) {
        const stmt = this.db.prepare('INSERT INTO clicks (id, link_id, clicked_at, ip_address, country, city, referrer, user_agent, device_type, browser, os) VALUES (@id, @link_id, @clicked_at, @ip_address, @country, @city, @referrer, @user_agent, @device_type, @browser, @os)');
        stmt.run(row);
    }
    getAllLinks(limit = 100) {
        const stmt = this.db.prepare('SELECT id, short_code, original_url, title, description, created_at, expires_at, max_clicks, click_count, is_active FROM links ORDER BY created_at DESC LIMIT ?');
        return stmt.all(limit);
    }
    getLinkById(id) {
        const stmt = this.db.prepare('SELECT * FROM links WHERE id = ?');
        return stmt.get(id);
    }
    updateLink(id, updates) {
        const fields = [];
        const values = [];
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
        if (fields.length === 0)
            return;
        values.push(id);
        const stmt = this.db.prepare(`UPDATE links SET ${fields.join(', ')} WHERE id = ?`);
        stmt.run(...values);
    }
    deleteLink(id) {
        const stmtClicks = this.db.prepare('DELETE FROM clicks WHERE link_id = ?');
        const stmtLink = this.db.prepare('DELETE FROM links WHERE id = ?');
        stmtClicks.run(id);
        stmtLink.run(id);
    }
    bulkDeleteLinks(ids) {
        const placeholders = ids.map(() => '?').join(',');
        const stmtClicks = this.db.prepare(`DELETE FROM clicks WHERE link_id IN (${placeholders})`);
        const stmtLinks = this.db.prepare(`DELETE FROM links WHERE id IN (${placeholders})`);
        stmtClicks.run(...ids);
        stmtLinks.run(...ids);
    }
    bulkUpdateLinks(ids, updates) {
        if (updates.is_active !== undefined) {
            const placeholders = ids.map(() => '?').join(',');
            const stmt = this.db.prepare(`UPDATE links SET is_active = ? WHERE id IN (${placeholders})`);
            stmt.run(updates.is_active, ...ids);
        }
    }
    getAnalytics(code) {
        // Get link info
        const linkStmt = this.db.prepare('SELECT id, short_code, original_url, created_at, click_count FROM links WHERE short_code = ?');
        const link = linkStmt.get(code);
        if (!link)
            return null;
        // Get click details
        const clicksStmt = this.db.prepare('SELECT clicked_at, country, city, referrer, device_type, browser, os FROM clicks WHERE link_id = ? ORDER BY clicked_at DESC LIMIT 1000');
        const clicks = clicksStmt.all(link.id);
        // Aggregate data
        const countries = {};
        const referrers = {};
        const devices = {};
        const browsers = {};
        const osTypes = {};
        const clicksByDay = {};
        clicks.forEach((click) => {
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
                shortCode: link.short_code,
                originalUrl: link.original_url,
                createdAt: link.created_at,
                totalClicks: link.click_count || 0
            },
            stats: {
                countries: Object.entries(countries).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
                referrers: Object.entries(referrers).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
                devices: Object.entries(devices).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
                browsers: Object.entries(browsers).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
                osTypes: Object.entries(osTypes).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
                clicksByDay: Object.entries(clicksByDay).map(([date, count]) => ({ date, count })).sort((a, b) => a.localeCompare(b))
            },
            recentClicks: clicks.slice(0, 50)
        };
    }
    getShortCodeById(id) {
        const stmt = this.db.prepare('SELECT short_code FROM links WHERE id = ?');
        const row = stmt.get(id);
        return row?.short_code;
    }
    getShortCodesByIds(ids) {
        const placeholders = ids.map(() => '?').join(',');
        const stmt = this.db.prepare(`SELECT short_code FROM links WHERE id IN (${placeholders})`);
        const rows = stmt.all(...ids);
        return rows.map(r => r.short_code);
    }
}
