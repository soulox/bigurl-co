import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { DataStore } from './db.js';
import { generateUniqueCode, randomAlphaNum, parseUserAgent, getClientIp } from './util.js';
import { LRUCache } from 'lru-cache';
const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.DB_PATH || './data/links.db';
const db = new DataStore(DB_PATH);
const redirectCache = new LRUCache({ max: 100_000, ttl: 60 * 60 * 1000 });
const app = new Hono();
app.use('*', cors());
app.get('/health', (c) => c.json({ status: 'ok' }));
app.post('/api/shorten', async (c) => {
    const body = (await c.req.json());
    const inputUrl = String(body.url || '');
    const custom = body.customSlug?.trim();
    // Validate URL
    let parsed;
    try {
        parsed = new URL(inputUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return c.json({ error: 'Invalid URL protocol' }, 400);
        }
    }
    catch {
        return c.json({ error: 'Invalid URL' }, 400);
    }
    // Unique code
    let shortCode;
    if (custom && custom.length > 0) {
        if (db.codeExists(custom))
            return c.json({ error: 'Slug already in use' }, 409);
        shortCode = custom;
    }
    else {
        shortCode = generateUniqueCode((len) => randomAlphaNum(len), (code) => db.codeExists(code));
    }
    const id = crypto.randomUUID();
    const now = Date.now();
    db.insertLink({
        id,
        short_code: shortCode,
        original_url: parsed.toString(),
        title: body.title || null,
        description: body.description || null,
        created_at: now,
        expires_at: body.expiresAt || null,
        max_clicks: body.maxClicks || null,
        is_active: 1
    });
    // Prime in-process cache (NGINX proxy_cache will also help)
    redirectCache.set(shortCode, parsed.toString(), { ttl: 60 * 60 * 1000 });
    const origin = c.req.header('x-forwarded-host') || c.req.header('host') || '';
    const proto = (c.req.header('x-forwarded-proto') || 'https').toLowerCase();
    const shortUrl = origin ? `${proto}://${origin}/${shortCode}` : `/${shortCode}`;
    return c.json({ id, shortCode, shortUrl });
});
app.get('/:code', async (c) => {
    const code = c.req.param('code');
    // Check database for link (to validate expiration/max clicks)
    let target = db.getOriginalUrlByCode(code);
    if (!target) {
        return c.json({ error: 'Link not found, expired, or max clicks reached' }, 410);
    }
    // Track analytics asynchronously
    const link = db.getLinkByCode(code);
    if (link) {
        setImmediate(() => {
            try {
                const userAgent = c.req.header('user-agent') || '';
                const referer = c.req.header('referer') || c.req.header('referrer') || '';
                const ip = getClientIp(c);
                const { deviceType, browser, os } = parseUserAgent(userAgent);
                // Get geo data from nginx headers if available
                const country = c.req.header('x-geoip-country') || c.req.header('cf-ipcountry') || 'Unknown';
                const city = c.req.header('x-geoip-city') || 'Unknown';
                db.insertClick({
                    id: crypto.randomUUID(),
                    link_id: link.id,
                    clicked_at: Date.now(),
                    ip_address: ip,
                    country,
                    city,
                    referrer: referer,
                    user_agent: userAgent,
                    device_type: deviceType,
                    browser,
                    os
                });
                db.incrementClickCount(code);
            }
            catch (err) {
                console.error('Failed to track click:', err);
            }
        });
    }
    // Update cache
    redirectCache.set(code, target, { ttl: 60 * 60 * 1000 });
    // NGINX will cache this 301
    return c.redirect(target, 301);
});
// Get all links
app.get('/api/links', async (c) => {
    const links = db.getAllLinks();
    return c.json({ links });
});
// Get single link
app.get('/api/links/:id', async (c) => {
    const id = c.req.param('id');
    const link = db.getLinkById(id);
    if (!link)
        return c.notFound();
    return c.json({ link });
});
// Update link
app.put('/api/links/:id', async (c) => {
    const id = c.req.param('id');
    const updates = await c.req.json();
    // Check if link exists
    const link = db.getLinkById(id);
    if (!link)
        return c.notFound();
    db.updateLink(id, updates);
    // Invalidate cache
    const shortCode = db.getShortCodeById(id);
    if (shortCode) {
        redirectCache.delete(shortCode);
    }
    return c.json({ success: true });
});
// Delete link
app.delete('/api/links/:id', async (c) => {
    const id = c.req.param('id');
    // Get short code for cache cleanup
    const shortCode = db.getShortCodeById(id);
    if (shortCode) {
        redirectCache.delete(shortCode);
    }
    db.deleteLink(id);
    return c.json({ success: true });
});
// Bulk delete links
app.post('/api/links/bulk-delete', async (c) => {
    const { ids } = await c.req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return c.json({ error: 'No IDs provided' }, 400);
    }
    // Get short codes for cache cleanup
    const shortCodes = db.getShortCodesByIds(ids);
    shortCodes.forEach(code => redirectCache.delete(code));
    db.bulkDeleteLinks(ids);
    return c.json({ success: true, deleted: ids.length });
});
// Bulk update links
app.post('/api/links/bulk-update', async (c) => {
    const { ids, updates } = await c.req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return c.json({ error: 'No IDs provided' }, 400);
    }
    const updateData = {};
    if (updates.is_active !== undefined) {
        updateData.is_active = updates.is_active ? 1 : 0;
    }
    db.bulkUpdateLinks(ids, updateData);
    // Invalidate cache for all affected links
    const shortCodes = db.getShortCodesByIds(ids);
    shortCodes.forEach(code => redirectCache.delete(code));
    return c.json({ success: true, updated: ids.length });
});
// Get analytics for a link
app.get('/api/analytics/:code', async (c) => {
    const code = c.req.param('code');
    const analytics = db.getAnalytics(code);
    if (!analytics)
        return c.notFound();
    return c.json(analytics);
});
// QR Code endpoint
app.get('/api/qr/:code', async (c) => {
    const code = c.req.param('code');
    const size = parseInt(c.req.query('size') || '256');
    // Verify link exists
    const link = db.getLinkByCode(code);
    if (!link)
        return c.notFound();
    const origin = c.req.header('x-forwarded-host') || c.req.header('host') || '';
    const proto = (c.req.header('x-forwarded-proto') || 'https').toLowerCase();
    const shortUrl = origin ? `${proto}://${origin}/${code}` : `/${code}`;
    // Return URL for QR generation (frontend will handle actual QR code)
    return c.json({
        shortUrl,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(shortUrl)}`
    });
});
serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`Server listening on http://127.0.0.1:${info.port}`);
});
