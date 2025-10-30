import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { DataStore } from './db.js';
import { generateUniqueCode, randomAlphaNum } from './util.js';
import { LRUCache } from 'lru-cache';

const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.DB_PATH || './data/links.db';

const db = new DataStore(DB_PATH);
const redirectCache = new LRUCache<string, string>({ max: 100_000, ttl: 60 * 60 * 1000 });

const app = new Hono();

app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

app.post('/api/shorten', async (c) => {
  type Body = { url: string; customSlug?: string };
  const body = (await c.req.json()) as Body;
  const inputUrl = String(body.url || '');
  const custom = body.customSlug?.trim();

  // Validate URL
  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return c.json({ error: 'Invalid URL protocol' }, 400);
    }
  } catch {
    return c.json({ error: 'Invalid URL' }, 400);
  }

  // Unique code
  let shortCode: string;
  if (custom && custom.length > 0) {
    if (db.codeExists(custom)) return c.json({ error: 'Slug already in use' }, 409);
    shortCode = custom;
  } else {
    shortCode = generateUniqueCode((len) => randomAlphaNum(len), (code) => db.codeExists(code));
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  db.insertLink({ id, short_code: shortCode, original_url: parsed.toString(), created_at: now, is_active: 1 });

  // Prime in-process cache (NGINX proxy_cache will also help)
  redirectCache.set(shortCode, parsed.toString(), { ttl: 60 * 60 * 1000 });

  const origin = c.req.header('x-forwarded-host') || c.req.header('host') || '';
  const proto = (c.req.header('x-forwarded-proto') || 'https').toLowerCase();
  const shortUrl = origin ? `${proto}://${origin}/${shortCode}` : `/${shortCode}`;
  return c.json({ id, shortCode, shortUrl });
});

app.get('/:code', async (c) => {
  const code = c.req.param('code');

  // Check LRU first
  let target = redirectCache.get(code);
  if (!target) {
    target = db.getOriginalUrlByCode(code);
    if (!target) return c.notFound();
    redirectCache.set(code, target, { ttl: 60 * 60 * 1000 });
  }

  // NGINX will cache this 301; also expose cache status for debugging if behind NGINX
  return c.redirect(target, 301);
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Server listening on http://127.0.0.1:${info.port}`);
});


