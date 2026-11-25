# Z-Banking

Z-Banking is a Node.js and Express REST API for basic banking operations. It uses MongoDB with Mongoose for persistence, JWTs for authentication, bcrypt for password hashing, and Gmail OAuth2 with Nodemailer for notification emails.

The API currently supports:

- User registration and login
- Password-based authentication
- Cookie and bearer-token authentication
- Logout with server-side token blacklisting
- Creating and listing bank accounts
- Calculating account balances from ledger entries
- Recording debit and credit transactions
- Idempotent transaction requests
- MongoDB sessions for atomic ledger updates
- System-user initial-funds operations
- Registration, login, and transaction notification emails

## Technology Stack

| Component | Technology |
| --- | --- |
| Runtime | Node.js |
| Web framework | Express 5 |
| Database | MongoDB |
| ODM | Mongoose 9 |
| Authentication | JSON Web Tokens |
| Password hashing | bcryptjs |
| Cookies | cookie-parser |
| Configuration | dotenv |
| Email | Nodemailer with Gmail OAuth2 |
| Development runner | Nodemon |

## Project Structure

```text
z-banking/
|-- server.js                         # Loads configuration, connects MongoDB, starts the API
|-- src/
|   |-- app.js                        # Express application and route registration
|   |-- config/
|   |   `-- db.js                     # MongoDB connection configuration
|   |-- controllers/
|   |   |-- auth.controllers.js       # Registration, login, and logout actions
|   |   |-- acc.controller.js         # Account creation and balance actions
|   |   `-- transcation.controller.js # Transfer and initial-funds actions
|   |-- middlewares/
|   |   `-- auth.middleware.js        # JWT, blacklist, and system-user middleware
|   |-- models/
|   |   |-- account.model.js          # Bank account model and balance aggregation
|   |   |-- blacklist.model.js        # Blacklisted JWT model
|   |   |-- ledger.model.js           # Immutable debit and credit entries
|   |   |-- transcation.model.js      # Transaction records
|   |   `-- user.model.js             # User and credential model
|   |-- routes/
|   |   |-- acc.routes.js             # Account API endpoints
|   |   |-- auth.routes.js            # Authentication API endpoints
|   |   `-- transcation.routes.js     # Transaction API endpoints
|   `-- services/
|       `-- email.service.js          # Gmail OAuth2/Nodemailer email service
|-- .gitignore
|-- package.json
`-- package-lock.json
```

## Prerequisites

- Node.js 18 or newer is recommended
- npm
- A reachable MongoDB deployment
- A Gmail account configured for OAuth2, if email notifications are required
- A JWT signing secret

Nodemon is listed in the development script but is not declared in `package.json`. Install it locally if you want to use `npm run dev`:

```powershell
npm install --save-dev nodemon
```

## Installation

Clone the repository and install dependencies:

```powershell
git clone <repository-url>
cd z-banking
npm install
```

Create a `.env` file in the repository root:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/z-banking
JWT_SECRET=replace-with-a-long-random-secret

EMAIL_USER=your-email@gmail.com
CLIENT_ID=your-google-oauth-client-id
CLIENT_SECRET=your-google-oauth-client-secret
REFRESH_TOKEN=your-google-oauth-refresh-token
```

The `.env` file is ignored by Git.

### Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB connection string used by Mongoose |
| `JWT_SECRET` | Yes | Secret used to sign and verify JSON Web Tokens |
| `EMAIL_USER` | Email only | Gmail address used as the email sender |
| `CLIENT_ID` | Email only | Google OAuth2 application client ID |
| `CLIENT_SECRET` | Email only | Google OAuth2 application client secret |
| `REFRESH_TOKEN` | Email only | Google OAuth2 refresh token |

## Running the Server

Run without a development watcher:

```powershell
node server.js
```

Run with Nodemon after it is installed:

```powershell
npm run dev
```

The server listens on port `3000`:

```text
http://localhost:3000
```

MongoDB connection is attempted before the HTTP server starts accepting application requests.

## Authentication

Authentication uses a JWT. The API accepts the token through:

1. The `token` HTTP cookie, or
2. an `Authorization: Bearer <token>` header

After login or registration, the API sets a `token` cookie and also returns the token in the JSON response. Tokens are configured to expire after three days.

Passwords are hashed with a bcrypt cost factor of 10 before a user is stored. Passwords are excluded from normal Mongoose queries.

Logout adds the presented token to the token blacklist collection. The blacklist collection uses a 30-day TTL index in its intended configuration.

## Base URL and Routes

| Area | Route prefix |
| --- | --- |
| Authentication | `/api/auth` |
| Accounts | `/api/account` |
| Transactions | `/api/transcations` |

The transaction route prefix contains the exact project spelling `transcations`, not `transactions`.

## API Reference

### Authentication Endpoints

#### Register a user

```http
POST /api/auth/register
Content-Type: application/json
```

Request body:

```json
{
  "name": "Samir",
  "email": "samir@example.com",
  "password": "secret123"
}
```

Success response: `201 Created`

```json
{
  "user": {
    "_id": "<user-id>",
    "email": "samir@example.com",
    "name": "Samir"
  },
  "token": "<jwt>"
}
```

Possible errors:

- `422 Unprocessable Entity` if the email is already registered
- Mongoose validation errors for an invalid email, missing name, or short password

After successful registration, the service attempts to send a welcome email.

#### Log in

```http
POST /api/auth/login
Content-Type: application/json
```

Request body:

```json
{
  "email": "samir@example.com",
  "password": "secret123"
}
```

Success response: `200 OK`, containing the public user fields and JWT.

Failure response: `401 Unauthorized` if the account does not exist or the password is invalid.

After login, the service attempts to send a login notification email.

#### Log out

```http
POST /api/auth/logout
Authorization: Bearer <jwt>
```

Or provide the `token` cookie.

Success response: `200 OK`

```json
{
  "message": "User logged-out Successfully"
}
```

Missing token:

```json
{
  "message": "Cannot logout"
}
```

### Account Endpoints

All account endpoints require authentication.

#### Create an account

```http
POST /api/account
Authorization: Bearer <jwt>
```

No request body is required. The account is intended to be associated with the authenticated user.

Success response: `201 Created`

```json
{
  "account": {
    "_id": "<account-id>",
    "user": "<user-id>",
    "status": "ACTIVE",
    "currency": "NPR",
    "createdAt": "<timestamp>",
    "updatedAt": "<timestamp>"
  }
}
```

#### List authenticated user's accounts

```http
GET /api/account
Authorization: Bearer <jwt>
```

Success response: `200 OK`

```json
{
  "accounts": [
    {
      "_id": "<account-id>",
      "user": "<user-id>",
      "status": "ACTIVE",
      "currency": "NPR"
    }
  ]
}
```

#### Get account balance

```http
GET /api/account/balance/<account-id>
Authorization: Bearer <jwt>
```

Success response: `200 OK`

```json
{
  "accountId": "<account-id>",
  "balance": 500
}
```

The account must belong to the authenticated user. A missing account is returned as `404 Not Found`.

### Transaction Endpoints

All transaction endpoints require authentication.

#### Create a transaction

```http
POST /api/transcations
Authorization: Bearer <jwt>
Content-Type: application/json
```

Request body:

```json
{
  "fromAccount": "<source-account-id>",
  "toAccount": "<destination-account-id>",
  "amount": 100,
  "idempotencyKey": "transfer-2026-11-25-001"
}
```

Required fields:

| Field | Type | Description |
| --- | --- | --- |
| `fromAccount` | ObjectId string | Source account |
| `toAccount` | ObjectId string | Destination account |
| `amount` | number | Positive transfer amount |
| `idempotencyKey` | string | Unique retry key for the transfer |

The idempotency key is unique and prevents duplicate transaction records for the same logical operation.

The transfer flow is:

1. Validate required fields and account existence.
2. Check for an existing transaction with the idempotency key.
3. Verify account status.
4. Calculate the source account balance from ledger entries.
5. Reject insufficient funds.
6. Start a MongoDB transaction.
7. Create the transaction record with `PENDING` status.
8. Insert a debit ledger entry for the source account.
9. Insert a credit ledger entry for the destination account.
10. Mark the transaction `COMPLETED`.
11. Commit the MongoDB transaction.
12. Attempt to send a notification email.

Transaction records use these states:

| State | Meaning |
| --- | --- |
| `PENDING` | The transaction is awaiting or in progress |
| `COMPLETED` | Both ledger entries and the transaction status were committed |
| `FAILED` | The transfer failed |
| `REVERSED` | The transfer was reversed |

#### Create initial funds

```http
POST /api/transcations/system/initial-funds
Authorization: Bearer <jwt>
Content-Type: application/json
```

Request body:

```json
{
  "toAccount": "<destination-account-id>",
  "amount": 1000,
  "idempotencyKey": "initial-funds-001"
}
```

This endpoint is guarded by a system-user middleware in addition to JWT authentication. It is intended for adding initial funds to an account.

## Data Models

### User

The `user` collection stores:

- `email`: required, trimmed, lowercased, validated, and unique
- `name`: required
- `password`: required, bcrypt-hashed, minimum six characters, excluded from normal queries
- `systemUser`: boolean flag, immutable, excluded from normal queries
- `createdAt` and `updatedAt`

The password and system-user fields are not selected by normal Mongoose queries. Password matching is implemented by the `comparePassword` model method.

### Account

The `account` collection stores:

- `user`: required reference to a user
- `status`: `ACTIVE`, `FROZEN`, or `CLOSED`; defaults to `ACTIVE`
- `currency`: required; defaults to `NPR`
- `createdAt` and `updatedAt`

Indexes are defined for the user reference and for the user/status combination.

### Ledger

The `ledger` collection is the accounting source of truth. Each entry contains:

- `account`: immutable account reference
- `amount`: immutable amount
- `transcation`: immutable reference to the transaction
- `type`: immutable `CREDIT` or `DEBIT`

The ledger model contains hooks intended to prevent modification or deletion, while account balances are calculated by aggregating the entries:

```text
balance = sum(CREDIT amounts) - sum(DEBIT amounts)
```

An account with no ledger entries has a balance of `0`.

### Transaction

The `transcation` collection stores:

- `fromAccount`: source account reference
- `toAccount`: destination account reference
- `status`: `PENDING`, `COMPLETED`, `FAILED`, or `REVERSED`
- `amount`: required non-negative number
- `idempotencyKey`: required unique string
- `createdAt` and `updatedAt`

Indexes are applied to account references and the idempotency key.

### Token Blacklist

The `tokenblacklist` collection stores:

- `token`: required unique JWT string
- `createdAt` and `updatedAt`

The model defines an index intended to expire records after 30 days.

## Email Notifications

Email delivery uses Gmail OAuth2 through Nodemailer. The service sends:

- Welcome email after registration
- Login notification after successful login
- Transaction notification after a transaction
- Transaction failure notification through an exported service function

The email service logs delivery information and failures. It does not make authentication or transaction endpoints return an email-delivery error.

## Database Connection

`src/config/db.js` calls `mongoose.connect(process.env.MONGO_URI)`. DNS resolution is configured to use Google's `8.8.8.8` and `8.8.4.4` DNS servers.

On successful connection, the application logs `Connected to Database`. On failure, it logs the error and exits the process with status code `1`.

## Security Notes

- Use a strong, unique `JWT_SECRET`.
- Use a strong password for MongoDB and restrict network access to trusted hosts.
- Store `.env` outside source control.
- Serve the API over HTTPS in production.
- Configure cookie options such as `httpOnly`, `secure`, and `sameSite` before exposing the API to untrusted clients.
- Add explicit authorization checks to ensure a user can only transfer from accounts they own.
- Add server-side validation for positive transfer amounts and account status.
- Protect transaction and account endpoints with rate limiting in production.
- Restrict system-user operations to trusted identities and an appropriate role model.
- Do not expose JWT values in application logs.

## Current Implementation Notes

The repository is under active implementation and has several known issues that should be corrected before production use:

- The JWT payload uses `userID`, while authentication middleware reads `userId`; authentication currently may not locate users correctly.
- Account creation contains `user_.id` instead of `req.user._id`.
- Account-status validation compares account documents to the strings `"ACTIVE"` and is not correct.
- The initial-funds controller references an undefined `fromAccount` when creating the debit ledger entry.
- Initial-funds account lookup currently assumes the system user already has an account and does not clearly identify a system funding account.
- The system-user middleware contains a syntax problem around `. select` and a variable mismatch for `systemUser`.
- Several transaction and email code paths use the misspelled project term `transcation`; this is preserved in routes, models, and controller names for API and code compatibility.
- An idempotency-key check compares a Mongoose document to status strings instead of comparing `isTranscationAlreadyExists.status`.
- Transaction amount validation uses `0` in the schema but allows zero according to MongoDB min validation semantics; additional positive-number validation is recommended.
- The normal transaction handler should verify that `fromAccount` belongs to `req.user`.
- MongoDB transaction catch and rollback handling is incomplete. A failed transaction should abort the session explicitly, mark the transaction failed, and preserve `PENDING`/`FAILED` state consistently.
- The logout controller calls `res.cookies(...)` as well as `res.clearCookie(...)`; `res.cookies` is not an Express response method.
- The email failure and transaction email templates contain undefined `fromAccount` references and malformed closing HTML tags.
- The blacklist TTL index uses `expireAfterSeonds`, but Mongoose/MongoDB expects `expireAfterSeconds`.
- No automated test suite or lint configuration is included.
- The package script `test` intentionally exits with an error because no test suite has been configured.
- No centralized error-handling middleware is implemented, so database and validation exceptions may escape as unstructured HTTP responses.

## Development Recommendations

Before treating Z-Banking as production-ready:

1. Repair the authentication payload and middleware naming.
2. Add account ownership authorization.
3. Correct account creation and system-user middleware.
4. Implement explicit transaction rollback and failure handling.
5. Use positive amount validation.
6. Repair email templates and delivery error handling.
7. Add integration tests for auth, account, and transfer flows.
8. Add a Jest or Node test runner and `npm test` command.
9. Add centralized validation and error middleware.
10. Configure secure cookie defaults and CORS requirements.
11. Add request logging and health/readiness endpoints.
12. Add API documentation generated from an OpenAPI specification.

## Example cURL Workflow

Register:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Samir\",\"email\":\"samir@example.com\",\"password\":\"secret123\"}"
```

Create an account:

```bash
curl -X POST http://localhost:3000/api/account \
  -H "Authorization: Bearer <jwt>"
```

List accounts:

```bash
curl http://localhost:3000/api/account \
  -H "Authorization: Bearer <jwt>"
```

Get a balance:

```bash
curl http://localhost:3000/api/account/balance/<account-id> \
  -H "Authorization: Bearer <jwt>"
```

Create a transfer:

```bash
curl -X POST http://localhost:3000/api/transcations \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d "{\"fromAccount\":\"<source-id>\",\"toAccount\":\"<destination-id>\",\"amount\":100,\"idempotencyKey\":\"transfer-001\"}"
```

Log out:

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <jwt>"
```

## Package Scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `npm run dev` | `nodemon server.js` | Start the API with a development watcher |
| `npm test` | Placeholder command | Currently exits with `Error: no test specified` |

## License

The package metadata declares ISC as the license.
