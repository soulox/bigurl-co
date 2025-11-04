# Authorize.Net Payment Integration Setup

This guide explains how to set up Authorize.Net payment processing for BigURL.

## Overview

BigURL uses Authorize.Net to process payments for Basic and Pro plan upgrades. The integration supports:
- One-time payments
- Recurring subscriptions
- Secure credit card processing
- Transaction history tracking

## Prerequisites

1. An Authorize.Net merchant account
2. API credentials (API Login ID and Transaction Key)

## Getting Authorize.Net Credentials

### 1. Sign Up for Authorize.Net

- Go to [Authorize.Net](https://www.authorize.net/)
- Sign up for a merchant account
- For testing, use the [Sandbox environment](https://sandbox.authorize.net/)

### 2. Get API Credentials

1. Log in to your Authorize.Net Merchant Interface
2. Go to **Account** → **Settings** → **API Credentials & Keys**
3. Click **New Transaction Key**
4. Save your **API Login ID** and **Transaction Key** securely

## Environment Variables

Add these environment variables to your server configuration:

### Server Environment Variables

Create or update `server/.env`:

```env
# Authorize.Net Credentials
AUTHORIZENET_API_LOGIN_ID=your_api_login_id
AUTHORIZENET_TRANSACTION_KEY=your_transaction_key

# Set to 'production' when ready to go live
NODE_ENV=development

# Existing environment variables...
PORT=3000
DB_PATH=./data/links.db
JWT_SECRET=your-jwt-secret-min-32-chars
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
FROM_EMAIL="BigURL <noreply@yourdomain.com>"
ADMIN_EMAIL=admin@yourdomain.com
```

### Docker Compose Configuration

Update `docker-compose.yml` to include the Authorize.Net credentials:

```yaml
services:
  server:
    environment:
      # ... existing environment variables ...
      AUTHORIZENET_API_LOGIN_ID: ${AUTHORIZENET_API_LOGIN_ID}
      AUTHORIZENET_TRANSACTION_KEY: ${AUTHORIZENET_TRANSACTION_KEY}
```

## Testing with Sandbox

Authorize.Net provides test credit card numbers for sandbox testing:

### Test Credit Cards

- **Visa:** 4007000000027
- **Mastercard:** 5424000000000015
- **American Express:** 370000000000002
- **Discover:** 6011000000000012

### Test Details
- **Expiration Date:** Any future date (e.g., 12/25)
- **CVV:** Any 3-4 digit number (e.g., 123)
- **ZIP Code:** Any 5 digits (e.g., 12345)

## Package Pricing

Current pricing structure:

- **Free:** $0/month (5 links)
- **Basic:** $9/month (20 links)
- **Pro:** $29/month (100 links)

## API Endpoints

### Process Payment

**Endpoint:** `POST /api/payment/process`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Body:**
```json
{
  "packageType": "basic" | "pro",
  "billingCycle": "monthly" | "yearly",
  "payment": {
    "cardNumber": "4007000000027",
    "expirationDate": "12/25",
    "cvv": "123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "transactionId": "trans_123abc",
  "package": "basic"
}
```

**Response (Error):**
```json
{
  "error": "Payment failed",
  "details": "Card declined"
}
```

## Database Schema

### Transactions Table

```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  package TEXT NOT NULL CHECK(package IN ('basic', 'pro')),
  amount REAL NOT NULL,
  transaction_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Frontend Integration

The checkout process is handled through the `CheckoutModal` component:

```tsx
import { CheckoutModal } from "@/components/CheckoutModal";

<CheckoutModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  packageName="basic"
  packagePrice={9}
/>
```

## Security Best Practices

1. **Never expose API credentials in frontend code**
   - All payment processing happens server-side
   - Frontend only sends encrypted data through authenticated API calls

2. **Use HTTPS in production**
   - Always use SSL/TLS certificates
   - Authorize.Net requires HTTPS for production

3. **PCI Compliance**
   - Never store credit card numbers in your database
   - Use Authorize.Net's tokenization if storing payment methods

4. **Validate on server-side**
   - Always validate payment amounts server-side
   - Don't trust client-side price calculations

## Going Live

When ready to accept real payments:

1. Complete Authorize.Net merchant account setup
2. Get production API credentials
3. Update environment variables:
   ```env
   NODE_ENV=production
   AUTHORIZENET_API_LOGIN_ID=your_production_api_login_id
   AUTHORIZENET_TRANSACTION_KEY=your_production_transaction_key
   ```
4. Test thoroughly with real credit cards (small amounts)
5. Set up proper error logging and monitoring

## Webhook Setup (Optional)

For recurring subscriptions, set up webhooks to handle:
- Subscription renewals
- Payment failures
- Subscription cancellations

Configure webhook URL in Authorize.Net:
- **Webhook URL:** `https://yourdomain.com/api/webhooks/authorizenet`

## Troubleshooting

### Common Issues

**1. "Payment gateway not configured" error**
- Check that `AUTHORIZENET_API_LOGIN_ID` and `AUTHORIZENET_TRANSACTION_KEY` are set
- Verify credentials are correct

**2. "Card declined" in sandbox**
- Use test credit card numbers provided by Authorize.Net
- Ensure expiration date is in the future

**3. "Invalid amount" error**
- Verify package pricing is configured correctly
- Check that amount is a positive number

**4. Transaction not recorded**
- Check database connection
- Verify transactions table exists
- Check server logs for errors

## Support

For Authorize.Net specific issues:
- [Authorize.Net Developer Documentation](https://developer.authorize.net/)
- [Authorize.Net Support](https://support.authorize.net/)

For BigURL integration issues:
- Check server logs: `docker-compose logs server`
- Review database: SQLite browser or SQL client

## Next Steps

1. Install server dependencies: `cd server && npm install`
2. Set up environment variables
3. Rebuild Docker containers: `docker-compose build`
4. Test with sandbox credentials
5. Verify payment flow end-to-end
6. Set up production credentials when ready


