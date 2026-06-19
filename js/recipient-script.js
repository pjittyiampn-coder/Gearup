// ============================================================
// GEARUP Recipient Dashboard — recipient-script.js
// Uses direct Supabase queries (no RPC) with anon RLS policies
// ============================================================

const SUPABASE_URL      = 'https://wavhxkawlzeyhtthffhs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhdmh4a2F3bHpleWh0dGhmZmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNzU3NTEsImV4cCI6MjA4NjY1MTc1MX0.NERS8pASDTG2UkgMylMLDPSu6NkNFIec_FAYD6LtTtU';

let rcpClient   = null;
let rcpSession  = null; // { email, trackingId, requestId, orgName, schoolId }
let _rcpProjects = [];
let _rcpEmail    = '';
let _rcpSchool   = null; // full school record from get_school_by_email

// ─── Init ─────────────────────────────────────────────────
(async () => {
    try {
        rcpClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.error('Supabase init error:', e);
    }

    // Restore login from session — always re-fetch live data from Supabase
    const saved = sessionStorage.getItem('gearup_recipient');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.requestId) {
                rcpSession = parsed;
                showDash();
                await fetchAndRender(parsed.requestId);
            } else {
                throw new Error('no requestId');
            }
        } catch {
            sessionStorage.removeItem('gearup_recipient');
        }
    }
})();

// Fetch fresh donations + confirmation + delivery events and render
async function fetchAndRender(requestId) {
    try {
        const { data: reqRows, error: reqErr } = await rcpClient
            .from('requests')
            .select('*')
            .eq('id', requestId)
            .limit(1);

        if (reqErr) throw reqErr;
        if (!reqRows || reqRows.length === 0) throw new Error('request not found');
        const request = reqRows[0];

        populateSidebar(request);

        const { data: donRows, error: donErr } = await rcpClient
            .from('donations')
            .select('*, items:donation_items(*)')
            .eq('direct_donation_to_request_id', request.id)
            .order('created_at');

        if (donErr) throw donErr;
        const donations = donRows || [];

        const { data: cfRows } = await rcpClient
            .from('recipient_confirmations')
            .select('*')
            .eq('request_id', request.id)
            .limit(1);

        const confirmation = cfRows?.[0] || null;

        // Fetch delivery events for this request (anon read policy allows it)
        const { data: evRows } = await rcpClient
            .from('delivery_events')
            .select('*')
            .eq('request_id', request.id)
            .neq('status', 'cancelled')
            .order('scheduled_date', { ascending: true });
        const deliveryEvents = evRows || [];

        renderMain(request, donations, confirmation, deliveryEvents);
    } catch (e) {
        console.error('Fetch error:', e);
        document.getElementById('dashMain').innerHTML = `
            <div class="empty-card">
                <div class="empty-icon">⚠️</div>
                <h3>โหลดข้อมูลไม่สำเร็จ</h3>
                <p>${e.message || 'กรุณาลองใหม่อีกครั้ง'}</p>
            </div>`;
    }
}

// ─── Login ────────────────────────────────────────────────
async function loginRecipient() {
    const email = document.getElementById('lcEmail').value.trim().toLowerCase();
    const btn   = document.getElementById('btnLcSubmit');

    document.getElementById('lcError').style.display = 'none';

    const _emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !_emailRx.test(email)) {
        showError('กรุณากรอกอีเมลให้ถูกต้อง');
        return;
    }

    btn.textContent = 'กำลังค้นหา…';
    btn.disabled = true;

    try {
        const { data: schoolData, error: rpcErr } = await rcpClient
            .rpc('get_school_by_email', { p_email: email });

        if (rpcErr) throw rpcErr;

        if (!schoolData || !schoolData.found) {
            showError('ไม่พบโรงเรียน/องค์กรที่ตรงกับอีเมลนี้ กรุณาตรวจสอบอีเมลอีกครั้ง');
            return;
        }

        const reqRows = schoolData.requests || [];
        if (reqRows.length === 0) {
            showError('โรงเรียน/องค์กรนี้ยังไม่มีโครงการในระบบ');
            return;
        }

        showProjectList(reqRows, email, schoolData);

    } catch (e) {
        console.error('Login error:', e);
        showError('เกิดข้อผิดพลาด: ' + (e.message || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
        btn.textContent = 'ค้นหาโครงการ →';
        btn.disabled = false;
    }
}

async function showProjectList(projects, email, school) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('projectSection').style.display = 'block';
    document.getElementById('dashSection').style.display = 'none';

    _rcpProjects = projects;
    _rcpEmail    = email;
    _rcpSchool   = school || null;

    const schoolName = school?.school_name || projects[0]?.org_name || projects[0]?.contact_name || 'โรงเรียน/องค์กรของคุณ';
    const totalEquip = projects.reduce((s, p) => s + (parseInt(p.quantity) || 0), 0);

    // ─── Hero Banner ───
    const bannerUrl = school?.banner_url
        || projects.find(p => p.document_url && /\.(jpg|jpeg|png|webp|gif)/i.test(p.document_url))?.document_url
        || 'img/school-banner.jpg';
    const bannerEl = document.getElementById('projBanner');
    if (bannerEl) {
        bannerEl.style.backgroundImage = `url('${bannerUrl}')`;
    }
    const nameEl = document.getElementById('projBannerName');
    if (nameEl) nameEl.textContent = schoolName;
    const subEl = document.getElementById('projBannerSub');
    if (subEl) subEl.textContent = `${email}  ·  พบ ${projects.length} โครงการ`;

    // Hero stats pills
    const statCount = document.getElementById('projStatCount');
    const statEquip = document.getElementById('projStatEquip');
    if (statCount) statCount.textContent = projects.length;
    if (statEquip) statEquip.textContent = totalEquip || '—';

    // ─── School Info Card ───
    const avatarEl = document.getElementById('projSchoolAvatar');
    if (avatarEl) avatarEl.textContent = schoolName.charAt(0) || 'ร';

    const cardNameEl = document.getElementById('projSchoolCardName');
    if (cardNameEl) cardNameEl.textContent = schoolName;

    const cardTypeEl = document.getElementById('projSchoolCardType');
    if (cardTypeEl) cardTypeEl.textContent = projects[0]?.org_type || 'โรงเรียน/องค์กร';

    const phone    = school?.school_phone    || projects[0]?.phone    || '';
    const address  = school?.school_address  || projects[0]?.address  || '';
    const province = school?.school_province || '';
    const infoEl = document.getElementById('projSchoolInfo');
    if (infoEl) {
        const infoItems = [email, phone, [address, province].filter(Boolean).join(' ')].filter(Boolean);
        infoEl.innerHTML = infoItems.map(item =>
            `<div class="proj-info-row"><span class="proj-info-dot"></span><span>${escHtml(item)}</span></div>`
        ).join('');
    }

    const cardCount = document.getElementById('projCardCount');
    if (cardCount) cardCount.textContent = projects.length;

    // Aggregate requested equipment across all projects
    const equipReq = {};
    projects.forEach(p => {
        const items = _parseEquipDetail(p);
        if (items.length > 0) {
            items.forEach(({ typeTh, quantity }) => {
                equipReq[typeTh] = (equipReq[typeTh] || 0) + (parseInt(quantity) || 0);
            });
        } else if (p.equipment_type) {
            const types = p.equipment_type.split(',').map(t => t.trim()).filter(Boolean);
            const perType = Math.ceil((parseInt(p.quantity) || 0) / (types.length || 1));
            types.forEach(t => { equipReq[t] = (equipReq[t] || 0) + perType; });
        }
    });

    function renderBreakdown(equipRcv) {
        const breakdownEl = document.getElementById('projEquipBreakdown');
        if (!breakdownEl) return;
        const entries = Object.entries(equipReq);
        if (entries.length === 0) {
            breakdownEl.innerHTML = '<div class="proj-equip-breakdown-title">อุปกรณ์ที่ขอ</div><div style="font-size:0.82rem;color:var(--text-muted)">—</div>';
            return;
        }
        breakdownEl.innerHTML =
            '<div class="proj-equip-breakdown-title">อุปกรณ์ที่ขอ (ได้รับ/ขอ)</div>' +
            entries.map(([name, req]) => {
                const rcv = (equipRcv && equipRcv[name]) || 0;
                return `<div class="proj-equip-row">
                    <span class="proj-equip-row-name">${escHtml(name)}</span>
                    <span class="proj-equip-row-qty">${rcv}/${req}</span>
                </div>`;
            }).join('');
    }

    // Render immediately with 0 received (placeholder)
    renderBreakdown({});

    // Then fetch actual received counts from donation_items
    try {
        const projectIds = projects.map(p => p.id).filter(Boolean);
        if (projectIds.length > 0 && rcpClient) {
            const { data: dons } = await rcpClient
                .from('donations')
                .select('donation_items(device_type)')
                .in('direct_donation_to_request_id', projectIds)
                .in('current_status', ['delivered', 'completed']);

            const equipRcv = {};
            (dons || []).forEach(don => {
                (don.donation_items || []).forEach(item => {
                    const raw  = item.device_type || 'Other';
                    const en   = DEVICE_TH_TO_EN[raw] || raw;
                    const th   = DEVICE_TH_MAP[en] || raw;
                    equipRcv[th] = (equipRcv[th] || 0) + 1;
                });
            });
            renderBreakdown(equipRcv);
        }
    } catch (e) {
        console.warn('Could not fetch received item counts:', e);
    }

    const badgeEl = document.getElementById('projCountBadge');
    if (badgeEl) badgeEl.textContent = `${projects.length} โครงการ`;

    // ─── Project Cards ───
    const STATUS_TH = {
        submitted: 'รอตรวจสอบ', approved: 'อนุมัติแล้ว', matching: 'กำลังจับคู่',
        preparing: 'เตรียมจัดส่ง', in_transit: 'กำลังจัดส่ง', delivered: 'ส่งแล้ว', completed: 'เสร็จสิ้น'
    };
    const STATUS_STRIPE = {
        submitted: '#8b7355', approved: '#2f5233', matching: '#1d6fa4',
        preparing: '#e67e22', in_transit: '#7c3aed', delivered: '#27ae60', completed: '#1a2421'
    };

    function equipIcon(equipType) {
        const e = (equipType || '').toLowerCase();
        if (e.includes('แล็ปท็อป') || e.includes('โน้ตบุ๊ก')) return '💻';
        if (e.includes('แท็บเล็ต')) return '📱';
        if (e.includes('คอมพิวเตอร์')) return '🖥';
        if (e.includes('โทรศัพท์')) return '📲';
        if (e.includes('printer') || e.includes('เครื่องพิมพ์')) return '🖨';
        return '📋';
    }

    const listEl = document.getElementById('projectList');
    listEl.innerHTML = projects.map(p => {
        const status      = p.fulfillment_status || 'submitted';
        const stripe      = STATUS_STRIPE[status] || '#8b7355';
        const statusTh    = STATUS_TH[status] || status;
        const statusClass = 'proj-pill-' + status;
        const equip       = p.equipment_type ? p.equipment_type.split(',')[0].trim() : '—';
        const qty         = p.quantity ? `${p.quantity} ชิ้น` : '—';
        return `
        <div class="proj-card" onclick="selectProjectById('${p.id}', '${email}')">
            <div class="proj-card-stripe" style="background:${stripe}"></div>
            <div class="proj-card-body">
                <div class="proj-card-icon">${equipIcon(p.equipment_type)}</div>
                <div class="proj-card-info">
                    <div class="proj-card-name">${escHtml(p.project_name || p.org_name || '—')}</div>
                    <div class="proj-card-id">${escHtml(p.tracking_id)}</div>
                    <div class="proj-card-pills">
                        <span class="proj-pill proj-pill-equip">${escHtml(equip)}</span>
                        <span class="proj-pill proj-pill-qty">${qty}</span>
                        <span class="proj-pill ${statusClass}">${statusTh}</span>
                    </div>
                </div>
                <button class="proj-card-action" onclick="event.stopPropagation();selectProjectById('${p.id}', '${email}')">ดูรายละเอียด</button>
            </div>
        </div>`;
    }).join('');
}

async function selectProjectById(requestId, email) {
    try {
        const { data: rows } = await rcpClient
            .from('requests')
            .select('id, tracking_id, project_name, contact_name, org_name')
            .eq('id', requestId)
            .limit(1);
        if (rows && rows[0]) await selectProject(rows[0], email);
    } catch (e) {
        console.error('selectProjectById error:', e);
    }
}

async function selectProject(request, email) {
    rcpSession = {
        email,
        trackingId: request.tracking_id,
        requestId:  request.id,
        orgName:    request.org_name || request.contact_name || request.project_name,
        schoolId:   _rcpSchool?.school_id || null,
    };
    sessionStorage.setItem('gearup_recipient', JSON.stringify(rcpSession));

    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('projectSection').style.display = 'none';
    showDash();
    await fetchAndRender(request.id);
}

// ─── Logout ───────────────────────────────────────────────
function logoutRecipient() {
    sessionStorage.removeItem('gearup_recipient');
    rcpSession = null;
    document.getElementById('dashSection').style.display = 'none';
    document.getElementById('projectSection').style.display = 'none';
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('lcEmail').value = '';
    document.getElementById('lcError').style.display = 'none';
}

function backToProjects() {
    rcpSession = null;
    sessionStorage.removeItem('gearup_recipient');
    document.getElementById('dashSection').style.display = 'none';
    if (_rcpProjects.length > 0) {
        showProjectList(_rcpProjects, _rcpEmail, _rcpSchool);
    } else {
        document.getElementById('loginSection').style.display = 'flex';
    }
}

// ─── UI ───────────────────────────────────────────────────
function showDash() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashSection').style.display = 'block';
}

function showError(msg) {
    const el = document.getElementById('lcError');
    el.textContent = msg;
    el.style.display = 'block';
}

function populateSidebar(req) {
    document.getElementById('dashOrgName').textContent = req.contact_name || '';
    document.getElementById('sideTrackId').textContent = req.tracking_id  || '—';
    document.getElementById('sideProject').textContent = req.project_name || '—';
    document.getElementById('sideOrgType').textContent = req.org_type === 'school' ? 'โรงเรียน' : (req.org_type || '—');
    document.getElementById('sideEquip').textContent   = req.equipment_type || '—';
    document.getElementById('sideContact').textContent = req.contact_name  || '—';

    const qty = _resolveRequestedQty(req);
    document.getElementById('sideQty').textContent = qty > 0 ? `${qty} เครื่อง` : '—';

    const badge  = document.getElementById('sideStatus');
    const status = req.fulfillment_status || 'submitted';
    badge.textContent = statusLabel(status);
    badge.className   = 's-badge s-' + status;
}

function updateSidebarProgress(req, donations) {
    const qty = _resolveRequestedQty(req);
    if (qty <= 0) return;
    const received = _sumItems(donations, ['delivered', 'completed']);
    const pct = Math.min(100, Math.round(received / qty * 100));

    const wrap = document.getElementById('sideProgressWrap');
    const fill = document.getElementById('sideProgFill');
    const lbl  = document.getElementById('sideProgLabel');
    if (!wrap) return;
    wrap.style.display = 'block';
    fill.style.width   = pct + '%';
    lbl.textContent    = `ได้รับแล้ว ${received} / ${qty} เครื่อง (${pct}%)`;
}

// ─── Main render ──────────────────────────────────────────
function renderMain(request, donations, confirmation, deliveryEvents) {
    const main = document.getElementById('dashMain');

    // Always update sidebar progress & stats
    updateSidebarProgress(request, donations);
    const statsHtml  = buildStatsSection(request, donations);
    const eventsHtml = buildDeliveryEventsSection(deliveryEvents || []);

    // Donations still waiting for recipient confirmation
    const awaitingConfirm = (donations || []).filter(d => d.current_status === 'distributed');

    // Only show the "all confirmed" banner when there are no more distributed donations pending
    if (confirmation && confirmation.received_confirmed !== null && awaitingConfirm.length === 0) {
        main.innerHTML = statsHtml + eventsHtml + buildConfirmedBanner(confirmation) + buildDonationList(donations);
        return;
    }

    if (!donations || donations.length === 0) {
        main.innerHTML = statsHtml + eventsHtml + `
            <div class="empty-card">
                <div class="empty-icon">📦</div>
                <h3>รอการจับคู่การบริจาค</h3>
                <p>คำขอได้รับการอนุมัติแล้ว ทีมงาน GEARUP กำลังหาอุปกรณ์ที่เหมาะสม<br>
                   ระบบจะอัปเดตที่นี่เมื่อมีอุปกรณ์พร้อมจัดส่ง</p>
            </div>`;
        return;
    }

    // awaitingConfirm already computed above (distributed status → needs confirmation form)
    const dispatched = awaitingConfirm;
    // Donations in earlier pipeline stages — no form yet
    const pending = donations.filter(d =>
        !['distributed', 'delivered', 'completed'].includes(d.current_status)
    );
    // Already confirmed / completed — always show so they don't disappear
    const done = donations.filter(d => ['delivered', 'completed'].includes(d.current_status));

    let html = statsHtml + eventsHtml;
    if (dispatched.length > 0) {
        _cfItems = [];
        let cfIdx = 0;
        html += `<div class="dash-sec-title"><span class="sec-dot"></span>อุปกรณ์ที่จัดส่งเรียบร้อยแล้ว — รอยืนยันการรับ</div>`;
        dispatched.forEach((d, donIdx) => {
            const startIdx = cfIdx;
            (d.items || []).forEach(it => { _cfItems.push({ ...it, _donTrackingId: d.tracking_id }); cfIdx++; });
            html += buildDonationCardWithConfirm(d, startIdx, donIdx, request.id);
        });
        if (pending.length > 0) {
            html += `<div class="dash-sec-title" style="margin-top:1.5rem;"><span class="sec-dot"></span>อุปกรณ์ที่รอดำเนินการ</div>`;
            pending.forEach(d => { html += buildDonationCard(d); });
        }
    } else if (pending.length > 0) {
        html += `<div class="dash-sec-title"><span class="sec-dot"></span>สถานะการบริจาค</div>`;
        pending.forEach(d => { html += buildDonationCard(d); });
        html += `
            <div class="empty-card" style="padding:1.6rem;text-align:left;margin-top:1rem;">
                <p style="color:var(--text-muted);font-size:0.92rem;">
                    📋 แบบยืนยันการรับจะปรากฏที่นี่เมื่ออุปกรณ์ถูกส่งออกไปแล้ว (จัดส่งเรียบร้อย)
                </p>
            </div>`;
    }

    // Always append confirmed/completed donations so they're never hidden
    if (done.length > 0) {
        html += `<div class="dash-sec-title" style="margin-top:1.5rem;"><span class="sec-dot" style="background:#2f5233"></span>อุปกรณ์ที่ได้รับแล้ว ✅</div>`;
        done.forEach(d => { html += buildDonationCard(d); });
    }

    main.innerHTML = html;
}

// ─── Donation card ────────────────────────────────────────
function buildDonationCard(d) {
    const items  = d.items || [];
    const status = d.current_status || 'submitted';
    const DEVICE_TH = { Computer:'คอมพิวเตอร์', Laptop:'แล็ปท็อป', Tablet:'แท็บเล็ต', Phone:'โทรศัพท์' };

    const itemTags = items.length > 0
        ? items.map(it => {
            const typeTh = DEVICE_TH[it.device_type] || it.device_type || '';
            const detail = [it.device_brand, it.device_model].filter(Boolean).join(' ');
            const serial = it.serial_number ? ` · S/N:${it.serial_number}` : '';
            return `<span style="display:inline-flex;align-items:center;gap:0.3rem;background:#f0f7f1;border-radius:6px;padding:0.2rem 0.55rem;font-size:0.78rem;color:#2f5233;font-weight:600;white-space:nowrap;">${escHtml(typeTh)}${detail ? `<span style="font-weight:400;color:#555;">· ${escHtml(detail)}${serial}</span>` : ''}</span>`;
          }).join(' ')
        : '<span style="color:#aaa;font-size:0.82rem;">ยังไม่มีข้อมูลอุปกรณ์</span>';

    const shipInfo = [
        d.shipping_carrier ? carrierLabel(d.shipping_carrier) : null,
        d.shipping_tracking_id || 'ยังไม่มีเลขพัสดุ',
        d.total_items ? `${d.total_items} ชิ้น` : null,
    ].filter(Boolean).join(' · ');

    return `
        <div class="don-card" style="padding:0.75rem 1rem;border-radius:10px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.07);margin-bottom:0.5rem;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:0.4rem;">
                <span style="font-family:monospace;font-size:0.82rem;color:#555;font-weight:600;">${escHtml(d.tracking_id || '—')}</span>
                <span class="s-badge s-${status}" style="flex-shrink:0;">${statusLabel(status)}</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.4rem;">${itemTags}</div>
            <div style="font-size:0.76rem;color:#999;">${escHtml(shipInfo)}</div>
        </div>`;
}

function buildDonationList(donations) {
    if (!donations || donations.length === 0) return '';
    return `<div class="dash-sec-title" style="margin-top:2rem"><span class="sec-dot"></span>รายการอุปกรณ์</div>
            ${donations.map(buildDonationCard).join('')}`;
}

// ─── Confirmation helpers ─────────────────────────────────
let _cfItems = []; // flat list of all items across dispatched donations

const DEVICE_TH_RCP = { Computer:'คอมพิวเตอร์', Laptop:'แล็ปท็อป', Tablet:'แท็บเล็ต', Phone:'โทรศัพท์มือถือ' };

// Renders a dispatched donation card with inline per-item confirm rows + name/phone/submit
function buildDonationCardWithConfirm(d, startIdx, donIdx, requestId) {
    const items  = d.items || [];
    const status = d.current_status || 'submitted';

    const DEVICE_TH_CHIP = { Computer:'คอมพิวเตอร์', Laptop:'แล็ปท็อป', Tablet:'แท็บเล็ต', Phone:'โทรศัพท์' };
    const itemChips = items.length > 0
        ? items.map(it => {
            const typeTh = DEVICE_TH_CHIP[it.device_type] || it.device_type || '';
            const detail  = [it.device_brand, it.device_model].filter(Boolean).join(' ');
            const serial  = it.serial_number ? ` · S/N:${it.serial_number}` : '';
            return `<span style="display:inline-flex;align-items:center;gap:0.3rem;background:#f0f7f1;border-radius:6px;padding:0.2rem 0.55rem;font-size:0.78rem;color:#2f5233;font-weight:600;white-space:nowrap;">${escHtml(typeTh)}${detail ? `<span style="font-weight:400;color:#555;">· ${escHtml(detail)}${escHtml(serial)}</span>` : ''}</span>`;
          }).join(' ')
        : '<span style="color:#aaa;font-size:0.82rem;">ยังไม่มีข้อมูลอุปกรณ์</span>';

    const confirmRows = items.map((item, offset) => {
        const i = startIdx + offset;
        const typeTh = DEVICE_TH_RCP[item.device_type] || item.device_type || 'อุปกรณ์';
        const detail = [item.device_brand, item.device_model].filter(Boolean).join(' ');
        const key = `cfrow_${i}`;
        return `
        <div class="cf-item-row" id="${key}" data-idx="${i}">
            <div class="cf-item-hdr">
                <span class="cf-item-badge">${escHtml(typeTh)}</span>
                <span class="cf-item-name">${escHtml(detail || '—')}</span>
                ${item.serial_number ? `<span style="font-family:monospace;font-size:0.78rem;color:#999;margin-left:auto;white-space:nowrap;">S/N: ${escHtml(item.serial_number)}</span>` : ''}
            </div>
            <div class="cf-item-opts">
                <button type="button" class="cf-item-btn cf-btn-ok" data-key="${key}" data-val="ok" onclick="cfToggle(this)">
                    ✅ รับแล้ว ใช้งานได้
                </button>
                <button type="button" class="cf-item-btn cf-btn-bad" data-key="${key}" data-val="defective" onclick="cfToggle(this)">
                    ❌ ใช้งานไม่ได้
                </button>
            </div>
            <textarea class="cf-item-note" id="cfnote_${i}" placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"></textarea>
        </div>`;
    }).join('');

    const confirmSection = items.length > 0 ? `
        <div class="don-confirm-section" id="cfcard_${donIdx}">
            <div class="don-confirm-hdr">
                <h3>✏️ ยืนยันสถานะอุปกรณ์</h3>
                <p>โปรดตรวจสอบและยืนยันสถานะของอุปกรณ์แต่ละชิ้น</p>
            </div>
            <div class="don-confirm-body">
                <div style="display:flex;justify-content:flex-end;margin-bottom:0.6rem;">
                    <button type="button" onclick="selectAllOk('cfcard_${donIdx}')" style="font-size:0.82rem;padding:0.3rem 0.9rem;border-radius:6px;border:1.5px solid #2f5233;color:#2f5233;background:#fff;cursor:pointer;font-family:inherit;">✅ เลือกทั้งหมด (รับแล้ว ใช้งานได้)</button>
                </div>
                <div class="cf-items-list">${confirmRows}</div>
                <div class="cf-divider"></div>
                <div class="cf-field">
                    <label for="cfName_${donIdx}">ชื่อ-นามสกุลผู้รับของ <span style="color:var(--red)">*</span></label>
                    <input type="text" id="cfName_${donIdx}" placeholder="ชื่อผู้ยืนยันการรับอุปกรณ์">
                </div>
                <div class="cf-field">
                    <label for="cfPhone_${donIdx}">เบอร์โทรศัพท์ <span style="color:var(--text-muted);font-weight:400">(ไม่บังคับ)</span></label>
                    <input type="text" id="cfPhone_${donIdx}" placeholder="0812345678" inputmode="numeric" maxlength="10"
                        oninput="this.value=this.value.replace(/\\D/g,'').slice(0,10)">
                </div>
                <button class="btn-cf-submit" onclick="submitCardConfirm('${requestId}', '${d.id}', ${startIdx}, ${items.length}, ${donIdx})">
                    ยืนยันการรับอุปกรณ์ →
                </button>
            </div>
        </div>` : '';

    return `
        <div class="don-card" style="border-radius:12px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;overflow:hidden;">
            <div style="padding:0.75rem 1rem;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;border-bottom:1px solid #f0ede8;">
                <div>
                    <span style="font-size:0.7rem;color:#aaa;text-transform:uppercase;letter-spacing:0.06em;">รหัสการบริจาค</span>
                    <div style="font-family:monospace;font-size:0.9rem;font-weight:700;color:#1a2421;">${escHtml(d.tracking_id || '—')}</div>
                </div>
                <span class="s-badge s-${status}" style="flex-shrink:0;">${statusLabel(status)}</span>
            </div>
            <div style="padding:0.65rem 1rem;display:flex;flex-wrap:wrap;gap:0.3rem;border-bottom:1px solid #f0ede8;">${itemChips}</div>
            <div style="padding:0.5rem 1rem;font-size:0.78rem;color:#888;border-bottom:1px solid #f0ede8;">
                <strong>ขนส่ง:</strong> ${escHtml(carrierLabel(d.shipping_carrier))}
                ${d.shipping_tracking_id ? ` · <strong>เลขพัสดุ:</strong> ${escHtml(d.shipping_tracking_id)}` : ' · ยังไม่มีเลขพัสดุ'}
                ${d.total_items ? ` · จำนวน ${d.total_items} ชิ้น` : ''}
            </div>
            ${confirmSection}
        </div>`;
}

function cfToggle(btn) {
    const key = btn.dataset.key;
    const row = document.getElementById(key);
    row.querySelectorAll('.cf-item-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function selectAllOk(cfCardId) {
    const card = document.getElementById(cfCardId);
    if (!card) return;
    card.querySelectorAll('.cf-item-row').forEach(row => {
        row.querySelectorAll('.cf-item-btn').forEach(b => b.classList.remove('selected'));
        const okBtn = row.querySelector('.cf-btn-ok');
        if (okBtn) okBtn.classList.add('selected');
    });
}

// ─── Submit confirmation (per-card) ───────────────────────
async function submitCardConfirm(requestId, donationId, startIdx, count, donIdx) {
    const name  = document.getElementById(`cfName_${donIdx}`)?.value.trim();
    const phone = document.getElementById(`cfPhone_${donIdx}`)?.value.trim();

    // Validate: all items in this card must have a status selected
    const perItem = [];
    for (let i = startIdx; i < startIdx + count; i++) {
        const row = document.getElementById(`cfrow_${i}`);
        const selected = row?.querySelector('.cf-item-btn.selected');
        if (!selected) {
            showNotif(`กรุณาติ๊กสถานะของอุปกรณ์ชิ้นที่ ${i - startIdx + 1}`, 'error'); return;
        }
        const note = document.getElementById(`cfnote_${i}`)?.value.trim() || '';
        const item = _cfItems[i];
        perItem.push({
            id:     item.id || null,
            type:   item.device_type || '',
            brand:  item.device_brand || '',
            model:  item.device_model || '',
            status: selected.dataset.val,
            note,
        });
    }
    if (!name) { showNotif('กรุณากรอกชื่อผู้รับของ', 'error'); return; }
    if (phone && phone.length !== 10) { showNotif('เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก', 'error'); return; }

    const btn = document.querySelector(`#cfcard_${donIdx} .btn-cf-submit`);
    if (btn) { btn.textContent = 'กำลังบันทึก…'; btn.disabled = true; }

    const allOk = perItem.every(it => it.status === 'ok');

    try {
        // Read existing confirmation to merge items from other cards
        const { data: existingRows } = await rcpClient
            .from('recipient_confirmations')
            .select('notes')
            .eq('request_id', requestId)
            .limit(1);

        let existingPerItem = [];
        try {
            const ep = JSON.parse(existingRows?.[0]?.notes || 'null');
            if (ep?.perItem) existingPerItem = ep.perItem;
        } catch (_) {}

        // Merge: replace items with same id, append new
        const newItemIds = new Set(perItem.map(it => it.id).filter(Boolean));
        const merged = [
            ...existingPerItem.filter(it => !newItemIds.has(it.id)),
            ...perItem
        ];

        const nowIso  = new Date().toISOString();
        const nowDate = nowIso.split('T')[0]; // received_date (date only)

        const { error: cfErr } = await rcpClient
            .from('recipient_confirmations')
            .upsert({
                request_id:          requestId,
                received_confirmed:  true,
                items_match:         allOk,
                items_functional:    allOk,
                notes:               JSON.stringify({ perItem: merged }),
                confirmed_by_name:   name,
                confirmed_by_phone:  phone || null,
                confirmed_at:        nowIso,
                received_date:       nowDate,
            }, { onConflict: 'request_id' });

        if (cfErr) throw cfErr;

        // Status: completed if all OK, delivered (needs review) if any defective
        const newDonStatus = allOk ? 'completed' : 'delivered';
        const statusThLabel = allOk
            ? 'เสร็จสิ้น — ยืนยันโดยผู้รับ'
            : 'ส่งถึงผู้รับแล้ว — มีอุปกรณ์ที่ต้องตรวจสอบ';
        const statusEnLabel = allOk
            ? 'Completed — confirmed by recipient'
            : 'Delivered — some items need review';

        await rcpClient
            .from('donations')
            .update({ current_status: newDonStatus })
            .eq('id', donationId)
            .eq('current_status', 'distributed');

        await rcpClient.from('tracking_timeline').insert({
            donation_id:       donationId,
            status:            newDonStatus,
            status_display_th: statusThLabel,
            status_display_en: statusEnLabel,
        });

        showNotif(allOk ? 'ยืนยันเรียบร้อย — สถานะอัพเดทเป็น เสร็จสิ้น' : 'ยืนยันเรียบร้อย — มีอุปกรณ์ที่ต้องตรวจสอบ', 'success');

        // Notify admins via SECURITY DEFINER RPC
        try {
            await rcpClient.rpc('notify_admins_on_confirmation', {
                p_request_id:   requestId,
                p_school_name:  rcpSession?.orgName || 'โรงเรียน',
                p_project_name: document.getElementById('sideProject')?.textContent?.trim() || '—',
            });
        } catch (_) {}

        // Re-fetch and re-render full dashboard to reflect updated stats
        if (rcpSession) {
            await fetchAndRender(rcpSession.requestId);
        }

        // Replace confirm section with inline success state (may have been re-rendered, so check)
        const cfCard = document.getElementById(`cfcard_${donIdx}`);
        if (cfCard) {
            cfCard.innerHTML = `
                <div class="don-confirm-success">
                    <span class="dcs-icon">${allOk ? '✅' : '⚠️'}</span>
                    <div class="dcs-text">
                        <strong>${allOk ? 'ยืนยันเรียบร้อยแล้ว' : 'ยืนยันแล้ว — มีอุปกรณ์ต้องตรวจสอบ'}</strong>
                        <span>ยืนยันโดย ${escHtml(name)}${phone ? ' · ' + escHtml(phone) : ''}</span>
                    </div>
                </div>`;
        }

    } catch (e) {
        console.error('Confirmation error:', e);
        showNotif('เกิดข้อผิดพลาด: ' + (e.message || 'กรุณาลองใหม่'), 'error');
        if (btn) { btn.textContent = 'ยืนยันการรับอุปกรณ์ →'; btn.disabled = false; }
    }
}

// ─── Confirmed banner ─────────────────────────────────────
function buildConfirmedBanner(c) {
    const at = c.confirmed_at
        ? new Date(c.confirmed_at).toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' })
        : '—';

    // Parse per-item data from notes JSON (new format)
    let perItem = null;
    try {
        const parsed = JSON.parse(c.notes || 'null');
        if (parsed?.perItem) perItem = parsed.perItem;
    } catch (_) {}

    let itemsSection = '';
    if (perItem) {
        itemsSection = `
            <div class="cb-per-item-list">
                ${perItem.map(it => {
                    const ok = it.status === 'ok';
                    const typeTh = DEVICE_TH_RCP[it.type] || it.type || 'อุปกรณ์';
                    const detail = [it.brand, it.model].filter(Boolean).join(' ');
                    return `
                    <div class="cb-per-item ${ok ? 'cb-item-ok' : 'cb-item-bad'}">
                        <span class="cb-per-icon">${ok ? '✅' : '❌'}</span>
                        <div class="cb-per-info">
                            <span class="cb-per-type">${escHtml(typeTh)}</span>
                            <span class="cb-per-detail">${escHtml(detail || '—')}</span>
                            ${it.note ? `<span class="cb-per-note">หมายเหตุ: ${escHtml(it.note)}</span>` : ''}
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
    } else {
        // Legacy format fallback
        const bool = (v, yes, no) => (v === true || v === 'true') ? yes : no;
        itemsSection = `
            <div class="cb-grid">
                <div class="cb-item"><div class="cb-item-label">ได้รับครบถ้วน</div><div class="cb-item-val">${bool(c.received_confirmed, '✓ ครบถ้วน', '✗ ไม่ครบ')}</div></div>
                <div class="cb-item"><div class="cb-item-label">ใช้งานได้</div><div class="cb-item-val">${bool(c.items_functional, '✓ ใช้ได้', '✗ มีปัญหา')}</div></div>
            </div>
            ${c.notes ? `<p class="cb-notes">หมายเหตุ: ${escHtml(c.notes)}</p>` : ''}`;
    }

    return `
        <div class="confirmed-banner">
            <div class="cb-icon">✅</div>
            <div class="cb-text" style="flex:1">
                <h3>ยืนยันการรับอุปกรณ์เรียบร้อยแล้ว</h3>
                <p>ขอบคุณที่ยืนยัน ทีมงาน GEARUP ได้รับข้อมูลของคุณแล้ว</p>
                ${itemsSection}
                ${c.confirmed_by_name ? `<p class="cb-notes" style="margin-top:0.75rem;">ยืนยันโดย: ${escHtml(c.confirmed_by_name)}${c.confirmed_by_phone ? ' | ' + escHtml(c.confirmed_by_phone) : ''} | ${at}</p>` : ''}
            </div>
        </div>`;
}

// ─── Stats helpers ────────────────────────────────────────
const DEVICE_TH_MAP  = { Computer:'คอมพิวเตอร์', Laptop:'แล็ปท็อป', Tablet:'แท็บเล็ต', Phone:'โทรศัพท์' };
const DEVICE_TH_TO_EN = {
    'คอมพิวเตอร์':'Computer', 'แล็ปท็อป':'Laptop',
    'แท็บเล็ต':'Tablet', 'โทรศัพท์':'Phone', 'โทรศัพท์มือถือ':'Phone',
    // pass-through if already English
    'Computer':'Computer', 'Laptop':'Laptop', 'Tablet':'Tablet', 'Phone':'Phone',
};
const TRANSIT_STATUSES = ['scheduled','picked_up','processing','data_wiped','ready','distributed','in_transit'];
const DONE_STATUSES    = ['delivered','completed'];

function _resolveRequestedQty(req) {
    if (req.quantity && req.quantity > 0) return req.quantity;
    try {
        const detail = JSON.parse(req.equipment_detail || '[]');
        return detail.reduce((s, d) => s + (parseInt(d.quantity) || 0), 0);
    } catch { return 0; }
}

function _sumItems(donations, statuses) {
    return (donations || [])
        .filter(d => statuses.includes(d.current_status))
        .reduce((s, d) => s + (d.total_items || 0), 0);
}

function _parseEquipDetail(req) {
    // Returns array of { type (EN canonical), typeTh, quantity }
    try {
        const raw = JSON.parse(req.equipment_detail || '[]');
        const grouped = {};
        raw.forEach(d => {
            const rawType = d.type || 'Other';
            // Normalise Thai OR English → English canonical key
            const t = DEVICE_TH_TO_EN[rawType] || rawType;
            grouped[t] = (grouped[t] || 0) + (parseInt(d.quantity) || 0);
        });
        return Object.entries(grouped).map(([type, qty]) => ({
            type, typeTh: DEVICE_TH_MAP[type] || type, quantity: qty
        }));
    } catch { return []; }
}

function _sumItemsByType(donations, statuses) {
    const map = {};
    (donations || []).filter(d => statuses.includes(d.current_status)).forEach(d => {
        const items = d.items || [];
        if (items.length > 0) {
            items.forEach(it => {
                const raw = it.device_type || 'Other';
                const t = DEVICE_TH_TO_EN[raw] || raw; // normalise to EN
                map[t] = (map[t] || 0) + 1;
            });
        } else if (d.device_type) {
            // No donation_items rows — fall back to donation's primary device_type
            const raw = d.device_type;
            const t = DEVICE_TH_TO_EN[raw] || raw;
            map[t] = (map[t] || 0) + (d.total_items || 1);
        }
    });
    return map;
}

function buildStatsSection(request, donations) {
    const totalReq    = _resolveRequestedQty(request);
    const totalRecv   = _sumItems(donations, DONE_STATUSES);
    const totalTrans  = _sumItems(donations, TRANSIT_STATUSES);
    const shortfall   = Math.max(0, totalReq - totalRecv);
    const pctRecv     = totalReq > 0 ? Math.min(100, (totalRecv / totalReq * 100)) : 0;
    const pctTrans    = totalReq > 0 ? Math.min(100 - pctRecv, (totalTrans / totalReq * 100)) : 0;

    // Per-device breakdown
    const requested    = _parseEquipDetail(request);
    const receivedMap  = _sumItemsByType(donations, DONE_STATUSES);
    const transitMap   = _sumItemsByType(donations, TRANSIT_STATUSES);

    const breakdownRows = requested.map(r => {
        const recv  = receivedMap[r.type] || 0;
        const trans = transitMap[r.type] || 0;
        const short = Math.max(0, r.quantity - recv);
        const pct   = r.quantity > 0 ? Math.min(100, Math.round(recv / r.quantity * 100)) : 0;
        const cls   = recv >= r.quantity ? 'td-full' : (recv > 0 ? 'td-warn' : '');
        return `
        <tr>
            <td><span class="td-type-badge">${escHtml(r.typeTh)}</span></td>
            <td>${r.quantity}</td>
            <td class="${recv >= r.quantity ? 'td-full' : 'td-ok'}">${recv}</td>
            <td class="${trans > 0 ? 'td-warn' : ''}">${trans > 0 ? `🚚 ${trans}` : '—'}</td>
            <td class="${short > 0 ? 'td-ok' : 'td-full'}">
                <div class="bd-mini-wrap">
                    <span class="${short > 0 ? '' : 'td-full'}">${short > 0 ? short : '✓'}</span>
                    <div class="bd-mini-track"><div class="bd-mini-fill" style="width:${pct}%"></div></div>
                </div>
            </td>
        </tr>`;
    }).join('');

    const breakdownSection = requested.length > 0 ? `
    <div class="rcp-breakdown">
        <div class="rcp-bd-hdr">📊 รายละเอียดแยกตามประเภทอุปกรณ์</div>
        <table class="rcp-bd-table">
            <thead><tr>
                <th>ประเภท</th><th>ขอทั้งหมด</th><th>ได้รับแล้ว</th><th>กำลังมา</th><th>ยังขาด</th>
            </tr></thead>
            <tbody>${breakdownRows}</tbody>
        </table>
    </div>` : '';

    return `
    <div class="rcp-stats-section">
        <div class="rcp-stats-grid">
            <div class="rcp-stat-card stat-total">
                <span class="stat-icon">📋</span>
                <div class="stat-num">${totalReq || '—'}</div>
                <div class="stat-label">จำนวนที่ขอ</div>
            </div>
            <div class="rcp-stat-card stat-received">
                <span class="stat-icon">✅</span>
                <div class="stat-num">${totalRecv}</div>
                <div class="stat-label">ได้รับแล้ว</div>
            </div>
            <div class="rcp-stat-card stat-transit">
                <span class="stat-icon">🚚</span>
                <div class="stat-num">${totalTrans}</div>
                <div class="stat-label">กำลังจัดส่ง</div>
            </div>
            <div class="rcp-stat-card stat-short">
                <span class="stat-icon">⏳</span>
                <div class="stat-num">${shortfall}</div>
                <div class="stat-label">ยังขาดอีก</div>
            </div>
        </div>
        ${totalReq > 0 ? `
        <div class="rcp-prog-card">
            <div class="rcp-prog-header">
                <div class="rcp-prog-title">ความคืบหน้าการรับบริจาค</div>
                <div class="rcp-prog-pct">${Math.round(pctRecv)}%</div>
            </div>
            <div class="rcp-prog-track">
                <div class="rcp-prog-fill-received" style="width:${pctRecv}%"></div>
                <div class="rcp-prog-fill-transit"  style="left:${pctRecv}%;width:${pctTrans}%"></div>
            </div>
            <div class="rcp-prog-legend">
                <div class="rcp-prog-dot"><div class="rcp-prog-dot-circle" style="background:var(--primary)"></div>ได้รับแล้ว (${totalRecv})</div>
                <div class="rcp-prog-dot"><div class="rcp-prog-dot-circle" style="background:#42a5f5"></div>กำลังจัดส่ง (${totalTrans})</div>
                <div class="rcp-prog-dot"><div class="rcp-prog-dot-circle" style="background:var(--border)"></div>ยังขาด (${shortfall})</div>
            </div>
        </div>` : ''}
        ${breakdownSection}
    </div>`;
}

// ─── Utilities ────────────────────────────────────────────
function statusLabel(s) {
    return ({
        submitted:'รออนุมัติ', verified:'ตรวจสอบแล้ว', scheduled:'นัดรับแล้ว',
        picked_up:'รับพัสดุแล้ว', processing:'กำลังดำเนินการ', data_wiped:'ลบข้อมูลแล้ว',
        ready:'พร้อมจัดส่ง', distributed:'จัดส่งแล้ว — รอยืนยัน',
        approved:'อนุมัติแล้ว', matching:'กำลังจับคู่', preparing:'กำลังเตรียม',
        in_transit:'กำลังจัดส่ง', delivered:'ได้รับแล้ว', completed:'เสร็จสมบูรณ์',
    })[s] || s || '—';
}

function carrierLabel(c) {
    return ({ thailand_post:'ไปรษณีย์ไทย', jt_express:'J&T Express',
              flash_express:'Flash Express' })[c] || c || '—';
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showNotif(msg, type = 'success') {
    const el = document.getElementById('rcpNotif');
    el.textContent = msg;
    el.className = 'show ' + type;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), type === 'error' ? 6000 : 3500);
}

// ─── Delivery Events Section ──────────────────────────────
// Renders an upcoming events block above the confirmation form.
// Only shows when there are non-cancelled events for this request.
function buildDeliveryEventsSection(events) {
    if (!events || events.length === 0) return '';

    const EVT_STATUS_RCP = {
        pending:   { label: 'รอยืนยัน',   dot: '#f59e0b', bg: '#fef3c7', color: '#b45309' },
        confirmed: { label: 'ยืนยันแล้ว', dot: '#3b82f6', bg: '#dbeafe', color: '#1d4ed8' },
        completed: { label: 'เสร็จสิ้น',  dot: '#22c55e', bg: '#dcfce7', color: '#166534' },
    };

    const EVT_TYPE_RCP = {
        delivery:     '📦 จัดส่งอุปกรณ์',
        site_visit:   '🏫 ลงพื้นที่',
        handover:     '🤝 ส่งมอบจริง',
        photo_session:'📸 ถ่ายรูป',
        other:        '📋 อื่นๆ',
    };

    const cards = events.map(ev => {
        const sm      = EVT_STATUS_RCP[ev.status] || EVT_STATUS_RCP.pending;
        const typStr  = EVT_TYPE_RCP[ev.event_type] || ev.event_type;
        const dateStr = ev.scheduled_date
            ? new Date(ev.scheduled_date).toLocaleString('th-TH', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })
            : 'ยังไม่กำหนดวัน';

        const trackingHtml = ev.shipping_tracking_id
            ? `<div style="margin-top:0.45rem;font-size:0.82rem;color:var(--primary);font-weight:600;">
                 📦 ${escHtml(ev.shipping_carrier || '')} ${escHtml(ev.shipping_tracking_id)}
               </div>`
            : '';

        const notesHtml = ev.notes
            ? `<div style="margin-top:0.45rem;font-size:0.82rem;color:var(--text-muted);
                           font-style:italic;">
                 ${escHtml(ev.notes)}
               </div>`
            : '';

        return `
        <div style="display:flex;gap:1rem;align-items:flex-start;padding:1rem 1.1rem;
                    background:white;border-radius:12px;margin-bottom:0.65rem;
                    border:1px solid var(--border);border-left:4px solid ${sm.dot};
                    box-shadow:0 1px 6px rgba(47,82,51,0.06);">
          <!-- Status dot -->
          <div style="width:10px;height:10px;border-radius:50%;background:${sm.dot};
                      flex-shrink:0;margin-top:5px;"></div>
          <div style="flex:1;min-width:0;">
            <!-- Status + type row -->
            <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.3rem;">
              <span style="font-size:0.68rem;font-weight:700;padding:0.15rem 0.6rem;
                           border-radius:20px;background:${sm.bg};color:${sm.color};">
                ${sm.label}
              </span>
              <span style="font-size:0.78rem;color:var(--text-muted);">${typStr}</span>
            </div>
            <!-- Title -->
            <div style="font-family:var(--font-h);font-size:0.95rem;font-weight:700;
                        color:var(--text);margin-bottom:0.2rem;">
              ${escHtml(ev.title)}
            </div>
            <!-- Date + location -->
            <div style="font-size:0.82rem;color:var(--text-muted);">
              📅 ${dateStr}
              ${ev.location ? ` &nbsp;·&nbsp; 📍 ${escHtml(ev.location)}` : ''}
            </div>
            ${trackingHtml}
            ${notesHtml}
          </div>
        </div>`;
    }).join('');

    return `
    <div class="rcp-events-section" style="margin-bottom:1.6rem;">
      <div class="dash-sec-title">
        <span class="sec-dot" style="background:var(--accent);"></span>
        กิจกรรมที่กำลังจะมา
      </div>
      ${cards}
    </div>`;
}
