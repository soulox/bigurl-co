# API Documentation

Complete API reference for the BigURL URL shortener.

## Base URL

All API endpoints are relative to your deployment URL (e.g., `https://your-domain.com` or `https://your-worker.workers.dev`).

---

## Endpoints

### 1. Create Short Link

**POST** `/api/shorten`

Create a new short link with optional advanced settings.

#### Request Body

```json
{
  "url": "https://example.com/very/long/url",
  "customSlug": "my-link",           // optional
  "title": "My Link Title",          // optional
  "description": "Link description", // optional
  "expiresAt": 1735689600000,       // optional, Unix timestamp
  "maxClicks": 100                   // optional
}
```

#### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "shortCode": "my-link",
  "shortUrl": "https://your-domain.com/my-link"
}
```

#### Error Responses

- **400 Bad Request**: Invalid URL or parameters
- **409 Conflict**: Custom slug already in use

---

### 2. Redirect to Original URL

**GET** `/:code`

Redirects to the original URL and tracks analytics.

#### Parameters

- `code` (path): The short code

#### Response

- **301 Redirect**: Successful redirect to original URL
- **404 Not Found**: Short code doesn't exist
- **410 Gone**: Link expired or max clicks reached

#### Analytics Tracked

When a redirect occurs, the following data is captured:
- Timestamp
- Country & City
- IP address
- Referrer URL
- User Agent
- Device type
- Browser
- Operating System

---

### 3. Get All Links

**GET** `/api/links`

Retrieve all short links (limited to 100 most recent).

#### Response (200 OK)

```json
{
  "links": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "short_code": "my-link",
      "original_url": "https://example.com/very/long/url",
      "title": "My Link Title",
      "description": "Link description",
      "created_at": 1699876543210,
      "expires_at": 1735689600000,
      "max_clicks": 100,
      "click_count": 42,
      "is_active": true
    }
  ]
}
```

---

### 4. Get Single Link

**GET** `/api/links/:id`

Get detailed information about a specific link.

#### Parameters

- `id` (path): The link ID (UUID)

#### Response (200 OK)

```json
{
  "link": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "short_code": "my-link",
    "original_url": "https://example.com/very/long/url",
    "title": "My Link Title",
    "description": "Link description",
    "created_at": 1699876543210,
    "expires_at": 1735689600000,
    "password_hash": null,
    "max_clicks": 100,
    "click_count": 42,
    "user_id": null,
    "is_active": true,
    "custom_domain": null
  }
}
```

#### Error Responses

- **404 Not Found**: Link ID doesn't exist

---

### 5. Update Link

**PUT** `/api/links/:id`

Update a link's properties.

#### Parameters

- `id` (path): The link ID (UUID)

#### Request Body

All fields are optional. Only include fields you want to update:

```json
{
  "original_url": "https://new-url.com",
  "title": "Updated Title",
  "description": "Updated description",
  "expires_at": 1735689600000,
  "max_clicks": 200,
  "is_active": false
}
```

#### Response (200 OK)

```json
{
  "success": true
}
```

#### Notes

- Updating a link automatically invalidates its KV cache
- The short code cannot be changed
- Setting `is_active: false` disables the link

#### Error Responses

- **400 Bad Request**: No fields to update
- **404 Not Found**: Link ID doesn't exist

---

### 6. Delete Link

**DELETE** `/api/links/:id`

Permanently delete a link and all its analytics data.

#### Parameters

- `id` (path): The link ID (UUID)

#### Response (200 OK)

```json
{
  "success": true
}
```

#### Notes

- This action is irreversible
- All associated click records are also deleted
- KV cache entry is removed

---

### 7. Bulk Delete Links

**POST** `/api/links/bulk-delete`

Delete multiple links at once.

#### Request Body

```json
{
  "ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ]
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "deleted": 2
}
```

#### Error Responses

- **400 Bad Request**: No IDs provided or invalid format

---

### 8. Bulk Update Links

**POST** `/api/links/bulk-update`

Update multiple links at once.

#### Request Body

```json
{
  "ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ],
  "updates": {
    "is_active": false
  }
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "updated": 2
}
```

#### Notes

- Currently supports updating `is_active` status
- Can be extended to support other fields

#### Error Responses

- **400 Bad Request**: No IDs or updates provided

---

### 9. Get Analytics

**GET** `/api/analytics/:code`

Get comprehensive analytics for a short link.

#### Parameters

- `code` (path): The short code

#### Response (200 OK)

```json
{
  "link": {
    "shortCode": "my-link",
    "originalUrl": "https://example.com/very/long/url",
    "createdAt": 1699876543210,
    "totalClicks": 142
  },
  "stats": {
    "countries": [
      { "name": "US", "count": 89 },
      { "name": "UK", "count": 32 },
      { "name": "CA", "count": 21 }
    ],
    "referrers": [
      { "name": "Direct", "count": 67 },
      { "name": "https://google.com", "count": 45 },
      { "name": "https://twitter.com", "count": 30 }
    ],
    "devices": [
      { "name": "desktop", "count": 89 },
      { "name": "mobile", "count": 48 },
      { "name": "tablet", "count": 5 }
    ],
    "browsers": [
      { "name": "Chrome", "count": 95 },
      { "name": "Safari", "count": 32 },
      { "name": "Firefox", "count": 15 }
    ],
    "osTypes": [
      { "name": "Windows", "count": 78 },
      { "name": "macOS", "count": 34 },
      { "name": "iOS", "count": 20 },
      { "name": "Android", "count": 10 }
    ],
    "clicksByDay": [
      { "date": "2024-01-01", "count": 23 },
      { "date": "2024-01-02", "count": 45 },
      { "date": "2024-01-03", "count": 34 }
    ]
  },
  "recentClicks": [
    {
      "clicked_at": 1699876543210,
      "country": "US",
      "city": "New York",
      "referrer": "https://google.com",
      "device_type": "desktop",
      "browser": "Chrome",
      "os": "Windows"
    }
  ]
}
```

#### Notes

- Returns up to 1000 recent clicks for aggregation
- `recentClicks` limited to 50 most recent
- All stats arrays are sorted by count (descending)

#### Error Responses

- **404 Not Found**: Short code doesn't exist

---

### 10. Get QR Code

**GET** `/api/qr/:code?size=256`

Get QR code URL for a short link.

#### Parameters

- `code` (path): The short code
- `size` (query): QR code size in pixels (default: 256)

#### Response (200 OK)

```json
{
  "shortUrl": "https://your-domain.com/my-link",
  "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=https%3A%2F%2Fyour-domain.com%2Fmy-link"
}
```

#### Notes

- Uses external QR code service (qrserver.com)
- Frontend handles QR code generation using qrcode.react
- Size can be adjusted (minimum 128, maximum 512)

#### Error Responses

- **404 Not Found**: Short code doesn't exist or link is inactive

---

### 11. Health Check

**GET** `/health`

Simple health check endpoint.

#### Response (200 OK)

```json
{
  "status": "ok"
}
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

- `200` - Success
- `301` - Redirect (for short links)
- `400` - Bad Request (invalid input)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate slug)
- `410` - Gone (expired or max clicks reached)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limiting

Rate limiting is handled by Cloudflare Workers' built-in protections. Consider implementing custom rate limiting for production use.

---

## CORS

All endpoints support CORS with the `cors()` middleware from Hono.

---

## Authentication

Currently, the API is open. For production use, consider implementing:
- API keys
- JWT tokens
- User authentication
- OAuth integration

---

## Caching

### KV Cache
- Short code → URL mappings are cached in KV
- TTL: 3600 seconds (1 hour)
- Automatically invalidated on update/delete

### Browser Cache
- Redirects: Cache-Control header set to 3600 seconds
- Static assets: Handled by Next.js/Cloudflare Pages

---

## Analytics Engine

Click data is written to Cloudflare Analytics Engine with:
- **Blobs**: [short_code, country, device_type, browser, os]
- **Doubles**: [1] (for counting)
- **Indexes**: [short_code] (for querying)

This allows for powerful analytics queries using Cloudflare's SQL API.

---

## Best Practices

### Creating Links
```javascript
// Basic link
await fetch('/api/shorten', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com'
  })
});

// Link with all options
await fetch('/api/shorten', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    customSlug: 'my-link',
    title: 'My Link',
    description: 'Description here',
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    maxClicks: 100
  })
});
```

### Fetching Analytics
```javascript
const response = await fetch('/api/analytics/my-link');
const analytics = await response.json();

console.log(`Total clicks: ${analytics.link.totalClicks}`);
console.log(`Top country: ${analytics.stats.countries[0].name}`);
```

### Bulk Operations
```javascript
// Delete multiple links
await fetch('/api/links/bulk-delete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ids: ['id1', 'id2', 'id3']
  })
});

// Deactivate multiple links
await fetch('/api/links/bulk-update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ids: ['id1', 'id2', 'id3'],
    updates: { is_active: false }
  })
});
```

---

## TypeScript Types

Complete TypeScript definitions are available in `src/types/index.ts`:

- `ShortLink`
- `Link`
- `Analytics`
- `ClickStats`
- `ClickByDay`
- `CreateLinkInput`
- `UpdateLinkInput`

---

## Webhooks (Future)

Consider implementing webhooks for:
- Link creation
- Link clicks (with configurable thresholds)
- Link expiration
- Max clicks reached

---

## Need Help?

Refer to:
- `FEATURES.md` - Feature documentation
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `README.md` - Project overview

