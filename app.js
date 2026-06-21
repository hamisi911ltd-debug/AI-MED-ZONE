'use strict';

/* ═══════════════════════════════════════════════════════════════
   AMZ MedAI Academy — App Shell (shared sidebar/topbar behavior)
═══════════════════════════════════════════════════════════════ */

async function api(path, opts = {}) {
  const res = await fetch(path, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
window.api = api;

function initials(firstName, lastName) {
  return ((firstName || '')[0] || '').toUpperCase() + ((lastName || '')[0] || '').toUpperCase();
}

function showToast(msg) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'app-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3500);
}
window.appToast = showToast;

/* Resolves once the shell is authed + wired. Redirects to login.html if not signed in. */
window.initAppShell = async function initAppShell() {
  let me;
  try {
    me = await api('/api/me');
  } catch {
    window.location.href = 'login.html';
    return null;
  }
  if (me.isAdmin) {
    window.location.href = 'admin.html';
    return null;
  }

  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.as-link[href]').forEach((link) => {
    const href = link.getAttribute('href').split('/').pop();
    link.classList.toggle('active', href === currentPage);
  });

  document.querySelectorAll('.js-avatar').forEach((el) => { el.textContent = initials(me.firstName, me.lastName); });
  document.querySelectorAll('.js-fullname').forEach((el) => { el.textContent = `${me.firstName} ${me.lastName}`; });
  document.querySelectorAll('.js-firstname').forEach((el) => { el.textContent = me.firstName; });
  document.querySelectorAll('.js-role').forEach((el) => { el.textContent = (me.role || '').replace(/_/g, ' '); });

  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('appOverlay');
  const toggle = document.getElementById('sidebarToggle');
  function closeSidebar() { sidebar?.classList.remove('open'); overlay?.classList.remove('show'); }
  toggle?.addEventListener('click', () => { sidebar?.classList.toggle('open'); overlay?.classList.toggle('show'); });
  overlay?.addEventListener('click', closeSidebar);
  document.querySelectorAll('.as-link').forEach((l) => l.addEventListener('click', closeSidebar));

  document.getElementById('logoutLink')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await api('/api/logout', { method: 'POST' }).catch(() => {});
    window.location.href = 'index.html';
  });

  return me;
};
