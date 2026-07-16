// ========================================
// GEARUP Website JavaScript
// Supabase-powered Authentication & Data
// ========================================

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// === ADDRESS CASCADE ===
/// Data format: [district, province, postcode]
// Populate province dropdowns on load
function populateProvinceSelects() {
    if (typeof THAI_ADDRESS_DB === 'undefined') return;
    const provinces = [...new Set(THAI_ADDRESS_DB.map(r => r[1]))].sort((a, b) => a.localeCompare(b, 'th'));
    ['reqProvince', 'recycleSenderProvince'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        provinces.forEach(p => {
            const o = document.createElement('option');
            o.value = p; o.textContent = p;
            sel.appendChild(o);
        });
    });
}
document.addEventListener('DOMContentLoaded', populateProvinceSelects);

// ---- Request form cascade ----
function onReqProvinceChange() {
    const province = document.getElementById('reqProvince').value;
    const districtSel = document.getElementById('reqDistrict');
    const subdistrictSel = document.getElementById('reqSubdistrict');
    const postcode = document.getElementById('reqPostcode');
    districtSel.innerHTML = '<option value="">-- เลือกอำเภอ/เขต --</option>';
    subdistrictSel.innerHTML = '<option value="">-- เลือกตำบล/แขวง --</option>';
    postcode.value = '';
    districtSel.disabled = true;
    subdistrictSel.disabled = true;
    if (!province || typeof THAI_ADDRESS_DB === 'undefined') return;
    const rows = THAI_ADDRESS_DB.filter(r => r[1] === province).sort((a, b) => a[0].localeCompare(b[0], 'th'));
    rows.forEach(r => { const o = document.createElement('option'); o.value = r[0]; o.dataset.postcode = r[2]; o.textContent = r[0]; districtSel.appendChild(o); });
    districtSel.disabled = false;
}
function onReqDistrictChange() {
    const sel = document.getElementById('reqDistrict');
    const opt = sel.options[sel.selectedIndex];
    document.getElementById('reqPostcode').value = opt?.dataset?.postcode || '';
    const subdistrictSel = document.getElementById('reqSubdistrict');
    subdistrictSel.innerHTML = '<option value="">-- เลือกตำบล/แขวง --</option>';
    subdistrictSel.disabled = true;
    const province = document.getElementById('reqProvince').value;
    const district = sel.value;
    if (!district || !province || typeof THAI_SUBDISTRICT_MAP === 'undefined') return;
    const subs = THAI_SUBDISTRICT_MAP[province]?.[district];
    if (!subs || subs.length === 0) return;
    subs.forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; subdistrictSel.appendChild(o); });
    subdistrictSel.disabled = false;
}

// ---- Recycle form cascade ----
function onRecycleProvinceChange() {
    const province = document.getElementById('recycleSenderProvince').value;
    const districtSel = document.getElementById('recycleSenderDistrict');
    const subdistrictSel = document.getElementById('recycleSenderSubdistrict');
    const postcode = document.getElementById('recycleSenderPostcode');
    districtSel.innerHTML = '<option value="">-- เลือกอำเภอ/เขต --</option>';
    subdistrictSel.innerHTML = '<option value="">-- เลือกตำบล/แขวง --</option>';
    postcode.value = '';
    districtSel.disabled = true;
    subdistrictSel.disabled = true;
    if (!province || typeof THAI_ADDRESS_DB === 'undefined') return;
    const rows = THAI_ADDRESS_DB.filter(r => r[1] === province).sort((a, b) => a[0].localeCompare(b[0], 'th'));
    rows.forEach(r => { const o = document.createElement('option'); o.value = r[0]; o.dataset.postcode = r[2]; o.textContent = r[0]; districtSel.appendChild(o); });
    districtSel.disabled = false;
}
function onRecycleDistrictChange() {
    const sel = document.getElementById('recycleSenderDistrict');
    const opt = sel.options[sel.selectedIndex];
    document.getElementById('recycleSenderPostcode').value = opt?.dataset?.postcode || '';
    const subdistrictSel = document.getElementById('recycleSenderSubdistrict');
    subdistrictSel.innerHTML = '<option value="">-- เลือกตำบล/แขวง --</option>';
    subdistrictSel.disabled = true;
    const province = document.getElementById('recycleSenderProvince').value;
    const district = sel.value;
    if (!district || !province || typeof THAI_SUBDISTRICT_MAP === 'undefined') return;
    const subs = THAI_SUBDISTRICT_MAP[province]?.[district];
    if (!subs || subs.length === 0) return;
    subs.forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; subdistrictSel.appendChild(o); });
    subdistrictSel.disabled = false;
}

function onProvinceChange() {
    const province = document.getElementById('donorProvince').value;
    const districtSel = document.getElementById('donorDistrict');
    const subdistrictSel = document.getElementById('donorSubdistrict');
    const postcodeIn = document.getElementById('donorPostcode');
    districtSel.innerHTML = '<option value="">-- เลือกอำเภอ/เขต --</option>';
    subdistrictSel.innerHTML = '<option value="">-- เลือกตำบล/แขวง --</option>';
    postcodeIn.value = '';
    districtSel.disabled = true;
    subdistrictSel.disabled = true;
    if (!province || typeof THAI_ADDRESS_DB === 'undefined') return;
    const rows = THAI_ADDRESS_DB.filter(r => r[1] === province).sort((a,b) => a[0].localeCompare(b[0],'th'));
    rows.forEach(r => { const o = document.createElement('option'); o.value = r[0]; o.dataset.postcode = r[2]; o.textContent = r[0]; districtSel.appendChild(o); });
    districtSel.disabled = false;
}
function onDonorTypeChange() {
    const type  = document.getElementById('donorType')?.value || '';
    const isOrg = type === 'บริษัท/องค์กร';
    const group = document.getElementById('donorOrgNameGroup');
    const input = document.getElementById('donorOrgName');
    if (!group) return;
    if (isOrg) {
        group.style.display = '';
        if (input) input.disabled = false;
    } else {
        group.style.display = 'none';
        if (input) { input.disabled = true; input.value = ''; }
    }
}

function onDistrictChange() {
    const sel = document.getElementById('donorDistrict');
    const opt = sel.options[sel.selectedIndex];
    document.getElementById('donorPostcode').value = opt?.dataset?.postcode || '';
    const subdistrictSel = document.getElementById('donorSubdistrict');
    subdistrictSel.innerHTML = '<option value="">-- เลือกตำบล/แขวง --</option>';
    subdistrictSel.disabled = true;
    const province = document.getElementById('donorProvince').value;
    const district = sel.value;
    if (!district || !province || typeof THAI_SUBDISTRICT_MAP === 'undefined') return;
    const subs = THAI_SUBDISTRICT_MAP[province]?.[district];
    if (!subs || subs.length === 0) return;
    subs.forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; subdistrictSel.appendChild(o); });
    subdistrictSel.disabled = false;
}

// === SUPABASE INITIALIZATION ===
const SUPABASE_URL = 'https://wavhxkawlzeyhtthffhs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhdmh4a2F3bHpleWh0dGhmZmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNzU3NTEsImV4cCI6MjA4NjY1MTc1MX0.NERS8pASDTG2UkgMylMLDPSu6NkNFIec_FAYD6LtTtU';
let supabaseClient = null;
try {
    // noopLock only on file:// protocol where navigator.locks is unavailable.
    // On HTTPS (Vercel) we let Supabase use the real lock to prevent auth race conditions.
    const authOptions = { detectSessionInUrl: false, persistSession: true, autoRefreshToken: true };
    if (location.protocol === 'file:') {
        authOptions.lock = async (name, acquireConfig, fn) => fn();
    }
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: authOptions });
} catch (e) {
    console.warn('Supabase CDN not loaded, running in offline mode:', e.message);
}

// === GLOBAL STATE ===
let currentUser = null;
let donations = JSON.parse(localStorage.getItem('gearup_donations')) || [];
let requests = JSON.parse(localStorage.getItem('gearup_requests')) || [];
let selectedRecipientRequestId = null;
let selectedRecipientPost = null;

// Carbon emission factors (kgCO2e per kg of device)
const CARBON_FACTORS = {
    'Computer': 30,
    'Laptop': 125,
    'Tablet': 250,
    'Phone': 300
};

// Spec options per device type for the request form
const REQ_BRANDS = {
    'โทรศัพท์มือถือ': {
        android: ['ไม่จำกัดยี่ห้อ', 'Samsung', 'Xiaomi / Redmi', 'OPPO', 'Vivo', 'Realme', 'Huawei', 'OnePlus', 'Google Pixel'],
        ios:     ['Apple (iPhone)'],
    },
    'แท็บเล็ต': {
        android: ['ไม่จำกัดยี่ห้อ', 'Samsung', 'Xiaomi', 'Lenovo', 'Huawei', 'OPPO'],
        ios:     ['Apple (iPad)'],
    },
};

const REQ_OS_VERSIONS = {
    android: [
        { value: 'any',        label: 'ไม่จำกัดเวอร์ชั่น' },
        { value: 'android10',  label: 'Android 10 ขึ้นไป' },
        { value: 'android11',  label: 'Android 11 ขึ้นไป' },
        { value: 'android12',  label: 'Android 12 ขึ้นไป' },
        { value: 'android13',  label: 'Android 13 ขึ้นไป' },
        { value: 'android14',  label: 'Android 14 ขึ้นไป' },
        { value: 'android15',  label: 'Android 15 ขึ้นไป (ล่าสุด)' },
    ],
    ios: [
        { value: 'any',    label: 'ไม่จำกัดเวอร์ชั่น' },
        { value: 'ios15',  label: 'iOS 15 ขึ้นไป  (iPhone 6s+)' },
        { value: 'ios16',  label: 'iOS 16 ขึ้นไป  (iPhone 8+)' },
        { value: 'ios17',  label: 'iOS 17 ขึ้นไป  (iPhone XS+)' },
        { value: 'ios18',  label: 'iOS 18 ขึ้นไป  (iPhone XS+) · ล่าสุด' },
    ],
    ipados: [
        { value: 'any',       label: 'ไม่จำกัดเวอร์ชั่น' },
        { value: 'ipados15',  label: 'iPadOS 15 ขึ้นไป  (iPad Air 2+, iPad mini 4+)' },
        { value: 'ipados16',  label: 'iPadOS 16 ขึ้นไป  (iPad Air 3+, iPad mini 5+)' },
        { value: 'ipados17',  label: 'iPadOS 17 ขึ้นไป  (iPad Air 3+, iPad mini 5+)' },
        { value: 'ipados18',  label: 'iPadOS 18 ขึ้นไป  (iPad Air 3+, iPad mini 5+) · ล่าสุด' },
    ],
};

const REQ_DEVICE_SPECS = {
    'คอมพิวเตอร์': [
        { value: 'basic', label: 'พื้นฐาน (Intel Core i3 / AMD A6+, RAM 4GB+)' },
        { value: 'standard', label: 'มาตรฐาน (Intel Core i5 / AMD Ryzen 5, RAM 8GB+)' },
        { value: 'high', label: 'สูง (Intel Core i7 / AMD Ryzen 7+, RAM 16GB+)' },
        { value: 'any', label: 'ยอมรับทุกสเปก' },
    ],
    'แล็ปท็อป': [
        { value: 'basic', label: 'พื้นฐาน (Core i3 / Ryzen 3, RAM 4GB+, SSD/HDD)' },
        { value: 'standard', label: 'มาตรฐาน (Core i5 / Ryzen 5, RAM 8GB+, SSD)' },
        { value: 'high', label: 'สูง (Core i7 / Ryzen 7+, RAM 16GB+, SSD)' },
        { value: 'any', label: 'ยอมรับทุกสเปก' },
    ],
    'แท็บเล็ต': [
        { value: 'basic', label: 'พื้นฐาน (32GB, RAM 2GB+)' },
        { value: 'standard', label: 'มาตรฐาน (64GB, RAM 3GB+)' },
        { value: 'high', label: 'สูง (128GB+, RAM 4GB+)' },
        { value: 'any', label: 'ยอมรับทุกสเปก' },
    ],
    'โทรศัพท์มือถือ': [
        { value: 'basic', label: 'พื้นฐาน (32GB, RAM 2GB+)' },
        { value: 'standard', label: 'มาตรฐาน (64GB, RAM 3GB+)' },
        { value: 'high', label: 'สูง (128GB+, RAM 4GB+)' },
        { value: 'any', label: 'ยอมรับทุกสเปก' },
    ],
};

const REQ_SPEC_HINTS = {
    'คอมพิวเตอร์': {
        basic:    'เหมาะกับ: งานเอกสาร Word/Excel, อินเตอร์เน็ต, ดูวิดีโอ YouTube',
        standard: 'เหมาะกับ: ออกแบบกราฟิกเบื้องต้น, เขียนโปรแกรม, ประมวลผลข้อมูล Excel ขนาดใหญ่',
        high:     'เหมาะกับ: ตัดต่อวิดีโอ, 3D Modeling, Data Science / Machine Learning',
        any:      'ยินดีรับทุกสเปก — ทีม GEARUP จะจัดสรรตามที่มีให้',
    },
    'แล็ปท็อป': {
        basic:    'เหมาะกับ: งานเอกสาร Word/Excel, อินเตอร์เน็ต, ดูวิดีโอ YouTube',
        standard: 'เหมาะกับ: ออกแบบกราฟิกเบื้องต้น, เขียนโปรแกรม, ประมวลผลข้อมูล Excel ขนาดใหญ่',
        high:     'เหมาะกับ: ตัดต่อวิดีโอ, 3D Modeling, Data Science / Machine Learning',
        any:      'ยินดีรับทุกสเปก — ทีม GEARUP จะจัดสรรตามที่มีให้',
    },
    'แท็บเล็ต': {
        basic:    'เหมาะกับ: e-Learning, อ่านหนังสือ, แอปสื่อการสอนพื้นฐาน',
        standard: 'เหมาะกับ: แอปการศึกษาทั่วไป, วิดีโอคอล, ถ่ายรูปบันทึกงาน',
        high:     'เหมาะกับ: สร้างสื่อการสอน, บันทึกวิดีโอ, แอปที่ต้องประมวลผลสูง',
        any:      'ยินดีรับทุกสเปก — ทีม GEARUP จะจัดสรรตามที่มีให้',
    },
    'โทรศัพท์มือถือ': {
        basic:    'เหมาะกับ: สื่อสาร, e-Learning, แอปการศึกษาพื้นฐาน',
        standard: 'เหมาะกับ: แอปการศึกษา, วิดีโอคอล, บันทึกงาน',
        high:     'เหมาะกับ: สร้างสื่อการสอน, บันทึกวิดีโอ HD, แอปพิเศษ',
        any:      'ยินดีรับทุกสเปก — ทีม GEARUP จะจัดสรรตามที่มีให้',
    },
};

// === TRACKING ID GENERATION ===
// Format: GU-{PREFIX}-DDMMYYYY-NNN  (NNN = daily sequence starting at 001)
const TABLE_FOR_PREFIX = { DON: 'donations', REQ: 'requests', RCY: 'recycling_redirects' };

async function generateTrackingId(prefix) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${dd}${mm}${yyyy}`;

    let seq = 1;
    try {
        if (supabaseClient) {
            const table = TABLE_FOR_PREFIX[prefix];
            // Query max existing sequence for today to avoid duplicates (count+1 can repeat if records exist)
            const { data } = await supabaseClient
                .from(table)
                .select('tracking_id')
                .like('tracking_id', `GU-${prefix}-${dateStr}-%`)
                .order('tracking_id', { ascending: false })
                .limit(1);
            if (data && data.length > 0) {
                const parts = data[0].tracking_id.split('-');
                const lastSeq = parseInt(parts[parts.length - 1]) || 0;
                seq = lastSeq + 1;
            }
        }
    } catch (_) { /* fallback to seq=1 */ }

    return `GU-${prefix}-${dateStr}-${String(seq).padStart(3, '0')}`;
}

// No-op kept for compatibility (IDs no longer contain '/')
function trackingIdToPath(trackingId) { return trackingId; }

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initializeNavigation();
    initializeModals();
    initializeImpactCounter();
    loadImpactStats();
    subscribeImpactRealtime();
    initializeSliders();
    initializeDeviceSelector();
    initializeForms();
    checkLoginStatus();
    loadRequestPosts();
});

function initializeApp() {
    console.log('GEARUP Website Initialized');
    // Smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            e.preventDefault();
            try {
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            } catch (err) {
                // Invalid selector, ignore
            }
        });
    });
}

// === KNOWLEDGE FILTER ===
function kbFilter(btn, cat) {
    document.querySelectorAll('.kb-tab').forEach(t => t.classList.remove('kb-tab-active'));
    btn.classList.add('kb-tab-active');
    document.querySelectorAll('.kb-item').forEach(el => {
        el.style.display = (cat === 'all' || el.dataset.cat === cat) ? '' : 'none';
    });
}

// === NAVIGATION ===
function initializeNavigation() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        _updateStickyLabel();
    }, { passive: true });

    // Overlay backdrop for mobile menu
    const navOverlay = document.createElement('div');
    navOverlay.id = 'navOverlay';
    navOverlay.className = 'nav-overlay';
    document.body.appendChild(navOverlay);

    function closeNavMenu() {
        navMenu.classList.remove('active');
        navOverlay.classList.remove('active');
        const spans = hamburger.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '1';
        spans[2].style.transform = '';
    }

    function openNavMenu() {
        navMenu.classList.add('active');
        navOverlay.classList.add('active');
        const spans = hamburger.querySelectorAll('span');
        spans[0].style.transform = 'rotate(45deg) translate(8px, 8px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(8px, -8px)';
    }

    // Hamburger menu
    hamburger?.addEventListener('click', () => {
        navMenu.classList.contains('active') ? closeNavMenu() : openNavMenu();
    });

    // Close on overlay click
    navOverlay.addEventListener('click', closeNavMenu);

    // Navigation link clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const page = link.getAttribute('data-page');
            if (page) {
                e.preventDefault();
                navigateToPage(page);
                closeNavMenu();
            } else if (link.getAttribute('href') === '#') {
                e.preventDefault();
            }
        });
    });

    // Mobile dropdown toggle (tap to expand accordion)
    document.querySelectorAll('.nav-menu .dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024) {
                e.preventDefault();
                e.stopPropagation();
                const dropdown = toggle.closest('.dropdown');
                dropdown.classList.toggle('open');
            }
        });
    });

    // Dropdown links
    document.querySelectorAll('.dropdown-content a').forEach(link => {
        link.addEventListener('click', (e) => {
            const page = link.getAttribute('data-page');
            if (page) {
                e.preventDefault();
                navigateToPage(page);
                closeNavMenu();
                // close accordion too
                document.querySelectorAll('.nav-menu .dropdown').forEach(d => d.classList.remove('open'));
            }
        });
    });
}

function navigateToPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById(pageName);
    if (targetPage) {
        targetPage.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageName) {
                link.classList.add('active');
            }
        });
    }

    if (pageName === 'profile') loadProfilePage();
    if (pageName === 'request') updateFormStepBar('req', 1);

    // Reset sticky labels when navigating to a page
    const donateBar = document.getElementById('donateStepBar');
    const reqBar    = document.getElementById('reqStepBar');
    if (donateBar) donateBar.classList.remove('psl-visible');
    if (reqBar)    reqBar.classList.remove('psl-visible');
}

function _updateStickyLabel() {
    // Donate sticky bar — show after section heading scrolls off the top
    const donateBar = document.getElementById('donateStepBar');
    if (donateBar) {
        const formView = document.getElementById('donateFormView');
        const h2 = document.querySelector('#donateFormView .section-title');
        const formVisible = formView && formView.style.display !== 'none';
        const show = formVisible && h2 && h2.getBoundingClientRect().bottom < 0;
        donateBar.classList.toggle('psl-visible', !!show);
    }

    // Request sticky bar — show after section heading scrolls off the top
    const reqBar = document.getElementById('reqStepBar');
    if (reqBar) {
        const reqPage = document.getElementById('request');
        const h2 = document.querySelector('#request .section-title');
        const pageActive = reqPage && reqPage.classList.contains('active');
        const show = pageActive && h2 && h2.getBoundingClientRect().bottom < 0;
        reqBar.classList.toggle('psl-visible', !!show);
    }
}

// === MODALS ===
function initializeModals() {
    const btnLogin = document.getElementById('btnLogin');
    const btnRegister = document.getElementById('btnRegister');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const closeBtns = document.querySelectorAll('.modal-close');

    // Open modals
    btnLogin?.addEventListener('click', () => {
        if (currentUser) {
            logoutUser();
        } else {
            loginModal.classList.add('active');
        }
    });

    btnRegister?.addEventListener('click', () => {
        if (currentUser) {
            showUserProfile();
        } else {
            registerModal.classList.add('active');
        }
    });

    // Close modals
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            loginModal.classList.remove('active');
            registerModal.classList.remove('active');
        });
    });

    // Close on outside click
    [loginModal, registerModal].forEach(modal => {
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Password toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId) || btn.previousElementSibling;

            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                    btn.textContent = '🙈';
                } else {
                    input.type = 'password';
                    btn.textContent = '👁️';
                }
            }
        });
    });

    // Social login buttons
    document.querySelectorAll('.btn-social').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const provider = btn.getAttribute('data-provider');
            if (provider) {
                handleSocialLogin(provider.charAt(0).toUpperCase() + provider.slice(1));
            }
        });
    });
}

// === AUTHENTICATION ===
function initializeForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Login form submission
    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateLoginForm()) {
            handleLogin();
        }
    });

    // Register form submission
    registerForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateRegisterForm()) {
            handleRegister();
        }
    });

    // Real-time validation
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const regName = document.getElementById('regName');
    const regEmail = document.getElementById('regEmail');
    const regPassword = document.getElementById('regPassword');
    const regConfirmPassword = document.getElementById('regConfirmPassword');
    const regPhone = document.getElementById('regPhone');

    loginEmail?.addEventListener('blur', () => validateEmail(loginEmail, 'loginEmailError'));
    loginPassword?.addEventListener('blur', () => validatePassword(loginPassword, 'loginPasswordError'));
    regName?.addEventListener('blur', () => validateName());
    regEmail?.addEventListener('blur', () => validateEmail(regEmail, 'regEmailError'));
    regPassword?.addEventListener('blur', () => validateRegPassword());
    regConfirmPassword?.addEventListener('blur', () => validateConfirmPassword());
    regPhone?.addEventListener('blur', () => validatePhone());

    // Switch between login and register
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');

    switchToRegister?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginModal').classList.remove('active');
        document.getElementById('registerModal').classList.add('active');
    });

    switchToLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('registerModal').classList.remove('active');
        document.getElementById('loginModal').classList.add('active');
    });

    // Forgot password
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    forgotPasswordLink?.addEventListener('click', (e) => {
        e.preventDefault();
        handleForgotPassword();
    });
}

// === VALIDATION FUNCTIONS ===
function validateLoginForm() {
    const emailValid = validateEmail(document.getElementById('loginEmail'), 'loginEmailError');
    const passwordValid = validatePassword(document.getElementById('loginPassword'), 'loginPasswordError');
    return emailValid && passwordValid;
}

function validateRegisterForm() {
    const nameValid = validateName();
    const emailValid = validateEmail(document.getElementById('regEmail'), 'regEmailError');
    const passwordValid = validateRegPassword();
    const confirmPasswordValid = validateConfirmPassword();
    const phoneValid = validatePhone();
    const termsValid = validateTerms();

    return nameValid && emailValid && passwordValid && confirmPasswordValid && phoneValid && termsValid;
}

function validateEmail(input, errorId) {
    const error = document.getElementById(errorId);
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email === '') {
        showError(input, error, 'กรุณากรอกอีเมล');
        return false;
    } else if (!emailRegex.test(email)) {
        showError(input, error, 'กรุณากรอกอีเมลที่ถูกต้อง');
        return false;
    } else {
        showSuccess(input, error);
        return true;
    }
}

function validatePassword(input, errorId) {
    const error = document.getElementById(errorId);
    const password = input.value;

    if (password === '') {
        showError(input, error, 'กรุณากรอกรหัสผ่าน');
        return false;
    } else if (password.length < 6) {
        showError(input, error, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        return false;
    } else {
        showSuccess(input, error);
        return true;
    }
}

function validateName() {
    const input = document.getElementById('regName');
    const error = document.getElementById('regNameError');
    const name = input.value.trim();

    if (name === '') {
        showError(input, error, 'Name is required');
        return false;
    } else if (name.length < 3) {
        showError(input, error, 'Name must be at least 3 characters');
        return false;
    } else {
        showSuccess(input, error);
        return true;
    }
}

function validateRegPassword() {
    const input = document.getElementById('regPassword');
    const error = document.getElementById('regPasswordError');
    const password = input.value;

    if (password === '') {
        showError(input, error, 'กรุณากรอกรหัสผ่าน');
        return false;
    } else if (password.length < 6) {
        showError(input, error, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        return false;
    } else if (!/(?=.*[a-z])/.test(password)) {
        showError(input, error, 'รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว');
        return false;
    } else if (!/(?=.*[A-Z])/.test(password)) {
        showError(input, error, 'รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว');
        return false;
    } else if (!/(?=.*\d)/.test(password)) {
        showError(input, error, 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว');
        return false;
    } else {
        showSuccess(input, error);
        return true;
    }
}

function validateConfirmPassword() {
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword');
    const error = document.getElementById('regConfirmPasswordError');

    if (confirmPassword.value === '') {
        showError(confirmPassword, error, 'กรุณายืนยันรหัสผ่าน');
        return false;
    } else if (confirmPassword.value !== password) {
        showError(confirmPassword, error, 'รหัสผ่านไม่ตรงกัน');
        return false;
    } else {
        showSuccess(confirmPassword, error);
        return true;
    }
}

// --- Shared phone / ID validation helpers ---

function checkPhoneVal(val) {
    if (!val) return '';
    if (!/^0\d{9}$/.test(val.replace(/[-\s]/g,''))) return 'กรุณากรอกเบอร์โทร 10 หลัก ขึ้นต้นด้วย 0';
    return '';
}

function checkIdVal(val, digits = 13) {
    if (!val) return '';
    const cleaned = val.replace(/[-\s]/g, '');
    if (!/^\d*$/.test(cleaned)) return 'กรอกได้เฉพาะตัวเลขเท่านั้น';
    if (cleaned.length < digits) return `กรอกยังไม่ครบ ${digits} หลัก (ปัจจุบัน ${cleaned.length} หลัก)`;
    if (digits === 13) {
        if (cleaned[0] === '0') return 'เลขบัตรประชาชนไม่ถูกต้อง';
        const sum = Array.from(cleaned.slice(0, 12)).reduce((acc, d, i) => acc + parseInt(d) * (13 - i), 0);
        const check = (11 - (sum % 11)) % 10;
        if (parseInt(cleaned[12]) !== check) return 'เลขบัตรประชาชนไม่ถูกต้อง (ตัวเลขไม่ผ่านการตรวจสอบ)';
    }
    return '';
}

function updateFormStepBar(type, currentStep) {
    const bar = document.getElementById(type === 'donate' ? 'donateStepBar' : 'reqStepBar');
    if (!bar) return;
    const attr = type === 'donate' ? 'data-donate-step' : 'data-req-step';
    bar.querySelectorAll('.fss-step').forEach(el => {
        const s = parseInt(el.getAttribute(attr));
        el.classList.remove('active', 'done');
        if (s === currentStep) el.classList.add('active');
        else if (s < currentStep) el.classList.add('done');
    });
}

function applyFieldHint(hintId, msg) {
    const el = document.getElementById(hintId);
    if (!el) return;
    el.textContent = msg;
    el.className = 'field-hint' + (msg ? ' field-hint--error' : '');
}

function validatePhone() {
    const input = document.getElementById('regPhone');
    const error = document.getElementById('regPhoneError');
    const phone = input.value.trim();

    if (phone === '') {
        showError(input, error, 'กรุณากรอกเบอร์โทรศัพท์');
        return false;
    } else if (phone[0] !== '0') {
        showError(input, error, 'เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0');
        return false;
    } else if (!/^[0-9]{9,10}$/.test(phone)) {
        showError(input, error, 'กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (9-10 หลัก)');
        return false;
    } else {
        showSuccess(input, error);
        return true;
    }
}

function validateTerms() {
    const checkbox = document.getElementById('agreeTerms');
    const error = document.getElementById('agreeTermsError');

    if (!checkbox.checked) {
        error.textContent = 'คุณต้องยอมรับข้อตกลงและเงื่อนไข';
        return false;
    } else {
        error.textContent = '';
        return true;
    }
}

function showError(input, errorElement, message) {
    input.parentElement.classList.add('error');
    input.parentElement.classList.remove('success');
    errorElement.textContent = message;
}

function showSuccess(input, errorElement) {
    input.parentElement.classList.remove('error');
    input.parentElement.classList.add('success');
    errorElement.textContent = '';
}

// === LOGIN HANDLER ===
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    const _loginBtn = document.getElementById('btnLogin');
    if (_loginBtn) _loginBtn.disabled = true;
    try {
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            showNotification(authError.message || 'เข้าสู่ระบบไม่สำเร็จ', 'error');
            return;
        }

        // Fetch user profile from public.users table
        const { data: profile, error: profileError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
        }

        currentUser = {
            id: authData.user.id,
            name: profile?.name || authData.user.email.split('@')[0],
            email: authData.user.email,
            role: profile?.role || 'user',
            phone: profile?.phone || ''
        };

        if (rememberMe) {
            localStorage.setItem('gearup_remember', 'true');
        }
        localStorage.setItem('gearup_current_user', JSON.stringify(currentUser));

        updateUIForLoggedInUser();
        document.getElementById('loginModal').classList.remove('active');
        showNotification(`ยินดีต้อนรับกลับ, ${currentUser.name}!`, 'success');
        document.getElementById('loginForm').reset();
        clearFormErrors('loginForm');
    } catch (error) {
        console.error('Login error:', error);
        showNotification('เกิดข้อผิดพลาดในการเข้าสู่ระบบ', 'error');
    } finally {
        if (_loginBtn) _loginBtn.disabled = false;
    }
}

// === REGISTER HANDLER ===
async function handleRegister() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const phone = document.getElementById('regPhone').value.trim();

    const _registerBtn = document.getElementById('btnRegister');
    if (_registerBtn) _registerBtn.disabled = true;
    try {
        // Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { name, phone }
            }
        });

        if (authError) {
            showNotification(authError.message || 'สมัครสมาชิกไม่สำเร็จ', 'error');
            return;
        }

        // Profile is auto-created by database trigger (handle_new_user)
        // No manual INSERT needed

        currentUser = {
            id: authData.user.id,
            name,
            email: email.toLowerCase(),
            role: 'user',
            phone
        };

        localStorage.setItem('gearup_current_user', JSON.stringify(currentUser));
        updateUIForLoggedInUser();
        document.getElementById('registerModal').classList.remove('active');
        showNotification(`ยินดีต้อนรับสู่ GEARUP, ${name}! สร้างบัญชีสำเร็จแล้ว`, 'success');
        document.getElementById('registerForm').reset();
        clearFormErrors('registerForm');
    } catch (error) {
        console.error('Register error:', error);
        showNotification('เกิดข้อผิดพลาดในการสมัครสมาชิก', 'error');
    } finally {
        if (_registerBtn) _registerBtn.disabled = false;
    }
}

// === SOCIAL LOGIN ===
async function handleSocialLogin(provider) {
    const providerMap = {
        'Google': 'google',
        'Facebook': 'facebook',
        'Apple': 'apple'
    };

    const supabaseProvider = providerMap[provider] || provider.toLowerCase();

    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: supabaseProvider,
        options: {
            redirectTo: window.location.origin
        }
    });

    if (error) {
        showNotification(`เข้าสู่ระบบด้วย ${provider} ไม่สำเร็จ: ${error.message}`, 'error');
    }
    // OAuth will redirect — user session handled by onAuthStateChange
}

// === FORGOT PASSWORD ===
async function handleForgotPassword() {
    const email = prompt('กรุณากรอกอีเมลที่ลงทะเบียนไว้:');

    if (!email) return;

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
    });

    if (error) {
        showNotification('เกิดข้อผิดพลาด: ' + error.message, 'error');
    } else {
        showNotification(`ลิงก์รีเซ็ตรหัสผ่านถูกส่งไปที่ ${email} แล้ว กรุณาตรวจสอบกล่องข้อความ`, 'success');
    }
}

// === UTILITY FUNCTIONS ===
function generateAvatar(name) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#2f5233', '#8b7355', '#d4a574', '#6b7c72', '#1a2421'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    return {
        initials,
        color
    };
}

function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.querySelectorAll('.error-message').forEach(error => {
        error.textContent = '';
    });

    form.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error', 'success');
    });
}

async function checkLoginStatus() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (session) {
            // Fetch profile from public.users
            const { data: profile } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

            currentUser = {
                id: session.user.id,
                name: profile?.name || session.user.email.split('@')[0],
                email: session.user.email,
                role: profile?.role || 'user',
                phone: profile?.phone || ''
            };

            localStorage.setItem('gearup_current_user', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
        } else {
            // Check localStorage fallback
            const savedUser = localStorage.getItem('gearup_current_user');
            if (savedUser) {
                currentUser = JSON.parse(savedUser);
                updateUIForLoggedInUser();
            }
        }
    } catch (error) {
        console.error('Session check error:', error);
        // Fallback to localStorage
        const savedUser = localStorage.getItem('gearup_current_user');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            updateUIForLoggedInUser();
        }
    }

    // Listen for auth state changes (e.g., OAuth redirect)
    supabaseClient?.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            const { data: profile } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

            // Profile is auto-created by database trigger (handle_new_user)

            currentUser = {
                id: session.user.id,
                name: profile?.name || session.user.user_metadata?.name || session.user.email.split('@')[0],
                email: session.user.email,
                role: profile?.role || 'user',
                phone: profile?.phone || ''
            };

            localStorage.setItem('gearup_current_user', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
            document.getElementById('loginModal')?.classList.remove('active');
            document.getElementById('registerModal')?.classList.remove('active');
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            localStorage.removeItem('gearup_current_user');
        }
    });
}

function updateUIForLoggedInUser() {
    const btnLogin = document.getElementById('btnLogin');
    const btnRegister = document.getElementById('btnRegister');

    if (currentUser) {
        btnLogin.textContent = 'ออกจากระบบ';
        btnRegister.textContent = currentUser.name.split(' ')[0];
        btnRegister.style.background = 'var(--accent)';
        const banner = document.getElementById('reqLoginBanner');
        if (banner) banner.style.display = 'none';
    }

}

async function logoutUser() {
    if (supabaseClient) await supabaseClient.auth.signOut();

    currentUser = null;
    localStorage.removeItem('gearup_current_user');
    localStorage.removeItem('gearup_remember');
    sessionStorage.removeItem('gearup_current_user');

    const btnLogin = document.getElementById('btnLogin');
    const btnRegister = document.getElementById('btnRegister');

    btnLogin.textContent = 'เข้าสู่ระบบ';
    btnRegister.textContent = 'สมัครสมาชิก';
    btnRegister.style.background = '';

    showNotification('ออกจากระบบสำเร็จ', 'success');
    navigateToPage('home');
}

function showUserProfile() {
    navigateToPage('profile');
}

// === IMPACT COUNTER ===
function animateCounterTo(element, target) {
    const start = parseInt(element.textContent.replace(/,/g, '')) || 0;
    if (start === target) return;
    const duration = 1200;
    const steps = 60;
    const increment = (target - start) / steps;
    let current = start;
    let step = 0;
    const timer = setInterval(() => {
        step++;
        current += increment;
        if (step >= steps) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, duration / steps);
}

function initializeImpactCounter() {
    const counters = document.querySelectorAll('.impact-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.textContent === '0') {
                const target = parseInt(entry.target.getAttribute('data-count'));
                if (target > 0) animateCounterTo(entry.target, target);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(counter => observer.observe(counter));
}

async function loadImpactStats() {
    if (!supabaseClient) return;
    try {
        // ดึงจาก donation_items — ทุก submission ที่เข้ามา (ไม่รอ admin)
        const { data, error } = await supabaseClient
            .from('donation_items')
            .select('carbon_saved, device_weight');
        if (error) throw error;

        let totalCarbon = 0, totalWeight = 0, totalItems = 0;
        if (data) {
            data.forEach(row => {
                totalCarbon += parseFloat(row.carbon_saved) || 0;
                totalWeight += parseFloat(row.device_weight) || 0;
                totalItems++;
            });
        }

        totalWeight = Math.round(totalWeight);
        totalCarbon = Math.round(totalCarbon);

        const wEl = document.getElementById('impactWeight');
        const cEl = document.getElementById('impactCarbon');
        const iEl = document.getElementById('impactItems');
        if (wEl) { wEl.setAttribute('data-count', totalWeight); animateCounterTo(wEl, totalWeight); }
        if (cEl) { cEl.setAttribute('data-count', totalCarbon); animateCounterTo(cEl, totalCarbon); }
        if (iEl) { iEl.setAttribute('data-count', totalItems); animateCounterTo(iEl, totalItems); }
    } catch(e) {
        console.error('loadImpactStats error:', e);
    }
}

function subscribeImpactRealtime() {
    if (!supabaseClient) return;
    // Remove previous channel before creating a new one (safe to call on restore)
    if (_impactChannel) {
        supabaseClient.removeChannel(_impactChannel);
        _impactChannel = null;
    }
    _impactChannel = supabaseClient.channel('impact-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'donation_items' }, () => loadImpactStats())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => loadImpactStats());
    _impactChannel.subscribe();
}

// === SLIDERS ===
function initializeSliders() {
    const reportsTrack = document.getElementById('reportsTrack');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (!reportsTrack) return;

    let scrollAmount = 0;
    const cardWidth = 370; // card width + gap

    prevBtn?.addEventListener('click', () => {
        scrollAmount = Math.max(0, scrollAmount - cardWidth);
        reportsTrack.scrollTo({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });

    nextBtn?.addEventListener('click', () => {
        const maxScroll = reportsTrack.scrollWidth - reportsTrack.clientWidth;
        scrollAmount = Math.min(maxScroll, scrollAmount + cardWidth);
        reportsTrack.scrollTo({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });
}

// === DEVICE DATABASE (Brand / Model / Average Weight) ===
const DEVICE_DATABASE = {
    Computer: {
        'Dell': [
            { model: 'OptiPlex 3000', weight: 5.4 },
            { model: 'OptiPlex 5000', weight: 5.6 },
            { model: 'OptiPlex 7000', weight: 6.0 },
            { model: 'Inspiron Desktop', weight: 7.0 },
            { model: 'Vostro Desktop', weight: 6.5 },
            { model: 'XPS Desktop', weight: 8.5 }
        ],
        'HP': [
            { model: 'ProDesk 400 G9', weight: 5.3 },
            { model: 'ProDesk 600 G6', weight: 5.8 },
            { model: 'EliteDesk 800 G9', weight: 6.2 },
            { model: 'Pavilion Desktop', weight: 7.5 },
            { model: 'Z2 Tower G9', weight: 9.5 }
        ],
        'Lenovo': [
            { model: 'ThinkCentre M70q', weight: 1.3 },
            { model: 'ThinkCentre M90q', weight: 1.4 },
            { model: 'ThinkCentre M70t', weight: 5.2 },
            { model: 'IdeaCentre 3', weight: 5.5 },
            { model: 'IdeaCentre 5i', weight: 6.8 }
        ],
        'Acer': [
            { model: 'Veriton S2690G', weight: 5.0 },
            { model: 'Veriton N4690GT', weight: 1.2 },
            { model: 'Aspire TC', weight: 6.5 },
            { model: 'Predator Orion 3000', weight: 10.0 }
        ],
        'Apple': [
            { model: 'iMac 24" M1', weight: 4.5 },
            { model: 'iMac 24" M3', weight: 4.5 },
            { model: 'Mac Mini M2', weight: 1.2 },
            { model: 'Mac Mini M4', weight: 1.2 },
            { model: 'Mac Studio M2', weight: 2.7 },
            { model: 'Mac Pro', weight: 17.5 }
        ],
        'ASUS': [
            { model: 'ExpertCenter D5', weight: 6.0 },
            { model: 'ExpertCenter D7', weight: 7.5 },
            { model: 'ROG Strix G10', weight: 9.0 }
        ]
    },
    Laptop: {
        'Dell': [
            { model: 'XPS 13', weight: 1.2 },
            { model: 'XPS 15', weight: 1.9 },
            { model: 'XPS 17', weight: 2.4 },
            { model: 'Latitude 3420', weight: 1.5 },
            { model: 'Latitude 5430', weight: 1.4 },
            { model: 'Latitude 7440', weight: 1.3 },
            { model: 'Inspiron 14', weight: 1.6 },
            { model: 'Inspiron 15', weight: 1.7 },
            { model: 'Inspiron 16', weight: 1.9 },
            { model: 'Vostro 14', weight: 1.6 },
            { model: 'Vostro 15', weight: 1.7 }
        ],
        'HP': [
            { model: 'Pavilion 14', weight: 1.4 },
            { model: 'Pavilion 15', weight: 1.7 },
            { model: 'Pavilion x360', weight: 1.6 },
            { model: 'EliteBook 840 G10', weight: 1.4 },
            { model: 'EliteBook 860 G10', weight: 1.8 },
            { model: 'ProBook 440 G10', weight: 1.4 },
            { model: 'ProBook 450 G10', weight: 1.7 },
            { model: 'Envy x360 15', weight: 1.9 },
            { model: 'Spectre x360 14', weight: 1.4 },
            { model: 'Victus 16', weight: 2.3 },
            { model: 'Omen 16', weight: 2.3 }
        ],
        'Lenovo': [
            { model: 'ThinkPad X1 Carbon', weight: 1.1 },
            { model: 'ThinkPad T14', weight: 1.4 },
            { model: 'ThinkPad T16', weight: 1.8 },
            { model: 'ThinkPad E14', weight: 1.6 },
            { model: 'ThinkPad E15', weight: 1.8 },
            { model: 'ThinkPad L14', weight: 1.5 },
            { model: 'IdeaPad Slim 3', weight: 1.6 },
            { model: 'IdeaPad Slim 5', weight: 1.5 },
            { model: 'IdeaPad Gaming 3', weight: 2.3 },
            { model: 'Yoga Slim 7', weight: 1.4 },
            { model: 'Legion 5', weight: 2.4 }
        ],
        'Acer': [
            { model: 'Aspire 3 A315', weight: 1.7 },
            { model: 'Aspire 5 A515', weight: 1.8 },
            { model: 'Aspire 7 A715', weight: 2.1 },
            { model: 'Swift 3 SF314', weight: 1.2 },
            { model: 'Swift 5 SF514', weight: 1.0 },
            { model: 'Swift Go 14', weight: 1.3 },
            { model: 'Nitro 5', weight: 2.5 },
            { model: 'TravelMate P2', weight: 1.6 }
        ],
        'Apple': [
            { model: 'MacBook Air 13" M1', weight: 1.3 },
            { model: 'MacBook Air 13" M2', weight: 1.2 },
            { model: 'MacBook Air 13" M3', weight: 1.2 },
            { model: 'MacBook Air 15" M2', weight: 1.5 },
            { model: 'MacBook Air 15" M3', weight: 1.5 },
            { model: 'MacBook Pro 14" M3', weight: 1.6 },
            { model: 'MacBook Pro 14" M3 Pro', weight: 1.6 },
            { model: 'MacBook Pro 16" M3 Pro', weight: 2.1 },
            { model: 'MacBook Pro 16" M3 Max', weight: 2.1 }
        ],
        'ASUS': [
            { model: 'ZenBook 14 UX3402', weight: 1.4 },
            { model: 'ZenBook 14X', weight: 1.4 },
            { model: 'ZenBook S 13', weight: 1.0 },
            { model: 'VivoBook 15', weight: 1.7 },
            { model: 'VivoBook S 14', weight: 1.5 },
            { model: 'TUF Gaming F15', weight: 2.2 },
            { model: 'ROG Zephyrus G14', weight: 1.7 },
            { model: 'ROG Strix G16', weight: 2.5 },
            { model: 'ExpertBook B1', weight: 1.5 }
        ],
        'Microsoft': [
            { model: 'Surface Laptop 5 13"', weight: 1.3 },
            { model: 'Surface Laptop 5 15"', weight: 1.6 },
            { model: 'Surface Laptop Go 3', weight: 1.1 },
            { model: 'Surface Laptop Studio 2', weight: 2.0 },
            { model: 'Surface Pro 9', weight: 0.9 }
        ],
        'MSI': [
            { model: 'Modern 14', weight: 1.4 },
            { model: 'Modern 15', weight: 1.7 },
            { model: 'Prestige 14', weight: 1.4 },
            { model: 'GF63 Thin', weight: 1.9 },
            { model: 'Katana 15', weight: 2.3 },
            { model: 'Raider GE78', weight: 2.8 }
        ]
    },
    Phone: {
        'Apple': [
            { model: 'iPhone 16 Pro Max', weight: 0.227 },
            { model: 'iPhone 16 Pro', weight: 0.199 },
            { model: 'iPhone 16 Plus', weight: 0.199 },
            { model: 'iPhone 16', weight: 0.170 },
            { model: 'iPhone 15 Pro Max', weight: 0.221 },
            { model: 'iPhone 15 Pro', weight: 0.187 },
            { model: 'iPhone 15 Plus', weight: 0.201 },
            { model: 'iPhone 15', weight: 0.171 },
            { model: 'iPhone 14 Pro Max', weight: 0.240 },
            { model: 'iPhone 14 Pro', weight: 0.206 },
            { model: 'iPhone 14', weight: 0.172 },
            { model: 'iPhone 13', weight: 0.174 },
            { model: 'iPhone 12', weight: 0.164 },
            { model: 'iPhone SE (3rd gen)', weight: 0.144 }
        ],
        'Samsung': [
            { model: 'Galaxy S24 Ultra', weight: 0.232 },
            { model: 'Galaxy S24+', weight: 0.196 },
            { model: 'Galaxy S24', weight: 0.167 },
            { model: 'Galaxy S23 Ultra', weight: 0.234 },
            { model: 'Galaxy S23', weight: 0.168 },
            { model: 'Galaxy A54 5G', weight: 0.202 },
            { model: 'Galaxy A34 5G', weight: 0.199 },
            { model: 'Galaxy A15', weight: 0.200 },
            { model: 'Galaxy Z Fold5', weight: 0.253 },
            { model: 'Galaxy Z Flip5', weight: 0.187 }
        ],
        'OPPO': [
            { model: 'Find X7 Ultra', weight: 0.221 },
            { model: 'Find X6 Pro', weight: 0.216 },
            { model: 'Reno 11 Pro', weight: 0.185 },
            { model: 'Reno 11', weight: 0.181 },
            { model: 'A98 5G', weight: 0.188 },
            { model: 'A58', weight: 0.192 }
        ],
        'Vivo': [
            { model: 'X100 Pro', weight: 0.225 },
            { model: 'V30 Pro', weight: 0.187 },
            { model: 'V30', weight: 0.186 },
            { model: 'Y36', weight: 0.190 },
            { model: 'Y17s', weight: 0.185 }
        ],
        'Xiaomi': [
            { model: 'Xiaomi 14 Ultra', weight: 0.220 },
            { model: 'Xiaomi 14 Pro', weight: 0.223 },
            { model: 'Xiaomi 14', weight: 0.193 },
            { model: 'Redmi Note 13 Pro+', weight: 0.205 },
            { model: 'Redmi Note 13 Pro', weight: 0.187 },
            { model: 'Redmi Note 13', weight: 0.189 },
            { model: 'Redmi 13C', weight: 0.192 },
            { model: 'POCO X6 Pro', weight: 0.186 }
        ],
        'Huawei': [
            { model: 'Mate 60 Pro', weight: 0.225 },
            { model: 'P60 Pro', weight: 0.200 },
            { model: 'Nova 12 Pro', weight: 0.185 },
            { model: 'Nova 11i', weight: 0.190 }
        ],
        'Google': [
            { model: 'Pixel 8 Pro', weight: 0.213 },
            { model: 'Pixel 8', weight: 0.187 },
            { model: 'Pixel 8a', weight: 0.188 },
            { model: 'Pixel 7a', weight: 0.194 }
        ],
        'realme': [
            { model: 'GT 5 Pro', weight: 0.199 },
            { model: '12 Pro+', weight: 0.190 },
            { model: 'C67', weight: 0.192 },
            { model: 'Narzo 60', weight: 0.190 }
        ]
    },
    Tablet: {
        'Apple': [
            { model: 'iPad Pro 13" M4', weight: 0.579 },
            { model: 'iPad Pro 11" M4', weight: 0.444 },
            { model: 'iPad Air 13" M2', weight: 0.617 },
            { model: 'iPad Air 11" M2', weight: 0.462 },
            { model: 'iPad (10th gen)', weight: 0.477 },
            { model: 'iPad (9th gen)', weight: 0.487 },
            { model: 'iPad Mini (6th gen)', weight: 0.293 }
        ],
        'Samsung': [
            { model: 'Galaxy Tab S9 Ultra', weight: 0.732 },
            { model: 'Galaxy Tab S9+', weight: 0.586 },
            { model: 'Galaxy Tab S9', weight: 0.498 },
            { model: 'Galaxy Tab S9 FE', weight: 0.523 },
            { model: 'Galaxy Tab A9+', weight: 0.480 },
            { model: 'Galaxy Tab A9', weight: 0.340 }
        ],
        'Huawei': [
            { model: 'MatePad Pro 13.2"', weight: 0.580 },
            { model: 'MatePad 11.5"', weight: 0.499 },
            { model: 'MatePad SE 10.4"', weight: 0.440 }
        ],
        'Lenovo': [
            { model: 'Tab P12', weight: 0.615 },
            { model: 'Tab P11 Pro', weight: 0.480 },
            { model: 'Tab M11', weight: 0.465 },
            { model: 'Tab M10 Plus', weight: 0.465 }
        ],
        'Xiaomi': [
            { model: 'Pad 6', weight: 0.490 },
            { model: 'Pad 6 Pro', weight: 0.490 },
            { model: 'Redmi Pad SE', weight: 0.478 }
        ],
        'Microsoft': [
            { model: 'Surface Pro 9', weight: 0.879 },
            { model: 'Surface Go 3', weight: 0.544 }
        ]
    }
};

const DEVICE_TYPES = [
    { key: 'Computer', label: 'คอมพิวเตอร์', img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=300&h=300&fit=crop' },
    { key: 'Laptop', label: 'แล็ปท็อป', img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop' },
    { key: 'Tablet', label: 'แท็บเล็ต', img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop' },
    { key: 'Phone', label: 'โทรศัพท์', img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop' }
];

// Map Thai or English equipment_type from DB → DEVICE_TYPES key
const EQUIP_TYPE_TO_KEY = {
    'คอมพิวเตอร์': 'Computer', 'Computer': 'Computer',
    'แล็ปท็อป': 'Laptop',     'Laptop': 'Laptop',
    'แท็บเล็ต': 'Tablet',     'Tablet': 'Tablet',
    'โทรศัพท์': 'Phone',      'Phone': 'Phone',
    'โทรศัพท์มือถือ': 'Phone'
};
function normalizeEquipType(val) { return EQUIP_TYPE_TO_KEY[val] || null; }

// Spec tier for each known model — used to enforce minimum spec when donating to a request
const DEVICE_SPEC_MAP = {
    Computer: {
        Dell:   { 'OptiPlex 3000':'basic','OptiPlex 5000':'standard','OptiPlex 7000':'high','Inspiron Desktop':'basic','Vostro Desktop':'standard','XPS Desktop':'high' },
        HP:     { 'ProDesk 400 G9':'basic','ProDesk 600 G6':'standard','EliteDesk 800 G9':'high','Pavilion Desktop':'basic','Z2 Tower G9':'high' },
        Lenovo: { 'ThinkCentre M70q':'standard','ThinkCentre M90q':'high','ThinkCentre M70t':'standard','IdeaCentre 3':'basic','IdeaCentre 5i':'standard' },
        Acer:   { 'Veriton S2690G':'standard','Veriton N4690GT':'basic','Aspire TC':'basic','Predator Orion 3000':'high' },
        Apple:  { 'iMac 24" M1':'high','iMac 24" M3':'high','Mac Mini M2':'standard','Mac Mini M4':'high','Mac Studio M2':'high','Mac Pro':'high' },
        ASUS:   { 'ExpertCenter D5':'standard','ExpertCenter D7':'high','ROG Strix G10':'high' },
    },
    Laptop: {
        Dell:      { 'XPS 13':'high','XPS 15':'high','XPS 17':'high','Latitude 3420':'basic','Latitude 5430':'standard','Latitude 7440':'high','Inspiron 14':'basic','Inspiron 15':'basic','Inspiron 16':'standard','Vostro 14':'basic','Vostro 15':'basic' },
        HP:        { 'Pavilion 14':'basic','Pavilion 15':'basic','Pavilion x360':'basic','EliteBook 840 G10':'high','EliteBook 860 G10':'high','ProBook 440 G10':'standard','ProBook 450 G10':'standard','Envy x360 15':'standard','Spectre x360 14':'high','Victus 16':'standard','Omen 16':'high' },
        Lenovo:    { 'ThinkPad X1 Carbon':'high','ThinkPad T14':'standard','ThinkPad T16':'standard','ThinkPad E14':'standard','ThinkPad E15':'standard','ThinkPad L14':'basic','IdeaPad Slim 3':'basic','IdeaPad Slim 5':'standard','IdeaPad Gaming 3':'standard','Yoga Slim 7':'high','Legion 5':'high' },
        Acer:      { 'Aspire 3 A315':'basic','Aspire 5 A515':'standard','Aspire 7 A715':'high','Swift 3 SF314':'standard','Swift 5 SF514':'high','Swift Go 14':'standard','Nitro 5':'high','TravelMate P2':'standard' },
        Apple:     { 'MacBook Air 13" M1':'standard','MacBook Air 13" M2':'standard','MacBook Air 13" M3':'standard','MacBook Air 15" M2':'standard','MacBook Air 15" M3':'standard','MacBook Pro 14" M3':'high','MacBook Pro 14" M3 Pro':'high','MacBook Pro 16" M3 Pro':'high','MacBook Pro 16" M3 Max':'high' },
        ASUS:      { 'ZenBook 14 UX3402':'standard','ZenBook 14X':'standard','ZenBook S 13':'high','VivoBook 15':'basic','VivoBook S 14':'standard','TUF Gaming F15':'high','ROG Zephyrus G14':'high','ROG Strix G16':'high','ExpertBook B1':'basic' },
        Microsoft: { 'Surface Laptop 5 13"':'standard','Surface Laptop 5 15"':'standard','Surface Laptop Go 3':'basic','Surface Laptop Studio 2':'high','Surface Pro 9':'standard' },
        MSI:       { 'Modern 14':'standard','Modern 15':'standard','Prestige 14':'high','GF63 Thin':'standard','Katana 15':'high','Raider GE78':'high' },
    },
    Phone: {
        Apple:   { 'iPhone 16 Pro Max':'high','iPhone 16 Pro':'high','iPhone 16 Plus':'high','iPhone 16':'high','iPhone 15 Pro Max':'high','iPhone 15 Pro':'high','iPhone 15 Plus':'high','iPhone 15':'high','iPhone 14 Pro Max':'high','iPhone 14 Pro':'high','iPhone 14':'standard','iPhone 13':'standard','iPhone 12':'standard','iPhone SE (3rd gen)':'basic' },
        Samsung: { 'Galaxy S24 Ultra':'high','Galaxy S24+':'high','Galaxy S24':'high','Galaxy S23 Ultra':'high','Galaxy S23':'high','Galaxy A54 5G':'standard','Galaxy A34 5G':'standard','Galaxy A15':'basic','Galaxy Z Fold5':'high','Galaxy Z Flip5':'high' },
        OPPO:    { 'Find X7 Ultra':'high','Find X6 Pro':'high','Reno 11 Pro':'standard','Reno 11':'standard','A98 5G':'standard','A58':'basic' },
        Vivo:    { 'X100 Pro':'high','V30 Pro':'standard','V30':'standard','Y36':'basic','Y17s':'basic' },
        Xiaomi:  { 'Xiaomi 14 Ultra':'high','Xiaomi 14 Pro':'high','Xiaomi 14':'high','Redmi Note 13 Pro+':'standard','Redmi Note 13 Pro':'standard','Redmi Note 13':'standard','Redmi 13C':'basic','POCO X6 Pro':'standard' },
        Huawei:  { 'Mate 60 Pro':'high','P60 Pro':'high','Nova 12 Pro':'standard','Nova 11i':'basic' },
        Google:  { 'Pixel 8 Pro':'high','Pixel 8':'high','Pixel 8a':'standard','Pixel 7a':'standard' },
        realme:  { 'GT 5 Pro':'high','12 Pro+':'standard','C67':'basic','Narzo 60':'basic' },
    },
    Tablet: {
        Apple:     { 'iPad Pro 13" M4':'high','iPad Pro 11" M4':'high','iPad Air 13" M2':'high','iPad Air 11" M2':'standard','iPad (10th gen)':'standard','iPad (9th gen)':'basic','iPad Mini (6th gen)':'standard' },
        Samsung:   { 'Galaxy Tab S9 Ultra':'high','Galaxy Tab S9+':'high','Galaxy Tab S9':'high','Galaxy Tab S9 FE':'standard','Galaxy Tab A9+':'standard','Galaxy Tab A9':'basic' },
        Huawei:    { 'MatePad Pro 13.2"':'high','MatePad 11.5"':'standard','MatePad SE 10.4"':'basic' },
        Lenovo:    { 'Tab P12':'standard','Tab P11 Pro':'standard','Tab M11':'basic','Tab M10 Plus':'basic' },
        Xiaomi:    { 'Pad 6':'standard','Pad 6 Pro':'high','Redmi Pad SE':'basic' },
        Microsoft: { 'Surface Pro 9':'high','Surface Go 3':'basic' },
    },
};

// Tier ordering for spec and condition comparisons
const SPEC_TIER = { any: 0, basic: 1, standard: 2, high: 3 };
const SPEC_TIER_LABEL = { basic: 'พื้นฐาน', standard: 'มาตรฐาน', high: 'สูง', any: 'ยอมรับทุกสเปก' };
// Higher number = better condition
const COND_TIER_REQ = { 'ยอมรับทุกสภาพ': 0, 'ใช้งานได้บางส่วน': 1, 'ดีมีรอยขีดข่วน': 2, 'พร้อมใช้งาน': 3 };
const COND_TIER_DON = { 'ชำรุด ซ่อมแซมได้': 0, 'ใช้งานได้บางส่วน': 1, 'ดี มีรอยขีดข่วนเล็กน้อย': 2, 'พร้อมใช้งาน': 3 };

// Look up a model's spec tier from DEVICE_SPEC_MAP
function getModelSpecTier(deviceType, brand, model) {
    return DEVICE_SPEC_MAP[deviceType]?.[brand]?.[model] || null;
}

// Parse equipment_detail from selectedRecipientPost and find the requirement matching a given device key
function getRequestSpecForItem(deviceKey) {
    if (!selectedRecipientPost) return null;
    try {
        const detail = JSON.parse(selectedRecipientPost.equipment_detail || 'null');
        if (!Array.isArray(detail)) return null;
        return detail.find(d => (EQUIP_TYPE_TO_KEY[d.type] || d.type) === deviceKey) || null;
    } catch { return null; }
}

// Validate a donation item against the recipient request's requirements.
// Returns { ok: true } or { ok: false, reason: string }
function checkItemMeetsSpec(item) {
    const req = getRequestSpecForItem(item.device_type);
    if (!req) return { ok: true };

    const brand = item.device_brand === '__other__' ? null : item.device_brand;
    const model = item.device_model === '__other__' ? null : item.device_model;

    // Spec tier check
    if (req.spec && req.spec !== 'any') {
        const modelTier = brand && model ? getModelSpecTier(item.device_type, brand, model) : null;
        if (modelTier) {
            if ((SPEC_TIER[modelTier] || 0) < (SPEC_TIER[req.spec] || 0)) {
                return { ok: false, reason: `สเปกต่ำกว่าที่กำหนด — ต้องการ: ${req.spec_label || SPEC_TIER_LABEL[req.spec]}` };
            }
        }
        // Custom brand/model: can't auto-validate — warn but allow (validation note shown in card)
    }

    // Condition check
    if (req.condition && req.condition !== 'ยอมรับทุกสภาพ') {
        if (item.device_condition) {
            const donCond = COND_TIER_DON[item.device_condition] ?? -1;
            const reqCond = COND_TIER_REQ[req.condition] ?? 0;
            if (donCond < reqCond) {
                return { ok: false, reason: `สภาพไม่ตรงตามที่กำหนด — ต้องการ: ${req.condition}` };
            }
        }
    }

    // OS check (phones only)
    if (item.device_type === 'Phone' && req.os && req.os !== 'any') {
        const isApple = brand === 'Apple';
        if (req.os === 'ios' && !isApple) return { ok: false, reason: 'ต้องการ iOS (iPhone) เท่านั้น' };
        if (req.os === 'android' && isApple) return { ok: false, reason: 'ต้องการ Android เท่านั้น (ไม่รับ iPhone)' };
    }

    return { ok: true };
}

// Get array of equipment keys from comma-separated equipment_type string
function getEquipKeys(val) {
    if (!val) return [];
    return val.split(',').map(v => EQUIP_TYPE_TO_KEY[v.trim()]).filter(Boolean);
}
// Get display label(s) from comma-separated equipment_type string
function getEquipLabels(val) {
    if (!val) return val || '';
    const labels = { 'คอมพิวเตอร์': 'คอมพิวเตอร์', 'แล็ปท็อป': 'แล็ปท็อป', 'แท็บเล็ต': 'แท็บเล็ต', 'โทรศัพท์มือถือ': 'โทรศัพท์', 'Computer': 'คอมพิวเตอร์', 'Laptop': 'แล็ปท็อป', 'Tablet': 'แท็บเล็ต', 'Phone': 'โทรศัพท์' };
    return val.split(',').map(v => labels[v.trim()] || v.trim()).filter(Boolean).join(', ');
}

// === DONATION ITEMS MANAGEMENT ===
let donationItems = [];
let donationPhotos = []; // Array of { file, objectUrl }

const MAX_PHOTOS = 30;
const MAX_PHOTO_SIZE_MB = 5;

function handleDonationPhotoSelect(fileList) {
    const files = Array.from(fileList);
    let skipped = 0;
    files.forEach(file => {
        if (!file.type.startsWith('image/')) { skipped++; return; }
        if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
            showNotification(`"${file.name}" ขนาดเกิน ${MAX_PHOTO_SIZE_MB}MB — ข้ามไป`, 'error');
            return;
        }
        if (donationPhotos.length >= MAX_PHOTOS) {
            showNotification(`เพิ่มได้สูงสุด ${MAX_PHOTOS} รูป`, 'error');
            return;
        }
        donationPhotos.push({ file, objectUrl: URL.createObjectURL(file) });
    });
    if (skipped > 0) showNotification(`ข้ามไฟล์ที่ไม่ใช่รูปภาพ ${skipped} ไฟล์`, 'info');
    renderDonationPhotos();
}

function renderDonationPhotos() {
    const container = document.getElementById('photoPreviewContainer');
    if (!container) return;
    if (donationPhotos.length === 0) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
    }
    container.style.display = 'grid';
    container.innerHTML = donationPhotos.map((p, i) => `
        <div class="photo-preview-item">
            <img src="${p.objectUrl}" alt="รูปที่ ${i + 1}">
            <button class="photo-remove-btn" onclick="removeDonationPhoto(${i})" title="ลบรูปนี้">✕</button>
            <span class="photo-name">${p.file.name}</span>
        </div>
    `).join('');
    // Update upload area button text
    const btn = document.getElementById('btnSelectPhotos');
    if (btn) btn.textContent = `เพิ่มรูปเพิ่มเติม (${donationPhotos.length}/${MAX_PHOTOS})`;
}

function removeDonationPhoto(index) {
    URL.revokeObjectURL(donationPhotos[index].objectUrl);
    donationPhotos.splice(index, 1);
    renderDonationPhotos();
    if (donationPhotos.length === 0) {
        const btn = document.getElementById('btnSelectPhotos');
        if (btn) btn.textContent = 'เลือกรูปภาพ';
    }
}

// Upload all selected photos to Supabase Storage
// Returns array of public URLs (skips failed uploads with a warning)
async function uploadDonationPhotos(trackingId) {
    if (!donationPhotos.length || !supabaseClient) return [];
    const urls = [];
    for (let i = 0; i < donationPhotos.length; i++) {
        const { file } = donationPhotos[i];
        const ext = file.name.split('.').pop().toLowerCase() || 'jpg';
        const path = `${currentUser.id}/${trackingIdToPath(trackingId)}/${i + 1}-${Date.now()}.${ext}`;
        const { error } = await supabaseClient.storage
            .from('donation-photos')
            .upload(path, file, { cacheControl: '3600', upsert: false });
        if (error) {
            console.warn(`Photo ${i + 1} upload failed:`, error.message);
            continue;
        }
        const { data: { publicUrl } } = supabaseClient.storage
            .from('donation-photos')
            .getPublicUrl(path);
        urls.push(publicUrl);
    }
    return urls;
}

let _donationItemIdCounter = 0;
function addDonationItem() {
    const id = ++_donationItemIdCounter;
    donationItems.push({
        id,
        device_type: '',
        device_brand: '',
        device_model: '',
        device_weight: 0,
        device_condition: '',
        condition_notes: '',
        serial_number: ''
    });
    renderDonationItems();
}

function removeDonationItem(id) {
    if (donationItems.length <= 1) {
        showNotification('ต้องมีอุปกรณ์อย่างน้อย 1 รายการ', 'error');
        return;
    }
    donationItems = donationItems.filter(item => item.id !== id);
    renderDonationItems();
}

function updateDonationItem(id, field, value) {
    const item = donationItems.find(i => i.id === id);
    if (item) {
        item[field] = value;
        updateDonationSummary();
    }
}

function selectDeviceType(itemId, deviceKey) {
    const requiredKeys = selectedRecipientPost ? getEquipKeys(selectedRecipientPost.equipment_type) : [];
    if (requiredKeys.length > 0 && !requiredKeys.includes(deviceKey)) {
        const requiredLabels = requiredKeys.map(k => DEVICE_TYPES.find(d => d.key === k)?.label || k).join(', ');
        showNotification(`โพสต์นี้รับบริจาคเฉพาะ${requiredLabels}เท่านั้น ไม่สามารถเลือกอุปกรณ์อื่นได้`, 'error');
        return;
    }
    const item = donationItems.find(i => i.id === itemId);
    if (item) {
        item.device_type = deviceKey;
        item.device_brand = '';
        item.device_model = '';
        item.device_weight = 0;
        renderDonationItems();
    }
}

// When brand dropdown changes — update model dropdown options
function onBrandChange(itemId, brand) {
    const item = donationItems.find(i => i.id === itemId);
    if (!item) return;
    item.device_brand = brand;
    item.device_model = '';
    item.device_weight = 0;
    renderDonationItems();
}

// When model dropdown changes — auto-fill weight
function onModelChange(itemId, model) {
    const item = donationItems.find(i => i.id === itemId);
    if (!item) return;
    item.device_model = model;

    // Auto-fill weight from database
    const brands = DEVICE_DATABASE[item.device_type];
    if (brands && brands[item.device_brand]) {
        const modelData = brands[item.device_brand].find(m => m.model === model);
        if (modelData) {
            item.device_weight = modelData.weight;
        }
    }
    renderDonationItems();
}

// Get brands for a device type
function getBrandsForType(deviceType) {
    const brands = DEVICE_DATABASE[deviceType];
    return brands ? Object.keys(brands) : [];
}

// Get models for a device type + brand
function getModelsForBrand(deviceType, brand) {
    const brands = DEVICE_DATABASE[deviceType];
    if (!brands || !brands[brand]) return [];
    return brands[brand];
}

function addDonationItemOfType(deviceKey) {
    addDonationItem();
    const newItem = donationItems[donationItems.length - 1];
    if (newItem) {
        newItem.device_type = deviceKey;
        newItem.device_brand = '';
        newItem.device_model = '';
        newItem.device_weight = 0;
    }
    renderDonationItems();
}

function renderDonationItems() {
    const container = document.getElementById('donationItemsList');
    if (!container) return;

    // Build item card HTML for a single item
    function buildItemCard(item, index) {
        const brands = getBrandsForType(item.device_type);
        const models = item.device_brand && item.device_brand !== '__other__'
            ? getModelsForBrand(item.device_type, item.device_brand)
            : [];
        const isCustomBrand = item.device_brand === '__other__';
        const isCustomModel = item.device_model === '__other__';
        const qty = item.quantity || 1;
        const isAutoWeight = item.device_weight > 0 && item.device_model && item.device_model !== '__other__';
        const serialNumbers = item.serial_numbers || [''];

        // Spec requirement from the linked request (if any)
        const reqSpec = item.device_type ? getRequestSpecForItem(item.device_type) : null;
        const reqMinTier = reqSpec?.spec && reqSpec.spec !== 'any' ? (SPEC_TIER[reqSpec.spec] || 0) : 0;
        const reqCondLabel = reqSpec?.condition && reqSpec.condition !== 'ยอมรับทุกสภาพ' ? reqSpec.condition : null;
        const reqOsLabel = reqSpec?.os && reqSpec.os !== 'any' ? (reqSpec.os === 'ios' ? 'iOS (iPhone)' : 'Android') : null;

        // Filter brand list to match OS requirement
        const filteredBrands = reqSpec?.os === 'ios'     ? brands.filter(b => b === 'Apple') :
                               reqSpec?.os === 'android' ? brands.filter(b => b !== 'Apple') :
                               brands;
        const osLocked = !!(reqSpec?.os && reqSpec.os !== 'any');

        // Spec requirement banner shown when donating to a request that has a minimum spec
        const specBannerParts = [];
        if (reqSpec && reqMinTier > 0) specBannerParts.push(reqSpec.spec_label || SPEC_TIER_LABEL[reqSpec.spec]);
        if (reqCondLabel) specBannerParts.push(`สภาพ: ${reqCondLabel}`);
        if (reqOsLabel) specBannerParts.push(`OS: ${reqOsLabel}`);
        const specBanner = specBannerParts.length > 0
            ? `<div class="spec-req-banner">📋 สเปกอุปกรณ์ขั้นต่ำ: ${specBannerParts.join(' · ')}</div>`
            : '';

        // Inline spec warning for the currently selected model
        const specCheck = item.device_type && (item.device_brand || item.device_condition) ? checkItemMeetsSpec(item) : { ok: true };
        const specWarn = !specCheck.ok
            ? `<div class="spec-warn-inline">⚠️ ${specCheck.reason}</div>`
            : (isCustomBrand && reqMinTier > 0 ? `<div class="spec-warn-inline spec-warn-soft">⚠️ กรุณาตรวจสอบว่ารุ่นที่กรอกตรงตามสเปกขั้นต่ำที่กำหนด</div>` : '');

        // For model dropdown: mark options that are below the required tier
        function modelOptionMeta(m) {
            if (!reqMinTier) return { label: `${m.model} (${m.weight} กก.)`, disabled: false };
            const tier = getModelSpecTier(item.device_type, item.device_brand, m.model);
            const belowSpec = tier && (SPEC_TIER[tier] || 0) < reqMinTier;
            return {
                label: belowSpec ? `⛔ ${m.model} (${m.weight} กก.) — ต่ำกว่าสเปกที่ขอ` : `${m.model} (${m.weight} กก.)`,
                disabled: belowSpec,
            };
        }

        const reqCondTier = reqCondLabel ? (COND_TIER_REQ[reqCondLabel] ?? 0) : 0;

        return `
        <div class="donation-item-card" data-item-id="${item.id}">
            <div class="item-card-header">
                <span class="item-number">อุปกรณ์ชิ้นที่ ${index + 1}</span>
                ${donationItems.length > 1 ? `<button class="btn-remove-item" onclick="removeDonationItem(${item.id})">✕ ลบ</button>` : ''}
            </div>
            ${specBanner}

            <div class="device-selector">
                ${DEVICE_TYPES.map(dt => {
                    const requiredKeys = selectedRecipientPost ? getEquipKeys(selectedRecipientPost.equipment_type) : [];
                    const isLocked = requiredKeys.length > 0 && !requiredKeys.includes(dt.key);
                    const isSelected = item.device_type === dt.key;
                    return `
                    <div class="device-option ${isSelected ? 'selected' : ''} ${isLocked ? 'device-locked' : ''}"
                         data-device="${dt.key}"
                         onclick="selectDeviceType(${item.id}, '${dt.key}')">
                        <img src="${dt.img}" alt="${dt.label}">
                        <span class="device-label">${dt.label}</span>
                        ${isLocked ? '<span class="device-locked-badge">ไม่ใช่ที่ขอ</span>' : '<div class="radio-indicator"></div>'}
                    </div>`;
                }).join('')}
            </div>

            <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                    <label>ยี่ห้อ *</label>
                    ${item.device_type && filteredBrands.length > 0 ? `
                        <select onchange="onBrandChange(${item.id}, this.value)" class="brand-select">
                            <option value="">-- เลือกยี่ห้อ --</option>
                            ${filteredBrands.map(b => `<option value="${b}" ${item.device_brand === b ? 'selected' : ''}>${b}</option>`).join('')}
                            ${!osLocked ? `<option value="__other__" ${isCustomBrand ? 'selected' : ''}>อื่นๆ (กรอกเอง)</option>` : ''}
                        </select>
                        ${osLocked && filteredBrands.length === 1 ? `<small style="color:#2f5233;font-size:0.78rem;">🔒 OS ที่กำหนด: ${reqOsLabel} — รับเฉพาะ ${filteredBrands[0]} เท่านั้น</small>` : ''}
                        ${isCustomBrand ? `<input type="text" placeholder="กรอกยี่ห้อ..." class="custom-brand-input"
                            value="${item._customBrand || ''}"
                            onchange="updateDonationItem(${item.id}, '_customBrand', this.value); updateDonationItem(${item.id}, 'device_brand', '__other__')">` : ''}
                    ` : `
                        <input type="text" placeholder="เลือกประเภทอุปกรณ์ก่อน" disabled>
                    `}
                </div>
                <div class="form-group">
                    <label>รุ่น *</label>
                    ${item.device_brand && !isCustomBrand && models.length > 0 ? `
                        <select onchange="onModelChange(${item.id}, this.value)" class="model-select">
                            <option value="">-- เลือกรุ่น --</option>
                            ${models.map(m => { const meta = modelOptionMeta(m); return `<option value="${m.model}" ${item.device_model === m.model ? 'selected' : ''} ${meta.disabled ? 'disabled' : ''}>${meta.label}</option>`; }).join('')}
                            <option value="__other__" ${isCustomModel ? 'selected' : ''}>อื่นๆ (กรอกเอง)</option>
                        </select>
                        ${isCustomModel ? `<input type="text" placeholder="กรอกรุ่น..." class="custom-model-input"
                            value="${item._customModel || ''}"
                            onchange="updateDonationItem(${item.id}, '_customModel', this.value); updateDonationItem(${item.id}, 'device_model', '__other__')">` : ''}
                    ` : isCustomBrand ? `
                        <input type="text" placeholder="กรอกรุ่น..."
                            value="${item._customModel || ''}"
                            onchange="updateDonationItem(${item.id}, '_customModel', this.value); updateDonationItem(${item.id}, 'device_model', this.value)">
                    ` : `
                        <input type="text" placeholder="เลือกยี่ห้อก่อน" disabled>
                    `}
                </div>
            </div>
            ${specWarn}

            <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                    <label>น้ำหนัก${qty > 1 ? '/เครื่อง' : ''} (กก.) *</label>
                    ${isAutoWeight ? `
                        <div class="auto-weight-badge">
                            <span class="auto-weight-value">⚖️ ${item.device_weight} กก.</span>
                            <span class="auto-weight-label">เติมอัตโนมัติ</span>
                        </div>
                    ` : `
                        <input type="number" placeholder="น้ำหนักโดยประมาณ" min="0.01" step="0.01"
                               value="${item.device_weight || ''}"
                               oninput="updateDonationItem(${item.id}, 'device_weight', parseFloat(this.value) || 0)">
                    `}
                    ${qty > 1 && item.device_weight > 0 ? `<small class="weight-hint">รวม ${(item.device_weight * qty).toFixed(2)} กก.</small>` : ''}
                </div>
                <div class="form-group">
                    <label>จำนวน (ชิ้น)</label>
                    <input type="number" min="1" max="100" value="${qty}"
                           oninput="updateItemQuantity(${item.id}, parseInt(this.value) || 1)"
                           class="qty-input">
                    ${qty > 1 ? `<small class="weight-hint">รุ่นเดียวกัน ${qty} เครื่อง</small>` : ''}
                </div>
            </div>

            <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                    <label>สภาพอุปกรณ์ *</label>
                    <select onchange="updateDonationItem(${item.id}, 'device_condition', this.value)">
                        <option value="" ${!item.device_condition ? 'selected' : ''}>-- เลือกสภาพ --</option>
                        ${[
                            'พร้อมใช้งาน',
                            'ดี มีรอยขีดข่วนเล็กน้อย',
                            'ใช้งานได้บางส่วน',
                            'ชำรุด ซ่อมแซมได้',
                        ].map(cond => {
                            const belowCond = reqCondTier > 0 && (COND_TIER_DON[cond] ?? 0) < reqCondTier;
                            const label = belowCond ? `⛔ ${cond} — ต่ำกว่าที่กำหนด` : cond;
                            return `<option value="${cond}" ${item.device_condition === cond ? 'selected' : ''} ${belowCond ? 'disabled' : ''}>${label}</option>`;
                        }).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>รายละเอียดสภาพเพิ่มเติม</label>
                    <textarea placeholder="อธิบายรายละเอียดเพิ่มเติม..." rows="3"
                              onchange="updateDonationItem(${item.id}, 'condition_notes', this.value)">${item.condition_notes || ''}</textarea>
                </div>
            </div>

            <div class="serial-section">
                <label class="serial-section-label">หมายเลขเครื่อง (Serial Number)${qty > 1 ? ` — ${qty} เครื่อง` : ''}</label>
                ${qty <= 1 ? `
                    <input type="text" placeholder="เช่น SN-12345678..."
                           value="${serialNumbers[0] || ''}"
                           onchange="updateSerialNumber(${item.id}, 0, this.value)"
                           class="serial-input">
                ` : `
                    <div class="serial-grid">
                        ${Array.from({ length: qty }, (_, i) => `
                            <div class="serial-row">
                                <span class="serial-label">#${i + 1}</span>
                                <input type="text" placeholder="S/N เครื่องที่ ${i + 1}..."
                                       value="${serialNumbers[i] || ''}"
                                       onchange="updateSerialNumber(${item.id}, ${i}, this.value)"
                                       class="serial-input">
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;}

    // Render items as simple flat list in order
    container.innerHTML = donationItems.map((item, index) => buildItemCard(item, index)).join('');
    updateDonationSummary();
}

// Update quantity for bulk donations
function updateItemQuantity(itemId, qty) {
    const item = donationItems.find(i => i.id === itemId);
    if (!item) return;
    qty = Math.max(1, Math.min(100, qty));
    item.quantity = qty;
    // Resize serial_numbers array to match qty
    if (!item.serial_numbers) item.serial_numbers = [''];
    while (item.serial_numbers.length < qty) item.serial_numbers.push('');
    if (item.serial_numbers.length > qty) item.serial_numbers = item.serial_numbers.slice(0, qty);
    renderDonationItems();
}

// Update individual serial number
function updateSerialNumber(itemId, index, value) {
    const item = donationItems.find(i => i.id === itemId);
    if (!item) return;
    if (!item.serial_numbers) item.serial_numbers = [''];
    item.serial_numbers[index] = value;
    // Also keep backward-compatible single serial_number
    item.serial_number = item.serial_numbers.filter(s => s).join(', ');
}

function updateDonationSummary() {
    const summary = document.getElementById('donationSummary');
    if (!summary) return;

    // Count includes quantity per item
    const count = donationItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const totalWeight = donationItems.reduce((sum, item) => {
        const qty = item.quantity || 1;
        return sum + ((parseFloat(item.device_weight) || 0) * qty);
    }, 0);
    const totalCarbon = donationItems.reduce((sum, item) => {
        const weight = parseFloat(item.device_weight) || 0;
        const qty = item.quantity || 1;
        const factor = CARBON_FACTORS[item.device_type] || 100;
        return sum + (weight * qty * factor);
    }, 0);

    summary.style.display = count > 0 ? 'block' : 'none';
    document.getElementById('summaryCount').textContent = count;
    document.getElementById('summaryWeight').textContent = totalWeight.toFixed(1) + ' กก.';
    document.getElementById('summaryCarbon').textContent = totalCarbon.toFixed(1) + ' kgCO2e';
}

// Initialize with one empty item
function initializeDonationItems() {
    if (donationItems.length === 0) {
        addDonationItem();
    } else {
        renderDonationItems();
    }
}

// === DEVICE SELECTOR ===
function initializeDeviceSelector() {
    // Initialize multi-item donation UI
    initializeDonationItems();

    // Option cards (donate/dispose)
    const optionCards = document.querySelectorAll('.option-card');
    optionCards.forEach(card => {
        card.addEventListener('click', () => {
            optionCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
    });

    // Toggle buttons
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.parentElement;
            parent.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Donation photo upload (multi-file)
    const btnSelectPhotos = document.getElementById('btnSelectPhotos');
    const uploadFileInput = document.getElementById('uploadFile');
    if (btnSelectPhotos && uploadFileInput) {
        btnSelectPhotos.addEventListener('click', () => uploadFileInput.click());
        uploadFileInput.addEventListener('change', (e) => {
            handleDonationPhotoSelect(e.target.files);
            // Reset input so same files can be re-selected after removal
            uploadFileInput.value = '';
        });
    }

    // Drag-and-drop on upload area
    const uploadArea = document.getElementById('donationUploadArea');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            handleDonationPhotoSelect(e.dataTransfer.files);
        });
    }

    // Request doc upload (single file — unchanged)
    const btnBrowse = document.querySelector('.btn-browse');
    if (btnBrowse) {
        btnBrowse.addEventListener('click', () => {
            document.getElementById('reqUploadDoc')?.click();
        });
    }
    // Multi-file upload for request documents
    let _reqDocFiles = [];
    function renderReqDocFileList() {
        const list = document.getElementById('reqDocFileList');
        if (!list) return;
        if (_reqDocFiles.length === 0) { list.innerHTML = ''; return; }
        list.innerHTML = _reqDocFiles.map((f, i) => `
            <div style="display:flex;align-items:center;gap:0.5rem;background:#f0f4f1;border-radius:8px;padding:0.35rem 0.7rem;font-size:0.83rem;color:#2f5233;">
                <span>📎</span>
                <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.name}</span>
                <span style="font-size:0.75rem;color:#888;flex-shrink:0;">${(f.size/1024/1024).toFixed(1)}MB</span>
                <button type="button" onclick="removeReqDoc(${i})" style="background:none;border:none;color:#c0392b;cursor:pointer;font-size:1rem;line-height:1;padding:0 2px;flex-shrink:0;">×</button>
            </div>
        `).join('');
    }
    window.removeReqDoc = function(i) {
        _reqDocFiles.splice(i, 1);
        renderReqDocFileList();
    };
    const reqUploadDoc = document.getElementById('reqUploadDoc');
    if (reqUploadDoc) {
        reqUploadDoc.addEventListener('change', (e) => {
            const MAX = 15 * 1024 * 1024;
            Array.from(e.target.files).forEach(f => {
                if (f.size > MAX) { showNotification(`ไฟล์ ${f.name} ใหญ่เกิน 10MB`, 'error'); return; }
                if (!_reqDocFiles.find(x => x.name === f.name && x.size === f.size)) _reqDocFiles.push(f);
            });
            e.target.value = '';
            renderReqDocFileList();
        });
    }
    window._getReqDocFiles = () => _reqDocFiles;
}

// === DONATE FORM STEPS ===
function nextDonateStep(step) {
    if (step === 2) {
        // Auto-fill defaults so users can always proceed
        donationItems.forEach(item => {
            if (!item.device_type) item.device_type = 'Computer';
            if (!item.device_weight || item.device_weight <= 0) item.device_weight = 1;
        });
        updateDonationSummary();
    }
    document.querySelectorAll('.donate-step').forEach(s => s.classList.remove('active'));
    document.getElementById('step' + step).classList.add('active');
    updateFormStepBar('donate', step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevDonateStep(step) {
    document.querySelectorAll('.donate-step').forEach(s => s.classList.remove('active'));
    document.getElementById('step' + step).classList.add('active');
    updateFormStepBar('donate', step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectCarrier(btn) {
    document.querySelectorAll('.carrier-pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
}

// Redirect to carrier tracking website
function redirectToCarrierTracking() {
    const activePill = document.querySelector('.carrier-pill.active');
    const carrier = activePill ? activePill.dataset.carrier : 'thailand_post';
    const trackingNumber = document.getElementById('trackingNumberExternal').value.trim();

    if (!trackingNumber) {
        showNotification('กรุณากรอกเลขพัสดุ', 'error');
        return;
    }

    const carrierUrls = {
        'thailand_post': 'https://track.thailandpost.co.th/?trackNumber=' + encodeURIComponent(trackingNumber),
        'jt_express': 'https://www.jtexpress.co.th/index/query/gzquery.html?bills=' + encodeURIComponent(trackingNumber),
        'flash_express': 'https://www.flashexpress.com/tracking/?se=' + encodeURIComponent(trackingNumber)
    };

    const url = carrierUrls[carrier];
    if (url) {
        window.open(url, '_blank');
    } else {
        showNotification('ไม่พบขนส่งที่เลือก', 'error');
    }
}

function toggleUpdateTracking() {
    const body = document.getElementById('updateTrackingBody');
    const arrow = document.getElementById('updateTrackingArrow');
    if (!body) return;
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
}

let _currentTrackDonationId = null; // Store donation DB id for update

async function saveCarrierTracking() {
    const input = document.getElementById('updateCarrierTrackingInput');
    const val = input?.value?.trim();
    if (!val) { showNotification('กรุณากรอกเลข Tracking', 'error'); return; }
    if (!_currentTrackDonationId) { showNotification('ไม่พบข้อมูลการบริจาค กรุณาค้นหาใหม่', 'error'); return; }
    if (!supabaseClient) { showNotification('ไม่สามารถเชื่อมต่อระบบได้', 'error'); return; }
    try {
        const { error } = await supabaseClient
            .from('donations')
            .update({ shipping_tracking_id: val })
            .eq('id', _currentTrackDonationId);
        if (error) throw error;
        showNotification('บันทึกเลข Tracking เรียบร้อยแล้ว!', 'success');
        input.value = '';
        document.getElementById('updateTrackingSection').style.display = 'none';
    } catch (e) {
        showNotification('บันทึกไม่สำเร็จ: ' + (e.message || 'กรุณาลองใหม่'), 'error');
    }
}

function showDonateSummary() {
    // Validate phone + tax ID before showing summary
    const telVal = document.getElementById('donorTel')?.value?.trim() || '';
    const telErr = checkPhoneVal(telVal);
    if (telErr) { applyFieldHint('donorTelHint', telErr); showNotification(telErr, 'error'); return; }
    const taxVal = document.getElementById('donorTaxId')?.value?.trim() || '';
    const taxErr = checkIdVal(taxVal, 13);
    if (taxErr) { applyFieldHint('donorTaxIdHint', taxErr); showNotification('เลขประจำตัวผู้เสียภาษี: ' + taxErr, 'error'); return; }

    // Validate step 2 basics before showing summary
    if (donationItems.length === 0) addDonationItem();
    donationItems.forEach(item => {
        if (!item.device_type) item.device_type = 'Computer';
        if (!item.device_weight || item.device_weight <= 0) item.device_weight = 1;
    });

    const donorName  = document.getElementById('donorName')?.value?.trim() || 'ไม่ระบุ';
    const donorTel   = document.getElementById('donorTel')?.value?.trim() || '—';
    const donorEmail = document.getElementById('donorEmail')?.value?.trim() || '—';
    const _emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (donorEmail && donorEmail !== '—' && !_emailRx.test(donorEmail)) {
        showNotification('รูปแบบอีเมลไม่ถูกต้อง', 'error');
        return;
    }
    const donorAddressDetail  = document.getElementById('donorAddressDetail')?.value?.trim() || '';
    const donorSubdistrict    = document.getElementById('donorSubdistrict')?.value?.trim() || '';
    const donorDistrict       = document.getElementById('donorDistrict')?.value?.trim() || '';
    const donorProvince       = document.getElementById('donorProvince')?.value || '';
    const donorPostcode       = document.getElementById('donorPostcode')?.value?.trim() || '';
    const donorAddress = [
        donorAddressDetail,
        donorSubdistrict ? `ตำบล/แขวง ${donorSubdistrict}` : '',
        donorDistrict ? `อำเภอ/เขต ${donorDistrict}` : '',
        donorProvince ? `จังหวัด${donorProvince}` : '',
        donorPostcode
    ].filter(Boolean).join(' ') || '—';

    // Fill donor summary
    document.getElementById('sumDonorName').textContent  = donorName;
    document.getElementById('sumDonorTel').textContent   = donorTel;
    document.getElementById('sumDonorEmail').textContent = donorEmail;
    document.getElementById('sumDonorAddr').textContent  = donorAddress;

    // Fill items list
    const totalWeight = donationItems.reduce((s, i) => s + parseFloat(i.device_weight || 0), 0);
    const totalCarbon = donationItems.reduce((s, i) => {
        const factor = CARBON_FACTORS[i.device_type] || 100;
        return s + (parseFloat(i.device_weight || 0) * factor);
    }, 0);

    const DEVICE_LABELS_TH = {
        'Computer': 'คอมพิวเตอร์', 'Laptop': 'แล็ปท็อป',
        'Tablet': 'แท็บเล็ต', 'Phone': 'โทรศัพท์'
    };
    const listEl = document.getElementById('sumItemsList');
    listEl.innerHTML = donationItems.map((item, i) => {
        const typeTh = DEVICE_LABELS_TH[item.device_type] || item.device_type || 'อุปกรณ์';
        const detail = [item.device_brand, item.device_model].filter(Boolean).join(' ') || '—';
        const serial = item.serial_number ? `<span style="display:block; font-size:0.78rem; color:#666; font-family:monospace; margin-top:0.2rem;">S/N: ${item.serial_number}</span>` : '';
        return `<div class="sum-item-row">
            <span class="sum-item-badge">${typeTh}</span>
            <span class="sum-item-detail">${detail}${serial}</span>
            <span class="sum-item-weight">${parseFloat(item.device_weight||0).toFixed(1)} กก.</span>
        </div>`;
    }).join('');

    document.getElementById('sumTotalItems').textContent  = donationItems.length;
    document.getElementById('sumTotalWeight').textContent = totalWeight.toFixed(1);
    document.getElementById('sumTotalCarbon').textContent = Math.round(totalCarbon).toLocaleString();

    // Recipient banner
    const banner = document.getElementById('summaryRecipientBanner');
    const nameEl = document.getElementById('summaryRecipientName');
    if (selectedRecipientPost && banner && nameEl) {
        nameEl.textContent = selectedRecipientPost.project_name || selectedRecipientPost.contact_name || 'องค์กรที่เลือก';
        banner.style.display = 'block';
    } else if (banner) {
        banner.style.display = 'none';
    }

    nextDonateStep(3);
}

async function submitDonation() {
    if (_isSubmitting) return;
    _isSubmitting = true;
    try {
    if (donationItems.length === 0) {
        addDonationItem();
    }
    // Auto-fill defaults so submission always proceeds
    donationItems.forEach(item => {
        if (!item.device_type) item.device_type = 'Computer';
        if (!item.device_weight || item.device_weight <= 0) item.device_weight = 1;
    });

    // Validate specs / condition / OS against the linked request's requirements
    if (selectedRecipientPost) {
        for (let i = 0; i < donationItems.length; i++) {
            const check = checkItemMeetsSpec(donationItems[i]);
            if (!check.ok) {
                showNotification(`อุปกรณ์ชิ้นที่ ${i + 1}: ${check.reason}`, 'error');
                _isSubmitting = false;
                return;
            }
        }
    }

    const donorType = document.getElementById('donorType')?.value || '';
    const donorName = document.getElementById('donorName')?.value?.trim() || '';
    const donorTel = document.getElementById('donorTel')?.value || '';
    const donorEmail = document.getElementById('donorEmail')?.value || '';
    const donorAddressDetail = document.getElementById('donorAddressDetail')?.value?.trim() || '';
    const donorSubdistrict = document.getElementById('donorSubdistrict')?.value?.trim() || '';
    const donorDistrict = document.getElementById('donorDistrict')?.value?.trim() || '';
    const donorProvince = document.getElementById('donorProvince')?.value || '';
    const donorPostcode = document.getElementById('donorPostcode')?.value?.trim() || '';
    const donorAddress = [
        donorAddressDetail,
        donorSubdistrict ? `ตำบล/แขวง ${donorSubdistrict}` : '',
        donorDistrict ? `อำเภอ/เขต ${donorDistrict}` : '',
        donorProvince ? `จังหวัด${donorProvince}` : '',
        donorPostcode
    ].filter(Boolean).join(' ');
    const donorTaxId = document.getElementById('donorTaxId')?.value?.trim() || '';
    const donorOrgName = document.getElementById('donorOrgName')?.value?.trim() || '';
    const optionType = 'donate';

    if (!donorName) {
        const proceed = confirm('ยังไม่ได้กรอกชื่อผู้บริจาค ต้องการดำเนินการต่อโดยใช้ชื่อ "ไม่ระบุ" หรือไม่?');
        if (!proceed) return;
    }
    const finalDonorName = donorName || 'ไม่ระบุ';

    // Prepare items for API — resolve custom values and expand quantities
    const items = [];
    donationItems.forEach(item => {
        const qty = item.quantity || 1;
        const brand = item.device_brand === '__other__' ? (item._customBrand || '') : item.device_brand;
        const model = item.device_model === '__other__' ? (item._customModel || '') : item.device_model;
        const serialNumbers = item.serial_numbers || [''];
        for (let i = 0; i < qty; i++) {
            items.push({
                device_type: item.device_type,
                device_brand: brand,
                device_model: model,
                device_weight: item.device_weight,
                device_condition: item.device_condition,
                serial_number: serialNumbers[i] || ''
            });
        }
    });

    const isOnline = currentUser && supabaseClient;

    // === ONLINE PATH: save to Supabase ===
    if (isOnline) {
        try {
            // Generate tracking ID: GU-DON-DDMMYYYY-NNN (daily sequence)
            let trackingId = await generateTrackingId('DON');

            // Upload photos to Storage (non-blocking — failures are warned, not thrown)
            const photoUrls = await uploadDonationPhotos(trackingId);

            // Calculate total weight and carbon (already expanded by quantity)
            const totalWeight = items.reduce((sum, item) => sum + parseFloat(item.device_weight || 0), 0);
            const totalCarbon = items.reduce((sum, item) => {
                const factor = CARBON_FACTORS[item.device_type] || 100;
                return sum + (parseFloat(item.device_weight || 0) * factor);
            }, 0);

            // Auto-link to corporate account: check donor form email first, then logged-in user email
            let _corpAccountId = null;
            const _emailsToCheck = [...new Set(
                [donorEmail, currentUser?.email].filter(Boolean).map(e => e.trim().toLowerCase())
            )];
            for (const _e of _emailsToCheck) {
                try {
                    const { data: _cm } = await supabaseClient
                        .rpc('match_corporate_by_email', { p_email: _e });
                    if (_cm && _cm.length > 0) { _corpAccountId = _cm[0].id; break; }
                } catch (_) { /* non-critical */ }
            }

            // Base columns (guaranteed in supabase_schema.sql)
            const donationBase = {
                user_id: currentUser.id,
                tracking_id: trackingId,
                device_type: items[0].device_type || 'Computer',
                device_brand: items[0].device_brand || null,
                device_model: items[0].device_model || null,
                device_condition: items[0].device_condition || null,
                device_weight: totalWeight,
                total_items: items.length,
                total_weight: totalWeight,
                donor_type: donorType || null,
                donor_name: finalDonorName,
                donor_tel: donorTel || '',
                donor_email: donorEmail || '',
                donor_address: donorAddress || '',
                option_type: optionType,
                current_status: 'submitted',
                carbon_saved: totalCarbon,
            };

            // Extended columns (only include when non-null, avoids PGRST204 if column missing)
            const donationFull = {
                ...donationBase,
                ...(donorTaxId        ? { donor_tax_id: donorTaxId }                          : {}),
                ...(donorOrgName      ? { donor_org_name: donorOrgName }                       : {}),
                ...(photoUrls.length  ? { photo_urls: photoUrls, photo_url: photoUrls[0] }     : {}),
                ...(selectedRecipientRequestId ? { direct_donation_to_request_id: selectedRecipientRequestId } : {}),
                ...(_corpAccountId    ? { corporate_account_id: _corpAccountId }               : {}),
            };

            // Attempt 1: full insert with all available columns
            let donation, donationError;
            ({ data: donation, error: donationError } = await supabaseClient
                .from('donations').insert(donationFull).select('id').single());

            // Attempt 2: base-schema-only insert (works regardless of which migrations ran)
            if (donationError) {
                console.warn('Full insert failed, retrying with base schema:', donationError.message);
                ({ data: donation, error: donationError } = await supabaseClient
                    .from('donations').insert(donationBase).select('id').single());
            }

            // Attempt 3: duplicate tracking_id — regenerate and retry both variants
            if (donationError?.code === '23505' && donationError?.message?.includes('tracking_id')) {
                console.warn('Duplicate tracking_id, regenerating...');
                trackingId = await generateTrackingId('DON');
                donationBase.tracking_id = trackingId;
                donationFull.tracking_id = trackingId;
                ({ data: donation, error: donationError } = await supabaseClient
                    .from('donations').insert(donationFull).select('id').single());
                if (donationError) {
                    ({ data: donation, error: donationError } = await supabaseClient
                        .from('donations').insert(donationBase).select('id').single());
                }
            }

            if (donationError) throw donationError;

            // Insert donation items
            const itemRows = items.map(item => {
                const factor = CARBON_FACTORS[item.device_type] || 100;
                const carbonSaved = parseFloat(item.device_weight || 0) * factor;
                const row = {
                    donation_id: donation.id,
                    device_type: item.device_type,
                    device_brand: item.device_brand || null,
                    device_model: item.device_model || null,
                    device_weight: parseFloat(item.device_weight),
                    device_condition: item.device_condition || null,
                    carbon_emission_factor: factor,
                    carbon_saved: carbonSaved
                };
                if (item.serial_number) row.serial_number = item.serial_number;
                return row;
            });

            let itemInsertError;
            ({ error: itemInsertError } = await supabaseClient.from('donation_items').insert(itemRows));
            if (itemInsertError) {
                const fallbackRows = itemRows.map(r => { const { serial_number, ...rest } = r; return rest; });
                await supabaseClient.from('donation_items').insert(fallbackRows);
            }

            // Insert initial tracking timeline entry
            await supabaseClient.from('tracking_timeline').insert({
                donation_id: donation.id,
                status: 'submitted',
                status_display_th: 'ส่งคำขอบริจาคแล้ว',
                status_display_en: 'Submitted',
                location: 'Online',
                note: 'Donation request received'
            });

            showNotification('คุณได้ส่งข้อมูลการบริจาคอุปกรณ์เรียบร้อยแล้ว!', 'success');

            // Update quantity_received on linked request (real-time progress bar)
            if (selectedRecipientRequestId) {
                try {
                    // Sum total_items from all donations linked to this request
                    const { data: linkedDons } = await supabaseClient
                        .from('donations')
                        .select('total_items')
                        .eq('direct_donation_to_request_id', selectedRecipientRequestId);

                    const newReceived = (linkedDons || []).reduce((sum, d) => sum + (d.total_items || 1), 0);

                    // Try updating quantity_received (may fail if column doesn't exist)
                    const { data: req } = await supabaseClient
                        .from('requests')
                        .select('quantity')
                        .eq('id', selectedRecipientRequestId)
                        .single();

                    const updateData = {};
                    // Update fulfillment_status based on count
                    if (req && newReceived >= (req.quantity || 0)) {
                        updateData.fulfillment_status = 'fulfilled';
                    } else if (newReceived > 0) {
                        updateData.fulfillment_status = 'partially_fulfilled';
                    }

                    // Try to set quantity_received (graceful if column doesn't exist)
                    updateData.quantity_received = newReceived;
                    const { error: updateErr } = await supabaseClient
                        .from('requests')
                        .update(updateData)
                        .eq('id', selectedRecipientRequestId);

                    if (updateErr) {
                        // Retry without quantity_received column
                        console.warn('quantity_received column may not exist, retrying without:', updateErr.message);
                        delete updateData.quantity_received;
                        await supabaseClient.from('requests').update(updateData).eq('id', selectedRecipientRequestId);
                    }
                } catch (e) { console.warn('Could not update request progress:', e); }
            }
            // Capture recipient post before clearing state
            const recipientPost = selectedRecipientPost;
            selectedRecipientRequestId = null;

            // Save to localStorage cache
            donations.push({
                id: donation.id, userId: currentUser.id, userName: currentUser.name,
                items, totalItems: items.length, donorType, name: finalDonorName,
                tel: donorTel, email: donorEmail, address: donorAddress,
                status: 'submitted', trackingId, createdAt: new Date().toISOString()
            });
            localStorage.setItem('gearup_donations', JSON.stringify(donations));

            // Show shipping label modal (user chooses to print or skip → goes home)
            showShippingLabelModal({
                donationId: donation.id,
                trackingId, donor_name: finalDonorName, donor_address: donorAddress,
                donor_tel: donorTel,
                device_weight: totalWeight, total_items: items.length,
                carbon_saved: totalCarbon,
                recipient_post: recipientPost,
                items: donationItems.map(i => ({...i})),
            });

            return; // Online success — don't fall through to offline

        } catch (error) {
            console.error('Donation submit error:', error);
            const errDetail = error?.message || error?.details || error?.code || 'unknown error';
            showNotification(`⚠️ บันทึกไม่สำเร็จ: ${errDetail}`, 'error');
            return;
        }

        // If online succeeded, the function already returned via setTimeout
        // If we reach here, online failed — use offline fallback
    }

    // === OFFLINE PATH: user not logged in / no Supabase (save to localStorage) ===
    {
        const _now = new Date();
        const _dd = String(_now.getDate()).padStart(2, '0');
        const _mm = String(_now.getMonth() + 1).padStart(2, '0');
        const _seq = String(Math.floor(Math.random() * 99) + 900).padStart(3, '0'); // 900-998 range for offline
        const trackingId = `GU-DON-${_dd}${_mm}${_now.getFullYear()}-${_seq}`;

        const totalWeight = items.reduce((sum, item) => sum + parseFloat(item.device_weight || 0), 0);
        const totalCarbon = items.reduce((sum, item) => {
            const factor = CARBON_FACTORS[item.device_type] || 100;
            return sum + (parseFloat(item.device_weight || 0) * factor);
        }, 0);

        const offlineDonation = {
            id: 'offline-' + Date.now(),
            trackingId,
            items, totalItems: items.length,
            donorType, name: finalDonorName, tel: donorTel,
            email: donorEmail, address: donorAddress,
            donorOrgName, donorTaxId,
            totalWeight, totalCarbon,
            status: 'submitted_offline',
            createdAt: new Date().toISOString()
        };

        donations.push(offlineDonation);
        localStorage.setItem('gearup_donations', JSON.stringify(donations));

        const pendingUploads = JSON.parse(localStorage.getItem('gearup_pending_donations') || '[]');
        pendingUploads.push(offlineDonation);
        localStorage.setItem('gearup_pending_donations', JSON.stringify(pendingUploads));

        showNotification('บันทึกข้อมูลในเครื่องแล้ว (ออฟไลน์)', 'success');
        showShippingLabelModal({
            trackingId, donor_name: finalDonorName, donor_address: donorAddress,
            donor_tel: donorTel,
            device_weight: totalWeight, total_items: items.length,
            carbon_saved: totalCarbon,
            recipient_post: selectedRecipientPost,
            items: donationItems.map(i => ({...i})),
        });
    }
    } finally {
        _isSubmitting = false;
    }
}

function resetDonateForm() {
    // Reset multi-item state
    donationItems = [];
    addDonationItem();
    // Reset photos
    donationPhotos.forEach(p => URL.revokeObjectURL(p.objectUrl));
    donationPhotos = [];
    renderDonationPhotos();
    const btnPhotos = document.getElementById('btnSelectPhotos');
    if (btnPhotos) btnPhotos.textContent = 'เลือกรูปภาพ';
    // Reset donor fields
    const donorName = document.getElementById('donorName');
    const donorTel = document.getElementById('donorTel');
    const donorEmail = document.getElementById('donorEmail');
    const donorTaxId = document.getElementById('donorTaxId');
    const donorOrgName = document.getElementById('donorOrgName');
    if (donorName) donorName.value = '';
    if (donorTel) donorTel.value = '';
    if (donorEmail) donorEmail.value = '';
    if (donorTaxId) donorTaxId.value = '';
    if (donorOrgName) donorOrgName.value = '';
    // Reset donation target
    selectedRecipientPost = null;
    const banner = document.getElementById('donationTargetBanner');
    if (banner) banner.style.display = 'none';
    // Reset split address fields
    const addrDetail = document.getElementById('donorAddressDetail');
    const subdistrict = document.getElementById('donorSubdistrict');
    const district = document.getElementById('donorDistrict');
    const province = document.getElementById('donorProvince');
    const postcode = document.getElementById('donorPostcode');
    if (addrDetail) addrDetail.value = '';
    if (province) province.value = '';
    if (district) { district.innerHTML = '<option value="">-- เลือกอำเภอ/เขต --</option>'; district.disabled = true; }
    if (subdistrict) { subdistrict.innerHTML = '<option value="">-- เลือกตำบล/แขวง --</option>'; subdistrict.disabled = true; }
    if (postcode) postcode.value = '';
}

// === REQUEST FORM STEPS ===
function nextReqStep(step) {
    if (step === 2) {
        const contactName = document.getElementById('reqName')?.value?.trim() || '';
        const nationalId = document.getElementById('reqID')?.value?.trim() || '';
        const position = document.getElementById('reqPosition')?.value?.trim() || '';
        const email = document.getElementById('reqEmail')?.value?.trim() || '';
        const phone = document.getElementById('reqPhone')?.value?.trim() || '';
        const province = document.getElementById('reqProvince')?.value || '';
        if (!contactName) { showNotification('กรุณากรอกชื่อผู้ติดต่อ', 'error'); return; }
        const _idErr = checkIdVal(nationalId, 13);
        if (_idErr) { applyFieldHint('reqIDHint', _idErr); showNotification(_idErr, 'error'); return; }
        if (!position) { showNotification('กรุณากรอกตำแหน่ง', 'error'); return; }
        const _emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !_emailRx.test(email)) { showNotification('กรุณากรอกอีเมลให้ถูกต้อง', 'error'); return; }
        if (!phone || phone.length !== 10) { applyFieldHint('reqPhoneHint', 'กรอกยังไม่ครบ 10 หลัก'); showNotification('กรุณากรอกเบอร์โทรศัพท์ 10 หลักให้ครบถ้วน', 'error'); return; }
        if (phone[0] !== '0') { applyFieldHint('reqPhoneHint', 'เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0'); showNotification('เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0', 'error'); return; }
        if (!province) { showNotification('กรุณาเลือกจังหวัด', 'error'); return; }
    } else if (step === 3) {
        const equipmentChecked = Array.from(document.querySelectorAll('input[name="reqEquipment"]:checked'));
        if (equipmentChecked.length === 0) { showNotification('กรุณาเลือกอุปกรณ์ที่ต้องการอย่างน้อย 1 ชนิด', 'error'); return; }
        const projectName = document.getElementById('projectName')?.value?.trim() || '';
        if (!projectName) { showNotification('กรุณากรอกชื่อโครงการ', 'error'); return; }
        const projectOverview = document.getElementById('projectOverview')?.value?.trim() || '';
        if (!projectOverview) { showNotification('กรุณากรอกภาพรวมโครงการ', 'error'); return; }
        const deviceSections = Array.from(document.querySelectorAll('#reqDeviceSections .req-device-section'));
        for (const sec of deviceSections) {
            const dt = sec.dataset.deviceType;
            const qty = parseInt(sec.querySelector('.req-dev-quantity')?.value || '0');
            if (!qty || qty < 1) { showNotification(`กรุณากรอกจำนวนอุปกรณ์ที่ต้องการสำหรับ${dt}`, 'error'); return; }
        }
        const docFiles = window._getReqDocFiles ? window._getReqDocFiles() : [];
        if (!docFiles || docFiles.length === 0) {
            showNotification('กรุณาแนบเอกสารประกอบคำขอ (หนังสือราชการที่มีลายเซ็น ผอ. หรือรูปภาพโรงเรียน) อย่างน้อย 1 ไฟล์', 'error');
            return;
        }
        populateReqReview();
    }
    document.querySelectorAll('.request-step').forEach(s => s.classList.remove('active'));
    document.getElementById('req-step' + step).classList.add('active');
    updateFormStepBar('req', step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function populateReqReview() {
    const orgType = document.querySelector('.toggle-btn.active')?.textContent?.trim() || '—';
    const orgName = document.getElementById('reqOrgName')?.value?.trim() || '—';
    const name = document.getElementById('reqName')?.value?.trim() || '—';
    const position = document.getElementById('reqPosition')?.value?.trim() || '—';
    const nationalId = document.getElementById('reqID')?.value?.trim() || '—';
    const email = document.getElementById('reqEmail')?.value?.trim() || '—';
    const phone = document.getElementById('reqPhone')?.value?.trim() || '—';

    const addrDetail = document.getElementById('reqAddressDetail')?.value?.trim() || '';
    const subdistrict = document.getElementById('reqSubdistrict')?.value?.trim() || '';
    const district = document.getElementById('reqDistrict')?.value?.trim() || '';
    const province = document.getElementById('reqProvince')?.value || '';
    const postcode = document.getElementById('reqPostcode')?.value?.trim() || '';
    const address = [
        addrDetail,
        subdistrict ? `ตำบล/แขวง ${subdistrict}` : '',
        district ? `อำเภอ/เขต ${district}` : '',
        province ? `จังหวัด${province}` : '',
        postcode,
    ].filter(Boolean).join(' ') || '—';

    const projectName = document.getElementById('projectName')?.value?.trim() || '—';
    const projectOverview = document.getElementById('projectOverview')?.value?.trim() || '—';
    const shipping = document.getElementById('reqShipping')?.value || '—';
    const docFile = document.getElementById('reqUploadDoc')?.files?.[0];
    const docName = docFile ? `📎 ${docFile.name}` : 'ไม่มีเอกสารแนบ';

    const maskedId = nationalId.length === 13
        ? `${nationalId[0]}-${nationalId.slice(1,5)}-${nationalId.slice(5,10)}-${nationalId.slice(10,12)}-${nationalId[12]}`
        : nationalId;

    document.getElementById('reqSumOrgType').textContent = orgType;
    document.getElementById('reqSumOrgName').textContent = orgName;
    document.getElementById('reqSumName').textContent = name;
    document.getElementById('reqSumPosition').textContent = position;
    document.getElementById('reqSumID').textContent = maskedId;
    document.getElementById('reqSumEmail').textContent = email;
    document.getElementById('reqSumPhone').textContent = phone;
    document.getElementById('reqSumAddress').textContent = address;
    document.getElementById('reqSumProjectName').textContent = projectName;
    document.getElementById('reqSumProjectOverview').textContent = projectOverview;
    document.getElementById('reqSumShipping').textContent = shipping;
    document.getElementById('reqSumDoc').textContent = docName;

    const deviceIcons = { 'คอมพิวเตอร์': '🖥️', 'แล็ปท็อป': '💻', 'แท็บเล็ต': '📱', 'โทรศัพท์มือถือ': '📱' };
    const deviceSections = Array.from(document.querySelectorAll('#reqDeviceSections .req-device-section'));
    let totalQty = 0;
    const devHtml = deviceSections.map(sec => {
        const dt = sec.dataset.deviceType;
        const qty = parseInt(sec.querySelector('.req-dev-quantity')?.value || '0');
        const condition = sec.querySelector('.req-dev-condition')?.value || '—';
        const specEl = sec.querySelector('.req-dev-spec');
        const specLabel = specEl?.options[specEl.selectedIndex]?.text || '—';
        const detail = sec.querySelector('.req-dev-detail')?.value?.trim() || '';
        // OS / brand / version (phones & tablets only)
        const os = sec.querySelector('.req-dev-os')?.value || '';
        const brandEl = sec.querySelector('.req-dev-brand');
        const brand = brandEl ? brandEl.options[brandEl.selectedIndex]?.text || '' : '';
        const verEl = sec.querySelector('.req-dev-os-version');
        const verLabel = verEl ? verEl.options[verEl.selectedIndex]?.text || '' : '';
        const osParts = [
            os && os !== 'any' ? (os === 'ios' ? (dt === 'แท็บเล็ต' ? 'iPadOS' : 'iOS') : 'Android') : '',
            brand && brand !== 'ไม่จำกัดยี่ห้อ' ? brand : '',
            verLabel && verLabel !== 'ไม่จำกัดเวอร์ชั่น' ? verLabel : '',
        ].filter(Boolean).join(' · ');
        totalQty += qty;
        return `<div class="sum-item-row">
            <span class="sum-item-badge">${deviceIcons[dt] || '📦'} ${dt}</span>
            <span class="sum-item-detail">สภาพ: ${condition} · สเปก: ${specLabel}${osParts ? ' · ' + osParts : ''}${detail ? ' · ' + detail : ''}</span>
            <span class="sum-item-weight">${qty} เครื่อง</span>
        </div>`;
    }).join('');
    document.getElementById('reqSumDevices').innerHTML = devHtml || '<p style="color:#aaa;font-size:0.9rem;padding:0.5rem 0;">ไม่มีข้อมูลอุปกรณ์</p>';
    document.getElementById('reqSumTotalQty').textContent = totalQty.toLocaleString();
    document.getElementById('reqSumTotalTypes').textContent = deviceSections.length;
}

function prevReqStep(step) {
    document.querySelectorAll('.request-step').forEach(s => s.classList.remove('active'));
    document.getElementById('req-step' + step).classList.add('active');
    updateFormStepBar('req', step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderReqDeviceSections() {
    const checked = Array.from(document.querySelectorAll('input[name="reqEquipment"]:checked')).map(cb => cb.value);
    const container = document.getElementById('reqDeviceSections');
    if (!container) return;

    // Preserve existing values before re-render
    const saved = {};
    container.querySelectorAll('.req-device-section').forEach(sec => {
        const dt = sec.dataset.deviceType;
        saved[dt] = {
            condition:  sec.querySelector('.req-dev-condition')?.value || 'พร้อมใช้งาน',
            spec:       sec.querySelector('.req-dev-spec')?.value || 'any',
            os:         sec.querySelector('.req-dev-os')?.value || 'any',
            brand:      sec.querySelector('.req-dev-brand')?.value || '',
            os_version: sec.querySelector('.req-dev-os-version')?.value || 'any',
            detail:     sec.querySelector('.req-dev-detail')?.value || '',
            quantity:   sec.querySelector('.req-dev-quantity')?.value || '',
        };
    });

    if (checked.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = checked.map(dt => {
        const s = saved[dt] || {};
        const specOptions = (REQ_DEVICE_SPECS[dt] || []).map(o =>
            `<option value="${o.value}"${s.spec === o.value ? ' selected' : ''}>${o.label}</option>`
        ).join('');
        const conditions = ['พร้อมใช้งาน', 'ดีมีรอยขีดข่วน', 'ใช้งานได้บางส่วน', 'ยอมรับทุกสภาพ'];
        const condOptions = conditions.map(c =>
            `<option value="${c}"${(s.condition || 'พร้อมใช้งาน') === c ? ' selected' : ''}>${c}</option>`
        ).join('');
        const icon = dt === 'คอมพิวเตอร์' ? '🖥️' : dt === 'แล็ปท็อป' ? '💻' : '📱';
        const needsOs = dt === 'โทรศัพท์มือถือ' || dt === 'แท็บเล็ต';
        const osVal = s.os || 'any';
        const brandVal = s.brand || '';
        const versionVal = s.os_version || 'any';
        const isTablet = dt === 'แท็บเล็ต';
        const iosLabel = isTablet ? 'iPadOS (iPad)' : 'iOS (iPhone)';
        const autoAppleLabel = isTablet ? 'Apple (iPad)' : 'Apple (iPhone)';
        const versionKey = osVal === 'ios' ? (isTablet ? 'ipados' : 'ios') : osVal;
        const versionOpts = (REQ_OS_VERSIONS[versionKey] || []).map(v =>
            `<option value="${v.value}"${versionVal === v.value ? ' selected' : ''}>${v.label}</option>`
        ).join('');
        const androidBrands = (REQ_BRANDS[dt]?.android || []).map(b =>
            `<option value="${b}"${brandVal === b ? ' selected' : ''}>${b}</option>`
        ).join('');

        const osSection = needsOs ? `
  <div class="form-group">
    <label>ระบบปฏิบัติการ :</label>
    <select class="req-dev-os" onchange="updateOsBrandVersion(this)">
      <option value="any"${osVal === 'any' ? ' selected' : ''}>ไม่จำกัด</option>
      <option value="android"${osVal === 'android' ? ' selected' : ''}>Android</option>
      <option value="ios"${osVal === 'ios' ? ' selected' : ''}>${iosLabel}</option>
    </select>
  </div>
  <div class="form-group req-dev-brand-wrap" style="${osVal === 'android' ? '' : 'display:none'}">
    <label>ยี่ห้อที่ต้องการ :</label>
    <select class="req-dev-brand">
      ${osVal === 'ios'
        ? `<option value="apple">${autoAppleLabel}</option>`
        : androidBrands}
    </select>
  </div>
  <div class="form-group req-dev-version-wrap" style="${osVal !== 'any' ? '' : 'display:none'}">
    <label>เวอร์ชั่น OS ขั้นต่ำ :</label>
    <select class="req-dev-os-version">${versionOpts}</select>
  </div>` : '';

        return `
<div class="req-device-section" data-device-type="${dt}">
  <div class="req-device-header"><span class="req-device-icon">${icon}</span><strong>${dt}</strong></div>
  <div class="form-group">
    <label>สภาพอุปกรณ์ที่ต้องการ :</label>
    <select class="req-dev-condition">${condOptions}</select>
  </div>
  <div class="form-group">
    <label>สเปกขั้นต่ำที่ต้องการ :</label>
    <select class="req-dev-spec" onchange="updateSpecHint(this)">${specOptions}</select>
    <div class="req-spec-hint">${(() => { const h = (REQ_SPEC_HINTS[dt] || {})[s.spec || 'any']; return h ? `<span>💡</span> ${h}` : ''; })()}</div>
  </div>${osSection}
  <div class="form-group">
    <label>รายละเอียดเพิ่มเติม :</label>
    <textarea class="req-dev-detail" placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)">${s.detail || ''}</textarea>
  </div>
  <div class="form-group">
    <label>จำนวนที่ต้องการ (เครื่อง) :</label>
    <input type="number" class="req-dev-quantity" placeholder="50" min="1" value="${s.quantity || ''}">
  </div>
</div>`;
    }).join('');
}

function updateSpecHint(selectEl) {
    const sec = selectEl.closest('.req-device-section');
    const dt = sec.dataset.deviceType;
    const hint = (REQ_SPEC_HINTS[dt] || {})[selectEl.value] || '';
    const hintDiv = sec.querySelector('.req-spec-hint');
    if (hintDiv) hintDiv.innerHTML = hint ? `<span>💡</span> ${hint}` : '';
}

function updateOsBrandVersion(selectEl) {
    const sec = selectEl.closest('.req-device-section');
    const dt = sec.dataset.deviceType;
    const os = selectEl.value;
    const isTablet = dt === 'แท็บเล็ต';
    const brandWrap   = sec.querySelector('.req-dev-brand-wrap');
    const versionWrap = sec.querySelector('.req-dev-version-wrap');
    const brandSelect   = sec.querySelector('.req-dev-brand');
    const versionSelect = sec.querySelector('.req-dev-os-version');

    if (os === 'any') {
        brandWrap.style.display   = 'none';
        versionWrap.style.display = 'none';
        return;
    }

    // Brand
    if (os === 'ios') {
        brandSelect.innerHTML = `<option value="apple">${isTablet ? 'Apple (iPad)' : 'Apple (iPhone)'}</option>`;
        brandWrap.style.display = 'none';
    } else {
        const brands = REQ_BRANDS[dt]?.android || [];
        brandSelect.innerHTML = brands.map(b => `<option value="${b}">${b}</option>`).join('');
        brandWrap.style.display = '';
    }

    // Version
    const versionKey = os === 'ios' ? (isTablet ? 'ipados' : 'ios') : 'android';
    const versions = REQ_OS_VERSIONS[versionKey] || [];
    versionSelect.innerHTML = versions.map(v =>
        `<option value="${v.value}">${v.label}</option>`
    ).join('');
    versionWrap.style.display = '';
}

async function submitRequest() {
    if (_isSubmitting) return;
    _isSubmitting = true;
    try {
    const orgType = document.querySelector('.toggle-btn.active')?.textContent || '';
    const contactName = document.getElementById('reqName')?.value || '';
    const orgName = document.getElementById('reqOrgName')?.value?.trim() || '';
    const nationalId = document.getElementById('reqID')?.value || '';
    const position = document.getElementById('reqPosition')?.value || '';
    const email = document.getElementById('reqEmail')?.value || '';
    const phone = document.getElementById('reqPhone')?.value || '';
    const reqAddressDetail = document.getElementById('reqAddressDetail')?.value?.trim() || '';
    const reqSubdistrict = document.getElementById('reqSubdistrict')?.value?.trim() || '';
    const reqDistrict = document.getElementById('reqDistrict')?.value?.trim() || '';
    const reqProvince = document.getElementById('reqProvince')?.value || '';
    const reqPostcode = document.getElementById('reqPostcode')?.value?.trim() || '';
    const address = [
        reqAddressDetail,
        reqSubdistrict ? `ตำบล/แขวง ${reqSubdistrict}` : '',
        reqDistrict ? `อำเภอ/เขต ${reqDistrict}` : '',
        reqProvince ? `จังหวัด${reqProvince}` : '',
        reqPostcode,
    ].filter(Boolean).join(' ');
    const projectName = document.getElementById('projectName')?.value || '';
    const projectOverview = document.getElementById('projectOverview')?.value || '';
    const equipmentTypes = Array.from(document.querySelectorAll('input[name="reqEquipment"]:checked')).map(cb => cb.value);
    if (equipmentTypes.length === 0) { showNotification('กรุณาเลือกอุปกรณ์ที่ต้องการอย่างน้อย 1 ชนิด', 'error'); return; }
    const equipmentType = equipmentTypes.join(',');
    // Collect per-device data from dynamic sections
    const deviceSections = Array.from(document.querySelectorAll('#reqDeviceSections .req-device-section'));
    const perDeviceData = [];
    for (const sec of deviceSections) {
        const dt = sec.dataset.deviceType;
        const qty = parseInt(sec.querySelector('.req-dev-quantity')?.value || '0');
        if (!qty || qty < 1) {
            showNotification(`กรุณากรอกจำนวนอุปกรณ์ที่ต้องการสำหรับ${dt}`, 'error');
            return;
        }
        const entry = {
            type: dt,
            condition: sec.querySelector('.req-dev-condition')?.value || 'พร้อมใช้งาน',
            spec: sec.querySelector('.req-dev-spec')?.value || 'any',
            spec_label: (REQ_DEVICE_SPECS[dt] || []).find(o => o.value === sec.querySelector('.req-dev-spec')?.value)?.label || '',
            detail: sec.querySelector('.req-dev-detail')?.value || '',
            quantity: qty,
        };
        if (dt === 'โทรศัพท์มือถือ' || dt === 'แท็บเล็ต') {
            const os = sec.querySelector('.req-dev-os')?.value || 'any';
            entry.os = os;
            if (os !== 'any') {
                entry.brand      = sec.querySelector('.req-dev-brand')?.value || '';
                entry.os_version = sec.querySelector('.req-dev-os-version')?.value || 'any';
            }
        }
        perDeviceData.push(entry);
    }
    const quantity = perDeviceData.reduce((sum, d) => sum + d.quantity, 0);
    const equipmentDetail = JSON.stringify(perDeviceData);
    const shippingMethod = document.getElementById('reqShipping')?.value || '';

    // Validate Step 2 fields
    if (!projectName.trim()) { showNotification('กรุณากรอกชื่อโครงการ', 'error'); return; }
    if (!projectOverview.trim()) { showNotification('กรุณากรอกภาพรวมโครงการ', 'error'); return; }

    if (!supabaseClient) {
        showNotification('ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่อีกครั้ง', 'error');
        return;
    }
    if (!currentUser) {
        showNotification('กรุณาเข้าสู่ระบบก่อน จึงจะสามารถส่งใบสมัครได้', 'error');
        document.getElementById('btnLogin')?.click();
        return;
    }

    const submitBtn = document.getElementById('btnConfirmRequest');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ กำลังส่ง...'; }

    try {

        // Generate tracking ID client-side: GU-REQ-DD/MM/YYYY-XXXX
        const trackingId = await generateTrackingId('REQ');

        // Upload documents to Supabase Storage (multi-file)
        let documentUrl = null;
        const docFiles = window._getReqDocFiles ? window._getReqDocFiles() : [];
        if (docFiles.length > 0) {
            const urls = [];
            for (let i = 0; i < docFiles.length; i++) {
                const f = docFiles[i];
                const ext = f.name.split('.').pop();
                const path = `${currentUser.id}/${trackingIdToPath(trackingId)}/document-${i}.${ext}`;
                const { error: uploadError } = await supabaseClient.storage
                    .from('donation-photos')
                    .upload(path, f, { upsert: true });
                if (!uploadError) {
                    const { data: { publicUrl } } = supabaseClient.storage
                        .from('donation-photos')
                        .getPublicUrl(path);
                    urls.push(publicUrl);
                }
            }
            documentUrl = urls.length === 1 ? urls[0] : JSON.stringify(urls);
        }

        // Insert request
        const reqBase = {
            user_id: currentUser.id,
            tracking_id: trackingId,
            org_type: orgType,
            contact_name: contactName,
            national_id: nationalId,
            position, email, phone, address,
            project_name: projectName,
            project_overview: projectOverview,
            equipment_type: equipmentType,
            equipment_detail: equipmentDetail,
            quantity: parseInt(quantity) || 1,
            shipping_method: shippingMethod,
            document_url: documentUrl,
            current_status: 'submitted',
            is_public_post: false
        };
        let { data: reqData, error: reqError } = await supabaseClient
            .from('requests')
            .insert({ ...reqBase, ...(orgName ? { org_name: orgName } : {}) })
            .select('id')
            .single();
        // Fallback if org_name column doesn't exist yet
        if (reqError?.code === 'PGRST204' || reqError?.message?.includes('org_name')) {
            ({ data: reqData, error: reqError } = await supabaseClient
                .from('requests').insert(reqBase).select('id').single());
        }

        if (reqError) throw reqError;

        // Insert initial tracking timeline entry
        await supabaseClient.from('tracking_timeline').insert({
            request_id: reqData.id,
            status: 'submitted',
            status_display_th: 'ส่งคำขอรับแล้ว',
            status_display_en: 'Submitted',
            location: 'Online',
            note: 'Equipment request submitted'
        });

        // Link request to school (create school if first time, update if returning)
        try {
            const schoolName = orgName || contactName;
            await supabaseClient.rpc('upsert_school_for_request', {
                p_request_id: reqData.id,
                p_name:       schoolName,
                p_email:      email.toLowerCase().trim(),
                p_phone:      phone || null,
                p_address:    address || null,
                p_province:   reqProvince || null,
            });
        } catch (schoolErr) {
            console.warn('upsert_school_for_request failed (non-critical):', schoolErr.message);
        }

        showNotification('ส่งใบสมัครเรียบร้อยแล้ว! กำลังรอการอนุมัติจาก Admin ก่อนเผยแพร่บนเว็บไซต์', 'success');

        // Also save to localStorage as cache
        requests.push({
            id: reqData.id, userId: currentUser.id, userName: currentUser.name,
            orgType, name: contactName, idNumber: nationalId,
            position, email, phone, address,
            projectName, projectOverview,
            equipment: equipmentType, detail: equipmentDetail,
            quantity, shipping: shippingMethod,
            status: 'submitted', trackingId, createdAt: new Date().toISOString()
        });
        localStorage.setItem('gearup_requests', JSON.stringify(requests));

        setTimeout(() => {
            navigateToPage('home');
            prevReqStep(1);
            resetRequestForm();
        }, 2000);
    } catch (error) {
        console.error('Request submit error:', error);
        let msg = 'ไม่สามารถส่งคำขอรับบริจาคได้ กรุณาลองใหม่อีกครั้ง';
        if (error.code === '23505') msg = 'เกิดข้อผิดพลาด: เลข Tracking ซ้ำ กรุณาลองส่งใหม่อีกครั้ง';
        else if (error.message) msg = `เกิดข้อผิดพลาด: ${error.message}`;
        showNotification(msg, 'error');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '✅ ยืนยันและส่งใบสมัคร'; }
    }
    } finally {
        _isSubmitting = false;
    }
}

function resetRequestForm() {
    document.getElementById('reqName').value = '';
    const reqOrgNameEl = document.getElementById('reqOrgName');
    if (reqOrgNameEl) reqOrgNameEl.value = '';
    document.getElementById('reqID').value = '';
    document.getElementById('reqPosition').value = '';
    document.getElementById('reqEmail').value = '';
    document.getElementById('reqPhone').value = '';
    document.getElementById('reqAddressDetail').value = '';
    document.getElementById('reqProvince').value = '';
    const reqDist = document.getElementById('reqDistrict');
    if (reqDist) { reqDist.innerHTML = '<option value="">-- เลือกอำเภอ/เขต --</option>'; reqDist.disabled = true; }
    const reqSub = document.getElementById('reqSubdistrict');
    if (reqSub) { reqSub.innerHTML = '<option value="">-- เลือกตำบล/แขวง --</option>'; reqSub.disabled = true; }
    document.getElementById('reqPostcode').value = '';
    document.getElementById('projectName').value = '';
    document.getElementById('projectOverview').value = '';
    document.querySelectorAll('input[name="reqEquipment"]').forEach(cb => { cb.checked = false; });
    const devSections = document.getElementById('reqDeviceSections');
    if (devSections) devSections.innerHTML = '';
}

// === CONTACT FORM ===
function submitContact(e) {
    e.preventDefault();

    const firstName = document.getElementById('firstName')?.value || '';
    const lastName = document.getElementById('lastName')?.value || '';
    const email = document.getElementById('contactEmail')?.value || '';
    const phone = document.getElementById('contactPhone')?.value || '';
    const message = document.getElementById('contactMessage')?.value || '';

    if (!firstName || !lastName || !email || !message) {
        showNotification('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', 'error');
        return;
    }
    const phoneErr = checkPhoneVal(phone.trim());
    if (phone.trim() && phoneErr) {
        applyFieldHint('contactPhoneHint', phoneErr);
        showNotification(phoneErr, 'error');
        return;
    }

    showNotification('ส่งข้อความสำเร็จ! เราจะตอบกลับโดยเร็ว', 'success');

    // Reset form
    document.getElementById('firstName').value = '';
    document.getElementById('lastName').value = '';
    document.getElementById('contactEmail').value = '';
    document.getElementById('contactPhone').value = '';
    document.getElementById('contactMessage').value = '';
}

// === NOTIFICATIONS ===

function toggleOverview(btn) {
    const text = btn.previousElementSibling;
    if (!text) return;
    const isExpanded = text.classList.toggle('expanded');
    btn.textContent = isExpanded ? '▲ ย่อ' : '▼ อ่านเพิ่มเติม';
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Style
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#2f5233' : type === 'info' ? '#1971c2' : '#c92a2a'};
        color: white;
        padding: 1rem 2rem;
        padding-right: 2.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 3000;
        font-family: 'Crimson Text', serif;
        font-size: 1.1rem;
        animation: slideInRight 0.4s ease;
        max-width: 400px;
        cursor: pointer;
    `;

    // Message text
    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    notification.appendChild(msgSpan);

    // Close button
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
        position: absolute;
        top: 8px;
        right: 10px;
        cursor: pointer;
        font-size: 0.9rem;
        opacity: 0.8;
    `;
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        notification.style.animation = 'slideOutRight 0.4s ease';
        setTimeout(() => notification.remove(), 400);
    };
    notification.appendChild(closeBtn);
    notification.style.position = 'fixed';

    // Add to body
    document.body.appendChild(notification);

    // Auto-remove: success/info auto-dismiss after 4s, errors stay until closed manually
    if (type !== 'error') {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.4s ease';
                setTimeout(() => notification.remove(), 400);
            }
        }, 4000);
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// === UTILITY FUNCTIONS ===
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Scroll to form buttons
document.querySelectorAll('.scroll-to-form').forEach(btn => {
    btn.addEventListener('click', () => {
        setTimeout(() => {
            const form = document.querySelector('.donate-container, .request-container');
            if (form) {
                form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    });
});

// === KNOWLEDGE SEARCH ===
const knowledgeSearch = document.getElementById('knowledgeSearch');
knowledgeSearch?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const articles = document.querySelectorAll('.article-card');

    articles.forEach(article => {
        const title = article.querySelector('h3').textContent.toLowerCase();
        const content = article.querySelector('p').textContent.toLowerCase();

        if (title.includes(searchTerm) || content.includes(searchTerm)) {
            article.style.display = 'block';
        } else {
            article.style.display = 'none';
        }
    });
});

// === TRACKING SYSTEM ===
async function searchTracking() {
    const input = document.getElementById('trackingInput').value.trim();

    if (!input) {
        showNotification('กรุณากรอกเลข Tracking ID หรืออีเมล', 'error');
        return;
    }

    // Show loading, hide others
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('trackResults').style.display = 'none';
    document.getElementById('trackMultiple').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';

    try {
        let results = [];

        // Check if input looks like a tracking ID
        if (input.toUpperCase().startsWith('GU-DON')) {
            const { data: donation, error } = await supabaseClient
                .from('donations')
                .select('*, tracking_timeline(*)')
                .eq('tracking_id', input.toUpperCase())
                .single();

            if (!error && donation) {
                const { data: items } = await supabaseClient
                    .from('donation_items')
                    .select('*')
                    .eq('donation_id', donation.id);

                results = [{
                    ...donation,
                    type: 'donation',
                    timeline: (donation.tracking_timeline || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
                    items: items || []
                }];
                delete results[0].tracking_timeline;
            }
        } else if (input.toUpperCase().startsWith('GU-REQ')) {
            const { data: request, error } = await supabaseClient
                .from('requests')
                .select('*, tracking_timeline(*)')
                .eq('tracking_id', input.toUpperCase())
                .single();

            if (!error && request) {
                results = [{
                    ...request,
                    type: 'request',
                    timeline: (request.tracking_timeline || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                }];
                delete results[0].tracking_timeline;
            }
        } else {
            // Search by email — could be donation or request
            const { data: donationsByEmail } = await supabaseClient
                .from('donations')
                .select('id, tracking_id, donor_name, device_type, current_status, created_at')
                .eq('donor_email', input.toLowerCase());

            const { data: requestsByEmail } = await supabaseClient
                .from('requests')
                .select('id, tracking_id, contact_name, equipment_type, current_status, created_at')
                .eq('email', input.toLowerCase());

            if (donationsByEmail) {
                results.push(...donationsByEmail.map(d => ({ ...d, type: 'donation' })));
            }
            if (requestsByEmail) {
                results.push(...requestsByEmail.map(r => ({ ...r, type: 'request' })));
            }
        }

        document.getElementById('loadingState').style.display = 'none';

        if (results.length === 0) {
            // Try localStorage fallback
            const mockData = getMockTrackingData(input);
            if (mockData) {
                displayTrackingResult(mockData);
            } else {
                showTrackingEmpty();
            }
        } else if (results.length === 1 && results[0].timeline) {
            displayTrackingResult(results[0]);
        } else if (results.length === 1) {
            // Single result without timeline — fetch it
            const r = results[0];
            const { data: fullResult } = await supabaseClient
                .from(r.type === 'donation' ? 'donations' : 'requests')
                .select('*, tracking_timeline(*)')
                .eq('id', r.id)
                .single();

            if (fullResult) {
                displayTrackingResult({
                    ...fullResult,
                    type: r.type,
                    timeline: (fullResult.tracking_timeline || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                });
            } else {
                displayTrackingResult(r);
            }
        } else {
            displayMultipleResults(results);
        }
    } catch (error) {
        console.error('Tracking search error:', error);
        document.getElementById('loadingState').style.display = 'none';

        // Fallback to localStorage mock data
        const mockData = getMockTrackingData(input);
        if (mockData) {
            displayTrackingResult(mockData);
        } else {
            showTrackingEmpty();
        }
    }
}

// Display a single tracking result
function displayTrackingResult(data) {
    document.getElementById('trackResults').style.display = 'block';
    document.getElementById('trackMultiple').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';

    // Store donation DB id and show update-tracking section for donations missing shipping_tracking_id
    _currentTrackDonationId = (data?.type === 'donation') ? (data?.id || null) : null;
    const updateSection = document.getElementById('updateTrackingSection');
    if (updateSection) {
        updateSection.style.display = (data?.type === 'donation' && data && !data.shipping_tracking_id) ? 'block' : 'none';
    }

    // Fill order details (store extra data for certificate)
    const trackingEl = document.getElementById('displayTrackingId');
    trackingEl.textContent = data.tracking_id;
    trackingEl.dataset.certNumber = data.certificate_number || '';
    trackingEl.dataset.donationId = data.donation_id || data.id || '';
    document.getElementById('displayOrderType').textContent =
        data.type === 'donation' ? 'การบริจาค' : 'คำขอรับอุปกรณ์';
    document.getElementById('displayCreatedDate').textContent = formatThaiDate(data.created_at);
    document.getElementById('displayDevice').textContent =
        data.device_type || data.equipment_type || '-';
    document.getElementById('displayDonor').textContent =
        data.donor_name || data.contact_name || '-';

    // Status badge
    const badge = document.getElementById('displayStatusBadge');
    badge.textContent = getStatusDisplayTh(data.current_status);
    badge.className = 'status-badge ' + getStatusBadgeClass(data.current_status);

    // Render timeline
    const statusFlow = data.type === 'donation'
        ? ['submitted', 'verified', 'scheduled', 'picked_up', 'processing', 'data_wiped', 'ready', 'distributed', 'completed']
        : ['submitted', 'under_review', 'approved', 'matching', 'preparing', 'in_transit', 'delivered', 'completed'];

    renderTimelineSteps(statusFlow, data.timeline || [], data.current_status);
    renderTimelineHistory(data.timeline || []);

    // Carbon display
    const carbonDiv = document.getElementById('carbonDisplay');
    if (data.carbon_saved && data.carbon_saved > 0) {
        carbonDiv.style.display = 'block';
        document.getElementById('carbonSaved').textContent = parseFloat(data.carbon_saved).toFixed(2);
        document.getElementById('ewasteDiv').textContent = parseFloat(data.ewaste_diverted || 0).toFixed(2);
    } else {
        carbonDiv.style.display = 'none';
    }

    // Confirmation section (for requests that are delivered but not confirmed)
    const confirmDiv = document.getElementById('confirmSection');
    if (data.type === 'request' && data.current_status === 'delivered' && !data.confirmed) {
        confirmDiv.style.display = 'block';
    } else {
        confirmDiv.style.display = 'none';
    }

    loadDonorConfirmPanel(data);
}

async function loadDonorConfirmPanel(data) {
    if (data.type !== 'donation') return;
    if (!['distributed', 'completed'].includes(data.current_status)) return;
    if (!data.direct_donation_to_request_id) return;

    try {
        const [{ data: conf }, { data: req }] = await Promise.all([
            supabaseClient.from('recipient_confirmations').select('*').eq('request_id', data.direct_donation_to_request_id).maybeSingle(),
            supabaseClient.from('requests').select('contact_name, org_name').eq('id', data.direct_donation_to_request_id).maybeSingle(),
        ]);

        if (!conf || !conf.received_confirmed) return;

        const orgName = req?.org_name || req?.contact_name || 'ผู้รับบริจาค';
        const confirmedDate = conf.confirmed_at ? formatThaiDateTime(conf.confirmed_at) : '—';
        const confirmerSuffix = conf.confirmed_by_name ? ` · โดย ${escapeHtml(conf.confirmed_by_name)}` : '';
        const noteHtml = conf.notes ? `<div class="step-note">${escapeHtml(conf.notes)}</div>` : '';

        const stepsContainer = document.getElementById('timelineSteps');
        if (!stepsContainer) return;

        const stepDiv = document.createElement('div');
        stepDiv.className = 'timeline-step completed';
        stepDiv.innerHTML = `
            <div class="step-circle">&#10003;</div>
            <div class="step-content">
                <div class="step-label">${escapeHtml(orgName)} ยืนยันรับแล้ว</div>
                <div class="step-sublabel">Recipient Confirmed</div>
                <div class="step-date">${confirmedDate}${confirmerSuffix}</div>
                ${noteHtml}
            </div>`;
        stepsContainer.appendChild(stepDiv);
    } catch (_) {}
}

// Display multiple results as a list
function displayMultipleResults(results) {
    document.getElementById('trackResults').style.display = 'none';
    document.getElementById('trackMultiple').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';

    const listDiv = document.getElementById('resultsList');
    listDiv.innerHTML = '';

    results.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.onclick = () => displayTrackingResult(item);

        div.innerHTML = `
            <div class="result-item-info">
                <h4>${escapeHtml(item.tracking_id)}</h4>
                <p>${item.type === 'donation' ? 'การบริจาค' : 'คำขอรับบริจาค'} - ${escapeHtml(item.device_type || item.equipment_type || '-')} - ${formatThaiDate(item.created_at)}</p>
            </div>
            <div class="result-item-status">
                <span class="status-badge ${getStatusBadgeClass(item.current_status)}">${getStatusDisplayTh(item.current_status)}</span>
            </div>
        `;

        listDiv.appendChild(div);
    });
}

// Render visual timeline steps
function renderTimelineSteps(statusFlow, timeline, currentStatus) {
    const container = document.getElementById('timelineSteps');
    container.innerHTML = '';

    const currentIndex = statusFlow.indexOf(currentStatus);

    statusFlow.forEach((status, index) => {
        const timelineEntry = timeline.find(t => t.status === status);
        const isCompleted = index < currentIndex || (index === currentIndex && currentStatus === 'completed');
        const isCurrent = index === currentIndex && currentStatus !== 'completed';
        const isPending = index > currentIndex;

        const stepDiv = document.createElement('div');
        let stepClass = 'timeline-step';
        if (isCompleted) stepClass += ' completed';
        else if (isCurrent) stepClass += ' current';
        else stepClass += ' pending';
        stepDiv.className = stepClass;

        const circleContent = isCompleted ? '&#10003;' : (isCurrent ? (index + 1) : (index + 1));

        stepDiv.innerHTML = `
            <div class="step-circle">${circleContent}</div>
            <div class="step-content">
                <div class="step-label">${getStatusDisplayTh(status)}</div>
                <div class="step-sublabel">${getStatusDisplayEn(status)}</div>
                ${timelineEntry ? `<div class="step-date">${formatThaiDateTime(timelineEntry.created_at)}</div>` : ''}
                ${timelineEntry && timelineEntry.note ? `<div class="step-note">${escapeHtml(timelineEntry.note)}</div>` : ''}
            </div>
        `;

        container.appendChild(stepDiv);
    });
}

// Render detailed timeline history
function renderTimelineHistory(timeline) {
    const container = document.getElementById('timelineHistory');
    container.innerHTML = '';

    if (!timeline || timeline.length === 0) {
        container.innerHTML = '<p style="color: var(--text-light); font-style: italic;">ยังไม่มีประวัติการดำเนินการ</p>';
        return;
    }

    // Show newest first
    const sorted = [...timeline].reverse();

    sorted.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <p class="timeline-status">${escapeHtml(entry.status_display_th || getStatusDisplayTh(entry.status))}</p>
                <p class="timeline-time">${formatThaiDateTime(entry.created_at)}</p>
                ${entry.location ? `<p class="timeline-note">สถานที่: ${escapeHtml(entry.location)}</p>` : ''}
                ${entry.note ? `<p class="timeline-note">${escapeHtml(entry.note)}</p>` : ''}
                ${entry.staff_name ? `<p class="timeline-note">โดย: ${escapeHtml(entry.staff_name)}</p>` : ''}
            </div>
        `;

        container.appendChild(item);
    });
}

// Show empty state
function showTrackingEmpty() {
    document.getElementById('trackResults').style.display = 'none';
    document.getElementById('trackMultiple').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
}

// Status display helpers
function getStatusDisplayTh(status) {
    const map = {
        'submitted': 'ส่งคำขอแล้ว',
        'verified': 'ตรวจสอบเรียบร้อย',
        'scheduled': 'นัดหมายแล้ว',
        'picked_up': 'รับอุปกรณ์แล้ว',
        'processing': 'กำลังตรวจสอบ',
        'data_wiped': 'ลบข้อมูลแล้ว',
        'ready': 'พร้อมส่งมอบ',
        'distributed': 'ส่งมอบแล้ว',
        'completed': 'เสร็จสมบูรณ์',
        'under_review': 'กำลังพิจารณา',
        'approved': 'อนุมัติแล้ว',
        'rejected': 'ไม่อนุมัติ',
        'matching': 'กำลังหาอุปกรณ์ให้',
        'preparing': 'เตรียมจัดส่ง',
        'in_transit': 'กำลังจัดส่ง',
        'delivered': 'จัดส่งแล้ว'
    };
    return map[status] || status;
}

function getStatusDisplayEn(status) {
    const map = {
        'submitted': 'Submitted',
        'verified': 'Verified',
        'scheduled': 'Scheduled',
        'picked_up': 'Picked Up',
        'processing': 'Processing',
        'data_wiped': 'Data Wiped',
        'ready': 'Ready',
        'distributed': 'Distributed',
        'completed': 'Completed',
        'under_review': 'Under Review',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'matching': 'Matching Devices',
        'preparing': 'Preparing',
        'in_transit': 'In Transit',
        'delivered': 'Delivered'
    };
    return map[status] || status;
}

function getStatusBadgeClass(status) {
    if (status === 'completed') return 'status-completed';
    if (status === 'rejected') return 'status-rejected';
    if (['submitted', 'under_review', 'verified'].includes(status)) return 'status-pending';
    return 'status-in-progress';
}

// Date formatting helpers
function formatThaiDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatThaiDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Mock data fallback (for when backend API is not running)
function getMockTrackingData(searchQuery) {
    const query = searchQuery.toLowerCase();

    // Search in localStorage donations
    const localDonations = JSON.parse(localStorage.getItem('gearup_donations') || '[]');
    const localRequests = JSON.parse(localStorage.getItem('gearup_requests') || '[]');

    // Check donations
    for (const d of localDonations) {
        const _dt = new Date(d.createdAt);
        const mockTrackingId = `GU-DON-${String(_dt.getDate()).padStart(2,'0')}${String(_dt.getMonth()+1).padStart(2,'0')}${_dt.getFullYear()}-${String(d.id).slice(-3).padStart(3,'0')}`;
        if (
            mockTrackingId.toLowerCase() === query ||
            (d.email && d.email.toLowerCase() === query)
        ) {
            return {
                tracking_id: mockTrackingId,
                type: 'donation',
                current_status: 'processing',
                device_type: d.device || 'Unknown',
                donor_name: d.name || d.userName || 'Unknown',
                created_at: d.createdAt,
                timeline: [
                    {
                        status: 'submitted',
                        status_display_th: 'ส่งคำขอบริจาคแล้ว',
                        status_display_en: 'Submitted',
                        created_at: d.createdAt,
                        location: 'Online',
                        note: 'Donation request submitted'
                    },
                    {
                        status: 'verified',
                        status_display_th: 'ตรวจสอบเรียบร้อย',
                        status_display_en: 'Verified',
                        created_at: new Date(new Date(d.createdAt).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                        staff_name: 'Admin Team'
                    },
                    {
                        status: 'processing',
                        status_display_th: 'กำลังตรวจสอบ',
                        status_display_en: 'Processing',
                        created_at: new Date(new Date(d.createdAt).getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
                        note: 'Device inspection in progress'
                    }
                ],
                carbon_saved: null,
                ewaste_diverted: null
            };
        }
    }

    // Check requests
    for (const r of localRequests) {
        const _rt = new Date(r.createdAt);
        const mockTrackingId = `GU-REQ-${String(_rt.getDate()).padStart(2,'0')}${String(_rt.getMonth()+1).padStart(2,'0')}${_rt.getFullYear()}-${String(r.id).slice(-3).padStart(3,'0')}`;
        if (
            mockTrackingId.toLowerCase() === query ||
            (r.email && r.email.toLowerCase() === query)
        ) {
            return {
                tracking_id: mockTrackingId,
                type: 'request',
                current_status: 'under_review',
                equipment_type: r.equipment || 'Unknown',
                contact_name: r.name || r.userName || 'Unknown',
                created_at: r.createdAt,
                timeline: [
                    {
                        status: 'submitted',
                        status_display_th: 'ส่งคำขอรับแล้ว',
                        status_display_en: 'Submitted',
                        created_at: r.createdAt,
                        location: 'Online',
                        note: 'Equipment request submitted'
                    },
                    {
                        status: 'under_review',
                        status_display_th: 'กำลังพิจารณา',
                        status_display_en: 'Under Review',
                        created_at: new Date(new Date(r.createdAt).getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                        staff_name: 'Review Team'
                    }
                ],
                confirmed: false
            };
        }
    }

    return null;
}

// === CERTIFICATE & REPORT GENERATION (Issues #7, #8, #10) ===

// Issue #8: Enhanced Certificate with Tax ID, org details, formal info
async function downloadCertificate() {
    const trackingId = document.getElementById('displayTrackingId').textContent;
    if (!trackingId || trackingId === '-') {
        showNotification('ไม่มีข้อมูลการติดตาม', 'error');
        return;
    }

    const donationId = document.getElementById('displayTrackingId').dataset.donationId;

    try {
        // Fetch donation data
        let donationData = null;
        let itemsData = [];
        if (donationId && supabaseClient) {
            const { data: donation } = await supabaseClient
                .from('donations')
                .select('*')
                .eq('id', parseInt(donationId))
                .single();
            donationData = donation;

            const { data: items } = await supabaseClient
                .from('donation_items')
                .select('*')
                .eq('donation_id', parseInt(donationId));
            itemsData = items || [];
        }

        // Generate certificate even without DB data (use available info)
        const certNumber = `GU-CARBON-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
        const certDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
        const donorName = donationData?.donor_name || currentUser?.name || '-';
        const donorOrg = donationData?.donor_org_name || '';
        const donorTaxId = donationData?.donor_tax_id || '';
        const donorAddress = donationData?.donor_address || '';
        const totalCarbon = donationData?.carbon_saved || 0;
        const totalWeight = donationData?.device_weight || 0;

        const itemsHTML = itemsData.length > 0 ? itemsData.map((item, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${item.device_type || '-'}</td>
                <td>${item.device_brand || '-'}</td>
                <td>${item.device_model || '-'}</td>
                <td>${item.serial_number || '-'}</td>
                <td>${item.device_weight || 0} กก.</td>
                <td>${(item.carbon_saved || 0).toFixed(2)} kgCO2e</td>
            </tr>
        `).join('') : `
            <tr>
                <td>1</td>
                <td>${donationData?.device_type || '-'}</td>
                <td>${donationData?.device_brand || '-'}</td>
                <td>${donationData?.device_model || '-'}</td>
                <td>-</td>
                <td>${totalWeight} กก.</td>
                <td>${totalCarbon.toFixed(2)} kgCO2e</td>
            </tr>
        `;

        const certHTML = `
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <title>ใบรับรองคาร์บอนเครดิต - ${certNumber}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
                body { font-family: 'Sarabun', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
                .cert-container { max-width: 800px; margin: 0 auto; background: white; border: 3px solid #2f5233; padding: 50px; position: relative; }
                .cert-border { border: 2px solid #d4a574; padding: 40px; }
                .cert-header { text-align: center; margin-bottom: 30px; }
                .cert-logo { font-size: 2rem; font-weight: 700; color: #2f5233; letter-spacing: 3px; }
                .cert-title { font-size: 1.5rem; color: #8b7355; margin: 10px 0; }
                .cert-number { font-size: 0.9rem; color: #999; }
                .cert-body { margin: 30px 0; }
                .cert-statement { text-align: center; font-size: 1.2rem; margin: 20px 0 30px; line-height: 1.8; }
                .cert-donor { background: #f8f6f3; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .cert-donor h4 { color: #2f5233; margin-bottom: 10px; }
                .cert-donor p { margin: 5px 0; font-size: 0.95rem; }
                .cert-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.85rem; }
                .cert-table th { background: #2f5233; color: white; padding: 8px 12px; text-align: left; }
                .cert-table td { padding: 8px 12px; border-bottom: 1px solid #eee; }
                .cert-table tr:nth-child(even) { background: #f8f6f3; }
                .cert-summary { display: flex; justify-content: space-around; margin: 30px 0; gap: 20px; }
                .cert-stat { text-align: center; padding: 15px 25px; background: linear-gradient(135deg, #2f5233, #3d6b42); color: white; border-radius: 12px; min-width: 150px; }
                .cert-stat-value { font-size: 1.8rem; font-weight: 700; }
                .cert-stat-label { font-size: 0.85rem; opacity: 0.9; }
                .cert-footer { text-align: center; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 30px; }
                .cert-stamp { display: inline-block; border: 3px solid #2f5233; border-radius: 50%; width: 100px; height: 100px; line-height: 100px; text-align: center; color: #2f5233; font-weight: 700; font-size: 0.9rem; margin: 10px; }
                .cert-signature { margin-top: 30px; }
                .cert-signature-line { width: 250px; border-top: 1px solid #333; margin: 30px auto 5px; }
                .print-btn { display: block; margin: 20px auto; padding: 12px 40px; background: #2f5233; color: white; border: none; border-radius: 30px; font-size: 1rem; cursor: pointer; }
                .print-btn:hover { background: #1e3622; }
                @media print { .print-btn { display: none; } .cert-container { border: none; } body { background: white; padding: 0; } }
            </style>
        </head>
        <body>
            <button class="print-btn" onclick="window.print()">🖨️ พิมพ์ใบรับรอง / บันทึกเป็น PDF</button>
            <div class="cert-container">
                <div class="cert-border">
                    <div class="cert-header">
                        <div class="cert-logo">♻️ GEARUP</div>
                        <div class="cert-title">ใบรับรองการลดการปล่อยก๊าซคาร์บอนไดออกไซด์</div>
                        <div class="cert-title" style="font-size:1.1rem;">Carbon Emission Reduction Certificate</div>
                        <div class="cert-number">เลขที่ใบรับรอง: ${certNumber}</div>
                        <div class="cert-number">วันที่ออก: ${certDate}</div>
                    </div>

                    <div class="cert-body">
                        <div class="cert-statement">
                            ขอรับรองว่า การบริจาคอุปกรณ์อิเล็กทรอนิกส์ดังรายการด้านล่าง<br>
                            ได้มีส่วนช่วยลดการปล่อยก๊าซเรือนกระจก และลดปริมาณขยะอิเล็กทรอนิกส์<br>
                            ตามมาตรฐานการคำนวณคาร์บอนฟุตพริ้นท์ของ EPA
                        </div>

                        <div class="cert-donor">
                            <h4>ข้อมูลผู้บริจาค</h4>
                            <p><strong>ชื่อ:</strong> ${donorName}</p>
                            ${donorOrg ? `<p><strong>ชื่อองค์กร:</strong> ${donorOrg}</p>` : ''}
                            ${donorTaxId ? `<p><strong>เลขประจำตัวผู้เสียภาษี:</strong> ${donorTaxId}</p>` : ''}
                            ${donorAddress ? `<p><strong>ที่อยู่:</strong> ${donorAddress}</p>` : ''}
                            <p><strong>เลข Tracking:</strong> ${trackingId}</p>
                        </div>

                        <h4 style="color:#2f5233;">รายการอุปกรณ์ที่บริจาค</h4>
                        <table class="cert-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>ประเภท</th>
                                    <th>ยี่ห้อ</th>
                                    <th>รุ่น</th>
                                    <th>S/N</th>
                                    <th>น้ำหนัก</th>
                                    <th>CO2 ลดได้</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHTML}
                            </tbody>
                        </table>

                        <div class="cert-summary">
                            <div class="cert-stat">
                                <div class="cert-stat-value">${totalWeight}</div>
                                <div class="cert-stat-label">น้ำหนักรวม (กก.)</div>
                            </div>
                            <div class="cert-stat">
                                <div class="cert-stat-value">${totalCarbon.toFixed(2)}</div>
                                <div class="cert-stat-label">kgCO2e ที่ลดได้</div>
                            </div>
                            <div class="cert-stat">
                                <div class="cert-stat-value">${itemsData.length || 1}</div>
                                <div class="cert-stat-label">จำนวนอุปกรณ์</div>
                            </div>
                        </div>
                    </div>

                    <div class="cert-footer">
                        <div class="cert-stamp">GEARUP<br>VERIFIED</div>
                        <div class="cert-signature">
                            <div class="cert-signature-line"></div>
                            <p>ผู้อำนวยการ GEARUP</p>
                            <p style="font-size:0.85rem;color:#999;">ใบรับรองนี้ออกโดยระบบอัตโนมัติ</p>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>`;

        const certWindow = window.open('', 'ใบรับรอง GEARUP', 'width=900,height=1100');
        certWindow.document.write(certHTML);
        certWindow.document.close();
        showNotification('เปิดใบรับรองแล้ว — สามารถพิมพ์หรือบันทึกเป็น PDF ได้', 'success');
    } catch (error) {
        console.error('Certificate generation error:', error);
        showNotification('เกิดข้อผิดพลาดในการสร้างใบรับรอง', 'error');
    }
}

// ==========================================
// SHIPPING LABEL MODAL (after donation submit)
// ==========================================

let _shippingLabelData = null; // store for print button
let _confirmReject = null;    // abort any pending showConfirmModal Promise on bfcache restore
let _impactChannel = null;    // track realtime channel so we can unsubscribe on pagehide
let _isSubmitting = false;    // guard against double-submission (bfcache resume + re-click)

let _slmDonationId = null;
let _profileDonationCache = {};

function showShippingLabelModal(donationData) {
    _shippingLabelData = donationData;
    _slmDonationId = donationData?.donationId || null;

    // Reset carrier selection
    document.querySelectorAll('.slm-carrier-btn').forEach(b => b.classList.remove('selected'));
    const printBtn = document.getElementById('slmPrintBtn');
    if (printBtn) printBtn.disabled = true;
    const trackWrap = document.getElementById('slmInlineTrackingWrap');
    if (trackWrap) trackWrap.style.display = 'none';
    const trackInput = document.getElementById('slmInlineTrackingInput');
    if (trackInput) { trackInput.value = ''; trackInput.disabled = false; }

    // Tracking ID
    const tid = donationData?.trackingId || donationData?.tracking_id || '—';
    const trackEl = document.getElementById('slmTrackingId');
    if (trackEl) trackEl.textContent = tid;

    // Stats
    document.getElementById('slmItems').textContent = donationData?.total_items || donationData?.totalItems || '—';
    document.getElementById('slmWeight').textContent =
        donationData?.device_weight ? Number(donationData.device_weight).toFixed(1) : '—';
    const carbonEl = document.getElementById('slmCarbon');
    if (carbonEl) carbonEl.textContent = donationData?.carbon_saved
        ? Math.round(donationData.carbon_saved).toLocaleString() : '—';

    // Subtitle
    const post = donationData?.recipient_post;
    const subtitle = document.getElementById('slmSubtitle');
    if (subtitle) subtitle.textContent = post?.project_name
        ? `ส่งไปยัง: ${post.project_name}` : 'ขอบคุณที่ร่วมบริจาคอุปกรณ์กับ GEARUP';

    const modal = document.getElementById('shippingLabelModal');
    if (modal) modal.style.display = 'flex';
}

async function slmSelectCarrier(carrier, btn) {
    // Update UI
    document.querySelectorAll('.slm-carrier-btn').forEach(b => b.classList.remove('selected'));
    if (btn) btn.classList.add('selected');

    // Update label data carrier
    if (_shippingLabelData) _shippingLabelData.shipping_carrier = carrier;

    // Enable print button
    const printBtn = document.getElementById('slmPrintBtn');
    if (printBtn) printBtn.disabled = false;

    // Show inline tracking input
    const trackWrap = document.getElementById('slmInlineTrackingWrap');
    if (trackWrap) trackWrap.style.display = 'block';
    document.getElementById('slmInlineTrackingInput')?.focus();

    // Save carrier to DB in background (non-blocking)
    if (_slmDonationId && supabaseClient) {
        supabaseClient.from('donations')
            .update({ shipping_carrier: carrier })
            .eq('id', _slmDonationId)
            .then(({ error }) => { if (error) console.warn('Carrier update:', error.message); });
    }
}

function slmCancelCarrier() {
    document.querySelectorAll('.slm-carrier-btn').forEach(b => b.classList.remove('selected'));
    if (_shippingLabelData) delete _shippingLabelData.shipping_carrier;
    const printBtn = document.getElementById('slmPrintBtn');
    if (printBtn) printBtn.disabled = true;
    const trackWrap = document.getElementById('slmInlineTrackingWrap');
    if (trackWrap) trackWrap.style.display = 'none';
    const trackInput = document.getElementById('slmInlineTrackingInput');
    if (trackInput) { trackInput.value = ''; trackInput.disabled = false; }
    const saveBtn = document.getElementById('slmSaveTrackingBtn');
    if (saveBtn) saveBtn.textContent = 'บันทึก';
}

function showSlmTrackingInput() {
    document.getElementById('slmTrackingChoiceButtons')?.style && (document.getElementById('slmTrackingChoiceButtons').style.display = 'none');
    document.getElementById('slmInlineTrackingWrap').style.display = 'block';
    document.getElementById('slmInlineTrackingInput')?.focus();
}

async function saveSlmCarrierTracking() {
    const input = document.getElementById('slmInlineTrackingInput');
    const val = input?.value?.trim();
    if (!val) { showNotification('กรุณากรอกเลข Tracking', 'error'); return; }
    if (!_slmDonationId) { showNotification('ไม่พบข้อมูลการบริจาค', 'error'); return; }
    if (!supabaseClient) { showNotification('ไม่สามารถเชื่อมต่อระบบได้', 'error'); return; }

    const btn = document.getElementById('slmSaveTrackingBtn');
    if (btn) btn.textContent = 'กำลังบันทึก...';

    try {
        const { error } = await supabaseClient
            .from('donations')
            .update({ shipping_tracking_id: val })
            .eq('id', _slmDonationId);
        if (error) throw error;

        document.getElementById('slmInlineTrackingWrap').innerHTML =
            `<div style="text-align:center;padding:0.8rem;color:#2f5233;font-weight:600;">✅ บันทึกเลข Tracking เรียบร้อยแล้ว!</div>`;
        showNotification('บันทึกเลข Tracking สำเร็จ', 'success');
    } catch (e) {
        if (btn) btn.textContent = 'บันทึก';
        showNotification('บันทึกไม่สำเร็จ: ' + (e.message || 'กรุณาลองใหม่'), 'error');
    }
}

function closeShippingLabelModal() {
    const modal = document.getElementById('shippingLabelModal');
    if (modal) modal.style.display = 'none';
    navigateToPage('home');
    prevDonateStep(1);
    resetDonateForm();
}

function printShippingLabel() {
    if (_shippingLabelData) generateShippingLabel(_shippingLabelData);
}

// GEARUP-branded shipping label (opens in new window for printing)
// Builds shipping label HTML string (no side effects)
function _buildLabelHTML(donationData) {
    const trackingId  = donationData?.trackingId || donationData?.tracking_id || '—';
    const senderName  = donationData?.donor_name || currentUser?.name || '—';
    const senderAddr  = donationData?.donor_address || '—';
    const senderTel   = donationData?.donor_tel || '—';
    const totalWeight = donationData?.device_weight ? Number(donationData.device_weight).toFixed(1) : '—';
    const totalItems  = donationData?.total_items || donationData?.totalItems || '—';
    const dateStr     = new Date().toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' });

    // Device details summary
    const DEVICE_LABELS_TH = {
        'Computer': 'คอมพิวเตอร์', 'Laptop': 'แล็ปท็อป',
        'Tablet': 'แท็บเล็ต', 'Phone': 'โทรศัพท์'
    };
    const items = donationData?.items || [];
    let itemsHTML = '';
    if (items.length > 0) {
        itemsHTML = items.map(item => {
            const typeTh = DEVICE_LABELS_TH[item.device_type] || item.device_type || 'อุปกรณ์';
            const brand = item.device_brand === '__other__' ? (item._customBrand || '') : (item.device_brand || '');
            const model = item.device_model === '__other__' ? (item._customModel || '') : (item.device_model || '');
            const detail = [brand, model].filter(Boolean).join(' ');
            const qty = item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : '';
            const wt = item.quantity > 1
                ? `${parseFloat(item.device_weight||0).toFixed(1)} กก./เครื่อง`
                : `${parseFloat(item.device_weight||0).toFixed(1)} กก.`;
            return `<div style="display:flex;gap:6px;align-items:center;padding:5px 0;border-bottom:1px solid #f0ede8;font-size:0.82rem;">
                <span style="background:#2f5233;color:#fff;border-radius:4px;padding:1px 7px;font-size:0.72rem;font-weight:700;white-space:nowrap;">${typeTh}${qty}</span>
                <span style="flex:1;color:#1a2421;">${detail || '—'}</span>
                <span style="color:#8b7355;white-space:nowrap;">${wt}</span>
            </div>`;
        }).join('');
    } else {
        // Fallback: use top-level device info
        const typeTh = DEVICE_LABELS_TH[donationData?.device_type] || donationData?.device_type || 'อุปกรณ์';
        const detail = [donationData?.device_brand, donationData?.device_model].filter(Boolean).join(' ');
        itemsHTML = `<div style="display:flex;gap:6px;align-items:center;padding:5px 0;font-size:0.82rem;">
            <span style="background:#2f5233;color:#fff;border-radius:4px;padding:1px 7px;font-size:0.72rem;font-weight:700;white-space:nowrap;">${typeTh}</span>
            <span style="flex:1;color:#1a2421;">${detail || '—'}</span>
            <span style="color:#8b7355;">${totalWeight} กก.</span>
        </div>`;
    }

    // Receiver address — use org_name (school/foundation) from linked request post
    const post = donationData?.recipient_post;
    const RECEIVER_NAME = post?.org_name || post?.project_name || post?.contact_name || 'ศูนย์รับบริจาค GEARUP';
    const RECEIVER_ADDR = post?.address || '123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110';
    const RECEIVER_TEL  = post?.phone || post?.email || '064-335-2325';

    // Carbon saved
    const carbonSaved = donationData?.carbon_saved;
    const carbonStr = carbonSaved && carbonSaved > 0 ? Math.round(carbonSaved).toLocaleString() : '—';

    // GEARUP logo path (relative to current page)
    const logoPath = window.location.href.replace(/\/[^\/]*(\?.*)?$/, '/assets/logo-gearup.png');

    const labelHTML = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>ใบปะหน้าพัสดุ — GEARUP — ${trackingId}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Sarabun', sans-serif; background: #eee; padding: 20px; }
  .page { max-width: 560px; margin: 0 auto; }
  .print-btn {
    display: block; width: 100%; padding: 12px;
    background: #2f5233; color: #fff; border: none; border-radius: 8px;
    font-size: 1rem; font-family: inherit; cursor: pointer; font-weight: 700;
    margin-bottom: 16px; letter-spacing: 0.5px;
  }
  .label { background: #fff; border: 2.5px solid #111; border-radius: 4px; overflow: hidden; }

  /* Header */
  .lbl-header {
    background: #2f5233; color: #fff;
    padding: 12px 18px; display: flex; justify-content: space-between; align-items: center;
  }
  .lbl-logo-area { display: flex; align-items: center; gap: 10px; }
  .lbl-logo-img { width: 48px; height: 48px; object-fit: contain; border-radius: 50%; background: #fff; padding: 2px; }
  .lbl-brand { font-size: 1.4rem; font-weight: 800; letter-spacing: 1px; }
  .lbl-brand-sub { font-size: 0.7rem; opacity: 0.85; letter-spacing: 0.5px; margin-top: 1px; }
  .lbl-donation-badge {
    background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.4);
    border-radius: 6px; padding: 4px 10px; font-size: 0.72rem; text-align: right;
  }
  .lbl-donation-badge strong { display: block; font-size: 0.85rem; }

  /* Tracking bar */
  .lbl-track {
    background: #1a2421; color: #fff; text-align: center;
    padding: 10px; font-family: monospace; font-size: 1.4rem; font-weight: 700;
    letter-spacing: 3px; border-bottom: 2px dashed #444;
  }
  .lbl-track small { display: block; font-size: 0.68rem; letter-spacing: 1px; opacity: 0.65; margin-bottom: 2px; font-family: sans-serif; }

  /* Addresses */
  .lbl-addresses { display: flex; border-bottom: 2px solid #111; }
  .lbl-addr { flex: 1; padding: 14px 16px; font-size: 0.88rem; line-height: 1.6; }
  .lbl-addr:first-child { border-right: 1.5px solid #ddd; }
  .lbl-addr-title { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 1.5px; color: #2f5233; font-weight: 800; margin-bottom: 6px; }
  .lbl-addr strong { font-size: 0.95rem; }

  /* Device details */
  .lbl-devices { padding: 10px 16px; border-bottom: 1.5px solid #e0ddd8; }
  .lbl-devices-title { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 1.2px; color: #2f5233; font-weight: 800; margin-bottom: 6px; }

  /* Info bar */
  .lbl-info { display: flex; border-bottom: 1px solid #ddd; }
  .lbl-info-cell { flex: 1; padding: 10px; text-align: center; border-right: 1px solid #eee; }
  .lbl-info-cell:last-child { border-right: none; }
  .lbl-info-val { font-size: 1.2rem; font-weight: 800; color: #2f5233; }
  .lbl-info-lbl { font-size: 0.7rem; color: #888; }

  /* Footer */
  .lbl-footer { padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #999; border-top: 1px solid #eee; }

  @media print {
    .print-btn { display: none; }
    body { background: white; padding: 0; }
    .label { border: 2px solid #000; }
  }
</style>
</head>
<body>
<div class="page">
  <button class="print-btn" onclick="window.print()">🖨️ พิมพ์ใบปะหน้าพัสดุ</button>
  <div class="label">
    <!-- Header with GEARUP branding -->
    <div class="lbl-header">
      <div class="lbl-logo-area">
        <img src="${logoPath}" alt="GEARUP" class="lbl-logo-img" onerror="this.style.display='none'">
        <div>
          <div class="lbl-brand">GEARUP</div>
          <div class="lbl-brand-sub">บริจาคอุปกรณ์อิเล็กทรอนิกส์</div>
        </div>
      </div>
      <div class="lbl-donation-badge">
        วันที่: ${dateStr}
      </div>
    </div>

    <!-- Tracking bar (top only) -->
    <div class="lbl-track">
      <small>GEARUP TRACKING NUMBER</small>
      ${trackingId}
    </div>

    <!-- Addresses -->
    <div class="lbl-addresses">
      <div class="lbl-addr">
        <div class="lbl-addr-title">📤 ผู้ส่ง (FROM)</div>
        <strong>${senderName}</strong><br>
        ${senderAddr}<br>
        โทร: ${senderTel}
      </div>
      <div class="lbl-addr">
        <div class="lbl-addr-title">📍 ผู้รับ (TO)</div>
        <strong>${RECEIVER_NAME}</strong><br>
        ${RECEIVER_ADDR}<br>
        โทร: ${RECEIVER_TEL}
      </div>
    </div>

    <!-- Device details -->
    <div class="lbl-devices">
      <div class="lbl-devices-title">📦 รายการอุปกรณ์</div>
      ${itemsHTML}
    </div>

    <!-- Info bar -->
    <div class="lbl-info">
      <div class="lbl-info-cell">
        <div class="lbl-info-val">${totalItems}</div>
        <div class="lbl-info-lbl">จำนวน (ชิ้น)</div>
      </div>
      <div class="lbl-info-cell">
        <div class="lbl-info-val">${totalWeight}</div>
        <div class="lbl-info-lbl">น้ำหนัก (กก.)</div>
      </div>
      <div class="lbl-info-cell">
        <div class="lbl-info-val" style="color:#2f7a3a;">${carbonStr}</div>
        <div class="lbl-info-lbl">CO₂ ลดได้ (กก.)</div>
      </div>
    </div>

    <!-- Footer (no barcode tracking) -->
    <div class="lbl-footer">
      <span>gearup.com</span>
      <span>${new Date().getFullYear()} © GEARUP</span>
    </div>
  </div>
</div>
</body>
</html>`;

    return labelHTML;
}

// Opens a new window and writes the shipping label (synchronous — must be called directly from user click)
function generateShippingLabel(donationData) {
    const html = _buildLabelHTML(donationData);
    const win = window.open('', 'ใบปะหน้าพัสดุ', 'width=640,height=820');
    if (win) { win.document.write(html); win.document.close(); }
}

// Issue #6: Data Wiping Certificate (ใบรับรองการลบข้อมูลถาวร)
function generateDataWipingCertificate(donationData) {
    const trackingId = donationData?.tracking_id || donationData?.trackingId || '-';
    const donorName = donationData?.donor_name || currentUser?.name || '-';
    const donorOrg = donationData?.donor_org_name || '';
    const certDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    const wipeCertNum = `GU-WIPE-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const wipeHTML = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>ใบรับรองการลบข้อมูลถาวร - ${wipeCertNum}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
            body { font-family: 'Sarabun', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .cert { max-width: 750px; margin: 0 auto; background: white; border: 3px solid #1a2421; padding: 50px; }
            .cert-inner { border: 2px solid #8b7355; padding: 40px; }
            .cert h1 { text-align: center; color: #1a2421; font-size: 1.5rem; }
            .cert h2 { text-align: center; color: #2f5233; font-size: 1.2rem; margin-bottom: 30px; }
            .cert-info { background: #f8f6f3; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .cert-info p { margin: 5px 0; }
            .cert-standard { background: #2f5233; color: white; padding: 15px 20px; border-radius: 8px; margin: 20px 0; }
            .cert-standard h3 { margin: 0 0 5px; }
            .cert-footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
            .cert-stamp { display: inline-block; border: 3px solid #1a2421; border-radius: 50%; width: 90px; height: 90px; line-height: 90px; font-weight: 700; color: #1a2421; font-size: 0.8rem; }
            .print-btn { display: block; margin: 20px auto; padding: 12px 40px; background: #1a2421; color: white; border: none; border-radius: 30px; font-size: 1rem; cursor: pointer; }
            @media print { .print-btn { display: none; } body { background: white; } }
        </style>
    </head>
    <body>
        <button class="print-btn" onclick="window.print()">🖨️ พิมพ์ใบรับรอง</button>
        <div class="cert">
            <div class="cert-inner">
                <h1>🛡️ ใบรับรองการลบข้อมูลถาวร</h1>
                <h2>Data Destruction Certificate</h2>
                <p style="text-align:center;">เลขที่: ${wipeCertNum} &nbsp;|&nbsp; วันที่: ${certDate}</p>

                <div class="cert-info">
                    <p><strong>ผู้บริจาค:</strong> ${donorName}</p>
                    ${donorOrg ? `<p><strong>องค์กร:</strong> ${donorOrg}</p>` : ''}
                    <p><strong>เลข Tracking:</strong> ${trackingId}</p>
                </div>

                <p>ขอรับรองว่า ข้อมูลทั้งหมดในอุปกรณ์ที่บริจาคภายใต้รหัสข้างต้น ได้ถูกลบอย่างถาวรตามมาตรฐานสากล โดยไม่สามารถกู้คืนได้</p>

                <div class="cert-standard">
                    <h3>มาตรฐานที่ใช้</h3>
                    <p>NIST 800-88 Rev. 1 (Guidelines for Media Sanitization)</p>
                    <p>วิธีการ: Clear / Purge ตามความเหมาะสมของประเภทสื่อ</p>
                </div>

                <div class="cert-footer">
                    <div class="cert-stamp">WIPED<br>VERIFIED</div>
                    <p style="margin-top:15px;font-size:0.85rem;color:#999;">ใบรับรองนี้ออกโดยระบบ GEARUP</p>
                </div>
            </div>
        </div>
    </body>
    </html>`;

    const wipeWindow = window.open('', 'ใบรับรองการลบข้อมูล', 'width=850,height=900');
    wipeWindow.document.write(wipeHTML);
    wipeWindow.document.close();
}

// Issue #10: ESG Report Generation
function generateESGReport() {
    const orgName = currentUser?.name || 'องค์กร';
    const reportDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    const reportNum = `GU-ESG-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const reportHTML = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>รายงาน ESG - ${reportNum}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
            body { font-family: 'Sarabun', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; color: #333; }
            .report { max-width: 850px; margin: 0 auto; background: white; padding: 50px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .report-header { text-align: center; border-bottom: 3px solid #2f5233; padding-bottom: 30px; margin-bottom: 30px; }
            .report-header h1 { color: #2f5233; font-size: 2rem; margin: 0 0 5px; }
            .report-header h2 { color: #8b7355; font-size: 1.2rem; font-weight: 400; margin: 0; }
            .report-section { margin: 30px 0; }
            .report-section h3 { color: #2f5233; font-size: 1.3rem; border-left: 4px solid #2f5233; padding-left: 15px; margin-bottom: 15px; }
            .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
            .metric-card { background: linear-gradient(135deg, #2f5233, #3d6b42); color: white; padding: 25px; border-radius: 12px; text-align: center; }
            .metric-value { font-size: 2.2rem; font-weight: 700; }
            .metric-label { font-size: 0.9rem; opacity: 0.9; margin-top: 5px; }
            .sdg-list { display: flex; gap: 10px; flex-wrap: wrap; margin: 15px 0; }
            .sdg-badge { background: #2f5233; color: white; padding: 8px 16px; border-radius: 20px; font-size: 0.85rem; }
            .impact-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            .impact-table th { background: #f8f6f3; padding: 10px; text-align: left; color: #2f5233; border-bottom: 2px solid #2f5233; }
            .impact-table td { padding: 10px; border-bottom: 1px solid #eee; }
            .report-footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #2f5233; font-size: 0.85rem; color: #999; }
            .print-btn { display: block; margin: 20px auto; padding: 12px 40px; background: #2f5233; color: white; border: none; border-radius: 30px; font-size: 1rem; cursor: pointer; }
            @media print { .print-btn { display: none; } body { background: white; } }
        </style>
    </head>
    <body>
        <button class="print-btn" onclick="window.print()">🖨️ พิมพ์รายงาน / บันทึก PDF</button>
        <div class="report">
            <div class="report-header">
                <h1>♻️ GEARUP — รายงานผลกระทบสิ่งแวดล้อม</h1>
                <h2>Environmental, Social and Governance (ESG) Impact Report</h2>
                <p>เลขที่: ${reportNum} &nbsp;|&nbsp; วันที่: ${reportDate}</p>
                <p>จัดทำสำหรับ: ${orgName}</p>
            </div>

            <div class="report-section">
                <h3>🌍 สรุปผลกระทบสิ่งแวดล้อม</h3>
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-value">—</div>
                        <div class="metric-label">อุปกรณ์ที่บริจาค</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">—</div>
                        <div class="metric-label">kgCO2e ที่ลดได้</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">—</div>
                        <div class="metric-label">กก. ขยะอิเล็กทรอนิกส์ที่เลี่ยงได้</div>
                    </div>
                </div>
                <p><em>* ข้อมูลจะอัปเดตตามจำนวนการบริจาคจริง</em></p>
            </div>

            <div class="report-section">
                <h3>📊 การจัดการสินทรัพย์ IT</h3>
                <table class="impact-table">
                    <thead>
                        <tr><th>หัวข้อ</th><th>รายละเอียด</th><th>สถานะ</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>การลบข้อมูลถาวร</td><td>มาตรฐาน NIST 800-88</td><td>✅ ดำเนินการ</td></tr>
                        <tr><td>การรีไซเคิล</td><td>ร่วมกับวงษ์พาณิชย์</td><td>✅ มาตรฐานสากล</td></tr>
                        <tr><td>การส่งต่ออุปกรณ์</td><td>โรงเรียน/มูลนิธิ</td><td>✅ ตรวจสอบแล้ว</td></tr>
                        <tr><td>ใบรับรองคาร์บอน</td><td>ออกให้ทุกรายการที่เสร็จสิ้น</td><td>✅ อัตโนมัติ</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="report-section">
                <h3>🎯 เป้าหมายการพัฒนาที่ยั่งยืน (SDGs) ที่สนับสนุน</h3>
                <div class="sdg-list">
                    <span class="sdg-badge">SDG 4: การศึกษาที่มีคุณภาพ</span>
                    <span class="sdg-badge">SDG 10: ลดความเหลื่อมล้ำ</span>
                    <span class="sdg-badge">SDG 12: การผลิตและบริโภคที่ยั่งยืน</span>
                    <span class="sdg-badge">SDG 13: การรับมือกับสภาพภูมิอากาศ</span>
                </div>
            </div>

            <div class="report-footer">
                <p>รายงานนี้จัดทำโดย GEARUP — แพลตฟอร์มบริจาคอุปกรณ์อิเล็กทรอนิกส์เพื่อความยั่งยืน</p>
                <p>info@gearup.com | 064-335-2325</p>
            </div>
        </div>
    </body>
    </html>`;

    const reportWindow = window.open('', 'รายงาน ESG', 'width=950,height=1100');
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
    showNotification('เปิดรายงาน ESG แล้ว — สามารถพิมพ์หรือบันทึกเป็น PDF ได้', 'success');
}

// === CONFIRMATION MODAL ===
function openConfirmModal() {
    const trackingEl = document.getElementById('displayTrackingId');
    const requestId = trackingEl.dataset.donationId || '';

    if (!requestId) {
        showNotification('ไม่สามารถระบุ ID คำขอได้', 'error');
        return;
    }

    document.getElementById('confirmRequestId').value = requestId;
    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

function setConfirmToggle(btn, hiddenId) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.confirm-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(hiddenId).value = btn.dataset.value;

    // Show/hide non-functional and recycle sections
    if (hiddenId === 'confirmFunctional') {
        const isNotFunctional = btn.dataset.value === 'false';
        document.getElementById('nonFunctionalGroup').style.display = isNotFunctional ? 'block' : 'none';
        document.getElementById('recycleGroup').style.display = isNotFunctional ? 'block' : 'none';
    }
}

async function submitConfirmation() {
    const requestId = document.getElementById('confirmRequestId').value;
    const itemsMatch = document.getElementById('confirmItemsMatch').value === 'true';
    const itemsFunctional = document.getElementById('confirmFunctional').value === 'true';
    const quantityReceived = parseInt(document.getElementById('confirmQuantity').value) || 1;
    const conditionNotes = document.getElementById('confirmNotes').value.trim();
    const nonFunctionalCount = parseInt(document.getElementById('confirmNonFunctional').value) || 0;
    const redirectToRecycle = document.getElementById('confirmRecycle')?.checked || false;

    if (!requestId) {
        showNotification('ไม่พบ ID คำขอ', 'error');
        return;
    }

    try {
        // Insert recipient confirmation
        const { data: confirmation, error: confirmError } = await supabaseClient
            .from('recipient_confirmations')
            .insert({
                request_id: parseInt(requestId),
                received_confirmed: true,
                received_date: new Date().toISOString(),
                items_match: itemsMatch,
                items_functional: itemsFunctional,
                quantity_received: quantityReceived,
                condition_notes: conditionNotes,
                non_functional_count: nonFunctionalCount,
                redirect_to_recycle: redirectToRecycle
            })
            .select('id')
            .single();

        if (confirmError) throw confirmError;

        // Update request status to completed
        await supabaseClient
            .from('requests')
            .update({
                current_status: 'completed',
                received_confirmed: true,
                received_date: new Date().toISOString(),
                items_match: itemsMatch,
                recipient_notes: conditionNotes
            })
            .eq('id', parseInt(requestId));

        // Add timeline entry
        await supabaseClient.from('tracking_timeline').insert({
            request_id: parseInt(requestId),
            status: 'completed',
            status_display_th: 'เสร็จสมบูรณ์',
            status_display_en: 'Completed',
            note: 'Recipient confirmed receipt'
        });

        // If redirecting to recycle
        if (redirectToRecycle && nonFunctionalCount > 0) {
            await supabaseClient.from('recycling_redirects').insert({
                request_id: parseInt(requestId),
                confirmation_id: confirmation.id,
                device_type: document.getElementById('displayDevice')?.textContent || 'Unknown',
                device_count: nonFunctionalCount,
                reason: 'Items not functional - redirect to recycling',
                recycling_partner: 'Wongpanit',
                current_status: 'pending'
            });
        }

        closeConfirmModal();
        document.getElementById('confirmSection').style.display = 'none';
        showNotification('ส่งการยืนยันสำเร็จ!', 'success');

        const badge = document.getElementById('displayStatusBadge');
        badge.textContent = getStatusDisplayTh('completed');
        badge.className = 'status-badge status-completed';
    } catch (error) {
        console.error('Confirmation error:', error);
        showNotification('ส่งการยืนยันไม่สำเร็จ: ' + error.message, 'error');
    }
}

// Close confirm modal on outside click
document.addEventListener('DOMContentLoaded', () => {
    const confirmModal = document.getElementById('confirmModal');
    confirmModal?.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            closeConfirmModal();
        }
    });
});

// Initialize tracking page events
document.addEventListener('DOMContentLoaded', () => {
    const trackingInput = document.getElementById('trackingInput');
    if (trackingInput) {
        trackingInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchTracking();
            }
        });
    }
});

// === ADMIN DASHBOARD ===
let adminCurrentTab = 'donations';
let adminCurrentPage = 1;

function switchAdminTab(tab) {
    adminCurrentTab = tab;
    adminCurrentPage = 1;

    // Update tab UI
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));

    const tabs = document.querySelectorAll('.admin-tab');
    const tabMap = { donations: 0, requests: 1, users: 2, recycle: 3 };
    if (tabs[tabMap[tab]]) tabs[tabMap[tab]].classList.add('active');

    const content = document.getElementById(`tab-${tab}`);
    if (content) content.classList.add('active');

    // Update status filter options
    updateStatusFilterOptions(tab);
    loadAdminData(tab);
}

function updateStatusFilterOptions(tab) {
    const select = document.getElementById('adminStatusFilter');
    select.innerHTML = '<option value="">All Status</option>';

    const statuses = {
        donations: ['submitted', 'verified', 'scheduled', 'picked_up', 'processing', 'data_wiped', 'ready', 'distributed', 'completed'],
        requests: ['submitted', 'under_review', 'approved', 'rejected', 'matching', 'preparing', 'in_transit', 'delivered', 'completed'],
        users: [],
        recycle: ['pending', 'scheduled', 'picked_up', 'completed']
    };

    (statuses[tab] || []).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = getStatusDisplayEn(s);
        select.appendChild(opt);
    });
}

async function loadAdminData(tab) {
    const search = document.getElementById('adminSearch').value.trim();
    const status = document.getElementById('adminStatusFilter').value;
    const limit = 15;
    const from = (adminCurrentPage - 1) * limit;
    const to = from + limit - 1;

    try {
        let data = [];
        let pagination = null;

        switch (tab) {
            case 'donations': {
                let query = supabaseClient.from('donations')
                    .select('*', { count: 'exact' })
                    .order('created_at', { ascending: false })
                    .range(from, to);
                if (status) query = query.eq('current_status', status);
                if (search) query = query.or(`tracking_id.ilike.%${search}%,donor_name.ilike.%${search}%`);
                const { data: rows, count, error } = await query;
                if (error) throw error;
                data = rows || [];
                pagination = { page: adminCurrentPage, total_pages: Math.ceil((count || 0) / limit) };
                break;
            }
            case 'requests': {
                let query = supabaseClient.from('requests')
                    .select('*', { count: 'exact' })
                    .order('created_at', { ascending: false })
                    .range(from, to);
                if (status) query = query.eq('current_status', status);
                if (search) query = query.or(`tracking_id.ilike.%${search}%,contact_name.ilike.%${search}%`);
                const { data: rows, count, error } = await query;
                if (error) throw error;
                data = rows || [];
                pagination = { page: adminCurrentPage, total_pages: Math.ceil((count || 0) / limit) };
                break;
            }
            case 'users': {
                let query = supabaseClient.from('users')
                    .select('*', { count: 'exact' })
                    .order('created_at', { ascending: false })
                    .range(from, to);
                if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
                const { data: rows, count, error } = await query;
                if (error) throw error;
                data = rows || [];
                pagination = { page: adminCurrentPage, total_pages: Math.ceil((count || 0) / limit) };
                break;
            }
            case 'recycle': {
                let query = supabaseClient.from('recycling_redirects')
                    .select('*', { count: 'exact' })
                    .order('created_at', { ascending: false })
                    .range(from, to);
                if (status) query = query.eq('current_status', status);
                const { data: rows, count, error } = await query;
                if (error) throw error;
                data = rows || [];
                pagination = { page: adminCurrentPage, total_pages: Math.ceil((count || 0) / limit) };
                break;
            }
        }

        renderAdminTable(tab, data, pagination);
    } catch (error) {
        console.error('Admin data load error:', error);
        loadAdminDataFromLocal(tab, search, status);
    }
}

// Fallback: load from localStorage when API is not available
function loadAdminDataFromLocal(tab, search, status) {
    const searchLower = (search || '').toLowerCase();

    if (tab === 'donations') {
        let data = donations.map((d, i) => ({
            tracking_id: (() => { const _d = new Date(d.createdAt); return `GU-DON-${String(_d.getDate()).padStart(2,'0')}${String(_d.getMonth()+1).padStart(2,'0')}${_d.getFullYear()}-${String(d.id).slice(-3).padStart(3,'0')}`; })(),
            donor_name: d.name || d.userName,
            device_type: d.device,
            current_status: (d.status || 'submitted').toLowerCase().replace(/\s/g, '_'),
            created_at: d.createdAt,
            id: d.id
        }));
        if (searchLower) data = data.filter(d => d.tracking_id.toLowerCase().includes(searchLower) || (d.donor_name || '').toLowerCase().includes(searchLower));
        if (status) data = data.filter(d => d.current_status === status);
        renderAdminTable('donations', data, null);
    } else if (tab === 'requests') {
        let data = requests.map((r, i) => ({
            tracking_id: (() => { const _r = new Date(r.createdAt); return `GU-REQ-${String(_r.getDate()).padStart(2,'0')}${String(_r.getMonth()+1).padStart(2,'0')}${_r.getFullYear()}-${String(r.id).slice(-3).padStart(3,'0')}`; })(),
            contact_name: r.name || r.userName,
            equipment_type: r.equipment,
            quantity: r.quantity || 1,
            current_status: (r.status || 'submitted').toLowerCase().replace(/\s/g, '_'),
            created_at: r.createdAt,
            id: r.id
        }));
        if (searchLower) data = data.filter(r => r.tracking_id.toLowerCase().includes(searchLower) || (r.contact_name || '').toLowerCase().includes(searchLower));
        if (status) data = data.filter(r => r.current_status === status);
        renderAdminTable('requests', data, null);
    } else if (tab === 'users') {
        renderAdminTable('users', [], null);
    } else {
        renderAdminTable('recycle', [], null);
    }
}

function renderAdminTable(tab, data, pagination) {
    const tbody = document.getElementById(`${tab}TableBody`);
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="table-empty">ไม่พบข้อมูล</td></tr>`;
        return;
    }

    tbody.innerHTML = '';

    data.forEach(item => {
        const tr = document.createElement('tr');
        const statusClass = 's-' + (item.current_status || 'pending');
        const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-';

        switch (tab) {
            case 'donations':
                const isVerified = item.current_status === 'verified';
                const verifyBtn = isVerified
                    ? `<span class="status-verified">✓ ตรวจสอบแล้ว</span>`
                    : `<button class="admin-action-btn verify" onclick="openVerifyModal('${item.id}')" title="ตรวจสอบ">ตรวจสอบ</button>`;
                const donationStatusDisplay = isVerified
                    ? `<span class="table-status s-verified">Verified</span>`
                    : `<span class="table-status ${statusClass}">${getStatusDisplayEn(item.current_status)}</span>`;
                tr.innerHTML = `
                    <td class="tracking-cell">${item.tracking_id || '-'}</td>
                    <td>${item.donor_name || '-'}</td>
                    <td>${item.device_type || '-'}</td>
                    <td>${donationStatusDisplay}</td>
                    <td>${dateStr}</td>
                    <td class="table-actions">
                        ${verifyBtn}
                        <button class="admin-action-btn" onclick="openStatusModal('${item.id}', 'donation', '${item.current_status}')" title="แก้ไข">แก้ไข</button>
                        <button class="admin-action-btn delete" onclick="adminDeleteDonation('${item.id}')" title="ลบ">ลบ</button>
                    </td>
                `;
                break;
            case 'requests':
                const isPublic = item.is_public_post;
                const approveBtn = isPublic
                    ? `<button class="admin-action-btn" onclick="adminTogglePostVisibility('${item.id}', false)" title="ซ่อนโพสต์">ซ่อน</button>`
                    : `<button class="admin-action-btn approve" onclick="openApproveRequestModal('${item.id}')" title="อนุมัติเป็นโพสต์">อนุมัติ</button>`;
                tr.innerHTML = `
                    <td class="tracking-cell">${item.tracking_id || '-'}</td>
                    <td>${item.contact_name || '-'}</td>
                    <td>${item.equipment_type || '-'}</td>
                    <td>${item.quantity || 1}</td>
                    <td><span class="table-status ${statusClass}">${getStatusDisplayEn(item.current_status)}</span></td>
                    <td>${dateStr}</td>
                    <td class="table-actions">
                        ${approveBtn}
                        <button class="admin-action-btn" onclick="openStatusModal('${item.id}', 'request', '${item.current_status}')" title="แก้ไข">แก้ไข</button>
                        <button class="admin-action-btn delete" onclick="adminDeleteRequest('${item.id}')" title="ลบ">ลบ</button>
                    </td>
                `;
                break;
            case 'users':
                tr.innerHTML = `
                    <td>${item.id ? String(item.id).slice(0, 8) + '...' : '-'}</td>
                    <td>${item.name || '-'}</td>
                    <td>${item.email || '-'}</td>
                    <td><span class="table-status s-${item.role || 'user'}">${item.role || 'user'}</span></td>
                    <td>${dateStr}</td>
                    <td class="table-actions">
                        <select class="role-select" onchange="adminChangeUserRole('${item.id}', this.value)">
                            <option value="user" ${(item.role === 'user') ? 'selected' : ''}>user</option>
                            <option value="admin" ${(item.role === 'admin') ? 'selected' : ''}>admin</option>
                        </select>
                    </td>
                `;
                break;
            case 'recycle':
                tr.innerHTML = `
                    <td>${item.id}</td>
                    <td>${item.device_type || '-'}</td>
                    <td>${item.device_count || '-'}</td>
                    <td>${item.recycling_partner || 'Wongpanit'}</td>
                    <td><span class="table-status ${statusClass}">${getStatusDisplayEn(item.current_status)}</span></td>
                    <td>${dateStr}</td>
                    <td class="table-actions">
                        <button class="admin-action-btn" onclick="openStatusModal('${item.id}', 'recycle', '${item.current_status}')" title="แก้ไข">แก้ไข</button>
                        <button class="admin-action-btn delete" onclick="adminDeleteRecycle('${item.id}')" title="ลบ">ลบ</button>
                    </td>
                `;
                break;
        }

        tbody.appendChild(tr);
    });

    // Render pagination if available
    if (pagination && pagination.total_pages > 1) {
        renderAdminPagination(pagination);
    } else {
        document.getElementById('adminPagination').innerHTML = '';
    }
}

function renderAdminPagination(pagination) {
    const container = document.getElementById('adminPagination');
    container.innerHTML = '';

    for (let i = 1; i <= pagination.total_pages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === pagination.page ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => {
            adminCurrentPage = i;
            loadAdminData(adminCurrentTab);
        };
        container.appendChild(btn);
    }
}

function filterAdminTable() {
    adminCurrentPage = 1;
    loadAdminData(adminCurrentTab);
}

// Status update modal
function openStatusModal(id, type, currentStatus) {
    document.getElementById('statusItemId').value = id;
    document.getElementById('statusItemType').value = type;
    document.getElementById('statusSelect').value = currentStatus || 'submitted';
    document.getElementById('statusLocation').value = '';
    document.getElementById('statusNote').value = '';
    document.getElementById('statusModal').classList.add('active');
}

function closeStatusModal() {
    document.getElementById('statusModal').classList.remove('active');
}

async function submitStatusUpdate() {
    const id = document.getElementById('statusItemId').value;
    const type = document.getElementById('statusItemType').value;
    const newStatus = document.getElementById('statusSelect').value;
    const location = document.getElementById('statusLocation').value.trim();
    const note = document.getElementById('statusNote').value.trim();

    if (!id || !type) {
        showNotification('ข้อมูลไม่ครบ', 'error');
        return;
    }

    try {
        // Update the record's current_status
        let tableName = '';
        let timelineKey = '';

        if (type === 'donation') {
            tableName = 'donations';
            timelineKey = 'donation_id';
        } else if (type === 'request') {
            tableName = 'requests';
            timelineKey = 'request_id';
        } else if (type === 'recycle') {
            tableName = 'recycling_redirects';
        }

        const { error: updateError } = await supabaseClient
            .from(tableName)
            .update({ current_status: newStatus })
            .eq('id', parseInt(id));

        if (updateError) throw updateError;

        // Add timeline entry (not for recycle)
        if (type !== 'recycle') {
            const statusThMap = {
                'submitted': 'ส่งคำขอแล้ว', 'verified': 'ตรวจสอบข้อมูลเรียบร้อย',
                'scheduled': 'นัดหมายรับอุปกรณ์แล้ว', 'picked_up': 'รับอุปกรณ์แล้ว',
                'processing': 'กำลังตรวจสอบและเตรียมอุปกรณ์', 'data_wiped': 'ลบข้อมูลเรียบร้อย',
                'ready': 'พร้อมมอบให้ผู้รับ', 'distributed': 'ส่งมอบแล้ว',
                'completed': 'เสร็จสมบูรณ์', 'under_review': 'กำลังพิจารณา',
                'approved': 'อนุมัติแล้ว', 'rejected': 'ไม่อนุมัติ',
                'matching': 'กำลังหาอุปกรณ์ให้', 'preparing': 'เตรียมจัดส่ง',
                'in_transit': 'กำลังจัดส่ง', 'delivered': 'จัดส่งแล้ว'
            };

            const timelineEntry = {
                [timelineKey]: parseInt(id),
                status: newStatus,
                status_display_th: statusThMap[newStatus] || newStatus,
                status_display_en: getStatusDisplayEn(newStatus),
                location: location || null,
                note: note || null,
                staff_name: currentUser?.name || 'Admin'
            };

            await supabaseClient.from('tracking_timeline').insert(timelineEntry);
        }

        closeStatusModal();
        showNotification('อัปเดตสถานะสำเร็จ!', 'success');
        loadAdminData(adminCurrentTab);
    } catch (error) {
        console.error('Status update error:', error);
        showNotification('อัปเดตสถานะไม่สำเร็จ: ' + error.message, 'error');
    }
}

// Load admin stats
async function loadAdminStats() {
    try {
        const [donationsRes, requestsRes, usersRes, carbonRes] = await Promise.all([
            supabaseClient.from('donations').select('id', { count: 'exact', head: true }),
            supabaseClient.from('requests').select('id', { count: 'exact', head: true }),
            supabaseClient.from('users').select('id', { count: 'exact', head: true }),
            supabaseClient.from('donations').select('carbon_saved')
        ]);

        document.getElementById('statDonations').textContent = donationsRes.count || 0;
        document.getElementById('statRequests').textContent = requestsRes.count || 0;
        document.getElementById('statUsers').textContent = usersRes.count || 0;

        const totalCarbon = (carbonRes.data || []).reduce((sum, d) => sum + (parseFloat(d.carbon_saved) || 0), 0);
        document.getElementById('statCarbon').textContent = totalCarbon.toFixed(1);
    } catch (error) {
        console.error('Admin stats error:', error);
        // Fallback to localStorage
        document.getElementById('statDonations').textContent = donations.length;
        document.getElementById('statRequests').textContent = requests.length;
        document.getElementById('statUsers').textContent = '0';
        document.getElementById('statCarbon').textContent = '0';
    }
}

function showDonatePostsView(clearRecipient = true) {
    document.getElementById('donatePostsView').style.display = '';
    document.getElementById('donateFormView').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (clearRecipient) {
        selectedRecipientRequestId = null;
        selectedRecipientPost = null;
        const banner = document.getElementById('donationTargetBanner');
        if (banner) banner.style.display = 'none';
    }
}

function showDonateFormView(withRecipient = true) {
    document.getElementById('donatePostsView').style.display = 'none';
    document.getElementById('donateFormView').style.display = '';
    updateFormStepBar('donate', 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const bar = document.getElementById('donateStepBar');
    if (bar) bar.classList.remove('psl-visible');
}

// Load request posts for donate page
async function loadRequestPosts() {
    const grid = document.getElementById('donatePostsGrid');
    if (!grid) return;

    if (!supabaseClient) {
        grid.innerHTML = '<div class="posts-loading">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่</div>';
        return;
    }

    try {
        const { data: posts, error } = await supabaseClient
            .from('requests')
            .select('*')
            .eq('is_public_post', true)
            .in('fulfillment_status', ['open', 'partially_fulfilled'])
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!posts || posts.length === 0) {
            grid.innerHTML = '<div class="posts-loading">ยังไม่มีคำขอรับบริจาคในขณะนี้</div>';
            return;
        }

        const orgTypeLabels = {
            'school': 'โรงเรียน',
            'foundation': 'มูลนิธิ'
        };

        const equipTypeLabels = {
            'Computer': 'คอมพิวเตอร์',
            'Laptop': 'แล็ปท็อป',
            'Tablet': 'แท็บเล็ต',
            'Phone': 'โทรศัพท์'
        };

        // Count linked donations per request — total and per device type
        const postIds = posts.map(p => p.id);
        let donationCounts = {};     // { requestId: totalCount }
        let receivedByType = {};     // { requestId: { Computer: N, Laptop: N, ... } }
        try {
            const { data: linkedDonations } = await supabaseClient
                .from('donations')
                .select('id, direct_donation_to_request_id, total_items')
                .in('direct_donation_to_request_id', postIds);
            if (linkedDonations && linkedDonations.length > 0) {
                const donIdToReqId = {};
                linkedDonations.forEach(d => { donIdToReqId[d.id] = d.direct_donation_to_request_id; });

                const donationIds = linkedDonations.map(d => d.id);
                const { data: items } = await supabaseClient
                    .from('donation_items')
                    .select('donation_id, device_type')
                    .in('donation_id', donationIds);

                if (items && items.length > 0) {
                    items.forEach(item => {
                        const rid = donIdToReqId[item.donation_id];
                        if (!rid) return;
                        if (!receivedByType[rid]) receivedByType[rid] = {};
                        receivedByType[rid][item.device_type] = (receivedByType[rid][item.device_type] || 0) + 1;
                    });
                    // Sum up totals from item-level data
                    Object.entries(receivedByType).forEach(([rid, map]) => {
                        donationCounts[rid] = Object.values(map).reduce((s, n) => s + n, 0);
                    });
                } else {
                    // Fallback: use total_items from donations if no donation_items found
                    linkedDonations.forEach(d => {
                        const rid = d.direct_donation_to_request_id;
                        donationCounts[rid] = (donationCounts[rid] || 0) + (d.total_items || 1);
                    });
                }
            }
        } catch (e) { console.warn('Could not count linked donations:', e); }

        const EQUIP_ICONS = { 'คอมพิวเตอร์': '🖥️', 'แล็ปท็อป': '💻', 'แท็บเล็ต': '📱', 'โทรศัพท์มือถือ': '📱' };

        grid.innerHTML = posts.map(post => {
            const requested = post.quantity || 0;
            const received = post.quantity_received || donationCounts[post.id] || 0;
            const percent = requested > 0 ? Math.min(100, Math.round((received / requested) * 100)) : 0;
            const remaining = Math.max(0, requested - received);

            // Parse per-device breakdown from equipment_detail (JSON from new form format)
            const postReceivedByType = receivedByType[post.id] || {};
            let perDeviceRows = '';
            try {
                const detail = JSON.parse(post.equipment_detail || '');
                if (Array.isArray(detail) && detail.length > 0) {
                    perDeviceRows = detail.map(d => {
                        const icon = EQUIP_ICONS[d.type] || '📦';
                        const qty = d.quantity || 0;
                        const deviceKey = EQUIP_TYPE_TO_KEY[d.type] || d.type;
                        const recv = postReceivedByType[deviceKey] || 0;
                        const done = recv >= qty && qty > 0;
                        return `<div class="post-device-row">
                            <span class="post-device-type">${icon} ${d.type}</span>
                            <span class="post-device-qty ${done ? 'post-device-qty-done' : recv > 0 ? 'post-device-qty-partial' : ''}">${recv}/${qty} เครื่อง</span>
                        </div>`;
                    }).join('');
                }
            } catch (_) {}

            // Fallback: show combined label if no per-device data
            if (!perDeviceRows) {
                const equipLabel = getEquipLabels(post.equipment_type);
                const totalRecv = donationCounts[post.id] || 0;
                const done = totalRecv >= requested && requested > 0;
                perDeviceRows = `<div class="post-device-row">
                    <span class="post-device-type">📦 ${equipLabel}</span>
                    <span class="post-device-qty ${done ? 'post-device-qty-done' : totalRecv > 0 ? 'post-device-qty-partial' : ''}">${totalRecv}/${requested} เครื่อง</span>
                </div>`;
            }

            const isImageUrl = (url) => url && /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
            const getFirstImgUrl = (raw) => {
                if (!raw) return null;
                if (raw.startsWith('[')) { try { const a = JSON.parse(raw); return a.find(u => isImageUrl(u)) || null; } catch(e){} }
                return isImageUrl(raw) ? raw : null;
            };
            const postImg = post.post_image_url ||
                getFirstImgUrl(post.document_url) ||
                'https://images.unsplash.com/photo-1588072432836-e10032774350?w=400&h=300&fit=crop';

            return `
            <div class="request-post-card" data-request-id="${post.id}">
                <div class="post-image">
                    <img src="${escapeHtml(postImg)}" alt="${escapeHtml(post.project_name)}" loading="lazy">
                    <div class="post-badge">${escapeHtml(orgTypeLabels[post.org_type] || post.org_type)}</div>
                </div>
                <div class="post-content">
                    <div class="post-title">${escapeHtml(post.project_name)}</div>
                    <div class="post-contact">👤 ${escapeHtml(post.contact_name)}</div>
                    <div class="post-overview-wrap">
                        <div class="post-overview-text" data-full="${escapeHtml(post.project_overview || '')}">${escapeHtml(post.project_overview || '')}</div>
                        <button class="post-read-more" onclick="toggleOverview(this)">▼ อ่านเพิ่มเติม</button>
                    </div>
                    <hr class="post-divider">
                    <div class="post-device-table">${perDeviceRows}</div>
                    <div class="post-progress-section">
                        <div class="post-progress-bar-wrap">
                            <div class="progress-bar-track">
                                <div class="progress-bar-fill ${percent >= 100 ? 'complete' : ''}" style="width:${percent}%"></div>
                            </div>
                            <span class="post-progress-percent">${percent}%</span>
                        </div>
                        <div class="post-progress-detail">
                            ${received > 0 ? `ได้รับแล้ว ${received} จาก ${requested} เครื่อง` : 'ยังไม่มีผู้บริจาค'}
                            ${remaining > 0 ? ` · ยังต้องการอีก <strong>${remaining}</strong> เครื่อง` : ' · <span style="color:#2f5233">✅ ครบแล้ว</span>'}
                        </div>
                    </div>
                    <button class="btn-donate-direct" onclick="donateToRequest(${post.id})">บริจาคให้องค์กรนี้</button>
                </div>
            </div>
        `}).join('');

        // Show "read more" buttons for overflowing descriptions
        grid.querySelectorAll('.post-overview-text').forEach(el => {
            if (el.scrollHeight > el.clientHeight + 2) {
                el.nextElementSibling?.style && (el.nextElementSibling.style.display = 'inline-block');
            }
        });

        // Limit to 9 cards (3 rows × 3 cols); show "ดูเพิ่มเติม" if more
        const INITIAL_LIMIT = 9;
        const actionArea = document.getElementById('postsActionArea');
        if (posts.length > INITIAL_LIMIT) {
            const cards = grid.querySelectorAll('.request-post-card');
            cards.forEach((card, i) => { if (i >= INITIAL_LIMIT) card.style.display = 'none'; });
            if (actionArea) {
                actionArea.innerHTML = `<button onclick="showAllRequestPosts()" style="padding:0.75rem 2.2rem;border:2px solid var(--primary);color:var(--primary);background:transparent;border-radius:10px;cursor:pointer;font-size:1rem;font-family:'Crimson Text',serif;font-weight:700;transition:0.2s;" onmouseover="this.style.background='var(--primary)';this.style.color='#fff'" onmouseout="this.style.background='transparent';this.style.color='var(--primary)'">ดูโครงการทั้งหมด (${posts.length - INITIAL_LIMIT} เพิ่มเติม)</button>`;
            }
        } else if (actionArea) {
            actionArea.innerHTML = '';
        }
    } catch (error) {
        console.error('Failed to load request posts:', error);
        grid.innerHTML = '<div class="posts-loading">ไม่สามารถโหลดข้อมูลได้</div>';
    }
}

function showAllRequestPosts() {
    const grid = document.getElementById('donatePostsGrid');
    if (grid) grid.querySelectorAll('.request-post-card').forEach(c => c.style.display = '');
    const actionArea = document.getElementById('postsActionArea');
    if (actionArea) actionArea.innerHTML = '';
}

// Direct donation to specific request
async function donateToRequest(requestId) {
    selectedRecipientRequestId = requestId;
    selectedRecipientPost = null;

    // Fetch post data BEFORE navigating so device auto-select works on first render
    if (supabaseClient) {
        try {
            const { data } = await supabaseClient.from('requests').select('*').eq('id', requestId).single();
            if (data) selectedRecipientPost = data;
        } catch(e) { console.warn('Could not fetch post data:', e); }
    }

    navigateToPage('donate');
    showDonateFormView(true);
    showDonationTargetBanner();

    // Auto-select required device type — only if exactly one type requested
    const autoKeys = selectedRecipientPost ? getEquipKeys(selectedRecipientPost.equipment_type) : [];
    if (autoKeys.length === 1) {
        donationItems.forEach(item => {
            item.device_type = autoKeys[0];
            item.device_brand = '';
            item.device_model = '';
            item.device_weight = 0;
        });
    }
    // Always re-render so device locks are applied immediately
    renderDonationItems();
}

function showDonationTargetBanner() {
    const banner = document.getElementById('donationTargetBanner');
    if (!banner || !selectedRecipientPost) return;
    const orgLabels = { school: 'โรงเรียน', foundation: 'มูลนิธิ', organization: 'องค์กร' };
    const p = selectedRecipientPost;
    const equip = getEquipLabels(p.equipment_type) || p.equipment_type || '';
    const org = orgLabels[p.org_type] || p.org_type || '';
    const isImgUrl = (u) => u && /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(u);
    const getFirstImg = (raw) => {
        if (!raw) return null;
        if (raw.startsWith('[')) { try { const a = JSON.parse(raw); return a.find(u => isImgUrl(u)) || null; } catch(e){} }
        return isImgUrl(raw) ? raw : null;
    };
    const defaultImg = 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=400&h=300&fit=crop';
    const img = p.post_image_url || getFirstImg(p.document_url) || defaultImg;
    banner.style.display = 'block';
    banner.innerHTML = `
        <div class="donation-target-banner">
            <div class="target-banner-img">
                <img src="${escapeHtml(img)}" alt="${escapeHtml(p.project_name)}">
                <span class="target-badge">${escapeHtml(org)}</span>
            </div>
            <div class="target-banner-body">
                <h3 class="target-title">${escapeHtml(p.project_name)}</h3>
                ${p.project_overview ? `<p class="target-overview">${escapeHtml(p.project_overview)}</p>` : ''}
                <div class="target-details">
                    <div class="target-detail-item">
                        <span class="target-detail-icon">📦</span>
                        <span>ต้องการ <strong>${escapeHtml(equip)}</strong> จำนวน <strong>${p.quantity || '?'} เครื่อง</strong></span>
                    </div>
                    ${p.contact_name ? `<div class="target-detail-item"><span class="target-detail-icon">👤</span><span>ผู้ติดต่อ: ${escapeHtml(p.contact_name)}</span></div>` : ''}
                    ${p.address ? `<div class="target-detail-item"><span class="target-detail-icon">📍</span><span>${escapeHtml(p.address)}</span></div>` : ''}
                </div>
                <div class="target-restriction-note">
                    <span class="restriction-icon">⚠️</span>
                    รับบริจาคเฉพาะ <strong>${escapeHtml(equip)}</strong> เท่านั้น
                </div>
            </div>
        </div>
    `;
}

function clearDonationTarget() {
    selectedRecipientRequestId = null;
    selectedRecipientPost = null;
    const banner = document.getElementById('donationTargetBanner');
    if (banner) banner.style.display = 'none';
    renderDonationItems();
}

// Initialize admin page when navigated to
const origNavigate = navigateToPage;
navigateToPage = function (pageName) {
    if (pageName === 'admin') {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification('ไม่มีสิทธิ์เข้าถึงหน้านี้', 'error');
            navigateToPage('home');
            return;
        }
    }
    origNavigate(pageName);
    if (pageName === 'admin') {
        loadAdminStats();
        loadAdminData('donations');
    }
    if (pageName === 'donate') {
        showDonatePostsView(false);
        loadRequestPosts();
    }
    if (pageName === 'request') {
        const banner = document.getElementById('reqLoginBanner');
        if (banner) banner.style.display = currentUser ? 'none' : '';
    }
};

// Close status modal on outside click
document.addEventListener('DOMContentLoaded', () => {
    const statusModal = document.getElementById('statusModal');
    statusModal?.addEventListener('click', (e) => {
        if (e.target === statusModal) closeStatusModal();
    });
});

// === BFCACHE HANDLING ===

// pagehide fires when page is about to be frozen into bfcache
window.addEventListener('pagehide', (e) => {
    if (e.persisted) {
        // Abort any pending confirm modal Promise so it doesn't block on restore
        if (_confirmReject) { _confirmReject(); _confirmReject = null; }
        // Unsubscribe realtime channel — stale WebSocket connections break Supabase after restore
        if (_impactChannel && supabaseClient) {
            supabaseClient.removeChannel(_impactChannel);
            _impactChannel = null;
        }
    }
});

// pageshow fires on fresh load AND on bfcache restore (e.persisted = true)
window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return; // normal load handled by DOMContentLoaded
    // --- bfcache restore ---

    // 1. Abort any pending confirm modal Promise so it doesn't block on restore
    if (_confirmReject) { _confirmReject(); _confirmReject = null; }

    // 2. Clear all stuck modals (handle both .active class and style.display variants)
    ['customConfirmModal', 'loginModal', 'registerModal', 'confirmModal',
     'statusModal', 'verifyModal', 'approveRequestModal'].forEach(id => {
        document.getElementById(id)?.classList.remove('active');
    });
    const slm = document.getElementById('shippingLabelModal');
    if (slm) slm.style.display = 'none';

    // 3. Reset submit guard in case submission was frozen mid-flight
    _isSubmitting = false;

    // 4. Re-subscribe realtime (channel was removed in pagehide)
    subscribeImpactRealtime();

    // 5. Sync currentUser from cached session — getSession() reads localStorage only,
    //    NO network request, NO lock. autoRefreshToken handles expiry transparently
    //    when the next Supabase operation actually runs.
    //    (refreshSession() was here before but it acquired a navigator.locks lock that
    //     blocked concurrent DB/storage calls in submitDonation, causing the "frozen"
    //     behaviour when returning to the page mid-fill.)
    if (supabaseClient) {
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                currentUser = {
                    id: session.user.id,
                    name: currentUser?.name || session.user.email.split('@')[0],
                    email: session.user.email,
                    role: currentUser?.role || 'user',
                    phone: currentUser?.phone || ''
                };
                localStorage.setItem('gearup_current_user', JSON.stringify(currentUser));
            } else if (!currentUser) {
                // bfcache preserved currentUser — only fall back if it was already null
                const saved = localStorage.getItem('gearup_current_user');
                if (saved) currentUser = JSON.parse(saved);
            }
        }).catch(() => {});
    }
});

// === ADMIN VERIFICATION ===
async function openVerifyModal(donationId) {
    document.getElementById('verifyDonationId').value = donationId;

    if (!supabaseClient) {
        showNotification('ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
        return;
    }

    try {
        const { data: items, error } = await supabaseClient
            .from('donation_items')
            .select('*')
            .eq('donation_id', donationId);

        if (error) throw error;

        const list = document.getElementById('verifyItemsList');
        const deviceIcons = {
            'Computer': '🖥️', 'Laptop': '💻', 'Tablet': '📱', 'Phone': '📞'
        };

        list.innerHTML = items.map(item => `
            <div class="verify-item">
                <input type="checkbox" id="verifyItem_${item.id}" data-item-id="${item.id}"
                       ${item.admin_verified ? 'checked disabled' : ''}>
                <div class="verify-item-info">
                    <div class="verify-item-type">
                        ${deviceIcons[item.device_type] || '📦'} ${item.device_type}
                        ${item.device_brand ? '- ' + item.device_brand : ''}
                        ${item.device_model || ''}
                    </div>
                    <div class="verify-item-detail">
                        น้ำหนัก: ${item.device_weight} กก. | Carbon: ${item.carbon_saved} kgCO2e
                    </div>
                </div>
                ${item.admin_verified ? '<span class="verified-badge">✓ ตรวจสอบแล้ว</span>' : ''}
            </div>
        `).join('');

        document.getElementById('verifyModal').classList.add('active');
    } catch (error) {
        console.error('Load verification items error:', error);
        showNotification('ไม่สามารถโหลดข้อมูลได้', 'error');
    }
}

function closeVerifyModal() {
    document.getElementById('verifyModal').classList.remove('active');
}

async function submitVerification() {
    const donationId = document.getElementById('verifyDonationId').value;
    const notes = document.getElementById('verifyNotes').value.trim();
    const functional = document.getElementById('verifyFunctional').checked;
    const delivered = document.getElementById('verifyDelivered').checked;

    if (!functional || !delivered) {
        showNotification('กรุณายืนยันทุกรายการก่อนบันทึก', 'error');
        return;
    }

    if (!supabaseClient || !currentUser) {
        showNotification('กรุณาเข้าสู่ระบบ', 'error');
        return;
    }

    try {
        // Update donation items verification
        const { error } = await supabaseClient
            .from('donation_items')
            .update({
                admin_verified: true,
                admin_verified_by: currentUser.id,
                admin_verified_at: new Date().toISOString(),
                verification_notes: notes || null
            })
            .eq('donation_id', donationId);

        if (error) throw error;

        // Update donation status to 'verified'
        const { error: statusError } = await supabaseClient
            .from('donations')
            .update({ current_status: 'verified' })
            .eq('id', donationId);

        if (statusError) console.warn('Status update warning:', statusError);

        showNotification('บันทึกการตรวจสอบสำเร็จ', 'success');
        closeVerifyModal();
        document.getElementById('verifyForm').reset();

        // Refresh admin data if available
        if (typeof loadAdminData === 'function') {
            loadAdminData('donations');
        }
    } catch (error) {
        console.error('Verification error:', error);
        showNotification('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
}

// === RECYCLE FORM: Dynamic Serial Number Inputs ===
function updateRecycleSerialInputs(count) {
    const container = document.getElementById('recycleSerialContainer');
    if (!container) return;
    const n = Math.max(1, Math.min(50, parseInt(count) || 1));

    // Preserve existing values
    const existing = Array.from(container.querySelectorAll('.recycle-serial-input')).map(el => el.value);

    container.innerHTML = '';
    for (let i = 0; i < n; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'recycle-serial-input';
        input.placeholder = `เลขซีเรียลเครื่องที่ ${i + 1}`;
        if (existing[i]) input.value = existing[i];
        container.appendChild(input);
    }

    // Update total weight hint
    updateRecycleTotalWeight();
}

function updateRecycleTotalWeight() {
    const count = parseInt(document.getElementById('recycleCount')?.value) || 1;
    const weight = parseFloat(document.getElementById('recycleWeight')?.value) || 0;
    const hint = document.getElementById('recycleWeightHint');
    if (!hint) return;

    if (weight > 0 && count > 1) {
        const total = (weight * count).toFixed(1);
        hint.textContent = `⚖️ น้ำหนักรวมทั้งหมด: ${total} กก.`;
        hint.style.display = 'block';
    } else if (weight > 0 && count === 1) {
        hint.textContent = `⚖️ น้ำหนัก: ${weight} กก.`;
        hint.style.display = 'block';
    } else {
        hint.style.display = 'none';
    }
}

// === RECYCLE FORM: Brand/Model Cascade ===
function onRecycleDeviceTypeChange(deviceType) {
    const brandSelect = document.getElementById('recycleBrand');
    const modelSelect = document.getElementById('recycleModel');
    const weightInput = document.getElementById('recycleWeight');
    const weightHint = document.getElementById('recycleWeightHint');

    // Reset downstream
    modelSelect.innerHTML = '<option value="">-- เลือกยี่ห้อก่อน --</option>';
    modelSelect.disabled = true;
    weightInput.value = '';
    if (weightHint) weightHint.style.display = 'none';

    const db = DEVICE_DATABASE[deviceType];
    if (!db) {
        brandSelect.innerHTML = '<option value="">-- ไม่มียี่ห้อในระบบ --</option>';
        brandSelect.disabled = true;
        return;
    }

    const brands = Object.keys(db);
    brandSelect.innerHTML = '<option value="">-- เลือกยี่ห้อ --</option>' +
        brands.map(b => `<option value="${b}">${b}</option>`).join('') +
        '<option value="__other__">อื่นๆ</option>';
    brandSelect.disabled = false;
}

function onRecycleBrandChange(brand) {
    const modelSelect = document.getElementById('recycleModel');
    const weightInput = document.getElementById('recycleWeight');
    const weightHint = document.getElementById('recycleWeightHint');
    const deviceType = document.getElementById('recycleDeviceType').value;

    weightInput.value = '';
    if (weightHint) weightHint.style.display = 'none';

    if (!brand || brand === '__other__') {
        modelSelect.innerHTML = '<option value="">-- กรอกข้อมูลเอง --</option>';
        modelSelect.disabled = true;
        return;
    }

    const db = DEVICE_DATABASE[deviceType];
    const models = db ? db[brand] : null;
    if (!models || models.length === 0) {
        modelSelect.innerHTML = '<option value="">-- ไม่มีรุ่นในระบบ --</option>';
        modelSelect.disabled = true;
        return;
    }

    modelSelect.innerHTML = '<option value="">-- เลือกรุ่น --</option>' +
        models.map(m => `<option value="${m.model}" data-weight="${m.weight}">${m.model} (${m.weight} กก.)</option>`).join('') +
        '<option value="__other__">อื่นๆ</option>';
    modelSelect.disabled = false;
}

function onRecycleModelChange(model) {
    const modelSelect = document.getElementById('recycleModel');
    const weightInput = document.getElementById('recycleWeight');
    const weightHint = document.getElementById('recycleWeightHint');

    if (!model || model === '__other__') {
        weightInput.value = '';
        if (weightHint) weightHint.style.display = 'none';
        return;
    }

    const selectedOption = modelSelect.options[modelSelect.selectedIndex];
    const weight = selectedOption?.dataset?.weight;
    if (weight) {
        weightInput.value = weight;
        if (weightHint) {
            weightHint.textContent = '⚖️ เติมอัตโนมัติจากฐานข้อมูล';
            weightHint.style.display = 'block';
        }
    }
}

// === RECYCLE FORM SUBMIT ===
async function submitRecycleForm() {
    const deviceType = document.getElementById('recycleDeviceType').value;
    const brand = document.getElementById('recycleBrand').value;
    const model = document.getElementById('recycleModel').value;
    const serialInputs = document.querySelectorAll('#recycleSerialContainer .recycle-serial-input');
    const serials = Array.from(serialInputs).map(el => el.value.trim()).filter(Boolean);
    const serialStr = serials.join(', ');
    const count = parseInt(document.getElementById('recycleCount').value);
    const weight = parseFloat(document.getElementById('recycleWeight').value);
    const condition = document.getElementById('recycleCondition').value;
    const reason = document.getElementById('recycleReason').value.trim();
    const senderName = document.getElementById('recycleSenderName')?.value?.trim() || '';
    const senderTel = document.getElementById('recycleSenderTel')?.value?.trim() || '';
    const senderEmail = document.getElementById('recycleSenderEmail')?.value?.trim() || '';
    const recycleAddrDetail = document.getElementById('recycleSenderAddressDetail')?.value?.trim() || '';
    const recycleSub = document.getElementById('recycleSenderSubdistrict')?.value?.trim() || '';
    const recycleDist = document.getElementById('recycleSenderDistrict')?.value?.trim() || '';
    const recycleProvince = document.getElementById('recycleSenderProvince')?.value || '';
    const recyclePostcode = document.getElementById('recycleSenderPostcode')?.value?.trim() || '';
    const senderAddress = [
        recycleAddrDetail,
        recycleSub ? `ตำบล/แขวง ${recycleSub}` : '',
        recycleDist ? `อำเภอ/เขต ${recycleDist}` : '',
        recycleProvince ? `จังหวัด${recycleProvince}` : '',
        recyclePostcode,
    ].filter(Boolean).join(' ');
    const certRequested = document.getElementById('recycleCertRequested')?.checked || false;

    // Validation
    if (!deviceType || !count || !weight || !condition || !reason) {
        showNotification('กรุณากรอกข้อมูลอุปกรณ์ให้ครบถ้วน', 'error');
        return;
    }
    if (!senderName || !senderTel) {
        showNotification('กรุณากรอกชื่อและเบอร์โทรผู้ส่ง', 'error');
        return;
    }

    // Confirm before submitting
    const confirmed = await showConfirmModal(
        'ยืนยันการส่งรีไซเคิล',
        'ต้องการส่งอุปกรณ์ไปรีไซเคิลใช่หรือไม่?'
    );
    if (!confirmed) return;

    const rcyTrackingId = await generateTrackingId('RCY');

    const recycleData = {
        device_type: deviceType,
        device_count: count,
        device_weight: weight,
        device_condition: condition,
        reason: reason,
        source_type: 'manual',
        recycling_partner: 'Wongpanit',
        current_status: 'pending'
    };

    // New fields (may not exist in DB yet — graceful fallback on insert error)
    const extraFields = {
        tracking_id: rcyTrackingId,
        device_brand: brand && brand !== '__other__' ? brand : null,
        device_model: model && model !== '__other__' ? model : null,
        serial_number: serialStr || null,
        sender_name: senderName,
        sender_tel: senderTel,
        sender_email: senderEmail || null,
        sender_address: senderAddress || null,
        cert_requested: certRequested
    };

    // Try online submission
    if (supabaseClient && currentUser) {
        try {
            // First try with all fields
            let result = await supabaseClient
                .from('recycling_redirects')
                .insert({ ...recycleData, ...extraFields });

            if (result.error) {
                // Retry without extra fields if columns don't exist
                console.warn('Recycle insert with extra fields failed, retrying without:', result.error.message);
                result = await supabaseClient
                    .from('recycling_redirects')
                    .insert(recycleData);
            }
            if (result.error) throw result.error;

            showNotification('คุณได้ส่งข้อมูลการรีไซเคิลเรียบร้อยแล้ว!', 'success');
            resetRecycleForm();
            setTimeout(() => navigateToPage('home'), 2000);
            return;
        } catch (error) {
            console.error('Recycle submit error (falling back to offline):', error);
        }
    }

    // Offline fallback
    const offlineRecycle = {
        id: 'recycle-' + Date.now(),
        ...recycleData,
        ...extraFields,
        createdAt: new Date().toISOString()
    };
    const pending = JSON.parse(localStorage.getItem('gearup_pending_recycles') || '[]');
    pending.push(offlineRecycle);
    localStorage.setItem('gearup_pending_recycles', JSON.stringify(pending));

    showNotification('คุณได้ส่งข้อมูลการรีไซเคิลเรียบร้อยแล้ว!', 'success');
    resetRecycleForm();
    setTimeout(() => navigateToPage('home'), 2000);
}

function resetRecycleForm() {
    document.getElementById('recycleForm').reset();
    document.getElementById('recycleBrand').disabled = true;
    document.getElementById('recycleModel').disabled = true;
    const rDist = document.getElementById('recycleSenderDistrict');
    if (rDist) { rDist.innerHTML = '<option value="">-- เลือกอำเภอ/เขต --</option>'; rDist.disabled = true; }
    const rSub = document.getElementById('recycleSenderSubdistrict');
    if (rSub) { rSub.innerHTML = '<option value="">-- เลือกตำบล/แขวง --</option>'; rSub.disabled = true; }
}

// Close verify modal on outside click
document.addEventListener('DOMContentLoaded', () => {
    const verifyModal = document.getElementById('verifyModal');
    verifyModal?.addEventListener('click', (e) => {
        if (e.target === verifyModal) closeVerifyModal();
    });

    const approveModal = document.getElementById('approveRequestModal');
    approveModal?.addEventListener('click', (e) => {
        if (e.target === approveModal) closeApproveRequestModal();
    });
});

// === ADMIN CRUD FUNCTIONS ===

// Request Approval Functions
async function openApproveRequestModal(requestId) {
    document.getElementById('approveRequestId').value = requestId;

    if (!supabaseClient) {
        showNotification('ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
        return;
    }

    try {
        const { data: request, error } = await supabaseClient
            .from('requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (error) throw error;

        const orgTypeLabels = {
            'school': 'โรงเรียน',
            'community': 'ชุมชน/หมู่บ้าน',
            'temple': 'วัด/ศาสนสถาน',
            'foundation': 'มูลนิธิ/องค์กรการกุศล',
            'other': 'อื่นๆ'
        };

        const equipTypeLabels = {
            'Computer': 'คอมพิวเตอร์ตั้งโต๊ะ',
            'Laptop': 'โน้ตบุ๊ก',
            'Tablet': 'แท็บเล็ต',
            'Phone': 'โทรศัพท์มือถือ'
        };

        const detailsHtml = `
            <div class="approve-detail-row">
                <strong>ชื่อโครงการ:</strong> ${request.project_name || '-'}
            </div>
            <div class="approve-detail-row">
                <strong>ประเภทองค์กร:</strong> ${orgTypeLabels[request.org_type] || request.org_type || '-'}
            </div>
            <div class="approve-detail-row">
                <strong>อุปกรณ์ที่ต้องการ:</strong> ${getEquipLabels(request.equipment_type) || request.equipment_type} x ${request.quantity} เครื่อง
            </div>
            <div class="approve-detail-row">
                <strong>ภาพรวมโครงการ:</strong> ${request.project_overview || '-'}
            </div>
            <div class="approve-detail-row">
                <strong>ผู้ติดต่อ:</strong> ${request.contact_name || '-'} (${request.email || request.phone || '-'})
            </div>
        `;

        document.getElementById('approveRequestDetails').innerHTML = detailsHtml;
        document.getElementById('approvePriority').value = request.post_priority || '0';
        document.getElementById('approveNotes').value = '';

        document.getElementById('approveRequestModal').classList.add('active');
    } catch (error) {
        console.error('Load request error:', error);
        showNotification('ไม่สามารถโหลดข้อมูลได้', 'error');
    }
}

function closeApproveRequestModal() {
    document.getElementById('approveRequestModal').classList.remove('active');
}

async function submitApproveRequest() {
    const requestId = document.getElementById('approveRequestId').value;
    const priority = parseInt(document.getElementById('approvePriority').value);
    const notes = document.getElementById('approveNotes').value.trim();

    if (!supabaseClient || !currentUser) {
        showNotification('กรุณาเข้าสู่ระบบ', 'error');
        return;
    }

    try {
        const updateData = {
            is_public_post: true,
            fulfillment_status: 'open',
            current_status: 'approved',
            post_priority: priority
        };

        const { error } = await supabaseClient
            .from('requests')
            .update(updateData)
            .eq('id', requestId);

        if (error) throw error;

        // Add to tracking timeline
        await supabaseClient
            .from('tracking_timeline')
            .insert({
                request_id: parseInt(requestId),
                status: 'approved',
                status_display_th: 'อนุมัติแล้ว',
                status_display_en: 'Approved',
                note: notes || 'Request approved as public post'
            });

        showNotification('อนุมัติคำขอและเผยแพร่เป็นโพสต์สำเร็จ', 'success');
        closeApproveRequestModal();
        document.getElementById('approveRequestForm').reset();

        // Refresh admin data and homepage posts
        loadAdminData('requests');
        loadRequestPosts();
    } catch (error) {
        console.error('Approve request error:', error);
        showNotification('เกิดข้อผิดพลาดในการอนุมัติ', 'error');
    }
}

// Toggle post visibility (hide/show)
async function adminTogglePostVisibility(requestId, makeVisible) {
    const confirmed = await showConfirmModal(
        makeVisible ? 'แสดงโพสต์' : 'ซ่อนโพสต์',
        makeVisible ? 'ต้องการแสดงโพสต์นี้อีกครั้งหรือไม่?' : 'ต้องการซ่อนโพสต์นี้หรือไม่?'
    );
    if (!confirmed) return;

    if (!supabaseClient) {
        showNotification('ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
        return;
    }

    try {
        const updateData = {
            is_public_post: makeVisible,
            fulfillment_status: makeVisible ? 'open' : 'closed'
        };

        const { error } = await supabaseClient
            .from('requests')
            .update(updateData)
            .eq('id', requestId);

        if (error) throw error;

        showNotification(makeVisible ? 'แสดงโพสต์สำเร็จ' : 'ซ่อนโพสต์สำเร็จ', 'success');
        loadAdminData('requests');
        loadRequestPosts();
    } catch (error) {
        console.error('Toggle visibility error:', error);
        showNotification('เกิดข้อผิดพลาด', 'error');
    }
}

// Delete functions
async function adminDeleteDonation(donationId) {
    const confirmed = await showConfirmModal(
        'ลบการบริจาค',
        'ต้องการลบการบริจาคนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้'
    );
    if (!confirmed) return;

    if (!supabaseClient) {
        // Fallback to localStorage
        donations = donations.filter(d => d.id !== donationId);
        localStorage.setItem('gearup_donations', JSON.stringify(donations));
        showNotification('ลบการบริจาคสำเร็จ', 'success');
        loadAdminDataFromLocal('donations', '', '');
        return;
    }

    try {
        // Delete donation items first (foreign key constraint)
        await supabaseClient
            .from('donation_items')
            .delete()
            .eq('donation_id', donationId);

        // Delete tracking timeline
        await supabaseClient
            .from('tracking_timeline')
            .delete()
            .eq('donation_id', donationId);

        // Delete carbon credit if exists
        await supabaseClient
            .from('carbon_credits')
            .delete()
            .eq('donation_id', donationId);

        // Finally delete donation
        const { error } = await supabaseClient
            .from('donations')
            .delete()
            .eq('id', donationId);

        if (error) throw error;

        showNotification('ลบการบริจาคสำเร็จ', 'success');
        loadAdminData('donations');
    } catch (error) {
        console.error('Delete donation error:', error);
        showNotification('เกิดข้อผิดพลาดในการลบ', 'error');
    }
}

async function adminDeleteRequest(requestId) {
    const confirmed = await showConfirmModal(
        'ลบคำขอ',
        'ต้องการลบคำขอนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้'
    );
    if (!confirmed) return;

    if (!supabaseClient) {
        // Fallback to localStorage
        requests = requests.filter(r => r.id !== requestId);
        localStorage.setItem('gearup_requests', JSON.stringify(requests));
        showNotification('ลบคำขอสำเร็จ', 'success');
        loadAdminDataFromLocal('requests', '', '');
        return;
    }

    try {
        // Delete tracking timeline
        await supabaseClient
            .from('tracking_timeline')
            .delete()
            .eq('request_id', requestId);

        // Delete recipient confirmations if exists
        await supabaseClient
            .from('recipient_confirmations')
            .delete()
            .eq('request_id', requestId);

        // Finally delete request
        const { error } = await supabaseClient
            .from('requests')
            .delete()
            .eq('id', requestId);

        if (error) throw error;

        showNotification('ลบคำขอสำเร็จ', 'success');
        loadAdminData('requests');
        loadRequestPosts();
    } catch (error) {
        console.error('Delete request error:', error);
        showNotification('เกิดข้อผิดพลาดในการลบ', 'error');
    }
}

async function adminDeleteRecycle(recycleId) {
    const confirmed = await showConfirmModal(
        'ลบรายการรีไซเคิล',
        'ต้องการลบรายการรีไซเคิลนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้'
    );
    if (!confirmed) return;

    if (!supabaseClient) {
        showNotification('ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('recycling_redirects')
            .delete()
            .eq('id', recycleId);

        if (error) throw error;

        showNotification('ลบรายการรีไซเคิลสำเร็จ', 'success');
        loadAdminData('recycle');
    } catch (error) {
        console.error('Delete recycle error:', error);
        showNotification('เกิดข้อผิดพลาดในการลบ', 'error');
    }
}

// Change user role
async function adminChangeUserRole(userId, newRole) {
    const confirmed = await showConfirmModal(
        'เปลี่ยนบทบาท',
        `ต้องการเปลี่ยนบทบาทเป็น ${newRole} หรือไม่?`
    );
    if (!confirmed) {
        loadAdminData('users');
        return;
    }

    if (!supabaseClient) {
        showNotification('ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
        loadAdminData('users');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('users')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) throw error;

        showNotification(`เปลี่ยนบทบาทเป็น ${newRole} สำเร็จ`, 'success');
        loadAdminData('users');
    } catch (error) {
        console.error('Change role error:', error);
        showNotification('เกิดข้อผิดพลาดในการเปลี่ยนบทบาท', 'error');
        loadAdminData('users');
    }
}

// === CUSTOM CONFIRM MODAL ===
function showConfirmModal(title, message) {
    // Abort any previously stuck Promise (e.g. from bfcache restore)
    if (_confirmReject) { _confirmReject(); _confirmReject = null; }

    return new Promise((resolve, reject) => {
        _confirmReject = reject; // save so pagehide can abort it

        const modal = document.getElementById('customConfirmModal');
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        modal.classList.add('active');

        // Replace buttons with fresh clones to clear any stale listeners
        const okOld = document.getElementById('confirmOkBtn');
        const cancelOld = document.getElementById('confirmCancelBtn');
        const okBtn = okOld.cloneNode(true);
        const cancelBtn = cancelOld.cloneNode(true);
        okOld.replaceWith(okBtn);
        cancelOld.replaceWith(cancelBtn);

        function cleanup() {
            modal.classList.remove('active');
            _confirmReject = null;
        }

        okBtn.addEventListener('click', () => { cleanup(); resolve(true); });
        cancelBtn.addEventListener('click', () => { cleanup(); resolve(false); });
    });
}

// ===== PROFILE PAGE =====

async function loadProfilePage() {
    if (!currentUser) {
        navigateToPage('home');
        showNotification('กรุณาเข้าสู่ระบบก่อน', 'error');
        return;
    }

    // Fill hero
    const initial = (currentUser.name || currentUser.email || '?')[0].toUpperCase();
    const avatarEl = document.getElementById('profileAvatar');
    const nameEl   = document.getElementById('profileName');
    const emailEl  = document.getElementById('profileEmail');
    const roleEl   = document.getElementById('profileRoleBadge');
    if (avatarEl) avatarEl.textContent = initial;
    if (nameEl)   nameEl.textContent   = currentUser.name || 'ไม่ระบุชื่อ';
    if (emailEl)  emailEl.textContent  = currentUser.email || '';
    if (roleEl)   roleEl.textContent   = currentUser.role === 'admin' ? '⚡ Admin' : '🤝 ผู้บริจาค';

    const listEl = document.getElementById('profileDonationList');
    if (!listEl) return;
    listEl.innerHTML = '<div class="profile-loading">กำลังโหลด...</div>';

    if (!supabaseClient) {
        listEl.innerHTML = '<div class="profile-loading">ไม่สามารถเชื่อมต่อระบบได้</div>';
        return;
    }

    try {
        let donations, donationsError;
        ({ data: donations, error: donationsError } = await supabaseClient
            .from('donations')
            .select('id, tracking_id, current_status, total_items, total_weight, carbon_saved, shipping_tracking_id, shipping_carrier, created_at, device_type, device_brand, device_model, donor_name, donor_tel, donor_email, donor_address, donor_type, option_type, direct_donation_to_request_id')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false }));
        if (donationsError) {
            // Fallback: without shipping_carrier (migration not yet run)
            ({ data: donations, error: donationsError } = await supabaseClient
                .from('donations')
                .select('id, tracking_id, current_status, total_items, total_weight, carbon_saved, shipping_tracking_id, created_at, device_type, device_brand, device_model, donor_name, donor_tel, donor_email, donor_address, donor_type, option_type')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false }));
        }
        if (donationsError) throw donationsError;

        // Compute stats
        const totalDonations = donations?.length || 0;
        const totalDevices   = (donations || []).reduce((s, d) => s + (d.total_items || 1), 0);
        const totalCarbon    = (donations || []).reduce((s, d) => s + (parseFloat(d.carbon_saved) || 0), 0);
        const totalCompleted = (donations || []).filter(d => d.current_status === 'completed').length;

        const sv = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        sv('profileStatDonations', totalDonations);
        sv('profileStatDevices',   totalDevices);
        sv('profileStatCarbon',    Math.round(totalCarbon).toLocaleString());
        sv('profileStatCompleted', totalCompleted);

        // Cache full donation data for detail modal + label
        _profileDonationCache = {};
        (donations || []).forEach(d => { _profileDonationCache[d.id] = d; });

        // Fetch donation_items and recipient post data to power the shipping label
        try {
            const donationIds = (donations || []).map(d => d.id);
            if (donationIds.length > 0) {
                const { data: allItems } = await supabaseClient
                    .from('donation_items')
                    .select('donation_id, device_type, device_brand, device_model, device_weight, device_condition')
                    .in('donation_id', donationIds);
                (allItems || []).forEach(item => {
                    const cached = _profileDonationCache[item.donation_id];
                    if (!cached) return;
                    if (!cached._items) cached._items = [];
                    cached._items.push(item);
                });
            }
            // Fetch recipient request data (org_name, address, phone) for the shipping label receiver
            const requestIds = (donations || [])
                .filter(d => d.direct_donation_to_request_id)
                .map(d => d.direct_donation_to_request_id);
            if (requestIds.length > 0) {
                const { data: reqPosts } = await supabaseClient
                    .from('requests')
                    .select('id, org_name, project_name, contact_name, address, phone, email')
                    .in('id', requestIds);
                const reqMap = {};
                (reqPosts || []).forEach(r => { reqMap[r.id] = r; });
                Object.values(_profileDonationCache).forEach(d => {
                    if (d.direct_donation_to_request_id && reqMap[d.direct_donation_to_request_id]) {
                        d._recipientPost = reqMap[d.direct_donation_to_request_id];
                    }
                });
            }
        } catch (_) { /* non-critical */ };

        if (!donations || donations.length === 0) {
            listEl.innerHTML = `
                <div class="profile-empty">
                    <div class="profile-empty-icon">📦</div>
                    <p>ยังไม่มีประวัติการบริจาค</p>
                    <button class="btn-donate-new" onclick="navigateToPage('donate')">เริ่มบริจาคเลย</button>
                </div>`;
            return;
        }

        const STATUS_LABELS = {
            submitted:   { label: 'รอตรวจสอบ',     cls: 'status-submitted'  },
            verified:    { label: 'ตรวจสอบแล้ว',    cls: 'status-verified'   },
            scheduled:   { label: 'นัดรับแล้ว',     cls: 'status-verified'   },
            picked_up:   { label: 'รับพัสดุแล้ว',   cls: 'status-processing' },
            processing:  { label: 'กำลังดำเนินการ', cls: 'status-processing' },
            data_wiped:  { label: 'ลบข้อมูลแล้ว',   cls: 'status-processing' },
            ready:       { label: 'พร้อมจัดส่ง',    cls: 'status-processing' },
            distributed: { label: 'จัดส่งแล้ว',     cls: 'status-processing' },
            completed:   { label: 'สำเร็จ ✅',       cls: 'status-completed'  },
        };

        const CARRIER_LABELS = {
            thailand_post: 'ไปรษณีย์ไทย',
            jt_express:    'J&T Express',
            flash_express: 'Flash Express',
        };

        listEl.innerHTML = donations.map(d => {
            const s = STATUS_LABELS[d.current_status] || { label: d.current_status, cls: 'status-default' };
            const dateStr = d.created_at
                ? new Date(d.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
                : '—';
            const hasTracking = !!(d.shipping_tracking_id || '').trim();

            const trackingHtml = hasTracking
                ? `<span class="tracking-ok">📦 ${d.shipping_tracking_id}</span>`
                : `<span class="tracking-missing-tag">
                       <span class="tracking-missing">⚠️ ยังไม่มีเลข Tracking</span>
                       <button class="btn-add-tracking-inline" onclick="showProfileTrackingForm('${d.id}', this)">+ เพิ่มเลย</button>
                   </span>
                   <div class="tracking-inline-form" id="ptf-${d.id}" style="display:none;">
                       <input type="text" placeholder="เช่น TH12345678901..." id="pti-${d.id}">
                       <button onclick="saveProfileTracking('${d.id}')">บันทึก</button>
                       <button onclick="document.getElementById('ptf-${d.id}').style.display='none'" style="background:#e0d5c5;color:#555;">ยกเลิก</button>
                   </div>`;

            const carbonHtml = d.carbon_saved
                ? `<div class="donation-record-carbon">🌱 ลด CO₂ ได้ ${Math.round(d.carbon_saved).toLocaleString()} kgCO₂e</div>`
                : '';

            const carrierHtml = !hasTracking ? `
                <div class="profile-carrier-row">
                    <span class="profile-carrier-label">🚚 ขนส่ง:</span>
                    ${Object.entries(CARRIER_LABELS).map(([key, label]) =>
                        `<button class="profile-carrier-pill${d.shipping_carrier === key ? ' selected' : ''}" onclick="setProfileCarrier('${d.id}','${key}',this)">${label}</button>`
                    ).join('')}
                </div>` : '';

            const headerClass = d.current_status === 'submitted' ? 'hdr-submitted'
                : d.current_status === 'completed' ? 'hdr-completed'
                : 'hdr-default';

            return `
            <div class="donation-record">
                <div class="donation-record-header ${headerClass}">
                    <div class="donation-record-header-left">
                        <span class="donation-record-id-badge">📋 ${d.tracking_id || '—'}</span>
                        <span class="donation-record-date">${dateStr}</span>
                    </div>
                    <span class="donation-status-badge ${s.cls}">${s.label}</span>
                </div>
                <div class="donation-record-body">
                    <div class="donation-record-left">
                        <div class="donation-record-devices">📦 ${d.total_items || 1} ชิ้น · น้ำหนัก ${parseFloat(d.total_weight || 0).toFixed(1)} กก.</div>
                        ${carrierHtml}
                        <div class="donation-record-tracking">${trackingHtml}</div>
                        ${carbonHtml}
                    </div>
                    <div class="donation-record-right">
                        <button class="donation-record-btn detail-btn" onclick="showProfileDonationDetail('${d.id}')">🔍 รายละเอียด</button>
                        <button class="donation-record-btn label-btn" onclick="downloadProfileLabel('${d.id}')">🖨️ ใบปะหน้า</button>
                        ${d.current_status === 'completed' ? `<button class="donation-record-btn cert-btn" onclick="downloadDonationCertificate('${d.id}')">📜 Certificate</button>` : ''}
                    </div>
                </div>
            </div>`;
        }).join('');

    } catch (e) {
        console.error('Profile load error:', e);
        listEl.innerHTML = '<div class="profile-loading">ไม่สามารถโหลดข้อมูลได้</div>';
    }
}

function showProfileTrackingForm(donationId, btn) {
    btn.style.display = 'none';
    const form = document.getElementById(`ptf-${donationId}`);
    if (form) {
        form.style.display = 'flex';
        document.getElementById(`pti-${donationId}`)?.focus();
    }
}

async function saveProfileTracking(donationId) {
    const input = document.getElementById(`pti-${donationId}`);
    const val = input?.value?.trim();
    if (!val) { showNotification('กรุณากรอกเลข Tracking', 'error'); return; }
    if (!supabaseClient) { showNotification('ไม่สามารถเชื่อมต่อระบบได้', 'error'); return; }
    try {
        const { error } = await supabaseClient
            .from('donations')
            .update({ shipping_tracking_id: val })
            .eq('id', donationId);
        if (error) throw error;
        showNotification('บันทึกเลข Tracking สำเร็จ! 🎉', 'success');
        await loadProfilePage();
    } catch (e) {
        showNotification('บันทึกไม่สำเร็จ: ' + (e.message || 'กรุณาลองใหม่'), 'error');
    }
}

// === PROFILE DONATION DETAIL ===
async function showProfileDonationDetail(donationId) {
    const d = _profileDonationCache[donationId];
    if (!d) return;

    const modal = document.getElementById('profileDetailModal');
    if (!modal) return;

    const STATUS_LABELS = {
        submitted: 'รอตรวจสอบ', verified: 'ตรวจสอบแล้ว', scheduled: 'นัดรับแล้ว',
        picked_up: 'รับพัสดุแล้ว', processing: 'กำลังดำเนินการ', data_wiped: 'ลบข้อมูลแล้ว',
        ready: 'พร้อมจัดส่ง', distributed: 'จัดส่งแล้ว', completed: 'สำเร็จ ✅',
    };

    const dateStr = d.created_at
        ? new Date(d.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—';

    document.getElementById('pdmTrackingId').textContent = d.tracking_id || '—';
    document.getElementById('pdmDate').textContent = dateStr;
    document.getElementById('pdmStatus').textContent = STATUS_LABELS[d.current_status] || d.current_status || '—';
    document.getElementById('pdmDonorName').textContent = d.donor_name || '—';
    document.getElementById('pdmDonorTel').textContent = d.donor_tel || '—';
    document.getElementById('pdmDonorEmail').textContent = d.donor_email || '—';
    document.getElementById('pdmDonorAddr').textContent = d.donor_address || '—';

    // Destination section
    const destSection = document.getElementById('pdmDestSection');
    const post = d._recipientPost;
    if (post) {
        document.getElementById('pdmDestName').textContent = post.org_name || post.project_name || post.contact_name || '—';
        document.getElementById('pdmDestAddr').textContent = post.address || '—';
        document.getElementById('pdmDestTel').textContent = post.phone || post.email || '—';
        if (destSection) destSection.style.display = '';
    } else {
        if (destSection) destSection.style.display = 'none';
    }
    document.getElementById('pdmItems').textContent = `${d.total_items || 1} ชิ้น`;
    document.getElementById('pdmWeight').textContent = `${parseFloat(d.total_weight || 0).toFixed(1)} กก.`;
    document.getElementById('pdmCarbon').textContent = d.carbon_saved ? `${Math.round(d.carbon_saved).toLocaleString()} kgCO₂e` : '—';
    const pdmTrackingEl = document.getElementById('pdmTracking');
    if (d.shipping_tracking_id) {
        pdmTrackingEl.textContent = d.shipping_tracking_id;
        pdmTrackingEl.classList.remove('no-tracking');
    } else {
        pdmTrackingEl.textContent = '⚠️ ยังไม่มีเลข Tracking';
        pdmTrackingEl.classList.add('no-tracking');
    }

    // Load items from donation_items table
    const itemsEl = document.getElementById('pdmItemsList');
    itemsEl.innerHTML = '<div style="color:#8b7355;font-size:0.82rem;">กำลังโหลด...</div>';
    modal.style.display = 'flex';

    if (supabaseClient) {
        try {
            const { data: items } = await supabaseClient
                .from('donation_items')
                .select('device_type, device_brand, device_model, device_weight, device_condition')
                .eq('donation_id', donationId);

            const DEVICE_TH = { Computer: 'คอมพิวเตอร์', Laptop: 'แล็ปท็อป', Tablet: 'แท็บเล็ต', Phone: 'โทรศัพท์' };
            const COND_TH = { working: 'ใช้งานได้', 'needs_repair': 'ซ่อมได้', broken: 'ชำรุด' };

            if (items && items.length > 0) {
                itemsEl.innerHTML = items.map((item, i) => `
                    <div class="pdm-item-row">
                        <span class="pdm-item-num">${i + 1}</span>
                        <div class="pdm-item-info">
                            <span class="pdm-item-type">${DEVICE_TH[item.device_type] || item.device_type}</span>
                            <span class="pdm-item-detail">${[item.device_brand, item.device_model].filter(Boolean).join(' ') || '—'}</span>
                        </div>
                        <div class="pdm-item-meta">
                            <span>${parseFloat(item.device_weight || 0).toFixed(1)} กก.</span>
                            <span class="pdm-item-cond">${COND_TH[item.device_condition] || item.device_condition || '—'}</span>
                        </div>
                    </div>`).join('');
            } else {
                itemsEl.innerHTML = `<div class="pdm-item-row"><span style="color:#8b7355;font-size:0.85rem;">ไม่พบข้อมูลอุปกรณ์</span></div>`;
            }
        } catch (_) {
            itemsEl.innerHTML = `<div class="pdm-item-row"><span style="color:#8b7355;font-size:0.82rem;">โหลดไม่สำเร็จ</span></div>`;
        }
    } else {
        itemsEl.innerHTML = `<div class="pdm-item-row"><span style="color:#8b7355;font-size:0.82rem;">ไม่สามารถเชื่อมต่อได้</span></div>`;
    }
}

function closeProfileDetailModal() {
    const modal = document.getElementById('profileDetailModal');
    if (modal) modal.style.display = 'none';
}

// Download shipping label from profile page
// Synchronous — uses cached donation data so window.open + document.write fires directly from click event
function downloadProfileLabel(donationId) {
    const d = _profileDonationCache[donationId];
    if (!d) { showNotification('ไม่พบข้อมูลการบริจาค', 'error'); return; }

    // Use pre-fetched donation_items if available (loaded by loadProfilePage); fallback to top-level cols
    const items = d._items?.length > 0
        ? d._items
        : (d.device_type ? [{
            device_type:   d.device_type,
            device_brand:  d.device_brand  || null,
            device_model:  d.device_model  || null,
            device_weight: parseFloat(d.total_weight || 0) / (d.total_items || 1),
          }] : []);

    const html = _buildLabelHTML({
        trackingId:       d.tracking_id,
        donor_name:       d.donor_name,
        donor_address:    d.donor_address,
        donor_tel:        d.donor_tel,
        device_weight:    parseFloat(d.total_weight || 0),
        total_items:      d.total_items || 1,
        carbon_saved:     d.carbon_saved,
        shipping_carrier: d.shipping_carrier || null,
        recipient_post:   d._recipientPost || null,
        items,
    });

    const win = window.open('', 'ใบปะหน้าพัสดุ', 'width=680,height=900');
    if (win) { win.document.write(html); win.document.close(); }
    else { showNotification('กรุณาอนุญาต Popup ของเว็บไซต์นี้ในการตั้งค่าเบราว์เซอร์', 'error'); }
}

// Set carrier from profile card (non-blocking save)
async function setProfileCarrier(donationId, carrier, btn) {
    const card = btn.closest('.donation-record');
    if (card) card.querySelectorAll('.profile-carrier-pill').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    if (_profileDonationCache[donationId]) _profileDonationCache[donationId].shipping_carrier = carrier;
    if (supabaseClient) {
        supabaseClient.from('donations')
            .update({ shipping_carrier: carrier })
            .eq('id', donationId)
            .then(({ error }) => { if (error) console.warn('Carrier save:', error.message); });
    }
}

function downloadDonationCertificateDemo() {
    const demoId = '__DEMO__';
    _profileDonationCache[demoId] = {
        tracking_id: 'GU-DON-02072026-001',
        donor_name: 'สมชาย รักษ์โลก',
        created_at: new Date().toISOString(),
        total_weight: 11.6,
        carbon_saved: 348,
        _items: [
            { device_type: 'Computer', device_brand: 'HP', device_model: 'ProDesk 600 G6', device_weight: 5.8, device_condition: 'working' },
            { device_type: 'Computer', device_brand: 'HP', device_model: 'ProDesk 600 G6', device_weight: 5.8, device_condition: 'working' },
        ],
        _recipientPost: {
            org_name: 'โรงเรียนสะลวงนอก',
            address: 'ต.สะลวง อ.แม่ริม จ.เชียงใหม่ 50180',
        }
    };
    downloadDonationCertificate(demoId);
}

// === DONATION CERTIFICATE ===
function downloadDonationCertificate(donationId) {
    const d = _profileDonationCache[donationId];
    if (!d) { showNotification('ไม่พบข้อมูลการบริจาค', 'error'); return; }

    const DEVICE_TH = { Computer: 'คอมพิวเตอร์', Laptop: 'แล็ปท็อป', Tablet: 'แท็บเล็ต', Phone: 'โทรศัพท์' };
    const COND_TH   = { working: 'ใช้งานได้', needs_repair: 'ซ่อมได้', broken: 'ชำรุด' };

    const donorName  = d.donor_name || currentUser?.name || 'ผู้บริจาค';
    const carbonSaved = parseFloat(d.carbon_saved || 0);
    const treesEq    = Math.round(carbonSaved / 21.7);
    const kmEq       = Math.round(carbonSaved / 0.21);
    const certNum    = d.tracking_id ? `GU-CERT-${d.tracking_id.replace('GU-DON-','')}` : `GU-CERT-${Date.now()}`;
    const issuedDate = d.created_at
        ? new Date(d.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

    const items = d._items?.length > 0 ? d._items : (d.device_type ? [{
        device_type: d.device_type, device_brand: d.device_brand || null,
        device_model: d.device_model || null, device_weight: parseFloat(d.total_weight || 0),
        device_condition: null,
    }] : []);

    const itemsRowsHtml = items.map((item, i) => {
        const typeLabel  = DEVICE_TH[item.device_type] || item.device_type || '—';
        const brandModel = [item.device_brand, item.device_model].filter(Boolean).join(' ') || '—';
        const condLabel  = COND_TH[item.device_condition] || item.device_condition || '—';
        const weight     = parseFloat(item.device_weight || 0).toFixed(1);
        return `<tr>
            <td style="padding:7px 10px;text-align:center;color:#8b7355;">${i + 1}</td>
            <td style="padding:7px 10px;">${typeLabel}</td>
            <td style="padding:7px 10px;color:#555;">${brandModel}</td>
            <td style="padding:7px 10px;text-align:center;color:#555;">${weight} กก.</td>
            <td style="padding:7px 10px;text-align:center;">
                <span style="padding:2px 8px;border-radius:12px;font-size:0.78rem;background:${item.device_condition==='working'?'#e8f5e9;color:#2f5233':item.device_condition==='needs_repair'?'#fff8e1;color:#7b5c00':'#fce4ec;color:#880e4f'};">${condLabel}</span>
            </td>
        </tr>`;
    }).join('');

    const sealSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        ${Array.from({length:16},(_,i)=>{const a=i*(360/16)*Math.PI/180;const x1=50+38*Math.cos(a);const y1=50+38*Math.sin(a);const x2=50+44*Math.cos(a);const y2=50+44*Math.sin(a);return`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#d4a574" stroke-width="1.5"/>`;}).join('')}
        <circle cx="50" cy="50" r="36" fill="#2f5233" opacity="0.08" stroke="#2f5233" stroke-width="1"/>
        <circle cx="50" cy="50" r="30" fill="#2f5233" opacity="0.12" stroke="#d4a574" stroke-width="1.5"/>
        <circle cx="50" cy="50" r="22" fill="#2f5233" opacity="0.15"/>
        <text x="50" y="44" text-anchor="middle" font-family="serif" font-size="7" fill="#2f5233" font-weight="bold" letter-spacing="1">GEAR</text>
        <text x="50" y="53" text-anchor="middle" font-family="serif" font-size="7" fill="#2f5233" font-weight="bold" letter-spacing="1">UP</text>
        <text x="50" y="61" text-anchor="middle" font-family="serif" font-size="5" fill="#8b7355" letter-spacing="0.5">CERTIFIED</text>
    </svg>`;

    const logoUrl = (() => {
        try { return new URL('assets/logo-gearup.png', window.location.href).href; }
        catch(e) { return ''; }
    })();

    // Decorative leaf branch SVG (used on both sides of header)
    const leafBranch = `<svg width="80" height="70" viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg" style="opacity:0.45;">
      <path d="M40 68 C36 52 26 36 20 20 C22 12 18 4 18 4" stroke="#2f5233" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <ellipse cx="13" cy="18" rx="13" ry="6" fill="#2f5233" opacity="0.8" transform="rotate(-38 13 18)"/>
      <ellipse cx="22" cy="36" rx="11" ry="5.5" fill="#2f5233" opacity="0.72" transform="rotate(-50 22 36)"/>
      <ellipse cx="30" cy="54" rx="10" ry="5" fill="#2f5233" opacity="0.65" transform="rotate(-60 30 54)"/>
      <ellipse cx="30" cy="14" rx="10" ry="4.5" fill="#3d7a43" opacity="0.65" transform="rotate(22 30 14)"/>
      <ellipse cx="36" cy="32" rx="9" ry="4" fill="#3d7a43" opacity="0.58" transform="rotate(12 36 32)"/>
    </svg>`;

    // Mirrored branch for the right side
    const leafBranchR = `<svg width="80" height="70" viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg" style="opacity:0.45;transform:scaleX(-1);">
      <path d="M40 68 C36 52 26 36 20 20 C22 12 18 4 18 4" stroke="#2f5233" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <ellipse cx="13" cy="18" rx="13" ry="6" fill="#2f5233" opacity="0.8" transform="rotate(-38 13 18)"/>
      <ellipse cx="22" cy="36" rx="11" ry="5.5" fill="#2f5233" opacity="0.72" transform="rotate(-50 22 36)"/>
      <ellipse cx="30" cy="54" rx="10" ry="5" fill="#2f5233" opacity="0.65" transform="rotate(-60 30 54)"/>
      <ellipse cx="30" cy="14" rx="10" ry="4.5" fill="#3d7a43" opacity="0.65" transform="rotate(22 30 14)"/>
      <ellipse cx="36" cy="32" rx="9" ry="4" fill="#3d7a43" opacity="0.58" transform="rotate(12 36 32)"/>
    </svg>`;

    // Large background tree art
    const bgTreeSvg = `<svg width="230" height="270" viewBox="0 0 230 270" xmlns="http://www.w3.org/2000/svg" style="position:absolute;right:35px;bottom:55px;opacity:0.038;pointer-events:none;z-index:1;">
      <rect x="103" y="210" width="24" height="55" rx="4" fill="#2f5233"/>
      <ellipse cx="115" cy="190" rx="58" ry="46" fill="#2f5233"/>
      <ellipse cx="115" cy="155" rx="52" ry="44" fill="#2f5233"/>
      <ellipse cx="115" cy="122" rx="44" ry="38" fill="#2f5233"/>
      <ellipse cx="115" cy="92" rx="36" ry="32" fill="#2f5233"/>
      <ellipse cx="115" cy="65" rx="28" ry="26" fill="#2f5233"/>
      <ellipse cx="115" cy="42" rx="20" ry="20" fill="#2f5233"/>
    </svg>`;

    // SVG icons for impact cards
    const iconCarbon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 4-8 4z"/>
    </svg>`;
    const iconTree = `<svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 12h-4V7l-5 8h4v5l5-8z" fill="none"/>
      <rect x="10.5" y="17" width="3" height="5" rx="0.5" fill="white"/>
      <polygon points="12,2 3,14 21,14" fill="white"/>
      <polygon points="12,7 5,17 19,17" fill="rgba(255,255,255,0.6)"/>
    </svg>`;
    const iconCar = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 17H3v-5l3-6h12l3 6v5h-2"/>
      <circle cx="7.5" cy="17" r="2"/>
      <circle cx="16.5" cy="17" r="2"/>
      <path d="M5 12h14"/>
    </svg>`;

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>Certificate — ${certNum}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Cormorant+Garamond:wght@400;500;600&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{
  background:#b0aca6;
  display:flex;flex-direction:column;align-items:center;
  justify-content:flex-start;min-height:100vh;
  padding:24px 16px;gap:16px;
}
@page{size:A4 landscape;margin:0;}
@media print{
  html,body{background:#fff;padding:0;gap:0;}
  .cert-wrap{box-shadow:none!important;width:297mm!important;height:210mm!important;}
  .print-btn{display:none!important;}
}

.cert-wrap{
  width:1090px;height:750px;
  background:
    radial-gradient(ellipse at 8% 92%, rgba(47,82,51,0.07) 0%, transparent 38%),
    radial-gradient(ellipse at 92% 8%, rgba(212,165,116,0.06) 0%, transparent 38%),
    radial-gradient(ellipse at 50% 50%, rgba(47,82,51,0.02) 0%, transparent 70%),
    #ffffff;
  position:relative;overflow:hidden;
  box-shadow:0 24px 80px rgba(0,0,0,0.42);
  display:flex;flex-direction:column;
}

/* Corner triangles */
.crn{position:absolute;width:116px;height:116px;z-index:20;}
.crn-tl{top:0;left:0;background:#2f5233;clip-path:polygon(0 0,100% 0,0 100%);}
.crn-tr{top:0;right:0;background:#2f5233;clip-path:polygon(0 0,100% 0,100% 100%);}
.crn-bl{bottom:0;left:0;background:#2f5233;clip-path:polygon(0 0,0 100%,100% 100%);}
.crn-br{bottom:0;right:0;background:#2f5233;clip-path:polygon(100% 0,100% 100%,0 100%);}

/* Inner frame border */
.cert-frame{
  position:absolute;inset:18px;
  border:1px solid rgba(47,82,51,0.22);
  pointer-events:none;z-index:5;
}

/* Watermark */
.cert-wm{
  position:absolute;top:50%;left:50%;
  transform:translate(-50%,-50%) rotate(-18deg);
  font-family:'Playfair Display',serif;font-size:9rem;font-weight:700;
  color:#2f5233;opacity:0.016;letter-spacing:14px;
  pointer-events:none;white-space:nowrap;z-index:1;
  user-select:none;
}

/* HEADER ZONE */
.cert-header{
  flex-shrink:0;
  padding:22px 80px 0;
  display:flex;flex-direction:column;align-items:center;
  position:relative;z-index:2;
}
.cert-header-top{
  display:flex;align-items:center;justify-content:center;gap:20px;
  margin-bottom:8px;
}
.cert-logo-circle{
  width:72px;height:72px;border-radius:50%;
  background:#ffffff;overflow:hidden;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 20px rgba(0,0,0,0.14);
  flex-shrink:0;
}
.cert-logo-circle img{width:100%;height:100%;object-fit:cover;display:block;}
.cert-brand-name{
  font-family:'Playfair Display',serif;
  font-size:1.4rem;font-weight:700;color:#1a2421;
  letter-spacing:6px;margin-top:6px;text-align:center;
}
.cert-brand-sub{
  font-family:'Cormorant Garamond',serif;
  font-size:0.6rem;letter-spacing:2.5px;text-transform:uppercase;
  color:#c0b8b0;margin-top:2px;text-align:center;
}
.orn{
  display:flex;align-items:center;gap:10px;
  width:280px;margin:10px auto 8px;
}
.orn-l{flex:1;height:1px;background:linear-gradient(90deg,transparent,#d4a574);}
.orn-r{flex:1;height:1px;background:linear-gradient(90deg,#d4a574,transparent);}
.orn-d{width:7px;height:7px;background:#d4a574;transform:rotate(45deg);flex-shrink:0;}
.cert-title-th{
  font-family:'Sarabun',sans-serif;font-weight:600;
  font-size:1rem;color:#555;letter-spacing:0.5px;margin-bottom:2px;
}
.cert-title-en{
  font-family:'Cormorant Garamond',serif;font-size:0.63rem;
  color:#c0b8b0;letter-spacing:3px;text-transform:uppercase;
}

/* BODY ZONE */
.cert-body{
  flex:1;min-height:0;
  padding:0 80px;
  display:flex;flex-direction:column;align-items:center;
  justify-content:space-evenly;
  position:relative;z-index:2;
  text-align:center;
}
.cert-preamble{
  font-family:'Sarabun',sans-serif;font-size:0.88rem;
  color:#999;letter-spacing:0.3px;
}
.cert-name{
  font-family:'Sarabun',sans-serif;font-size:2.5rem;font-weight:700;
  color:#1a2421;line-height:1.2;
}
.name-rule{
  display:flex;align-items:center;gap:8px;
  width:240px;margin:0 auto;
}
.name-rule-l{flex:1;height:1.5px;background:linear-gradient(90deg,transparent,#d4a574);}
.name-rule-r{flex:1;height:1.5px;background:linear-gradient(90deg,#d4a574,transparent);}
.name-rule-dot{width:5px;height:5px;background:#d4a574;border-radius:50%;flex-shrink:0;}
.cert-pills{
  display:inline-flex;align-items:stretch;
  border:1px solid rgba(47,82,51,0.18);border-radius:6px;overflow:hidden;
}
.pill{
  padding:5px 20px;display:flex;flex-direction:column;
  align-items:center;gap:1px;
}
.pill+.pill{border-left:1px solid rgba(47,82,51,0.14);}
.pill-k{
  font-family:'Cormorant Garamond',serif;font-size:0.57rem;
  letter-spacing:1.5px;text-transform:uppercase;color:#c0b8b0;
}
.pill-v{font-size:0.82rem;color:#333;font-family:'Sarabun',sans-serif;}
.pill-v.dn{
  font-family:'Cormorant Garamond',serif;font-size:0.88rem;
  color:#2f5233;font-weight:600;letter-spacing:0.5px;
}
.sec-div{
  width:100%;display:flex;align-items:center;gap:12px;
}
.sdl{flex:1;height:0.5px;background:rgba(47,82,51,0.18);}
.sdlabel{
  font-family:'Cormorant Garamond',serif;font-size:0.6rem;
  letter-spacing:2.5px;text-transform:uppercase;color:#c0b0a0;white-space:nowrap;
}
.cert-table{width:100%;border-collapse:collapse;font-size:0.8rem;}
.cert-table thead th{
  background:#2f5233;color:#fff;padding:6px 10px;
  font-family:'Cormorant Garamond',serif;font-size:0.68rem;
  font-weight:600;letter-spacing:0.5px;white-space:nowrap;text-align:left;
}
.cert-table thead th:first-child{text-align:center;width:26px;}
.cert-table thead th:nth-child(4),.cert-table thead th:nth-child(5){text-align:center;}
.cert-table tbody td{
  padding:5px 10px;border-bottom:1px solid rgba(0,0,0,0.05);
  vertical-align:middle;text-align:left;
}
.cert-table tbody td:first-child{text-align:center;color:#aaa;}
.cert-table tbody tr:nth-child(even) td{background:rgba(47,82,51,0.025);}
.cert-dest{
  display:inline-flex;align-items:center;gap:8px;
  padding:5px 16px;background:#f2f8f3;border-radius:20px;
  border:1px solid rgba(47,82,51,0.2);font-size:0.78rem;
}
.cert-dest-lbl{font-size:0.6rem;letter-spacing:1px;text-transform:uppercase;color:#2f5233;font-family:'Cormorant Garamond',serif;}

/* Impact cards — redesigned */
.cert-impact{display:flex;justify-content:center;gap:14px;}
.cert-impact-card{
  width:132px;text-align:center;
  border:1px solid rgba(47,82,51,0.15);border-radius:12px;
  border-left:4px solid #2f5233;
  padding:12px 10px 10px;
  background:linear-gradient(160deg,#f8fbf8,#eef7ee);
  display:flex;flex-direction:column;align-items:center;gap:5px;
}
.impact-icon-wrap{
  width:42px;height:42px;
  background:#2f5233;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;
  box-shadow:0 3px 10px rgba(47,82,51,0.3);
}
.impact-val{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:#2f5233;}
.impact-label{font-size:0.6rem;color:#8b7355;font-family:'Cormorant Garamond',serif;line-height:1.4;}

/* FOOTER ZONE */
.cert-footer{
  flex-shrink:0;
  padding:14px 80px 22px;
  border-top:1px solid rgba(47,82,51,0.15);
  display:flex;align-items:flex-end;justify-content:space-between;
  position:relative;z-index:2;
  background:rgba(248,246,242,0.6);
}
.cert-sig{text-align:center;min-width:150px;}
.cert-sig-line{width:120px;height:1px;background:#2f5233;margin:0 auto 5px;}
.cert-sig-name{font-size:0.82rem;color:#333;font-family:'Sarabun',sans-serif;}
.cert-sig-role{font-size:0.63rem;color:#aaa;margin-top:1px;}
.cert-seal-wrap{opacity:0.82;}
.cert-ref{text-align:center;min-width:150px;}
.cert-ref-num{font-family:'Cormorant Garamond',serif;font-size:0.7rem;color:#999;letter-spacing:1px;}
.cert-ref-date{font-size:0.62rem;color:#ccc;margin-top:2px;}

.print-btn{
  padding:11px 44px;background:#2f5233;color:#fff;
  border:none;border-radius:25px;cursor:pointer;
  font-family:'Cormorant Garamond',serif;font-size:1rem;letter-spacing:1px;
  flex-shrink:0;
}
.print-btn:hover{background:#1a2421;}
</style>
</head>
<body>

<div class="cert-wrap">
  <!-- Corners -->
  <div class="crn crn-tl"></div>
  <div class="crn crn-tr"></div>
  <div class="crn crn-bl"></div>
  <div class="crn crn-br"></div>
  <div class="cert-frame"></div>
  <div class="cert-wm">GEARUP</div>

  <!-- Background tree art -->
  ${bgTreeSvg}

  <!-- HEADER ZONE -->
  <div class="cert-header">
    <div class="cert-header-top">
      ${leafBranch}
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div class="cert-logo-circle">
          <img src="${logoUrl}" alt="GEARUP Logo">
        </div>
        <div class="cert-brand-name">GEARUP</div>
        <div class="cert-brand-sub">Connecting Donors · Reducing E-Waste · Thailand</div>
      </div>
      ${leafBranchR}
    </div>
    <div class="orn">
      <div class="orn-l"></div><div class="orn-d"></div><div class="orn-r"></div>
    </div>
    <div class="cert-title-th">ใบรับรองการบริจาคอุปกรณ์อิเล็กทรอนิกส์</div>
    <div class="cert-title-en">Certificate of Electronic Equipment Donation</div>
  </div>

  <!-- BODY ZONE -->
  <div class="cert-body">
    <div>
      <div class="cert-preamble">ขอมอบใบรับรองฉบับนี้แก่</div>
      <div class="cert-name">${donorName}</div>
      <div class="name-rule" style="margin-top:6px;">
        <div class="name-rule-l"></div>
        <div class="name-rule-dot"></div>
        <div class="name-rule-r"></div>
      </div>
    </div>

    <div class="cert-pills">
      <div class="pill">
        <span class="pill-k">วันที่บริจาค · Date</span>
        <span class="pill-v">${issuedDate}</span>
      </div>
      <div class="pill">
        <span class="pill-k">หมายเลขการบริจาค · Donation No.</span>
        <span class="pill-v dn">${d.tracking_id || '—'}</span>
      </div>
      ${d.donor_org_name ? `<div class="pill">
        <span class="pill-k">องค์กร · Organization</span>
        <span class="pill-v">${d.donor_org_name}</span>
      </div>` : ''}
      ${d.donor_tax_id ? `<div class="pill">
        <span class="pill-k">เลขผู้เสียภาษี · Tax ID</span>
        <span class="pill-v">${d.donor_tax_id}</span>
      </div>` : ''}
    </div>

    <div style="width:100%;">
      <div class="sec-div" style="margin-bottom:8px;">
        <div class="sdl"></div>
        <div class="sdlabel">รายการอุปกรณ์ที่บริจาค · Donated Equipment</div>
        <div class="sdl"></div>
      </div>
      <table class="cert-table">
        <thead>
          <tr>
            <th>#</th>
            <th>ประเภทอุปกรณ์</th>
            <th>รุ่น / ยี่ห้อ</th>
            <th style="text-align:center;">น้ำหนัก</th>
            <th style="text-align:center;">สภาพ</th>
          </tr>
        </thead>
        <tbody>${itemsRowsHtml}</tbody>
      </table>
      ${d._recipientPost ? `
      <div style="text-align:center;margin-top:8px;">
        <div class="cert-dest">
          <span class="cert-dest-lbl">ปลายทาง</span>
          <span style="font-weight:600;color:#1a2421;">${d._recipientPost.org_name || d._recipientPost.project_name || d._recipientPost.contact_name}</span>
          ${d._recipientPost.address ? `<span style="font-size:0.75rem;color:#666;">📍 ${d._recipientPost.address}</span>` : ''}
        </div>
      </div>` : ''}
    </div>

    ${carbonSaved > 0 ? `
    <div style="width:100%;">
      <div class="sec-div" style="margin-bottom:10px;">
        <div class="sdl"></div>
        <div class="sdlabel">ผลกระทบเชิงบวก · Environmental Impact</div>
        <div class="sdl"></div>
      </div>
      <div class="cert-impact">
        <div class="cert-impact-card">
          <div class="impact-icon-wrap">${iconCarbon}</div>
          <div class="impact-val">${Math.round(carbonSaved).toLocaleString()}</div>
          <div class="impact-label">kgCO₂e ที่ลดได้<br>Carbon Saved</div>
        </div>
        <div class="cert-impact-card">
          <div class="impact-icon-wrap">${iconTree}</div>
          <div class="impact-val">${treesEq.toLocaleString()}</div>
          <div class="impact-label">ต้นไม้เทียบเท่า<br>Equivalent Trees</div>
        </div>
        <div class="cert-impact-card">
          <div class="impact-icon-wrap">${iconCar}</div>
          <div class="impact-val">${kmEq.toLocaleString()}</div>
          <div class="impact-label">กม. ไม่ปล่อย CO₂<br>Car km Offset</div>
        </div>
      </div>
    </div>` : ''}
  </div>

  <!-- FOOTER ZONE -->
  <div class="cert-footer">
    <div class="cert-sig">
      <div style="height:30px;"></div>
      <div class="cert-sig-line"></div>
      <div class="cert-sig-name">ทีม GEARUP</div>
      <div class="cert-sig-role">โครงการลดขยะอิเล็กทรอนิกส์</div>
    </div>
    <div class="cert-seal-wrap">${sealSvg}</div>
    <div class="cert-ref">
      <div class="cert-ref-num">${certNum}</div>
      <div class="cert-ref-date">วันที่ออก: ${issuedDate}</div>
    </div>
  </div>
</div>

<button class="print-btn" onclick="window.print()">🖨️ พิมพ์ / บันทึกเป็น PDF</button>
</body>
</html>`;

    const win = window.open('', 'GEARUP Certificate', 'width=1160,height=820');
    if (win) { win.document.write(html); win.document.close(); }
    else { showNotification('กรุณาอนุญาต Popup ของเว็บไซต์นี้ในการตั้งค่าเบราว์เซอร์', 'error'); }
}

// === ADMIN FUNCTIONS (for debug) ===
window.gearupAdmin = {
    viewDonations: () => { console.log('Local Donations:', donations); return donations; },
    viewRequests: () => { console.log('Local Requests:', requests); return requests; },
    clearLocalData: () => { localStorage.clear(); location.reload(); },
    supabase: supabaseClient
};

console.log('GEARUP initialized with Supabase. Type "gearupAdmin" in console for debug tools.');