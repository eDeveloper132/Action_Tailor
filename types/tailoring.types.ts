/**
 * Action Tailor - Pakistani Tailor Shop Management Domain Types
 * Strict TypeScript types for clothing, measurements, orders, payments, and workflow
 */

// ==========================================
// 1. Roles & Permissions
// ==========================================
export type UserRole = 'admin' | 'staff' | 'customer';

// ==========================================
// 2. Pakistani Clothing Categories
// ==========================================
export type ClothingCategory =
  | 'shalwaar_qameez'
  | 'kurta_pajama'
  | 'waistcoat'
  | 'trouser_shirt'
  | 'sherwani'
  | 'safari_suit'
  | 'custom';

export interface ClothingTypeDefinition {
  key: ClothingCategory;
  nameEn: string;
  nameUr: string;
  defaultMeasurements: string[];
}

export const PAKISTANI_CLOTHING_TYPES: ClothingTypeDefinition[] = [
  {
    key: 'shalwaar_qameez',
    nameEn: 'Shalwaar Qameez',
    nameUr: 'شلوار قمیض',
    defaultMeasurements: [
      'qameezLength',
      'shoulder',
      'chest',
      'waist',
      'sleeve',
      'collar',
      'cuff',
      'ghera',
      'shalwaarLength',
      'paincha',
      'aasan',
    ],
  },
  {
    key: 'kurta_pajama',
    nameEn: 'Kurta Pajama',
    nameUr: 'کرتہ پاجامہ',
    defaultMeasurements: [
      'qameezLength',
      'shoulder',
      'chest',
      'sleeve',
      'collar',
      'ghera',
      'shalwaarLength',
      'paincha',
    ],
  },
  {
    key: 'waistcoat',
    nameEn: 'Waistcoat',
    nameUr: 'واسکٹ',
    defaultMeasurements: ['qameezLength', 'shoulder', 'chest', 'waist', 'collar'],
  },
  {
    key: 'trouser_shirt',
    nameEn: 'Shirt & Trouser',
    nameUr: 'شرٹ اور پینٹ',
    defaultMeasurements: [
      'qameezLength',
      'shoulder',
      'chest',
      'waist',
      'sleeve',
      'collar',
      'cuff',
      'shalwaarLength',
      'waist',
      'thigh',
      'paincha',
    ],
  },
  {
    key: 'sherwani',
    nameEn: 'Sherwani / Prince Suit',
    nameUr: 'شیروانی',
    defaultMeasurements: [
      'qameezLength',
      'shoulder',
      'chest',
      'waist',
      'hip',
      'sleeve',
      'collar',
      'shalwaarLength',
      'paincha',
    ],
  },
  {
    key: 'custom',
    nameEn: 'Custom / Other',
    nameUr: 'دیگر ورائٹی',
    defaultMeasurements: [],
  },
];

// ==========================================
// 3. Measurement Units & Structures
// ==========================================
export type MeasurementUnit = 'inches' | 'cm';

export interface QameezMeasurements {
  length?: number;      // Lambai / لمبائی
  shoulder?: number;    // Teera / تیرا
  chest?: number;       // Chhaati / چھاتی
  waist?: number;       // Kamar / کمر
  hip?: number;         // Hip / ہپ
  sleeve?: number;      // Bazu / بازو
  collar?: number;      // Collar / کالر (e.g. 15.5)
  cuff?: number;        // Cuff / کف
  ghera?: number;       // Daman/Ghera / گھیرا
  armhole?: number;     // Mudha / موڈھا
  bicep?: number;       // Dola / ڈولہ
  frontNeck?: number;   // Gala / گلا
}

export interface ShalwaarMeasurements {
  length?: number;      // Lambai / لمبائی
  waist?: number;       // Kamar / کمر
  hip?: number;         // Hip / ہپ
  thigh?: number;       // Raan / ران
  paincha?: number;     // Paincha / پائینچہ
  aasan?: number;       // Aasan / آسن
  fly?: number;         // Zipper/Fly
}

export interface MeasurementData {
  qameez?: QameezMeasurements;
  shalwaar?: ShalwaarMeasurements;
  customFields?: Record<string, number | string>;
}

// ==========================================
// 4. Style & Design Options
// ==========================================
export type CollarStyle = 'regular' | 'sherwani_chinese' | 'soft_collar' | 'ban_collar';
export type CuffStyle = 'single_button' | 'double_button' | 'french' | 'open_sleeve';
export type PocketStyle = 'single_front' | 'double_front' | 'side_pockets' | 'secret_pocket';
export type DamanStyle = 'round_gol' | 'straight_chors';
export type ShalwaarStyle = 'simple_shalwaar' | 'trouser_pajama' | 'dhoti_shalwaar';

export interface GarmentDesignOptions {
  collarStyle?: CollarStyle;
  cuffStyle?: CuffStyle;
  pocketStyle?: PocketStyle;
  damanStyle?: DamanStyle;
  shalwaarStyle?: ShalwaarStyle;
  embroideryDetails?: string;
  specialInstructions?: string;
}

// ==========================================
// 5. Order Status Lifecycle
// ==========================================
export type OrderStatus =
  | 'pending'         // زیرِ التوا
  | 'confirmed'       // تصدیق شدہ
  | 'cutting'         // کٹائی
  | 'stitching'       // سلائی
  | 'quality_check'   // معائنہ
  | 'ready'           // تیار
  | 'delivered'       // حوالے کیا گیا
  | 'on_hold'         // رکا ہوا
  | 'cancelled';      // منسوخ

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  updatedAt: Date;
  updatedBy?: string;
  notes?: string;
}

// ==========================================
// 6. Payment Types
// ==========================================
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';
export type PaymentMethod = 'cash' | 'easypaisa' | 'jazzcash' | 'bank_transfer' | 'other';
export type PaymentType = 'advance' | 'partial' | 'final' | 'refund';

// ==========================================
// 7. Notification Types
// ==========================================
export type NotificationType =
  | 'order_created'
  | 'status_changed'
  | 'order_ready'
  | 'payment_received'
  | 'delivery_reminder'
  | 'general';

