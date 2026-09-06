import { renderNavbar, showToast } from '../ui_components/index.ts';
import '../utils/api.ts';

interface MeasurementProfile {
  _id: string;
  title: string;
  unit: string;
  isDefault?: boolean;
  notes?: string;
  measurements?: {
    qameez?: {
      length?: number;
      shoulder?: number;
      chest?: number;
      waist?: number;
      hip?: number;
      sleeve?: number;
      collar?: number;
      armhole?: number;
      ghera?: number;
    };
    shalwaar?: {
      length?: number;
      waist?: number;
      hip?: number;
      paincha?: number;
      aasan?: number;
      ghera?: number;
      thigh?: number;
      inseam?: number;
    };
    pant?: Record<string, number>;
    coat?: Record<string, number>;
    waistcoat?: Record<string, number>;
  };
  createdAt?: string;
  updatedAt?: string;
}

async function initMeasurementsPage(): Promise<void> {
  renderNavbar('navbarMount', {
    brandName: 'Action Tailor • Customer Portal',
    logoIcon: '✂',
    activeLink: 'measurements',
    showAuthButton: true,
  });

  await loadMeasurements();
}

async function loadMeasurements(): Promise<void> {
  const container = document.getElementById('measurementsGrid');
  try {
    const res = await (window as any).ActionTailor.apiFetch('/api/dashboard/customer');
    const profiles: MeasurementProfile[] = res.data?.measurementProfiles || [];

    if (!container) return;

    if (profiles.length === 0) {
      container.innerHTML = `
        <div class="p-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200 col-span-full">
          <p class="font-semibold text-slate-600">No measurements recorded yet / کوئی ناپ درج نہیں ہے</p>
          <p class="text-xs text-slate-400 mt-1">Your tailor will take and record your measurements on your next visit to the shop.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = profiles.map((p) => renderProfileCard(p)).join('');
  } catch (err: any) {
    if (container) {
      container.innerHTML = `
        <div class="p-8 text-center text-rose-500 text-sm bg-white rounded-2xl border border-rose-200 col-span-full">
          Failed to load measurements / ناپ لوڈ کرنے میں مسئلہ پیش آیا
        </div>
      `;
    }
    showToast('Failed to load measurements', 'error');
  }
}

function renderProfileCard(profile: MeasurementProfile): string {
  const q = profile.measurements?.qameez || {};
  const s = profile.measurements?.shalwaar || {};
  const unitLabel = (profile.unit || 'inches').toLowerCase() === 'inches' ? 'Inches / انچ' : 'cm / سینٹی میٹر';
  const updatedDate = profile.updatedAt || profile.createdAt;
  const formattedDate = updatedDate ? new Date(updatedDate).toLocaleDateString('en-GB') : '--';

  return `
    <div class="tailor-card p-5 sm:p-6 rounded-2xl space-y-4 border border-slate-200 bg-white shadow-xs">
      <!-- Profile Header -->
      <div class="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-base sm:text-lg font-bold text-slate-900">${profile.title || 'Standard Fit / معیاری ناپ'}</h2>
            ${profile.isDefault ? `
              <span class="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Default / پرائمری
              </span>
            ` : ''}
          </div>
          <div class="text-xs text-slate-400 mt-0.5">
            Recorded On / تاریخ: ${formattedDate}
          </div>
        </div>

        <span class="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-emerald-800 font-bold border border-slate-200">
          ${unitLabel}
        </span>
      </div>

      <!-- Upper Garment / Qameez / Kurta Grid -->
      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Upper Body / قمیض / کرتا</span>
          <span class="text-[11px] text-slate-400 font-medium">Bespoke Fit / روایتی ناپ</span>
        </div>

        <div class="grid grid-cols-3 gap-2.5 text-xs text-slate-800 pt-1">
          <div class="p-2 rounded-lg bg-white border border-slate-100">
            <div class="text-[11px] text-slate-400">Length / لمبائی</div>
            <div class="text-sm font-extrabold text-slate-900">${q.length ? `${q.length}"` : '--'}</div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-slate-100">
            <div class="text-[11px] text-slate-400">Shoulder / کندھا</div>
            <div class="text-sm font-extrabold text-slate-900">${q.shoulder ? `${q.shoulder}"` : '--'}</div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-slate-100">
            <div class="text-[11px] text-slate-400">Chest / چھاتی</div>
            <div class="text-sm font-extrabold text-slate-900">${q.chest ? `${q.chest}"` : '--'}</div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-slate-100">
            <div class="text-[11px] text-slate-400">Sleeve / آستین</div>
            <div class="text-sm font-extrabold text-slate-900">${q.sleeve ? `${q.sleeve}"` : '--'}</div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-slate-100">
            <div class="text-[11px] text-slate-400">Collar / کالر</div>
            <div class="text-sm font-extrabold text-slate-900">${q.collar ? `${q.collar}"` : '--'}</div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-slate-100">
            <div class="text-[11px] text-slate-400">Daman / دامن</div>
            <div class="text-sm font-extrabold text-slate-900">${q.daman || q.ghera ? `${q.daman || q.ghera}"` : '--'}</div>
          </div>
        </div>
      </div>

      <!-- Lower Garment / Shalwaar Grid -->
      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Lower Body / شلوار / پاجامہ</span>
          <span class="text-[11px] text-slate-400 font-medium">Bespoke Fit / روایتی ناپ</span>
        </div>

        <div class="grid grid-cols-3 gap-2.5 text-xs text-slate-800 pt-1">
          <div class="p-2 rounded-lg bg-white border border-slate-100">
            <div class="text-[11px] text-slate-400">Length / لمبائی</div>
            <div class="text-sm font-extrabold text-slate-900">${s.length ? `${s.length}"` : '--'}</div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-slate-100">
            <div class="text-[11px] text-slate-400">Paincha / پانچہ</div>
            <div class="text-sm font-extrabold text-slate-900">${s.paincha ? `${s.paincha}"` : '--'}</div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-slate-100">
            <div class="text-[11px] text-slate-400">Aasan / آسن</div>
            <div class="text-sm font-extrabold text-slate-900">${s.aasan ? `${s.aasan}"` : '--'}</div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-slate-100">
            <div class="text-[11px] text-slate-400">Ghera / گھیرا</div>
            <div class="text-sm font-extrabold text-slate-900">${s.ghera ? `${s.ghera}"` : '--'}</div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-slate-100">
            <div class="text-[11px] text-slate-400">Waist / کمر</div>
            <div class="text-sm font-extrabold text-slate-900">${s.waist ? `${s.waist}"` : '--'}</div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-slate-100">
            <div class="text-[11px] text-slate-400">Inseam / اندرونی لمبائی</div>
            <div class="text-sm font-extrabold text-slate-900">${s.inseam ? `${s.inseam}"` : '--'}</div>
          </div>
        </div>
      </div>

      <!-- Tailor Instructions / Special Notes (if present) -->
      ${profile.notes ? `
        <div class="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs">
          <strong>Special Instructions / خاص ہدایات:</strong> ${profile.notes}
        </div>
      ` : ''}
    </div>
  `;
}

initMeasurementsPage();

