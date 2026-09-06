# Action Tailor / ایکشن ٹیلرز

> Modern, fast, and secure multi-application ERP and Customer Self-Service Portal tailored for Pakistani tailoring businesses.
> پاکستانی درزیوں اور کسٹمرز کے لیے جدید، محفوظ اور تیز رفتار درزی شاپ مینجمنٹ سسٹم۔

---

## 📌 Architecture Overview / پروجیکٹ کا ڈھانچہ

Action Tailor is built as a decoupled, multi-application system designed for real-world tailoring shop operations and customer transparency:

```text
Action-Tailor/
├── backend/            # Centralized Node.js + Express 5 + MongoDB REST API & Socket.IO (Port 5000)
├── admin-panel/        # Tailor Shop Management Frontend for Admin, Manager & Staff (Port 3001)
├── customer-panel/     # Lightweight Customer Self-Service Portal for Customers (Port 3002)
├── .gitignore          # Root-level ignore rules for node_modules, build outputs, logs, envs
└── README.md           # Master Project Documentation
```

### Decoupled Security Boundary
- **Centralized Authentication**: All authentication logic and token issuance reside strictly in `backend`.
- **Role-Based Access Control (RBAC)**: Supports `ADMIN`, `MANAGER`, `STAFF`, and `CUSTOMER`.
- **Strict Separation**: Frontend role checks are purely for UI rendering. Backend authorization middleware (`protect`, `authorize`, `verifyCustomerOwnership`) strictly enforces data boundaries. Customers cannot access admin APIs, shop-wide revenue, or other customer records.

---

## ✨ Key Features / اہم خصوصیات

1. **Bilingual User Interface (`English / اردو`)**:
   - Consistent dual-language typography throughout both frontend portals (`Login / لاگ ان کریں`, `Orders / آرڈرز`, `Measurements / ناپ`, `Ready / تیار`, etc.).
2. **Pakistani Phone Number Normalization**:
   - Automatically cleans and standardizes phone formats (`+92 300 1234567`, `0300-1234567`, `923001234567`) to canonical `03xxxxxxxxx`.
   - Indexed in MongoDB with duplicate rejection to prevent redundant customer profiles.
3. **Garment-Specific Measurements**:
   - Supports independent measurement profiles per customer per garment (e.g., `Shalwar Qameez / شلوار قمیض`, `Kurta Pajama / کرتا پاجامہ`, `Pant / پینٹ`, `Coat / کوٹ`).
   - Garment selection immediately checks for previous measurements:
     - `Previous Measurement Found / پچھلا ناپ موجود ہے` → `Use Existing / پرانا ناپ استعمال کریں` or `Edit Measurement / ناپ میں ترمیم کریں`.
     - `No Previous Measurement / پچھلا ناپ موجود نہیں` → Enter new measurement dimensions.
4. **Order Measurement Snapshot Immutability**:
   - When an order is placed, an immutable snapshot of the garment measurements is embedded into the order document.
   - Any future modifications to the customer's active measurement profile do not tamper with past or in-progress orders.
5. **Streamlined 4-Step Fast Order Booking**:
   - Designed for rapid shop counter workflow:
     1. Search customer by phone number or name.
     2. Select garment type with automatic measurement loading.
     3. Adjust dimensions if needed (Length, Shoulder, Chest, Sleeve, Collar, Daman, Paincha, Aasan).
     4. Set stitching details, delivery date, advance payment, and generate order.
6. **Thermal Receipt Slips**:
   - Ready-to-print compact 80mm / A4 receipts with bilingual shop headers, customer details, measurements, and payment breakdown.

---

## 🚀 Quick Start & Installation / انسٹالیشن گائیڈ

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **MongoDB**: Local MongoDB instance running on `mongodb://localhost:27017` or MongoDB Atlas URI
- **Git**: For version control

---

### 1. Backend Setup (`/backend`)

```bash
cd backend
npm install
```

Configure the environment file:
```bash
cp .env.example .env
```

Ensure `.env` contains your settings:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/action_tailor
CORS_ORIGIN=http://localhost:3001,http://localhost:3002
ADMIN_FRONTEND_URL=http://localhost:3001
CUSTOMER_FRONTEND_URL=http://localhost:3002
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
```

Seed initial master tailor data, staff users, test customers, and sample orders:
```bash
npm run seed
```

Start the backend API development server:
```bash
npm run dev
# Server will run on http://localhost:5000
```

---

### 2. Admin & Staff Management Panel Setup (`/admin-panel`)

```bash
cd admin-panel
npm install
npm run dev
# Development server will run on http://localhost:3001
```

---

### 3. Customer Self-Service Panel Setup (`/customer-panel`)

```bash
cd customer-panel
npm install
npm run dev
# Development server will run on http://localhost:3002
```

---

## 👥 Default Seed Credentials / لاگ ان تفصیلات

After running `npm run seed` in the `backend/` folder, the following test accounts are available:

| Role / عہدہ | Name / نام | Email / ای میل | Password / پاس ورڈ | Target Application |
|---|---|---|---|---|
| **ADMIN (Master Tailor)** | Ustad Aslam / استاد اسلم | `admin@actiontailor.pk` | `Password123` | Admin Panel (`:3001`) |
| **MANAGER** | Manager Farhan / منیجر فرحان | `manager@actiontailor.pk` | `Password123` | Admin Panel (`:3001`) |
| **STAFF (Karigar/Cutter)** | Karigar Rasheed / کاریگر رشید | `staff@actiontailor.pk` | `Password123` | Admin Panel (`:3001`) |
| **CUSTOMER** | Tariq Mehmood / طارق محمود | `tariq@gmail.com` | `Password123` | Customer Panel (`:3002`) |
| **CUSTOMER** | Zubair Ahmed / زبیر احمد | `zubair@gmail.com` | `Password123` | Customer Panel (`:3002`) |

---

## 📡 Core API Endpoints / بنیادی اے پی آئی

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new customer user account.
- `POST /api/auth/login` — Central login endpoint for all roles.
- `GET /api/auth/me` — Current authenticated user profile.
- `POST /api/auth/logout` — Invalidate session / clear auth cookie.

### Customer Management (`/api/customers`) — *Admin, Manager, Staff*
- `GET /api/customers` — Search & list customer records (with phone normalization).
- `POST /api/customers` — Create customer profile with duplicate prevention.
- `GET /api/customers/:id` — Get customer profile with active garment measurements.
- `PUT /api/customers/:id` — Update customer information.

### Measurements (`/api/measurements`)
- `GET /api/measurements/customer/:customerId/garment/:garmentType` — Retrieve garment-specific measurement profile.
- `POST /api/measurements` — Create or update garment-specific measurement profile.
- `GET /api/measurements/my-measurements` — Customer retrieves their own measurement profiles.

### Orders (`/api/orders`)
- `POST /api/orders` — Create order with immutable measurement snapshot and payment record.
- `GET /api/orders` — List shop orders (Admin/Staff) or customer's own orders (Customer).
- `GET /api/orders/:id` — Retrieve detailed order by ID (with authorization checks).
- `PATCH /api/orders/:id/status` — Advance order status (`pending` → `cutting` → `stitching` → `ready` → `delivered`).
- `POST /api/orders/:id/payments` — Record partial or full payment.

---

## 🛠️ Build & Verification / ٹیسٹنگ اور بلڈ

Run typechecking and production builds:

```bash
# Backend TypeScript check
cd backend && npm run typecheck

# Admin Panel production build
cd ../admin-panel && npm run build

# Customer Panel production build
cd ../customer-panel && npm run build
```

---

## 📄 License

Proprietary tailoring management system for Action Tailor. All rights reserved.
