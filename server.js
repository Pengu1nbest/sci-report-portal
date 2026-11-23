const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const util = require('util');
const ExcelJS = require('exceljs');

const execFileAsync = util.promisify(execFile);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data', 'db.json');

// Default Admin Accounts
const DEFAULT_ADMIN_EMAILS = ['s25101114@stu.edu.tw'];

// Google Resource IDs (All 12 Groups Forms, Response Sheets, and QR Codes in 19oLtHpGGpNsq_0qR5EDou4x4rB0ANxCH)
const GROUP_CLOUD_MAP = {
  1: {
    formId: '1k1G1nApnFEgCr0QEH7OtKkVTp_eKiJU0pXgh6CnUrmY',
    sheetId: '1JcnHBETp_3OKk2r9eDVUPxgXE4DjB70WtpjxYZKGcQI',
    qrDriveId: '1s2VnwkRl_yswwVG01KZgywqTY93mLYYO',
    emailLast: false
  },
  2: {
    formId: '1iDCH_7F5wEzKe13D5DbBdmAjEIBCUHS_N6hUPhm2PVI',
    sheetId: '1ll-ijGXgrRDiYWsyxayDiyUdqDW7IaadjrRTdQEZrI4',
    qrDriveId: '16zxFHwQrRZMCarBUgQ9u8QgwA43jMYm3',
    emailLast: false
  },
  3: {
    formId: '1iCAer4_A1R8JRmQ4lq-hRDhdcK3n8stIQtvbiPJ8pcU',
    sheetId: '1Un0WT3JcqD-Z7Xh5evQ70hUcEvso1tGOqOuwCPjRgSc',
    qrDriveId: '1C04YtVxhsUDHs1Izau_76hEVg5a-AO-F',
    emailLast: false
  },
  4: {
    formId: '1U2lAsOt_y2FCD7u3J0TnisiXtUAr9eSlwgm8u_GZ3P8',
    sheetId: '1crdychJQc_opZUAYIecKSX4oL3TA1Jo1XCfKoXpnXY4',
    qrDriveId: '1czLrAUGyY43TMdCraNHiDB4e7J_VfkWZ',
    emailLast: false
  },
  5: {
    formId: '1U5Q28TCVg2M-gsv1ri3C9wUuYTxkJBjzABv1AiY3SkI',
    sheetId: '1cMNadGQ10juZV6XHH7eLpUZyyN6dS2h41Hx2eR_eLOw',
    qrDriveId: '1yJFxq0JlWPTybIQYTqclF1KQwMKr9m3-',
    emailLast: false
  },
  6: {
    formId: '1rLj6u7oL1XHZel_IJhdhWjoIcSblLwy5Tr9AMnrfvwI',
    sheetId: '17iq5ikoGaxGZok1AvLVqapfrJ25UnOrTzjel27_A4dc',
    qrDriveId: '1xEQMSuXYdqB2_ya8g3bFSAvaLN_0TR-Q',
    emailLast: false
  },
  7: {
    formId: '1cU12RfHYHDmfs5GHxkDfQNGpyWmIdtLwSHRBCM9dAgo',
    sheetId: '1bImwMoWwA2aDM7XEKP852tirwU0439xT3A840wWmGZ8',
    qrDriveId: '13H0XLhS_oUS2N44hXRThAnXFt17XT0x-',
    emailLast: false
  },
  8: {
    formId: '12SvrV85dfBoywXFnXeoYVGR-Vdj8FSdpGhDOOds6JGI',
    sheetId: '1zOl3hwW0CdH46zPCuJhhyh7lyqZvf0I4sozhUYHid7E',
    qrDriveId: '1m1IWbq0Xz6SoZrCX2tjNYzUesnxkg623',
    emailLast: false
  },
  9: {
    formId: '1t7LSn_2vS4hVum6EJp8Goa40-MGSzrpb5x61P0Uc1Y4',
    sheetId: '1g13goJHeKAtKZDDX07NnP4GxlAkXfVQ-w0gGIZM18AQ',
    qrDriveId: '1lcVOVieYDFqjYf8N4Qem_IVMO3ZXjXg6',
    emailLast: false
  },
  10: {
    formId: '1xyTxaLaVK4cwVgqMEitM9pLPUGvNtvQG6_og7jTyzCQ',
    sheetId: '1zmopD7oFqZk5ZQj-wPXyvbMG8MW-v8ROIJD2D7nKgkI',
    qrDriveId: '1LAFKZimTNDruVMn0HNsTCcOi5Wg9rrSx',
    emailLast: false
  },
  11: {
    formId: '1NWGuJg57xdfXzKcc0gVhQ9epwCuwWnVbGsIHhbmOG9Y',
    sheetId: '1jdl29m-v08PACWHxrmZCRqycmKwGrFVTa6I4P8cDbRM',
    qrDriveId: '17u9mkVNZ1GhGo7jTBb8iF4o1gW1ig4AP',
    emailLast: false
  },
  12: {
    formId: '1yETAYtxGfCxRat3H59Pa070Ap5aGL2pQ9iuHb-xAjro',
    sheetId: '1701gKKXLTG_BEc0Vq4R-7B0Y1AN7Ukn4nPELWQuDBW4',
    qrDriveId: '18dSDKOP6JR3og6Mzyvuo0sCoEe-p43AB',
    emailLast: false
  }
};

const GOOGLE_RESOURCES = {
  groupListSheetId: '1riwmmeEARbTstBruzx5aaF6hWVgNOLRo-wgKhi3MG4I',
  summarySheetId: '1iBFfy31wZxUXPb0ojm3D4UCrWNSisRS4UCS4_mlzWWE',
  driveFolderId: '19oLtHpGGpNsq_0qR5EDou4x4rB0ANxCH',
  groupResponseSheets: Object.fromEntries(
    Object.entries(GROUP_CLOUD_MAP).map(([order, cfg]) => [order, { id: cfg.sheetId, emailLast: cfg.emailLast }])
  ),
  groupCloudMap: GROUP_CLOUD_MAP
};

// Initial real data from Google Sheets
const INITIAL_DB = {
  admins: ['s25101114@stu.edu.tw'],
  criteria: [
    { key: 'content', name: '內容掌握與深度', en: 'Content & Scientific Depth', maxScore: 20, weight: '20%' },
    { key: 'visuals', name: '簡報結構與視覺設計', en: 'Presentation Structure & Visuals', maxScore: 20, weight: '20%' },
    { key: 'delivery', name: '口語表達與台風', en: 'Oral Delivery & Presence', maxScore: 20, weight: '20%' },
    { key: 'qna', name: '時間掌控與問答表現', en: 'Time Management & Q&A', maxScore: 20, weight: '20%' },
    { key: 'teamwork', name: '團隊分工與整體表現', en: 'Teamwork & Overall', maxScore: 20, weight: '20%' }
  ],
  groups: [
    {
      order: 1,
      name: '第一組',
      members: [
        { id: '24101107', name: '蕭佳和', email: 's24101107@stu.edu.tw', role: 'student', active: true },
        { id: '24101114', name: '陳秉瑋', email: 's24101114@stu.edu.tw', role: 'student', active: true }
      ],
      title: '狗1歲不是人類7歲？研究：牠可能已經31歲了',
      sourceUrl: 'https://www.scitw.cc/posts/20260817-19803',
      files: [],
      updatedAt: '2026-09-14T11:57:16Z'
    },
    {
      order: 2,
      name: '第二組',
      members: [
        { id: '24101106', name: '黃坤烽', email: 's24101106@stu.edu.tw', role: 'student', active: true }
      ],
      title: '如何破解科學新聞的迷思？假資訊與真科學的社群交鋒！',
      sourceUrl: 'https://www.scitw.cc/posts/podcast-ep-226',
      files: [],
      updatedAt: '2026-09-23T08:40:46Z'
    },
    {
      order: 3,
      name: '第三組',
      members: [
        { id: '25101108', name: '李宜潔', email: 's25101108@stu.edu.tw', role: 'student', active: true },
        { id: '25101115', name: '王意晴', email: 's25101115@stu.edu.tw', altEmail: 'yiqingo211@gmail.com', role: 'student', active: true }
      ],
      title: '渡渡鳥：我不笨，只是沒學過怕人類',
      sourceUrl: 'https://www.scitw.cc/',
      files: [],
      updatedAt: '2026-09-23T23:27:09Z'
    },
    {
      order: 4,
      name: '第四組',
      members: [
        { id: '25101101', name: '姜毓庭', email: 's25101101@stu.edu.tw', role: 'student', active: true },
        { id: '25101113', name: '簡呈凱', email: 's25101113@stu.edu.tw', role: 'student', active: true }
      ],
      title: '打打電動，感覺更幸福',
      sourceUrl: 'https://www.scitw.cc/posts/20240820-17164',
      files: [],
      updatedAt: '2026-09-14T13:26:16Z'
    },
    {
      order: 5,
      name: '第五組',
      members: [
        { id: '25101114', name: '張亦傑', email: 's25101114@stu.edu.tw', role: 'admin', active: true },
        { id: '25101128', name: '唐湘婷', email: 's25101128@stu.edu.tw', role: 'student', active: true }
      ],
      title: '纖維不夠，腸道細菌可能開始吃你的腸黏膜',
      sourceUrl: 'https://www.scitw.cc/posts/20261116-20088',
      files: [],
      updatedAt: '2026-09-22T10:01:13Z'
    },
    {
      order: 6,
      name: '第六組',
      members: [
        { id: '25101106', name: '楊錢秉秝', email: 's25101106@stu.edu.tw', role: 'student', active: true }
      ],
      title: '跨越死亡之路：地下通道減少80%路殺',
      sourceUrl: 'https://www.scitw.cc/posts/20250906-18585',
      files: [],
      updatedAt: '2026-09-24T13:47:03Z'
    },
    {
      order: 7,
      name: '第七組',
      members: [
        { id: '25101109', name: '謝仁凱', email: 's25101109@stu.edu.tw', role: 'student', active: true },
        { id: '25101105', name: '蔡凱宇', email: 's25101105@stu.edu.tw', role: 'student', active: true }
      ],
      title: '出門上班一整天，該為家中貓咪開冷氣嗎？',
      sourceUrl: 'https://www.scitw.cc/posts/20240821-17179',
      files: [],
      updatedAt: '2026-09-22T10:36:58Z'
    },
    {
      order: 8,
      name: '第八組',
      members: [
        { id: '25101117', name: '武文成', email: 's25101117@stu.edu.tw', role: 'student', active: true },
        { id: '25101120', name: '阮黃如氏竹玲', email: 's25101120@stu.edu.tw', role: 'student', active: true }
      ],
      title: '臺灣海上犯罪網絡特徵與行為模式',
      sourceUrl: 'https://www.scitw.cc/posts/20240813-17139',
      files: [],
      updatedAt: '2026-09-17T10:57:14Z'
    },
    {
      order: 9,
      name: '第九組',
      members: [
        { id: '25101126', name: '阮文武', email: 's25101126@stu.edu.tw', role: 'student', active: true },
        { id: '25101127', name: '阮俊英', email: 's25101127@stu.edu.tw', role: 'student', active: true }
      ],
      title: '霸王龍體溫之謎簡報',
      sourceUrl: '',
      files: [],
      updatedAt: '2026-09-22T21:35:57Z'
    },
    {
      order: 10,
      name: '第十組',
      members: [
        { id: '25101118', name: '團氏秋紅', email: 's25101118@stu.edu.tw', role: 'student', active: true },
        { id: '25101119', name: '阮氏玄鶬', email: 's25101119@stu.edu.tw', role: 'student', active: true }
      ],
      title: '早餐太晚吃會影響壽命？',
      sourceUrl: 'https://www.scitw.cc/posts/20260824-19830',
      files: [],
      updatedAt: '2026-09-17T11:33:33Z'
    },
    {
      order: 11,
      name: '第十一組',
      members: [
        { id: '25101122', name: '阮氏夢兒', email: 's25101122@stu.edu.tw', role: 'student', active: true },
        { id: '25101123', name: '阮氏明書', email: 's25101123@stu.edu.tw', role: 'student', active: true }
      ],
      title: '沒抽菸也會中招！這種罕見基因讓肺癌風險狂飆60倍',
      sourceUrl: 'https://www.scitw.cc/posts/20260918-19914',
      files: [],
      updatedAt: '2026-09-22T13:50:18Z'
    },
    {
      order: 12,
      name: '第十二組',
      members: [
        { id: '25101125', name: '杜氏紅蓉', email: 's25101125@stu.edu.tw', role: 'student', active: true },
        { id: '25101124', name: '阮氏美影', email: 's25101124@stu.edu.tw', role: 'student', active: true }
      ],
      title: '野外實驗發現：鯊魚聽力遠超預期（霸王龍體溫與內溫性研究）',
      sourceUrl: 'https://canva.link/v1idbtw6d6aixrt',
      files: [
        {
          id: 'canva-12',
          name: 'Canva 線上簡報 — 野外實驗發現：鯊魚聽力遠超預期',
          url: 'https://canva.link/v1idbtw6d6aixrt',
          type: 'link',
          uploadedBy: '杜氏紅蓉',
          uploadedAt: '2026-09-22T23:42:54Z'
        }
      ],
      updatedAt: '2026-09-22T23:44:03Z'
    }
  ],
  extraStudents: [
    { id: '25101129', name: '江浩暘', email: 's25101129@stu.edu.tw', groupOrder: null, role: 'student', active: true },
    { id: '25101121', name: '同學 25101121', email: 's25101121@stu.edu.tw', groupOrder: null, role: 'student', active: true }
  ],
  // Real ratings imported from Google Sheets (1~5 scale converted to 20-point scale: score * 4)
  ratings: [
    { id: 'r_3_1', groupOrder: 3, reviewerEmail: 's25101105@stu.edu.tw', reviewerName: '蔡凱宇', timestamp: '2026/11/16 上午 11:46:04', scores: { content: 16, visuals: 8, delivery: 16, qna: 20, teamwork: 20 }, comment: '' },
    { id: 'r_3_2', groupOrder: 3, reviewerEmail: 's25101109@stu.edu.tw', reviewerName: '謝仁凱', timestamp: '2026/11/16 上午 11:46:31', scores: { content: 16, visuals: 12, delivery: 16, qna: 12, teamwork: 20 }, comment: '' },
    { id: 'r_3_3', groupOrder: 3, reviewerEmail: 's24101114@stu.edu.tw', reviewerName: '陳秉瑋', timestamp: '2026/11/16 下午 12:00:36', scores: { content: 12, visuals: 12, delivery: 12, qna: 12, teamwork: 12 }, comment: '' },
    { id: 'r_3_4', groupOrder: 3, reviewerEmail: 's25101106@stu.edu.tw', reviewerName: '楊錢秉秝', timestamp: '2026/11/16 下午 12:00:50', scores: { content: 16, visuals: 12, delivery: 20, qna: 16, teamwork: 20 }, comment: '' },
    { id: 'r_3_5', groupOrder: 3, reviewerEmail: 's25101108@stu.edu.tw', reviewerName: '李宜潔', timestamp: '2026/11/16 下午 12:00:55', scores: { content: 20, visuals: 12, delivery: 12, qna: 16, teamwork: 16 }, comment: '' },
    { id: 'r_3_6', groupOrder: 3, reviewerEmail: 's25101117@stu.edu.tw', reviewerName: '武文成', timestamp: '2026/11/16 下午 12:01:01', scores: { content: 20, visuals: 16, delivery: 20, qna: 20, teamwork: 16 }, comment: '' },
    { id: 'r_3_7', groupOrder: 3, reviewerEmail: 's25101101@stu.edu.tw', reviewerName: '姜毓庭', timestamp: '2026/11/16 下午 12:01:04', scores: { content: 12, visuals: 12, delivery: 12, qna: 12, teamwork: 20 }, comment: '' },
    { id: 'r_3_8', groupOrder: 3, reviewerEmail: 's25101123@stu.edu.tw', reviewerName: '阮氏明書', timestamp: '2026/11/16 下午 12:01:11', scores: { content: 20, visuals: 16, delivery: 16, qna: 16, teamwork: 12 }, comment: '' },
    { id: 'r_3_9', groupOrder: 3, reviewerEmail: 's25101129@stu.edu.tw', reviewerName: '江浩暘', timestamp: '2026/11/16 下午 12:01:19', scores: { content: 20, visuals: 16, delivery: 16, qna: 20, teamwork: 20 }, comment: '' },
    { id: 'r_3_10', groupOrder: 3, reviewerEmail: 's25101120@stu.edu.tw', reviewerName: '阮黃如氏竹玲', timestamp: '2026/11/16 下午 12:01:43', scores: { content: 16, visuals: 16, delivery: 12, qna: 16, teamwork: 16 }, comment: '' },
    { id: 'r_3_11', groupOrder: 3, reviewerEmail: 's25101124@stu.edu.tw', reviewerName: '阮氏美影', timestamp: '2026/11/16 下午 12:01:55', scores: { content: 20, visuals: 20, delivery: 20, qna: 16, teamwork: 16 }, comment: '' },
    { id: 'r_3_12', groupOrder: 3, reviewerEmail: 'yiqingo211@gmail.com', reviewerName: '王意晴', timestamp: '2026/11/16 下午 12:02:06', scores: { content: 12, visuals: 12, delivery: 8, qna: 12, teamwork: 20 }, comment: '' },
    { id: 'r_3_13', groupOrder: 3, reviewerEmail: 's25101121@stu.edu.tw', reviewerName: '同學 25101121', timestamp: '2026/11/16 下午 1:06:00', scores: { content: 12, visuals: 12, delivery: 8, qna: 8, teamwork: 8 }, comment: '' },
    { id: 'r_3_14', groupOrder: 3, reviewerEmail: 's25101113@stu.edu.tw', reviewerName: '簡呈凱', timestamp: '2026/11/17 下午 5:28:21', scores: { content: 16, visuals: 12, delivery: 12, qna: 12, teamwork: 16 }, comment: '' },

    { id: 'r_4_1', groupOrder: 4, reviewerEmail: 's25101109@stu.edu.tw', reviewerName: '謝仁凱', timestamp: '2026/11/16 下午 1:02:13', scores: { content: 20, visuals: 20, delivery: 16, qna: 20, teamwork: 20 }, comment: '' },
    { id: 'r_4_2', groupOrder: 4, reviewerEmail: 's25101101@stu.edu.tw', reviewerName: '姜毓庭', timestamp: '2026/11/16 下午 1:27:24', scores: { content: 16, visuals: 16, delivery: 16, qna: 16, teamwork: 20 }, comment: '' },
    { id: 'r_4_3', groupOrder: 4, reviewerEmail: 's25101106@stu.edu.tw', reviewerName: '楊錢秉秝', timestamp: '2026/11/17 上午 9:03:47', scores: { content: 20, visuals: 20, delivery: 16, qna: 16, teamwork: 20 }, comment: '' },
    { id: 'r_4_4', groupOrder: 4, reviewerEmail: 's25101113@stu.edu.tw', reviewerName: '簡呈凱', timestamp: '2026/11/17 下午 5:28:59', scores: { content: 16, visuals: 16, delivery: 12, qna: 12, teamwork: 12 }, comment: '' }
  ]
};

function ensureDbSchema(db) {
  let changed = false;
  if (!Array.isArray(db.admins)) {
    db.admins = [...DEFAULT_ADMIN_EMAILS];
    changed = true;
  }
  for (const adminEmail of DEFAULT_ADMIN_EMAILS) {
    if (!db.admins.map(e => e.toLowerCase()).includes(adminEmail.toLowerCase())) {
      db.admins.push(adminEmail);
      changed = true;
    }
  }

  const adminSet = new Set(db.admins.map(e => e.toLowerCase()));

  for (const g of db.groups) {
    const cloudCfg = GROUP_CLOUD_MAP[g.order];
    if (cloudCfg) {
      const expectedFormUrl = `https://docs.google.com/forms/d/${cloudCfg.formId}/viewform`;
      const expectedSheetUrl = `https://docs.google.com/spreadsheets/d/${cloudCfg.sheetId}/edit`;
      const expectedQrDriveUrl = `https://drive.google.com/file/d/${cloudCfg.qrDriveId}/view`;
      const expectedLocalQrUrl = `/qrcodes/group-${g.order}.png`;

      if (
        g.formId !== cloudCfg.formId ||
        g.formUrl !== expectedFormUrl ||
        g.sheetId !== cloudCfg.sheetId ||
        g.sheetUrl !== expectedSheetUrl ||
        g.qrDriveId !== cloudCfg.qrDriveId ||
        g.qrDriveUrl !== expectedQrDriveUrl ||
        g.qrLocalUrl !== expectedLocalQrUrl
      ) {
        g.formId = cloudCfg.formId;
        g.formUrl = expectedFormUrl;
        g.sheetId = cloudCfg.sheetId;
        g.sheetUrl = expectedSheetUrl;
        g.qrDriveId = cloudCfg.qrDriveId;
        g.qrDriveUrl = expectedQrDriveUrl;
        g.qrLocalUrl = expectedLocalQrUrl;
        changed = true;
      }
    }

    for (const m of g.members) {
      if (m.active === undefined) {
        m.active = true;
        changed = true;
      }
      const shouldBeAdmin = adminSet.has(m.email.toLowerCase()) || m.role === 'admin';
      const targetRole = shouldBeAdmin ? 'admin' : 'student';
      if (m.role !== targetRole) {
        m.role = targetRole;
        changed = true;
      }
      if (shouldBeAdmin && !adminSet.has(m.email.toLowerCase())) {
        db.admins.push(m.email.toLowerCase());
        adminSet.add(m.email.toLowerCase());
        changed = true;
      }
    }
  }

  db.extraStudents = db.extraStudents || [];
  for (const ex of db.extraStudents) {
    if (ex.active === undefined) {
      ex.active = true;
      changed = true;
    }
    const shouldBeAdmin = adminSet.has(ex.email.toLowerCase()) || ex.role === 'admin';
    const targetRole = shouldBeAdmin ? 'admin' : 'student';
    if (ex.role !== targetRole) {
      ex.role = targetRole;
      changed = true;
    }
  }

  db.ratings = (db.ratings || []).map((r, idx) => {
    if (!r.id) {
      changed = true;
      return { ...r, id: `r_${r.groupOrder}_${idx + 1}_${Date.now()}` };
    }
    return r;
  });

  if (changed) {
    saveDb(db);
  }
  return db;
}

function loadDb() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf8');
  }
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  return ensureDbSchema(raw);
}

function saveDb(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function isAdminEmail(db, email) {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  return (db.admins || []).some(a => a.toLowerCase() === e);
}

// Flatten all accounts across groups and extraStudents
function getAllAccounts(db) {
  const accounts = [];
  for (const g of db.groups) {
    for (const m of g.members) {
      const isAdmin = isAdminEmail(db, m.email) || m.role === 'admin';
      accounts.push({
        id: m.id,
        name: m.name,
        email: m.email,
        altEmail: m.altEmail || '',
        groupOrder: g.order,
        groupName: g.name,
        role: isAdmin ? 'admin' : 'student',
        isAdmin,
        active: m.active !== false
      });
    }
  }
  for (const ex of (db.extraStudents || [])) {
    const isAdmin = isAdminEmail(db, ex.email) || ex.role === 'admin';
    accounts.push({
      id: ex.id,
      name: ex.name,
      email: ex.email,
      altEmail: ex.altEmail || '',
      groupOrder: ex.groupOrder || null,
      groupName: ex.groupOrder ? `第${ex.groupOrder}組` : '未分組/其他',
      role: isAdmin ? 'admin' : 'student',
      isAdmin,
      active: ex.active !== false
    });
  }
  return accounts;
}

// Lookup student/admin info by email or student ID
function findStudent(db, query) {
  if (!query) return null;
  const q = query.trim().toLowerCase();
  const accounts = getAllAccounts(db);

  for (const acc of accounts) {
    const idMatch = acc.id.toLowerCase() === q || `s${acc.id.toLowerCase()}` === q;
    const emailMatch = acc.email.toLowerCase() === q || (acc.altEmail && acc.altEmail.toLowerCase() === q);
    const nameMatch = acc.name.toLowerCase() === q;
    if (idMatch || emailMatch || nameMatch) {
      return acc;
    }
  }
  return null;
}

// Compute aggregated statistics for each group (20 points per criterion, total 100)
function computeGroupStats(db) {
  return db.groups.map(group => {
    const groupRatings = db.ratings.filter(r => r.groupOrder === group.order);
    const count = groupRatings.length;
    let avgScores = { content: 0, visuals: 0, delivery: 0, qna: 0, teamwork: 0 };
    let totalScore = 0;

    if (count > 0) {
      const sums = groupRatings.reduce((acc, r) => {
        acc.content += Number(r.scores.content || 0);
        acc.visuals += Number(r.scores.visuals || 0);
        acc.delivery += Number(r.scores.delivery || 0);
        acc.qna += Number(r.scores.qna || 0);
        acc.teamwork += Number(r.scores.teamwork || 0);
        return acc;
      }, { content: 0, visuals: 0, delivery: 0, qna: 0, teamwork: 0 });

      avgScores = {
        content: Number((sums.content / count).toFixed(1)),
        visuals: Number((sums.visuals / count).toFixed(1)),
        delivery: Number((sums.delivery / count).toFixed(1)),
        qna: Number((sums.qna / count).toFixed(1)),
        teamwork: Number((sums.teamwork / count).toFixed(1))
      };
      totalScore = Number((avgScores.content + avgScores.visuals + avgScores.delivery + avgScores.qna + avgScores.teamwork).toFixed(1));
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
      ratingCount: count,
      avgScores,
      totalScore,
      comments,
      ratings: groupRatings
    };
  });
}

// Sync calculated scores & titles to the master Google Sheet (1iBFfy31wZxUXPb0ojm3D4UCrWNSisRS4UCS4_mlzWWE)
async function syncSummaryToGoogleSheet(db) {
  const groupsWithStats = computeGroupStats(db);
  const batchOps = [];

  for (const g of groupsWithStats) {
    const rowIdx = 12 + g.order; // Row 13 is Group 1, Row 24 is Group 12
    const sourceFormula = g.sourceUrl && g.sourceUrl.startsWith('http')
      ? `=HYPERLINK("${g.sourceUrl}", "連結")`
      : '無';

    const c1 = g.ratingCount > 0 ? g.avgScores.content : '';
    const c2 = g.ratingCount > 0 ? g.avgScores.visuals : '';
    const c3 = g.ratingCount > 0 ? g.avgScores.delivery : '';
    const c4 = g.ratingCount > 0 ? g.avgScores.qna : '';
    const c5 = g.ratingCount > 0 ? g.avgScores.teamwork : '';
    const joinedComments = g.comments.map(c => `${c.reviewerName}: ${c.comment}`).join(' | ');

    const memberNames = g.members.map(m => m.name).join('、');
    const memberIds = g.members.map(m => m.id).join('、');

    // Update B:J (Members, IDs, Title, Source, and 5 criteria scores out of 20)
    batchOps.push({
      op: 'write',
      range: `評分表!B${rowIdx}:J${rowIdx}`,
      data: [[memberNames, memberIds, g.title, sourceFormula, c1, c2, c3, c4, c5]]
    });

    batchOps.push({
      op: 'write',
      range: `評分表!L${rowIdx}`,
      data: [[joinedComments || '']]
    });
  }

  const tmpBatchFile = path.join('/tmp', `gsheets_batch_${Date.now()}.json`);
  fs.writeFileSync(tmpBatchFile, JSON.stringify(batchOps, null, 2), 'utf8');
  try {
    await execFileAsync('gsheets', ['mutate', 'batch', GOOGLE_RESOURCES.summarySheetId, '-f', tmpBatchFile]);
  } finally {
    if (fs.existsSync(tmpBatchFile)) fs.unlinkSync(tmpBatchFile);
  }
}

// Append rating to individual group response Google Sheet if available
async function appendRatingToGroupSheet(groupOrder, rating) {
  const sheetCfg = GOOGLE_RESOURCES.groupResponseSheets[groupOrder];
  if (!sheetCfg) return;

  const s = rating.scores;
  const rowValues = sheetCfg.emailLast
    ? `${rating.timestamp},${s.content},${s.visuals},${s.delivery},${s.qna},${s.teamwork},${rating.reviewerEmail}`
    : `${rating.timestamp},${rating.reviewerEmail},${s.content},${s.visuals},${s.delivery},${s.qna},${s.teamwork}`;

  try {
    await execFileAsync('gsheets', ['mutate', 'append', sheetCfg.id, '表單回覆 1!A1', rowValues]);
  } catch (err) {
    console.error(`Failed to append to group ${groupOrder} response sheet:`, err.message);
  }
}

// Configure Multer for report file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const safeName = `${Date.now()}_${originalName.replace(/[^a-zA-Z0-9.\u4e00-\u9fa5_-]/g, '_')}`;
    cb(null, safeName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// ==================== API ROUTES ====================

// 1. Get all portal data (groups, criteria, stats, accounts, resources)
app.get('/api/portal-data', (req, res) => {
  const db = loadDb();
  const groups = computeGroupStats(db);
  const scoredGroups = groups.filter(g => g.ratingCount > 0);
  const accounts = getAllAccounts(db);

  const classStats = {
    totalGroups: groups.length,
    scoredGroupsCount: scoredGroups.length,
    totalRatingsCount: db.ratings.length,
    totalAccountsCount: accounts.length,
    adminAccountsCount: accounts.filter(a => a.isAdmin).length,
    averageScore: scoredGroups.length > 0
      ? Number((scoredGroups.reduce((s, g) => s + g.totalScore, 0) / scoredGroups.length).toFixed(1))
      : 0,
    maxScore: scoredGroups.length > 0
      ? Number(Math.max(...scoredGroups.map(g => g.totalScore)).toFixed(1))
      : 0,
    minScore: scoredGroups.length > 0
      ? Number(Math.min(...scoredGroups.map(g => g.totalScore)).toFixed(1))
      : 0
  };

  res.json({
    admins: db.admins,
    criteria: db.criteria,
    groups,
    accounts,
    ratings: db.ratings,
    classStats,
    googleResources: GOOGLE_RESOURCES
  });
});

// 2. Authenticate student/admin via Google OAuth email or student ID
app.post('/api/auth/login', (req, res) => {
  const { emailOrId } = req.body;
  const db = loadDb();
  const student = findStudent(db, emailOrId);

  if (!student) {
    return res.status(404).json({
      error: '找不到對應的組員學號或學校信箱，請確認輸入是否為名單內的學校信箱（如 s25101114@stu.edu.tw）。'
    });
  }

  if (student.active === false) {
    return res.status(403).json({
      error: '此帳號目前已被管理員停用，請聯繫管理員（s25101114@stu.edu.tw）。'
    });
  }

  res.json({ user: student });
});

// 3. Submit or update a rating for a group (20 points per criterion, max 100)
app.post('/api/groups/:order/rate', async (req, res) => {
  const groupOrder = Number(req.params.order);
  const { reviewerEmail, reviewerName, scores, comment } = req.body;

  if (!reviewerEmail || !scores) {
    return res.status(400).json({ error: '缺少評分者資訊或評分內容' });
  }

  const db = loadDb();
  const group = db.groups.find(g => g.order === groupOrder);
  if (!group) {
    return res.status(404).json({ error: '找不到該組別' });
  }

  const keys = ['content', 'visuals', 'delivery', 'qna', 'teamwork'];
  const cleanScores = {};
  for (const k of keys) {
    const val = Number(scores[k]);
    if (isNaN(val) || val < 0 || val > 20) {
      return res.status(400).json({ error: `評分項目「${k}」分數必須介於 0 到 20 分之間` });
    }
    cleanScores[k] = val;
  }

  const nowStr = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: true });
  const existingIdx = db.ratings.findIndex(
    r => r.groupOrder === groupOrder && r.reviewerEmail.toLowerCase() === reviewerEmail.toLowerCase()
  );

  const ratingRecord = {
    id: existingIdx >= 0 ? db.ratings[existingIdx].id : `r_${groupOrder}_${Date.now()}`,
    groupOrder,
    reviewerEmail,
    reviewerName: reviewerName || reviewerEmail.split('@')[0],
    timestamp: nowStr,
    scores: cleanScores,
    comment: (comment || '').trim()
  };

  const isUpdate = existingIdx >= 0;
  if (isUpdate) {
    db.ratings[existingIdx] = ratingRecord;
  } else {
    db.ratings.push(ratingRecord);
  }

  saveDb(db);

  let syncedToGoogle = false;
  try {
    await syncSummaryToGoogleSheet(db);
    if (!isUpdate) {
      await appendRatingToGroupSheet(groupOrder, ratingRecord);
    }
    syncedToGoogle = true;
  } catch (err) {
    console.error('Google Sheets sync warning:', err.message);
  }

  res.json({
    success: true,
    isUpdate,
    syncedToGoogle,
    rating: ratingRecord
  });
});

// 4. Update group report info (own group or admin)
app.put('/api/groups/:order/info', async (req, res) => {
  const groupOrder = Number(req.params.order);
  const { title, sourceUrl } = req.body;

  const db = loadDb();
  const group = db.groups.find(g => g.order === groupOrder);
  if (!group) {
    return res.status(404).json({ error: '找不到該組別' });
  }

  if (title && title.trim()) group.title = title.trim();
  if (sourceUrl !== undefined) group.sourceUrl = sourceUrl.trim();
  group.updatedAt = new Date().toISOString();

  saveDb(db);

  let syncedToGoogle = false;
  try {
    await syncSummaryToGoogleSheet(db);
    syncedToGoogle = true;
  } catch (err) {
    console.error('Google Sheets sync warning:', err.message);
  }

  res.json({
    success: true,
    syncedToGoogle,
    group
  });
});

// 5. Upload report file and sync to Google Drive folder
app.post('/api/groups/:order/upload', upload.single('file'), async (req, res) => {
  const groupOrder = Number(req.params.order);
  if (!req.file) {
    return res.status(400).json({ error: '請選擇要上傳的報告檔案' });
  }

  const db = loadDb();
  const group = db.groups.find(g => g.order === groupOrder);
  if (!group) {
    return res.status(404).json({ error: '找不到該組別' });
  }

  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  const uploadedBy = req.body.uploadedBy || '組員';
  const localUrl = `/uploads/${req.file.filename}`;

  let driveFileId = null;
  let driveWebUrl = null;

  try {
    const desiredDriveName = `第${group.order}組_${originalName}`;
    const tmpDrivePath = path.join('/tmp', desiredDriveName);
    fs.copyFileSync(req.file.path, tmpDrivePath);

    const { stdout } = await execFileAsync('gdrive', [
      'mutate',
      'upload',
      tmpDrivePath,
      '--parent',
      GOOGLE_RESOURCES.driveFolderId
    ]);
    if (fs.existsSync(tmpDrivePath)) fs.unlinkSync(tmpDrivePath);

    const match = stdout.match(/([a-zA-Z0-9_-]{25,})/);
    if (match) {
      driveFileId = match[1];
      driveWebUrl = `https://drive.google.com/file/d/${driveFileId}/view`;
    }
  } catch (err) {
    console.error('Google Drive upload warning:', err.message);
  }

  const fileRecord = {
    id: `file_${Date.now()}`,
    name: originalName,
    size: req.file.size,
    localUrl,
    driveFileId,
    driveUrl: driveWebUrl,
    url: driveWebUrl || localUrl,
    type: 'file',
    uploadedBy,
    uploadedAt: new Date().toISOString()
  };

  group.files = group.files || [];
  group.files.unshift(fileRecord);

  if (driveWebUrl && (!group.sourceUrl || group.sourceUrl === '無')) {
    group.sourceUrl = driveWebUrl;
  }
  group.updatedAt = new Date().toISOString();

  saveDb(db);

  try {
    await syncSummaryToGoogleSheet(db);
  } catch (e) {
    console.error('Summary sync error after upload:', e.message);
  }

  res.json({
    success: true,
    file: fileRecord,
    group
  });
});

// ==================== ADMIN BACKEND & ACCOUNT MANAGEMENT ROUTES ====================

function verifyAdminMiddleware(req, res, next) {
  const adminEmail =
    req.headers['x-admin-email'] ||
    (req.body && req.body.adminEmail) ||
    (req.query && req.query.adminEmail);
  const db = loadDb();
  if (!isAdminEmail(db, adminEmail)) {
    return res.status(403).json({ error: '權限不足：僅限系統管理員（如 s25101114@stu.edu.tw）執行此操作' });
  }
  req.db = db;
  next();
}

// 6. Admin: Create or Add a new student/admin account
app.post('/api/admin/accounts', verifyAdminMiddleware, async (req, res) => {
  const db = req.db;
  const { id, name, email, groupOrder, role } = req.body;

  if (!id || !name || !email) {
    return res.status(400).json({ error: '請填寫完整的學號、姓名與學校信箱' });
  }

  const cleanId = String(id).trim();
  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim().toLowerCase();
  const targetRole = role === 'admin' ? 'admin' : 'student';
  const targetGroupOrder = groupOrder ? Number(groupOrder) : null;

  // Check duplicate email or student ID
  const existing = getAllAccounts(db).find(
    a => a.email.toLowerCase() === cleanEmail || a.id.toLowerCase() === cleanId.toLowerCase()
  );
  if (existing) {
    return res.status(400).json({ error: `學號 (${cleanId}) 或信箱 (${cleanEmail}) 已存在於系統中` });
  }

  if (targetRole === 'admin' && !isAdminEmail(db, cleanEmail)) {
    db.admins.push(cleanEmail);
  }

  const newMember = {
    id: cleanId,
    name: cleanName,
    email: cleanEmail,
    role: targetRole,
    active: true
  };

  if (targetGroupOrder) {
    const grp = db.groups.find(g => g.order === targetGroupOrder);
    if (!grp) return res.status(404).json({ error: '指定的組別不存在' });
    grp.members.push(newMember);
  } else {
    db.extraStudents = db.extraStudents || [];
    db.extraStudents.push({ ...newMember, groupOrder: null });
  }

  saveDb(db);
  try {
    await syncSummaryToGoogleSheet(db);
  } catch (e) {
    console.error('Admin account create sync warning:', e.message);
  }

  res.json({ success: true, account: newMember });
});

// 7. Admin: Update an existing account (change name, ID, email, groupOrder, role, active status)
app.put('/api/admin/accounts/:originalEmail', verifyAdminMiddleware, async (req, res) => {
  const db = req.db;
  const originalEmail = decodeURIComponent(req.params.originalEmail).trim().toLowerCase();
  const { id, name, email, groupOrder, role, active } = req.body;

  const cleanId = String(id || '').trim();
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || originalEmail).trim().toLowerCase();
  const targetRole = role === 'admin' ? 'admin' : 'student';
  const targetGroupOrder = groupOrder ? Number(groupOrder) : null;
  const targetActive = active !== false;

  // Prevent removing admin privilege from primary admin s25101114@stu.edu.tw if trying to disable self
  if (originalEmail === 's25101114@stu.edu.tw' && (!targetActive || targetRole !== 'admin')) {
    return res.status(400).json({ error: '預設系統主管理員 (s25101114@stu.edu.tw) 不可被停用或移除管理員權限' });
  }

  // Locate and remove from current group or extraStudents
  let foundMember = null;
  for (const g of db.groups) {
    const idx = g.members.findIndex(m => m.email.toLowerCase() === originalEmail);
    if (idx >= 0) {
      foundMember = g.members.splice(idx, 1)[0];
      break;
    }
  }
  if (!foundMember) {
    const idx = (db.extraStudents || []).findIndex(m => m.email.toLowerCase() === originalEmail);
    if (idx >= 0) {
      foundMember = db.extraStudents.splice(idx, 1)[0];
    }
  }

  if (!foundMember) {
    return res.status(404).json({ error: '找不到要修改的帳號' });
  }

  // Update admin email list
  db.admins = (db.admins || []).filter(a => a.toLowerCase() !== originalEmail && a.toLowerCase() !== cleanEmail);
  if (targetRole === 'admin') {
    db.admins.push(cleanEmail);
  }

  const updatedMember = {
    ...foundMember,
    id: cleanId || foundMember.id,
    name: cleanName || foundMember.name,
    email: cleanEmail,
    role: targetRole,
    active: targetActive
  };

  if (targetGroupOrder) {
    const grp = db.groups.find(g => g.order === targetGroupOrder);
    if (!grp) return res.status(404).json({ error: '指定的組別不存在' });
    delete updatedMember.groupOrder;
    grp.members.push(updatedMember);
  } else {
    db.extraStudents = db.extraStudents || [];
    db.extraStudents.push({ ...updatedMember, groupOrder: null });
  }

  saveDb(db);
  try {
    await syncSummaryToGoogleSheet(db);
  } catch (e) {
    console.error('Admin account update sync warning:', e.message);
  }

  res.json({ success: true, account: updatedMember });
});

// 8. Admin: Delete an account
app.delete('/api/admin/accounts/:targetEmail', verifyAdminMiddleware, async (req, res) => {
  const db = req.db;
  const targetEmail = decodeURIComponent(req.params.targetEmail).trim().toLowerCase();

  if (targetEmail === 's25101114@stu.edu.tw') {
    return res.status(400).json({ error: '預設系統主管理員 (s25101114@stu.edu.tw) 不可刪除' });
  }

  let removed = false;
  for (const g of db.groups) {
    const before = g.members.length;
    g.members = g.members.filter(m => m.email.toLowerCase() !== targetEmail);
    if (g.members.length < before) removed = true;
  }
  const beforeExtra = (db.extraStudents || []).length;
  db.extraStudents = (db.extraStudents || []).filter(m => m.email.toLowerCase() !== targetEmail);
  if (db.extraStudents.length < beforeExtra) removed = true;

  db.admins = (db.admins || []).filter(a => a.toLowerCase() !== targetEmail);

  if (!removed) {
    return res.status(404).json({ error: '找不到該帳號' });
  }

  saveDb(db);
  try {
    await syncSummaryToGoogleSheet(db);
  } catch (e) {
    console.error('Admin account delete sync warning:', e.message);
  }

  res.json({ success: true });
});

// 9. Admin: Delete a specific rating record
app.delete('/api/admin/ratings/:ratingId', verifyAdminMiddleware, async (req, res) => {
  const db = req.db;
  const ratingId = req.params.ratingId;

  const before = db.ratings.length;
  db.ratings = db.ratings.filter(r => r.id !== ratingId);
  if (db.ratings.length === before) {
    return res.status(404).json({ error: '找不到該筆評分紀錄' });
  }

  saveDb(db);
  try {
    await syncSummaryToGoogleSheet(db);
  } catch (e) {
    console.error('Admin rating delete sync warning:', e.message);
  }

  res.json({ success: true });
});

// 10. Admin: Delete an uploaded file from a group
app.delete('/api/admin/groups/:order/files/:fileId', verifyAdminMiddleware, async (req, res) => {
  const db = req.db;
  const groupOrder = Number(req.params.order);
  const fileId = req.params.fileId;

  const group = db.groups.find(g => g.order === groupOrder);
  if (!group) return res.status(404).json({ error: '找不到該組別' });

  group.files = (group.files || []).filter(f => f.id !== fileId);
  saveDb(db);

  res.json({ success: true });
});

// 11. Admin: Export All Groups Score Overview & Details to Excel (.xlsx)
app.get('/api/admin/export-excel', verifyAdminMiddleware, async (req, res) => {
  try {
    const db = req.db;
    const groups = computeGroupStats(db);
    const accounts = getAllAccounts(db);
    const scoredGroups = groups.filter(g => g.ratingCount > 0);

    const avgScore = scoredGroups.length > 0
      ? Number((scoredGroups.reduce((s, g) => s + g.totalScore, 0) / scoredGroups.length).toFixed(1))
      : 0;
    const maxScore = scoredGroups.length > 0
      ? Number(Math.max(...scoredGroups.map(g => g.totalScore)).toFixed(1))
      : 0;
    const minScore = scoredGroups.length > 0
      ? Number(Math.min(...scoredGroups.map(g => g.totalScore)).toFixed(1))
      : 0;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = '科技文選分組報告與評分系統';
    workbook.created = new Date();

    // ==================== SHEET 1: 分組報告評分總覽 ====================
    const wsSummary = workbook.addWorksheet('分組報告評分總覽');

    // Title block
    wsSummary.mergeCells('A1:L1');
    const titleCell = wsSummary.getCell('A1');
    titleCell.value = '科技文選 分組報告評分總覽表（五項指標各 20 分，滿分 100 分）';
    titleCell.font = { name: 'Microsoft JhengHei', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    wsSummary.getRow(1).height = 30;

    wsSummary.mergeCells('A2:L2');
    const subTitleCell = wsSummary.getCell('A2');
    const exportTimeStr = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
    subTitleCell.value = `匯出時間：${exportTimeStr} ｜ 匯出管理員：${req.query.adminEmail || req.headers['x-admin-email'] || 's25101114@stu.edu.tw'} ｜ 評分標準：內容掌握(20)、簡報製作(20)、口語台風(20)、時間問答(20)、團隊表現(20)`;
    subTitleCell.font = { name: 'Microsoft JhengHei', size: 10, color: { argb: 'FF334155' } };
    subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    subTitleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    wsSummary.getRow(2).height = 22;

    // Header Row (Row 4)
    const summaryHeaders = [
      '上台順序',
      '組員姓名',
      '學號',
      '報告題目',
      '參考來源 / 簡報連結',
      '內容掌握(20)',
      '簡報製作(20)',
      '口語台風(20)',
      '時間問答(20)',
      '團隊表現(20)',
      '總分(100)',
      '評分筆數 / 評語與建議'
    ];
    const headerRow = wsSummary.getRow(4);
    headerRow.values = summaryHeaders;
    headerRow.height = 24;
    headerRow.eachCell(cell => {
      cell.font = { name: 'Microsoft JhengHei', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFBF1' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'medium', color: { argb: 'FF0F766E' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    // Data Rows (Rows 5..16 for 12 groups)
    groups.forEach((g, idx) => {
      const rIdx = 5 + idx;
      const row = wsSummary.getRow(rIdx);
      const memberNames = g.members.map(m => m.name).join('、');
      const memberIds = g.members.map(m => m.id).join('、');
      const hasScore = g.ratingCount > 0;
      const joinedComments = g.comments.map(c => `${c.reviewerName}: ${c.comment}`).join(' | ');
      const commentSummary = `${g.ratingCount} 筆評分` + (joinedComments ? ` — ${joinedComments}` : '');

      row.values = [
        g.order,
        memberNames,
        memberIds,
        g.title || '未定',
        g.sourceUrl || '無',
        hasScore ? g.avgScores.content : '',
        hasScore ? g.avgScores.visuals : '',
        hasScore ? g.avgScores.delivery : '',
        hasScore ? g.avgScores.qna : '',
        hasScore ? g.avgScores.teamwork : '',
        hasScore ? g.totalScore : 0,
        commentSummary
      ];
      row.height = 22;

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Microsoft JhengHei', size: 10.5, bold: colNumber === 11 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        if (colNumber === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber >= 6 && colNumber <= 11) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          if (typeof cell.value === 'number') {
            cell.numFmt = '0.0';
          }
          if (colNumber === 11 && hasScore) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
            cell.font = { name: 'Microsoft JhengHei', size: 11, bold: true, color: { argb: 'FF047857' } };
          }
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        }
      });
    });

    // Footer Statistics Rows (Average, Max, Min)
    const footerStats = [
      { label: '平均 (Average)', value: avgScore },
      { label: '最高 (Max)', value: maxScore },
      { label: '最低 (Min)', value: minScore }
    ];

    footerStats.forEach((st, i) => {
      const rIdx = 5 + groups.length + i;
      const row = wsSummary.getRow(rIdx);
      row.getCell(1).value = st.label;
      wsSummary.mergeCells(`A${rIdx}:J${rIdx}`);
      row.getCell(11).value = st.value;
      row.getCell(12).value = i === 0 ? `已評分組數：${scoredGroups.length} / ${groups.length} 組（共 ${db.ratings.length} 筆同儕評分）` : '';
      row.height = 22;

      for (let c = 1; c <= 12; c++) {
        const cell = row.getCell(c);
        cell.font = { name: 'Microsoft JhengHei', size: 10.5, bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
      }
      row.getCell(11).alignment = { vertical: 'middle', horizontal: 'right' };
      row.getCell(11).numFmt = '0.0';
    });

    wsSummary.columns = [
      { width: 10 },
      { width: 20 },
      { width: 22 },
      { width: 42 },
      { width: 38 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 36 }
    ];

    // ==================== SHEET 2: 各組評分明細紀錄 ====================
    const wsRatings = workbook.addWorksheet('各組評分明細紀錄');
    const ratingHeaders = [
      '受評組別',
      '受評組報告題目',
      '評分者姓名',
      '評分者信箱',
      '評分時間',
      '內容掌握(20)',
      '簡報製作(20)',
      '口語台風(20)',
      '時間問答(20)',
      '團隊表現(20)',
      '總分(100)',
      '評語與建議'
    ];
    const rHeaderRow = wsRatings.getRow(1);
    rHeaderRow.values = ratingHeaders;
    rHeaderRow.height = 24;
    rHeaderRow.eachCell(cell => {
      cell.font = { name: 'Microsoft JhengHei', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const sortedRatings = [...db.ratings].sort((a, b) => a.groupOrder - b.groupOrder);
    sortedRatings.forEach((r, idx) => {
      const grp = groups.find(g => g.order === r.groupOrder);
      const s = r.scores || {};
      const tot = Number(s.content || 0) + Number(s.visuals || 0) + Number(s.delivery || 0) + Number(s.qna || 0) + Number(s.teamwork || 0);
      const row = wsRatings.getRow(idx + 2);
      row.values = [
        `第 ${r.groupOrder} 組`,
        grp ? grp.title : '',
        r.reviewerName || '',
        r.reviewerEmail || '',
        r.timestamp || '',
        Number(s.content || 0),
        Number(s.visuals || 0),
        Number(s.delivery || 0),
        Number(s.qna || 0),
        Number(s.teamwork || 0),
        tot,
        r.comment || ''
      ];
      row.height = 20;
    });

    wsRatings.columns = [
      { width: 12 },
      { width: 38 },
      { width: 16 },
      { width: 26 },
      { width: 24 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 32 }
    ];

    // ==================== SHEET 3: 學生與管理員帳號名單 ====================
    const wsAccounts = workbook.addWorksheet('學生與管理員帳號名單');
    const accHeaderRow = wsAccounts.getRow(1);
    accHeaderRow.values = ['所屬組別', '學號', '姓名', '學校 Google 信箱', '系統角色權限', '帳號狀態'];
    accHeaderRow.height = 24;
    accHeaderRow.eachCell(cell => {
      cell.font = { name: 'Microsoft JhengHei', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    accounts.forEach((a, idx) => {
      const row = wsAccounts.getRow(idx + 2);
      row.values = [
        a.groupOrder ? `第 ${a.groupOrder} 組` : '未分組',
        a.id,
        a.name,
        a.email,
        a.isAdmin ? '系統管理員 (Admin)' : '一般學生 (Student)',
        a.active !== false ? '啟用中' : '已停用'
      ];
      row.height = 20;
    });

    wsAccounts.columns = [
      { width: 14 },
      { width: 16 },
      { width: 18 },
      { width: 28 },
      { width: 22 },
      { width: 14 }
    ];

    const filename = encodeURIComponent('科技文選_所有組別分數總覽表.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${filename}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Excel export failed:', err);
    res.status(500).json({ error: '匯出 Excel 失敗：' + err.message });
  }
});

// 12. Force sync with Google Sheets
app.post('/api/sync-google', async (req, res) => {
  const db = loadDb();
  try {
    await syncSummaryToGoogleSheet(db);
    res.json({ success: true, message: '已成功將所有組別名單、評分（五項各 20 分）與報告連結同步至 Google 試算表總表！' });
  } catch (err) {
    res.status(500).json({ error: `同步失敗: ${err.message}` });
  }
});

app.listen(PORT, async () => {
  console.log(`Sci-Report Portal Server running at http://localhost:${PORT}`);
  try {
    const db = loadDb();
    await syncSummaryToGoogleSheet(db);
    console.log('Initial Google Sheet summary sync completed (5 criteria x 20 pts = 100 pts, Admin: s25101114@stu.edu.tw).');
  } catch (err) {
    console.error('Initial sync warning:', err.message);
  }
});
