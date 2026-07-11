// ============================================================
// GEARUP — Corporate Portal Script
// Standalone portal for corporate partners to view delivery
// events, photos, and package information.
// Uses supabaseClient — NOT supabase (Safari CDN var shadowing)
// ============================================================

const SUPABASE_URL     = 'https://wavhxkawlzeyhtthffhs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhdmh4a2F3bHpleWh0dGhmZmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNzU3NTEsImV4cCI6MjA4NjY1MTc1MX0.NERS8pASDTG2UkgMylMLDPSu6NkNFIec_FAYD6LtTtU';

let supabaseClient = null;
let _cpSession     = null; // { account: {...}, events: [...] }
let _currentTab    = 'overview';

// ─── Notification ─────────────────────────────────────────
let _notifTimer = null;
function showCpNotif(msg, type = 'info') {
    const el = document.getElementById('cpNotif');
    if (!el) return;
    el.textContent = msg;
    el.className = 'show ' + type;
    clearTimeout(_notifTimer);
    _notifTimer = setTimeout(() => { el.className = ''; }, 4000);
}

// ─── Escape HTML helper ───────────────────────────────────
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ─── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.error('Supabase init failed:', e);
    }

    // Attempt to restore session from sessionStorage
    const saved = sessionStorage.getItem('gearup_corp_portal');
    if (saved) {
        try {
            _cpSession = JSON.parse(saved);
            if (!_cpSession?.account?.id) throw new Error('invalid session');
            await refreshEvents();
            showDashboard();
            return;
        } catch (_) {
            sessionStorage.removeItem('gearup_corp_portal');
            _cpSession = null;
        }
    }

    // Show login screen
    document.getElementById('loginScreen').style.display = 'flex';
});

// ─── Mobile sidebar toggle ────────────────────────────────
function toggleCpSidebar() {
    const sidebar  = document.getElementById('cpSidebar');
    const overlay  = document.getElementById('cpSidebarOverlay');
    const isOpen   = sidebar.classList.toggle('open');
    overlay.style.display = isOpen ? 'block' : 'none';
}

// ─── Login ────────────────────────────────────────────────
async function handleLogin() {
    const email   = document.getElementById('cpEmail')?.value.trim();
    const orgName = document.getElementById('cpOrgName')?.value.trim();
    const btn     = document.getElementById('cpLoginBtn');
    const errEl   = document.getElementById('cpLoginError');

    errEl.style.display = 'none';

    if (!email || !orgName) {
        errEl.textContent = 'กรุณากรอกอีเมลและชื่อองค์กร';
        errEl.style.display = 'block';
        return;
    }

    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) {
        errEl.textContent = 'รูปแบบอีเมลไม่ถูกต้อง';
        errEl.style.display = 'block';
        return;
    }

    if (!supabaseClient) {
        errEl.textContent = 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่';
        errEl.style.display = 'block';
        return;
    }

    btn.disabled    = true;
    btn.textContent = 'กำลังตรวจสอบ...';

    try {
        // Verify corporate account via SECURITY DEFINER RPC (no anon policy on corporate_accounts)
        const { data: accounts, error: accErr } = await supabaseClient
            .rpc('get_corp_account_info', { p_email: email, p_org_name: orgName });

        if (accErr) throw accErr;

        if (!accounts || accounts.length === 0) {
            errEl.textContent = 'ไม่พบข้อมูลองค์กร กรุณาตรวจสอบอีเมลและชื่อองค์กร';
            errEl.style.display = 'block';
            return;
        }

        const account = accounts[0];

        // Fetch events + donations in parallel
        const [evRes, donRes] = await Promise.all([
            supabaseClient
                .from('delivery_events')
                .select('*, requests(id, project_name, address, phone)')
                .eq('corporate_account_id', account.id)
                .order('scheduled_date', { ascending: true }),
            supabaseClient
                .rpc('get_corporate_donations', { p_email: email, p_org_name: orgName }),
        ]);

        if (evRes.error) throw evRes.error;

        _cpSession = { account, events: evRes.data || [], donations: donRes.data || [] };
        sessionStorage.setItem('gearup_corp_portal', JSON.stringify(_cpSession));

        showDashboard();
    } catch (err) {
        errEl.textContent = 'เกิดข้อผิดพลาด: ' + (err.message || 'กรุณาลองใหม่อีกครั้ง');
        errEl.style.display = 'block';
    } finally {
        btn.disabled    = false;
        btn.textContent = 'เข้าสู่ระบบ';
    }
}

// ─── Refresh events (called on session restore) ───────────
async function refreshEvents() {
    if (!_cpSession?.account?.id || !supabaseClient) return;
    try {
        const email   = _cpSession.account.contact_email;
        const orgName = _cpSession.account.org_name;
        const [evRes, donRes] = await Promise.all([
            supabaseClient
                .from('delivery_events')
                .select('*, requests(id, project_name, address, phone)')
                .eq('corporate_account_id', _cpSession.account.id)
                .order('scheduled_date', { ascending: true }),
            supabaseClient
                .rpc('get_corporate_donations', { p_email: email, p_org_name: orgName }),
        ]);
        _cpSession.events    = evRes.data  || [];
        _cpSession.donations = donRes.data || [];
        sessionStorage.setItem('gearup_corp_portal', JSON.stringify(_cpSession));
    } catch (err) {
        console.error('refreshEvents failed:', err);
    }
}

// ─── Show dashboard after login ───────────────────────────
function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'flex';

    const acc = _cpSession.account;
    const pkgNames = { S: 'Starter CSR', M: 'Professional ESG', L: 'Corporate Impact' };

    // Populate sidebar
    document.getElementById('cpSidebarOrgName').textContent = acc.org_name;
    document.getElementById('cpSidebarPkg').textContent = pkgNames[acc.package] || acc.package || '—';

    // Populate header
    document.getElementById('cpHeaderOrg').textContent = acc.org_name;
    document.getElementById('cpHeaderDate').textContent = new Date().toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    renderStats();
    switchTab('overview');
}

// ─── Stats bar ────────────────────────────────────────────
function renderStats() {
    const acc       = _cpSession.account;
    const events    = _cpSession.events    || [];
    const donations = _cpSession.donations || [];
    const completed = events.filter(e => e.status === 'completed').length;
    const totalDevices = donations.reduce((s, d) => s + (d.total_items || 0), 0);

    let daysRemaining = '—';
    if (acc.end_date) {
        const diff = Math.ceil((new Date(acc.end_date) - new Date()) / (1000 * 60 * 60 * 24));
        daysRemaining = diff > 0 ? diff : 0;
    }

    const stats = [
        { label: 'อุปกรณ์ที่บริจาค', value: totalDevices, unit: 'เครื่อง', icon: '💻', color: '#2f5233' },
        { label: 'กิจกรรมเสร็จสิ้น',  value: completed,            unit: 'รายการ', icon: '✅', color: '#166534' },
        { label: 'วันคงเหลือ',         value: daysRemaining,        unit: 'วัน',    icon: '📅', color: '#b45309' },
        { label: 'แพ็คเกจ',            value: acc.package || '—',   unit: '',       icon: '🏆', color: '#1d4ed8' },
    ];

    document.getElementById('cpStats').innerHTML = stats.map(s => `
    <div style="background:white;border-radius:14px;padding:1.25rem 1.5rem;
                box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid rgba(47,82,51,0.07);
                display:flex;align-items:center;gap:1rem;">
      <div style="width:48px;height:48px;border-radius:12px;flex-shrink:0;
                  background:${s.color}18;display:flex;align-items:center;justify-content:center;font-size:1.4rem;">
        ${s.icon}
      </div>
      <div>
        <div style="font-family:'Playfair Display',serif;font-size:1.7rem;font-weight:800;
                    color:${s.color};line-height:1.1;">${s.value}</div>
        <div style="font-size:0.72rem;color:#6b7c72;font-weight:600;margin-top:0.1rem;">
          ${s.unit ? s.unit + ' · ' : ''}${s.label}
        </div>
      </div>
    </div>`).join('');
}

// ─── Tab switching ────────────────────────────────────────
function switchTab(tab) {
    _currentTab = tab;

    document.querySelectorAll('.cp-nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.tab === tab);
    });
    document.querySelectorAll('.cp-tab-pane').forEach(el => {
        el.style.display = el.dataset.tabPane === tab ? 'block' : 'none';
    });

    if      (tab === 'overview') renderOverview();
    else if (tab === 'events')   renderAllEvents();
    else if (tab === 'photos')   renderPhotoGallery();
    else if (tab === 'package')  renderPackageInfo();

    // Close mobile sidebar if open
    const sidebar = document.getElementById('cpSidebar');
    const overlay = document.getElementById('cpSidebarOverlay');
    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.style.display = 'none';
    }
}

// ─── Event status / type maps ─────────────────────────────
const EVT_STATUS = {
    pending:   { label: 'รอยืนยัน',   color: '#b45309', bg: '#fef3c7', dot: '#f59e0b' },
    confirmed: { label: 'ยืนยันแล้ว', color: '#1d4ed8', bg: '#dbeafe', dot: '#3b82f6' },
    completed: { label: 'เสร็จสิ้น',  color: '#166534', bg: '#dcfce7', dot: '#22c55e' },
    cancelled: { label: 'ยกเลิก',     color: '#991b1b', bg: '#fee2e2', dot: '#ef4444' },
};

const EVT_TYPE = {
    delivery:     '📦 จัดส่งอุปกรณ์',
    site_visit:   '🏫 ลงพื้นที่',
    handover:     '🤝 ส่งมอบจริง',
    photo_session:'📸 ถ่ายรูป',
    other:        '📋 อื่นๆ',
};

// ─── Overview: upcoming events ────────────────────────────
function renderOverview() {
    const events   = _cpSession?.events || [];
    const upcoming = events.filter(e => e.status !== 'completed' && e.status !== 'cancelled');
    const el       = document.getElementById('cpOverviewContent');

    if (upcoming.length === 0) {
        el.innerHTML = `
        <div style="text-align:center;padding:3rem;color:#888;background:white;border-radius:14px;
                    box-shadow:0 2px 12px rgba(0,0,0,0.05);">
          <div style="font-size:2.5rem;margin-bottom:0.75rem;">📅</div>
          <div style="font-family:'Playfair Display',serif;font-size:1rem;color:#555;">
            ยังไม่มีกิจกรรมที่กำลังจะมา
          </div>
          <div style="font-size:0.85rem;color:#aaa;margin-top:0.4rem;">
            ทีมงาน GEARUP จะแจ้งเมื่อมีการนัดหมาย
          </div>
        </div>`;
        return;
    }

    el.innerHTML = upcoming.map(ev => renderEventCard(ev)).join('');
}

// ─── Events: all events list ──────────────────────────────
function renderAllEvents() {
    const events = _cpSession?.events || [];
    const el     = document.getElementById('cpEventsContent');

    if (events.length === 0) {
        el.innerHTML = `
        <div style="text-align:center;padding:3rem;color:#888;background:white;border-radius:14px;
                    box-shadow:0 2px 12px rgba(0,0,0,0.05);">
          <div style="font-size:2.5rem;margin-bottom:0.75rem;">📋</div>
          <div style="font-family:'Playfair Display',serif;font-size:1rem;color:#555;">ยังไม่มีกิจกรรม</div>
        </div>`;
        return;
    }

    // Group by status for summary
    const counts = {};
    events.forEach(e => { counts[e.status] = (counts[e.status] || 0) + 1; });
    const summaryHtml = `
    <div style="display:flex;flex-wrap:wrap;gap:0.6rem;margin-bottom:1.25rem;">
      ${Object.entries(EVT_STATUS).map(([k, v]) =>
        counts[k]
          ? `<span style="background:${v.bg};color:${v.color};padding:0.25rem 0.85rem;
                          border-radius:20px;font-size:0.82rem;font-weight:700;">
               ${v.label} ${counts[k]}
             </span>`
          : ''
      ).join('')}
    </div>`;

    el.innerHTML = summaryHtml + events.map(ev => renderEventCard(ev)).join('');
}

// ─── Event card renderer ──────────────────────────────────
function renderEventCard(ev) {
    const sm     = EVT_STATUS[ev.status] || EVT_STATUS.pending;
    const typStr = EVT_TYPE[ev.event_type] || ev.event_type;
    const school = ev.requests?.project_name || ev.location || '';
    const photos = (ev.photo_urls || []).slice(0, 4);

    const dateStr = ev.scheduled_date
        ? new Date(ev.scheduled_date).toLocaleString('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })
        : 'ยังไม่กำหนดวัน';

    const photosHtml = photos.length
        ? `<div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.85rem;">
             ${photos.map(url =>
               `<img src="${escapeHtml(url)}" loading="lazy"
                    style="width:64px;height:64px;object-fit:cover;border-radius:8px;
                           cursor:pointer;border:2px solid white;
                           box-shadow:0 1px 4px rgba(0,0,0,0.12);"
                    onclick="window.open('${escapeHtml(url)}','_blank')" title="เปิดรูปขนาดเต็ม">`
             ).join('')}
           </div>`
        : '';

    const trackingHtml = ev.shipping_tracking_id
        ? `<span style="background:#f0f4f1;padding:0.15rem 0.6rem;border-radius:5px;
                        color:#2f5233;font-size:0.82rem;">
             📦 ${escapeHtml(ev.shipping_carrier || '')} · ${escapeHtml(ev.shipping_tracking_id)}
           </span>`
        : '';

    const notesHtml = ev.notes
        ? `<div style="margin-top:0.85rem;font-size:0.84rem;color:#6b7c72;font-style:italic;
                       border-top:1px solid #f0f0f0;padding-top:0.6rem;">
             ${escapeHtml(ev.notes)}
           </div>`
        : '';

    return `
    <div style="background:white;border-radius:14px;padding:1.35rem 1.5rem;margin-bottom:1rem;
                box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid rgba(47,82,51,0.07);
                border-left:4px solid ${sm.dot};">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;
                  flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem;">
        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          <span style="font-size:0.72rem;font-weight:700;padding:0.2rem 0.75rem;border-radius:20px;
                       background:${sm.bg};color:${sm.color};">${sm.label}</span>
          <span style="font-size:0.8rem;color:#888;">${typStr}</span>
        </div>
        <span style="font-size:0.8rem;color:#6b7c72;">📅 ${dateStr}</span>
      </div>

      <div style="font-family:'Playfair Display',serif;font-size:1.05rem;font-weight:700;
                  color:#1a2421;margin-bottom:0.5rem;">
        ${escapeHtml(ev.title)}
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:0.75rem;font-size:0.83rem;color:#6b7c72;">
        ${school ? `<span>🏫 ${escapeHtml(school)}</span>` : ''}
        ${ev.location && ev.location !== school ? `<span>📍 ${escapeHtml(ev.location)}</span>` : ''}
        ${trackingHtml}
      </div>

      ${photosHtml}
      ${notesHtml}
    </div>`;
}

// ─── Photo gallery ────────────────────────────────────────
function renderPhotoGallery() {
    const events   = _cpSession?.events || [];
    const allPhotos = [];
    events.forEach(ev => {
        (ev.photo_urls || []).forEach(url => {
            allPhotos.push({ url, title: ev.title, date: ev.scheduled_date });
        });
    });

    const el = document.getElementById('cpPhotosContent');

    if (allPhotos.length === 0) {
        el.innerHTML = `
        <div style="text-align:center;padding:3rem;color:#888;background:white;border-radius:14px;
                    box-shadow:0 2px 12px rgba(0,0,0,0.05);">
          <div style="font-size:2.5rem;margin-bottom:0.75rem;">📷</div>
          <div style="font-family:'Playfair Display',serif;font-size:1rem;color:#555;">
            ยังไม่มีรูปภาพ
          </div>
          <div style="font-size:0.85rem;color:#aaa;margin-top:0.4rem;">
            ทีมงาน GEARUP จะอัปโหลดรูปภาพหลังลงพื้นที่
          </div>
        </div>`;
        return;
    }

    el.innerHTML = `
    <div style="font-size:0.85rem;color:#888;margin-bottom:1rem;">${allPhotos.length} รูปภาพ — คลิกเพื่อดูขนาดเต็ม</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;">
      ${allPhotos.map(p => `
      <div style="position:relative;cursor:pointer;border-radius:12px;overflow:hidden;
                  aspect-ratio:4/3;box-shadow:0 2px 10px rgba(0,0,0,0.1);
                  transition:transform 0.2s,box-shadow 0.2s;"
           onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 6px 20px rgba(0,0,0,0.18)'"
           onmouseout="this.style.transform='';this.style.boxShadow='0 2px 10px rgba(0,0,0,0.1)'"
           onclick="window.open('${escapeHtml(p.url)}','_blank')">
        <img src="${escapeHtml(p.url)}" loading="lazy"
             style="width:100%;height:100%;object-fit:cover;display:block;">
        <div style="position:absolute;bottom:0;left:0;right:0;padding:0.5rem 0.75rem;
                    background:linear-gradient(transparent,rgba(26,36,33,0.82));
                    color:white;font-size:0.75rem;font-weight:600;">
          ${escapeHtml(p.title)}
        </div>
      </div>`).join('')}
    </div>`;
}

// ─── Package info ─────────────────────────────────────────
function renderPackageInfo() {
    const acc = _cpSession?.account;
    if (!acc) return;

    const pkgNames  = { S: 'Starter CSR',       M: 'Professional ESG', L: 'Corporate Impact' };
    const pkgPrices = { S: '13,500',             M: '32,500',           L: '60,000' };
    const pkgColors = { S: '#2f5233',             M: '#8b7355',          L: '#1a2421' };
    const pkgDesc   = {
        S: 'เหมาะสำหรับ SME ที่ต้องการเริ่มต้นโครงการ CSR ด้านการศึกษา',
        M: 'สำหรับองค์กรขนาดกลางที่ต้องการรายงาน ESG ครบถ้วน',
        L: 'สำหรับองค์กรขนาดใหญ่ที่ต้องการ impact สูงสุด',
    };

    const color = pkgColors[acc.package] || '#2f5233';
    const events = _cpSession?.events || [];

    // Progress bar
    let progressHtml = '';
    if (acc.start_date && acc.end_date) {
        const start = new Date(acc.start_date);
        const end   = new Date(acc.end_date);
        const now   = new Date();
        const total = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
        const used  = Math.ceil((now - start)  / (1000 * 60 * 60 * 24));
        const pct   = Math.min(100, Math.max(0, Math.round((used / total) * 100)));

        progressHtml = `
        <div style="margin-top:1.5rem;">
          <div style="display:flex;justify-content:space-between;font-size:0.83rem;
                      color:#6b7c72;margin-bottom:0.4rem;">
            <span>ระยะเวลาแพ็คเกจ</span>
            <span>${used} / ${total} วัน (${pct}%)</span>
          </div>
          <div style="height:10px;background:#e5e7eb;border-radius:5px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${color};border-radius:5px;transition:width 1s;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.75rem;
                      color:#9ca3af;margin-top:0.35rem;">
            <span>${start.toLocaleDateString('th-TH')}</span>
            <span>${end.toLocaleDateString('th-TH')}</span>
          </div>
        </div>`;
    }

    // Event breakdown
    const evtCounts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    events.forEach(e => { if (evtCounts[e.status] !== undefined) evtCounts[e.status]++; });

    const evtSummaryHtml = `
    <div style="margin-top:1.5rem;">
      <div style="font-family:'Playfair Display',serif;font-weight:700;font-size:0.95rem;
                  color:#1a2421;margin-bottom:0.75rem;">สรุปกิจกรรม</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.6rem;">
        ${Object.entries({ pending: 'รอยืนยัน', confirmed: 'ยืนยันแล้ว', completed: 'เสร็จสิ้น', cancelled: 'ยกเลิก' })
          .map(([k, label]) => `
          <div style="background:#f8f6f3;border-radius:8px;padding:0.65rem 0.9rem;
                      display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:0.83rem;color:#6b7c72;">${label}</span>
            <span style="font-family:'Playfair Display',serif;font-weight:800;
                         font-size:1.1rem;color:${color};">${evtCounts[k]}</span>
          </div>`).join('')}
      </div>
    </div>`;

    document.getElementById('cpPackageContent').innerHTML = `
    <div style="background:white;border-radius:16px;padding:2rem;
                box-shadow:0 2px 12px rgba(0,0,0,0.06);">

      <!-- Package header -->
      <div style="display:flex;align-items:center;gap:1.25rem;margin-bottom:1rem;flex-wrap:wrap;">
        <div style="width:64px;height:64px;border-radius:16px;background:${color};
                    display:flex;align-items:center;justify-content:center;
                    font-family:'Playfair Display',serif;font-size:1.9rem;
                    font-weight:800;color:white;flex-shrink:0;">
          ${escapeHtml(acc.package || '?')}
        </div>
        <div style="flex:1;">
          <div style="font-family:'Playfair Display',serif;font-size:1.35rem;
                      font-weight:700;color:#1a2421;">
            ${escapeHtml(pkgNames[acc.package] || acc.package || '—')}
          </div>
          <div style="font-size:0.85rem;color:#6b7c72;margin-top:0.15rem;">
            ${escapeHtml(pkgDesc[acc.package] || 'แพ็คเกจ GEARUP CSR')}
          </div>
        </div>
      </div>

      <div style="height:1px;background:#f0ece8;margin-bottom:1.25rem;"></div>

      <!-- Account details -->
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.9rem;margin-bottom:0.5rem;">
        ${[
          ['ชื่อองค์กร',        acc.org_name],
          ['ผู้ติดต่อ',         acc.contact_name],
          ['อีเมล',             acc.contact_email],
          ['เบอร์โทร',          acc.contact_phone || '—'],
          ['อุปกรณ์ที่บริจาค',  (acc.device_count || 0) + ' เครื่อง'],
          ['สถานะ',             acc.status === 'active' ? '✅ ใช้งานอยู่' : (acc.status || '—')],
        ].map(([l, v]) => `
          <div style="background:#f8f6f3;border-radius:10px;padding:0.8rem 1rem;">
            <div style="font-size:0.7rem;color:#9ca3af;font-weight:700;
                        text-transform:uppercase;letter-spacing:0.04em;margin-bottom:0.2rem;">${l}</div>
            <div style="font-size:0.9rem;color:#1a2421;font-weight:600;">${escapeHtml(v || '—')}</div>
          </div>`).join('')}
      </div>

      <!-- Device quota progress bar -->
      ${(() => {
        const donated = acc.device_count || 0;
        const quota = acc.quota_max || (acc.package === 'S' ? 20 : acc.package === 'M' ? 70 : 150);
        const pct = Math.min(100, Math.round((donated / quota) * 100));
        return `
        <div style="margin-top:1.25rem;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;
                      font-size:0.83rem;color:#6b7c72;margin-bottom:0.45rem;">
            <span style="font-weight:600;color:#1a2421;">จำนวนเครื่องที่บริจาค</span>
            <span><strong style="color:${color};font-size:1rem;">${donated}</strong> / ${quota} เครื่อง (${pct}%)</span>
          </div>
          <div style="height:12px;background:#e5e7eb;border-radius:6px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${color};border-radius:6px;transition:width 1s;"></div>
          </div>
          <div style="font-size:0.75rem;color:#9ca3af;margin-top:0.3rem;text-align:right;">
            เหลืออีก ${Math.max(0, quota - donated)} เครื่องตามโควต้าแพ็คเกจ
          </div>
        </div>`;
      })()}
      ${progressHtml}
      ${evtSummaryHtml}
    </div>`;
}

// ─── Logout ───────────────────────────────────────────────
function logout() {
    sessionStorage.removeItem('gearup_corp_portal');
    _cpSession = null;
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('loginScreen').style.display    = 'flex';
    // Clear login fields
    const emailEl   = document.getElementById('cpEmail');
    const orgEl     = document.getElementById('cpOrgName');
    const errEl     = document.getElementById('cpLoginError');
    if (emailEl)  emailEl.value        = '';
    if (orgEl)    orgEl.value          = '';
    if (errEl)    errEl.style.display  = 'none';
}
