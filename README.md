# Action Tailor (ایکشن ٹیلرز)

A modern, full-stack Pakistani tailor shop management system architected with a decoupled multi-project structure:
- **Shared Express.js Backend API & Socket.IO Server** (Port `5000`)
- **Dedicated Admin & Shop Staff Management Frontend** (Port `3001`)
- **Dedicated Customer Portal & Suit Tracking Frontend** (Port `3002`)
- **Shared MongoDB / Mongoose Database** with authentic Pakistani tailoring domain models
- **Shared JWT Authentication & RBAC Authorization** with IDOR protections

---

## 🏛️ System Architecture

```
Action-Tailor/
├── backend/                       # Shared Express 5 REST API & Socket.IO (Port 5000)
│   ├── config/                    # MongoDB connection manager (db.ts)
│   ├── controllers/               # Controllers (customer, dashboard, measurement, order, payment)
│   ├── middlewares/               # Auth, RBAC, logger, and error handlers
│   ├── models/                    # Mongoose Models (User, CustomerProfile, MeasurementProfile, Order, etc.)
│   ├── routes/                    # REST API Routes (/api/auth, /api/orders, /api/customers, etc.)
│   ├── services/                  # Tailoring Business Logic & Mongoose Aggregations
│   ├── sockets/                   # Real-time Socket.IO server & event broadcasters
│   ├── types/                     # TypeScript tailoring domain types
│   ├── utils/                     # JWT signing and verification
│   ├── seeds/                     # Authentic Pakistani dummy data seeder
│   └── index.ts                   # Backend entry point
│
├── frontend-admin/                # Dedicated Master Tailor & Staff App (Port 3001)
│   ├── index.html                 # Master Tailor Desk (Real-time operational dashboard)
│   ├── signin.html                # Staff / Admin sign-in (strictly enforces admin/staff role)
│   ├── orders.html                # Orders queue & status progression (Cutting -> Stitching -> Ready)
│   ├── new-order.html             # 5-step suit booking studio with measurement snapshots
│   ├── customers.html             # Customer directory with WhatsApp integration
│   ├── measurements.html          # Measurement studio for body profiles
│   ├── profile.html               # Staff credentials & permissions
│   ├── src/                       # CSS styles, TS modules, and reusable UI components
│   └── vite.config.ts             # Vite multi-page config with proxy to backend :5000
│
├── frontend-customer/             # Dedicated Customer App (Port 3002)
│   ├── index.html                 # Customer Portal (Urdu greeting, live progress stepper, ready alerts)
│   ├── signin.html                # Customer sign-in
│   ├── signup.html                # Registration with live password rule validation
│   ├── profile.html               # Customer account profile & sign-out
│   ├── src/                       # CSS styles, TS modules, and reusable UI components
│   └── vite.config.ts             # Vite multi-page config with proxy to backend :5000
│
├── shared/                        # Shared TypeScript Domain Types
│   └── types/                     # tailoring.types.ts, index.ts
│
├── scripts/
│   └── dev.ts                     # Multi-process concurrent dev runner
└── package.json                   # Root workspace orchestrator
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24)
- **MongoDB**: Connection string in `.env` (or local MongoDB on `mongodb://127.0.0.1:27017/action_tailor`)

### 2. Environment Setup
The `.env` file in root or `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/action_tailor
CORS_ORIGIN=*
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
```

### 3. Seed Demo Data
Populate authentic Pakistani tailoring test data (Master Tailor, Staff Cutter, Customers, Suits, Measurements):
```bash
npm run seed
```

Default credentials seeded:
| Portal | Email | Password | Role |
|---|---|---|---|
| **Admin Desk (Port 3001)** | `admin@actiontailor.pk` | `Password123` | Master Tailor (Admin) |
| **Admin Desk (Port 3001)** | `staff@actiontailor.pk` | `Password123` | Karigar (Staff) |
| **Customer Portal (Port 3002)** | `tariq@gmail.com` | `Password123` | Customer |
| **Customer Portal (Port 3002)** | `bilal@gmail.com` | `Password123` | Customer |

### 4. Start All Services Concurrently
Run the complete ecosystem with a single command:
```bash
npm run dev
```

This concurrently launches:
- **Backend API**: `http://localhost:5000`
- **Admin & Staff Portal**: `http://localhost:3001`
- **Customer Portal**: `http://localhost:3002`

---

## 🛠️ Individual Commands

| Command | Description |
|---|---|
| `npm run dev` | Starts Backend, Admin, and Customer frontends concurrently |
| `npm run dev:backend` | Starts only the Express.js Backend API (`:5000`) |
| `npm run dev:admin` | Starts only the Admin Frontend with Vite (`:3001`) |
| `npm run dev:customer` | Starts only the Customer Frontend with Vite (`:3002`) |
| `npm run build` | Builds production bundles for both frontends |
| `npm run typecheck` | Strict TypeScript verification across all projects |
| `npm run seed` | Runs the database seeder |

---

## 🧵 Pakistani Tailoring Domain Features

- **Garment Categories**: Shalwaar Qameez (شلوار قمیض), Kurta Pajama (کرتہ پاجامہ), Waistcoat (واسکٹ), Shirt & Trouser (شرٹ اور پینٹ), Sherwani (شیروانی), and Safari Suit.
- **Detailed Measurements**: Lambai (لمبائی), Teera (تیرا), Chhaati (چھاتی), Kamar (کمر), Hip (ہپ), Bazu (بازو), Collar (کالر), Cuff (کف), Ghera (گھیرا), Paincha (پائینچہ), Aasan (آسن).
- **Design Options**: Ban collar, Chinese collar, Soft collar, Single/Double button cuffs, Round (گول) or Straight (چورس) Daman, Simple shalwaar, Trouser pajama.
- **Financial Balances**: Pre-save Mongoose calculation for stitching + fabric costs, advance payments, and remaining balance tracking.
- **Real-Time WebSockets**: Live order creation, cutting/stitching status advancement, and celebratory "Ready for Pickup" notifications powered by Socket.IO.

