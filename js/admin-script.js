// ==========================================
// GEARUP Admin Panel — admin-script.js
// Vanilla JS + Supabase (no frameworks)
// ==========================================

// === SUPABASE INIT ===
const SUPABASE_URL = 'https://wavhxkawlzeyhtthffhs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhdmh4a2F3bHpleWh0dGhmZmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNzU3NTEsImV4cCI6MjA4NjY1MTc1MX0.NERS8pASDTG2UkgMylMLDPSu6NkNFIec_FAYD6LtTtU';

// Use supabaseClient — NOT supabase (Safari CDN variable shadowing prevention)
let supabaseClient = null;
try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
    console.error('Supabase init failed:', e.message);
}

// === STATE ===
let adminUser = null;
let currentSection = 'dashboard';
const PAGE_SIZE = 20;
const currentPage = {
    donations: 1,
    requests: 1,
    recycle: 1,
    users: 1,
    audit: 1,
};
let verifyDonationId = null;
let confirmResolve = null;

// Row caches — keyed by row.id, used to pass data to modals without JSON-in-onclick
let _donationRowCache = {};
let _requestRowCache = {};

// Debounce timers
const _debounceTimers = {};

// Donation flow statuses
const DONATION_STATUSES = [
    'submitted', 'verified', 'scheduled', 'picked_up',
    'processing', 'data_wiped', 'ready', 'distributed', 'completed',
];

// Statuses admin can manually set (simplified 5-step flow)
const DONATION_STATUS_EDITABLE = [
    'verified', 'picked_up', 'processing', 'distributed', 'completed',
];

// Request flow statuses
const REQUEST_STATUSES = [
    'submitted', 'approved', 'matching', 'preparing',
    'in_transit', 'delivered', 'completed',
];

const STATUS_LABELS_TH = {
    submitted:   'รอตรวจสอบ',
    verified:    'ตรวจสอบ',
    scheduled:   'นัดรับ',
    picked_up:   'รับอุปกรณ์',
    processing:  'ดำเนินการ',
    data_wiped:  'ลบข้อมูลแล้ว',
    ready:       'พร้อมจัดส่ง',
    distributed: 'จัดส่งสำเร็จ',
    completed:   'เสร็จสมบูรณ์',
    approved:    'อนุมัติแล้ว',
    matching:    'กำลังจับคู่',
    preparing:   'เตรียมพร้อม',
    in_transit:  'กำลังขนส่ง',
    delivered:   'ส่งถึงแล้ว',
};

const CARRIER_LABELS = {
    thailand_post: 'ไปรษณีย์ไทย',
    jt: 'J&T Express',
    flash: 'Flash Express',
    kerry: 'Kerry Express',
    other: 'อื่นๆ',
};

// === PAGE INIT ===
document.addEventListener('DOMContentLoaded', () => {
    initHeaderDate();
    attachSearchDebounce('donationSearch', () => loadDonations(1));
    attachSearchDebounce('requestSearch', () => loadRequests(1));
    attachSearchDebounce('recycleSearch', () => loadRecycle(1));
    attachSearchDebounce('userSearch', () => loadUsers(1));
    attachSearchDebounce('auditSearch', () => loadAuditLogs(1));

    document.getElementById('donationStatusFilter')?.addEventListener('change', () => loadDonations(1));
    document.getElementById('requestStatusFilter')?.addEventListener('change', () => loadRequests(1));
    document.getElementById('requestOrgFilter')?.addEventListener('change', () => loadRequests(1));
    document.getElementById('userRoleFilter')?.addEventListener('change', () => loadUsers(1));
    document.getElementById('auditEventFilter')?.addEventListener('change', () => loadAuditLogs(1));

    document.getElementById('loginPassword')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') adminLogin();
    });

    checkAdminAuth();
});

function initHeaderDate() {
    const el = document.getElementById('headerDate');
    if (!el) return;
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    el.textContent = now.toLocaleDateString('th-TH', options);
}

function attachSearchDebounce(inputId, fn) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.addEventListener('input', () => {
        clearTimeout(_debounceTimers[inputId]);
        _debounceTimers[inputId] = setTimeout(fn, 300);
    });
}

// ==========================================
// AUTH
// ==========================================

async function checkAdminAuth() {
    if (!supabaseClient) {
        showLoginScreen();
        return;
    }
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            showLoginScreen();
            return;
        }
        await verifyAndLoadAdmin(session.user);
    } catch (err) {
        console.error('Auth check failed:', err);
        showLoginScreen();
    }
}

async function adminLogin() {
    const email = document.getElementById('loginEmail')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;
    const btn = document.getElementById('btnAdminLogin');
    const errorEl = document.getElementById('loginError');

    errorEl.style.display = 'none';

    if (!email || !password) {
        showLoginError('กรุณากรอกอีเมลและรหัสผ่าน');
        return;
    }

    if (!supabaseClient) {
        showLoginError('ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่อีกครั้ง');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'กำลังเข้าสู่ระบบ...';

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await verifyAndLoadAdmin(data.user);
    } catch (err) {
        const msg = err.message || 'เกิดข้อผิดพลาด';
        if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
            showLoginError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        } else {
            showLoginError(msg);
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'เข้าสู่ระบบ';
    }
}

async function verifyAndLoadAdmin(user) {
    try {
        const { data: profile, error } = await supabaseClient
            .from('users')
            .select('id, name, email, role')
            .eq('id', user.id)
            .single();

        if (error || !profile) {
            await supabaseClient.auth.signOut();
            showLoginError('ไม่พบข้อมูลผู้ใช้ กรุณาติดต่อผู้ดูแลระบบ');
            return;
        }

        if (profile.role !== 'admin') {
            await supabaseClient.auth.signOut();
            showLoginError('คุณไม่มีสิทธิ์เข้าถึงระบบนี้');
            return;
        }

        adminUser = { ...user, ...profile };
        showAdminApp();
    } catch (err) {
        await supabaseClient.auth.signOut();
        showLoginError('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์: ' + err.message);
    }
}

async function adminLogout() {
    const confirmed = await showConfirm('ออกจากระบบ', 'คุณต้องการออกจากระบบใช่หรือไม่?');
    if (!confirmed) return;
    try {
        await supabaseClient?.auth.signOut();
    } catch (_) { /* ignore */ }
    adminUser = null;
    showLoginScreen();
    showNotification('ออกจากระบบเรียบร้อย', 'success');
}

function showLoginError(msg) {
    const el = document.getElementById('loginError');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminApp').style.display = 'none';
}

function showAdminApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminApp').style.display = 'flex';

    // Populate sidebar user info
    const nameEl = document.getElementById('sidebarUserName');
    const avatarEl = document.getElementById('sidebarAvatarLetter');
    const displayName = adminUser?.name || adminUser?.email || 'Admin';
    if (nameEl) nameEl.textContent = displayName;
    if (avatarEl) avatarEl.textContent = (displayName[0] || 'A').toUpperCase();

    initRealtimeNotifications();
    showSection('dashboard');
}

async function initRealtimeNotifications() {
    if (!supabaseClient) return;

    // Load initial pending counts on startup
    await loadInitialBadges();

    supabaseClient
        .channel('admin-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donations' }, (payload) => {
            const trackingId = payload.new?.tracking_id || '';
            showNotification(`📦 มีการบริจาคใหม่เข้ามา${trackingId ? ' (' + trackingId + ')' : ''}`, 'info');
            updateSidebarBadge('donations', 1);
            if (currentSection === 'donations') loadDonations(1);
            if (currentSection === 'dashboard') loadDashboard();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, (payload) => {
            const trackingId = payload.new?.tracking_id || '';
            showNotification(`🏫 มีคำขอรับบริจาคใหม่${trackingId ? ' (' + trackingId + ')' : ''}`, 'info');
            updateSidebarBadge('requests', 1);
            if (currentSection === 'requests') loadRequests(1);
            if (currentSection === 'dashboard') loadDashboard();
        })
        .subscribe();
}

async function loadInitialBadges() {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const since = todayStart.toISOString();

        const [{ count: donCount }, { count: reqCount }] = await Promise.all([
            supabaseClient.from('donations').select('id', { count: 'exact', head: true }).eq('current_status', 'submitted').gte('created_at', since),
            supabaseClient.from('requests').select('id', { count: 'exact', head: true }).eq('fulfillment_status', 'submitted').gte('created_at', since),
        ]);
        if (donCount > 0) updateSidebarBadge('donations', donCount, true);
        if (reqCount > 0) updateSidebarBadge('requests', reqCount, true);
    } catch (e) {
        console.error('loadInitialBadges error:', e);
    }
}

function updateSidebarBadge(section, delta = 1, setAbsolute = false) {
    const menuItem = document.querySelector(`[onclick*="showSection('${section}')"]`);
    if (!menuItem) return;
    let badge = menuItem.querySelector('.nav-badge');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nav-badge';
        badge.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;background:#ef4444;color:#fff;border-radius:50%;width:18px;height:18px;font-size:0.7rem;font-weight:700;margin-left:6px;';
        menuItem.appendChild(badge);
    }
    const current = setAbsolute ? delta : parseInt(badge.dataset.count || '0') + delta;
    badge.dataset.count = current;
    badge.textContent = current > 9 ? '9+' : current;
}

// ==========================================
// NAVIGATION
// ==========================================

const SECTION_TITLES = {
    dashboard: 'ภาพรวมระบบ GEARUP',
    donations: 'การบริจาค',
    requests: 'คำขอรับบริจาค',
    recycle: 'รีไซเคิล',
    users: 'ผู้ใช้งาน',
    audit: 'บันทึกกิจกรรม',
    corporate: 'องค์กร CSR & ESG',
    events: '📅 กิจกรรม / นัดหมาย',
    schools: '🏫 โรงเรียน / องค์กรผู้รับ',
};

function showSection(sectionName) {
    currentSection = sectionName;

    // Clear notification badge for this section
    const menuItem = document.querySelector(`[onclick*="showSection('${sectionName}')"]`);
    if (menuItem) {
        const badge = menuItem.querySelector('.nav-badge');
        if (badge) badge.remove();
    }

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach((item) => {
        item.classList.toggle('active', item.dataset.section === sectionName);
    });

    // Update section visibility
    document.querySelectorAll('.section').forEach((sec) => {
        sec.classList.remove('active');
    });
    const target = document.getElementById('section-' + sectionName);
    if (target) target.classList.add('active');

    // Update header title
    const titleEl = document.getElementById('sectionTitle');
    if (titleEl) titleEl.textContent = SECTION_TITLES[sectionName] || sectionName;

    // Close mobile sidebar
    closeSidebar();

    // Load data for the section
    switch (sectionName) {
        case 'dashboard': loadDashboard(); break;
        case 'donations': loadDonations(1); break;
        case 'requests':  loadRequests(1); break;
        case 'recycle':   loadRecycle(1); break;
        case 'users':     loadUsers(1); break;
        case 'audit':     loadAuditLogs(1); break;
        case 'corporate': loadCorporateSection(); break;
        case 'events': loadEvents(); break;
        case 'schools': loadSchools(); break;
    }
}

// ==========================================
// SIDEBAR MOBILE TOGGLE
// ==========================================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const isOpen = sidebar.classList.contains('open');
    if (isOpen) {
        closeSidebar();
    } else {
        sidebar.classList.add('open');
        overlay.classList.add('open');
    }
}

function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('open');
}

// ==========================================
// DASHBOARD
// ==========================================

let _statusDonutChart = null;
let _weeklyBarChart = null;
let _schoolAidChart   = null;
let _schoolAidAllRows = [];   // full dataset for re-sorting
let _schoolAidSort    = 'asc';

async function loadDashboard() {
    await Promise.all([loadDashboardStats(), loadRecentActivity()]);
}

async function loadDashboardStats() {
    if (!supabaseClient) return;

    try {
        const today = new Date().toISOString().slice(0, 10);
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

        const [
            allDonationsRes, pendingRes, requestsRes, recycleRes, carbonRes, usersRes,
            recentDonationsRes, deviceTypesRes, requestStatusRes, corpInquiriesRes,
            schoolRequestsRes, schoolDonationsRes,
        ] = await Promise.all([
            supabaseClient.from('donations').select('id, current_status, created_at', { count: 'exact' }),
            supabaseClient.from('donations').select('id', { count: 'exact', head: true }).eq('current_status', 'submitted'),
            supabaseClient.from('requests').select('id, is_public_post, fulfillment_status', { count: 'exact' }),
            supabaseClient.from('recycling_redirects').select('id', { count: 'exact', head: true }).gte('created_at', today),
            supabaseClient.from('donations').select('carbon_saved, total_weight'),
            supabaseClient.from('users').select('id', { count: 'exact', head: true }),
            supabaseClient.from('donations').select('created_at').gte('created_at', sevenDaysAgo),
            supabaseClient.from('donation_items').select('device_type'),
            supabaseClient.from('requests').select('id, is_public_post').is('is_public_post', false),
            supabaseClient.from('corporate_inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
            supabaseClient.from('requests').select('id, project_name, contact_name, quantity').eq('is_public_post', true).not('quantity', 'is', null).order('quantity', { ascending: false }).limit(20),
            supabaseClient.from('donations').select('direct_donation_to_request_id, total_items').not('direct_donation_to_request_id', 'is', null).in('current_status', ['distributed','completed','ready','processing','data_wiped','picked_up','scheduled','verified']),
        ]);

        // ── KPI cards ──
        const allDonations = allDonationsRes.data || [];
        const totalCount   = allDonationsRes.count ?? allDonations.length;
        const completedCount = allDonations.filter(d => d.current_status === 'completed').length;
        const pendingCount = pendingRes.count ?? 0;

        setStatValue('stat-donations', totalCount);
        setStatValue('stat-pending', pendingCount);
        setStatValue('stat-requests', requestsRes.count ?? '—');
        setStatValue('stat-recycle', recycleRes.count ?? '—');
        setStatValue('stat-users', usersRes.count ?? '—');

        const allCarbon = carbonRes.data || [];
        const totalCarbon = allCarbon.reduce((s, r) => s + parseFloat(r.carbon_saved || 0), 0);
        const totalWeight = allCarbon.reduce((s, r) => s + parseFloat(r.total_weight || 0), 0);
        setStatValue('stat-carbon', totalCarbon > 1000
            ? (totalCarbon / 1000).toFixed(1) + 'k'
            : Math.round(totalCarbon).toString());

        const subEl = id => document.getElementById(id);
        if (subEl('stat-donations-sub')) subEl('stat-donations-sub').textContent = `เสร็จสิ้น ${completedCount} รายการ`;
        if (subEl('stat-pending-trend')) subEl('stat-pending-trend').textContent = pendingCount > 5 ? `⚠ ${pendingCount} รายการรอตรวจ` : pendingCount > 0 ? `${pendingCount} รายการรอตรวจ` : '✓ ไม่มีรายการค้าง';
        if (subEl('stat-requests-sub')) {
            const pubCount = (requestsRes.data || []).filter(r => r.is_public_post).length;
            subEl('stat-requests-sub').textContent = `โพสต์สาธารณะ ${pubCount} รายการ`;
        }
        if (subEl('stat-carbon-sub')) subEl('stat-carbon-sub').textContent = `น้ำหนักรวม ${totalWeight.toFixed(1)} กก.`;
        if (subEl('stat-completed-sub')) subEl('stat-completed-sub').textContent = `อัตราสำเร็จ ${totalCount ? Math.round(completedCount / totalCount * 100) : 0}%`;

        // ── Status donut chart ──
        const statusCounts = {};
        allDonations.forEach(d => { statusCounts[d.current_status] = (statusCounts[d.current_status] || 0) + 1; });
        renderStatusDonut(statusCounts);

        // ── Weekly bar chart ──
        const dayCounts = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date(Date.now() - i * 86400000);
            dayCounts[d.toISOString().slice(0, 10)] = 0;
        }
        (recentDonationsRes.data || []).forEach(r => {
            const day = r.created_at.slice(0, 10);
            if (day in dayCounts) dayCounts[day]++;
        });
        renderWeeklyBar(dayCounts);

        // ── Device type bars ──
        const deviceCounts = {};
        (deviceTypesRes.data || []).forEach(r => {
            const t = r.device_type || 'อื่นๆ';
            deviceCounts[t] = (deviceCounts[t] || 0) + 1;
        });
        renderDeviceBars(deviceCounts);

        // ── Pending actions ──
        const unapprovedRequests = (requestStatusRes.data || []).length;
        renderPendingActions({
            donations: pendingCount,
            requests: unapprovedRequests,
            corporate: corpInquiriesRes.count ?? 0,
        });

        // ── School aid chart ──
        renderSchoolAidChart(schoolRequestsRes.data || [], schoolDonationsRes.data || []);

        // ── Key metrics ──
        const fulfilledRequests = (requestsRes.data || []).filter(r => r.fulfillment_status === 'fulfilled').length;
        renderKeyMetrics({
            completionRate: totalCount ? Math.round(completedCount / totalCount * 100) : 0,
            avgCarbon: completedCount ? (totalCarbon / completedCount).toFixed(1) : 0,
            totalWeight: totalWeight.toFixed(1),
            fulfilledRequests,
            totalRequests: requestsRes.count ?? 0,
            treesEq: Math.round(totalCarbon / 21.7),
        });

    } catch (err) {
        console.error('loadDashboardStats error:', err);
    }
}

function setStatValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function renderStatusDonut(statusCounts) {
    const STATUS_LABELS_TH = {
        submitted: 'รอตรวจสอบ', verified: 'ตรวจสอบแล้ว', scheduled: 'นัดรับ',
        picked_up: 'รับพัสดุแล้ว', processing: 'กำลังดำเนิน', data_wiped: 'ลบข้อมูลแล้ว',
        ready: 'พร้อมจัดส่ง', distributed: 'จัดส่งแล้ว', completed: 'สำเร็จ',
    };
    const COLORS = ['#f59e0b','#3b82f6','#8b5cf6','#14b8a6','#f97316','#06b6d4','#84cc16','#ec4899','#2f5233'];
    const entries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
    const labels = entries.map(([k]) => STATUS_LABELS_TH[k] || k);
    const values = entries.map(([, v]) => v);
    const total  = values.reduce((s, v) => s + v, 0);
    const colors = entries.map((_, i) => COLORS[i % COLORS.length]);

    const canvas = document.getElementById('statusDonutChart');
    if (!canvas) return;

    if (_statusDonutChart) { _statusDonutChart.destroy(); _statusDonutChart = null; }
    _statusDonutChart = new Chart(canvas, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
        options: {
            cutout: '68%', responsive: false, plugins: { legend: { display: false }, tooltip: {
                callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} (${total ? Math.round(ctx.raw/total*100) : 0}%)` }
            }},
        },
    });

    const legendEl = document.getElementById('donutLegend');
    if (legendEl) {
        legendEl.innerHTML = entries.map(([k, v], i) => `
            <div class="donut-leg-item">
                <span class="donut-leg-dot" style="background:${colors[i]}"></span>
                <span>${STATUS_LABELS_TH[k] || k}</span>
                <span class="donut-leg-val">${v}</span>
            </div>`).join('');
    }
}

function renderWeeklyBar(dayCounts) {
    const canvas = document.getElementById('weeklyBarChart');
    if (!canvas) return;

    const labels = Object.keys(dayCounts).map(d => {
        const dt = new Date(d + 'T12:00:00');
        return dt.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
    });
    const values = Object.values(dayCounts);
    const maxVal = Math.max(...values, 1);

    if (_weeklyBarChart) { _weeklyBarChart.destroy(); _weeklyBarChart = null; }
    _weeklyBarChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'การบริจาค',
                data: values,
                backgroundColor: values.map((v, i) => i === values.length - 1 ? '#2f5233' : 'rgba(47,82,51,0.25)'),
                borderRadius: 6,
                borderSkipped: false,
            }],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: {
                callbacks: { label: ctx => ` ${ctx.raw} การบริจาค` }
            }},
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { stepSize: 1, precision: 0, font: { size: 11 } }, min: 0, suggestedMax: maxVal + 1 },
            },
        },
    });
}

function renderDeviceBars(deviceCounts) {
    const el = document.getElementById('deviceTypeBars');
    if (!el) return;
    const DEVICE_TH = { Computer: 'คอมพิวเตอร์', Laptop: 'แล็ปท็อป', Tablet: 'แท็บเล็ต', Phone: 'โทรศัพท์' };
    const COLORS = { Computer: '#2f5233', Laptop: '#3b82f6', Tablet: '#f59e0b', Phone: '#8b5cf6' };
    const entries = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1]);
    const total   = entries.reduce((s, [, v]) => s + v, 0) || 1;

    if (entries.length === 0) { el.innerHTML = '<div style="padding:16px;color:#aaa;font-size:0.82rem;">ยังไม่มีข้อมูล</div>'; return; }

    el.innerHTML = entries.map(([type, count]) => {
        const pct = Math.round(count / total * 100);
        const color = COLORS[type] || '#8b7355';
        return `<div class="device-bar-item">
            <div class="device-bar-label-row"><span>${DEVICE_TH[type] || type}</span><span>${count} ชิ้น · ${pct}%</span></div>
            <div class="device-bar-track"><div class="device-bar-fill" style="width:${pct}%;background:${color}"></div></div>
        </div>`;
    }).join('');
}

function renderPendingActions({ donations, requests, corporate }) {
    const el = document.getElementById('pendingActions');
    if (!el) return;

    const items = [
        { icon: '📦', label: 'การบริจาครอตรวจสอบ', sub: 'ต้องอนุมัติก่อนดำเนินการต่อ', count: donations, action: "showSection('donations')", urgent: donations > 5 },
        { icon: '🏫', label: 'คำขอรอการอนุมัติ', sub: 'ยังไม่เป็น Public Post', count: requests, action: "showSection('requests')", urgent: requests > 3 },
        { icon: '🏢', label: 'Inquiry องค์กรใหม่', sub: 'รอการติดต่อกลับ', count: corporate, action: "showSection('corporate')", urgent: corporate > 0 },
    ];

    el.innerHTML = items.map(item => {
        const cls = item.urgent ? 'urgent' : item.count > 0 ? 'warn' : 'ok';
        const label = item.count === 0 ? 'เรียบร้อย' : `${item.count} รายการ`;
        return `<div class="pending-item">
            <div class="pending-item-left">
                <span class="pending-item-icon">${item.icon}</span>
                <div>
                    <div class="pending-item-label">${item.label}</div>
                    <div class="pending-item-sub">${item.sub}</div>
                </div>
            </div>
            <button class="btn btn-outline btn-sm pending-action-btn" onclick="${item.action}">
                <span class="pending-badge ${cls}">${label}</span>
            </button>
        </div>`;
    }).join('');
}

function renderKeyMetrics({ completionRate, avgCarbon, totalWeight, fulfilledRequests, totalRequests, treesEq }) {
    const el = document.getElementById('keyMetrics');
    if (!el) return;
    el.innerHTML = `
        <div class="metric-item">
            <div class="metric-label">อัตราการบริจาคสำเร็จ<small>Completion Rate</small></div>
            <div class="metric-value">${completionRate}%<small>จากทั้งหมด</small></div>
        </div>
        <div class="metric-item">
            <div class="metric-label">คาร์บอนเฉลี่ยต่อการบริจาค<small>Avg Carbon / Donation</small></div>
            <div class="metric-value">${avgCarbon}<small>kgCO₂e</small></div>
        </div>
        <div class="metric-item">
            <div class="metric-label">น้ำหนักอุปกรณ์รวม<small>Total Equipment Weight</small></div>
            <div class="metric-value">${totalWeight}<small>กิโลกรัม</small></div>
        </div>
        <div class="metric-item">
            <div class="metric-label">คำขอที่ได้รับการเติมเต็ม<small>Fulfilled Requests</small></div>
            <div class="metric-value">${fulfilledRequests}<small>จาก ${totalRequests} รายการ</small></div>
        </div>
        <div class="metric-item">
            <div class="metric-label">เทียบเท่าต้นไม้ที่ปลูก<small>Equivalent Trees</small></div>
            <div class="metric-value">${treesEq.toLocaleString()}<small>ต้น</small></div>
        </div>`;
}

function renderSchoolAidChart(schools, donations) {
    const chartEl = document.getElementById('schoolAidChart');
    const emptyEl = document.getElementById('schoolChartEmpty');
    if (!chartEl) return;

    if (!schools.length) {
        chartEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = '';
        return;
    }
    if (emptyEl) emptyEl.style.display = 'none';
    chartEl.style.display = '';

    // Sum received devices per request
    const receivedMap = {};
    donations.forEach(d => {
        const rid = d.direct_donation_to_request_id;
        if (rid) receivedMap[rid] = (receivedMap[rid] || 0) + (parseInt(d.total_items) || 0);
    });

    // Build full sorted dataset and cache it
    _schoolAidAllRows = schools.map(r => ({
        label: (r.project_name || r.contact_name || 'ไม่ระบุ').slice(0, 30),
        requested: parseInt(r.quantity) || 0,
        received: receivedMap[r.id] || 0,
    })).sort((a, b) => a.received - b.received);

    _schoolAidSort = 'asc';
    _drawSchoolAidChart();
}

function filterSchoolAidChart(sort) {
    _schoolAidSort = sort;
    // Update button styles
    const btnAsc  = document.getElementById('btnSchoolSortAsc');
    const btnDesc = document.getElementById('btnSchoolSortDesc');
    if (btnAsc)  { btnAsc.style.background  = sort === 'asc'  ? 'var(--primary)' : ''; btnAsc.style.color  = sort === 'asc'  ? 'white' : ''; }
    if (btnDesc) { btnDesc.style.background = sort === 'desc' ? 'var(--primary)' : ''; btnDesc.style.color = sort === 'desc' ? 'white' : ''; }
    _drawSchoolAidChart();
}

function _drawSchoolAidChart() {
    const el = document.getElementById('schoolAidChart');
    if (!el || !_schoolAidAllRows.length) return;

    const sorted = _schoolAidSort === 'desc'
        ? [..._schoolAidAllRows].sort((a, b) => b.received - a.received)
        : [..._schoolAidAllRows].sort((a, b) => a.received - b.received);

    const rows = sorted.slice(0, 10);
    const total = _schoolAidAllRows.length;
    const maxVal = Math.max(...rows.map(r => r.requested), 1);

    el.innerHTML = `
        <div style="display:flex;gap:1rem;justify-content:flex-end;padding:0.25rem 0 0.75rem;font-size:0.78rem;color:#666;">
            <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:2px;background:rgba(47,82,51,0.82);display:inline-block;"></span>ได้รับแล้ว</span>
            <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:2px;background:rgba(212,165,116,0.6);display:inline-block;"></span>ยังขาด</span>
        </div>
        ${rows.map(r => {
            const recPct  = Math.min(r.received / maxVal * 100, 100).toFixed(1);
            const pendAmt = Math.max(r.requested - r.received, 0);
            const pendPct = Math.min(pendAmt / maxVal * 100, 100 - parseFloat(recPct)).toFixed(1);
            return `
            <div style="display:grid;grid-template-columns:200px 1fr 56px;align-items:center;gap:0.3rem 0.75rem;margin-bottom:0.45rem;">
                <div style="text-align:right;font-size:0.82rem;color:#1a2421;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(r.label)}">${escapeHtml(r.label)}</div>
                <div style="position:relative;height:14px;background:#f0ede8;border-radius:6px;overflow:hidden;">
                    <div style="position:absolute;left:0;top:0;height:100%;width:${recPct}%;background:rgba(47,82,51,0.82);border-radius:6px 0 0 6px;"></div>
                    <div style="position:absolute;left:${recPct}%;top:0;height:100%;width:${pendPct}%;background:rgba(212,165,116,0.6);"></div>
                </div>
                <div style="font-size:0.78rem;color:#666;white-space:nowrap;text-align:right;">${r.received}<span style="color:#ccc;">/</span>${r.requested}</div>
            </div>`;
        }).join('')}
        <div style="font-size:0.75rem;color:#aaa;text-align:center;margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid #f5f0eb;">จำนวนเครื่อง</div>
    `;

    const subtitle = document.getElementById('schoolChartSubtitle');
    const dirLabel = _schoolAidSort === 'desc' ? 'ได้รับมาก → น้อย' : 'ได้รับน้อย → มาก';
    if (subtitle) subtitle.textContent = `Top ${rows.length}${total > 10 ? '/' + total : ''} · ${dirLabel}`;

    // "ดูเพิ่มเติม" button
    const moreEl = document.getElementById('schoolChartMore');
    if (moreEl) {
        moreEl.innerHTML = total > 10
            ? `<button class="btn btn-sm btn-outline" onclick="showSection('requests')" style="font-size:0.78rem;">ดูทั้งหมด ${total} โรงเรียน →</button>`
            : '';
    }
}

async function loadRecentActivity() {
    if (!supabaseClient) return;
    const tbody = document.getElementById('recentActivityBody');
    if (!tbody) return;

    try {
        const { data, error } = await supabaseClient
            .from('donations')
            .select('id, tracking_id, current_status, total_items, created_at, users(name, email), donation_items(id)')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="5">ไม่มีข้อมูล</td></tr>';
            return;
        }

        tbody.innerHTML = data.map((row) => `
            <tr>
                <td class="text-small text-muted">${formatDate(row.created_at)}</td>
                <td class="monospace">${row.tracking_id || '—'}</td>
                <td>${escapeHtml(row.users?.name || row.users?.email || '—')}</td>
                <td>${(row.donation_items?.length || row.total_items || 0)} ชิ้น</td>
                <td>${getStatusBadge(row.current_status)}</td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="5">เกิดข้อผิดพลาด: ${escapeHtml(err.message)}</td></tr>`;
    }
}

// ==========================================
// DONATIONS
// ==========================================

async function loadDonations(page = 1) {
    currentPage.donations = page;
    if (!supabaseClient) return;

    const tbody = document.getElementById('donationsTableBody');
    const paginationEl = document.getElementById('donationsPagination');
    if (!tbody) return;

    tbody.innerHTML = '<tr class="loading-row"><td colspan="8"><span class="spinner"></span> กำลังโหลด...</td></tr>';

    const search = document.getElementById('donationSearch')?.value?.trim() || '';
    const statusFilter = document.getElementById('donationStatusFilter')?.value || '';
    const dateFrom = document.getElementById('donationDateFrom')?.value || '';
    const dateTo = document.getElementById('donationDateTo')?.value || '';

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
        let query = supabaseClient
            .from('donations')
            .select(`
                id, tracking_id, current_status, shipping_carrier,
                total_items, total_weight, photo_urls, created_at,
                direct_donation_to_request_id,
                users(name, email),
                donation_items(id),
                target_request:requests!direct_donation_to_request_id(tracking_id, org_name, project_name, contact_name, org_type)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (statusFilter) query = query.eq('current_status', statusFilter);
        if (search) query = query.or(`tracking_id.ilike.%${search}%`);
        if (dateFrom) query = query.gte('created_at', dateFrom);
        if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');

        const { data, error, count } = await query;
        if (error) throw error;

        renderDonationsTable(data || [], count || 0);
        renderPagination(paginationEl, page, Math.ceil((count || 0) / PAGE_SIZE), (p) => loadDonations(p));
        await loadDonationStatusMini();
    } catch (err) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="8">เกิดข้อผิดพลาด: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function renderDonationsTable(data, count) {
    const tbody = document.getElementById('donationsTableBody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="9">ไม่พบข้อมูลการบริจาค</td></tr>';
        return;
    }

    // Cache rows so modals can look up data by ID (avoids JSON-in-onclick attribute breakage)
    _donationRowCache = {};
    data.forEach(row => { _donationRowCache[row.id] = row; });

    tbody.innerHTML = data.map((row) => {
        const hasPhotos = Array.isArray(row.photo_urls) && row.photo_urls.length > 0;
        const canVerify = row.current_status === 'submitted';
        const donorName = escapeHtml(row.users?.name || row.users?.email || '—');
        const carrier = CARRIER_LABELS[row.shipping_carrier] || row.shipping_carrier || '—';
        const target = row.target_request;
        const targetCell = target
            ? `<span style="font-size:0.83rem;color:#2f5233;font-weight:600;display:block;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(target.org_name || target.project_name || target.contact_name || '')}">${escapeHtml(target.org_name || target.project_name || target.contact_name || '—')}</span>`
            : `<span style="color:#aaa;font-size:0.82rem;">ทั่วไป</span>`;

        return `
        <tr>
            <td class="text-small text-muted">${formatDate(row.created_at)}</td>
            <td class="monospace">${escapeHtml(row.tracking_id || '—')}</td>
            <td><span title="${donorName}" class="truncate" style="display:block;max-width:140px;">${donorName}</span></td>
            <td>${targetCell}</td>
            <td>${(row.donation_items?.length || row.total_items || 0)} ชิ้น</td>
            <td>${row.total_weight != null ? Number(row.total_weight).toFixed(1) : '—'}</td>
            <td>${getStatusBadge(row.current_status)}</td>
            <td class="text-small">${carrier}</td>
            <td>
                <div class="td-actions" style="display:flex;flex-wrap:wrap;gap:0.3rem;">
                    <button class="btn-act" onclick="openDonationDetail('${row.id}')">รายละเอียด</button>
                    ${canVerify ? `<button class="btn-act btn-act-green" onclick="openVerifyModal('${row.id}')">ตรวจสอบ</button>` : ''}
                    <button class="btn-act btn-act-blue" onclick="openStatusModal('${row.id}', 'donation', '${row.current_status}', '${escapeHtml(row.tracking_id || '')}')">อัพเดทสถานะ</button>
                    ${hasPhotos ? `<button class="btn-act" onclick="openPhotosModal('${row.id}')">ดูรูป</button>` : ''}
                    <button class="btn-act btn-act-del" onclick="deleteDonation('${row.id}', '${escapeHtml(row.tracking_id || row.id)}')">ลบ</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

async function loadDonationStatusMini() {
    const container = document.getElementById('donationStatusMini');
    if (!container || !supabaseClient) return;

    try {
        const promises = DONATION_STATUSES.map((s) =>
            supabaseClient.from('donations').select('id', { count: 'exact', head: true }).eq('current_status', s)
        );
        const results = await Promise.all(promises);
        container.innerHTML = DONATION_STATUSES.map((s, i) => `
            <div class="status-mini-card" onclick="applyDonationStatusFilter('${s}')">
                <span>${STATUS_LABELS_TH[s] || s}</span>
                <span class="count">${results[i].count ?? 0}</span>
            </div>
        `).join('');
    } catch (_) { /* ignore mini stats error */ }
}

function applyDonationStatusFilter(status) {
    const sel = document.getElementById('donationStatusFilter');
    if (sel) sel.value = status;
    loadDonations(1);
}

async function openVerifyModal(donationId) {
    verifyDonationId = donationId;
    const body = document.getElementById('verifyModalBody');
    if (!body) return;

    body.innerHTML = '<p class="text-muted"><span class="spinner"></span> กำลังโหลดรายการอุปกรณ์...</p>';
    openModal('modalVerify');

    try {
        const { data: items, error } = await supabaseClient
            .from('donation_items')
            .select('id, device_type, device_weight, carbon_saved, admin_verified')
            .eq('donation_id', donationId);

        if (error) throw error;

        if (!items || items.length === 0) {
            body.innerHTML = '<p class="text-muted">ไม่พบรายการอุปกรณ์ในการบริจาคนี้</p>';
            return;
        }

        body.innerHTML = `
            <p style="margin-bottom:1rem; font-size:0.95rem;">เลือกรายการอุปกรณ์ที่ได้รับและตรวจสอบแล้ว:</p>
            ${items.map((item) => `
                <div class="verify-item">
                    <input type="checkbox" id="verify_${item.id}" data-item-id="${item.id}" ${item.admin_verified ? 'checked' : ''}>
                    <div class="verify-item-info">
                        <div class="verify-item-name">${escapeHtml(item.device_type || '—')}</div>
                        <div class="verify-item-detail">
                            น้ำหนัก: ${item.device_weight != null ? Number(item.device_weight).toFixed(1) + ' kg' : '—'} |
                            Carbon: ${item.carbon_saved != null ? Number(item.carbon_saved).toFixed(2) + ' kgCO2e' : '—'}
                            ${item.admin_verified ? ' | <span style="color:#16a34a">&#10003; ตรวจสอบแล้ว</span>' : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
            <div class="form-group" style="margin-top:1.2rem;">
                <label>สถานะหลังตรวจสอบ</label>
                <select id="verifyNewStatus" class="form-control">
                    <option value="verified" selected>verified — ตรวจสอบแล้ว</option>
                    <option value="scheduled">scheduled — นัดรับ</option>
                </select>
            </div>
        `;
    } catch (err) {
        body.innerHTML = `<p style="color:var(--danger)">เกิดข้อผิดพลาด: ${escapeHtml(err.message)}</p>`;
    }
}

async function submitVerification() {
    if (!verifyDonationId || !supabaseClient) return;

    const btn = document.getElementById('btnSubmitVerify');
    btn.disabled = true;
    btn.textContent = 'กำลังบันทึก...';

    try {
        // Collect checked item IDs
        const checkboxes = document.querySelectorAll('#verifyModalBody input[type="checkbox"]');
        const verifiedIds = [];
        const unverifiedIds = [];
        checkboxes.forEach((cb) => {
            if (cb.checked) verifiedIds.push(cb.dataset.itemId);
            else unverifiedIds.push(cb.dataset.itemId);
        });

        const newStatus = document.getElementById('verifyNewStatus')?.value || 'verified';
        const now = new Date().toISOString();

        // Batch update verified items
        if (verifiedIds.length > 0) {
            const { error: verifiedErr } = await supabaseClient
                .from('donation_items')
                .update({ admin_verified: true, admin_verified_by: adminUser.id, admin_verified_at: now })
                .in('id', verifiedIds);
            if (verifiedErr) throw verifiedErr;
        }

        if (unverifiedIds.length > 0) {
            await supabaseClient
                .from('donation_items')
                .update({ admin_verified: false })
                .in('id', unverifiedIds);
        }

        // Update donation status
        const { error: statusErr } = await supabaseClient
            .from('donations')
            .update({ current_status: newStatus })
            .eq('id', verifyDonationId);
        if (statusErr) throw statusErr;

        // Insert tracking timeline entry
        await insertTrackingTimeline(verifyDonationId, null, newStatus);

        showNotification('ตรวจสอบการบริจาคเรียบร้อยแล้ว', 'success');
        closeModal('modalVerify');
        loadDonations(currentPage.donations);
    } catch (err) {
        showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'ยืนยันการตรวจสอบ';
        verifyDonationId = null;
    }
}

async function openDonationDetail(id) {
    if (!supabaseClient) return;

    const body = document.getElementById('donDetailBody');
    if (!body) return;
    body.innerHTML = '<p class="text-muted"><span class="spinner"></span> กำลังโหลด...</p>';
    openModal('modalDonationDetail');

    try {
        const [{ data, error }, { data: items, error: itemsError }] = await Promise.all([
            supabaseClient.from('donations').select('*, users(name, email), target_request:requests!direct_donation_to_request_id(tracking_id, org_name, project_name, contact_name, org_type, phone, equipment_type, fulfillment_status)').eq('id', id).single(),
            supabaseClient.from('donation_items').select('*').eq('donation_id', id)
        ]);
        if (error) throw error;

        // Photos gallery HTML
        const photoUrls = Array.isArray(data.photo_urls) ? data.photo_urls : [];
        const photosHtml = photoUrls.length > 0
            ? `<div class="photo-gallery">${photoUrls.map(url => {
                const safeUrl = escapeHtml(url);
                return `<img src="${safeUrl}" alt="photo" loading="lazy" onclick="window.open(this.src,'_blank')" title="คลิกเพื่อดูขนาดเต็ม">`;
              }).join('')}</div>`
            : '<span style="color:#999;">ไม่มีรูปภาพ</span>';

        // Items list HTML
        const itemsHtml = (items && items.length > 0)
            ? items.map((item, i) => `
                <div class="detail-row" style="padding:0.5rem 0; border-bottom:1px solid var(--border);">
                    <span class="detail-label">${i + 1}. ${escapeHtml(item.device_type || '—')}</span>
                    <span class="detail-value">
                        ${escapeHtml(item.device_brand || '')} ${escapeHtml(item.device_model || '')}
                        &nbsp;|&nbsp; ${item.device_weight != null ? Number(item.device_weight).toFixed(1) + ' kg' : '—'}
                        &nbsp;|&nbsp; สภาพ: ${escapeHtml(item.device_condition || '—')}
                        ${item.serial_number ? `&nbsp;|&nbsp; <span style="font-family:monospace;font-size:0.88em;background:#f3f4f6;padding:0.1em 0.4em;border-radius:4px;">S/N: ${escapeHtml(item.serial_number)}</span>` : ''}
                        ${item.admin_verified ? '&nbsp;<span style="color:#16a34a">&#10003; ตรวจสอบแล้ว</span>' : ''}
                    </span>
                </div>`).join('')
            : '<p class="text-muted">ไม่พบรายการอุปกรณ์</p>';

        const tr = data.target_request;
        const targetSectionHtml = tr
            ? `<div class="detail-section full-width" style="background:#f0f7f1;border:1.5px solid #2f5233;border-radius:10px;padding:1rem 1.2rem;margin-bottom:0.5rem;">
                <h4 style="color:#2f5233;margin-bottom:0.6rem;">📌 ปลายทาง — โพสต์ที่บริจาคให้</h4>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:0.4rem 1.5rem;">
                    <div class="detail-row"><span class="detail-label">รหัสคำขอ</span><span class="detail-value monospace">${escapeHtml(tr.tracking_id)}</span></div>
                    ${tr.org_name ? `<div class="detail-row"><span class="detail-label">ชื่อโรงเรียน/มูลนิธิ</span><span class="detail-value">${escapeHtml(tr.org_name)}</span></div>` : ''}
                    <div class="detail-row"><span class="detail-label">ชื่อโครงการ</span><span class="detail-value">${escapeHtml(tr.project_name || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">ผู้ติดต่อ</span><span class="detail-value">${escapeHtml(tr.contact_name || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">ประเภทองค์กร</span><span class="detail-value">${escapeHtml(tr.org_type || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">เบอร์โทร</span><span class="detail-value">${escapeHtml(tr.phone || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">อุปกรณ์ที่ขอ</span><span class="detail-value">${escapeHtml(tr.equipment_type || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">สถานะคำขอ</span><span class="detail-value">${getStatusBadge(tr.fulfillment_status)}</span></div>
                </div>
               </div>`
            : `<div class="detail-section full-width" style="background:#f8f8f8;border-radius:10px;padding:0.75rem 1.2rem;margin-bottom:0.5rem;color:#888;font-size:0.9rem;">
                📦 การบริจาคทั่วไป — ไม่ได้ระบุโพสต์ปลายทาง
               </div>`;

        body.innerHTML = `
            <div class="detail-grid">
                ${targetSectionHtml}
                <div class="detail-section">
                    <h4>ข้อมูลผู้บริจาค</h4>
                    <div class="detail-row"><span class="detail-label">Tracking ID</span><span class="detail-value monospace">${escapeHtml(data.tracking_id || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">ชื่อ</span><span class="detail-value">${escapeHtml(data.donor_name || data.users?.name || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">อีเมล</span><span class="detail-value">${escapeHtml(data.donor_email || data.users?.email || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">เบอร์โทร</span><span class="detail-value">${escapeHtml(data.donor_tel || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">ที่อยู่</span><span class="detail-value">${escapeHtml(data.donor_address || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">เลขผู้เสียภาษี</span><span class="detail-value">${escapeHtml(data.donor_tax_id || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">ชื่อองค์กร</span><span class="detail-value">${escapeHtml(data.donor_org_name || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">ประเภทผู้บริจาค</span><span class="detail-value">${escapeHtml(data.donor_type || '—')}</span></div>
                </div>
                <div class="detail-section">
                    <h4>รายละเอียดการบริจาค</h4>
                    <div class="detail-row"><span class="detail-label">สถานะ</span><span class="detail-value">${getStatusBadge(data.current_status)}</span></div>
                    <div class="detail-row"><span class="detail-label">จำนวน</span><span class="detail-value">${data.total_items || '—'} ชิ้น</span></div>
                    <div class="detail-row"><span class="detail-label">น้ำหนักรวม</span><span class="detail-value">${data.total_weight != null ? Number(data.total_weight).toFixed(1) + ' kg' : '—'}</span></div>
                    <div class="detail-row"><span class="detail-label">Carbon saved</span><span class="detail-value">${data.carbon_saved != null ? Number(data.carbon_saved).toFixed(2) + ' kgCO2e' : '—'}</span></div>
                    <div class="detail-row"><span class="detail-label">ขนส่ง</span><span class="detail-value">${escapeHtml(CARRIER_LABELS[data.shipping_carrier] || data.shipping_carrier || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">เลข tracking ขนส่ง</span><span class="detail-value monospace">${escapeHtml(data.shipping_tracking_id || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">วันที่ส่ง</span><span class="detail-value">${formatDate(data.created_at)}</span></div>
                </div>
                <div class="detail-section full-width">
                    <h4>รายการอุปกรณ์ (${items?.length || 0} รายการ)</h4>
                    ${itemsHtml}
                </div>
                <div class="detail-section full-width">
                    <h4>รูปภาพอุปกรณ์ (${photoUrls.length} รูป)</h4>
                    ${photosHtml}
                </div>
            </div>`;

        // Show verify button if applicable
        const verifyBtn = document.getElementById('donDetailVerifyBtn');
        if (verifyBtn) {
            verifyBtn.style.display = data.current_status === 'submitted' ? 'inline-flex' : 'none';
            verifyBtn.dataset.id = id;
        }
    } catch (err) {
        body.innerHTML = `<p style="color:var(--danger)">เกิดข้อผิดพลาด: ${escapeHtml(err.message)}</p>`;
    }
}

function verifyFromDetail() {
    const btn = document.getElementById('donDetailVerifyBtn');
    if (!btn) return;
    closeModal('modalDonationDetail');
    openVerifyModal(btn.dataset.id);
}

function openStatusModal(id, type, currentStatus, trackingId) {
    document.getElementById('statusModalId').value = id;
    document.getElementById('statusModalType').value = type;
    document.getElementById('statusModalTrackingId').textContent = trackingId || id;
    document.getElementById('statusModalCurrent').innerHTML = getStatusBadge(currentStatus);
    document.getElementById('statusModalNote').value = '';

    const statusList = type === 'donation' ? DONATION_STATUS_EDITABLE : REQUEST_STATUSES;
    const sel = document.getElementById('statusModalNew');
    sel.innerHTML = statusList.map((s) =>
        `<option value="${s}" ${s === currentStatus ? 'selected' : ''}>${STATUS_LABELS_TH[s] || s}</option>`
    ).join('');

    // Reset confirmation section
    const sec = document.getElementById('statusConfirmSection');
    if (sec) {
        sec.style.display = 'none';
        ['scConfirmName', 'scConfirmPhone'].forEach((id) => { const el = document.getElementById(id); if (el) el.value = ''; });
        ['scReceivedConfirmed', 'scItemsMatch', 'scItemsFunctional'].forEach((id) => { const el = document.getElementById(id); if (el) el.checked = false; });
    }

    openModal('modalStatus');
}

function onStatusSelectChange() {
    const val = document.getElementById('statusModalNew')?.value;
    const sec = document.getElementById('statusConfirmSection');
    if (sec) sec.style.display = val === 'distributed' ? 'block' : 'none';
}

async function submitStatusUpdate() {
    const id = document.getElementById('statusModalId')?.value;
    const type = document.getElementById('statusModalType')?.value;
    const newStatus = document.getElementById('statusModalNew')?.value;
    const note = document.getElementById('statusModalNote')?.value?.trim();

    if (!id || !newStatus || !supabaseClient) return;

    const table = type === 'donation' ? 'donations' : 'requests';

    try {
        const { error } = await supabaseClient
            .from(table)
            .update({ current_status: newStatus })
            .eq('id', id);
        if (error) throw error;

        const donationId = type === 'donation' ? id : null;
        const requestId = type === 'request' ? id : null;
        await insertTrackingTimeline(donationId, requestId, newStatus, note);

        // When marking a donation as distributed, save recipient confirmation
        if (type === 'donation' && newStatus === 'distributed') {
            const confirmName = document.getElementById('scConfirmName')?.value?.trim() || null;
            const confirmPhone = document.getElementById('scConfirmPhone')?.value?.trim() || null;
            const receivedConfirmed = document.getElementById('scReceivedConfirmed')?.checked ?? false;
            const itemsMatch = document.getElementById('scItemsMatch')?.checked ?? false;
            const itemsFunctional = document.getElementById('scItemsFunctional')?.checked ?? false;

            // Find the request this donation is directed to
            const { data: donRow } = await supabaseClient
                .from('donations')
                .select('direct_donation_to_request_id')
                .eq('id', id)
                .single();

            if (donRow?.direct_donation_to_request_id) {
                const reqId = donRow.direct_donation_to_request_id;
                await supabaseClient.from('recipient_confirmations').upsert({
                    request_id: reqId,
                    confirmed_by_name: confirmName,
                    confirmed_by_phone: confirmPhone,
                    received_confirmed: receivedConfirmed,
                    items_match: itemsMatch,
                    items_functional: itemsFunctional,
                    notes: note || null,
                    confirmed_at: new Date().toISOString(),
                }, { onConflict: 'request_id' });
            }
        }

        showNotification('อัพเดทสถานะเรียบร้อย', 'success');
        closeModal('modalStatus');

        if (type === 'donation') loadDonations(currentPage.donations);
        else loadRequests(currentPage.requests);
    } catch (err) {
        showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
}

async function deleteDonation(id, label) {
    const confirmed = await showConfirm('ลบการบริจาค', `ลบการบริจาค "${label}" ออกจากระบบ?`);
    if (!confirmed) return;
    try {
        // Delete related items first (FK constraint)
        await supabaseClient.from('donation_items').delete().eq('donation_id', id);
        await supabaseClient.from('tracking_timeline').delete().eq('donation_id', id);
        await supabaseClient.from('carbon_credits').delete().eq('donation_id', id);

        const { error } = await supabaseClient.from('donations').delete().eq('id', id);
        if (error) throw error;

        showNotification('ลบการบริจาคเรียบร้อยแล้ว', 'success');
        loadDonations(currentPage.donations);
    } catch (err) {
        showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
}

function openPhotosModal(donationId) {
    const container = document.getElementById('photoGalleryContainer');
    if (!container) return;

    const row = _donationRowCache[donationId];
    const photoUrls = (row && Array.isArray(row.photo_urls)) ? row.photo_urls : [];

    if (photoUrls.length === 0) {
        container.innerHTML = '<p class="text-muted" style="padding:1rem;">ไม่มีรูปภาพ</p>';
    } else {
        container.innerHTML = photoUrls.map((url) => {
            const safeUrl = escapeHtml(url);
            return `<img src="${safeUrl}" alt="donation photo" loading="lazy" onclick="window.open(this.src,'_blank')" title="คลิกเพื่อดูขนาดเต็ม">`;
        }).join('');
    }
    openModal('modalPhotos');
}

// ==========================================
// REQUESTS
// ==========================================

async function loadRequests(page = 1) {
    currentPage.requests = page;
    if (!supabaseClient) return;

    const tbody = document.getElementById('requestsTableBody');
    const paginationEl = document.getElementById('requestsPagination');
    if (!tbody) return;

    tbody.innerHTML = '<tr class="loading-row"><td colspan="7"><span class="spinner"></span> กำลังโหลด...</td></tr>';

    const search = document.getElementById('requestSearch')?.value?.trim() || '';
    const statusFilter = document.getElementById('requestStatusFilter')?.value || '';
    const orgFilter = document.getElementById('requestOrgFilter')?.value || '';

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
        let query = supabaseClient
            .from('requests')
            .select('id, tracking_id, org_type, contact_name, national_id, position, email, phone, address, project_name, project_overview, equipment_type, equipment_detail, quantity, shipping_method, document_url, current_status, is_public_post, post_priority, fulfillment_status, created_at, users(name, email)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (statusFilter) query = query.eq('current_status', statusFilter);
        if (orgFilter) query = query.eq('org_type', orgFilter);
        if (search) query = query.or(`tracking_id.ilike.%${search}%,org_type.ilike.%${search}%`);

        const { data, error, count } = await query;
        if (error) throw error;

        renderRequestsTable(data || [], count || 0);
        renderPagination(paginationEl, page, Math.ceil((count || 0) / PAGE_SIZE), (p) => loadRequests(p));
    } catch (err) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7">เกิดข้อผิดพลาด: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function renderRequestsTable(data, count) {
    const tbody = document.getElementById('requestsTableBody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="7">ไม่พบข้อมูลคำขอรับบริจาค</td></tr>';
        return;
    }

    tbody.innerHTML = data.map((row) => {
        const orgName = escapeHtml(row.org_name || row.contact_name || '—');
        const canApprove = !row.is_public_post && row.current_status === 'submitted';
        const isPublic = row.is_public_post;

        return `
        <tr>
            <td class="text-small text-muted">${formatDate(row.created_at)}</td>
            <td class="monospace">${escapeHtml(row.tracking_id || '—')}</td>
            <td><span title="${orgName}" class="truncate" style="display:block;max-width:140px;">${orgName}</span></td>
            <td class="text-small">${escapeHtml(row.equipment_type || '—')}</td>
            <td>${getStatusBadge(row.current_status)}</td>
            <td>
                <span class="badge ${isPublic ? 'badge-yes' : 'badge-no'}">${isPublic ? 'สาธารณะ' : 'ปิดอยู่'}</span>
            </td>
            <td>
                <div class="td-actions" style="display:flex;flex-wrap:wrap;gap:0.3rem;">
                    <button class="btn-act" onclick="openRequestDetail('${row.id}')">รายละเอียด</button>
                    ${canApprove ? `<button class="btn-act btn-act-green" onclick="openApproveModal('${row.id}', '${escapeHtml(row.tracking_id || '')}', '${orgName}')">อนุมัติ</button>` : ''}
                    <button class="btn-act btn-act-amber" onclick="togglePostVisibility('${row.id}', ${!isPublic}, ${isPublic})">${isPublic ? 'ซ่อน' : 'แสดง'}</button>
                    <button class="btn-act btn-act-blue" onclick="openStatusModal('${row.id}', 'request', '${row.current_status}', '${escapeHtml(row.tracking_id || '')}')">อัพเดทสถานะ</button>
                    <button class="btn-act btn-act-del" onclick="deleteRequest('${row.id}', '${escapeHtml(row.tracking_id || row.id)}')">ลบ</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

async function openRequestDetail(id) {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient
            .from('requests')
            .select('*, users(name, email)')
            .eq('id', id)
            .single();
        if (error) throw error;

        const isImage = (url) => url && /\.(jpg|jpeg|png|gif|webp)$/i.test(url.split('?')[0]);
        const docHtml = data.document_url
            ? isImage(data.document_url)
                ? `<img src="${escapeHtml(data.document_url)}" style="max-width:100%;border-radius:8px;margin-top:8px;cursor:pointer;" onclick="window.open('${escapeHtml(data.document_url)}','_blank')">`
                : `<a href="${escapeHtml(data.document_url)}" target="_blank" class="btn btn-outline btn-sm" style="margin-top:8px;">📄 เปิดไฟล์เอกสาร</a>`
            : '<span style="color:#999;">ไม่มีเอกสารแนบ</span>';

        document.getElementById('reqDetailBody').innerHTML = `
            <div class="detail-grid">
                <div class="detail-section">
                    <h4>ข้อมูลองค์กร / ผู้ติดต่อ</h4>
                    <div class="detail-row"><span class="detail-label">Tracking ID</span><span class="detail-value monospace">${escapeHtml(data.tracking_id || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">ประเภทองค์กร</span><span class="detail-value">${escapeHtml(data.org_type || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">ชื่อโรงเรียน/มูลนิธิ</span><span class="detail-value">${escapeHtml(data.org_name || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">ผู้ใช้ (Account)</span><span class="detail-value">${escapeHtml(data.users?.name || data.users?.email || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">ชื่อผู้ติดต่อ</span><span class="detail-value">${escapeHtml(data.contact_name || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">ตำแหน่ง</span><span class="detail-value">${escapeHtml(data.position || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">เลขบัตรประชาชน</span><span class="detail-value monospace">${escapeHtml(data.national_id || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">อีเมล</span><span class="detail-value">${escapeHtml(data.email || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">เบอร์โทร</span><span class="detail-value">${escapeHtml(data.phone || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">ที่อยู่</span><span class="detail-value">${escapeHtml(data.address || '—')}</span></div>
                </div>
                <div class="detail-section">
                    <h4>รายละเอียดโครงการ</h4>
                    <div class="detail-row"><span class="detail-label">ชื่อโครงการ</span><span class="detail-value">${escapeHtml(data.project_name || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">ภาพรวมโครงการ</span><span class="detail-value">${escapeHtml(data.project_overview || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">อุปกรณ์ที่ต้องการ</span><span class="detail-value">${escapeHtml(data.equipment_type || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">รายละเอียดอุปกรณ์</span><span class="detail-value">${escapeHtml(data.equipment_detail || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">จำนวนที่ต้องการ</span><span class="detail-value">${data.quantity || '—'} ชิ้น</span></div>
                    <div class="detail-row"><span class="detail-label">วิธีจัดส่ง</span><span class="detail-value">${escapeHtml(data.shipping_method || '—')}</span></div>
                    <div class="detail-row"><span class="detail-label">สถานะ</span><span class="detail-value">${getStatusBadge(data.current_status)}</span></div>
                    <div class="detail-row"><span class="detail-label">วันที่ยื่น</span><span class="detail-value">${formatDate(data.created_at)}</span></div>
                </div>
            </div>
            <div class="detail-section full-width" style="margin-top:1rem;">
                <h4>เอกสารและรูปภาพที่แนบมา</h4>
                <div class="detail-doc-preview">${docHtml}</div>
            </div>`;

        // Show approve button if not yet approved
        const approveBtn = document.getElementById('reqDetailApproveBtn');
        if (approveBtn) {
            const canApprove = !data.is_public_post && data.current_status !== 'approved';
            approveBtn.style.display = canApprove ? 'inline-flex' : 'none';
            approveBtn.dataset.id = data.id;
            approveBtn.dataset.trackingId = data.tracking_id || '';
            approveBtn.dataset.orgName = data.project_name || data.org_type || '';
        }

        openModal('modalRequestDetail');
    } catch (err) {
        showNotification('ไม่สามารถโหลดรายละเอียดได้: ' + err.message, 'error');
    }
}

function approveFromDetail() {
    const btn = document.getElementById('reqDetailApproveBtn');
    if (!btn) return;
    closeModal('modalRequestDetail');
    openApproveModal(btn.dataset.id, btn.dataset.trackingId, btn.dataset.orgName);
}

function openApproveModal(id, trackingId, orgName) {
    document.getElementById('approveModalId').value = id;
    document.getElementById('approveModalTrackingId').textContent = trackingId || id;
    document.getElementById('approveModalOrg').textContent = orgName || '—';
    document.getElementById('approvePriority').value = 'medium';
    openModal('modalApprove');
}

async function submitApproveRequest() {
    const id = document.getElementById('approveModalId')?.value;
    const priorityStr = document.getElementById('approvePriority')?.value || 'medium';
    const priorityMap = { high: 1, medium: 2, low: 3 };
    const priority = priorityMap[priorityStr] ?? 2;
    if (!id || !supabaseClient) return;

    try {
        const { error } = await supabaseClient
            .from('requests')
            .update({
                current_status: 'approved',
                is_public_post: true,
                post_priority: priority,
                fulfillment_status: 'open',
            })
            .eq('id', id);
        if (error) throw error;

        await insertTrackingTimeline(null, id, 'approved');

        showNotification('อนุมัติและเผยแพร่คำขอเรียบร้อยแล้ว', 'success');
        closeModal('modalApprove');
        loadRequests(currentPage.requests);
    } catch (err) {
        showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
}

async function togglePostVisibility(id, newVisible) {
    if (!supabaseClient) return;
    const action = newVisible ? 'แสดงโพสต์สาธารณะ' : 'ซ่อนโพสต์สาธารณะ';
    const confirmed = await showConfirm(action, `ต้องการ${action}ใช่หรือไม่?`);
    if (!confirmed) return;

    try {
        const { error } = await supabaseClient
            .from('requests')
            .update({ is_public_post: newVisible })
            .eq('id', id);
        if (error) throw error;

        showNotification(`${action}เรียบร้อยแล้ว`, 'success');
        loadRequests(currentPage.requests);
    } catch (err) {
        showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
}

async function deleteRequest(id, label) {
    const confirmed = await showConfirm('ลบคำขอรับบริจาค', `ลบคำขอ "${label}" ออกจากระบบ?`);
    if (!confirmed) return;
    try {
        await supabaseClient.from('tracking_timeline').delete().eq('request_id', id);
        const { error } = await supabaseClient.from('requests').delete().eq('id', id);
        if (error) throw error;
        showNotification('ลบคำขอเรียบร้อยแล้ว', 'success');
        loadRequests(currentPage.requests);
    } catch (err) {
        showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
}

// ==========================================
// RECYCLE
// ==========================================

async function loadRecycle(page = 1) {
    currentPage.recycle = page;
    if (!supabaseClient) return;

    const tbody = document.getElementById('recycleTableBody');
    const paginationEl = document.getElementById('recyclePagination');
    if (!tbody) return;

    tbody.innerHTML = '<tr class="loading-row"><td colspan="9"><span class="spinner"></span> กำลังโหลด...</td></tr>';

    const search = document.getElementById('recycleSearch')?.value?.trim() || '';
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
        let query = supabaseClient
            .from('recycling_redirects')
            .select('id, device_type, device_brand, device_model, serial_number, sender_name, sender_tel, sender_email, cert_requested, created_at', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (search) {
            query = query.or(`sender_name.ilike.%${search}%,device_type.ilike.%${search}%,device_brand.ilike.%${search}%`);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        renderRecycleTable(data || [], count || 0);
        renderPagination(paginationEl, page, Math.ceil((count || 0) / PAGE_SIZE), (p) => loadRecycle(p));
    } catch (err) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="9">เกิดข้อผิดพลาด: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function renderRecycleTable(data) {
    const tbody = document.getElementById('recycleTableBody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="9">ไม่พบข้อมูลรีไซเคิล</td></tr>';
        return;
    }

    tbody.innerHTML = data.map((row) => `
        <tr>
            <td class="text-small text-muted">${formatDate(row.created_at)}</td>
            <td>${escapeHtml(row.sender_name || '—')}</td>
            <td>${escapeHtml(row.device_type || '—')}</td>
            <td class="text-small">${escapeHtml(row.device_brand || '—')} ${escapeHtml(row.device_model || '')}</td>
            <td class="monospace text-small">${escapeHtml(row.serial_number || '—')}</td>
            <td class="text-small">${escapeHtml(row.sender_email || '—')}</td>
            <td class="text-small">${escapeHtml(row.sender_tel || '—')}</td>
            <td>
                <span class="badge ${row.cert_requested ? 'badge-yes' : 'badge-no'}">${row.cert_requested ? 'ขอ' : 'ไม่ขอ'}</span>
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteRecycle('${row.id}', '${escapeHtml(row.sender_name || row.id)}')">ลบ</button>
            </td>
        </tr>
    `).join('');
}

async function deleteRecycle(id, label) {
    const confirmed = await showConfirm('ลบข้อมูลรีไซเคิล', `ลบรายการของ "${label}" ออกจากระบบ?`);
    if (!confirmed) return;
    try {
        const { error } = await supabaseClient.from('recycling_redirects').delete().eq('id', id);
        if (error) throw error;
        showNotification('ลบข้อมูลรีไซเคิลเรียบร้อยแล้ว', 'success');
        loadRecycle(currentPage.recycle);
    } catch (err) {
        showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
}

// ==========================================
// USERS
// ==========================================

async function loadUsers(page = 1) {
    currentPage.users = page;
    if (!supabaseClient) return;

    const tbody = document.getElementById('usersTableBody');
    const paginationEl = document.getElementById('usersPagination');
    if (!tbody) return;

    tbody.innerHTML = '<tr class="loading-row"><td colspan="6"><span class="spinner"></span> กำลังโหลด...</td></tr>';

    const search = document.getElementById('userSearch')?.value?.trim() || '';
    const roleFilter = document.getElementById('userRoleFilter')?.value || '';
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
        let query = supabaseClient
            .from('users')
            .select('id, name, email, role, provider, created_at', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (roleFilter) query = query.eq('role', roleFilter);
        if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

        const { data, error, count } = await query;
        if (error) throw error;

        renderUsersTable(data || [], count || 0);
        renderPagination(paginationEl, page, Math.ceil((count || 0) / PAGE_SIZE), (p) => loadUsers(p));
    } catch (err) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">เกิดข้อผิดพลาด: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function renderUsersTable(data) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6">ไม่พบข้อมูลผู้ใช้งาน</td></tr>';
        return;
    }

    tbody.innerHTML = data.map((row) => {
        const isSelf = adminUser && row.id === adminUser.id;
        return `
        <tr>
            <td class="text-small text-muted">${formatDate(row.created_at)}</td>
            <td>${escapeHtml(row.name || '—')}</td>
            <td class="text-small">${escapeHtml(row.email || '—')}</td>
            <td><span class="badge badge-${row.role || 'user'}">${row.role || 'user'}</span></td>
            <td class="text-small text-muted">${escapeHtml(row.provider || 'email')}</td>
            <td>
                <div class="td-actions">
                    ${isSelf
                        ? '<span class="text-muted text-small">(บัญชีตัวเอง)</span>'
                        : `<select class="select-role" onchange="changeUserRole('${row.id}', this.value)" data-current="${row.role || 'user'}">
                                <option value="user" ${row.role === 'user' ? 'selected' : ''}>user</option>
                                <option value="admin" ${row.role === 'admin' ? 'selected' : ''}>admin</option>
                           </select>`
                    }
                </div>
            </td>
        </tr>`;
    }).join('');
}

async function changeUserRole(userId, newRole) {
    if (!supabaseClient) return;

    // Find the select element to revert if cancelled
    const selectEl = document.querySelector(`select[onchange*="${userId}"]`);
    const prevRole = selectEl?.dataset.current || 'user';

    const confirmed = await showConfirm(
        'เปลี่ยน Role',
        `เปลี่ยน Role ของผู้ใช้นี้เป็น "${newRole}"?`
    );

    if (!confirmed) {
        if (selectEl) selectEl.value = prevRole;
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('users')
            .update({ role: newRole })
            .eq('id', userId);
        if (error) throw error;

        if (selectEl) selectEl.dataset.current = newRole;
        showNotification(`เปลี่ยน Role เป็น "${newRole}" เรียบร้อยแล้ว`, 'success');
    } catch (err) {
        if (selectEl) selectEl.value = prevRole;
        showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
}

// ==========================================
// AUDIT LOGS
// ==========================================

async function loadAuditLogs(page = 1) {
    currentPage.audit = page;
    if (!supabaseClient) return;

    const tbody = document.getElementById('auditTableBody');
    const paginationEl = document.getElementById('auditPagination');
    if (!tbody) return;

    tbody.innerHTML = '<tr class="loading-row"><td colspan="4"><span class="spinner"></span> กำลังโหลด...</td></tr>';

    const search = document.getElementById('auditSearch')?.value?.trim() || '';
    const eventFilter = document.getElementById('auditEventFilter')?.value || '';
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
        let query = supabaseClient
            .from('audit_logs')
            .select('id, user_id, event_type, metadata, created_at', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (eventFilter) query = query.eq('event_type', eventFilter);
        if (search) query = query.ilike('event_type', `%${search}%`);

        const { data, error, count } = await query;
        if (error) throw error;

        const tbody2 = document.getElementById('auditTableBody');
        if (!tbody2) return;

        if (!data || data.length === 0) {
            tbody2.innerHTML = '<tr class="empty-row"><td colspan="4">ไม่พบข้อมูลบันทึกกิจกรรม</td></tr>';
        } else {
            tbody2.innerHTML = data.map((row) => {
                let metaStr = '—';
                if (row.metadata) {
                    try {
                        metaStr = typeof row.metadata === 'string'
                            ? row.metadata
                            : JSON.stringify(row.metadata);
                    } catch (_) { metaStr = String(row.metadata); }
                }
                return `
                <tr>
                    <td class="text-small text-muted">${formatDateTime(row.created_at)}</td>
                    <td class="monospace text-small">${escapeHtml(String(row.user_id || '—').slice(0, 16))}...</td>
                    <td><code style="font-size:0.82rem;background:#f4f2ef;padding:0.15rem 0.4rem;border-radius:4px;">${escapeHtml(row.event_type || '—')}</code></td>
                    <td><span class="meta-json" title="${escapeHtml(metaStr)}">${escapeHtml(metaStr)}</span></td>
                </tr>`;
            }).join('');
        }

        renderPagination(paginationEl, page, Math.ceil((count || 0) / PAGE_SIZE), (p) => loadAuditLogs(p));
    } catch (err) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="4">เกิดข้อผิดพลาด: ${escapeHtml(err.message)}</td></tr>`;
    }
}

// ==========================================
// TRACKING TIMELINE HELPER
// ==========================================

async function insertTrackingTimeline(donationId, requestId, status, note) {
    if (!supabaseClient) return;
    try {
        const entry = {
            status,
            status_display_th: STATUS_LABELS_TH[status] || status,
            status_display_en: status,
            created_at: new Date().toISOString(),
        };
        if (donationId) entry.donation_id = donationId;
        if (requestId) entry.request_id = requestId;
        if (note) entry.notes = note;

        await supabaseClient.from('tracking_timeline').insert(entry);
    } catch (err) {
        console.warn('tracking_timeline insert failed:', err.message);
    }
}

// ==========================================
// MODAL HELPERS
// ==========================================

function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('open');
}

function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('open');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('open');
    }
});

// Confirm modal — returns Promise<boolean>
function showConfirm(title, message) {
    return new Promise((resolve) => {
        const msgEl = document.getElementById('confirmModalMessage');
        if (msgEl) msgEl.textContent = message;

        const headerEl = document.querySelector('#modalConfirm .modal-header h2');
        if (headerEl) headerEl.textContent = '⚠ ' + title;

        openModal('modalConfirm');

        const btnOk = document.getElementById('btnConfirmOk');
        const btnCancel = document.getElementById('btnConfirmCancel');

        function cleanup(result) {
            closeModal('modalConfirm');
            btnOk.removeEventListener('click', onOk);
            btnCancel.removeEventListener('click', onCancel);
            resolve(result);
        }

        function onOk() { cleanup(true); }
        function onCancel() { cleanup(false); }

        btnOk.addEventListener('click', onOk);
        btnCancel.addEventListener('click', onCancel);
    });
}

// ==========================================
// PAGINATION
// ==========================================

let _paginationCallback = null;
function _paginationGo(p) { if (_paginationCallback) _paginationCallback(p); }

function renderPagination(container, page, totalPages, onPageChange) {
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    _paginationCallback = onPageChange;

    const maxButtons = 5;
    let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    const buttons = [];

    buttons.push(`<button class="page-btn" ${page === 1 ? 'disabled' : ''} onclick="_paginationGo(${page - 1})">&laquo;</button>`);

    if (startPage > 1) {
        buttons.push(`<button class="page-btn" onclick="_paginationGo(1)">1</button>`);
        if (startPage > 2) buttons.push(`<span style="padding:0 0.3rem; color:var(--text-muted)">…</span>`);
    }

    for (let p = startPage; p <= endPage; p++) {
        buttons.push(`<button class="page-btn ${p === page ? 'active' : ''}" onclick="_paginationGo(${p})">${p}</button>`);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) buttons.push(`<span style="padding:0 0.3rem; color:var(--text-muted)">…</span>`);
        buttons.push(`<button class="page-btn" onclick="_paginationGo(${totalPages})">${totalPages}</button>`);
    }

    buttons.push(`<button class="page-btn" ${page === totalPages ? 'disabled' : ''} onclick="_paginationGo(${page + 1})">&raquo;</button>`);

    container.innerHTML = `<span class="pagination-info">หน้า ${page} / ${totalPages}</span>` + buttons.join('');
}

// ==========================================
// NOTIFICATIONS (TOAST)
// ==========================================

function showNotification(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span>${icon}</span> ${escapeHtml(message)}`;

    container.appendChild(toast);

    const delay = type === 'error' ? 6000 : 4000;
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, delay);
}

// ==========================================
// FORMATTING HELPERS
// ==========================================

function formatDate(isoString) {
    if (!isoString) return '—';
    try {
        const d = new Date(isoString);
        return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()+543}`;
    } catch (_) { return isoString; }
}

function formatDateTime(isoString) {
    if (!isoString) return '—';
    try {
        return new Date(isoString).toLocaleString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch (_) { return isoString; }
}

function getStatusBadge(status) {
    const label = STATUS_LABELS_TH[status] || status || 'unknown';
    const cls = status ? `badge-${status}` : 'badge-unknown';
    return `<span class="badge ${cls}">${escapeHtml(label)}</span>`;
}

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ==========================================
// CORPORATE ACCOUNTS & INQUIRIES
// ==========================================

const CORP_PACKAGE_QUOTA = {
    S: { min: 5,  max: 20,  label: 'Starter CSR' },
    M: { min: 21, max: 70,  label: 'Professional ESG' },
    L: { min: 71, max: 150, label: 'Corporate Impact' },
};

const QUOTATION_PKGS = {
    S: {
        name: 'Starter CSR', range: '5 – 20 อุปกรณ์',
        prMonths: 3,  prMonthly: 2500,  prTotal: 7500,
        maxDevices: 20, swPerUnit: 300, swTotal: 6000,
        esgAnnual: 22000, esgName: 'รายงาน ESG ฉบับพื้นฐาน',
        flatTotal: 35500,
        services: [
            'Tracking รายเครื่อง 100%',
            'รายงาน ESG ฉบับพื้นฐาน',
            'ใบประกาศเกียรติคุณองค์กร',
        ],
    },
    M: {
        name: 'Professional ESG', range: '21 – 70 อุปกรณ์',
        prMonths: 6,  prMonthly: 2500,  prTotal: 15000,
        maxDevices: 70, swPerUnit: 250, swTotal: 17500,
        esgAnnual: 52000, esgName: 'รายงาน ESG มาตรฐานสากล',
        flatTotal: 84500,
        services: [
            'Tracking ID & บันทึกภาพถ่าย',
            'รายงาน ESG มาตรฐานสากล',
            'Carbon Offset Certificate',
            'ดูแลการติดตั้ง MS License',
        ],
    },
    L: {
        name: 'Corporate Impact', range: '100 – 150 อุปกรณ์',
        prMonths: 12, prMonthly: 2500,  prTotal: 30000,
        maxDevices: 150, swPerUnit: 200, swTotal: 30000,
        esgAnnual: 98000, esgName: 'Full ESG Audit Report',
        flatTotal: 158000,
        services: [
            'Full ESG Audit Report',
            'รายงานวิเคราะห์สังคม (SROI)',
            'สิทธิการเป็น Exclusive Partner',
            'ติดตั้ง License & Setup พิเศษ',
            'ESG Support ตลอดโครงการ',
        ],
    },
};

const INQ_STATUS_LABELS = {
    new: 'ใหม่', contacted: 'ติดต่อแล้ว',
    converted: 'สมัครแล้ว', declined: 'ปฏิเสธ',
};

let _corporateCache = {};  // id -> row
let _inquiryCache = {};    // id -> row (corporate_inquiries)

async function loadCorporateSection() {
    await Promise.all([loadInquiries(), loadCorporateAccounts()]);
}

// ---- INQUIRIES ----

async function loadInquiries() {
    const tbody = document.getElementById('inquiriesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr class="loading-row"><td colspan="9"><span class="spinner"></span> กำลังโหลด...</td></tr>';
    try {
        const { data, error } = await supabaseClient
            .from('corporate_inquiries')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        if (error) throw error;
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-row">ไม่มีข้อมูล</td></tr>';
            return;
        }
        _inquiryCache = {};
        data.forEach(r => { _inquiryCache[r.id] = r; });
        tbody.innerHTML = data.map(r => {
            // detect file type from URL for label
            // fallback: old records stored file URL inside message as "ไฟล์อุปกรณ์: https://..."
            let fileUrl = r.attachment_url;
            if (!fileUrl && r.message) {
                const m = r.message.match(/ไฟล์อุปกรณ์:\s*(https?:\/\/\S+)/);
                if (m) fileUrl = m[1];
            }
            let fileBtn = '—';
            if (fileUrl) {
                const linkStyle = `display:inline-flex;align-items:center;gap:0.3rem;padding:0.3rem 0.7rem;
                                   background:#e8f5e9;border:1px solid #a5d6a7;border-radius:6px;
                                   color:#2f5233;font-size:0.8rem;text-decoration:none;white-space:nowrap;cursor:pointer`;
                if (fileUrl.startsWith('data:')) {
                    // base64 data URL stored directly in DB — extract original filename after "||"
                    const parts = fileUrl.split('||');
                    const dataUrl = parts[0];
                    const origName = parts[1] || 'อุปกรณ์.xlsx';
                    const isExcel = /\.(xlsx|xls)$/i.test(origName);
                    const icon = isExcel ? '📊' : '📋';
                    fileBtn = `<a href="${dataUrl}" download="${escapeHtml(origName)}" style="${linkStyle}" title="${escapeHtml(origName)}">${icon} ดาวน์โหลดไฟล์</a>`;
                } else {
                    const fname = decodeURIComponent(fileUrl.split('/').pop().split('?')[0]) || 'ดูไฟล์';
                    const isExcel = /\.(xlsx|xls)$/i.test(fname);
                    const isCsv   = /\.csv$/i.test(fname);
                    const icon    = isExcel ? '📊' : isCsv ? '📋' : '📎';
                    fileBtn = `<a href="${fileUrl}" target="_blank" rel="noopener" style="${linkStyle}" title="${escapeHtml(fname)}">${icon} ดาวน์โหลดไฟล์</a>`;
                }
            }
            // strip old embedded file line from message preview
            const msgClean = r.message ? r.message.replace(/\n*ไฟล์อุปกรณ์:\s*https?:\/\/\S+/g, '').trim() : '';
            const msgShort = msgClean
                ? `<span title="${escapeHtml(msgClean)}" style="cursor:help;border-bottom:1px dashed #ccc">
                     ${escapeHtml(msgClean.slice(0, 40))}${msgClean.length > 40 ? '…' : ''}
                   </span>`
                : '—';
            return `
          <tr>
            <td>${formatDate(r.created_at)}</td>
            <td><strong>${escapeHtml(r.org_name)}</strong><br>
                <small style="color:var(--text-muted)">${msgShort}</small></td>
            <td>${escapeHtml(r.contact_name)}</td>
            <td>${escapeHtml(r.contact_email)}<br><small style="color:var(--text-muted)">${escapeHtml(r.contact_phone || '')}</small></td>
            <td>${r.package_interest ? `<span class="badge" style="background:var(--primary);color:#fff">${r.package_interest}</span>` : '—'}</td>
            <td style="text-align:center;">${QUOTATION_PKGS[r.package_interest]?.maxDevices ? `≤ ${QUOTATION_PKGS[r.package_interest].maxDevices}` : '—'}</td>
            <td>${fileBtn}</td>
            <td>
              <select class="form-control" style="width:auto;font-size:0.82rem;padding:0.25rem 0.5rem"
                onchange="updateInquiryStatus('${r.id}', this.value)">
                ${Object.entries(INQ_STATUS_LABELS).map(([v,l]) =>
                  `<option value="${v}"${r.status===v?' selected':''}>${l}</option>`).join('')}
              </select>
            </td>
            <td style="min-width:260px;">
              <div style="display:flex;flex-direction:row;flex-wrap:wrap;gap:0.3rem;align-items:center;">
                <button class="btn-act" onclick="openInquiryDetail('${r.id}')">รายละเอียด</button>
                <button class="btn-act btn-act-teal" onclick="generateQuotationPdf('${r.id}')">ใบเสนอราคา</button>
                ${r.device_list && Array.isArray(r.device_list) && r.device_list.length > 0
                  ? `<button class="btn-act btn-act-amber" onclick="importDeviceList('${r.id}')">นำเข้า ${r.device_list.length} เครื่อง</button>`
                  : ''}
                <button class="btn-act btn-act-green" onclick="convertInquiryToAccount('${r.id}')">สร้าง Account</button>
                <button class="btn-act btn-act-del" onclick="deleteInquiry('${r.id}', '${escapeHtml(r.org_name)}')">ลบ</button>
              </div>
            </td>
          </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="9" style="color:var(--danger);padding:1rem">${escapeHtml(err.message)}</td></tr>`;
    }
}

async function importDeviceList(inquiryId) {
    const r = _inquiryCache[inquiryId];
    if (!r || !r.device_list || !r.device_list.length) {
        showAdminNotification('ไม่พบข้อมูลอุปกรณ์', 'error');
        return;
    }

    const devices = r.device_list;
    const totalItems = devices.length;
    const totalWeight = devices.reduce((s, d) => s + (parseFloat(d.device_weight) || 0), 0);
    const totalCarbon = devices.reduce((s, d) => s + (parseFloat(d.carbon_saved) || 0), 0);

    const btnOk = document.getElementById('btnConfirmOk');
    if (btnOk) { btnOk.textContent = 'ยืนยันการนำเข้า'; btnOk.style.background = '#2f5233'; btnOk.style.borderColor = '#2f5233'; }
    const confirmed = await showConfirm(
        'นำเข้าข้อมูลอุปกรณ์',
        `นำเข้า ${totalItems} เครื่อง จากองค์กร "${r.org_name}" เข้าสู่ระบบ?\n\nน้ำหนักรวม: ${totalWeight.toFixed(1)} กก. | CO₂ ลด: ${totalCarbon.toFixed(0)} kgCO₂e`
    );
    if (btnOk) { btnOk.textContent = 'ยืนยันการลบ'; btnOk.style.background = ''; btnOk.style.borderColor = ''; }
    if (!confirmed) return;

    try {
        // Get current admin user
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('กรุณาเข้าสู่ระบบก่อน');

        // Generate tracking ID
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const dateStr = `${dd}${mm}${yyyy}`;
        const { data: existing } = await supabaseClient
            .from('donations').select('tracking_id')
            .like('tracking_id', `GU-DON-${dateStr}-%`)
            .order('tracking_id', { ascending: false }).limit(1);
        const seq = existing && existing.length > 0
            ? (parseInt(existing[0].tracking_id.split('-').pop()) || 0) + 1 : 1;
        const trackingId = `GU-DON-${dateStr}-${String(seq).padStart(3, '0')}`;

        // Parse target school request ID from message
        const idMatch = r.message && r.message.match(/\(ID:(\d+)\)/);
        const targetRequestId = idMatch ? parseInt(idMatch[1]) : null;

        // Create donation record
        const primaryDeviceType = devices[0]?.device_type || 'Computer';
        const donationPayload = {
            user_id: user.id,
            tracking_id: trackingId,
            current_status: 'submitted',
            device_type: primaryDeviceType,
            donor_name: r.contact_name,
            donor_org_name: r.org_name,
            donor_email: r.contact_email || '',
            donor_tel: r.contact_phone || '',
            donor_address: r.contact_address || '',
            total_items: totalItems,
            total_weight: parseFloat(totalWeight.toFixed(2)),
            carbon_saved: parseFloat(totalCarbon.toFixed(2)),
            option_type: 'donate',
        };
        if (targetRequestId) donationPayload.direct_donation_to_request_id = targetRequestId;

        const { data: donation, error: donErr } = await supabaseClient
            .from('donations')
            .insert(donationPayload)
            .select('id').single();

        if (donErr) throw donErr;

        // Create donation_items (one row per device)
        const CARBON_FACTORS = { Computer: 30, Laptop: 125, Tablet: 250, Phone: 300 };
        const itemsToInsert = devices.map(d => {
            const weight = parseFloat(d.device_weight) || 0;
            const factor = CARBON_FACTORS[d.device_type] || 30;
            const carbonSaved = parseFloat(d.carbon_saved) || parseFloat((weight * factor).toFixed(2));
            return {
                donation_id: donation.id,
                device_type: d.device_type,
                device_brand: d.device_brand || null,
                device_model: d.device_model || null,
                serial_number: d.serial_number || null,
                device_condition: d.device_condition || null,
                device_weight: weight,
                carbon_emission_factor: factor,
                carbon_saved: carbonSaved,
                admin_verified: false,
            };
        });

        const { error: itemsErr } = await supabaseClient
            .from('donation_items').insert(itemsToInsert);
        if (itemsErr) throw itemsErr;

        // Add tracking timeline entry
        await supabaseClient.from('tracking_timeline').insert({
            donation_id: donation.id,
            status: 'submitted',
            status_display_th: 'ส่งข้อมูลแล้ว (นำเข้าจากองค์กร)',
            status_display_en: 'Submitted (imported from corporate inquiry)',
        });

        // Mark inquiry status as converted
        await supabaseClient.from('corporate_inquiries')
            .update({ status: 'converted' }).eq('id', inquiryId);

        showAdminNotification(`✅ นำเข้าสำเร็จ! Tracking ID: ${trackingId} | ${totalItems} เครื่อง`, 'success');
        loadInquiries();
    } catch (err) {
        console.error('importDeviceList error:', err);
        showAdminNotification('นำเข้าไม่สำเร็จ: ' + err.message, 'error');
    }
}

function openInquiryDetail(inquiryId) {
    const r = _inquiryCache[inquiryId];
    if (!r) return;

    const schoolMatch = r.message && r.message.match(/โรงเรียนที่เลือก:\s*(.+?)(?:\s*\(ID:\d+\))?(?:\n|$)/);
    const schoolName = schoolMatch ? schoolMatch[1].trim() : null;
    const msgClean = r.message ? r.message.replace(/โรงเรียนที่เลือก:[^\n]*\n?/, '').trim() : '';
    const INQ_PKG = { S: 'Starter CSR', M: 'Professional ESG', L: 'Corporate Impact', unknown: 'ขอรับคำปรึกษา' };

    const deviceRows = r.device_list && r.device_list.length > 0
        ? r.device_list.map((d, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${escapeHtml(d.device_type || '—')}</td>
                <td>${escapeHtml(d.device_brand || '—')}</td>
                <td>${escapeHtml(d.device_model || '—')}</td>
                <td>${escapeHtml(d.serial_number || '—')}</td>
                <td>${escapeHtml(d.device_condition || '—')}</td>
                <td>${d.device_weight || '—'} กก.</td>
            </tr>`).join('')
        : `<tr><td colspan="7" style="text-align:center;color:#aaa">ไม่มีข้อมูลอุปกรณ์</td></tr>`;

    const html = `
        <div class="detail-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
            <div class="detail-section">
                <h4 style="margin-bottom:0.75rem;color:var(--primary)">ข้อมูลองค์กร</h4>
                <div class="detail-row"><span class="detail-label">ชื่อองค์กร</span><span class="detail-value">${escapeHtml(r.org_name)}</span></div>
                <div class="detail-row"><span class="detail-label">เลขผู้เสียภาษี</span><span class="detail-value">${escapeHtml(r.tax_id || '—')}</span></div>
                <div class="detail-row"><span class="detail-label">ผู้ติดต่อ</span><span class="detail-value">${escapeHtml(r.contact_name)}</span></div>
                <div class="detail-row"><span class="detail-label">อีเมล</span><span class="detail-value">${escapeHtml(r.contact_email || '—')}</span></div>
                <div class="detail-row"><span class="detail-label">โทรศัพท์</span><span class="detail-value">${escapeHtml(r.contact_phone || '—')}</span></div>
                <div class="detail-row"><span class="detail-label">ที่อยู่</span><span class="detail-value">${escapeHtml(r.contact_address || '—')}</span></div>
            </div>
            <div class="detail-section">
                <h4 style="margin-bottom:0.75rem;color:var(--primary)">ความสนใจ</h4>
                <div class="detail-row"><span class="detail-label">แพ็คเกจ</span><span class="detail-value">${INQ_PKG[r.package_interest] || r.package_interest || '—'}</span></div>
                <div class="detail-row"><span class="detail-label">จำนวนเครื่อง</span><span class="detail-value">${r.device_count_estimate || '—'} เครื่อง</span></div>
                <div class="detail-row"><span class="detail-label">โรงเรียนเป้าหมาย</span><span class="detail-value" style="color:${schoolName ? 'var(--primary)' : '#aaa'}">${schoolName ? escapeHtml(schoolName) : 'ไม่ได้ระบุ'}</span></div>
                <div class="detail-row"><span class="detail-label">สถานะ</span><span class="detail-value">${escapeHtml(r.status || '—')}</span></div>
                ${msgClean ? `<div class="detail-row"><span class="detail-label">ข้อความ</span><span class="detail-value">${escapeHtml(msgClean)}</span></div>` : ''}
            </div>
        </div>
        ${r.device_list && r.device_list.length > 0 ? `
        <div class="detail-section full-width">
            <h4 style="margin-bottom:0.75rem;color:var(--primary)">รายการอุปกรณ์ (${r.device_list.length} รายการ)</h4>
            <div style="overflow-x:auto">
                <table style="width:100%;font-size:0.85rem;border-collapse:collapse">
                    <thead><tr style="background:#f5f5f5">
                        <th style="padding:0.4rem 0.6rem;text-align:left">#</th>
                        <th style="padding:0.4rem 0.6rem;text-align:left">ประเภท</th>
                        <th style="padding:0.4rem 0.6rem;text-align:left">ยี่ห้อ</th>
                        <th style="padding:0.4rem 0.6rem;text-align:left">รุ่น</th>
                        <th style="padding:0.4rem 0.6rem;text-align:left">Serial</th>
                        <th style="padding:0.4rem 0.6rem;text-align:left">สภาพ</th>
                        <th style="padding:0.4rem 0.6rem;text-align:left">น้ำหนัก</th>
                    </tr></thead>
                    <tbody>${deviceRows}</tbody>
                </table>
            </div>
        </div>` : ''}`;

    const modal = document.getElementById('modalInquiryDetail');
    if (!modal) return;
    modal.querySelector('#inquiryDetailTitle').textContent = `รายละเอียด — ${r.org_name}`;
    modal.querySelector('#inquiryDetailBody').innerHTML = html;
    const btnQt = document.getElementById('btnGenerateQuotation');
    if (btnQt) btnQt.dataset.inquiryId = inquiryId;
    openModal('modalInquiryDetail');
}

async function updateInquiryStatus(id, status) {
    try {
        const { error } = await supabaseClient
            .from('corporate_inquiries').update({ status }).eq('id', id);
        if (error) throw error;
    } catch (err) {
        showAdminNotification('อัปเดตสถานะไม่สำเร็จ: ' + err.message, 'error');
    }
}

function convertInquiryToAccount(id) {
    // pre-fill corporate modal from inquiry data — reload table first to get fresh data
    supabaseClient.from('corporate_inquiries').select('*').eq('id', id).single()
        .then(({ data }) => {
            if (!data) return;
            openCorporateModal();
            setTimeout(() => {
                document.getElementById('corpOrgName').value = data.org_name || '';
                document.getElementById('corpTaxId').value = data.tax_id || '';
                document.getElementById('corpContactName').value = data.contact_name || '';
                document.getElementById('corpEmail').value = data.contact_email || '';
                document.getElementById('corpPhone').value = data.contact_phone || '';
                if (data.package_interest && data.package_interest !== 'unknown') {
                    document.getElementById('corpPackage').value = data.package_interest;
                }
            }, 50);
        });
}

async function deleteInquiry(id, label) {
    const confirmed = await showConfirm('ลบ Inquiry', `ลบข้อมูลการติดต่อของ "${label}" ออกจากระบบ?`);
    if (!confirmed) return;
    try {
        const { error } = await supabaseClient.from('corporate_inquiries').delete().eq('id', id);
        if (error) throw error;
        showAdminNotification('ลบข้อมูลเรียบร้อยแล้ว');
        loadInquiries();
    } catch (err) {
        showAdminNotification('ลบไม่สำเร็จ: ' + err.message, 'error');
    }
}

// ---- ADD INQUIRY (ADMIN ENTRY) ----

function openAddInquiryModal() {
    // Clear all fields
    ['aiqOrgName','aiqTaxId','aiqContactName','aiqEmail','aiqPhone',
     'aiqDeviceCount','aiqAddress','aiqMessage'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const pkg = document.getElementById('aiqPackage');
    if (pkg) pkg.value = '';
    const ch = document.getElementById('aiqChannel');
    if (ch) ch.value = 'LINE';
    const st = document.getElementById('aiqStatus');
    if (st) st.value = 'contacted';
    openModal('modalAddInquiry');
}

async function saveAdminInquiry() {
    const orgName     = (document.getElementById('aiqOrgName')?.value || '').trim();
    const contactName = (document.getElementById('aiqContactName')?.value || '').trim();
    const email       = (document.getElementById('aiqEmail')?.value || '').trim();

    if (!orgName)     { showAdminNotification('กรุณากรอกชื่อองค์กร', 'error'); return; }
    if (!contactName) { showAdminNotification('กรุณากรอกชื่อผู้ติดต่อ', 'error'); return; }
    const _emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !_emailRx.test(email)) {
        showAdminNotification('กรุณากรอกอีเมลให้ถูกต้อง', 'error');
        return;
    }

    const _phone = (document.getElementById('aiqPhone')?.value || '').trim();
    if (_phone && !/^0\d{9}$/.test(_phone.replace(/[-\s]/g, ''))) {
        showAdminNotification('เบอร์โทรต้องเป็น 10 หลัก ขึ้นต้นด้วย 0', 'error');
        return;
    }

    const channel = document.getElementById('aiqChannel')?.value || 'LINE';
    const note    = (document.getElementById('aiqMessage')?.value || '').trim();
    const message = `[บันทึกโดยแอดมิน | ช่องทาง: ${channel}]${note ? '\n' + note : ''}`;

    const _dc = parseInt(document.getElementById('aiqDeviceCount')?.value);
    const deviceCount = (!isNaN(_dc) && _dc > 0) ? _dc : null;

    const payload = {
        org_name:             orgName,
        contact_name:         contactName,
        contact_email:        email,
        contact_phone:        _phone || null,
        tax_id:               (document.getElementById('aiqTaxId')?.value || '').trim() || null,
        contact_address:      (document.getElementById('aiqAddress')?.value || '').trim() || null,
        package_interest:     document.getElementById('aiqPackage')?.value || null,
        device_count_estimate:deviceCount,
        status:               document.getElementById('aiqStatus')?.value || 'contacted',
        message,
    };

    const btn = document.getElementById('btnSaveAdminInquiry');
    if (btn) { btn.disabled = true; btn.textContent = 'กำลังบันทึก...'; }

    try {
        const { error } = await supabaseClient.from('corporate_inquiries').insert(payload);
        if (error) throw error;
        showAdminNotification(`✅ บันทึก Inquiry ของ "${orgName}" เรียบร้อยแล้ว`);
        closeModal('modalAddInquiry');
        loadInquiries();
    } catch (err) {
        showAdminNotification('บันทึกไม่สำเร็จ: ' + err.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '✓ บันทึก Inquiry'; }
    }
}

// ---- CORPORATE ACCOUNTS ----

async function loadCorporateAccounts() {
    const tbody = document.getElementById('corporateTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr class="loading-row"><td colspan="8"><span class="spinner"></span> กำลังโหลด...</td></tr>';
    try {
        const { data, error } = await supabaseClient
            .from('corporate_accounts')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        _corporateCache = {};
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-row">ยังไม่มีบัญชีองค์กร</td></tr>';
            return;
        }
        data.forEach(r => { _corporateCache[r.id] = r; });
        tbody.innerHTML = data.map(r => {
            const pkg = CORP_PACKAGE_QUOTA[r.package] || {};
            const pct = r.quota_max > 0 ? Math.round((r.device_count / r.quota_max) * 100) : 0;
            const statusColor = r.status === 'active' ? 'var(--primary)' : r.status === 'expired' ? '#dc2626' : '#6b7280';
            return `<tr>
              <td>
                <strong>${escapeHtml(r.org_name)}</strong><br>
                <small style="color:var(--text-muted)">${escapeHtml(r.contact_name)} · ${escapeHtml(r.contact_email)}</small>
              </td>
              <td>
                <span class="badge" style="background:var(--primary);color:#fff">${r.package}</span>
                <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">${pkg.label || ''}</div>
              </td>
              <td>${r.quota_min}–${r.quota_max} เครื่อง</td>
              <td>
                <div style="font-size:0.9rem;font-weight:600">${r.device_count} / ${r.quota_max}</div>
                <div style="background:#e5e7eb;border-radius:4px;height:6px;margin-top:4px;overflow:hidden">
                  <div style="background:${pct>=100?'#dc2626':'var(--primary)'};width:${Math.min(pct,100)}%;height:100%"></div>
                </div>
              </td>
              <td>${r.ms_installed || 0} เครื่อง</td>
              <td style="font-size:0.85rem">${r.end_date ? new Date(r.end_date).toLocaleDateString('th-TH') : '—'}</td>
              <td><span style="color:${statusColor};font-weight:600">${r.status}</span></td>
              <td>
                <div style="display:flex;flex-wrap:wrap;gap:0.3rem;">
                  <button class="btn-act" onclick="openCorporateModal('${r.id}')">แก้ไข</button>
                  <button class="btn-act btn-act-purple" onclick="openEsgReport('${r.id}')">ESG Report</button>
                  <button class="btn-act btn-act-del" onclick="deleteCorporateAccount('${r.id}', '${escapeHtml(r.org_name)}')">ลบ</button>
                </div>
              </td>
            </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger);padding:1rem">${escapeHtml(err.message)}</td></tr>`;
    }
}

async function deleteCorporateAccount(id, label) {
    const confirmed = await showConfirm('ลบบัญชีองค์กร', `ลบบัญชีองค์กร "${label}" ออกจากระบบ? การดำเนินการนี้ไม่สามารถยกเลิกได้`);
    if (!confirmed) return;
    try {
        const { error } = await supabaseClient.from('corporate_accounts').delete().eq('id', id);
        if (error) throw error;
        showAdminNotification('ลบบัญชีองค์กรเรียบร้อยแล้ว');
        loadCorporateAccounts();
    } catch (err) {
        showAdminNotification('ลบไม่สำเร็จ: ' + err.message, 'error');
    }
}

function openCorporateModal(id = null) {
    // Reset form
    ['corpId','corpOrgName','corpTaxId','corpContactName','corpEmail','corpPhone','corpNotes'].forEach(f => {
        const el = document.getElementById(f); if (el) el.value = '';
    });
    document.getElementById('corpPackage').value = '';
    document.getElementById('corpDeviceCount').value = '0';
    document.getElementById('corpMsInstalled').value = '0';
    document.getElementById('corpStatus').value = 'active';
    document.getElementById('corpStartDate').value = '';
    document.getElementById('corpEndDate').value = '';

    if (id && _corporateCache[id]) {
        const r = _corporateCache[id];
        document.getElementById('corpId').value = r.id;
        document.getElementById('corpOrgName').value = r.org_name || '';
        document.getElementById('corpTaxId').value = r.tax_id || '';
        document.getElementById('corpContactName').value = r.contact_name || '';
        document.getElementById('corpEmail').value = r.contact_email || '';
        document.getElementById('corpPhone').value = r.contact_phone || '';
        document.getElementById('corpPackage').value = r.package || '';
        document.getElementById('corpDeviceCount').value = r.device_count || 0;
        document.getElementById('corpMsInstalled').value = r.ms_installed || 0;
        document.getElementById('corpStartDate').value = r.start_date || '';
        document.getElementById('corpEndDate').value = r.end_date || '';
        document.getElementById('corpStatus').value = r.status || 'active';
        document.getElementById('corpNotes').value = r.notes || '';
    }
    openModal('modalCorporate');
}

function onCorpPackageChange() {
    const pkg = document.getElementById('corpPackage').value;
    // Auto-fill quota fields reflected in the save function; no UI quota fields needed
}

async function saveCorporate() {
    const id = document.getElementById('corpId').value;
    const pkg = document.getElementById('corpPackage').value;
    const orgName = document.getElementById('corpOrgName').value.trim();
    const contactName = document.getElementById('corpContactName').value.trim();
    const email = document.getElementById('corpEmail').value.trim();

    if (!orgName || !contactName || !email || !pkg) {
        showAdminNotification('กรุณากรอกข้อมูลที่จำเป็นให้ครบ', 'error');
        return;
    }

    const _emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !_emailRx.test(email)) {
        showAdminNotification('กรุณากรอกอีเมลให้ถูกต้อง', 'error');
        return;
    }

    const phone = document.getElementById('corpPhone').value.trim();
    if (phone && !/^0\d{9}$/.test(phone.replace(/[-\s]/g, ''))) {
        showAdminNotification('เบอร์โทรต้องเป็น 10 หลัก ขึ้นต้นด้วย 0', 'error');
        return;
    }

    const taxId = document.getElementById('corpTaxId').value.trim();
    if (taxId && !/^\d{13}$/.test(taxId)) {
        showAdminNotification('เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก', 'error');
        return;
    }

    const startDate = document.getElementById('corpStartDate').value;
    const endDate = document.getElementById('corpEndDate').value;
    if (startDate && endDate && endDate < startDate) {
        showAdminNotification('วันสิ้นสุดสัญญาต้องมาหลังวันเริ่มต้น', 'error');
        return;
    }

    const quotaInfo = CORP_PACKAGE_QUOTA[pkg];
    const payload = {
        org_name: orgName,
        tax_id: taxId || null,
        contact_name: contactName,
        contact_email: email,
        contact_phone: phone || null,
        package: pkg,
        quota_min: quotaInfo.min,
        quota_max: quotaInfo.max,
        device_count: parseInt(document.getElementById('corpDeviceCount').value) || 0,
        ms_installed: parseInt(document.getElementById('corpMsInstalled').value) || 0,
        start_date: startDate || null,
        end_date: endDate || null,
        status: document.getElementById('corpStatus').value,
        notes: document.getElementById('corpNotes').value.trim() || null,
    };

    const _corpBtn = document.querySelector('#modalCorporate .btn-primary');
    if (_corpBtn) _corpBtn.disabled = true;

    try {
        let error;
        if (id) {
            ({ error } = await supabaseClient.from('corporate_accounts').update(payload).eq('id', id));
        } else {
            ({ error } = await supabaseClient.from('corporate_accounts').insert(payload));
        }
        if (error) throw error;
        closeModal('modalCorporate');
        showAdminNotification(id ? 'อัปเดตบัญชีองค์กรสำเร็จ' : 'เพิ่มบัญชีองค์กรสำเร็จ');
        await loadCorporateAccounts();
    } catch (err) {
        showAdminNotification('บันทึกไม่สำเร็จ: ' + err.message, 'error');
    } finally {
        if (_corpBtn) _corpBtn.disabled = false;
    }
}

// ---- ESG PDF REPORT ----

async function openEsgReport(corporateId) {
    const r = _corporateCache[corporateId];
    if (!r) return;

    const bodyEl = document.getElementById('esgReportBody');
    bodyEl.innerHTML = '<p style="color:var(--text-muted)">กำลังโหลดข้อมูล...</p>';
    document.getElementById('btnGenerateEsg').dataset.corpId = corporateId;
    openModal('modalEsgReport');

    try {
        // Load donations linked to this corporate account
        const { data: donations, error } = await supabaseClient
            .from('donations')
            .select('id, tracking_id, total_items, total_weight, current_status, created_at')
            .eq('corporate_account_id', corporateId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const totalItems = (donations || []).reduce((s, d) => s + (d.total_items || 0), 0);
        const totalWeight = (donations || []).reduce((s, d) => s + (d.total_weight || 0), 0);
        const carbonSaved = Math.round(totalWeight * 125); // avg kgCO2e/kg ≈ 125

        const pkg = CORP_PACKAGE_QUOTA[r.package] || {};
        bodyEl.innerHTML = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
            <div class="stat-card"><div class="stat-icon">&#127970;</div><div>
              <div class="stat-value">${escapeHtml(r.org_name)}</div>
              <div class="stat-label">Package ${r.package} — ${pkg.label || ''}</div>
            </div></div>
            <div class="stat-card"><div class="stat-icon">&#128187;</div><div>
              <div class="stat-value">${r.device_count}</div>
              <div class="stat-label">เครื่องทั้งหมด (Quota: ${r.quota_min}–${r.quota_max})</div>
            </div></div>
            <div class="stat-card"><div class="stat-icon">&#127807;</div><div>
              <div class="stat-value">${carbonSaved.toLocaleString()}</div>
              <div class="stat-label">kgCO₂e ที่ลดได้ (ประมาณ)</div>
            </div></div>
            <div class="stat-card"><div class="stat-icon">&#128187;</div><div>
              <div class="stat-value">${r.ms_installed || 0}</div>
              <div class="stat-label">เครื่องที่ติดตั้ง MS License</div>
            </div></div>
          </div>
          <div class="card-header" style="margin-bottom:0.75rem">
            <span class="card-title">รายการบริจาคที่เชื่อมโยง</span>
          </div>
          ${(donations && donations.length > 0) ? `
            <div class="table-wrap"><table>
              <thead><tr><th>วันที่</th><th>Tracking ID</th><th>อุปกรณ์</th><th>น้ำหนัก (kg)</th><th>สถานะ</th></tr></thead>
              <tbody>${donations.map(d => `
                <tr>
                  <td>${formatDate(d.created_at)}</td>
                  <td class="monospace" style="font-size:0.82rem">${escapeHtml(d.tracking_id)}</td>
                  <td>${d.total_items || 0} ชิ้น</td>
                  <td>${d.total_weight || 0}</td>
                  <td>${getStatusBadge(d.current_status)}</td>
                </tr>`).join('')}
              </tbody>
            </table></div>
          ` : '<p style="color:var(--text-muted);padding:1rem 0">ยังไม่มีการบริจาคที่เชื่อมโยงกับองค์กรนี้</p>'}
          <p style="color:var(--text-muted);font-size:0.85rem;margin-top:1rem">
            * Carbon Saved คำนวณจากน้ำหนักรวม × 125 kgCO₂e/kg (ค่าเฉลี่ย)<br>
            * PDF จะถูก generate และดาวน์โหลดอัตโนมัติ
          </p>`;

        // Store data for PDF generation
        document.getElementById('btnGenerateEsg').dataset.totalItems = totalItems;
        document.getElementById('btnGenerateEsg').dataset.totalWeight = totalWeight;
        document.getElementById('btnGenerateEsg').dataset.carbonSaved = carbonSaved;
    } catch (err) {
        bodyEl.innerHTML = `<p style="color:var(--danger)">${escapeHtml(err.message)}</p>`;
    }
}

function generateEsgPdf() {
    const btn = document.getElementById('btnGenerateEsg');
    const corpId = btn.dataset.corpId;
    const r = _corporateCache[corpId];
    if (!r) return;

    const totalItems = parseInt(btn.dataset.totalItems) || 0;
    const totalWeight = parseFloat(btn.dataset.totalWeight) || 0;
    const carbonSaved = parseInt(btn.dataset.carbonSaved) || 0;
    const pkg = CORP_PACKAGE_QUOTA[r.package] || {};
    const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    const year = new Date().getFullYear() + 543;

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const W = 210, M = 20;
        let y = 0;

        // Header bar
        doc.setFillColor(47, 82, 51);
        doc.rect(0, 0, W, 35, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('GEARUP', M, 16);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('ESG IMPACT REPORT ' + year, M, 24);

        doc.setFontSize(8);
        doc.text('Verified by GEARUP | info@gearup.com | 064-335-2325', W - M, 24, { align: 'right' });

        y = 45;

        // Org info box
        doc.setDrawColor(212, 165, 116);
        doc.setLineWidth(0.5);
        doc.rect(M, y, W - 2 * M, 28);
        doc.setFillColor(248, 246, 243);
        doc.rect(M, y, W - 2 * M, 28, 'F');
        doc.setDrawColor(212, 165, 116);
        doc.rect(M, y, W - 2 * M, 28);

        doc.setTextColor(26, 36, 33);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(r.org_name, M + 5, y + 10);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(`Package: ${r.package} — ${pkg.label || ''}   |   Contact: ${r.contact_name}   |   Email: ${r.contact_email}`, M + 5, y + 18);
        doc.text(`Tax ID: ${r.tax_id || 'N/A'}   |   วันที่ออกรายงาน: ${today}`, M + 5, y + 25);

        y += 38;

        // Section title
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(47, 82, 51);
        doc.text('สรุปผลกระทบเชิงบวก (Impact Summary)', M, y);
        doc.setDrawColor(47, 82, 51);
        doc.setLineWidth(0.3);
        doc.line(M, y + 2, W - M, y + 2);

        y += 10;

        // KPI boxes — 3 columns
        const boxW = (W - 2 * M - 10) / 3;
        const kpis = [
            { label: 'อุปกรณ์ที่บริจาค', value: r.device_count + ' เครื่อง', icon: '' },
            { label: 'Carbon Saved', value: carbonSaved.toLocaleString() + ' kgCO2e', icon: '' },
            { label: 'MS License ติดตั้ง', value: (r.ms_installed || 0) + ' เครื่อง', icon: '' },
        ];

        kpis.forEach((k, i) => {
            const bx = M + i * (boxW + 5);
            doc.setFillColor(240, 245, 240);
            doc.roundedRect(bx, y, boxW, 24, 2, 2, 'F');
            doc.setDrawColor(47, 82, 51);
            doc.setLineWidth(0.3);
            doc.roundedRect(bx, y, boxW, 24, 2, 2);

            doc.setFontSize(15);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(47, 82, 51);
            doc.text(k.value, bx + boxW / 2, y + 13, { align: 'center' });

            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(107, 114, 128);
            doc.text(k.label, bx + boxW / 2, y + 20, { align: 'center' });
        });

        y += 34;

        // Quota usage
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(47, 82, 51);
        doc.text('การใช้งาน Quota', M, y);
        doc.setDrawColor(47, 82, 51);
        doc.setLineWidth(0.3);
        doc.line(M, y + 2, W - M, y + 2);
        y += 10;

        const barW = W - 2 * M;
        const pct = r.quota_max > 0 ? Math.min(r.device_count / r.quota_max, 1) : 0;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(45, 45, 45);
        doc.text(`อุปกรณ์ที่บริจาคแล้ว: ${r.device_count} / ${r.quota_max} เครื่อง (${Math.round(pct * 100)}%)`, M, y);
        y += 5;

        doc.setFillColor(229, 231, 235);
        doc.roundedRect(M, y, barW, 6, 2, 2, 'F');
        doc.setFillColor(47, 82, 51);
        if (pct > 0) doc.roundedRect(M, y, barW * pct, 6, 2, 2, 'F');
        y += 16;

        // Carbon methodology
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(47, 82, 51);
        doc.text('Methodology — Carbon Savings Calculation', M, y);
        doc.setDrawColor(47, 82, 51);
        doc.setLineWidth(0.3);
        doc.line(M, y + 2, W - M, y + 2);
        y += 10;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(45, 45, 45);
        const method = [
            'การคำนวณ Carbon Saved ใช้สูตร: น้ำหนักรวมอุปกรณ์ (kg) x Emission Factor (kgCO2e/kg)',
            `น้ำหนักรวมอุปกรณ์ที่บริจาค: ${totalWeight} kg`,
            `Carbon Saved รวม: ${carbonSaved.toLocaleString()} kgCO2e`,
            'Emission Factor: 125 kgCO2e/kg (ค่าเฉลี่ยอุปกรณ์อิเล็กทรอนิกส์ทั่วไป)',
            'อ้างอิง: GHG Protocol, ITU-T L.1410 Life Cycle Assessment of ICT Goods',
        ];
        method.forEach(line => { doc.text(line, M, y); y += 6; });

        y += 4;

        // Declaration box
        doc.setFillColor(248, 246, 243);
        doc.rect(M, y, W - 2 * M, 30, 'F');
        doc.setDrawColor(212, 165, 116);
        doc.setLineWidth(0.5);
        doc.rect(M, y, W - 2 * M, 30);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 36, 33);
        doc.text('คำรับรอง', M + 5, y + 8);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(45, 45, 45);
        doc.text(`รายงานนี้รับรองว่า ${r.org_name} ได้ดำเนินการบริจาคอุปกรณ์อิเล็กทรอนิกส์`, M + 5, y + 15);
        doc.text(`ผ่านแพลตฟอร์ม GEARUP จำนวน ${r.device_count} เครื่อง ภายใต้ Package ${r.package} (${pkg.label || ''})`, M + 5, y + 21);
        doc.text(`วันที่ออกรายงาน: ${today}`, M + 5, y + 27);

        y += 38;

        // Signature area
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text('ลงชื่อ: ................................................', M, y);
        doc.text('ตำแหน่ง: ผู้จัดการ GEARUP', M, y + 7);
        doc.text('วันที่: ' + today, M, y + 14);

        // Footer
        doc.setFillColor(47, 82, 51);
        doc.rect(0, 285, W, 12, 'F');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text('GEARUP — ขับเคลื่อนอนาคตที่ยั่งยืน | www.gearup.com | info@gearup.com', W / 2, 292, { align: 'center' });

        const filename = `GEARUP_ESG_Report_${r.org_name.replace(/\s+/g, '_')}_${year}.pdf`;
        doc.save(filename);
        showAdminNotification('ดาวน์โหลด ESG Report สำเร็จ');
    } catch (err) {
        showAdminNotification('Generate PDF ไม่สำเร็จ: ' + err.message, 'error');
    }
}

// Reusable admin notification (same pattern as existing show notifications)
function showAdminNotification(msg, type = 'success') {
    // Use existing notification element if present, otherwise console
    const existing = document.getElementById('adminNotification');
    if (existing) {
        existing.textContent = msg;
        existing.className = 'admin-notification ' + type;
        existing.style.display = 'block';
        if (type === 'success') setTimeout(() => { existing.style.display = 'none'; }, 3500);
    } else {
        // fallback — inject a temporary toast
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;background:${type==='error'?'#dc2626':'#2f5233'};color:#fff;padding:0.8rem 1.4rem;border-radius:10px;font-size:0.95rem;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2)`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), type === 'error' ? 6000 : 3500);
    }
}

// ============================================================
// ESG WORD REPORT GENERATOR
// ============================================================

async function generateEsgWord() {
    const corpId = document.getElementById('btnGenerateEsg').dataset.corpId;
    const r = _corporateCache[corpId];
    if (!r) { showAdminNotification('ไม่พบข้อมูลองค์กร', 'error'); return; }

    const btn = document.getElementById('btnGenerateEsgWord');
    btn.disabled = true;
    btn.textContent = '⏳ กำลังสร้างรายงาน...';

    try {
        const pkg = r.package || 'S';
        const isM = ['M', 'L'].includes(pkg);
        const isL = pkg === 'L';

        // ── Fetch donations + items (include serial_number) ──
        const { data: rawDonations } = await supabaseClient
            .from('donations')
            .select(`id, tracking_id, total_items, total_weight, current_status, created_at,
                     shipping_carrier, direct_donation_to_request_id,
                     donation_items(device_type, device_brand, device_model, device_weight, serial_number, device_condition, carbon_saved)`)
            .eq('corporate_account_id', corpId)
            .order('created_at', { ascending: true });

        const donations = rawDonations || [];

        // ── Fetch recipients (M/L) ──
        let recipients = [];
        if (isM) {
            const reqIds = donations.filter(d => d.direct_donation_to_request_id)
                                    .map(d => d.direct_donation_to_request_id);
            if (reqIds.length > 0) {
                const { data: reqs } = await supabaseClient
                    .from('requests')
                    .select('id, org_name, project_name, contact_name, address, equipment_type, quantity')
                    .in('id', reqIds);
                recipients = reqs || [];
            }
        }

        // ── Fetch delivery event photos (M/L) ──
        let deliveryPhotos = [];
        if (isM) {
            const { data: evts } = await supabaseClient
                .from('delivery_events')
                .select('title, actual_date, photo_urls, location')
                .eq('corporate_account_id', corpId)
                .eq('status', 'completed');
            if (evts) {
                deliveryPhotos = evts
                    .flatMap(e => (e.photo_urls || []).slice(0, 3).map(url => ({ url, title: e.title, date: e.actual_date })))
                    .slice(0, 9);
            }
        }

        const html = _buildEsgWordHtml(r, donations, recipients, deliveryPhotos, pkg, isM, isL);
        _downloadAsDoc(html, `ESG_Report_${r.org_name}_${new Date().getFullYear() + 543}.doc`);
        showAdminNotification('ดาวน์โหลดรายงาน ESG สำเร็จ 🎉', 'success');
    } catch (err) {
        console.error('ESG Word error:', err);
        showAdminNotification('สร้างรายงานไม่สำเร็จ: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '📄 ดาวน์โหลด Word (.doc)';
    }
}

function _downloadAsDoc(htmlContent, filename) {
    const blob = new Blob(['﻿', htmlContent], { type: 'application/msword' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function _buildEsgWordHtml(corp, donations, recipients, deliveryPhotos, pkg, isM, isL) {
    // ── Aggregate calculations ──
    const allItems   = donations.flatMap(d => d.donation_items || []);
    const totalItems = allItems.length || donations.reduce((s, d) => s + (d.total_items || 0), 0);
    const totalWeight = donations.reduce((s, d) => s + parseFloat(d.total_weight || 0), 0);
    const totalCarbon = allItems.reduce((s, i) => s + parseFloat(i.carbon_saved || 0), 0)
                        || Math.round(totalWeight * 125);
    const treesEq    = Math.round(totalCarbon / 21.7);
    const completedCount = donations.filter(d => d.current_status === 'completed').length;
    const wipedCount = donations.filter(d =>
        ['data_wiped','ready','distributed','completed'].includes(d.current_status)).length;

    // Device type breakdown (include carbon per type)
    const DEVICE_TH = { Computer:'คอมพิวเตอร์', Laptop:'แล็ปท็อป', Tablet:'แท็บเล็ต', Phone:'โทรศัพท์' };
    const DEVICE_FACTOR = { Computer: 30, Laptop: 125, Tablet: 250, Phone: 300 };
    const DEVICE_VALUE = { Computer: 5000, Laptop: 8000, Tablet: 4000, Phone: 3000 };
    const deviceBreakdown = {};
    allItems.forEach(i => {
        const t = i.device_type || 'อื่นๆ';
        if (!deviceBreakdown[t]) deviceBreakdown[t] = { count: 0, weight: 0, carbon: 0 };
        deviceBreakdown[t].count++;
        const w = parseFloat(i.device_weight || 0);
        deviceBreakdown[t].weight += w;
        deviceBreakdown[t].carbon += parseFloat(i.carbon_saved || 0) || Math.round(w * (DEVICE_FACTOR[t] || 125));
    });

    // Regional grouping of recipients
    const THAI_REGIONS = {
        'ภาคเหนือ': ['เชียงใหม่','เชียงราย','ลำปาง','ลำพูน','แม่ฮ่องสอน','น่าน','พะเยา','แพร่'],
        'ภาคกลาง': ['กรุงเทพ','นนทบุรี','ปทุมธานี','สมุทรปราการ','สมุทรสาคร','สมุทรสงคราม','นครปฐม','พระนครศรีอยุธยา','อยุธยา','สระบุรี','ลพบุรี','สิงห์บุรี','ชัยนาท','อ่างทอง','สุพรรณบุรี','นครสวรรค์','อุทัยธานี','กำแพงเพชร','พิจิตร','พิษณุโลก','เพชรบูรณ์','สุโขทัย','ตาก','อุตรดิตถ์'],
        'ภาคตะวันออกเฉียงเหนือ': ['ขอนแก่น','อุดรธานี','นครราชสีมา','อุบลราชธานี','สกลนคร','สุรินทร์','บุรีรัมย์','ศรีสะเกษ','มหาสารคาม','ร้อยเอ็ด','กาฬสินธุ์','นครพนม','มุกดาหาร','เลย','หนองคาย','หนองบัวลำภู','บึงกาฬ','ชัยภูมิ','อำนาจเจริญ','ยโสธร'],
        'ภาคตะวันออก': ['ชลบุรี','ระยอง','จันทบุรี','ตราด','ฉะเชิงเทรา','ปราจีนบุรี','สระแก้ว','นครนายก'],
        'ภาคตะวันตก': ['กาญจนบุรี','ราชบุรี','เพชรบุรี','ประจวบคีรีขันธ์'],
        'ภาคใต้': ['สงขลา','นครศรีธรรมราช','สุราษฎร์ธานี','ภูเก็ต','กระบี่','ตรัง','พัทลุง','สตูล','ปัตตานี','ยะลา','นราธิวาส','ชุมพร','ระนอง','พังงา'],
    };
    function _extractProvince(addr) {
        const m = (addr || '').match(/จังหวัด([^\s,]+)/);
        return m ? m[1] : '';
    }
    function _getRegion(province) {
        if (!province) return 'ไม่ระบุภูมิภาค';
        for (const [region, list] of Object.entries(THAI_REGIONS)) {
            if (list.some(p => province.includes(p) || p.includes(province))) return region;
        }
        return 'อื่นๆ';
    }
    const recipientsByRegion = {};
    recipients.forEach(rec => {
        const prov = _extractProvince(rec.address);
        const region = _getRegion(prov);
        if (!recipientsByRegion[region]) recipientsByRegion[region] = [];
        recipientsByRegion[region].push({ ...rec, province: prov || '—' });
    });

    // Social value for SROI (L)
    const socialValue = Object.entries(deviceBreakdown).reduce((s, [t, v]) =>
        s + v.count * (DEVICE_VALUE[t] || 3000), 0);
    const PKG_PRICE = { S: 18000 + 300 * corp.device_count, M: 45000 + 250 * corp.device_count, L: 90000 + 200 * corp.device_count };
    const investment = 2500 * 12 + (PKG_PRICE[pkg] || 0);
    const sroi = investment > 0 ? (socialValue / investment).toFixed(1) : 0;

    // Province extraction from recipients
    const provinceSet = new Set();
    recipients.forEach(rec => {
        if (rec.address) {
            const parts = rec.address.split(' ');
            const lastParts = parts.slice(-3).join(' ');
            provinceSet.add(lastParts.length > 5 ? lastParts : rec.address.split(',').pop()?.trim() || '—');
        }
    });

    // Report meta
    const PKG_LABELS = { S: 'Starter CSR', M: 'Professional ESG', L: 'Corporate Impact' };
    const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    const reportYear = new Date().getFullYear() + 543;
    const refNum = `GU-ESG-${reportYear}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    const startDate = corp.start_date
        ? new Date(corp.start_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—';
    const endDate = corp.end_date
        ? new Date(corp.end_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—';

    // ── Sample activity photo (embedded, used as fallback in social section) ──
    const _SAMPLE_IMG = 'data:image/jpeg;base64,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';

    // ── Helper: section heading — green band ──
    const h1 = (n, txt) => `<div style="background:#2f5233;padding:9pt 16pt;margin:22pt 0 10pt;"><p style="color:white;font-size:13pt;font-weight:bold;font-family:Georgia,serif;letter-spacing:0.5pt;margin:0;">${n}. ${txt}</p></div>`;
    const h2 = (txt) => `<p style="font-size:11pt;font-weight:bold;color:#2f5233;border-left:4px solid #d4a574;padding-left:8pt;margin:14pt 0 8pt;font-family:Tahoma,sans-serif;">${txt}</p>`;

    // ── Helper: KPI box row ──
    const kpiRow = (label, value, unit, bg='#f0f7f0') =>
        `<tr>
            <td style="padding:7pt 10pt;background:${bg};font-family:Tahoma,sans-serif;font-size:10pt;color:#555;width:55%;">${label}</td>
            <td style="padding:7pt 10pt;background:${bg};font-family:Tahoma,sans-serif;font-size:12pt;font-weight:bold;color:#2f5233;text-align:right;">${value}</td>
            <td style="padding:7pt 10pt;background:${bg};font-family:Tahoma,sans-serif;font-size:9pt;color:#8b7355;width:15%;">${unit}</td>
        </tr>`;

    // ── Helper: table header ──
    const th = (txt, w='') => `<th style="background:#2f5233;color:white;padding:7pt 9pt;font-family:Tahoma,sans-serif;font-size:9pt;text-align:left;${w?'width:'+w:''}">${txt}</th>`;
    const td = (txt, bold=false, center=false) => `<td style="padding:6pt 9pt;font-family:Tahoma,sans-serif;font-size:9pt;border-bottom:1px solid #e8e0d6;${bold?'font-weight:bold;color:#2f5233;':'color:#333;'}${center?'text-align:center;':''}">${txt}</td>`;

    // ── Helper: disclaimer note ──
    const note = (txt) => `<p style="font-family:Tahoma,sans-serif;font-size:8pt;color:#aaa;margin-top:4pt;">* ${txt}</p>`;

    const STATUS_TH = { submitted:'รอตรวจสอบ', verified:'ตรวจสอบแล้ว', scheduled:'นัดรับ',
        picked_up:'รับพัสดุแล้ว', processing:'ดำเนินการ', data_wiped:'ลบข้อมูลแล้ว',
        ready:'พร้อมจัดส่ง', distributed:'จัดส่งแล้ว', completed:'สำเร็จ' };
    const CARRIER_TH = { thailand_post:'ไปรษณีย์ไทย', jt_express:'J&T Express', flash_express:'Flash Express' };

    // ════════════════════════════════════════════════════════
    // BUILD HTML
    // ════════════════════════════════════════════════════════
    let html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<title>Sustainability Report — ${escapeHtml(corp.org_name)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
  @page { margin: 2.5cm 2.5cm 2.5cm 2.8cm; }
  body { font-family: Tahoma, 'Angsana New', sans-serif; font-size: 10pt; color: #333; line-height: 1.5; }
  table { border-collapse: collapse; width: 100%; }
  .page-break { page-break-after: always; }
  p { margin: 0 0 8pt; }
</style>
</head>
<body>

<!-- ═══════════════ COVER PAGE ═══════════════ -->
<table style="width:100%;height:580pt;border:none;">
  <tr><td style="vertical-align:middle;text-align:center;padding:60pt 40pt;">
    <div style="background:#2f5233;padding:20pt 40pt;margin-bottom:30pt;width:100%;">
      <p style="color:#d4a574;font-size:28pt;font-weight:bold;font-family:Georgia,serif;letter-spacing:4pt;margin:0;">GEARUP</p>
      <p style="color:rgba(255,255,255,0.7);font-size:9pt;letter-spacing:2pt;margin:4pt 0 0;">E-WASTE MANAGEMENT &amp; DIGITAL EQUITY PLATFORM</p>
    </div>
    <p style="font-size:20pt;font-weight:bold;color:#1a2421;margin:20pt 0 6pt;font-family:Georgia,serif;">รายงานความยั่งยืนและผลกระทบต่อสังคม</p>
    <p style="font-size:12pt;color:#8b7355;margin:0 0 8pt;letter-spacing:1pt;">Sustainability &amp; Social Impact Report</p>
    <p style="font-size:10pt;color:#aaa;margin:0 0 28pt;font-family:Tahoma,sans-serif;">E-Waste Management &amp; Digital Equity Initiative</p>
    <table style="width:80%;margin:0 auto;border:1.5px solid #d4a574;">
      <tr><td style="padding:8pt 14pt;background:#f8f6f3;font-family:Tahoma,sans-serif;font-size:10pt;color:#555;width:42%;">องค์กร</td>
          <td style="padding:8pt 14pt;background:#f8f6f3;font-family:Tahoma,sans-serif;font-size:11pt;font-weight:bold;color:#1a2421;">${escapeHtml(corp.org_name)}</td></tr>
      <tr><td style="padding:8pt 14pt;background:white;font-family:Tahoma,sans-serif;font-size:10pt;color:#555;">ระยะเวลาโครงการ</td>
          <td style="padding:8pt 14pt;background:white;font-family:Tahoma,sans-serif;font-size:10pt;">${startDate} – ${endDate}</td></tr>
      <tr><td style="padding:8pt 14pt;background:#f8f6f3;font-family:Tahoma,sans-serif;font-size:10pt;color:#555;">วันที่ออกรายงาน</td>
          <td style="padding:8pt 14pt;background:#f8f6f3;font-family:Tahoma,sans-serif;font-size:10pt;">${today}</td></tr>
      <tr><td style="padding:8pt 14pt;background:white;font-family:Tahoma,sans-serif;font-size:10pt;color:#555;">ระดับความร่วมมือ</td>
          <td style="padding:8pt 14pt;background:white;font-family:Tahoma,sans-serif;font-size:10pt;color:#2f5233;">${PKG_LABELS[pkg]}</td></tr>
      <tr><td style="padding:8pt 14pt;background:#f8f6f3;font-family:Tahoma,sans-serif;font-size:10pt;color:#555;">เลขอ้างอิงรายงาน</td>
          <td style="padding:8pt 14pt;background:#f8f6f3;font-family:Tahoma,sans-serif;font-size:10pt;font-family:monospace;">${refNum}</td></tr>
    </table>
    <p style="margin-top:36pt;font-size:8pt;color:#aaa;font-family:Tahoma,sans-serif;">
      จัดทำโดย GEARUP | info@gearup.com | 064-335-2325<br>
      รายงานฉบับนี้จัดทำตามกรอบ GRI Standards และครอบคลุมข้อมูลด้าน E-Waste Management และ Digital Equity เท่านั้น
    </p>
  </td></tr>
</table>

<div class="page-break"></div>

<!-- ═══════════════ SECTION 1: COMPANY PROFILE ═══════════════ -->
${h1(1,'ข้อมูลบริษัท (Company Profile)')}
<p style="font-family:Tahoma,sans-serif;font-size:10pt;color:#555;margin-bottom:12pt;">
  ข้อมูลพื้นฐานขององค์กรที่เข้าร่วมโครงการ GEARUP ในฐานะพันธมิตรด้านความยั่งยืน
  ข้อมูลเหล่านี้ใช้เพื่อระบุตัวตนของผู้รายงานและยืนยันความถูกต้องของรายงานฉบับนี้
</p>
<table style="width:100%;border:1px solid #d4a574;">
  <tbody>
    ${kpiRow('ชื่อองค์กร', '<strong>'+escapeHtml(corp.org_name)+'</strong>', '')}
    ${kpiRow('เลขประจำตัวผู้เสียภาษี', escapeHtml(corp.tax_id || '—'), '', '#fafafa')}
    ${kpiRow('ผู้ติดต่อหลัก', escapeHtml(corp.contact_name || '—'), '')}
    ${kpiRow('อีเมลติดต่อ', escapeHtml(corp.contact_email || '—'), '', '#fafafa')}
    ${kpiRow('เบอร์โทรศัพท์', escapeHtml(corp.contact_phone || '—'), '')}
    ${kpiRow('ระดับความร่วมมือ', PKG_LABELS[pkg]+' ('+pkg+')', '', '#fafafa')}
    ${kpiRow('โควต้าอุปกรณ์', (corp.quota_min||0)+' – '+(corp.quota_max||0)+' เครื่อง', '')}
    ${kpiRow('ระยะเวลาโครงการ', startDate+' ถึง '+endDate, '', '#fafafa')}
    ${kpiRow('สถานะ', corp.status === 'active' ? '✅ ใช้งานอยู่' : corp.status || '—', '')}
  </tbody>
</table>

<div class="page-break"></div>

<!-- ═══════════════ SECTION 2: EXECUTIVE SUMMARY ═══════════════ -->
${h1(2,'บทสรุปผู้บริหาร (Executive Summary)')}
<p style="font-family:Tahoma,sans-serif;font-size:10pt;color:#555;margin-bottom:8pt;">
  ${escapeHtml(corp.org_name)} ได้ดำเนินโครงการบริจาคอุปกรณ์อิเล็กทรอนิกส์ร่วมกับ GEARUP
  เพื่อส่งเสริมความรับผิดชอบต่อสิ่งแวดล้อมและลดความเหลื่อมล้ำทางดิจิทัลในสังคมไทย
  รายงานฉบับนี้สรุปผลการดำเนินงานตลอดระยะเวลาโครงการ
</p>

<table style="width:100%;border:1px solid #d4a574;margin-bottom:14pt;">
  <thead><tr>
    ${th('ตัวชี้วัดหลัก (KPI)','55%')}${th('ผลลัพธ์','25%')}${th('หน่วย','20%')}
  </tr></thead>
  <tbody>
    ${kpiRow('อุปกรณ์ที่บริจาคทั้งหมด', totalItems.toLocaleString(), 'ชิ้น')}
    ${kpiRow('น้ำหนัก E-Waste ที่จัดการได้', totalWeight.toFixed(1), 'กิโลกรัม', '#fafafa')}
    ${kpiRow('Carbon Emissions Avoided (Scope 3)', Math.round(totalCarbon).toLocaleString(), 'kgCO₂e')}
    ${kpiRow('เทียบเท่าต้นไม้ที่ปลูก', treesEq.toLocaleString(), 'ต้น', '#fafafa')}
    ${isM ? kpiRow('โรงเรียน/องค์กรที่ได้รับประโยชน์', recipients.length.toString(), 'แห่ง') : kpiRow('ประมาณผู้รับประโยชน์', (totalItems*25).toLocaleString(), 'คน (ประมาณการ)')}
    ${kpiRow('อุปกรณ์ที่ผ่านกระบวนการลบข้อมูล', wipedCount.toString(), 'เครื่อง', '#fafafa')}
    ${kpiRow('การบริจาคที่เสร็จสมบูรณ์', completedCount+' / '+donations.length, 'รายการ')}
  </tbody>
</table>

<div style="border-left:4px solid #d4a574;padding:10pt 16pt;background:#fdf9f4;">
  <p style="font-family:Tahoma,sans-serif;font-size:9.5pt;color:#555;margin:0;">
    <strong>ความสำเร็จสำคัญในรอบการรายงานนี้:</strong><br>
    • ${escapeHtml(corp.org_name)} บริจาคอุปกรณ์รวม ${totalItems.toLocaleString()} ชิ้น น้ำหนักรวม ${totalWeight.toFixed(1)} กก. ป้องกัน E-Waste จากหลุมฝังกลบ<br>
    • ลดการปล่อยก๊าซเรือนกระจกได้ ${Math.round(totalCarbon).toLocaleString()} kgCO₂e เทียบเท่าการปลูกต้นไม้ ${treesEq.toLocaleString()} ต้น<br>
    ${isM ? `• ส่งมอบอุปกรณ์สู่โรงเรียนและองค์กรชุมชน ${recipients.length} แห่ง ประมาณการผู้รับประโยชน์ ${(totalItems*25).toLocaleString()} คน` : `• ประมาณการผู้รับประโยชน์ทางอ้อมจากอุปกรณ์ที่บริจาค ${(totalItems*25).toLocaleString()} คน`}
  </p>
</div>

<div class="page-break"></div>

<!-- ═══════════════ SECTION 3: CARBON & DEVICE BREAKDOWN ═══════════════ -->
${h1(3,'หมวดหมู่อุปกรณ์และการลดคาร์บอน')}

${h2('3.1 ประเภทอุปกรณ์ที่บริจาคและ Carbon Avoided')}
<p style="font-family:Tahoma,sans-serif;font-size:10pt;color:#555;margin-bottom:8pt;">
  ตารางด้านล่างแสดงรายละเอียดอุปกรณ์แยกตามประเภท พร้อมปริมาณ Carbon Emissions Avoided ที่คำนวณจากน้ำหนักรวม
  ของแต่ละประเภทคูณด้วย Emission Factor มาตรฐาน
</p>
<table style="width:100%;border:1px solid #d4a574;">
  <thead><tr>
    ${th('ประเภทอุปกรณ์','28%')}${th('จำนวน (ชิ้น)','16%')}${th('น้ำหนักรวม (กก.)','18%')}${th('Carbon Avoided (kgCO₂e)','22%')}${th('สัดส่วน','16%')}
  </tr></thead>
  <tbody>
    ${Object.entries(deviceBreakdown).length > 0
        ? Object.entries(deviceBreakdown).map(([t, v], i) =>
            `<tr style="${i%2===1?'background:#fafafa;':''}">
              ${td(DEVICE_TH[t] || t, true)}
              ${td(v.count.toString(), false, true)}
              ${td(v.weight.toFixed(1), false, true)}
              ${td(Math.round(v.carbon).toLocaleString(), false, true)}
              ${td(totalItems > 0 ? Math.round(v.count/totalItems*100)+'%' : '—', false, true)}
            </tr>`).join('')
        : `<tr>${td('ไม่มีข้อมูลอุปกรณ์')}${td('')}${td('')}${td('')}${td('')}</tr>`
    }
    <tr style="background:#f0f7f0;">
      ${td('<strong>รวมทั้งหมด</strong>', true)}
      ${td('<strong>'+totalItems+'</strong>', true, true)}
      ${td('<strong>'+totalWeight.toFixed(1)+'</strong>', true, true)}
      ${td('<strong>'+Math.round(totalCarbon).toLocaleString()+'</strong>', true, true)}
      ${td('<strong>100%</strong>', true, true)}
    </tr>
  </tbody>
</table>

${h2('3.2 การรับรองการคำนวณคาร์บอน')}
<p style="font-family:Tahoma,sans-serif;font-size:10pt;color:#555;margin-bottom:10pt;">
  ปริมาณ Carbon Emissions Avoided คำนวณตามสูตร:
  <strong>น้ำหนักอุปกรณ์ (กก.) × Emission Factor (kgCO₂e/กก.)</strong>
  จัดอยู่ใน Scope 3 ของ GHG Protocol Framework การนำอุปกรณ์กลับมาใช้ใหม่หลีกเลี่ยงการผลิตอุปกรณ์ใหม่
  ซึ่งใช้พลังงานและทรัพยากรธรรมชาติจำนวนมาก
</p>
<div style="border:2px solid #2f5233;padding:14pt 18pt;background:#f0f7f0;text-align:center;">
  <p style="font-family:Georgia,serif;font-size:13pt;color:#2f5233;font-weight:bold;margin:0 0 6pt;">
    ✅ GEARUP Carbon Savings Certification
  </p>
  <p style="font-family:Tahoma,sans-serif;font-size:11pt;color:#1a2421;margin:0 0 4pt;">
    <strong>${Math.round(totalCarbon).toLocaleString()} kgCO₂e</strong> Carbon Emissions Avoided
  </p>
  <p style="font-family:Tahoma,sans-serif;font-size:9pt;color:#8b7355;margin:0;">
    ${escapeHtml(corp.org_name)} | ปีงบประมาณ ${reportYear} | เลขอ้างอิง ${refNum}
  </p>
  <p style="font-family:Tahoma,sans-serif;font-size:8pt;color:#aaa;margin:6pt 0 0;">
    อ้างอิง: GHG Protocol Scope 3 | ITU-T L.1410 LCA of ICT Goods | EPA eGRID
  </p>
</div>
${note('Emission Factor: คอมพิวเตอร์ 30 | แล็ปท็อป 125 | แท็บเล็ต 250 | โทรศัพท์ 300 (kgCO₂e/กก.) ตามมาตรฐาน EPA และ WEEE Directive | ต้นไม้ 1 ต้นดูดซับ CO₂ ≈ 21.7 kg/ปี')}

${isM ? `
${h2('3.3 Data Security — การลบข้อมูลบนอุปกรณ์')}
<p style="font-family:Tahoma,sans-serif;font-size:10pt;color:#555;margin-bottom:8pt;">
  GEARUP ดำเนินการลบข้อมูลในอุปกรณ์ทุกเครื่องตามมาตรฐาน <strong>NIST SP 800-88</strong>
  รับประกันว่าข้อมูลที่เคยอยู่ในอุปกรณ์ไม่สามารถกู้คืนได้ก่อนส่งต่อให้ผู้รับปลายทาง
</p>
<table style="width:100%;border:1px solid #d4a574;"><tbody>
  ${kpiRow('อุปกรณ์ที่ผ่านกระบวนการลบข้อมูล', wipedCount.toString(), 'เครื่อง')}
  ${kpiRow('Microsoft License ที่ติดตั้งใหม่', (corp.ms_installed || 0).toString(), 'License','#fafafa')}
</tbody></table>
` : ''}

<div class="page-break"></div>

<!-- ═══════════════ SECTION 4: SOCIAL ═══════════════ -->
${h1(4,'กิจกรรมและผลกระทบทางสังคม (Social Component)')}

<!-- Featured activity photo -->
<table style="width:100%;border-collapse:collapse;margin-bottom:14pt;">
  <tr>
    <td style="width:55%;vertical-align:top;padding-right:16pt;">
      <p style="font-family:Tahoma,sans-serif;font-size:10pt;color:#555;margin-bottom:8pt;">
        ความเหลื่อมล้ำทางดิจิทัล (Digital Divide) ส่งผลให้เด็กนักเรียนในพื้นที่ห่างไกลมีโอกาสเข้าถึงคอมพิวเตอร์
        น้อยกว่าเด็กในเมืองถึง 4 เท่า (UNESCO) อุปกรณ์ที่ ${escapeHtml(corp.org_name)} บริจาคเปิดโอกาสทางการศึกษา
        และพัฒนาทักษะดิจิทัลให้กับชุมชนที่ขาดแคลน
      </p>
      <div style="background:#f0f7f0;border-left:4px solid #2f5233;padding:10pt 14pt;">
        <p style="font-family:Georgia,serif;font-size:11pt;color:#2f5233;font-style:italic;margin:0;">
          "อุปกรณ์ทุกชิ้นคือโอกาสทางการศึกษาที่เราส่งมอบให้เด็กๆ"
        </p>
        <p style="font-family:Tahoma,sans-serif;font-size:8.5pt;color:#8b7355;margin:4pt 0 0;">— ${escapeHtml(corp.org_name)} × GEARUP</p>
      </div>
    </td>
    <td style="width:45%;vertical-align:top;text-align:center;">
      <img src="${_SAMPLE_IMG}" style="max-width:100%;max-height:160pt;border:2px solid #d4a574;border-radius:4pt;" />
      <p style="font-family:Tahoma,sans-serif;font-size:8pt;color:#888;margin:5pt 0 0;text-align:center;">
        ภาพกิจกรรม: นักเรียนใช้งานคอมพิวเตอร์ที่ได้รับจากโครงการ
      </p>
    </td>
  </tr>
</table>

${isM
    ? (() => {
        const regionEntries = Object.entries(recipientsByRegion);
        const schoolListHtml = regionEntries.length > 0
            ? regionEntries.map(([region, recs]) => `
                ${h2('4.' + (regionEntries.indexOf(regionEntries.find(e=>e[0]===region))+1) + ' ' + region + ' ('+recs.length+' แห่ง)')}
                <table style="width:100%;border:1px solid #d4a574;margin-bottom:10pt;">
                  <thead><tr>
                    ${th('#','5%')}${th('โรงเรียน / องค์กร','42%')}${th('จังหวัด','18%')}${th('ประเภทอุปกรณ์','23%')}${th('จำนวน','12%')}
                  </tr></thead>
                  <tbody>
                    ${recs.map((rec, i) =>
                        '<tr style="'+(i%2===1?'background:#fafafa;':'')+'">'+
                        td((i+1).toString(), false, true)+
                        td(escapeHtml(rec.org_name || rec.project_name || rec.contact_name || '—'), true)+
                        td(escapeHtml(rec.province || '—'))+
                        td(escapeHtml(rec.equipment_type || '—'))+
                        td((rec.quantity||'—').toString(), false, true)+
                        '</tr>').join('')}
                  </tbody>
                </table>`).join('')
            : '<p style="font-family:Tahoma,sans-serif;font-size:10pt;color:#aaa;">ยังไม่มีข้อมูลผู้รับ</p>';

        const impactHtml = `
${h2('สรุปผลกระทบทางสังคม')}
<table style="width:100%;border:1px solid #d4a574;"><tbody>
  ${kpiRow('จำนวนโรงเรียน/องค์กรที่ได้รับอุปกรณ์', recipients.length.toString(), 'แห่ง')}
  ${kpiRow('จำนวนภูมิภาคที่ครอบคลุม', Object.keys(recipientsByRegion).length.toString(), 'ภูมิภาค','#fafafa')}
  ${kpiRow('อุปกรณ์ที่ถึงมือผู้รับแล้ว', completedCount.toString(), 'รายการ')}
  ${kpiRow('ประมาณนักเรียนที่เข้าถึงอุปกรณ์ (avg 25 คน/เครื่อง)', (totalItems*25).toLocaleString(), 'คน (ประมาณการ)','#fafafa')}
</tbody></table>
${note('การประมาณจำนวนนักเรียนใช้ค่าเฉลี่ย 25 คนต่ออุปกรณ์ 1 ชิ้น ตามมาตรฐาน UNESCO ICT in Education')}`;

        const sroi_html = isL ? `
<div class="page-break"></div>
${h2('Social Return on Investment (SROI)')}
<p style="font-family:Tahoma,sans-serif;font-size:10pt;color:#555;margin-bottom:8pt;">
  SROI แปลงผลกระทบทางสังคมเป็นมูลค่าทางการเงินเพื่อเปรียบเทียบกับเงินลงทุนได้โดยตรง
  (Roberts Enterprise Development Fund / REDF Framework)
</p>
<table style="width:100%;border:1px solid #d4a574;"><tbody>
  ${kpiRow('มูลค่าตลาดของอุปกรณ์ refurbished ที่โรงเรียนได้รับ', socialValue.toLocaleString(), 'บาท')}
  ${kpiRow('เงินลงทุนรวมของ'+escapeHtml(corp.org_name), investment.toLocaleString(), 'บาท','#fafafa')}
  ${kpiRow('SROI Ratio', sroi+'x', 'บาทต่อทุก 1 บาทที่ลงทุน')}
</tbody></table>
<p style="font-family:Tahoma,sans-serif;font-size:10pt;color:#2f5233;font-weight:bold;margin-top:8pt;">
  ทุกๆ 1 บาทที่ ${escapeHtml(corp.org_name)} ลงทุน สร้างมูลค่าทางสังคมคืนสู่ชุมชน ${sroi} บาท
</p>
${note('มูลค่าตลาดอุปกรณ์ refurbished: คอมพิวเตอร์ 5,000 | แล็ปท็อป 8,000 | แท็บเล็ต 4,000 | โทรศัพท์ 3,000 บาท (ราคาตลาดมือสอง)')}` : '';

        const photosHtml = deliveryPhotos.length > 0 ? `
<div class="page-break"></div>
${h2('ภาพบรรยากาศการส่งมอบอุปกรณ์')}
<p style="font-family:Tahoma,sans-serif;font-size:10pt;color:#555;margin-bottom:10pt;">
  ภาพถ่ายจากกิจกรรมส่งมอบอุปกรณ์จริงให้กับโรงเรียนและองค์กรชุมชน
</p>
<table style="width:100%;border-collapse:collapse;">
  ${deliveryPhotos.reduce((rows, p, i) => {
      if (i % 3 === 0) rows.push([]);
      rows[rows.length-1].push(p);
      return rows;
  }, []).map(row =>
      `<tr>${row.map(p =>
          `<td style="padding:6pt;width:33%;vertical-align:top;text-align:center;">
            <img src="${p.url}" style="max-width:160pt;max-height:120pt;border:1px solid #ddd;border-radius:4pt;" />
            <p style="font-family:Tahoma,sans-serif;font-size:7.5pt;color:#888;margin:4pt 0 0;">${escapeHtml(p.title || '—')}</p>
          </td>`).join('')}${row.length < 3 ? '<td></td>'.repeat(3-row.length) : ''}</tr>`
  ).join('')}
</table>` : '';

        return impactHtml + schoolListHtml + sroi_html + photosHtml;
    })()
    : `<p style="font-family:Tahoma,sans-serif;font-size:10pt;color:#555;margin-bottom:8pt;">
        อุปกรณ์ที่ ${escapeHtml(corp.org_name)} บริจาคได้รับการคัดแยก ตรวจสอบคุณภาพ และส่งต่อให้กับโรงเรียน
        หรือองค์กรชุมชนที่มีความต้องการผ่านระบบ GEARUP รับประกันว่าอุปกรณ์ถูกใช้งานจริงและสร้างประโยชน์สูงสุด
       </p>
       <p style="font-family:Tahoma,sans-serif;font-size:10pt;color:#555;margin-bottom:8pt;">
        อุปกรณ์ทุก 1 ชิ้นสามารถเข้าถึงนักเรียนได้เฉลี่ย 25 คนตลอดอายุการใช้งาน (UNESCO ICT in Education)
        คาดว่าโครงการนี้ส่งผลกระทบทางสังคมถึงประมาณ <strong>${(totalItems*25).toLocaleString()} คน</strong>
       </p>
       <p style="font-family:Tahoma,sans-serif;font-size:9pt;color:#aaa;font-style:italic;">
        ข้อมูลผลกระทบเชิงลึก (รายชื่อโรงเรียน แบ่งตามภูมิภาค ภาพการส่งมอบ) มีใน Package Professional ESG (M) ขึ้นไป
       </p>`
}

${isL ? `
<div class="page-break"></div>
<!-- SDG MAPPING -->
${h1(5,'ความสอดคล้องกับเป้าหมาย UN SDGs')}
<p style="font-family:Tahoma,sans-serif;font-size:10pt;color:#555;margin-bottom:12pt;">
  โครงการของ ${escapeHtml(corp.org_name)} สอดคล้องโดยตรงกับ Sustainable Development Goals หลัก 4 เป้าหมาย
</p>
<table style="width:100%;border:1px solid #d4a574;">
  <thead><tr>${th('SDG','12%')}${th('เป้าหมาย','30%')}${th('ความเชื่อมโยงกับโครงการ','58%')}</tr></thead>
  <tbody>
    <tr>${td('SDG 4',true)}${td('Quality Education')}${td('บริจาคอุปกรณ์ IT ให้โรงเรียน '+recipients.length+' แห่ง ช่วยเพิ่มการเข้าถึงการศึกษาในยุคดิจิทัล')}</tr>
    <tr style="background:#fafafa;">${td('SDG 12',true)}${td('Responsible Consumption')}${td('เบี่ยงเบน e-waste '+totalWeight.toFixed(1)+' กก. ออกจากหลุมฝังกลบ ผ่านกระบวนการ reuse/refurbish')}</tr>
    <tr>${td('SDG 13',true)}${td('Climate Action')}${td('ลดการปล่อยก๊าซเรือนกระจก '+Math.round(totalCarbon).toLocaleString()+' kgCO₂e เทียบเท่าปลูกต้นไม้ '+treesEq.toLocaleString()+' ต้น')}</tr>
    <tr style="background:#fafafa;">${td('SDG 17',true)}${td('Partnerships for Goals')}${td('ความร่วมมือ '+escapeHtml(corp.org_name)+' × GEARUP × โรงเรียน/องค์กรรับบริจาค')}</tr>
  </tbody>
</table>
${isL ? `
${h2('GRI Standards Index')}
<table style="width:100%;border:1px solid #d4a574;">
  <thead><tr>${th('GRI Disclosure')}${th('หัวข้อ')}${th('ข้อมูลที่รายงาน')}</tr></thead>
  <tbody>
    <tr>${td('GRI 306-2')}${td('Waste by type and disposal method')}${td(totalWeight.toFixed(1)+' กก. — Reuse / Redistribution')}</tr>
    <tr style="background:#fafafa;">${td('GRI 305-5')}${td('Reduction of GHG emissions')}${td(Math.round(totalCarbon).toLocaleString()+' kgCO₂e avoided')}</tr>
    <tr>${td('GRI 413-1')}${td('Operations with local community engagement')}${td(recipients.length+' communities supported')}</tr>
    <tr style="background:#fafafa;">${td('GRI 203-2')}${td('Significant indirect economic impacts')}${td('Digital equity — อุปกรณ์สู่โรงเรียน '+recipients.length+' แห่ง')}</tr>
  </tbody>
</table>
${isL ? `
${h2('Exclusive Partner Certificate')}
<div style="border:2px solid #2f5233;padding:14pt 18pt;background:#f0f7f0;">
  <p style="font-family:Georgia,serif;font-size:11pt;color:#2f5233;font-weight:bold;margin:0 0 6pt;">ใบรับรองการเป็น Exclusive Partner</p>
  <p style="font-family:Tahoma,sans-serif;font-size:10pt;color:#333;margin:0;">
    ขอรับรองว่า <strong>${escapeHtml(corp.org_name)}</strong> เป็น Exclusive Partner ของ GEARUP
    ภายใต้ระดับความร่วมมือสูงสุด (Corporate Impact) มีสิทธิ์ใช้โลโก้ "GEARUP Exclusive Partner" ในการสื่อสารภายนอก
  </p>
</div>
` : ''}
` : ''}
` : ''}

<div class="page-break"></div>

<!-- ═══════════════ APPENDIX A: AUDIT TRAIL ═══════════════ -->
${h1('ภาคผนวก ก','Audit Trail — รายการบริจาคทั้งหมด')}
<p style="font-family:Tahoma,sans-serif;font-size:10pt;color:#555;margin-bottom:8pt;">
  ตารางด้านล่างเป็น Audit Trail ฉบับสมบูรณ์ของการบริจาคทั้งหมดในโครงการ แต่ละรายการมี Tracking ID
  เฉพาะในรูปแบบ <span style="font-family:monospace;">GU-DON-DDMMYYYY-NNN</span>
  สามารถอ้างอิงและตรวจสอบข้ามกับรายงานฉบับนี้ได้ตลอดเวลา
</p>
<table style="width:100%;border:1px solid #d4a574;">
  <thead><tr>
    ${th('Tracking ID','30%')}${th('วันที่','18%')}${th('อุปกรณ์','12%')}${th('น้ำหนัก (กก.)','15%')}${th('ขนส่ง','13%')}${th('สถานะ','12%')}
  </tr></thead>
  <tbody>
    ${donations.length > 0
        ? donations.map((d, i) => `
            <tr style="${i%2===1?'background:#fafafa;':''}">
              ${td(escapeHtml(d.tracking_id || '—'), true)}
              ${td(new Date(d.created_at).toLocaleDateString('th-TH'))}
              ${td((d.total_items||0)+' ชิ้น', false, true)}
              ${td(parseFloat(d.total_weight||0).toFixed(1), false, true)}
              ${td(escapeHtml(CARRIER_TH[d.shipping_carrier] || '—'))}
              ${td(escapeHtml(STATUS_TH[d.current_status] || d.current_status || '—'))}
            </tr>`).join('')
        : `<tr>${td('ยังไม่มีข้อมูลการบริจาค', false, true)}${td('')}${td('')}${td('')}${td('')}${td('')}</tr>`
    }
  </tbody>
</table>

${isL ? (() => {
    const serialItems = donations.flatMap(d =>
        (d.donation_items || []).filter(i => i.serial_number).map(i => ({ ...i, tracking_id: d.tracking_id }))
    );
    return serialItems.length > 0 ? `
<br>
${h2('รายการ Serial Number (Audit-Ready — L Package)')}
<table style="width:100%;border:1px solid #d4a574;">
  <thead><tr>
    ${th('#','5%')}${th('Serial Number','25%')}${th('ประเภท','18%')}${th('ยี่ห้อ','17%')}${th('รุ่น','17%')}${th('Tracking ID','18%')}
  </tr></thead>
  <tbody>
    ${serialItems.map((i, idx) =>
        `<tr style="${idx%2===1?'background:#fafafa;':''}">
          ${td((idx+1).toString(), false, true)}
          ${td('<span style="font-family:monospace;font-size:8pt;">'+escapeHtml(i.serial_number)+'</span>', true)}
          ${td(DEVICE_TH[i.device_type] || i.device_type || '—')}
          ${td(escapeHtml(i.device_brand || '—'))}
          ${td(escapeHtml(i.device_model || '—'))}
          ${td('<span style="font-family:monospace;font-size:8pt;">'+escapeHtml(i.tracking_id || '—')+'</span>')}
        </tr>`).join('')}
  </tbody>
</table>` : '';
})() : ''}

<div class="page-break"></div>

<!-- ═══════════════ APPENDIX B: METHODOLOGY ═══════════════ -->
${h1('ภาคผนวก ข','เกณฑ์อ้างอิงและวิธีการคำนวณ')}

${h2('ค่า Emission Factor ที่ใช้ในการคำนวณ')}
<table style="width:70%;border:1px solid #d4a574;">
  <thead><tr>${th('ประเภทอุปกรณ์')}${th('Emission Factor')}${th('แหล่งอ้างอิง')}</tr></thead>
  <tbody>
    <tr>${td('คอมพิวเตอร์ (Desktop/Tower)')}${td('30 kgCO₂e/กก.', false, true)}${td('EPA WEEE / GHG Protocol')}</tr>
    <tr style="background:#fafafa;">${td('แล็ปท็อป')}${td('125 kgCO₂e/กก.', false, true)}${td('ITU-T L.1410 LCA')}</tr>
    <tr>${td('แท็บเล็ต')}${td('250 kgCO₂e/กก.', false, true)}${td('European WEEE Directive')}</tr>
    <tr style="background:#fafafa;">${td('โทรศัพท์มือถือ')}${td('300 kgCO₂e/กก.', false, true)}${td('ITU-T L.1410 LCA')}</tr>
    <tr>${td('ต้นไม้เทียบเท่า (1 ต้น/ปี)')}${td('21.7 kg CO₂/ปี', false, true)}${td('IPCC AR5')}</tr>
  </tbody>
</table>

${h2('ข้อจำกัดของรายงาน')}
<ul style="font-family:Tahoma,sans-serif;font-size:10pt;color:#555;line-height:2;">
  <li>รายงานฉบับนี้ครอบคลุมเฉพาะข้อมูลการจัดการ E-Waste และ Digital Equity ของ ${escapeHtml(corp.org_name)} ผ่านโครงการ GEARUP เท่านั้น</li>
  <li>ไม่ครอบคลุม Scope 1/2 GHG emissions ของตัวองค์กร ข้อมูลพนักงาน หรือโครงสร้างกำกับดูแลภายใน</li>
  <li>การประมาณการด้านสังคม (จำนวนผู้รับประโยชน์) เป็นค่าประมาณจากค่าเฉลี่ยมาตรฐาน UNESCO</li>
  <li>ข้อมูลทั้งหมดอ้างอิงจากระบบ GEARUP ณ วันที่ออกรายงาน</li>
</ul>

<div style="border-left:4px solid #2f5233;padding:10pt 16pt;margin:16pt 0;background:#f8f6f3;">
<p style="font-family:Tahoma,sans-serif;font-size:10pt;color:#333;margin:0;">
  ${escapeHtml(corp.org_name)} และ GEARUP มุ่งมั่นขยายผลการดำเนินงานด้านสิ่งแวดล้อมและสังคมอย่างต่อเนื่อง
  เป้าหมายร่วมกันคือ <strong>วงจร Zero-Waste Electronics</strong> ที่สมบูรณ์แบบ
  พร้อมสร้างโอกาสทางการศึกษาดิจิทัลที่เท่าเทียมให้กับเยาวชนไทยทั่วทุกภูมิภาค
</p>
</div>

<table style="width:100%;border-top:1.5px solid #d4a574;margin-top:20pt;">
  <tr>
    <td style="padding:12pt 0;font-family:Tahoma,sans-serif;font-size:8pt;color:#aaa;text-align:center;">
      รายงานฉบับนี้จัดทำโดย GEARUP Platform | ${refNum} | ${today}<br>
      info@gearup.com | 064-335-2325 | gearup.com
    </td>
  </tr>
</table>

</body>
</html>`;

    return html;
}

// ============================================================
// QUOTATION PDF GENERATOR
// ============================================================

async function generateQuotationPdf(inquiryId) {
    const id = inquiryId || document.getElementById('btnGenerateQuotation')?.dataset.inquiryId;
    const r = _inquiryCache[id];
    if (!r) { showAdminNotification('ไม่พบข้อมูล inquiry', 'error'); return; }

    const pkg = QUOTATION_PKGS[r.package_interest];
    if (!pkg) { showAdminNotification('กรุณาระบุแพ็คเกจก่อนออกใบเสนอราคา', 'error'); return; }

    if (!window.html2pdf) { showAdminNotification('html2pdf ไม่พร้อมใช้งาน กรุณารีเฟรชหน้า', 'error'); return; }

    const prAnnual    = pkg.prTotal;
    const swTotal     = pkg.swTotal;
    const esgAnnual   = pkg.esgAnnual;
    const subtotal    = pkg.flatTotal;
    const vat         = Math.round(subtotal * 0.07);
    const total       = subtotal + vat;
    const fmt         = n => n.toLocaleString('th-TH');

    const now = new Date();
    const thMon = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    const fmtDate = d => `${d.getDate()} ${thMon[d.getMonth()]} ${d.getFullYear() + 543}`;
    const dateStr  = fmtDate(now);
    const valid    = new Date(now.getTime() + 30 * 86400000);
    const validStr = fmtDate(valid);
    const ddmmyyyy = String(now.getDate()).padStart(2,'0') + String(now.getMonth()+1).padStart(2,'0') + now.getFullYear();
    const qtNum    = `QT-${ddmmyyyy}-${r.id.replace(/-/g,'').slice(0,6).toUpperCase()}`;

    const logoSrc  = 'logo-gearup.png';
    const orgName  = escapeHtml(r.org_name);
    const taxId    = r.tax_id    ? `<div>เลขผู้เสียภาษี: ${escapeHtml(r.tax_id)}</div>` : '';
    const attn     = r.contact_name  ? `<div>ผู้ติดต่อ: ${escapeHtml(r.contact_name)}</div>` : '';
    const email    = r.contact_email ? `<div>อีเมล: ${escapeHtml(r.contact_email)}</div>` : '';
    const phone    = r.contact_phone ? `<div>โทรศัพท์: ${escapeHtml(r.contact_phone)}</div>` : '';
    const addr     = r.contact_address ? `<div>${escapeHtml(r.contact_address)}</div>` : '';

    const serviceRows = pkg.services.map(s => `<div style="padding:2px 0">• ${escapeHtml(s)}</div>`).join('');

    const html = `<div style="width:750px;font-family:'Sarabun','TH Sarabun New',Tahoma,sans-serif;font-size:10pt;color:#1a2421;background:white;">

  <!-- HEADER -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#2f5233;border-collapse:collapse;">
    <tr>
      <td style="padding:10px 18px;width:260px;vertical-align:middle;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:8px;vertical-align:middle;">
            <img src="${logoSrc}" width="40" height="40" style="border-radius:50%;display:block;" crossorigin="anonymous">
          </td>
          <td style="vertical-align:middle;">
            <div style="color:white;font-size:15pt;font-weight:700;line-height:1.1;">GEARUP</div>
            <div style="color:rgba(255,255,255,0.7);font-size:7.5pt;">เทคโนโลยีที่ยั่งยืนเพื่อการศึกษา</div>
          </td>
        </tr></table>
      </td>
      <td style="padding:10px 0;text-align:center;vertical-align:middle;">
        <div style="color:white;font-size:15pt;font-weight:700;">ใบเสนอราคา</div>
      </td>
      <td style="padding:10px 18px;text-align:right;vertical-align:middle;width:200px;">
        <div style="color:rgba(255,255,255,0.85);font-size:8pt;line-height:1.7;">
          <div>info@gearup.com | 064-335-2325</div>
          <div>www.gearup.com</div>
        </div>
      </td>
    </tr>
  </table>
  <div style="height:3px;background:#d4a574;"></div>

  <!-- PAGE BODY -->
  <div style="padding:10px 18px 0;">

    <!-- DOC META -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;border:1px solid #d4a574;margin-bottom:8px;border-collapse:collapse;">
      <tr>
        <td style="padding:6px 12px;font-size:8.5pt;line-height:1.6;vertical-align:top;">
          <div><strong>เลขที่:</strong> ${qtNum}</div>
          <div><strong>วันที่ออก:</strong> ${dateStr}</div>
        </td>
        <td style="padding:6px 12px;font-size:8.5pt;line-height:1.6;text-align:right;vertical-align:top;">
          <div><strong>ใช้ได้ถึง:</strong> ${validStr} <span style="color:#888;">(30 วัน)</span></div>
          <div><strong>แพ็คเกจ:</strong> ${escapeHtml(r.package_interest || '')} — ${escapeHtml(pkg.name)}</div>
        </td>
      </tr>
    </table>

    <!-- ADDRESS -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;border-collapse:collapse;">
      <tr valign="top">
        <td width="50%" style="padding-right:5px;">
          <div style="background:#2f5233;color:white;font-weight:700;font-size:8pt;padding:4px 8px;">เรียน (ผู้รับใบเสนอราคา)</div>
          <div style="padding:6px 8px;border:1px solid #e0e0e0;border-top:none;font-size:8.5pt;line-height:1.6;">
            <div style="font-weight:700;font-size:9.5pt;">${orgName}</div>
            ${taxId}${attn}${email}${phone}${addr}
          </div>
        </td>
        <td width="50%" style="padding-left:5px;">
          <div style="background:#8b7355;color:white;font-weight:700;font-size:8pt;padding:4px 8px;">จาก (ผู้เสนอราคา)</div>
          <div style="padding:6px 8px;border:1px solid #e0e0e0;border-top:none;font-size:8.5pt;line-height:1.6;">
            <div style="font-weight:700;font-size:9.5pt;">บริษัท GEARUP จำกัด</div>
            <div>อีเมล: info@gearup.com</div>
            <div>โทรศัพท์: 064-335-2325</div>
            <div>เว็บไซต์: www.gearup.com</div>
          </div>
        </td>
      </tr>
    </table>

    <!-- PRICING TABLE -->
    <div style="margin-bottom:8px;">
      <div style="font-weight:700;font-size:9.5pt;color:#2f5233;margin-bottom:4px;padding-bottom:3px;border-bottom:2px solid #2f5233;">ตารางค่าบริการ</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:8.5pt;">
        <thead>
          <tr style="background:#2f5233;color:white;">
            <th style="padding:5px 8px;text-align:left;font-weight:700;width:38%;">รายการ</th>
            <th style="padding:5px 8px;text-align:left;font-weight:700;width:32%;">หน่วย</th>
            <th style="padding:5px 8px;text-align:center;font-weight:700;width:15%;">จำนวน</th>
            <th style="padding:5px 8px;text-align:right;font-weight:700;width:15%;">ราคา (บาท)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background:#f7faf7;">
            <td style="padding:5px 8px;">ค่าพื้นที่ประชาสัมพันธ์</td>
            <td style="padding:5px 8px;color:#555;">${fmt(pkg.prMonthly)} บาท/เดือน × ${pkg.prMonths}</td>
            <td style="padding:5px 8px;text-align:center;">${pkg.prMonths} เดือน</td>
            <td style="padding:5px 8px;text-align:right;font-weight:700;">${fmt(prAnnual)}</td>
          </tr>
          <tr>
            <td style="padding:5px 8px;">ค่าติดตั้งซอฟต์แวร์</td>
            <td style="padding:5px 8px;color:#555;">${fmt(pkg.swPerUnit)} บาท/เครื่อง × ${pkg.maxDevices}</td>
            <td style="padding:5px 8px;text-align:center;">≤ ${pkg.maxDevices} เครื่อง</td>
            <td style="padding:5px 8px;text-align:right;font-weight:700;">${fmt(swTotal)}</td>
          </tr>
          <tr style="background:#f7faf7;">
            <td style="padding:5px 8px;">${escapeHtml(pkg.esgName)}</td>
            <td style="padding:5px 8px;color:#555;">บาท/ปี</td>
            <td style="padding:5px 8px;text-align:center;">1 ปี</td>
            <td style="padding:5px 8px;text-align:right;font-weight:700;">${fmt(esgAnnual)}</td>
          </tr>
          <tr style="border-top:1.5px solid #ddd;">
            <td colspan="3" style="padding:4px 8px;text-align:right;color:#555;font-size:8pt;">รวมก่อนภาษีมูลค่าเพิ่ม</td>
            <td style="padding:4px 8px;text-align:right;">${fmt(subtotal)} บาท</td>
          </tr>
          <tr>
            <td colspan="3" style="padding:4px 8px;text-align:right;color:#555;font-size:8pt;">ภาษีมูลค่าเพิ่ม 7%</td>
            <td style="padding:4px 8px;text-align:right;">${fmt(vat)} บาท</td>
          </tr>
          <tr style="background:#2f5233;color:white;">
            <td colspan="3" style="padding:6px 8px;text-align:right;font-weight:700;font-size:10pt;">รวมทั้งสิ้น</td>
            <td style="padding:6px 8px;text-align:right;font-weight:700;font-size:11pt;">${fmt(total)} บาท</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- SERVICES + PAYMENT TERMS -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;border-collapse:collapse;">
      <tr valign="top">
        <td width="50%" style="padding-right:7px;">
          <div style="font-weight:700;color:#2f5233;font-size:8.5pt;margin-bottom:3px;padding-bottom:2px;border-bottom:1.5px solid #2f5233;">สิ่งที่รวมอยู่ในแพ็คเกจ</div>
          <div style="font-size:8pt;color:#333;line-height:1.6;">${serviceRows}</div>
        </td>
        <td width="50%" style="padding-left:7px;">
          <div style="font-weight:700;color:#2f5233;font-size:8.5pt;margin-bottom:3px;padding-bottom:2px;border-bottom:1.5px solid #2f5233;">เงื่อนไขการชำระเงิน</div>
          <div style="font-size:8pt;color:#333;line-height:1.6;">
            <div>• ชำระล่วงหน้า 50% เพื่อเริ่มโครงการ</div>
            <div>• ส่วนที่เหลือ 50% ภายใน 30 วันหลังส่งมอบ</div>
            <div>• โอนเงินเข้าบัญชีบริษัทตามที่แจ้ง</div>
            <div>• ออกใบเสร็จรับเงิน/ใบกำกับภาษีทันที</div>
          </div>
        </td>
      </tr>
    </table>

    <!-- TERMS -->
    <div style="margin-bottom:8px;">
      <div style="font-weight:700;color:#2f5233;font-size:8.5pt;margin-bottom:3px;padding-bottom:2px;border-bottom:1.5px solid #2f5233;">เงื่อนไขทั่วไป</div>
      <ol style="font-size:8pt;color:#444;line-height:1.65;padding-left:14px;margin:0;">
        <li>ใบเสนอราคานี้มีอายุ 30 วันนับจากวันที่ออก</li>
        <li>ราคาข้างต้นยังไม่รวมภาษีมูลค่าเพิ่ม 7% (แสดงแยกต่างหาก)</li>
        <li>บริษัทขอสงวนสิทธิ์ปรับราคาหากจำนวนอุปกรณ์จริงต่างจากที่ระบุอย่างมีนัยสำคัญ</li>
        <li>GEARUP ขอสงวนสิทธิ์ปรับขอบเขตงานโดยแจ้งล่วงหน้าเป็นลายลักษณ์อักษร</li>
        <li>กรุณาลงนามและประทับตรา (ถ้ามี) เพื่อยืนยันการสั่งซื้อ</li>
      </ol>
    </div>

    <!-- SIGNATURE -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;border-collapse:collapse;">
      <tr>
        <td width="50%" style="padding-right:5px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ccc;border-collapse:collapse;">
            <tr><td style="padding:7px 12px;text-align:center;font-size:8pt;">
              <div style="font-weight:700;color:#2f5233;margin-bottom:5px;">ผู้มีอำนาจลงนาม (ฝ่ายผู้ซื้อ)</div>
              <div style="color:#999;margin-bottom:3px;">ลายเซ็น: _______________________</div>
              <div style="font-weight:700;font-size:8.5pt;color:#1a2421;margin:4px 0;">${orgName}</div>
              <div style="color:#999;margin-bottom:3px;">ชื่อ-สกุล: _______________________</div>
              <div style="color:#999;">วันที่: _______________________</div>
            </td></tr>
          </table>
        </td>
        <td width="50%" style="padding-left:5px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ccc;border-collapse:collapse;">
            <tr><td style="padding:7px 12px;text-align:center;font-size:8pt;">
              <div style="font-weight:700;color:#2f5233;margin-bottom:5px;">ผู้มีอำนาจลงนาม (GEARUP)</div>
              <div style="color:#999;margin-bottom:3px;">ลายเซ็น: _______________________</div>
              <div style="font-weight:700;font-size:8.5pt;color:#1a2421;margin:4px 0;">บริษัท GEARUP จำกัด</div>
              <div style="color:#999;margin-bottom:3px;">ชื่อ-สกุล: _______________________</div>
              <div style="color:#999;">วันที่: _______________________</div>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>

  </div><!-- end page body -->

  <!-- FOOTER -->
  <div style="height:2px;background:#d4a574;"></div>
  <div style="background:#2f5233;color:rgba(255,255,255,0.85);text-align:center;font-size:7.5pt;padding:6px;">
    GEARUP — เทคโนโลยีที่ยั่งยืนเพื่อการศึกษา &nbsp;|&nbsp; info@gearup.com &nbsp;|&nbsp; 064-335-2325 &nbsp;|&nbsp; ${qtNum}
  </div>

</div>`;

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:750px;background:white;';
    container.innerHTML = html;
    document.body.appendChild(container);

    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 150));

    const btn = document.getElementById('btnGenerateQuotation');
    if (btn) { btn.disabled = true; btn.textContent = 'กำลังสร้าง PDF...'; }

    try {
        // render to canvas first — canvas dimensions are the ground truth for page size
        const canvas = await window.html2canvas(container.firstChild, {
            scale: 2, width: 750, scrollX: 0, scrollY: 0,
            useCORS: true, allowTaint: true, logging: false,
        });
        const pdfW = 210; // mm
        const pdfH = canvas.height / canvas.width * pdfW;
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: 'mm', format: [pdfW, pdfH], orientation: 'portrait' });
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.97), 'JPEG', 0, 0, pdfW, pdfH);
        pdf.save(`ใบเสนอราคา_${r.org_name.replace(/\s+/g, '_')}_${qtNum}.pdf`);
        showAdminNotification(`ออกใบเสนอราคา ${qtNum} สำเร็จ`, 'success');
    } catch (err) {
        showAdminNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
        document.body.removeChild(container);
        if (btn) { btn.disabled = false; btn.textContent = '📄 ออกใบเสนอราคา PDF'; }
    }

}

// ============================================================
// DELIVERY EVENTS SECTION
// ============================================================

let _eventsCache = {};
let _corpListForEvents = []; // cached list of corporate accounts for dropdowns

const EVENT_TYPE_LABELS = {
    delivery:     '📦 จัดส่งอุปกรณ์',
    site_visit:   '🏫 ลงพื้นที่',
    handover:     '🤝 ส่งมอบจริง',
    photo_session:'📸 ถ่ายรูป',
    other:        '📋 อื่นๆ',
};

const EVENT_STATUS_META = {
    pending:   { label: 'รอยืนยัน',   color: '#b45309', bg: '#fef3c7' },
    confirmed: { label: 'ยืนยันแล้ว', color: '#1d4ed8', bg: '#dbeafe' },
    completed: { label: 'เสร็จสิ้น',  color: '#166534', bg: '#dcfce7' },
    cancelled: { label: 'ยกเลิก',     color: '#991b1b', bg: '#fee2e2' },
};

async function loadEvents() {
    const wrap = document.getElementById('eventsListWrap');
    if (!wrap) return;
    wrap.innerHTML = '<div class="loading-state"><span class="spinner"></span> กำลังโหลด...</div>';

    // Populate corp filter dropdown if empty
    await _ensureCorpListForEvents();

    const corpFilter   = document.getElementById('evtFilterCorp')?.value   || '';
    const statusFilter = document.getElementById('evtFilterStatus')?.value || '';
    const typeFilter   = document.getElementById('evtFilterType')?.value   || '';

    try {
        let q = supabaseClient
            .from('delivery_events')
            .select(`
                *,
                corporate_accounts(id, org_name, package),
                requests(id, project_name, address)
            `)
            .order('scheduled_date', { ascending: true });

        if (corpFilter)   q = q.eq('corporate_account_id', corpFilter);
        if (statusFilter) q = q.eq('status', statusFilter);
        if (typeFilter)   q = q.eq('event_type', typeFilter);

        const { data, error } = await q;
        if (error) throw error;

        (data || []).forEach(ev => { _eventsCache[ev.id] = ev; });
        renderEventsList(data || []);
    } catch (err) {
        wrap.innerHTML = `<div class="loading-state" style="color:#e53e3e;">โหลดไม่สำเร็จ: ${escapeHtml(err.message)}</div>`;
    }
}

async function _ensureCorpListForEvents() {
    if (_corpListForEvents.length > 0) return;
    try {
        const { data } = await supabaseClient
            .from('corporate_accounts')
            .select('id, org_name')
            .order('org_name');
        _corpListForEvents = data || [];
    } catch (_) {
        _corpListForEvents = [];
    }

    // Populate both the filter dropdown and the modal dropdown
    const filterSel = document.getElementById('evtFilterCorp');
    const modalSel  = document.getElementById('evtCorpId');
    _corpListForEvents.forEach(c => {
        const val = escapeHtml(c.id);
        const txt = escapeHtml(c.org_name);
        if (filterSel && !filterSel.querySelector(`option[value="${val}"]`)) {
            filterSel.insertAdjacentHTML('beforeend', `<option value="${val}">${txt}</option>`);
        }
        if (modalSel && !modalSel.querySelector(`option[value="${val}"]`)) {
            modalSel.insertAdjacentHTML('beforeend', `<option value="${val}">${txt}</option>`);
        }
    });
}

function renderEventsList(events) {
    const wrap = document.getElementById('eventsListWrap');
    if (!events || events.length === 0) {
        wrap.innerHTML = '<div class="loading-state" style="color:#888;">ยังไม่มีกิจกรรม — กด "+ สร้างกิจกรรม" เพื่อเพิ่ม</div>';
        return;
    }

    // Stats summary
    const total     = events.length;
    const pending   = events.filter(e => e.status === 'pending').length;
    const confirmed = events.filter(e => e.status === 'confirmed').length;
    const completed = events.filter(e => e.status === 'completed').length;

    const statsHtml = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem;margin-bottom:1.25rem;">
      ${[
        ['ทั้งหมด', total,     '#2f5233', '#f0f4f1'],
        ['รอยืนยัน', pending,  '#b45309', '#fef3c7'],
        ['ยืนยันแล้ว', confirmed,'#1d4ed8','#dbeafe'],
        ['เสร็จสิ้น', completed,'#166534', '#dcfce7'],
      ].map(([l, n, c, bg]) => `
        <div style="background:${bg};border-radius:10px;padding:0.75rem 1rem;text-align:center;">
          <div style="font-size:1.6rem;font-weight:800;color:${c};font-family:'Playfair Display',serif;">${n}</div>
          <div style="font-size:0.75rem;color:${c};font-weight:600;">${l}</div>
        </div>`).join('')}
    </div>`;

    const cards = events.map(ev => {
        const sm   = EVENT_STATUS_META[ev.status] || EVENT_STATUS_META.pending;
        const typL = EVENT_TYPE_LABELS[ev.event_type] || ev.event_type;
        const corp = ev.corporate_accounts?.org_name || '—';
        const school = ev.requests?.project_name || ev.location || '—';
        const dateStr = ev.scheduled_date
            ? new Date(ev.scheduled_date).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'ยังไม่กำหนด';

        const photos = (ev.photo_urls || []).length;
        const trackingHtml = ev.shipping_tracking_id
            ? `<span style="font-size:0.8rem;background:#f0f4f1;padding:0.2rem 0.6rem;border-radius:5px;color:#2f5233;">
                 📦 ${escapeHtml(ev.shipping_carrier || '')} ${escapeHtml(ev.shipping_tracking_id)}
               </span>`
            : '';

        // Build status dropdown options (no JSON in onclick — use data attr + onchange)
        const statusOpts = ['pending', 'confirmed', 'completed', 'cancelled'].map(s =>
            `<option value="${s}" ${s === ev.status ? 'selected' : ''}>${EVENT_STATUS_META[s].label}</option>`
        ).join('');

        return `
        <div class="card" style="margin-bottom:1rem;padding:0;overflow:hidden;">
          <div style="display:flex;align-items:stretch;">
            <div style="width:5px;flex-shrink:0;background:${sm.color};"></div>
            <div style="flex:1;padding:1.1rem 1.25rem;display:flex;flex-wrap:wrap;gap:0.75rem;align-items:flex-start;">
              <!-- Left: main info -->
              <div style="flex:1;min-width:220px;">
                <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.4rem;">
                  <span style="font-size:0.72rem;font-weight:700;padding:0.2rem 0.65rem;border-radius:20px;
                               background:${sm.bg};color:${sm.color};">${sm.label}</span>
                  <span style="font-size:0.8rem;color:#666;">${typL}</span>
                </div>
                <div style="font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:#1a2421;margin-bottom:0.3rem;">
                  ${escapeHtml(ev.title)}
                </div>
                <div style="font-size:0.82rem;color:#6b7c72;display:flex;flex-wrap:wrap;gap:0.75rem;">
                  <span>🏢 ${escapeHtml(corp)}</span>
                  <span>🏫 ${escapeHtml(school)}</span>
                </div>
              </div>

              <!-- Middle: date + tracking -->
              <div style="min-width:170px;display:flex;flex-direction:column;gap:0.35rem;">
                <div style="font-size:0.82rem;color:#444;">
                  <span style="font-weight:600;">📅</span> ${dateStr}
                </div>
                ${trackingHtml}
                ${photos > 0 ? `<span style="font-size:0.8rem;color:#2f5233;">📷 ${photos} รูป</span>` : ''}
              </div>

              <!-- Right: actions -->
              <div style="display:flex;flex-direction:column;gap:0.4rem;align-items:flex-end;flex-shrink:0;">
                <button class="btn btn-outline btn-sm" onclick="openEventModal('${ev.id}')">✏️ แก้ไข</button>
                <select data-evt-id="${ev.id}" onchange="quickUpdateEventStatus(this.dataset.evtId, this.value)"
                        style="font-size:0.78rem;padding:0.3rem 0.4rem;border:1px solid #ddd;border-radius:6px;cursor:pointer;"
                        title="เปลี่ยนสถานะ">
                  ${statusOpts}
                </select>
                <button class="btn btn-sm" style="background:#fee2e2;color:#991b1b;border:none;"
                        data-evt-id="${ev.id}" data-evt-title="${escapeHtml(ev.title)}"
                        onclick="deleteEvent(this.dataset.evtId, this.dataset.evtTitle)">🗑 ลบ</button>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');

    wrap.innerHTML = statsHtml + cards;
}

async function openEventModal(id) {
    await _ensureCorpListForEvents();

    const modal = document.getElementById('modalEvent');
    if (!modal) return;

    // Reset all fields
    document.getElementById('evtId').value = '';
    document.getElementById('evtCorpId').value = '';
    document.getElementById('evtType').value = 'delivery';
    document.getElementById('evtTitle').value = '';
    document.getElementById('evtScheduledDate').value = '';
    document.getElementById('evtStatus').value = 'pending';
    document.getElementById('evtCarrier').value = '';
    document.getElementById('evtTrackingId').value = '';
    document.getElementById('evtLocation').value = '';
    document.getElementById('evtNotes').value = '';
    document.getElementById('evtPhotoSection').style.display = 'none';
    document.getElementById('evtPhotoGrid').innerHTML = '';
    document.getElementById('evtPhotoStatus').textContent = '';
    document.getElementById('modalEventTitle').textContent = 'สร้างกิจกรรม';

    if (id) {
        const ev = _eventsCache[id];
        if (ev) {
            document.getElementById('modalEventTitle').textContent = 'แก้ไขกิจกรรม';
            document.getElementById('evtId').value = ev.id;
            document.getElementById('evtCorpId').value = ev.corporate_account_id || '';
            document.getElementById('evtType').value = ev.event_type;
            document.getElementById('evtTitle').value = ev.title;

            if (ev.scheduled_date) {
                const d = new Date(ev.scheduled_date);
                const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                document.getElementById('evtScheduledDate').value = local;
            }

            document.getElementById('evtStatus').value = ev.status;
            document.getElementById('evtCarrier').value = ev.shipping_carrier || '';
            document.getElementById('evtTrackingId').value = ev.shipping_tracking_id || '';
            document.getElementById('evtLocation').value = ev.location || '';
            document.getElementById('evtNotes').value = ev.notes || '';

            // Show photo section for existing events
            document.getElementById('evtPhotoSection').style.display = 'block';
            const photos = ev.photo_urls || [];
            document.getElementById('evtPhotoGrid').innerHTML = photos.map(url =>
                `<div style="position:relative;">
                  <img src="${escapeHtml(url)}" style="width:72px;height:72px;object-fit:cover;border-radius:7px;border:1px solid #ddd;" loading="lazy">
                </div>`
            ).join('');
        }
    }

    modal.style.display = 'flex';
}

function closeEventModal() {
    const modal = document.getElementById('modalEvent');
    if (modal) modal.style.display = 'none';
}

async function saveEvent() {
    const id       = document.getElementById('evtId').value;
    const corpId   = document.getElementById('evtCorpId').value;
    const type     = document.getElementById('evtType').value;
    const title    = document.getElementById('evtTitle').value.trim();
    const dateVal  = document.getElementById('evtScheduledDate').value;
    const status   = document.getElementById('evtStatus').value;
    const carrier  = document.getElementById('evtCarrier').value;
    const tracking = document.getElementById('evtTrackingId').value.trim();
    const location = document.getElementById('evtLocation').value.trim();
    const notes    = document.getElementById('evtNotes').value.trim();

    if (!corpId) { showNotification('กรุณาเลือกองค์กร', 'error'); return; }
    if (!title)  { showNotification('กรุณาระบุชื่อกิจกรรม', 'error'); return; }

    const payload = {
        corporate_account_id: corpId,
        event_type:           type,
        title,
        scheduled_date:       dateVal ? new Date(dateVal).toISOString() : null,
        status,
        shipping_carrier:     carrier  || null,
        shipping_tracking_id: tracking || null,
        location:             location || null,
        notes:                notes    || null,
    };

    try {
        let result;
        if (id) {
            result = await supabaseClient.from('delivery_events').update(payload).eq('id', id).select().single();
        } else {
            result = await supabaseClient.from('delivery_events').insert(payload).select().single();
        }
        if (result.error) throw result.error;

        showNotification(id ? 'อัปเดตกิจกรรมสำเร็จ' : 'สร้างกิจกรรมสำเร็จ', 'success');
        closeEventModal();
        _corpListForEvents = []; // reset corp cache so modal dropdown refreshes cleanly
        await loadEvents();
    } catch (err) {
        showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
}

async function quickUpdateEventStatus(id, newStatus) {
    try {
        const { error } = await supabaseClient
            .from('delivery_events')
            .update({ status: newStatus })
            .eq('id', id);
        if (error) throw error;
        showNotification('อัปเดตสถานะสำเร็จ', 'success');
        await loadEvents();
    } catch (err) {
        showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
}

async function deleteEvent(id, title) {
    const ok = await showConfirm('ลบกิจกรรม', `ต้องการลบ "${title}" หรือไม่?`);
    if (!ok) return;
    try {
        const { error } = await supabaseClient.from('delivery_events').delete().eq('id', id);
        if (error) throw error;
        showNotification('ลบกิจกรรมสำเร็จ', 'success');
        delete _eventsCache[id];
        await loadEvents();
    } catch (err) {
        showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
}

async function handleEventPhotoUpload(input) {
    const id = document.getElementById('evtId').value;
    if (!id) return;

    const statusEl = document.getElementById('evtPhotoStatus');
    statusEl.textContent = 'กำลังอัปโหลด...';

    const existing = (_eventsCache[id]?.photo_urls || []);
    const newUrls = [...existing];

    for (const file of Array.from(input.files)) {
        try {
            const ext  = file.name.split('.').pop();
            const path = `events/${id}/${Date.now()}.${ext}`;
            const { error: upErr } = await supabaseClient.storage
                .from('donation-photos')
                .upload(path, file, { upsert: false });
            if (upErr) throw upErr;
            const { data: urlData } = supabaseClient.storage
                .from('donation-photos')
                .getPublicUrl(path);
            newUrls.push(urlData.publicUrl);
        } catch (err) {
            showNotification('อัปโหลดรูปไม่สำเร็จ: ' + err.message, 'error');
        }
    }

    // Persist to DB
    const { error } = await supabaseClient
        .from('delivery_events')
        .update({ photo_urls: newUrls })
        .eq('id', id);

    if (error) {
        showNotification('บันทึกรูปไม่สำเร็จ', 'error');
        return;
    }

    // Update local cache and photo grid
    if (_eventsCache[id]) _eventsCache[id].photo_urls = newUrls;
    document.getElementById('evtPhotoGrid').innerHTML = newUrls.map(url =>
        `<img src="${escapeHtml(url)}" style="width:72px;height:72px;object-fit:cover;border-radius:7px;border:1px solid #ddd;" loading="lazy">`
    ).join('');
    statusEl.textContent = `อัปโหลดสำเร็จ (${newUrls.length} รูป)`;
    input.value = '';
}

// ============================================================
// SCHOOLS SECTION
// ============================================================

let _schoolsCache = {};
let _schoolsAll   = [];

async function loadSchools() {
    const wrap = document.getElementById('schoolsTableWrap');
    if (!wrap) return;
    wrap.innerHTML = '<div class="loading-state">กำลังโหลด...</div>';

    const { data, error } = await supabaseClient
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) { wrap.innerHTML = `<div class="error-state">โหลดไม่สำเร็จ: ${error.message}</div>`; return; }

    _schoolsAll = data || [];
    _schoolsAll.forEach(s => { _schoolsCache[s.id] = s; });
    renderSchoolsTable(_schoolsAll);
}

function filterSchools() {
    const q = (document.getElementById('schoolSearch')?.value || '').toLowerCase();
    const filtered = q
        ? _schoolsAll.filter(s =>
            (s.name || '').toLowerCase().includes(q) ||
            (s.email || '').toLowerCase().includes(q) ||
            (s.province || '').toLowerCase().includes(q))
        : _schoolsAll;
    renderSchoolsTable(filtered);
}

function renderSchoolsTable(rows) {
    const wrap = document.getElementById('schoolsTableWrap');
    if (!rows || rows.length === 0) {
        wrap.innerHTML = '<div class="empty-state">ยังไม่มีโรงเรียน/องค์กรในระบบ</div>';
        return;
    }
    wrap.innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th>ชื่อโรงเรียน/องค์กร</th>
        <th>อีเมล (login)</th>
        <th>จังหวัด</th>
        <th>Banner</th>
        <th>วันที่เพิ่ม</th>
        <th>การดำเนินการ</th>
      </tr></thead>
      <tbody>${rows.map(s => {
        const hasBanner = !!s.banner_url;
        const dateStr = s.created_at ? new Date(s.created_at).toLocaleDateString('th-TH') : '—';
        return `<tr>
          <td style="font-weight:600;">${escapeHtml(s.name || '—')}</td>
          <td style="font-family:monospace;font-size:0.85rem;">${escapeHtml(s.email || '—')}</td>
          <td>${escapeHtml(s.province || '—')}</td>
          <td style="text-align:center;">
            ${hasBanner
                ? `<img src="${escapeHtml(s.banner_url)}" style="width:60px;height:36px;object-fit:cover;border-radius:5px;border:1px solid #ddd;" loading="lazy">`
                : '<span style="color:#aaa;font-size:0.8rem;">ไม่มี</span>'}
          </td>
          <td style="color:#888;font-size:0.85rem;">${dateStr}</td>
          <td>
            <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
              <button class="btn btn-sm" style="background:#f0f8f0;color:#2f5233;border:1px solid #a5c6a7"
                onclick="openSchoolModal('${s.id}')">✏️ แก้ไข</button>
              <button class="btn btn-sm" style="background:#fff0f0;color:#c0392b;border:1px solid #e5a5a5"
                onclick="deleteSchool('${s.id}','${escapeHtml(s.name || '')}')">🗑️</button>
            </div>
          </td>
        </tr>`;
    }).join('')}</tbody>
    </table>
    <div style="margin-top:0.75rem;font-size:0.82rem;color:#888;">ทั้งหมด ${rows.length} รายการ</div>`;
}

function openSchoolModal(id) {
    const modal = document.getElementById('modalSchool');
    const titleEl = document.getElementById('schoolModalTitle');
    const idEl    = document.getElementById('schoolModalId');
    const noteEl  = document.getElementById('schoolEmailNote');

    if (id) {
        const s = _schoolsCache[id];
        if (!s) return;
        titleEl.textContent = 'แก้ไขโรงเรียน/องค์กร';
        idEl.value = id;
        document.getElementById('schoolName').value      = s.name      || '';
        document.getElementById('schoolEmail').value     = s.email     || '';
        document.getElementById('schoolPhone').value     = s.phone     || '';
        document.getElementById('schoolProvince').value  = s.province  || '';
        document.getElementById('schoolAddress').value   = s.address   || '';
        document.getElementById('schoolBannerUrl').value = s.banner_url|| '';
        noteEl.textContent = 'การเปลี่ยนอีเมลจะกระทบการ login ของโรงเรียนนี้';
        _previewSchoolBanner(s.banner_url);
    } else {
        titleEl.textContent = 'เพิ่มโรงเรียน/องค์กร';
        idEl.value = '';
        ['schoolName','schoolEmail','schoolPhone','schoolProvince','schoolAddress','schoolBannerUrl']
            .forEach(id => { document.getElementById(id).value = ''; });
        noteEl.textContent = '';
        _previewSchoolBanner('');
    }
    modal.style.display = 'flex';
}

function closeSchoolModal() {
    document.getElementById('modalSchool').style.display = 'none';
}

function _previewSchoolBanner(url) {
    const preview = document.getElementById('schoolBannerPreview');
    const img     = document.getElementById('schoolBannerImg');
    if (url && url.startsWith('http')) {
        img.src = url;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
}

// Live preview when typing banner URL
document.addEventListener('DOMContentLoaded', () => {
    const bannerInput = document.getElementById('schoolBannerUrl');
    if (bannerInput) {
        bannerInput.addEventListener('input', () => _previewSchoolBanner(bannerInput.value.trim()));
    }
});

async function saveSchool() {
    const id      = document.getElementById('schoolModalId').value.trim();
    const name    = document.getElementById('schoolName').value.trim();
    const email   = document.getElementById('schoolEmail').value.trim().toLowerCase();
    const phone   = document.getElementById('schoolPhone').value.trim() || null;
    const province= document.getElementById('schoolProvince').value.trim() || null;
    const address = document.getElementById('schoolAddress').value.trim() || null;
    const banner  = document.getElementById('schoolBannerUrl').value.trim() || null;

    if (!name)  { showAdminNotification('กรุณากรอกชื่อโรงเรียน/องค์กร', 'error'); return; }
    if (!email) { showAdminNotification('กรุณากรอกอีเมล', 'error'); return; }

    const payload = { name, email, phone, province, address, banner_url: banner };

    let error;
    if (id) {
        ({ error } = await supabaseClient.from('schools').update(payload).eq('id', id));
    } else {
        ({ error } = await supabaseClient.from('schools').insert(payload));
    }

    if (error) { showAdminNotification('บันทึกไม่สำเร็จ: ' + error.message, 'error'); return; }

    showAdminNotification(id ? 'อัปเดตโรงเรียนสำเร็จ' : 'เพิ่มโรงเรียนสำเร็จ', 'success');
    closeSchoolModal();
    loadSchools();
}

async function deleteSchool(id, label) {
    const ok = await showConfirm(
        'ลบโรงเรียน/องค์กร',
        `ยืนยันการลบ "${label}"? คำขอที่ผูกกับโรงเรียนนี้จะยังคงอยู่แต่ไม่มีข้อมูลโรงเรียนแนบ`
    );
    if (!ok) return;
    const { error } = await supabaseClient.from('schools').delete().eq('id', id);
    if (error) { showAdminNotification('ลบไม่สำเร็จ: ' + error.message, 'error'); return; }
    showAdminNotification('ลบโรงเรียนสำเร็จ', 'success');
    loadSchools();
}
