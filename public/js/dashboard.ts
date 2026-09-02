import {
  renderNavbar,
  createStatCard,
  updateStatCard,
  showToast,
  showModal,
} from '../ui_components/index.ts';

// 1. Mount Navigation Bar Component
renderNavbar('navbarMount', {
  brandName: 'Action Tailor',
  logoIcon: '⚡',
  activeLink: 'dashboard',
  showAuthButton: true,
});

// 2. Render Stat Cards Components
const grid = document.getElementById('statCardsGrid');

if (grid) {
  const cardStatus = createStatCard({
    id: 'cardStatus',
    title: 'Server Status',
    value: 'CHECKING...',
    subtitle: 'HTTP & Socket.IO Active',
    color: 'primary',
  });

  const cardUptime = createStatCard({
    id: 'cardUptime',
    title: 'System Uptime',
    value: '0s',
    subtitle: 'Continuous runtime',
    color: 'success',
  });

  const cardEnv = createStatCard({
    id: 'cardEnv',
    title: 'Architecture',
    value: 'Full-Stack TS',
    subtitle: 'Tailwind CSS • Express 5 • JWT',
    color: 'primary',
  });

  grid.appendChild(cardStatus);
  grid.appendChild(cardUptime);
  grid.appendChild(cardEnv);
}

// 3. Telemetry Update Function
async function loadTelemetry(): Promise<void> {
  try {
    const data = await (window as any).ActionTailor.apiFetch('/health');
    updateStatCard('cardStatus', data.status.toUpperCase(), 'All systems operational');
    updateStatCard('cardUptime', Math.floor(data.uptime) + 's', 'Active server process');
    const telemetryEl = document.getElementById('telemetryData');
    if (telemetryEl) {
      telemetryEl.textContent = JSON.stringify(data, null, 2);
    }
  } catch (err: any) {
    updateStatCard('cardStatus', 'OFFLINE', 'Connection warning');
    const telemetryEl = document.getElementById('telemetryData');
    if (telemetryEl) {
      telemetryEl.textContent = 'Error fetching telemetry: ' + (err.message || err);
    }
    showToast('Failed to refresh system telemetry', 'error', { title: 'Network Notice' });
  }
}

// 4. Authenticated User Profile
async function loadUser(): Promise<void> {
  try {
    const res = await (window as any).ActionTailor.apiFetch('/api/auth/me');
    if (res.data) {
      const user = res.data;
      const headingEl = document.getElementById('userGreeting');
      const subEl = document.getElementById('userSub');
      if (headingEl) {
        headingEl.textContent = `Welcome, ${user.name || user.email}!`;
      }
      if (subEl) {
        subEl.textContent = `Authenticated as ${user.email} (Role: ${user.role || 'user'})`;
      }
      showToast(`Signed in as ${user.email}`, 'info', { title: 'Session Active', duration: 3000 });
    }
  } catch (_err) {
    // Handled by auth middleware
  }
}

// 5. System Modal Trigger
const modalBtn = document.getElementById('systemInfoBtn');
if (modalBtn) {
  modalBtn.addEventListener('click', () => {
    showModal({
      title: 'Action Tailor System Details',
      content: `
        <div style="font-size: 0.875rem; line-height: 1.6; color: #cbd5e1;">
          <p style="margin-bottom: 0.75rem;">This application is styled with <strong>Tailwind CSS</strong> and modular <strong>Custom CSS/JS</strong>:</p>
          <ul style="padding-left: 1.25rem; color: #94a3b8;">
            <li><strong>Tailwind Utilities:</strong> Rapid responsive layouts and color hierarchy</li>
            <li><strong>Custom CSS:</strong> Glassmorphism cards and smooth animations</li>
            <li><strong>TypeScript Components:</strong> Reactive Navbar, StatCards, Toasts, and Modals</li>
          </ul>
        </div>
      `,
      confirmText: 'Got it!',
      cancelText: 'Close',
      onConfirm: () => {
        showToast('System info acknowledged', 'success');
      },
    });
  });
}

loadUser();
loadTelemetry();
setInterval(loadTelemetry, 5000);
