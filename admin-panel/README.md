# Action Tailor - Admin & Staff Management Panel / ایڈمن و عملہ پورٹل

> Standalone frontend application built for tailor shop owners, managers, and karigars (cutters & stitchers) to operate the tailoring shop efficiently.

---

## 🎯 Purpose & Scope

This application is dedicated exclusively to **tailor shop operations**. It does NOT contain customer dashboard views, preserving complete operational focus and business security:

- **Roles Supported**: `ADMIN` (Shop Owner/Master Tailor), `MANAGER`, `STAFF` (Karigar/Cutter).
- **Default Port**: `http://localhost:3001`
- **Bilingual Interface**: Seamless `English / اردو` typography across all workflows.

---

## ⚡ Key Workflows & Features

### 1. 4-Step Fast Order Booking Wizard (`new-order.html`)
Optimized for rapid Pakistani tailor shop counter operations:
1. **Search Customer**: Look up by normalized Pakistani mobile number (`03001234567`) or name. Quick-create new customer if not found.
2. **Select Garment & Detect Measurements**:
   - Choose garment (`Shalwar Qameez / شلوار قمیض`, `Kurta Pajama / کرتا پاجامہ`, `Pant / پینٹ`, `Coat / کوٹ`, etc.).
   - Instant query checks if customer has existing measurements on file for this specific garment:
     - **Found**: Shows `Previous Measurement Found / پچھلا ناپ موجود ہے` badge. Allows `Use Existing / پرانا ناپ استعمال کریں` or `Edit Measurement / ناپ میں ترمیم کریں`.
     - **Not Found**: Shows `No Previous Measurement / پچھلا ناپ موجود نہیں` notice.
3. **Review / Edit Dimensions**:
   - Length / لمبائی, Shoulder / کندھا, Chest / چھاتی, Sleeve / آستین, Collar / کالر, Daman / دامن, Paincha / پانچہ, Aasan / آسن.
4. **Order Details & Advance Payment**:
   - Set tailoring instructions, expected delivery date, total price, and advance payment.

### 2. Order Management & Stage Tracking (`orders.html`)
- Filter orders by stage: `Pending / زیر التوا`, `Cutting / کٹائی`, `Stitching / سلائی`, `Ready / تیار`, `Delivered / حوالے کیا گیا`.
- Advance order status through the workshop lifecycle.
- Record incremental payments and view remaining balances.
- **Thermal Slip Printing**: One-click printable 80mm bilingual thermal receipt slip with customer information, measurements, and billing summary.

### 3. Customer Directory (`customers.html`)
- Search customer database by phone or name.
- View customer profile, order history, and active garment measurements.
- Create new customer records with Pakistani phone normalization and duplicate prevention.

### 4. Measurements Repository (`measurements.html`)
- Browse and update garment-specific measurement profiles for any customer.

---

## 📁 Directory Structure

```text
admin-panel/
├── src/
│   ├── css/            # Tailwind CSS styling
│   ├── js/             # Page logic (admin-portal, customers, new-order, orders, measurements, profile, signin)
│   ├── ui_components/  # Shared components (navbar, modal, button)
│   └── utils/          # API client (with JWT injection) and Socket.IO client
├── customers.html      # Customer management
├── index.html          # Shop dashboard with revenue & active order metrics
├── measurements.html   # Measurement profiles
├── new-order.html      # 4-step fast order wizard
├── orders.html         # Order tracking & thermal slip printing
├── profile.html        # Tailor staff profile
├── signin.html         # Role-based staff authentication
├── package.json        # Vite & TypeScript dependencies
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Multi-page build config & backend proxy (port 5000)
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server on port 3001
npm run dev

# Run TypeScript type check
npm run typecheck

# Build for production
npm run build
```
