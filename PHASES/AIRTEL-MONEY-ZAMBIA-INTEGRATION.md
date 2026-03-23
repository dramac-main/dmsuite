# Airtel Money Zambia — Direct API Integration for DMSuite

> **Updated with OFFICIAL Airtel Zambia Developer Portal API documentation (June 2025)**
> Source: `airtel-zambia-full-api-docs (3).json` — 705KB, 13 API sections, all confirmed 200 OK

## Executive Summary

**YES, direct integration is 100% achievable.** Airtel Africa provides a REST API that allows merchants/developers to collect payments directly via USSD Push — no third-party gateway required. The exact flow you described (user enters number → receives prompt on phone → enters PIN → credits arrive) is the core product of their **Collection API** (Product ID: 7).

---

## 1. How Airtel Money Collection (USSD Push) Works

### The User Experience (Exactly What You Want)
```
1. User clicks "Buy Credits" on DMSuite
2. User selects a credit pack (e.g., K49 = 100 credits)
3. User enters their Airtel Money number (e.g., 097XXXXXXX)
4. DMSuite backend calls Airtel Collection API
5. User receives USSD push prompt on their phone:
   ┌─────────────────────────────┐
   │ Airtel Money                │
   │ Confirm payment of K49.00  │
   │ to DRAMAC AGENCY for       │
   │ DMSuite Credits             │
   │                             │
   │ Enter PIN: ____             │
   └─────────────────────────────┘
6. User enters their Airtel Money PIN
7. K49.00 is deducted from their Airtel Money wallet
8. Airtel sends webhook callback to DMSuite backend
9. DMSuite credits 100 credits to the user's account
10. CreditBalance updates in real-time via Supabase Realtime
```

### Transaction Status Flow
```
INITIATED → IN PROGRESS (TIP) → SUCCESS (TS) or FAILED (TF) or AMBIGUOUS (TA) or EXPIRED (TE)
```

---

## 2. Airtel Zambia Developer API Specification

### Portal & Signup
- **Developer Portal**: https://developers.airtel.co.zm/
- **Select Country**: Zambia (ZM)
- **Sign up for account**: Register application to get credentials
- **Collection API**: Product ID 7

### Base URLs (ZAMBIA-SPECIFIC — NOT .airtel.africa)
| Environment | Base URL |
|---|---|
| **Sandbox (UAT)** | `https://openapiuat.airtel.co.zm` |
| **Production** | `https://openapi.airtel.co.zm` |

> **CRITICAL**: The old `.airtel.africa` domain is being deprecated (deadline: 2026-03-15). Zambia uses `.airtel.co.zm` exclusively.

### Country & Currency
| Parameter | Value |
|---|---|
| Country Code | `ZM` |
| Currency Code | `ZMW` |
| X-Country ID | `9` |
| MSISDN Format | `97XXXXXXX` or `77XXXXXXX` (without +260 prefix, **no country code**) |

---

## 3. API Endpoints

### 3.1 Authentication — Get OAuth2 Token

```
POST /auth/oauth2/token
Content-Type: application/json
Accept: */*
```

**Request Body:**
```json
{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "grant_type": "client_credentials"
}
```

**Response (200):**
```json
{
  "access_token": "*****************",
  "expires_in": "180",
  "token_type": "bearer"
}
```

**Notes:**
- **Token expires in 180 seconds (3 MINUTES!)** — NOT 1 hour as some docs suggest
- Must implement aggressive token caching with ~150s TTL (refresh at ~150s)
- Store token server-side only (never expose to client)
- `grant_type` is always `client_credentials`
- This is a common API — same token works for Collection, Disbursement, KYC etc.

---

### 3.2 Collection — Request Payment (USSD Push)

This is the core endpoint. Triggers a USSD prompt on the subscriber's phone.

```
POST /merchant/v1/payments/
Accept: */*
Content-Type: application/json
X-Country: ZM
X-Currency: ZMW
Authorization: Bearer <access_token>
```

> **NOTE**: Endpoint is `/merchant/v1/payments/` (v1, NOT v2)

**Request Body:**
```json
{
  "reference": "DMSuite Credit Purchase - Starter Pack",
  "subscriber": {
    "country": "ZM",
    "currency": "ZMW",
    "msisdn": "97XXXXXXX"
  },
  "transaction": {
    "amount": 49,
    "country": "ZM",
    "currency": "ZMW",
    "id": "dmsuite_txn_abc123def456"
  }
}
```

**Field Details:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `reference` | string | mandatory | Description of the payment |
| `subscriber.country` | string | optional | Country code (ZM) |
| `subscriber.currency` | string | optional | Currency code (ZMW) |
| `subscriber.msisdn` | string | mandatory | **Do NOT send country code** — just the number (e.g. `97XXXXXXX`) |
| `transaction.amount` | number | mandatory | Amount in ZMW |
| `transaction.country` | string | optional | Country code (ZM) |
| `transaction.currency` | string | optional | Currency code (ZMW) |
| `transaction.id` | string | mandatory | Unique transaction ID from our side |

**Response (200 — Payment Initiated):**
```json
{
  "data": {
    "transaction": {
      "id": "dmsuite_txn_abc123def456",
      "status": "SUCCESS"
    }
  },
  "status": {
    "code": "200",
    "message": "SUCCESS",
    "result_code": "ESB000010",
    "response_code": "DP00800001006",
    "success": true
  }
}
```

**Error Responses:**
```json
// 400 — Bad Request (e.g., MSISDN not found)
{
  "status": {
    "response_code": "DP00800001005",
    "code": "400",
    "success": false,
    "message": "Msisdn Not Found"
  }
}

// 500 — System Down
{
  "status": {
    "response_code": "DP00800001005",
    "code": "500",
    "success": false,
    "message": "Something Went Wrong"
  }
}
```

**Collection-Specific Response Codes:**
| Code | Meaning |
|---|---|
| `DP00800001000` | Ambiguous |
| `DP00800001001` | Success |
| `DP00800001002` | Unable to Perform |
| `DP00800001003` | In Progress |
| `DP00800001005` | Not enough balance / MSISDN not found |
| `DP00800001006` | Transaction completed successfully |
| `DP00800001007` | Transaction Declined by user |
| `DP00800001009` | Transaction Timeout by user |
| `DP00800001010` | Transaction not found |
| `DP00800001024` | Transaction under processing |

**Important:** A `200` response with `success: true` means the USSD push was SENT. You MUST verify final status via callback or status check.

---

### 3.3 Transaction Status — Check Payment

```
GET /standard/v1/payments/{id}
Accept: */*
X-Country: ZM
X-Currency: ZMW
Authorization: Bearer <access_token>
```

> **CRITICAL**: "It is recommended to conduct a transaction inquiry at least **three minutes** after the payment API has been called."

**Response (200 — Success):**
```json
{
  "data": {
    "transaction": {
      "airtel_money_id": "C36*******67",
      "id": "83****88",
      "message": "Success",
      "status": "TS"
    }
  },
  "status": {
    "code": "200",
    "message": "Success",
    "result_code": "ESB000010",
    "response_code": "DP00800001006",
    "success": true
  }
}
```

**Response (200 — Failed):**
```json
{
  "data": {
    "transaction": {
      "airtel_money_id": "C36*******67",
      "id": "83****88",
      "status": "TF"
    }
  },
  "status": {
    "response_code": "DP00800001005",
    "code": "200",
    "success": false,
    "message": "FAILED"
  }
}
```

**Status Codes in `data.transaction.status`:**
| Status | Meaning |
|---|---|
| `TS` | Transaction Successful |
| `TF` | Transaction Failed |
| `TA` | Transaction Ambiguous (timeout — verify later) |
| `TIP` | Transaction In Progress |
| `TE` | Transaction Expired |

**`airtel_money_id`** is only returned for successful transactions (`TS`).

---

### 3.4 Refund — Full Refund

```
POST /standard/v1/payments/refund
Accept: */*
Content-Type: application/json
X-Country: ZM
X-Currency: ZMW
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "transaction": {
    "airtel_money_id": "CI************18"
  }
}
```

**Response (200 — Success):**
```json
{
  "data": {
    "transaction": {
      "airtel_money_id": "CI2****29",
      "status": "SUCCESS"
    }
  },
  "status": {
    "code": "200",
    "message": "SUCCESS",
    "result_code": "ESB000010",
    "response_code": "DP00800001006",
    "success": true
  }
}
```

> Refunds use Airtel's `airtel_money_id` (not our transaction ID).

---

### 3.5 Webhook/Callback (Without Authentication)

Airtel sends a `POST` to your configured callback URL when the transaction completes.
URL format: `https://partner_domain/callback_path` — configured in Application settings on the portal.

**Callback Payload:**
```json
{
  "transaction": {
    "id": "BBZMiscxy",
    "message": "Paid ZMW 5,000 to TECHNOLOGIES LIMITED Charge ZMW 140, Trans ID MP210603.1234.L06941.",
    "status_code": "TS",
    "airtel_money_id": "MP210603.1234.L06941"
  }
}
```

**Callback Fields:**
| Field | Type | Required | Description |
|---|---|---|---|
| `transaction.id` | string | mandatory | Our transaction ID (the one we sent) |
| `transaction.message` | string | mandatory | Human-readable description |
| `transaction.status_code` | string | mandatory | `TS` (Success) or `TF` (Failed) |
| `transaction.airtel_money_id` | string | mandatory | Airtel's reference number |

---

### 3.6 Webhook/Callback (WITH Authentication — Recommended)

Same payload as above, but with HMAC-SHA256 hash for verification:

```json
{
  "transaction": {
    "id": "BBZMiscxy",
    "message": "Paid ZMW 5,000 to TECHNOLOGIES LIMITED Charge ZMW 140, Trans ID MP210603.1234.L06941.",
    "status_code": "TS",
    "airtel_money_id": "MP210603.1234.L06941"
  },
  "hash": "zITVAAGYSlzl1WkUQJn81kbpT5drH3koffT8jCkcJJA="
}
```

**Verification Process:**
1. Enable callback authentication in Application settings on portal
2. Copy the private key from Application settings
3. Hash the callback `transaction` object with `HmacSHA256` using the private key
4. Encode result as Base64
5. Compare with the `hash` field in the callback

**Node.js verification example:**
```typescript
import crypto from 'crypto';

function verifyCallbackHash(transaction: object, hash: string, privateKey: string): boolean {
  const data = JSON.stringify(transaction);
  const computed = crypto
    .createHmac('sha256', privateKey)
    .update(data)
    .digest('base64');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}
```

**Your webhook MUST:**
1. Verify HMAC hash matches (if callback auth enabled)
2. Verify the transaction ID matches one you initiated
3. Check `status_code` is `TS` (success)
4. Credit the user's account
5. Return `200 OK` to Airtel
6. Be idempotent (handle duplicate callbacks)

---

## 4. Message Signing (MANDATORY for Zambia)

> **CRITICAL**: Message signing is **MANDATORY** for Zambia (`messageSigningCountries: ["ZM"]`, `messageSigningProducts: [7, 10, 17, 18, 87]`). Collection API (product 7) requires it.

### How Message Signing Works

1. **Generate random AES key** (256 bits) and **IV** (128 bits) using `AES/CBC/PKCS5Padding`
2. **Base64-encode** both key and IV
3. **Fetch RSA public key** from `GET /v1/rsa/encryption-keys` endpoint
4. **Encrypt the request payload** using the AES key+IV → this becomes the `x-signature` header
5. **Concatenate** key and IV with colon: `base64Key:base64IV`
6. **Encrypt** the concatenated key:IV using the RSA public key → this becomes the `x-key` header
7. Send request with both `x-signature` and `x-key` headers

### Encryption Keys Endpoint

```
GET /v1/rsa/encryption-keys
Authorization: Bearer <access_token>
X-Country: ZM
X-Currency: ZMW
```

**Response:**
```json
{
  "data": {
    "key_id": 100,
    "key": "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQ...",
    "valid_upto": "12-08-2024 21:29:26"
  },
  "status": {
    "code": "200",
    "message": "Success",
    "response_code": "DP02010001001",
    "result_code": "ESB000010",
    "success": true
  }
}
```

### RSA Encryption Details
- **Algorithm**: RSA/ECB/PKCS1Padding
- **Key Length**: 1024 bits
- **Purpose**: Encrypt the AES key:IV pair

### Implementation (Node.js / TypeScript)
```typescript
import crypto from 'crypto';

function signRequest(payload: object, rsaPublicKeyBase64: string): { xSignature: string; xKey: string } {
  // 1. Generate random AES-256 key and 128-bit IV
  const aesKey = crypto.randomBytes(32); // 256 bits
  const iv = crypto.randomBytes(16);     // 128 bits
  
  // 2. Base64 encode
  const aesKeyB64 = aesKey.toString('base64');
  const ivB64 = iv.toString('base64');
  
  // 3. Encrypt payload with AES-256-CBC
  const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const xSignature = encrypted; // x-signature header
  
  // 4. Concatenate key:iv
  const keyIv = `${aesKeyB64}:${ivB64}`;
  
  // 5. Encrypt key:iv with RSA public key
  const rsaKey = crypto.createPublicKey({
    key: Buffer.from(rsaPublicKeyBase64, 'base64'),
    format: 'der',
    type: 'spki'
  });
  const xKey = crypto.publicEncrypt(
    { key: rsaKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(keyIv)
  ).toString('base64');
  
  return { xSignature, xKey };
}
```

---

## 5. Required HTTP Headers

| Header | Value | Required | Notes |
|---|---|---|---|
| `Authorization` | `Bearer <token>` | Yes | From OAuth2 endpoint |
| `Content-Type` | `application/json` | Yes | |
| `Accept` | `*/*` | Yes | |
| `X-Country` | `ZM` | Yes | |
| `X-Currency` | `ZMW` | Yes | |
| `x-signature` | `<encrypted_payload>` | Yes (ZM) | AES-encrypted payload (message signing) |
| `x-key` | `<encrypted_key_iv>` | Yes (ZM) | RSA-encrypted AES key:IV |

---

## 6. Error Codes Reference

### Common Error Codes (ROUTER*)
| Code | Description |
|---|---|
| `ROUTER001` | Wallet is not configured |
| `ROUTER003` | Missing header/body params |
| `ROUTER005` | Country route not configured |
| `ROUTER006` | Invalid Country |
| `ROUTER007` | User Not authorized for country |
| `ROUTER112` | Invalid Currency |
| `ROUTER114` | Error while Validating Pin |
| `ROUTER115` | Incorrect Pin |
| `ROUTER116` | Incorrect Encrypted Pin |
| `ROUTER117` | Request Timeout — do transaction enquiry |
| `ROUTER119` | Invalid/Missing Currency |

### Product-Specific Error Codes (ESB*)
| Code | Description |
|---|---|
| `ESB000001` | Something went wrong (ambiguous — do enquiry) |
| `ESB000004` | Error initiating payment (ambiguous — do enquiry) |
| `ESB000008` | Field validation error |
| `ESB000010` | **Success** |
| `ESB000011` | Failed |
| `ESB000014` | Error fetching transaction status |
| `ESB000033` | Invalid MSISDN Length |
| `ESB000034` | Invalid Country Name |
| `ESB000035` | Invalid Currency Code |
| `ESB000036` | Invalid MSISDN Length / doesn't start with 0 |
| `ESB000039` | Vendor not configured for country |
| `ESB000041` | External Transaction ID already exists (duplicate) |
| `ESB000045` | No Transaction Found |

### HTTP Error Codes
| Code | Description |
|---|---|
| `400` | Bad Request — invalid request |
| `401` | Unauthorized — bad API key or token |
| `403` | Forbidden |
| `404` | Not Found — wrong endpoint path |
| `405` | Method Not Allowed |
| `408` | Read Timeout — do transaction enquiry for payments |
| `429` | Too Many Requests — rate limited |
| `500` | Internal Server Error |
| `503` | Service Unavailable — maintenance |

---

## 7. Implementation Plan for DMSuite

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   DMSuite UI    │────▶│  Next.js API      │────▶│  Airtel Zambia  │
│   (React)       │     │  Route Handler    │     │  openapi.       │
│                 │     │                    │     │  airtel.co.zm   │
│  CreditPurchase │     │ /api/payments/    │     │                 │
│  Modal          │     │   airtel/initiate │     │ /merchant/v1/   │
│                 │     │   airtel/webhook  │     │   payments/     │
│                 │     │   airtel/status   │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                        │
                               ▼                        │
                        ┌──────────────┐                │
                        │  Supabase    │◀───────────────┘
                        │  - profiles  │     (webhook callback)
                        │  - credit_   │
                        │    transactions│
                        │  - payment_  │
                        │    orders    │
                        └──────────────┘
```

### New API Routes

| Route | Purpose |
|---|---|
| `POST /api/payments/airtel/initiate` | Start a payment — calls Airtel Collection API |
| `POST /api/payments/airtel/webhook` | Receives Airtel callback — credits user |
| `GET /api/payments/airtel/status/[id]` | Poll transaction status (fallback, wait 3+ min) |

### New Database Table

```sql
CREATE TABLE public.payment_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  provider TEXT NOT NULL DEFAULT 'airtel_money', -- 'airtel_money', 'mtn_money'
  provider_tx_id TEXT,                           -- Airtel's airtel_money_id
  internal_tx_id TEXT UNIQUE NOT NULL,           -- Our unique transaction.id
  pack_id TEXT NOT NULL,                         -- 'starter', 'popular', 'pro', 'agency'
  amount_zmw NUMERIC(10,2) NOT NULL,
  credits INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'initiated',       -- initiated, pending, completed, failed, expired
  phone_number TEXT NOT NULL,
  callback_payload JSONB,
  callback_hash TEXT,                            -- HMAC hash from authenticated callback
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT payment_orders_status_check 
    CHECK (status IN ('initiated', 'pending', 'completed', 'failed', 'expired'))
);

-- Index for webhook lookups (Airtel sends our internal_tx_id back)
CREATE INDEX idx_payment_orders_internal_tx ON payment_orders(internal_tx_id);
-- Index for user history
CREATE INDEX idx_payment_orders_user ON payment_orders(user_id, created_at DESC);
-- Index for status polling
CREATE INDEX idx_payment_orders_status ON payment_orders(status) WHERE status IN ('initiated', 'pending');
-- RLS
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON payment_orders
  FOR SELECT USING (auth.uid() = user_id);
```

### Environment Variables Needed (Vercel)

```
AIRTEL_CLIENT_ID=your_client_id
AIRTEL_CLIENT_SECRET=your_client_secret
AIRTEL_BASE_URL=https://openapiuat.airtel.co.zm    # sandbox
# AIRTEL_BASE_URL=https://openapi.airtel.co.zm     # production
AIRTEL_CALLBACK_PRIVATE_KEY=your_hmac_private_key   # from Application settings (callback auth)
AIRTEL_COUNTRY=ZM
AIRTEL_CURRENCY=ZMW
```

### Files to Create

| File | Purpose |
|---|---|
| `src/lib/airtel/client.ts` | Airtel API client — token caching (180s TTL!), message signing, all endpoints |
| `src/lib/airtel/encryption.ts` | AES/RSA message signing + HMAC callback verification |
| `src/app/api/payments/airtel/initiate/route.ts` | Payment initiation (auth required, rate limited) |
| `src/app/api/payments/airtel/webhook/route.ts` | Webhook handler (no auth, HMAC verification) |
| `src/app/api/payments/airtel/status/[id]/route.ts` | Status polling (auth required) |
| `supabase/migrations/xxx_payment_orders.sql` | Database migration |

---

## 8. Security Considerations

1. **Server-side only** — ALL Airtel API calls from API routes, never client
2. **Message signing MANDATORY** — Zambia requires x-signature/x-key headers on all requests
3. **Callback HMAC verification** — Enable callback auth, verify HmacSHA256 hash
4. **Idempotency** — Handle duplicate webhooks (check if `internal_tx_id` already completed)
5. **Token caching** — Cache OAuth token server-side, refresh at ~150s (expires at 180s!)
6. **RSA key caching** — Cache encryption public key, refresh before `valid_upto` date
7. **Phone validation** — Validate Zambian Airtel numbers (097, 077 prefixes), strip +260
8. **Amount validation** — Server-side validation against known credit pack amounts only
9. **Timeout handling** — If no callback within 5 min, poll status endpoint (wait 3+ min per Airtel docs)
10. **HTTPS only** — Webhook endpoint must be HTTPS (already on Vercel)
11. **Rate limiting** — Don't spam collection endpoint, Airtel returns 429
12. **Duplicate transaction IDs** — `ESB000041` = ID already exists, handle gracefully

---

## 9. What YOU Need to Do (Action Items)

### Step 1: Register on Airtel Developer Portal
1. Go to https://developers.airtel.co.zm/
2. Click **Sign up** — register with your business email
3. Create an **Application** in the dashboard
4. Subscribe to **Collection API** (Product ID: 7)
5. You'll get sandbox `client_id` and `client_secret`
6. **Enable callback authentication** in Application settings
7. **Copy the private key** for HMAC verification
8. **Set callback URL** to `https://dmsuite-iota.vercel.app/api/payments/airtel/webhook`

### Step 2: Business Requirements (for Production)
Airtel requires these for live access:
- **PACRA Registration** — Zambian business registration certificate
- **TPIN Number** — ZRA tax compliance
- **Bank Account** — Settlement account for collected funds
- **KYC Documents** — Director IDs, proof of address
- **Signed Merchant Agreement** — Airtel Zambia's terms
- **Technical Review** — They review your integration
- **Compliance Review** — AML/KYC compliance check

### Step 3: Get Sandbox Credentials
Once registered and approved for sandbox:
- You'll receive `client_id` and `client_secret`
- Test in sandbox environment (`openapiuat.airtel.co.zm`)
- Sandbox simulates the full USSD push flow

### Step 4: Implementation (What I'll Build)
Once you have sandbox credentials, I'll implement:
1. `src/lib/airtel/client.ts` — Airtel API client with 180s token caching
2. `src/lib/airtel/encryption.ts` — Message signing (AES+RSA) + callback HMAC
3. `src/app/api/payments/airtel/initiate/route.ts` — Payment initiation with signing
4. `src/app/api/payments/airtel/webhook/route.ts` — Webhook handler with HMAC verification
5. `src/app/api/payments/airtel/status/[id]/route.ts` — Status polling (3+ min delay)
6. Supabase migration for `payment_orders` table
7. Update `CreditPurchaseModal` — Add Airtel Money payment option
8. Payment confirmation UI with status polling

### Step 5: Test End-to-End
1. Test with sandbox credentials
2. Verify the full flow: initiate → USSD push → PIN → callback → credits
3. Test failure scenarios: timeout, wrong PIN, insufficient balance
4. Test webhook idempotency (duplicate callbacks)
5. Test message signing (required for Zambia)
6. Test callback HMAC verification

### Step 6: Go Live
1. Submit production application to Airtel
2. Pass compliance review
3. Switch `AIRTEL_BASE_URL` to `https://openapi.airtel.co.zm`
4. Deploy and test with real money (small amounts first)

---

## 10. Alternatives Considered & Why Direct is Best

### Option A: Airtel Direct API (RECOMMENDED)
- **Pros:** Full control, no middleman fees, direct settlement, faster
- **Cons:** Requires business onboarding with Airtel, Zambia-specific only
- **Fees:** Airtel merchant fees (~1-3% typically, negotiable)
- **Best for:** DMSuite in Zambia

### Option B: MoneyUnify (Aggregator)
- **URL:** https://moneyunify.one/
- **Pros:** Quick setup, supports MTN + Airtel + Zamtel, minimal KYC
- **Cons:** 3.5% collection fee + 3.5% settlement fee = 7% total, third-party dependency
- **Verdict:** Too expensive — 7% fees eat into your margins

### Option C: FundKit (SDK)
- **URL:** https://fundkit.dev/
- **Pros:** Unified SDK, sandbox testing, multiple providers
- **Cons:** Extra layer, pricing unclear, relatively new (launched 2025)
- **Verdict:** Good development tool, but adds dependency

### Option D: Flutterwave
- **Pros:** Well-known, supports many payment methods
- **Cons:** Not great Zambia support, higher fees, more complexity
- **Verdict:** Better for pan-African, overkill for Zambia-only

### Decision: Go with Option A (Airtel Direct)
- Zero middleman fees
- Full control over the payment flow
- Direct settlement to your bank account
- The exact UX you described (number → prompt → PIN → done)
- Scale to handle thousands of transactions
- Add MTN later with similar direct integration

---

## 11. Credit Pack Pricing (Already Configured)

From `src/data/credit-costs.ts`:

| Pack | Price (ZMW) | Credits | Price/Credit |
|---|---|---|---|
| Starter | K49 | 100 | K0.49 |
| Popular | K199 | 500 | K0.398 |
| Pro | K499 | 1,500 | K0.333 |
| Agency | K1,299 | 5,000 | K0.260 |

These are already built and ready. The Airtel integration just adds the payment method.

---

## 12. Timeline Estimate

| Phase | Status |
|---|---|
| Research & Documentation | ✅ COMPLETE |
| Official API Docs Downloaded | ✅ COMPLETE (705KB, 13 sections) |
| Spec Updated with Real Data | ✅ COMPLETE (this document) |
| Airtel Portal Registration | **YOU** — register at developers.airtel.co.zm |
| Get Sandbox Credentials | **YOU** — after registration approval |
| Build Integration Code | **ME** — once you share sandbox creds |
| Test in Sandbox | Together |
| Apply for Production | **YOU** — business docs to Airtel |
| Go Live | After Airtel production approval |

---

## 13. Bottom Line

This is **100% achievable** and is **the best route** for DMSuite because:

1. **Direct control** — No gateway middleman taking fees
2. **Perfect UX** — User enters number, gets prompt, enters PIN, done
3. **Low fees** — Airtel merchant fees only (~1-3%)
4. **Real-time** — Webhook callbacks + Supabase Realtime = instant credit updates
5. **Reliable** — Airtel's infrastructure, not a third-party aggregator
6. **Scalable** — Same pattern works for MTN Mobile Money later
7. **Secure** — Message signing mandatory for Zambia, HMAC callback verification available

**Your next step:** Go to https://developers.airtel.co.zm/, sign up, create an application, subscribe to Collection API (Product 7), and get sandbox credentials. Share the `client_id`, `client_secret`, and callback private key with me and I'll build the entire integration.

---

## Appendix A: Full API Documentation Source

All data in this spec was verified from `airtel-zambia-full-api-docs (3).json` (705,796 bytes), downloaded directly from the Airtel Zambia Developer Portal Angular SPA via XHR interceptor. Contains 13 complete API sections:

1. `_index` — Product catalog (47 products)
2. `Collection-APIs` — USSD Push, Refund, Transaction Enquiry, Callbacks
3. `Disbursement-APIs` — Disbursement, Status, Callbacks
4. `Cash-In-APIs` — Cash-In, Status, Callbacks
5. `Cash-Out-APIs` — Cash-Out, Status, Callbacks
6. `KYC` — User verification
7. `Account` — Account balance
8. `Remittance-APIs` — Cross-border remittance
9. `TopUp-Notification` — Airtel topup callbacks
10. `ATM-Withdrawal` — ATM cashout
11. `Authorization` — OAuth2 token endpoint
12. `Encryption` — Pin encryption, callback encryption, message signing, RSA keys
13. `Error Codes` — Common, product-specific, and HTTP error codes
