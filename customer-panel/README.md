# Action Tailor - Customer Portal / کسٹمر پورٹل

> Dedicated, lightweight self-service portal for tailoring customers to track stitching status, review delivery dates, and view saved garment measurements.

---

## 🎯 Purpose & Scope

This application is dedicated exclusively to **customers**. It provides a clear, transparent window into their personal tailoring orders without exposing internal shop operations:

- **Target Users**: Customers of Action Tailor.
- **Default Port**: `http://localhost:3002`
- **Bilingual Interface**: Seamless `English / اردو` typography across all views.

### 🛡️ Privacy & Isolation Guardrails
- Customers **CAN ONLY** view their own orders, statuses, measurements, and profile.
- Customers **CANNOT** view other customers, shop revenue, shop-wide orders, staff details, or internal workshop notes.
- Customers **CANNOT** create customer profiles, advance order statuses, or access administrative endpoints. Backend authorization validates ownership on every request.

---

## ⚡ Key Features

### 1. Customer Dashboard (`index.html`)
- **Current Active Order Highlight**:
  - Displays the in-progress suit (`Order # / آرڈر نمبر`, `Shalwar Qameez / شلوار قمیض`, `Stitching / سلائی`).
  - Expected completion date notification (`Expected Completion Date / متوقع تاریخ`).
  - Prominent **Ready for Pickup** banner when the order reaches the `ready` stage (`Ready for Pickup / دکان سے وصولی کے لیے تیار`).
- **Past Orders History**: Quick list of completed suits and past delivery dates.

### 2. My Orders (`orders.html`)
- Detailed order progress tracking (`Pending / زیر التوا` → `Cutting / کٹائی` → `Stitching / سلائی` → `Ready / تیار` → `Delivered / حوالے کیا گیا`).
- View itemized stitching instructions, total price, advance paid, and remaining balance.
- Print / download customer order slip.

### 3. My Measurements (`measurements.html`)
- View saved garment-specific measurement profiles on file (Shalwar Qameez, Kurta Pajama, etc.).
- Inspect dimensions recorded during tailoring fitting sessions.

### 4. Account & Profile (`profile.html`, `signin.html`, `signup.html`)
- Simple registration and sign-in using customer email and phone number.
- Update personal contact information and delivery address.

---

## 📁 Directory Structure

```text
customer-panel/
├── src/
│   ├── css/            # Tailwind CSS styling
│   ├── js/             # Page logic (customer-portal, orders, measurements, profile, signin, signup)
│   ├── ui_components/  # Shared components (navbar, modal, button)
│   └── utils/          # API client (with JWT injection) and Socket.IO client
├── index.html          # Customer dashboard with active order highlight
├── measurements.html   # Customer's saved garment measurements
├── orders.html         # Customer order tracking & history
├── profile.html        # Customer profile management
├── signin.html         # Customer login
├── signup.html         # New customer registration
├── package.json        # Vite & TypeScript dependencies
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Multi-page build config & backend proxy (port 5000)
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server on port 3002
npm run dev

# Run TypeScript type check
npm run typecheck

# Build for production
npm run build
```
