import { Hono, Context } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { DataStore } from './db.js';
import { generateUniqueCode, randomAlphaNum, parseUserAgent, getClientIp } from './util.js';
import { LRUCache } from 'lru-cache';
import { hashPassword, verifyPassword, generateToken, getUserFromContext, requireAuth } from './auth.js';
import { sendWelcomeEmail, sendContactFormEmail } from './email.js';

const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.DB_PATH || './data/links.db';

const db = new DataStore(DB_PATH);
const redirectCache = new LRUCache<string, string>({ max: 100_000, ttl: 60 * 60 * 1000 });

const app = new Hono();

app.use('*', cors());

app.get('/health', (c: Context) => c.json({ status: 'ok' }));

// Authentication Routes

app.post('/api/auth/register', async (c: Context) => {
  const { email, password, name } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: 'Email and password required' }, 400);
  }

  // Check if user exists
  const existing = db.getUserByEmail(email);
  if (existing) {
    return c.json({ error: 'Email already registered' }, 409);
  }

  // Create user
  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  
  db.createUser({
    id: userId,
    email,
    password_hash: passwordHash,
    google_id: null,
    name: name || null,
    created_at: Date.now(),
    email_verified: 0,
    package: 'free',
    link_limit: 5,
    link_count: 0,
  });

  // Send welcome email
  try {
    await sendWelcomeEmail(email, name || 'there');
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }

  const token = generateToken({ userId, email });

  return c.json({
    user: {
      id: userId,
      email,
      name,
      package: 'free',
    },
    token,
  });
});

app.post('/api/auth/login', async (c: Context) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: 'Email and password required' }, 400);
  }

  const user = db.getUserByEmail(email);
  if (!user || !user.password_hash) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = generateToken({ userId: user.id, email: user.email });

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    package: user.package,
    token,
  });
});

app.post('/api/auth/google', async (c: Context) => {
  const { email, name, googleId } = await c.req.json();

  if (!email || !googleId) {
    return c.json({ error: 'Invalid Google auth data' }, 400);
  }

  // Check if user exists
  let user = db.getUserByGoogleId(googleId);
  
  if (!user) {
    // Try by email
    user = db.getUserByEmail(email);
    
    if (user) {
      // Link Google account
      db.updateUser(user.id, { google_id: googleId });
    } else {
      // Create new user
      const userId = crypto.randomUUID();
      db.createUser({
        id: userId,
        email,
        password_hash: null,
        google_id: googleId,
        name: name || null,
        created_at: Date.now(),
        email_verified: 1,
        package: 'free',
        link_limit: 5,
        link_count: 0,
      });
      
      user = db.getUserById(userId);
      
      // Send welcome email
      try {
        await sendWelcomeEmail(email, name || 'there');
      } catch (error) {
        console.error('Failed to send welcome email:', error);
      }
    }
  }

  const token = generateToken({ userId: user!.id, email: user!.email });

  return c.json({
    id: user!.id,
    email: user!.email,
    name: user!.name,
    package: user!.package,
    token,
  });
});

app.get('/api/auth/me', async (c: Context) => {
  const authUser = await requireAuth(c);
  if (authUser instanceof Response) return authUser;

  const user = db.getUserById(authUser.userId);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    package: user.package,
    link_limit: user.link_limit,
    link_count: db.getUserLinkCount(user.id),
  });
});

// Contact Form
app.post('/api/contact', async (c: Context) => {
  const { name, email, message } = await c.req.json();

  if (!name || !email || !message) {
    return c.json({ error: 'All fields required' }, 400);
  }

  try {
    await sendContactFormEmail(name, email, message);
    return c.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

app.post('/api/shorten', async (c: Context) => {
  // Require authentication
  const authUser = await requireAuth(c);
  if (authUser instanceof Response) return authUser;

  // Check if user can create more links
  if (!db.canUserCreateLink(authUser.userId)) {
    const user = db.getUserById(authUser.userId);
    return c.json({ 
      error: 'Link limit reached',
      message: `You've reached your limit of ${user?.link_limit} links. Please upgrade your plan.`,
      package: user?.package,
      limit: user?.link_limit
    }, 403);
  }

  type Body = { 
    url: string; 
    customSlug?: string;
    title?: string;
    description?: string;
    expiresAt?: number;
    maxClicks?: number;
  };
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
  db.insertLink({ 
    id,
    user_id: authUser.userId,
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

// Get all links
app.get('/api/links', async (c: Context) => {
  // Require authentication
  const authUser = await requireAuth(c);
  if (authUser instanceof Response) return authUser;

  const links = db.getAllLinks(authUser.userId);
  return c.json({ links });
});

// Get single link
app.get('/api/links/:id', async (c: Context) => {
  const id = c.req.param('id');
  const link = db.getLinkById(id);
  
  if (!link) return c.notFound();
  
  return c.json({ link });
});

// Update link
app.put('/api/links/:id', async (c: Context) => {
  // Require authentication
  const authUser = await requireAuth(c);
  if (authUser instanceof Response) return authUser;

  const id = c.req.param('id');
  const updates = await c.req.json();
  
  // Check if link exists
  const link = db.getLinkById(id);
  if (!link) return c.notFound();

  // Verify ownership
  if (!db.userOwnsLink(authUser.userId, id)) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  
  db.updateLink(id, updates);
  
  // Invalidate cache
  const shortCode = db.getShortCodeById(id);
  if (shortCode) {
    redirectCache.delete(shortCode);
  }
  
  return c.json({ success: true });
});

// Delete link
app.delete('/api/links/:id', async (c: Context) => {
  // Require authentication
  const authUser = await requireAuth(c);
  if (authUser instanceof Response) return authUser;

  const id = c.req.param('id');
  
  // Verify ownership
  if (!db.userOwnsLink(authUser.userId, id)) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  
  // Get short code for cache cleanup
  const shortCode = db.getShortCodeById(id);
  if (shortCode) {
    redirectCache.delete(shortCode);
  }
  
  db.deleteLink(id);
  
  return c.json({ success: true });
});

// Bulk delete links
app.post('/api/links/bulk-delete', async (c: Context) => {
  // Require authentication
  const authUser = await requireAuth(c);
  if (authUser instanceof Response) return authUser;

  const { ids } = await c.req.json();
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return c.json({ error: 'No IDs provided' }, 400);
  }

  // Verify ownership of all links
  if (!db.userOwnsLinks(authUser.userId, ids)) {
    return c.json({ error: 'Forbidden: You do not own all selected links' }, 403);
  }
  
  // Get short codes for cache cleanup
  const shortCodes = db.getShortCodesByIds(ids);
  shortCodes.forEach(code => redirectCache.delete(code));
  
  db.bulkDeleteLinks(ids);
  
  return c.json({ success: true, deleted: ids.length });
});

// Bulk update links
app.post('/api/links/bulk-update', async (c: Context) => {
  // Require authentication
  const authUser = await requireAuth(c);
  if (authUser instanceof Response) return authUser;

  const { ids, updates } = await c.req.json();
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return c.json({ error: 'No IDs provided' }, 400);
  }

  // Verify ownership of all links
  if (!db.userOwnsLinks(authUser.userId, ids)) {
    return c.json({ error: 'Forbidden: You do not own all selected links' }, 403);
  }
  
  const updateData: { is_active?: number } = {};
  if (updates.is_active !== undefined) {
    updateData.is_active = updates.is_active ? 1 : 0;
  }
  
  db.bulkUpdateLinks(ids, updateData);
  
  // Invalidate cache for all affected links
  const shortCodes = db.getShortCodesByIds(ids);
  shortCodes.forEach(code => redirectCache.delete(code));
  
  return c.json({ success: true, updated: ids.length });
});

// Subscription Management

app.post('/api/user/upgrade', async (c: Context) => {
  // Require authentication
  const authUser = await requireAuth(c);
  if (authUser instanceof Response) return authUser;

  const { package: packageType } = await c.req.json();

  if (!['free', 'basic', 'pro'].includes(packageType)) {
    return c.json({ error: 'Invalid package type' }, 400);
  }

  const user = db.getUserById(authUser.userId);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Check if downgrade would exceed limit
  const limits = { free: 5, basic: 20, pro: 100 };
  const newLimit = limits[packageType as 'free' | 'basic' | 'pro'];
  const currentCount = db.getUserLinkCount(authUser.userId);

  if (currentCount > newLimit) {
    return c.json({ 
      error: `You have ${currentCount} active links. Please delete ${currentCount - newLimit} link(s) before downgrading to ${packageType}.`,
      currentCount,
      newLimit
    }, 400);
  }

  db.updateUserPackage(authUser.userId, packageType as 'free' | 'basic' | 'pro');

  return c.json({ 
    success: true, 
    package: packageType,
    limit: newLimit
  });
});

app.get('/api/user/stats', async (c: Context) => {
  // Require authentication
  const authUser = await requireAuth(c);
  if (authUser instanceof Response) return authUser;

  const user = db.getUserById(authUser.userId);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const linkCount = db.getUserLinkCount(authUser.userId);
  
  return c.json({
    package: user.package,
    link_limit: user.link_limit,
    link_count: linkCount,
    links_remaining: user.link_limit - linkCount,
  });
});

// Get analytics for a link
app.get('/api/analytics/:code', async (c: Context) => {
  const code = c.req.param('code');
  
  const analytics = db.getAnalytics(code);
  
  if (!analytics) return c.notFound();
  
  return c.json(analytics);
});

// QR Code endpoint
app.get('/api/qr/:code', async (c: Context) => {
  const code = c.req.param('code');
  const size = parseInt(c.req.query('size') || '256');
  
  // Verify link exists
  const link = db.getLinkByCode(code);
  if (!link) return c.notFound();
  
  const origin = c.req.header('x-forwarded-host') || c.req.header('host') || '';
  const proto = (c.req.header('x-forwarded-proto') || 'https').toLowerCase();
  const shortUrl = origin ? `${proto}://${origin}/${code}` : `/${code}`;
  
  // Return URL for QR generation (frontend will handle actual QR code)
  return c.json({ 
    shortUrl,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(shortUrl)}`
  });
});

// Short code redirect - MUST BE LAST to not override other routes
app.get('/:code', async (c: Context) => {
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
      } catch (err) {
        console.error('Failed to track click:', err);
      }
    });
  }

  // Update cache
  redirectCache.set(code, target, { ttl: 60 * 60 * 1000 });

  // NGINX will cache this 301
  return c.redirect(target, 301);
});

serve({ fetch: app.fetch, port: PORT }, (info: { port: number }) => {
  console.log(`Server listening on http://127.0.0.1:${info.port}`);
});


