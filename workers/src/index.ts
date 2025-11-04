import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { cache } from 'hono/cache';
import { generateUniqueCode } from './services/shortcode';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  ANALYTICS: AnalyticsEngineDataset;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

app.post('/api/shorten', async (c) => {
  const baseUrl = new URL(c.req.url);
  const { 
    url, 
    customSlug, 
    title, 
    description, 
    expiresAt, 
    maxClicks 
  } = await c.req.json<{ 
    url: string; 
    customSlug?: string; 
    title?: string; 
    description?: string; 
    expiresAt?: number; 
    maxClicks?: number; 
  }>();

  try {
    // Simple URL validation
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return c.json({ error: 'Invalid URL protocol' }, 400);
    }
  } catch {
    return c.json({ error: 'Invalid URL' }, 400);
  }

  const shortCode = customSlug && customSlug.trim().length > 0
    ? customSlug.trim()
    : await generateUniqueCode(c.env.DB);

  // Check collision if custom
  if (customSlug) {
    const existing = await c.env.DB
      .prepare('SELECT 1 FROM links WHERE short_code = ?')
      .bind(shortCode)
      .first();
    if (existing) return c.json({ error: 'Slug already in use' }, 409);
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  await c.env.DB
    .prepare(`INSERT INTO links 
      (id, short_code, original_url, title, description, created_at, expires_at, max_clicks, is_active) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`)
    .bind(id, shortCode, url, title || null, description || null, now, expiresAt || null, maxClicks || null)
    .run();

  // Prime KV for fast redirects
  await c.env.KV.put(`short:${shortCode}`, url, { expirationTtl: 3600 });

  const shortUrl = `${baseUrl.origin}/${shortCode}`;
  return c.json({ id, shortCode, shortUrl });
});

app.get('/:code', cache({ cacheName: 'redirects', cacheControl: 'max-age=3600' }), async (c) => {
  const code = c.req.param('code');

  // Check database for link with expiration and max clicks
  const row = await c.env.DB
    .prepare('SELECT original_url, expires_at, max_clicks, click_count FROM links WHERE short_code = ? AND is_active = 1')
    .bind(code)
    .first<{ original_url?: string; expires_at?: number; max_clicks?: number; click_count?: number }>();
  
  if (!row?.original_url) return c.notFound();
  
  // Check expiration
  if (row.expires_at && row.expires_at < Date.now()) {
    return c.json({ error: 'This link has expired' }, 410);
  }
  
  // Check max clicks
  if (row.max_clicks && row.click_count && row.click_count >= row.max_clicks) {
    return c.json({ error: 'This link has reached its maximum click limit' }, 410);
  }
  
  const target = row.original_url;

  // fire-and-forget analytics
  c.executionCtx.waitUntil((async () => {
    try {
      const req = c.req.raw;
      const cf = (req as any).cf as Request['cf'] | undefined;
      const userAgent = req.headers.get('user-agent') || '';
      const referer = req.headers.get('referer') || '';
      
      // Parse user agent for device type, browser, OS
      const deviceType = userAgent.toLowerCase().includes('mobile') ? 'mobile' : 
                         userAgent.toLowerCase().includes('tablet') ? 'tablet' : 'desktop';
      
      let browser = 'Unknown';
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';
      
      let os = 'Unknown';
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
      
      // Get link ID for clicks table
      const linkRow = await c.env.DB
        .prepare('SELECT id FROM links WHERE short_code = ?')
        .bind(code)
        .first<{ id: string }>();
      
      if (linkRow) {
        // Insert detailed click record
        await c.env.DB
          .prepare(`INSERT INTO clicks (id, link_id, clicked_at, ip_address, country, city, referrer, user_agent, device_type, browser, os)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(
            crypto.randomUUID(),
            linkRow.id,
            Date.now(),
            req.headers.get('cf-connecting-ip') || 'Unknown',
            cf?.country || 'Unknown',
            cf?.city || 'Unknown',
            referer,
            userAgent,
            deviceType,
            browser,
            os
          )
          .run();
      }
      
      // Update click count
      await c.env.DB
        .prepare('UPDATE links SET click_count = coalesce(click_count, 0) + 1 WHERE short_code = ?')
        .bind(code)
        .run();
        
      // Write to Analytics Engine
      c.env.ANALYTICS.writeDataPoint({
        blobs: [code, cf?.country || 'Unknown', deviceType, browser, os],
        doubles: [1],
        indexes: [code]
      });
    } catch {}
  })());

  return c.redirect(target, 301);
});

// Analytics endpoint
app.get('/api/analytics/:code', async (c) => {
  const code = c.req.param('code');
  
  // Get link info
  const link = await c.env.DB
    .prepare('SELECT id, short_code, original_url, created_at, click_count FROM links WHERE short_code = ?')
    .bind(code)
    .first<{ id: string; short_code: string; original_url: string; created_at: number; click_count: number }>();
  
  if (!link) return c.notFound();
  
  // Get click details
  const clicks = await c.env.DB
    .prepare('SELECT clicked_at, country, city, referrer, device_type, browser, os FROM clicks WHERE link_id = ? ORDER BY clicked_at DESC LIMIT 1000')
    .bind(link.id)
    .all();
  
  // Aggregate data
  const countries: Record<string, number> = {};
  const referrers: Record<string, number> = {};
  const devices: Record<string, number> = {};
  const browsers: Record<string, number> = {};
  const osTypes: Record<string, number> = {};
  const clicksByDay: Record<string, number> = {};
  
  clicks.results?.forEach((click: any) => {
    // Country stats
    countries[click.country] = (countries[click.country] || 0) + 1;
    
    // Referrer stats
    const ref = click.referrer || 'Direct';
    referrers[ref] = (referrers[ref] || 0) + 1;
    
    // Device stats
    devices[click.device_type] = (devices[click.device_type] || 0) + 1;
    
    // Browser stats
    browsers[click.browser] = (browsers[click.browser] || 0) + 1;
    
    // OS stats
    osTypes[click.os] = (osTypes[click.os] || 0) + 1;
    
    // Clicks by day
    const day = new Date(click.clicked_at).toISOString().split('T')[0];
    clicksByDay[day] = (clicksByDay[day] || 0) + 1;
  });
  
  return c.json({
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
      clicksByDay: Object.entries(clicksByDay).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date))
    },
    recentClicks: clicks.results?.slice(0, 50)
  });
});

// Get all links
app.get('/api/links', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT id, short_code, original_url, title, description, created_at, expires_at, max_clicks, click_count, is_active FROM links ORDER BY created_at DESC LIMIT 100')
    .all();
  
  return c.json({ links: results });
});

// Get single link
app.get('/api/links/:id', async (c) => {
  const id = c.req.param('id');
  
  const link = await c.env.DB
    .prepare('SELECT * FROM links WHERE id = ?')
    .bind(id)
    .first();
  
  if (!link) return c.notFound();
  
  return c.json({ link });
});

// Update link
app.put('/api/links/:id', async (c) => {
  const id = c.req.param('id');
  const updates = await c.req.json<{
    original_url?: string;
    title?: string;
    description?: string;
    expires_at?: number;
    max_clicks?: number;
    is_active?: boolean;
  }>();
  
  // Build dynamic UPDATE query
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
    values.push(updates.is_active ? 1 : 0);
  }
  
  if (fields.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }
  
  values.push(id);
  
  await c.env.DB
    .prepare(`UPDATE links SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();
  
  // Invalidate KV cache
  const link = await c.env.DB
    .prepare('SELECT short_code FROM links WHERE id = ?')
    .bind(id)
    .first<{ short_code: string }>();
  
  if (link) {
    await c.env.KV.delete(`short:${link.short_code}`);
  }
  
  return c.json({ success: true });
});

// Delete link
app.delete('/api/links/:id', async (c) => {
  const id = c.req.param('id');
  
  // Get short code for KV cleanup
  const link = await c.env.DB
    .prepare('SELECT short_code FROM links WHERE id = ?')
    .bind(id)
    .first<{ short_code: string }>();
  
  if (link) {
    await c.env.KV.delete(`short:${link.short_code}`);
  }
  
  await c.env.DB
    .prepare('DELETE FROM links WHERE id = ?')
    .bind(id)
    .run();
  
  // Also delete associated clicks
  await c.env.DB
    .prepare('DELETE FROM clicks WHERE link_id = ?')
    .bind(id)
    .run();
  
  return c.json({ success: true });
});

// Bulk delete links
app.post('/api/links/bulk-delete', async (c) => {
  const { ids } = await c.req.json<{ ids: string[] }>();
  
  if (!ids || ids.length === 0) {
    return c.json({ error: 'No IDs provided' }, 400);
  }
  
  // Get short codes for KV cleanup
  const links = await c.env.DB
    .prepare(`SELECT short_code FROM links WHERE id IN (${ids.map(() => '?').join(',')})`)
    .bind(...ids)
    .all();
  
  // Delete from KV
  for (const link of (links.results || [])) {
    await c.env.KV.delete(`short:${(link as any).short_code}`);
  }
  
  // Delete from DB
  await c.env.DB
    .prepare(`DELETE FROM links WHERE id IN (${ids.map(() => '?').join(',')})`)
    .bind(...ids)
    .run();
  
  await c.env.DB
    .prepare(`DELETE FROM clicks WHERE link_id IN (${ids.map(() => '?').join(',')})`)
    .bind(...ids)
    .run();
  
  return c.json({ success: true, deleted: ids.length });
});

// Bulk update links (e.g., mark as inactive)
app.post('/api/links/bulk-update', async (c) => {
  const { ids, updates } = await c.req.json<{ ids: string[]; updates: { is_active?: boolean } }>();
  
  if (!ids || ids.length === 0) {
    return c.json({ error: 'No IDs provided' }, 400);
  }
  
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.is_active ? 1 : 0);
  }
  
  if (fields.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }
  
  values.push(...ids);
  
  await c.env.DB
    .prepare(`UPDATE links SET ${fields.join(', ')} WHERE id IN (${ids.map(() => '?').join(',')})`)
    .bind(...values)
    .run();
  
  // Invalidate KV cache for all affected links
  const links = await c.env.DB
    .prepare(`SELECT short_code FROM links WHERE id IN (${ids.map(() => '?').join(',')})`)
    .bind(...ids)
    .all();
  
  for (const link of (links.results || [])) {
    await c.env.KV.delete(`short:${(link as any).short_code}`);
  }
  
  return c.json({ success: true, updated: ids.length });
});

// QR Code endpoint
app.get('/api/qr/:code', async (c) => {
  const code = c.req.param('code');
  const size = parseInt(c.req.query('size') || '256');
  
  // Verify link exists
  const link = await c.env.DB
    .prepare('SELECT short_code FROM links WHERE short_code = ? AND is_active = 1')
    .bind(code)
    .first();
  
  if (!link) return c.notFound();
  
  const baseUrl = new URL(c.req.url);
  const shortUrl = `${baseUrl.origin}/${code}`;
  
  // Generate QR code as SVG
  // For now, return the URL - frontend will handle QR generation
  return c.json({ 
    shortUrl,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(shortUrl)}`
  });
});

export default app;






