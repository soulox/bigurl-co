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
  const { url, customSlug } = await c.req.json<{ url: string; customSlug?: string }>();

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
    .prepare('INSERT INTO links (id, short_code, original_url, created_at, is_active) VALUES (?, ?, ?, ?, 1)')
    .bind(id, shortCode, url, now)
    .run();

  // Prime KV for fast redirects
  await c.env.KV.put(`short:${shortCode}`, url, { expirationTtl: 3600 });

  const shortUrl = `${baseUrl.origin}/${shortCode}`;
  return c.json({ id, shortCode, shortUrl });
});

app.get('/:code', cache({ cacheName: 'redirects', cacheControl: 'max-age=3600' }), async (c) => {
  const code = c.req.param('code');

  let target = await c.env.KV.get(`short:${code}`);
  if (!target) {
    const row = await c.env.DB
      .prepare('SELECT original_url FROM links WHERE short_code = ? AND is_active = 1')
      .bind(code)
      .first<{ original_url?: string }>();
    if (!row?.original_url) return c.notFound();
    target = row.original_url;
    await c.env.KV.put(`short:${code}`, target, { expirationTtl: 3600 });
  }

  // fire-and-forget analytics
  c.executionCtx.waitUntil((async () => {
    try {
      const req = c.req.raw;
      const cf = (req as any).cf as Request['cf'] | undefined;
      c.env.ANALYTICS.writeDataPoint({
        blobs: [code, cf?.country || 'Unknown'],
        doubles: [1],
        indexes: [code]
      });
      await c.env.DB
        .prepare('UPDATE links SET click_count = coalesce(click_count, 0) + 1 WHERE short_code = ?')
        .bind(code)
        .run();
    } catch {}
  })());

  return c.redirect(target, 301);
});

export default app;





