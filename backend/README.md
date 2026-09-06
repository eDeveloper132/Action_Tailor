# Action Tailor - Backend API / اے پی آئی سرور

> Centralized Node.js, Express 5, and TypeScript REST API server with Socket.IO real-time events, MongoDB data layer, and Role-Based Access Control (RBAC).

---

## 🏗️ Architecture & Core Components

```text
backend/
├── config/             # Database connection (Mongoose) and app settings
├── controllers/        # Route controllers (Auth, Customers, Measurements, Orders, Payments, Staff)
├── middlewares/        # Authentication, RBAC authorization, and validation middlewares
├── models/             # Mongoose schemas (User, CustomerProfile, MeasurementProfile, Order, Payment, etc.)
├── routes/             # Express API route declarations
├── seeds/              # Database seeder with sample Pakistani tailor shop data
├── services/           # Business logic services
├── sockets/            # Socket.IO handlers for real-time order status updates
├── types/              # TypeScript interface definitions
├── utils/              # Helper utilities (Pakistani phone normalization, JWT generator)
├── .env.example        # Environment variable template
├── .gitignore          # Backend ignore rules
├── index.ts            # Application entrypoint & HTTP server
├── package.json        # NPM dependencies & scripts
└── tsconfig.json       # TypeScript configuration
```

---

## 🔒 Security & Authorization Model

Authentication is fully centralized in the backend. Frontends only display UI based on user role, while all data boundaries are enforced server-side:

- **JWT Authentication (`middlewares/auth.ts`)**:
  - `protect`: Verifies the `Bearer <token>` from Authorization headers or HTTP-only cookies.
  - `authorize(...roles)`: Restricts endpoints to authorized roles (`admin`, `manager`, `staff`). Customer tokens attempting to invoke administrative endpoints are rejected with HTTP 403 Forbidden.
  - `verifyCustomerOwnership`: Ensures a customer can only read or query orders and measurements tied to their own verified `customerId`.

---

## 📱 Pakistani Phone Normalization

Pakistani phone numbers vary widely in customer input:
- `+92 300 1234567`
- `0300-1234567`
- `923001234567`
- `0300 123 4567`

The normalization utility (`utils/phoneNormalizer.ts`) converts all valid inputs into standard canonical format: `03001234567`.
- Primary customer search queries utilize indexed normalized phone numbers for sub-millisecond lookups.
- Unique constraints prevent duplicate customer accounts caused by formatting differences.

---

## 📏 Garment-Specific Measurements & Snapshot Immutability

Tailoring measurements are tied to specific garments rather than a generic customer record:
- Supported garments: `Shalwar Qameez / شلوار قمیض`, `Kurta Pajama / کرتا پاجامہ`, `Pant / پینٹ`, `Coat / کوٹ`, `Waistcoat / واسکٹ`, `Sherwani / شیروانی`.
- **Garment Profiles (`MeasurementProfile`)**: A customer can have separate, independent measurement records for each garment type.
- **Order Snapshot Immutability**:
  - When an order is placed, an immutable snapshot of the garment measurements is written into the `Order.measurementSnapshot` field.
  - If a customer's active measurement profile is updated later for a subsequent suit, older orders maintain their exact historical measurements.

---

## ⚙️ Environment Variables

Create `.env` inside the `backend/` directory:

| Variable | Default / Example | Description |
|---|---|---|
| `PORT` | `5000` | HTTP & WebSocket server port |
| `NODE_ENV` | `development` | Node environment (`development` / `production`) |
| `MONGO_URI` | `mongodb://localhost:27017/action_tailor` | MongoDB connection string |
| `CORS_ORIGIN` | `http://localhost:3001,http://localhost:3002` | Allowed CORS origins for frontend apps |
| `ADMIN_FRONTEND_URL` | `http://localhost:3001` | URL of the Admin/Staff frontend |
| `CUSTOMER_FRONTEND_URL` | `http://localhost:3002` | URL of the Customer frontend |
| `JWT_SECRET` | `secret_key_change_in_production` | Secret key used to sign JWT tokens |
| `JWT_EXPIRES_IN` | `7d` | Token validity duration |

---

## 🚀 Scripts

```bash
# Start development server with live reload (tsx watch)
npm run dev

# Run TypeScript compilation check
npm run typecheck

# Seed database with sample Pakistani tailor shop data
npm run seed

# Run server in production mode
npm start
```
