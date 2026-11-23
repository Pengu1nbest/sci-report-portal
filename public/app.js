// State Management (Dual-mode: supports both Node.js Backend & Static GitHub Pages + Google Apps Script)
const state = {
  user: null, // { id, name, email, password, groupOrder, groupName, role, isAdmin, active }
  admins: ['s25101114@stu.edu.tw'],
  criteria: [],
  groups: [],
  accounts: [],
  ratings: [],
  extraStudents: [],
  classStats: {},
  googleResources: {},
  searchQuery: '',
  adminAccountSearch: '',
  adminRatingGroupFilter: '',
  viewMode: 'table', // 'table' | 'cards'
  activeRateGroupOrder: null,
  adminProxyUploadGroupOrder: null,
  isStaticMode: false,
  googleClientId: localStorage.getItem('sci_google_client_id') || '',
  gasWebAppUrl: localStorage.getItem('sci_gas_webapp_url') || ''
};

const GROUP_CLOUD_MAP = {
  1: { formId: '1k1G1nApnFEgCr0QEH7OtKkVTp_eKiJU0pXgh6CnUrmY', sheetId: '1iLbBMufB6H33tuGqE_s9jehTI5vBMi_peE4twQ6ZKxM', qrDriveId: '1s2VnwkRl_yswwVG01KZgywqTY93mLYYO' },
  2: { formId: '1iDCH_7F5wEzKe13D5DbBdmAjEIBCUHS_N6hUPhm2PVI', sheetId: '1-RdHWNoXJj3d1Ty5TlClQf9cNAmYEO4HsUzdXRK46IM', qrDriveId: '16zxFHwQrRZMCarBUgQ9u8QgwA43jMYm3' },
  3: { formId: '1iCAer4_A1R8JRmQ4lq-hRDhdcK3n8stIQtvbiPJ8pcU', sheetId: '1Un0WT3JcqD-Z7Xh5evQ70hUcEvso1tGOqOuwCPjRgSc', qrDriveId: '1C04YtVxhsUDHs1Izau_76hEVg5a-AO-F' },
  4: { formId: '1U2lAsOt_y2FCD7u3J0TnisiXtUAr9eSlwgm8u_GZ3P8', sheetId: '1crdychJQc_opZUAYIecKSX4oL3TA1Jo1XCfKoXpnXY4', qrDriveId: '1czLrAUGyY43TMdCraNHiDB4e7J_VfkWZ' },
  5: { formId: '1U5Q28TCVg2M-gsv1ri3C9wUuYTxkJBjzABv1AiY3SkI', sheetId: '1cMNadGQ10juZV6XHH7eLpUZyyN6dS2h41Hx2eR_eLOw', qrDriveId: '1yJFxq0JlWPTybIQYTqclF1KQwMKr9m3-' },
  6: { formId: '1rLj6u7oL1XHZel_IJhdhWjoIcSblLwy5Tr9AMnrfvwI', sheetId: '17iq5ikoGaxGZok1AvLVqapfrJ25UnOrTzjel27_A4dc', qrDriveId: '1xEQMSuXYdqB2_ya8g3bFSAvaLN_0TR-Q' },
  7: { formId: '1cU12RfHYHDmfs5GHxkDfQNGpyWmIdtLwSHRBCM9dAgo', sheetId: '1bImwMoWwA2aDM7XEKP852tirwU0439xT3A840wWmGZ8', qrDriveId: '13H0XLhS_oUS2N44hXRThAnXFt17XT0x-' },
  8: { formId: '12SvrV85dfBoywXFnXeoYVGR-Vdj8FSdpGhDOOds6JGI', sheetId: '1zOl3hwW0CdH46zPCuJhhyh7lyqZvf0I4sozhUYHid7E', qrDriveId: '1m1IWbq0Xz6SoZrCX2tjNYzUesnxkg623' },
  9: { formId: '1t7LSn_2vS4hVum6EJp8Goa40-MGSzrpb5x61P0Uc1Y4', sheetId: '1g13goJHeKAtKZDDX07NnP4GxlAkXfVQ-w0gGIZM18AQ', qrDriveId: '1lcVOVieYDFqjYf8N4Qem_IVMO3ZXjXg6' },
  10: { formId: '1xyTxaLaVK4cwVgqMEitM9pLPUGvNtvQG6_og7jTyzCQ', sheetId: '1zmopD7oFqZk5ZQj-wPXyvbMG8MW-v8ROIJD2D7nKgkI', qrDriveId: '1LAFKZimTNDruVMn0HNsTCcOi5Wg9rrSx' },
  11: { formId: '1NWGuJg57xdfXzKcc0gVhQ9epwCuwWnVbGsIHhbmOG9Y', sheetId: '1jdl29m-v08PACWHxrmZCRqycmKwGrFVTa6I4P8cDbRM', qrDriveId: '17u9mkVNZ1GhGo7jTBb8iF4o1gW1ig4AP' },
  12: { formId: '1yETAYtxGfCxRat3H59Pa070Ap5aGL2pQ9iuHb-xAjro', sheetId: '1701gKKXLTG_BEc0Vq4R-7B0Y1AN7Ukn4nPELWQuDBW4', qrDriveId: '18dSDKOP6JR3og6Mzyvuo0sCoEe-p43AB' }
};

function generateRandomPasswordClient(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

// Initialize app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  loadSavedUser();
  bindEvents();
  await fetchPortalData();
});

// ==================== STATIC / LOCAL DB ENGINE (FOR GITHUB PAGES) ====================
function buildAccountsFromDb(db) {
  const adminSet = new Set((db.admins || ['s25101114@stu.edu.tw']).map(e => e.toLowerCase()));
  const accounts = [];
  for (const g of db.groups || []) {
    for (const m of g.members || []) {
      const isAdmin = adminSet.has(m.email.toLowerCase()) || m.role === 'admin' || m.id === '25101114';
      accounts.push({
        id: m.id,
        name: m.name,
        email: m.email,
        altEmail: m.altEmail || '',
        password: m.password || '',
        groupOrder: g.order,
        groupName: g.name,
        role: isAdmin ? 'admin' : 'student',
        isAdmin,
        active: m.active !== false
      });
    }
  }
  for (const ex of db.extraStudents || []) {
    const isAdmin = adminSet.has(ex.email.toLowerCase()) || ex.role === 'admin';
    accounts.push({
      id: ex.id,
      name: ex.name,
      email: ex.email,
      altEmail: ex.altEmail || '',
      password: ex.password || '',
      groupOrder: ex.groupOrder || null,
      groupName: ex.groupOrder ? `第${ex.groupOrder}組` : '未分組/其他',
      role: isAdmin ? 'admin' : 'student',
      isAdmin,
      active: ex.active !== false
    });
  }
  return accounts;
}

function hydrateStaticState(db) {
  state.admins = db.admins || ['s25101114@stu.edu.tw'];
  state.criteria = db.criteria || [];
  state.extraStudents = db.extraStudents || [];
  state.ratings = (db.ratings || []).map((r, i) => ({
    ...r,
    id: r.id || `r_${r.groupOrder}_${i + 1}`
  }));

  state.groups = (db.groups || []).map(group => {
    const cloudCfg = GROUP_CLOUD_MAP[group.order] || {};
    const groupRatings = state.ratings.filter(r => r.groupOrder === group.order);
    const count = groupRatings.length;
    let avgScores = { content: 0, visuals: 0, delivery: 0, qna: 0, teamwork: 0 };
    let totalScore = 0;

    if (count > 0) {
      const sums = groupRatings.reduce(
        (acc, r) => {
          acc.content += Number(r.scores.content || 0);
          acc.visuals += Number(r.scores.visuals || 0);
          acc.delivery += Number(r.scores.delivery || 0);
          acc.qna += Number(r.scores.qna || 0);
          acc.teamwork += Number(r.scores.teamwork || 0);
          return acc;
        },
        { content: 0, visuals: 0, delivery: 0, qna: 0, teamwork: 0 }
      );

      avgScores = {
        content: Number((sums.content / count).toFixed(1)),
        visuals: Number((sums.visuals / count).toFixed(1)),
        delivery: Number((sums.delivery / count).toFixed(1)),
        qna: Number((sums.qna / count).toFixed(1)),
        teamwork: Number((sums.teamwork / count).toFixed(1))
      };
      totalScore = Number(
        (avgScores.content + avgScores.visuals + avgScores.delivery + avgScores.qna + avgScores.teamwork).toFixed(1)
      );
    }

    const comments = groupRatings
      .filter(r => r.comment && r.comment.trim() !== '')
      .map(r => ({
        reviewerName: r.reviewerName,
        reviewerEmail: r.reviewerEmail,
        comment: r.comment,
        timestamp: r.timestamp
      }));

    return {
      ...group,
      formId: cloudCfg.formId || group.formId,
      formUrl: cloudCfg.formId ? `https://docs.google.com/forms/d/${cloudCfg.formId}/viewform` : group.formUrl,
      sheetId: cloudCfg.sheetId || group.sheetId,
      sheetUrl: cloudCfg.sheetId ? `https://docs.google.com/spreadsheets/d/${cloudCfg.sheetId}/edit` : group.sheetUrl,
      qrDriveId: cloudCfg.qrDriveId || group.qrDriveId,
      qrDriveUrl: cloudCfg.qrDriveId ? `https://drive.google.com/file/d/${cloudCfg.qrDriveId}/view` : group.qrDriveUrl,
      qrLocalUrl: `./qrcodes/group-${group.order}.png`,
      ratingCount: count,
      avgScores,
      totalScore,
      comments,
      ratings: groupRatings
    };
  });

  state.accounts = buildAccountsFromDb(db);
  const scoredGroups = state.groups.filter(g => g.ratingCount > 0);
  state.classStats = {
    totalGroups: state.groups.length,
    scoredGroupsCount: scoredGroups.length,
    totalRatingsCount: state.ratings.length,
    totalAccountsCount: state.accounts.length,
    adminAccountsCount: state.accounts.filter(a => a.isAdmin).length,
    averageScore:
      scoredGroups.length > 0
        ? Number((scoredGroups.reduce((s, g) => s + g.totalScore, 0) / scoredGroups.length).toFixed(1))
        : 0,
    maxScore: scoredGroups.length > 0 ? Number(Math.max(...scoredGroups.map(g => g.totalScore)).toFixed(1)) : 0,
    minScore: scoredGroups.length > 0 ? Number(Math.min(...scoredGroups.map(g => g.totalScore)).toFixed(1)) : 0
  };
}

function saveStaticDb() {
  const rawDb = {
    admins: state.admins,
    criteria: state.criteria,
    groups: state.groups.map(g => ({
      order: g.order,
      name: g.name,
      members: g.members,
      title: g.title,
      sourceUrl: g.sourceUrl,
      files: g.files || [],
      updatedAt: g.updatedAt
    })),
    extraStudents: state.extraStudents || [],
    ratings: state.ratings
  };
  localStorage.setItem('sci_portal_static_db', JSON.stringify(rawDb));
  hydrateStaticState(rawDb);
}

async function callGasWebApp(payload) {
  if (!state.gasWebAppUrl) return false;
  try {
    await fetch(state.gasWebAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (e) {
    console.warn('GAS sync warning:', e);
    return false;
  }
}

function loadSavedUser() {
  try {
    const raw = localStorage.getItem('sci_portal_user');
    if (raw) {
      state.user = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not load saved user:', e);
  }
  updateUserTopbar();
}

function saveUser(user) {
  state.user = user;
  if (user) {
    localStorage.setItem('sci_portal_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('sci_portal_user');
  }
  updateUserTopbar();
  renderAll();
}

function isUserAdmin() {
  if (!state.user) return false;
  return Boolean(
    state.user.isAdmin ||
      state.user.role === 'admin' ||
      state.user.id === '25101114' ||
      (state.admins || []).some(e => e.toLowerCase() === (state.user.email || '').toLowerCase())
  );
}

// Enforce Mandatory Login Gate: hide #portal-main until state.user is authenticated
function updateUserTopbar() {
  const badge = document.getElementById('user-badge');
  const syncBtn = document.getElementById('btn-sync-google');
  const myTabBadge = document.getElementById('my-group-tab-badge');
  const adminTag = document.getElementById('user-display-admin');
  const adminNavTab = document.getElementById('nav-tab-admin');
  const masterExportBtn = document.getElementById('btn-master-export-excel');
  const loginGate = document.getElementById('login-gate-screen');
  const portalMain = document.getElementById('portal-main');

  if (state.user) {
    if (loginGate) loginGate.classList.add('hidden');
    if (portalMain) portalMain.classList.remove('hidden');
    if (syncBtn) syncBtn.classList.remove('hidden');

    badge.classList.remove('hidden');
    document.getElementById('user-avatar').textContent = state.user.name.charAt(0);
    document.getElementById('user-display-name').textContent = `${state.user.name} (${state.user.id})`;
    document.getElementById('user-display-group').textContent = state.user.groupOrder
      ? `第 ${state.user.groupOrder} 組`
      : state.user.groupName;

    if (state.user.groupOrder) {
      myTabBadge.textContent = `第 ${state.user.groupOrder} 組`;
      myTabBadge.classList.remove('hidden');
    } else {
      myTabBadge.classList.add('hidden');
    }

    if (isUserAdmin()) {
      adminTag.classList.remove('hidden');
      adminNavTab.classList.remove('hidden');
      if (masterExportBtn) masterExportBtn.classList.remove('hidden');
    } else {
      adminTag.classList.add('hidden');
      adminNavTab.classList.add('hidden');
      if (masterExportBtn) masterExportBtn.classList.add('hidden');
      if (document.getElementById('tab-admin').classList.contains('active')) {
        document.getElementById('nav-tab-scores').click();
      }
    }
  } else {
    // Not logged in: lock the portal and show mandatory Login Gate
    if (loginGate) loginGate.classList.remove('hidden');
    if (portalMain) portalMain.classList.add('hidden');
    if (syncBtn) syncBtn.classList.add('hidden');

    badge.classList.add('hidden');
    myTabBadge.classList.add('hidden');
    adminTag.classList.add('hidden');
    adminNavTab.classList.add('hidden');
    if (masterExportBtn) masterExportBtn.classList.add('hidden');
  }
}

// Client-side & Server-side Excel (.xlsx) Export
window.exportAllScoresExcel = async function () {
  if (!isUserAdmin()) {
    showToast('僅限管理員（學號 25101114）可匯出分數總覽 Excel 檔', 'error');
    return;
  }

  showToast('正在產生「所有組別分數總覽 Excel (.xlsx)」檔案...', 'info');

  if (!state.isStaticMode) {
    try {
      const res = await fetch(`/api/admin/export-excel?adminEmail=${encodeURIComponent(state.user.email)}`, {
        method: 'GET',
        headers: { 'x-admin-email': state.user.email }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `科技文選_所有組別分數總覽表_${dateStr}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToast('已成功匯出並下載「科技文選_所有組別分數總覽表.xlsx」！', 'success');
        return;
      }
    } catch (e) {
      console.warn('Falling back to browser SheetJS export:', e);
    }
  }

  if (window.XLSX) {
    try {
      const wb = window.XLSX.utils.book_new();

      // Sheet 1: 分組報告評分總覽
      const summaryRows = [
        ['科技文選 分組報告評分總覽表（五項指標各 20 分，滿分 100 分）'],
        [`匯出時間：${new Date().toLocaleString('zh-TW')} ｜ 匯出管理員：${state.user.name} (${state.user.id})`],
        [],
        [
          '上台順序',
          '組員姓名',
          '學號',
          '報告題目',
          '參考來源',
          '內容掌握(20)',
          '簡報製作(20)',
          '口語台風(20)',
          '時間問答(20)',
          '團隊表現(20)',
          '總分(100)',
          '評分筆數 / 評語'
        ]
      ];

      state.groups.forEach(g => {
        const hasScore = g.ratingCount > 0;
        const commentsStr = (g.comments || []).map(c => `${c.reviewerName}: ${c.comment}`).join(' | ');
        summaryRows.push([
          g.order,
          g.members.map(m => m.name).join('、'),
          g.members.map(m => m.id).join('、'),
          g.title || '未定',
          g.sourceUrl || '無',
          hasScore ? g.avgScores.content : '',
          hasScore ? g.avgScores.visuals : '',
          hasScore ? g.avgScores.delivery : '',
          hasScore ? g.avgScores.qna : '',
          hasScore ? g.avgScores.teamwork : '',
          hasScore ? g.totalScore : 0,
          `${g.ratingCount} 筆評分${commentsStr ? ' — ' + commentsStr : ''}`
        ]);
      });

      const s = state.classStats;
      summaryRows.push(['平均 (Average)', '', '', '', '', '', '', '', '', '', s.averageScore || 0, '']);
      summaryRows.push(['最高 (Max)', '', '', '', '', '', '', '', '', '', s.maxScore || 0, '']);
      summaryRows.push(['最低 (Min)', '', '', '', '', '', '', '', '', '', s.minScore || 0, '']);

      const ws1 = window.XLSX.utils.aoa_to_sheet(summaryRows);
      window.XLSX.utils.book_append_sheet(wb, ws1, '分組報告評分總覽');

      // Sheet 2: 各組評分明細紀錄
      const ratingRows = [
        ['受評組別', '報告題目', '評分者姓名', '評分者信箱', '評分時間', '內容(20)', '簡報(20)', '口語(20)', '問答(20)', '團隊(20)', '總分(100)', '評語']
      ];
      state.ratings.forEach(r => {
        const grp = state.groups.find(g => g.order === r.groupOrder);
        const sc = r.scores || {};
        const tot =
          Number(sc.content || 0) +
          Number(sc.visuals || 0) +
          Number(sc.delivery || 0) +
          Number(sc.qna || 0) +
          Number(sc.teamwork || 0);
        ratingRows.push([
          `第 ${r.groupOrder} 組`,
          grp ? grp.title : '',
          r.reviewerName || '',
          r.reviewerEmail || '',
          r.timestamp || '',
          sc.content,
          sc.visuals,
          sc.delivery,
          sc.qna,
          sc.teamwork,
          tot,
          r.comment || ''
        ]);
      });
      const ws2 = window.XLSX.utils.aoa_to_sheet(ratingRows);
      window.XLSX.utils.book_append_sheet(wb, ws2, '各組評分明細紀錄');

      // Sheet 3: 學生與管理員帳號密碼名單
      const accRows = [['所屬組別', '登入帳號 (學號)', '登入密碼 (隨機生成)', '姓名', '學校 Google 信箱', '角色權限', '狀態']];
      state.accounts.forEach(a => {
        accRows.push([
          a.groupOrder ? `第 ${a.groupOrder} 組` : '未分組',
          a.id,
          a.password || '',
          a.name,
          a.email,
          a.isAdmin ? '系統管理員 (Admin)' : '一般學生 (Student)',
          a.active !== false ? '啟用中' : '已停用'
        ]);
      });
      const ws3 = window.XLSX.utils.aoa_to_sheet(accRows);
      window.XLSX.utils.book_append_sheet(wb, ws3, '學生與管理員帳號名單');

      const dateStr = new Date().toISOString().slice(0, 10);
      window.XLSX.writeFile(wb, `科技文選_所有組別分數總覽表_${dateStr}.xlsx`);
      showToast('已成功匯出並下載「科技文選_所有組別分數總覽表.xlsx」！', 'success');
    } catch (err) {
      showToast('匯出 Excel 失敗：' + err.message, 'error');
    }
  }
};

async function fetchPortalData() {
  try {
    const res = await fetch('/api/portal-data');
    if (!res.ok) throw new Error('Static mode fallback');
    const data = await res.json();
    state.isStaticMode = false;
    state.admins = data.admins || ['s25101114@stu.edu.tw'];
    state.criteria = data.criteria || [];
    state.groups = (data.groups || []).map(g => ({
      ...g,
      qrLocalUrl: `./qrcodes/group-${g.order}.png`
    }));
    state.accounts = data.accounts || [];
    state.ratings = data.ratings || [];
    state.classStats = data.classStats || {};
    state.googleResources = data.googleResources || {};
  } catch (err) {
    state.isStaticMode = true;
    const savedStatic = localStorage.getItem('sci_portal_static_db');
    const initRes = await fetch('./initial-db.json');
    const initDb = await initRes.json();

    if (savedStatic) {
      const parsed = JSON.parse(savedStatic);
      // Ensure passwords exist if migrating from older localStorage
      const pwdMap = {};
      (initDb.groups || []).forEach(g => (g.members || []).forEach(m => (pwdMap[m.id] = m.password)));
      (initDb.extraStudents || []).forEach(ex => (pwdMap[ex.id] = ex.password));
      (parsed.groups || []).forEach(g =>
        (g.members || []).forEach(m => {
          if (!m.password) m.password = pwdMap[m.id] || generateRandomPasswordClient(8);
        })
      );
      (parsed.extraStudents || []).forEach(ex => {
        if (!ex.password) ex.password = pwdMap[ex.id] || generateRandomPasswordClient(8);
      });
      hydrateStaticState(parsed);
    } else {
      hydrateStaticState(initDb);
    }
  }

  if (state.user) {
    const latest = state.accounts.find(
      a => a.id.toLowerCase() === (state.user.id || '').toLowerCase() || a.email.toLowerCase() === (state.user.email || '').toLowerCase()
    );
    if (latest && latest.active !== false) {
      state.user = latest;
      localStorage.setItem('sci_portal_user', JSON.stringify(latest));
    } else if (latest && latest.active === false) {
      state.user = null;
      localStorage.removeItem('sci_portal_user');
    }
  }

  updateUserTopbar();
  renderAll();
}

function renderAll() {
  if (!state.user) return;
  renderCriteriaChips();
  renderClassStats();
  renderMasterTable();
  renderGroupCards();
  renderMyGroupWorkspace();
  renderAdminBackend();
  renderCloudResources();
}

// 1. Criteria Chips (5 x 20 pts = 100 pts)
function renderCriteriaChips() {
  const container = document.getElementById('criteria-chips-list');
  container.innerHTML = state.criteria
    .map(
      c => `
      <span class="criterion-chip">
        <span>${escapeHtml(c.name)}</span>
        <strong>${c.maxScore}分 (${c.weight})</strong>
      </span>
    `
    )
    .join('');
}

// 2. Class Summary Stats
function renderClassStats() {
  const s = state.classStats;
  document.getElementById('stat-avg').textContent = (s.averageScore || 0).toFixed(1);
  document.getElementById('stat-max').textContent = (s.maxScore || 0).toFixed(1);
  document.getElementById('stat-min').textContent = (s.minScore || 0).toFixed(1);
  document.getElementById('stat-count').textContent = s.totalRatingsCount || 0;
}

function getFilteredGroups() {
  const q = state.searchQuery.trim().toLowerCase();
  if (!q) return state.groups;
  return state.groups.filter(g => {
    const memberText = g.members.map(m => `${m.name} ${m.id} ${m.email}`).join(' ').toLowerCase();
    return (
      `第${g.order}組`.includes(q) ||
      String(g.order) === q ||
      g.name.toLowerCase().includes(q) ||
      g.title.toLowerCase().includes(q) ||
      memberText.includes(q)
    );
  });
}

function findMyExistingRating(group) {
  if (!state.user || !group || !group.ratings) return null;
  const myEmail = (state.user.email || '').toLowerCase();
  const myAlt = (state.user.altEmail || '').toLowerCase();
  return group.ratings.find(r => {
    const rev = (r.reviewerEmail || '').toLowerCase();
    return rev === myEmail || (myAlt && rev === myAlt);
  });
}

// 3. Master Grading Table
function renderMasterTable() {
  const tbody = document.getElementById('grading-table-body');
  const tfoot = document.getElementById('grading-table-foot');
  const groups = getFilteredGroups();

  tbody.innerHTML = groups
    .map(g => {
      const isMyGroup = state.user && state.user.groupOrder === g.order;
      const myRating = findMyExistingRating(g);
      const memberNames = g.members.map(m => m.name).join('、');
      const memberIds = g.members.map(m => m.id).join('、');
      const hasScore = g.ratingCount > 0;

      const filesHtml = (g.files || [])
        .map(
          f => `
          <a href="${escapeAttr(f.url)}" target="_blank" rel="noopener" class="file-pill" title="開啟已上傳報告：${escapeAttr(f.name)}">
            📄 ${escapeHtml(truncate(f.name, 26))} ↗
          </a>
        `
        )
        .join('');

      const sourceLink =
        g.sourceUrl && g.sourceUrl.startsWith('http')
          ? `<a href="${escapeAttr(g.sourceUrl)}" target="_blank" rel="noopener" class="ext-link">參考連結 ↗</a>`
          : `<span class="score-empty">無</span>`;

      const scoreCell = val =>
        hasScore ? `<span class="score-num">${Number(val).toFixed(1)}</span>` : `<span class="score-empty">—</span>`;

      let myRatingTotal = 0;
      if (myRating && myRating.scores) {
        const ms = myRating.scores;
        myRatingTotal = Number(ms.content || 0) + Number(ms.visuals || 0) + Number(ms.delivery || 0) + Number(ms.qna || 0) + Number(ms.teamwork || 0);
      }

      return `
        <tr class="${isMyGroup ? 'is-my-group' : ''}">
          <td class="col-order">
            <span class="order-badge">${g.order}</span>
          </td>
          <td>
            <div class="member-names">
              <span>${escapeHtml(memberNames)}</span>
              ${isMyGroup ? '<span class="my-group-pill">本組</span>' : ''}
            </div>
            <div class="member-ids">${escapeHtml(memberIds)}</div>
          </td>
          <td class="report-title-cell">
            <div>${escapeHtml(g.title || '未定')}</div>
            ${filesHtml ? `<div class="attached-files-inline">${filesHtml}</div>` : ''}
          </td>
          <td>${sourceLink}</td>
          <td class="col-score">${scoreCell(g.avgScores.content)}</td>
          <td class="col-score">${scoreCell(g.avgScores.visuals)}</td>
          <td class="col-score">${scoreCell(g.avgScores.delivery)}</td>
          <td class="col-score">${scoreCell(g.avgScores.qna)}</td>
          <td class="col-score">${scoreCell(g.avgScores.teamwork)}</td>
          <td class="col-total">
            <span class="total-pill ${hasScore ? '' : 'unscored'}">
              ${hasScore ? g.totalScore.toFixed(1) : '尚未評分'}
            </span>
            <span class="rating-count-sub">${g.ratingCount} 筆評分</span>
          </td>
          <td>
            ${myRating ? `<span class="my-rated-tag">✓ 您已評 ${myRatingTotal} 分</span><br>` : ''}
            <button class="btn ${isMyGroup ? 'btn-outline' : myRating ? 'btn-outline' : 'btn-primary'} btn-sm" onclick="openRateModal(${g.order})">
              ${isMyGroup ? '查看明細' : myRating ? '修改我的評分' : '立即評分'}
            </button>
          </td>
        </tr>
      `;
    })
    .join('');

  const s = state.classStats;
  tfoot.innerHTML = `
    <tr>
      <td colspan="9">平均 (Average)</td>
      <td class="col-total">${(s.averageScore || 0).toFixed(1)}</td>
      <td></td>
    </tr>
    <tr>
      <td colspan="9">最高 (Max)</td>
      <td class="col-total" style="color: var(--accent);">${(s.maxScore || 0).toFixed(1)}</td>
      <td></td>
    </tr>
    <tr>
      <td colspan="9">最低 (Min)</td>
      <td class="col-total">${(s.minScore || 0).toFixed(1)}</td>
      <td></td>
    </tr>
  `;
}

// 4. Detailed Cards Grid View
function renderGroupCards() {
  const container = document.getElementById('groups-cards-container');
  const groups = getFilteredGroups();

  container.innerHTML = groups
    .map(g => {
      const isMyGroup = state.user && state.user.groupOrder === g.order;
      const myRating = findMyExistingRating(g);
      const memberNames = g.members.map(m => `${m.name} (${m.id})`).join('、');
      const hasScore = g.ratingCount > 0;

      let myRatingTotal = 0;
      if (myRating && myRating.scores) {
        const ms = myRating.scores;
        myRatingTotal = Number(ms.content || 0) + Number(ms.visuals || 0) + Number(ms.delivery || 0) + Number(ms.qna || 0) + Number(ms.teamwork || 0);
      }

      const barsHtml = state.criteria
        .map(c => {
          const val = hasScore ? g.avgScores[c.key] : 0;
          const pct = Math.min(100, Math.round((val / 20) * 100));
          return `
            <div class="bar-row">
              <span>${escapeHtml(c.name)}</span>
              <div class="bar-track">
                <div class="bar-fill" style="width: ${pct}%;"></div>
              </div>
              <span class="bar-val">${hasScore ? val.toFixed(1) : '—'}<small>/20</small></span>
            </div>
          `;
        })
        .join('');

      const filesHtml = (g.files || [])
        .map(
          f => `
          <a href="${escapeAttr(f.url)}" target="_blank" rel="noopener" class="file-pill">
            📄 ${escapeHtml(truncate(f.name, 28))} ↗
          </a>
        `
        )
        .join('');

      return `
        <article class="group-card ${isMyGroup ? 'is-my-group' : ''}">
          <div>
            <div class="group-card-top">
              <div>
                <span class="group-order-pill">第 ${g.order} 組</span>
                ${isMyGroup ? '<span class="my-group-pill" style="margin-left:6px;">您的組別</span>' : ''}
                ${myRating ? `<span class="my-rated-tag" style="margin-left:6px;">✓ 您已評 ${myRatingTotal} 分</span>` : ''}
              </div>
              <div style="text-align:right;">
                <span class="total-pill ${hasScore ? '' : 'unscored'}">
                  ${hasScore ? `${g.totalScore.toFixed(1)} / 100 分` : '尚未評分'}
                </span>
                <span class="rating-count-sub">共 ${g.ratingCount} 人評分</span>
              </div>
            </div>

            <h3 class="group-card-title">${escapeHtml(g.title || '未定')}</h3>
            <p class="group-card-members">組員：${escapeHtml(memberNames)}</p>
            ${filesHtml ? `<div class="attached-files-inline" style="margin-top:8px;">${filesHtml}</div>` : ''}
          </div>

          <div class="card-criteria-bars">
            ${barsHtml}
          </div>

          <div class="group-card-footer">
            <div>
              ${
                g.sourceUrl && g.sourceUrl.startsWith('http')
                  ? `<a href="${escapeAttr(g.sourceUrl)}" target="_blank" rel="noopener" class="ext-link">參考文章 / 簡報來源 ↗</a>`
                  : `<span class="score-empty" style="font-size:12px;">尚未提供參考網址</span>`
              }
            </div>
            <button class="btn ${isMyGroup ? 'btn-outline' : myRating ? 'btn-outline' : 'btn-primary'} btn-sm" onclick="openRateModal(${g.order})">
              ${isMyGroup ? '檢視本組評分明細' : myRating ? '修改我的評分 / 明細' : '線上評分 / 明細'}
            </button>
          </div>
        </article>
      `;
    })
    .join('');
}

// 5. My Group Upload & Report Management Workspace
function renderMyGroupWorkspace() {
  const unauthCard = document.getElementById('my-group-unauth');
  const workspace = document.getElementById('my-group-workspace');

  if (!state.user || !state.user.groupOrder) {
    unauthCard.classList.remove('hidden');
    workspace.classList.add('hidden');
    return;
  }

  const myGroup = state.groups.find(g => g.order === state.user.groupOrder);
  if (!myGroup) {
    unauthCard.classList.remove('hidden');
    workspace.classList.add('hidden');
    return;
  }

  unauthCard.classList.add('hidden');
  workspace.classList.remove('hidden');

  document.getElementById('my-group-order-pill').textContent = `第 ${myGroup.order} 組（上台順序 #${myGroup.order}）`;
  document.getElementById('my-group-heading').textContent = `${myGroup.name} — 報告與簡報上傳管理`;

  document.getElementById('my-group-members-list').innerHTML = myGroup.members
    .map(
      m => `
      <div class="roster-member-chip">
        <strong>${escapeHtml(m.name)} ${m.role === 'admin' ? '<span class="admin-badge-pill">管理員</span>' : ''}</strong>
        <span>學號：${escapeHtml(m.id)} · ${escapeHtml(m.email)}</span>
      </div>
    `
    )
    .join('');

  document.getElementById('input-report-title').value = myGroup.title || '';
  document.getElementById('input-report-source').value = myGroup.sourceUrl || '';

  const hasScore = myGroup.ratingCount > 0;
  document.getElementById('my-group-score-snapshot').innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
      <strong>本組目前評分統計（共 ${myGroup.ratingCount} 筆同儕評分）</strong>
      <span class="total-pill ${hasScore ? '' : 'unscored'}">
        ${hasScore ? `${myGroup.totalScore.toFixed(1)} / 100 分` : '尚無評分'}
      </span>
    </div>
    <p style="font-size:12.5px; color:var(--text-secondary);">
      內容掌握：<strong>${hasScore ? myGroup.avgScores.content : '—'}</strong>/20 ·
      簡報製作：<strong>${hasScore ? myGroup.avgScores.visuals : '—'}</strong>/20 ·
      口語台風：<strong>${hasScore ? myGroup.avgScores.delivery : '—'}</strong>/20 ·
      時間問答：<strong>${hasScore ? myGroup.avgScores.qna : '—'}</strong>/20 ·
      團隊表現：<strong>${hasScore ? myGroup.avgScores.teamwork : '—'}</strong>/20
    </p>
  `;

  const filesContainer = document.getElementById('my-group-files-list');
  const files = myGroup.files || [];
  if (files.length === 0) {
    filesContainer.innerHTML = `
      <div class="file-item-card">
        <div class="file-item-meta">
          <span class="file-item-name" style="color:var(--text-muted);">目前尚未上傳簡報檔案</span>
          <span class="file-item-sub">請使用上方上傳區選擇 PDF 或 PPTX 簡報上傳，系統將自動同步至 Google Drive。</span>
        </div>
      </div>
    `;
  } else {
    filesContainer.innerHTML = files
      .map(
        f => `
        <div class="file-item-card">
          <div class="file-item-meta">
            <span class="file-item-name">📄 ${escapeHtml(f.name)}</span>
            <span class="file-item-sub">
              上傳者：${escapeHtml(f.uploadedBy || '組員')} · 
              ${f.driveUrl ? '已同步至 Google Drive 雲端資料夾' : '已儲存於系統'}
            </span>
          </div>
          <div style="display:flex; gap:8px;">
            <a href="${escapeAttr(f.url)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">開啟 / 下載 ↗</a>
          </div>
        </div>
      `
      )
      .join('');
  }
}

// ==================== 6. ADMIN BACKEND & ACCOUNT MANAGEMENT ====================
function renderAdminBackend() {
  if (!isUserAdmin()) return;

  const totalFiles = state.groups.reduce((acc, g) => acc + (g.files ? g.files.length : 0), 0);
  const kpiStrip = document.getElementById('admin-kpi-strip');
  kpiStrip.innerHTML = `
    <div class="admin-kpi-card">
      <div class="admin-kpi-label">系統總帳號數</div>
      <div class="admin-kpi-val">${state.accounts.length} <small style="font-size:13px;font-weight:500;">位學生</small></div>
    </div>
    <div class="admin-kpi-card">
      <div class="admin-kpi-label">系統管理員數</div>
      <div class="admin-kpi-val" style="color:#b45309;">${state.accounts.filter(a => a.isAdmin).length} <small style="font-size:13px;font-weight:500;">位管理員</small></div>
    </div>
    <div class="admin-kpi-card">
      <div class="admin-kpi-label">已收到評分組數 / 總組數</div>
      <div class="admin-kpi-val">${state.classStats.scoredGroupsCount || 0} / ${state.groups.length} <small style="font-size:13px;font-weight:500;">組</small></div>
    </div>
    <div class="admin-kpi-card">
      <div class="admin-kpi-label">已上傳簡報與連結數</div>
      <div class="admin-kpi-val" style="color:var(--accent);">${totalFiles} <small style="font-size:13px;font-weight:500;">份檔案</small></div>
    </div>
  `;

  const q = state.adminAccountSearch.trim().toLowerCase();
  const filteredAccounts = state.accounts.filter(a => {
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.groupName || '').toLowerCase().includes(q)
    );
  });

  const accTbody = document.getElementById('admin-accounts-tbody');
  accTbody.innerHTML = filteredAccounts
    .map(acc => {
      const isPrimaryAdmin = acc.email.toLowerCase() === 's25101114@stu.edu.tw' || acc.id === '25101114';
      return `
        <tr>
          <td>
            <span class="group-order-pill">${acc.groupOrder ? `第 ${acc.groupOrder} 組` : '未分組'}</span>
          </td>
          <td>
            <strong>${escapeHtml(acc.name)}</strong>
          </td>
          <td style="font-family:var(--font-mono); font-weight:700;">
            ${escapeHtml(acc.id)}
          </td>
          <td>
            <span class="pwd-code-badge">${escapeHtml(acc.password || '')}</span>
          </td>
          <td style="font-family:var(--font-mono); font-size:12px; color:var(--text-secondary);">
            ${escapeHtml(acc.email)}
          </td>
          <td>
            ${
              acc.isAdmin
                ? '<span class="admin-badge-pill">系統管理員 (Admin)</span>'
                : '<span class="role-pill-student">一般學生 (Student)</span>'
            }
          </td>
          <td>
            ${
              acc.active !== false
                ? '<span class="status-pill-active">啟用中</span>'
                : '<span class="status-pill-disabled">已停用</span>'
            }
          </td>
          <td>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button type="button" class="btn btn-outline btn-sm" onclick="populateAdminEditAccount('${escapeAttr(acc.email)}')">
                編輯 / 重設密碼
              </button>
              ${
                !isPrimaryAdmin
                  ? `<button type="button" class="btn btn-outline btn-sm" onclick="toggleAccountAdminRole('${escapeAttr(acc.email)}')">
                      ${acc.isAdmin ? '設為一般學生' : '設為管理員'}
                    </button>
                    <button type="button" class="btn-danger-sm" onclick="deleteAdminAccount('${escapeAttr(acc.email)}')">
                      刪除
                    </button>`
                  : `<span style="font-size:11.5px; color:var(--text-muted); padding:4px 6px;">預設主管理員</span>`
              }
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  const grpTbody = document.getElementById('admin-groups-tbody');
  grpTbody.innerHTML = state.groups
    .map(g => {
      const membersStr = g.members.map(m => `${m.name}(${m.id})`).join('、');
      const filesListHtml = (g.files || [])
        .map(
          f => `
          <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:4px;">
            <a href="${escapeAttr(f.url)}" target="_blank" rel="noopener" class="file-pill">
              📄 ${escapeHtml(truncate(f.name, 22))} ↗
            </a>
            <button type="button" class="btn-danger-sm" style="padding:1px 6px; font-size:11px;" onclick="adminDeleteGroupFile(${g.order}, '${escapeAttr(f.id)}')">
              移除
            </button>
          </div>
        `
        )
        .join('');

      return `
        <tr>
          <td class="col-order"><span class="order-badge">${g.order}</span></td>
          <td style="font-size:12.5px;">${escapeHtml(membersStr || '無組員')}</td>
          <td>
            <input type="text" class="admin-inline-input" id="admin-grp-title-${g.order}" value="${escapeAttr(g.title || '')}" />
          </td>
          <td>
            <input type="text" class="admin-inline-input" id="admin-grp-source-${g.order}" value="${escapeAttr(g.sourceUrl || '')}" placeholder="https://..." />
          </td>
          <td>
            ${filesListHtml || '<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">尚未上傳簡報</div>'}
            <button type="button" class="btn btn-outline btn-sm" onclick="triggerAdminProxyUpload(${g.order})">
              + 代傳簡報檔案
            </button>
          </td>
          <td>
            <button type="button" class="btn btn-primary btn-sm" onclick="adminSaveGroupInfo(${g.order})">
              儲存並同步
            </button>
          </td>
        </tr>
      `;
    })
    .join('');

  const filterOrder = state.adminRatingGroupFilter ? Number(state.adminRatingGroupFilter) : null;
  const filteredRatings = state.ratings.filter(r => (!filterOrder ? true : r.groupOrder === filterOrder));

  const ratingsTbody = document.getElementById('admin-ratings-tbody');
  if (filteredRatings.length === 0) {
    ratingsTbody.innerHTML = `
      <tr>
        <td colspan="11" style="text-align:center; padding:24px; color:var(--text-muted);">
          沒有符合篩選條件的評分紀錄
        </td>
      </tr>
    `;
  } else {
    ratingsTbody.innerHTML = filteredRatings
      .map(r => {
        const s = r.scores || {};
        const tot =
          Number(s.content || 0) +
          Number(s.visuals || 0) +
          Number(s.delivery || 0) +
          Number(s.qna || 0) +
          Number(s.teamwork || 0);
        return `
          <tr>
            <td><span class="group-order-pill">第 ${r.groupOrder} 組</span></td>
            <td>
              <strong>${escapeHtml(r.reviewerName)}</strong>
              <div class="member-ids">${escapeHtml(r.reviewerEmail)}</div>
            </td>
            <td style="font-size:12px; color:var(--text-muted);">${escapeHtml(r.timestamp)}</td>
            <td class="col-score">${s.content}</td>
            <td class="col-score">${s.visuals}</td>
            <td class="col-score">${s.delivery}</td>
            <td class="col-score">${s.qna}</td>
            <td class="col-score">${s.teamwork}</td>
            <td class="col-total"><span class="total-pill">${tot}</span></td>
            <td style="max-width:200px; font-size:12.5px;">${escapeHtml(r.comment || '—')}</td>
            <td>
              <button type="button" class="btn-danger-sm" onclick="adminDeleteRating('${escapeAttr(r.id)}')">
                刪除此筆
              </button>
            </td>
          </tr>
        `;
      })
      .join('');
  }
}

window.populateAdminEditAccount = function (email) {
  const acc = state.accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (!acc) return;

  document.getElementById('admin-account-form-title').textContent = `編輯帳號：${acc.name} (${acc.id})`;
  document.getElementById('admin-acc-original-email').value = acc.email;
  document.getElementById('admin-acc-id').value = acc.id;
  document.getElementById('admin-acc-password').value = acc.password || '';
  document.getElementById('admin-acc-name').value = acc.name;
  document.getElementById('admin-acc-email').value = acc.email;
  document.getElementById('admin-acc-group').value = acc.groupOrder ? String(acc.groupOrder) : '';
  document.getElementById('admin-acc-role').value = acc.isAdmin ? 'admin' : 'student';
  document.getElementById('admin-acc-active').value = acc.active !== false ? 'true' : 'false';

  document.getElementById('btn-admin-save-acc').textContent = '更新帳號與密碼設定';
  document.getElementById('btn-admin-cancel-edit').classList.remove('hidden');
};

function resetAdminAccountForm() {
  document.getElementById('admin-account-form-title').textContent = '新增學生 / 管理員帳號';
  document.getElementById('admin-acc-original-email').value = '';
  document.getElementById('admin-acc-id').value = '';
  document.getElementById('admin-acc-password').value = '';
  document.getElementById('admin-acc-name').value = '';
  document.getElementById('admin-acc-email').value = '';
  document.getElementById('admin-acc-group').value = '';
  document.getElementById('admin-acc-role').value = 'student';
  document.getElementById('admin-acc-active').value = 'true';
  document.getElementById('btn-admin-save-acc').textContent = '儲存帳號與密碼設定';
  document.getElementById('btn-admin-cancel-edit').classList.add('hidden');
}

function upsertStaticAccount(originalEmail, payload) {
  const cleanId = String(payload.id).trim();
  const cleanName = String(payload.name).trim();
  const cleanEmail = String(payload.email || `s${cleanId}@stu.edu.tw`).trim().toLowerCase();
  const cleanPassword = payload.password && String(payload.password).trim() ? String(payload.password).trim() : generateRandomPasswordClient(8);
  const targetRole = payload.role === 'admin' ? 'admin' : 'student';
  const targetGroupOrder = payload.groupOrder ? Number(payload.groupOrder) : null;
  const targetActive = payload.active !== false;

  if (originalEmail) {
    const orig = originalEmail.toLowerCase();
    state.groups.forEach(g => {
      g.members = g.members.filter(m => m.email.toLowerCase() !== orig);
    });
    state.extraStudents = (state.extraStudents || []).filter(m => m.email.toLowerCase() !== orig);
    state.admins = (state.admins || []).filter(a => a.toLowerCase() !== orig && a.toLowerCase() !== cleanEmail);
  }

  if (targetRole === 'admin' && !state.admins.some(a => a.toLowerCase() === cleanEmail)) {
    state.admins.push(cleanEmail);
  }

  const memberObj = {
    id: cleanId,
    name: cleanName,
    email: cleanEmail,
    password: cleanPassword,
    role: targetRole,
    active: targetActive
  };

  if (targetGroupOrder) {
    const grp = state.groups.find(g => g.order === targetGroupOrder);
    if (grp) grp.members.push(memberObj);
  } else {
    state.extraStudents = state.extraStudents || [];
    state.extraStudents.push({ ...memberObj, groupOrder: null });
  }

  saveStaticDb();
}

window.toggleAccountAdminRole = async function (email) {
  if (!isUserAdmin()) return;
  const acc = state.accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (!acc) return;

  const newRole = acc.isAdmin ? 'student' : 'admin';

  if (state.isStaticMode) {
    upsertStaticAccount(acc.email, {
      id: acc.id,
      name: acc.name,
      email: acc.email,
      password: acc.password,
      groupOrder: acc.groupOrder,
      role: newRole,
      active: acc.active
    });
    renderAll();
    showToast(`已將「${acc.name}」的角色更新為 ${newRole === 'admin' ? '系統管理員' : '一般學生'}！`, 'success');
    return;
  }

  try {
    const res = await fetch(`/api/admin/accounts/${encodeURIComponent(acc.email)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-email': state.user.email
      },
      body: JSON.stringify({
        id: acc.id,
        name: acc.name,
        email: acc.email,
        password: acc.password,
        groupOrder: acc.groupOrder,
        role: newRole,
        active: acc.active
      })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || '權限變更失敗', 'error');
      return;
    }
    await fetchPortalData();
    showToast(`已將「${acc.name}」的角色更新為 ${newRole === 'admin' ? '系統管理員' : '一般學生'}！`, 'success');
  } catch (err) {
    showToast('操作失敗：' + err.message, 'error');
  }
};

window.deleteAdminAccount = async function (email) {
  if (!isUserAdmin()) return;
  const acc = state.accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (!acc) return;
  if (!confirm(`確定要刪除帳號「${acc.name} (${acc.id})」嗎？此操作也會同步更新分組名單。`)) return;

  if (state.isStaticMode) {
    const target = acc.email.toLowerCase();
    state.groups.forEach(g => {
      g.members = g.members.filter(m => m.email.toLowerCase() !== target);
    });
    state.extraStudents = (state.extraStudents || []).filter(m => m.email.toLowerCase() !== target);
    state.admins = (state.admins || []).filter(a => a.toLowerCase() !== target);
    saveStaticDb();
    renderAll();
    showToast(`已刪除帳號 ${acc.name} (${acc.id})`, 'success');
    return;
  }

  try {
    const res = await fetch(`/api/admin/accounts/${encodeURIComponent(acc.email)}`, {
      method: 'DELETE',
      headers: { 'x-admin-email': state.user.email }
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || '刪除失敗', 'error');
      return;
    }
    await fetchPortalData();
    showToast(`已刪除帳號 ${acc.name} (${acc.id})`, 'success');
  } catch (err) {
    showToast('刪除失敗：' + err.message, 'error');
  }
};

window.adminSaveGroupInfo = async function (groupOrder) {
  if (!isUserAdmin()) return;
  const title = document.getElementById(`admin-grp-title-${groupOrder}`).value;
  const sourceUrl = document.getElementById(`admin-grp-source-${groupOrder}`).value;

  if (state.isStaticMode) {
    const grp = state.groups.find(g => g.order === Number(groupOrder));
    if (grp) {
      grp.title = title.trim();
      grp.sourceUrl = sourceUrl.trim();
      saveStaticDb();
      await callGasWebApp({ action: 'updateInfo', groupOrder, title: grp.title, sourceUrl: grp.sourceUrl });
      renderAll();
      showToast(`已更新第 ${groupOrder} 組報告資訊！`, 'success');
    }
    return;
  }

  try {
    const res = await fetch(`/api/groups/${groupOrder}/info`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, sourceUrl })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || '儲存失敗', 'error');
      return;
    }
    await fetchPortalData();
    showToast(`已更新第 ${groupOrder} 組報告資訊並同步至 Google 試算表！`, 'success');
  } catch (err) {
    showToast('儲存失敗：' + err.message, 'error');
  }
};

window.triggerAdminProxyUpload = function (groupOrder) {
  state.adminProxyUploadGroupOrder = groupOrder;
  const input = document.getElementById('admin-proxy-file-input');
  input.value = '';
  input.click();
};

window.adminDeleteGroupFile = async function (groupOrder, fileId) {
  if (!isUserAdmin()) return;
  if (!confirm(`確定要移除第 ${groupOrder} 組的這份簡報檔案紀錄嗎？`)) return;

  if (state.isStaticMode) {
    const grp = state.groups.find(g => g.order === Number(groupOrder));
    if (grp) {
      grp.files = (grp.files || []).filter(f => f.id !== fileId);
      saveStaticDb();
      renderAll();
      showToast(`已移除第 ${groupOrder} 組的檔案紀錄`, 'success');
    }
    return;
  }

  try {
    const res = await fetch(`/api/admin/groups/${groupOrder}/files/${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
      headers: { 'x-admin-email': state.user.email }
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || '移除失敗', 'error');
      return;
    }
    await fetchPortalData();
    showToast(`已移除第 ${groupOrder} 組的檔案紀錄`, 'success');
  } catch (err) {
    showToast('移除失敗：' + err.message, 'error');
  }
};

window.adminDeleteRating = async function (ratingId) {
  if (!isUserAdmin()) return;
  if (!confirm('確定要刪除此筆評分紀錄嗎？刪除後將自動重算該組平均分數並同步至 Google 試算表總表。')) return;

  if (state.isStaticMode) {
    state.ratings = state.ratings.filter(r => r.id !== ratingId);
    saveStaticDb();
    renderAll();
    showToast('已刪除此筆評分紀錄並重新計算總分！', 'success');
    return;
  }

  try {
    const res = await fetch(`/api/admin/ratings/${encodeURIComponent(ratingId)}`, {
      method: 'DELETE',
      headers: { 'x-admin-email': state.user.email }
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || '刪除失敗', 'error');
      return;
    }
    await fetchPortalData();
    showToast('已刪除此筆評分紀錄並重新同步總表！', 'success');
  } catch (err) {
    showToast('刪除失敗：' + err.message, 'error');
  }
};

// 7. Cloud Resources Directory
function renderCloudResources() {
  const container = document.getElementById('cloud-resources-list');
  const masterItems = [
    {
      type: 'Google Sheets 總表',
      title: '科技文選分組報告評分表（12組總表・各項20分 & 表單試算表總連結）',
      url: 'https://docs.google.com/spreadsheets/d/1iBFfy31wZxUXPb0ojm3D4UCrWNSisRS4UCS4_mlzWWE/edit'
    },
    {
      type: 'Google Sheets 分組名單',
      title: '科技文選分組 (回覆) — 學生學號與上台順序名單',
      url: 'https://docs.google.com/spreadsheets/d/1riwmmeEARbTstBruzx5aaF6hWVgNOLRo-wgKhi3MG4I/edit'
    },
    {
      type: 'Google Drive 資料夾',
      title: '科技文選報告 ( 評分表 & QR Code & 簡報上傳區 )',
      url: 'https://drive.google.com/drive/folders/19oLtHpGGpNsq_0qR5EDou4x4rB0ANxCH'
    }
  ];

  const masterHtml = masterItems
    .map(
      item => `
      <div class="cloud-card">
        <div>
          <span class="cloud-card-type">${escapeHtml(item.type)}</span>
          <div class="cloud-card-title" style="margin-top:4px;">${escapeHtml(item.title)}</div>
        </div>
        <div>
          <a href="${escapeAttr(item.url)}" target="_blank" rel="noopener" class="ext-link" style="display:inline-block;">
            開啟 Google 雲端檔案 ↗
          </a>
        </div>
      </div>
    `
    )
    .join('');

  const groupCardsHtml = state.groups
    .map(g => {
      const membersStr = g.members.map(m => `${m.name}(${m.id})`).join('、');
      const formUrl = g.formUrl || '#';
      const sheetUrl = g.sheetUrl || (g.sheetId ? `https://docs.google.com/spreadsheets/d/${g.sheetId}/edit` : '#');
      const qrDriveUrl = g.qrDriveUrl || '#';
      const qrLocalUrl = `./qrcodes/group-${g.order}.png`;

      return `
        <div class="cloud-card" style="background: var(--bg-surface);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
            <div style="flex:1;">
              <span class="cloud-card-type">第 ${g.order} 組（${escapeHtml(g.name)}）</span>
              <div class="cloud-card-title" style="margin-top:4px;">${escapeHtml(g.title || '未定')}</div>
              <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">
                組員：${escapeHtml(membersStr)}
              </div>
            </div>
            <a href="${escapeAttr(qrLocalUrl)}" target="_blank" rel="noopener" title="點擊放大第 ${g.order} 組 QR Code">
              <img
                src="${escapeAttr(qrLocalUrl)}"
                alt="第 ${g.order} 組 QR Code"
                style="width:74px; height:74px; object-fit:contain; border:1px solid var(--border-color); border-radius:6px; background:#fff; padding:2px;"
              />
            </a>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
            <a href="${escapeAttr(formUrl)}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
              📝 評分表單 (Form) ↗
            </a>
            <a href="${escapeAttr(sheetUrl)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
              📊 回覆試算表 (Sheet) ↗
            </a>
            <a href="${escapeAttr(qrDriveUrl)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
              🔳 雲端 QR Code ↗
            </a>
          </div>
        </div>
      `;
    })
    .join('');

  container.innerHTML = masterHtml + groupCardsHtml;
}

// 8. Authenticate with Student ID + Password
async function performLogin(studentId, password) {
  const errEl = document.getElementById('gate-login-error');
  if (errEl) errEl.classList.add('hidden');
  const q = (studentId || '').trim().toLowerCase();
  const pwd = (password || '').trim();

  if (state.isStaticMode) {
    const matched = state.accounts.find(
      acc =>
        acc.id.toLowerCase() === q ||
        `s${acc.id.toLowerCase()}` === q ||
        acc.email.toLowerCase() === q
    );

    if (!matched) {
      if (errEl) {
        errEl.textContent = '找不到對應的學號，請確認輸入的學號是否正確（例如：25101114）。';
        errEl.classList.remove('hidden');
      }
      return;
    }

    if (!pwd || pwd !== String(matched.password)) {
      if (errEl) {
        errEl.textContent = '密碼錯誤，請確認您的 8 碼隨機密碼是否輸入正確（注意大小寫）。';
        errEl.classList.remove('hidden');
      }
      return;
    }

    if (matched.active === false) {
      if (errEl) {
        errEl.textContent = '此帳號目前已被管理員停用。';
        errEl.classList.remove('hidden');
      }
      return;
    }

    saveUser(matched);
    document.getElementById('gate-input-password').value = '';
    if (matched.isAdmin || matched.role === 'admin') {
      showToast(`歡迎管理員 ${matched.name} (${matched.id}) 登入！已解鎖「管理員後台與帳號管理」`, 'success');
    } else {
      showToast(`歡迎登入！${matched.name}（第 ${matched.groupOrder || '—'} 組）`, 'success');
    }
    return;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: q, password: pwd })
    });
    const data = await res.json();
    if (!res.ok) {
      if (errEl) {
        errEl.textContent = data.error || '登入失敗';
        errEl.classList.remove('hidden');
      }
      return;
    }

    saveUser(data.user);
    document.getElementById('gate-input-password').value = '';

    if (data.user.isAdmin || data.user.role === 'admin') {
      showToast(`歡迎管理員 ${data.user.name} (${data.user.id}) 登入！已解鎖「管理員後台與帳號管理」`, 'success');
    } else {
      showToast(`歡迎登入！${data.user.name}（第 ${data.user.groupOrder || '—'} 組）`, 'success');
    }
  } catch (err) {
    if (errEl) {
      errEl.textContent = '網路連線異常：' + err.message;
      errEl.classList.remove('hidden');
    }
  }
}

// Convert 20-point score to 1~5 Google Form level
function score20ToLevel5(score20) {
  const n = Number(score20 || 16);
  if (n <= 5) return Math.max(1, Math.min(5, Math.round(n)));
  return Math.max(1, Math.min(5, Math.round(n / 4)));
}

// 9. Open Rate & Detailed Breakdown Modal for a Group (Google Form 1~5 Linear Scale Style, each 20% = 20 pts)
window.openRateModal = function (groupOrder) {
  if (!state.user) return;
  const group = state.groups.find(g => g.order === Number(groupOrder));
  if (!group) return;

  state.activeRateGroupOrder = group.order;
  document.getElementById('rate-group-order-input').value = group.order;
  document.getElementById('rate-modal-order').textContent = `第 ${group.order} 組`;
  document.getElementById('rate-modal-members').textContent = `組員：${group.members.map(m => `${m.name} (${m.id})`).join('、')}`;
  document.getElementById('rate-modal-title').textContent = group.title || '未定';

  const existingRating = findMyExistingRating(group);
  document.getElementById('rate-identity-tag').textContent = `評分者：${state.user.name} (${state.user.id})`;

  const initialScores = existingRating
    ? existingRating.scores
    : { content: 16, visuals: 16, delivery: 16, qna: 16, teamwork: 16 };

  const statusBannerHtml = existingRating
    ? `<div class="gform-status-banner has-existing">
        <span>✓ 試算表中已有您對此組的評分紀錄（時間：${escapeHtml(existingRating.timestamp)}）</span>
        <span>可直接修改並同步覆寫</span>
      </div>`
    : `<div class="gform-status-banner new-rating">
        <span>📝 尚未對第 ${group.order} 組評分（請點選 1～5 等第，每格 4 分，滿分 20 分）</span>
      </div>`;

  const slidersContainer = document.getElementById('rate-sliders-container');
  slidersContainer.innerHTML =
    statusBannerHtml +
    state.criteria
      .map(c => {
        const val20 = initialScores[c.key] !== undefined ? Number(initialScores[c.key]) : 16;
        const level5 = score20ToLevel5(val20);

        const scaleBtns = [1, 2, 3, 4, 5]
          .map(
            lvl => `
            <button
              type="button"
              class="gform-scale-btn ${lvl === level5 ? 'selected' : ''}"
              id="scale-btn-${c.key}-${lvl}"
              onclick="selectFormScale('${c.key}', ${lvl})"
              title="${lvl} 級分（換算 ${lvl * 4} / 20 分）"
            >
              ${lvl}
            </button>
          `
          )
          .join('');

        return `
          <div class="gform-question-card">
            <div class="gform-q-header">
              <div>
                <span class="gform-q-title">${escapeHtml(c.name)} (${c.weight}) <span class="req">*</span></span>
                <span class="gform-q-en">${escapeHtml(c.en)}</span>
              </div>
              <div class="gform-q-score-readout" id="readout-${c.key}">
                ${level5} 級分（${level5 * 4} / 20 分）
              </div>
            </div>
            <input type="hidden" id="num-score-${c.key}" value="${level5 * 4}" data-level="${level5}" />
            <div class="gform-scale-row">
              <span class="gform-scale-end">待加強 (1)</span>
              <div class="gform-scale-options">
                ${scaleBtns}
              </div>
              <span class="gform-scale-end">極佳 (5)</span>
            </div>
          </div>
        `;
      })
      .join('');

  document.getElementById('rate-comment-input').value = existingRating ? existingRating.comment || '' : '';

  updateLiveRateTotal();

  const isSelfGroup = state.user && state.user.groupOrder === group.order;
  const selfWarn = document.getElementById('rate-self-warning');
  const submitBtn = document.getElementById('btn-submit-rating');
  if (isSelfGroup) {
    selfWarn.classList.remove('hidden');
    submitBtn.disabled = true;
    submitBtn.textContent = '本組組員不可評分自己的組別';
  } else {
    selfWarn.classList.add('hidden');
    submitBtn.disabled = false;
    submitBtn.textContent = existingRating
      ? '🔄 更新我的評分並同步覆寫至 Google 試算表'
      : '✅ 送出評分並同步寫入 Google 試算表';
  }

  document.getElementById('rate-records-count').textContent = `${group.ratingCount} 筆評分`;
  const hasScore = group.ratingCount > 0;

  document.getElementById('rate-breakdown-bars').innerHTML = state.criteria
    .map(c => {
      const avg = hasScore ? group.avgScores[c.key] : 0;
      const pct = Math.min(100, Math.round((avg / 20) * 100));
      return `
        <div class="bar-row">
          <span>${escapeHtml(c.name)}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${pct}%;"></div>
          </div>
          <span class="bar-val">${hasScore ? avg.toFixed(1) : '—'}<small>/20</small></span>
        </div>
      `;
    })
    .join('');

  const recordsTbody = document.getElementById('rate-records-tbody');
  if (!group.ratings || group.ratings.length === 0) {
    recordsTbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; color:var(--text-muted); padding:18px;">
          目前尚無評分紀錄，歡迎成為第一位評分者！
        </td>
      </tr>
    `;
  } else {
    recordsTbody.innerHTML = group.ratings
      .map(r => {
        const s = r.scores;
        const tot = Number(s.content) + Number(s.visuals) + Number(s.delivery) + Number(s.qna) + Number(s.teamwork);
        const isMe =
          state.user &&
          ((r.reviewerEmail || '').toLowerCase() === (state.user.email || '').toLowerCase() ||
            (state.user.altEmail && (r.reviewerEmail || '').toLowerCase() === state.user.altEmail.toLowerCase()));
        return `
          <tr style="${isMe ? 'background:#f0fdfa;' : ''}">
            <td>
              <strong>${escapeHtml(r.reviewerName || r.reviewerEmail.split('@')[0])}</strong>
              ${isMe ? '<span class="my-group-pill" style="margin-left:4px;">您</span>' : ''}
              <div style="font-size:10.5px; color:var(--text-muted);">${escapeHtml(r.reviewerEmail)}</div>
            </td>
            <td>${s.content} <small style="color:var(--text-muted);">(${score20ToLevel5(s.content)})</small></td>
            <td>${s.visuals} <small style="color:var(--text-muted);">(${score20ToLevel5(s.visuals)})</small></td>
            <td>${s.delivery} <small style="color:var(--text-muted);">(${score20ToLevel5(s.delivery)})</small></td>
            <td>${s.qna} <small style="color:var(--text-muted);">(${score20ToLevel5(s.qna)})</small></td>
            <td>${s.teamwork} <small style="color:var(--text-muted);">(${score20ToLevel5(s.teamwork)})</small></td>
            <td><strong>${tot}</strong></td>
          </tr>
        `;
      })
      .join('');
  }

  const commentsFeed = document.getElementById('rate-comments-list');
  const comments = group.comments || [];
  commentsFeed.innerHTML = comments
    .map(
      c => `
      <div class="comment-bubble">
        <strong>${escapeHtml(c.reviewerName)}：</strong>
        <span>${escapeHtml(c.comment)}</span>
      </div>
    `
    )
    .join('');

  openModal('modal-rate');
};

window.selectFormScale = function (key, level5) {
  const numEl = document.getElementById(`num-score-${key}`);
  const readoutEl = document.getElementById(`readout-${key}`);
  if (numEl) {
    numEl.value = level5 * 4;
    numEl.setAttribute('data-level', level5);
  }
  if (readoutEl) {
    readoutEl.textContent = `${level5} 級分（${level5 * 4} / 20 分）`;
  }
  for (let lvl = 1; lvl <= 5; lvl++) {
    const btn = document.getElementById(`scale-btn-${key}-${lvl}`);
    if (btn) {
      if (lvl === level5) btn.classList.add('selected');
      else btn.classList.remove('selected');
    }
  }
  updateLiveRateTotal();
};

function updateLiveRateTotal() {
  let sum = 0;
  state.criteria.forEach(c => {
    const numEl = document.getElementById(`num-score-${c.key}`);
    if (numEl) {
      let val = Number(numEl.value) || 0;
      if (val < 0) val = 0;
      if (val > 20) val = 20;
      sum += val;
    }
  });
  document.getElementById('rate-live-total').textContent = sum;
}

// ==================== EVENT LISTENERS ====================
function bindEvents() {
  // Mandatory Gate Login Form
  const gateForm = document.getElementById('form-gate-login');
  if (gateForm) {
    gateForm.addEventListener('submit', async e => {
      e.preventDefault();
      const studentId = document.getElementById('gate-input-student-id').value;
      const password = document.getElementById('gate-input-password').value;
      await performLogin(studentId, password);
    });
  }

  // Logout Button
  const logoutBtn = document.getElementById('btn-logout-user');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      saveUser(null);
      showToast('您已安全登出系統', 'info');
    });
  }

  // Random password generator button in Admin Account Form
  const genPwdBtn = document.getElementById('btn-gen-random-pwd');
  if (genPwdBtn) {
    genPwdBtn.addEventListener('click', () => {
      document.getElementById('admin-acc-password').value = generateRandomPasswordClient(8);
    });
  }

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(btn.getAttribute('data-close-modal'));
    });
  });

  // Save Google OAuth Client ID & GAS Web App URL
  const oauthForm = document.getElementById('form-admin-oauth-config');
  if (oauthForm) {
    oauthForm.addEventListener('submit', e => {
      e.preventDefault();
      state.googleClientId = document.getElementById('input-google-client-id').value.trim();
      state.gasWebAppUrl = document.getElementById('input-gas-webapp-url').value.trim();
      localStorage.setItem('sci_google_client_id', state.googleClientId);
      localStorage.setItem('sci_gas_webapp_url', state.gasWebAppUrl);
      showToast('已儲存雲端 API 設定！', 'success');
    });
  }

  // Primary Workspace Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => {
        p.classList.remove('active');
        p.classList.add('hidden');
      });

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetPanel = document.getElementById(targetId);
      targetPanel.classList.remove('hidden');
      targetPanel.classList.add('active');

      const filterControls = document.getElementById('scores-filter-controls');
      if (targetId === 'tab-all-scores') {
        filterControls.classList.remove('hidden');
      } else {
        filterControls.classList.add('hidden');
      }
    });
  });

  // Admin Subtabs Navigation
  document.querySelectorAll('.admin-subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-subtab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
        sec.classList.add('hidden');
      });

      btn.classList.add('active');
      const secId = btn.getAttribute('data-admin-section');
      const secEl = document.getElementById(secId);
      secEl.classList.remove('hidden');
      secEl.classList.add('active');
    });
  });

  // Admin Account Create / Edit Form Submit
  document.getElementById('form-admin-account').addEventListener('submit', async e => {
    e.preventDefault();
    if (!isUserAdmin()) return;

    const originalEmail = document.getElementById('admin-acc-original-email').value.trim();
    const cleanId = document.getElementById('admin-acc-id').value.trim();
    const payload = {
      id: cleanId,
      password: document.getElementById('admin-acc-password').value.trim(),
      name: document.getElementById('admin-acc-name').value.trim(),
      email: document.getElementById('admin-acc-email').value.trim() || `s${cleanId}@stu.edu.tw`,
      groupOrder: document.getElementById('admin-acc-group').value,
      role: document.getElementById('admin-acc-role').value,
      active: document.getElementById('admin-acc-active').value === 'true'
    };

    const isEdit = Boolean(originalEmail);

    if (state.isStaticMode) {
      upsertStaticAccount(originalEmail, payload);
      resetAdminAccountForm();
      renderAll();
      showToast(isEdit ? '已更新帳號與密碼設定！' : '已成功新增帳號與隨機密碼！', 'success');
      return;
    }

    const url = isEdit
      ? `/api/admin/accounts/${encodeURIComponent(originalEmail)}`
      : '/api/admin/accounts';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': state.user.email
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || '儲存帳號失敗', 'error');
        return;
      }

      resetAdminAccountForm();
      await fetchPortalData();
      showToast(isEdit ? '已更新帳號與密碼設定！' : `已成功新增帳號（密碼：${data.account.password}）！`, 'success');
    } catch (err) {
      showToast('儲存帳號發生錯誤：' + err.message, 'error');
    }
  });

  document.getElementById('btn-admin-cancel-edit').addEventListener('click', () => {
    resetAdminAccountForm();
  });

  document.getElementById('admin-search-accounts').addEventListener('input', e => {
    state.adminAccountSearch = e.target.value;
    renderAdminBackend();
  });

  document.getElementById('admin-filter-rating-group').addEventListener('change', e => {
    state.adminRatingGroupFilter = e.target.value;
    renderAdminBackend();
  });

  // Admin Proxy File Upload Handler
  const proxyInput = document.getElementById('admin-proxy-file-input');
  proxyInput.addEventListener('change', async () => {
    if (!proxyInput.files || !proxyInput.files[0] || !state.adminProxyUploadGroupOrder) return;
    const groupOrder = state.adminProxyUploadGroupOrder;
    const file = proxyInput.files[0];

    if (state.isStaticMode) {
      const grp = state.groups.find(g => g.order === Number(groupOrder));
      if (grp) {
        const blobUrl = URL.createObjectURL(file);
        grp.files = grp.files || [];
        grp.files.unshift({
          id: `file_${Date.now()}`,
          name: file.name,
          url: blobUrl,
          uploadedBy: `管理員代傳 (${state.user.name})`,
          uploadedAt: new Date().toISOString()
        });
        saveStaticDb();
        renderAll();
        showToast(`已為第 ${groupOrder} 組新增簡報「${file.name}」！`, 'success');
      }
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', `管理員代傳 (${state.user.name})`);

    showToast(`正在為第 ${groupOrder} 組上傳簡報至 Google Drive...`, 'info');
    try {
      const res = await fetch(`/api/groups/${groupOrder}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || '代傳失敗', 'error');
        return;
      }
      await fetchPortalData();
      showToast(`已成功為第 ${groupOrder} 組上傳簡報「${data.file.name}」！`, 'success');
    } catch (err) {
      showToast('代傳錯誤：' + err.message, 'error');
    }
  });

  // Search Input
  document.getElementById('search-groups').addEventListener('input', e => {
    state.searchQuery = e.target.value;
    renderMasterTable();
    renderGroupCards();
  });

  // Table vs Cards View Toggle
  const btnTable = document.getElementById('btn-view-table');
  const btnCards = document.getElementById('btn-view-cards');
  btnTable.addEventListener('click', () => {
    btnTable.classList.add('active');
    btnCards.classList.remove('active');
    document.getElementById('master-table-container').classList.remove('hidden');
    document.getElementById('groups-cards-container').classList.add('hidden');
  });
  btnCards.addEventListener('click', () => {
    btnCards.classList.add('active');
    btnTable.classList.remove('active');
    document.getElementById('groups-cards-container').classList.remove('hidden');
    document.getElementById('master-table-container').classList.add('hidden');
  });

  // Submit Rating Form
  document.getElementById('form-rate-group').addEventListener('submit', async e => {
    e.preventDefault();
    if (!state.user) return;

    const groupOrder = Number(document.getElementById('rate-group-order-input').value);
    const scores = {};
    state.criteria.forEach(c => {
      scores[c.key] = Number(document.getElementById(`num-score-${c.key}`).value);
    });
    const comment = document.getElementById('rate-comment-input').value;

    const submitBtn = document.getElementById('btn-submit-rating');
    submitBtn.disabled = true;
    submitBtn.textContent = '正在同步評分至 Google 試算表...';

    if (state.isStaticMode) {
      const nowStr = new Date().toLocaleString('zh-TW', { hour12: true });
      const existingIdx = state.ratings.findIndex(
        r => r.groupOrder === groupOrder && r.reviewerEmail.toLowerCase() === state.user.email.toLowerCase()
      );
      const record = {
        id: existingIdx >= 0 ? state.ratings[existingIdx].id : `r_${groupOrder}_${Date.now()}`,
        groupOrder,
        reviewerEmail: state.user.email,
        reviewerName: state.user.name,
        timestamp: nowStr,
        scores,
        comment: (comment || '').trim()
      };
      if (existingIdx >= 0) {
        state.ratings[existingIdx] = record;
      } else {
        state.ratings.push(record);
      }
      saveStaticDb();
      const updatedGrp = state.groups.find(g => g.order === groupOrder);
      await callGasWebApp({
        action: 'rate',
        groupOrder,
        rating: record,
        avgScores: updatedGrp ? updatedGrp.avgScores : null
      });
      renderAll();
      openRateModal(groupOrder);
      submitBtn.disabled = false;
      showToast(`已成功送出對「第 ${groupOrder} 組」的評分！`, 'success');
      return;
    }

    try {
      const res = await fetch(`/api/groups/${groupOrder}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerEmail: state.user.email,
          reviewerName: state.user.name,
          scores,
          comment
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || '評分送出失敗', 'error');
        return;
      }

      await fetchPortalData();
      openRateModal(groupOrder);
      showToast(
        `已成功送出對「第 ${groupOrder} 組」的評分${data.syncedToGoogle ? '，並同步更新 Google 試算表總表！' : '！'}`,
        'success'
      );
    } catch (err) {
      showToast('評分送出異常：' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Update Own Group Report Info
  document.getElementById('form-update-report-info').addEventListener('submit', async e => {
    e.preventDefault();
    if (!state.user || !state.user.groupOrder) return;

    const btn = document.getElementById('btn-save-group-info');
    btn.disabled = true;
    btn.textContent = '儲存並同步至 Google 試算表中...';

    const title = document.getElementById('input-report-title').value;
    const sourceUrl = document.getElementById('input-report-source').value;

    if (state.isStaticMode) {
      const grp = state.groups.find(g => g.order === state.user.groupOrder);
      if (grp) {
        grp.title = title.trim();
        grp.sourceUrl = sourceUrl.trim();
        saveStaticDb();
        await callGasWebApp({
          action: 'updateInfo',
          groupOrder: grp.order,
          title: grp.title,
          sourceUrl: grp.sourceUrl
        });
        renderAll();
        showToast('已更新本組報告資訊！', 'success');
      }
      btn.disabled = false;
      btn.textContent = '儲存並同步更新至 Google 試算表';
      return;
    }

    try {
      const res = await fetch(`/api/groups/${state.user.groupOrder}/info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          sourceUrl,
          userEmail: state.user.email
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || '更新失敗', 'error');
        return;
      }

      await fetchPortalData();
      showToast('已更新本組報告資訊並同步回寫至 Google 試算表！', 'success');
    } catch (err) {
      showToast('儲存失敗：' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '儲存並同步更新至 Google 試算表';
    }
  });

  // File Selection & Upload Form
  const fileInput = document.getElementById('input-report-file');
  const fileLabel = document.getElementById('selected-file-label');
  const uploadBtn = document.getElementById('btn-submit-upload');

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      const f = fileInput.files[0];
      fileLabel.textContent = `已選擇檔案：${f.name} (${(f.size / 1024).toFixed(1)} KB)`;
      uploadBtn.disabled = false;
    } else {
      fileLabel.textContent = '支援 .pdf, .pptx, .docx（自動命名為「第X組_檔名」上傳至雲端）';
      uploadBtn.disabled = true;
    }
  });

  document.getElementById('form-upload-file').addEventListener('submit', async e => {
    e.preventDefault();
    if (!state.user || !state.user.groupOrder) return;
    if (!fileInput.files || !fileInput.files[0]) return;

    const file = fileInput.files[0];

    if (state.isStaticMode) {
      const grp = state.groups.find(g => g.order === state.user.groupOrder);
      if (grp) {
        const blobUrl = URL.createObjectURL(file);
        grp.files = grp.files || [];
        grp.files.unshift({
          id: `file_${Date.now()}`,
          name: file.name,
          url: blobUrl,
          uploadedBy: `${state.user.name} (${state.user.id})`,
          uploadedAt: new Date().toISOString()
        });
        saveStaticDb();
        fileInput.value = '';
        fileLabel.textContent = '支援 .pdf, .pptx, .docx（自動命名為「第X組_檔名」上傳至雲端）';
        uploadBtn.disabled = true;
        renderAll();
        showToast(`簡報「${file.name}」已新增至本組報告清單！`, 'success');
      }
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', `${state.user.name} (${state.user.id})`);

    uploadBtn.disabled = true;
    uploadBtn.textContent = '正在上傳檔案至網站與 Google Drive 雲端資料夾...';

    try {
      const res = await fetch(`/api/groups/${state.user.groupOrder}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || '上傳失敗', 'error');
        return;
      }

      fileInput.value = '';
      fileLabel.textContent = '支援 .pdf, .pptx, .docx（自動命名為「第X組_檔名」上傳至雲端）';
      await fetchPortalData();
      showToast(
        `簡報「${data.file.name}」上傳成功${data.file.driveUrl ? '，已同步備份至 Google Drive！' : '！'}`,
        'success'
      );
    } catch (err) {
      showToast('檔案上傳錯誤：' + err.message, 'error');
    } finally {
      uploadBtn.disabled = true;
      uploadBtn.textContent = '開始上傳報告檔案至網站與 Google Drive';
    }
  });

  // Manual Sync with Google Sheets Button
  document.getElementById('btn-sync-google').addEventListener('click', async () => {
    const btn = document.getElementById('btn-sync-google');
    btn.disabled = true;
    if (state.isStaticMode) {
      showToast('目前為 GitHub Pages 靜態模式，已自動載入最新雲端資料與本地變更！', 'success');
      btn.disabled = false;
      return;
    }
    try {
      const res = await fetch('/api/sync-google', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
      } else {
        showToast(data.error || '同步失敗', 'error');
      }
    } catch (err) {
      showToast('同步發生錯誤：' + err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

// ==================== HELPERS ====================
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : ''}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 4200);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}

function truncate(str, maxLen) {
  const s = String(str ?? '');
  return s.length > maxLen ? s.slice(0, maxLen) + '…' : s;
}
