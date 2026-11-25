/**
 * 科技文選 — 雲端資料 API (Google Apps Script)  v2
 * --------------------------------------------------------------
 * 1. 帳號與密碼雜湊跨裝置同步（第 1 個工作表）
 * 2. 各組報告資訊（工作表「報告資訊」）
 * 3. 全班評分紀錄（工作表「評分紀錄」）
 * 4. 各組上傳簡報 → 存進 Google Drive 資料夾
 *
 * 對應私人試算表：科技文選_帳號與密碼雜湊資料庫
 * Spreadsheet ID: 1mDdrTCfHW6fihf7nVi-zveMJINFfUbvprnMRmEzV6c8
 *
 * 帳號工作表欄位 (A~H)：
 * A: id | B: name | C: email | D: groupOrder | E: role | F: active | G: passwordHash | H: passwordUpdatedAt
 *
 * ⚠️ 更新方式：貼上本檔全部內容 → 儲存 → 「部署」→「管理部署作業」→ 鉛筆圖示 →
 *    版本選「新版本」→「部署」。（這樣網址不會改變，網站不用改設定）
 *    第一次執行會要求授權 Google Drive，請按「允許」。
 */

const SHEET_ID = '1mDdrTCfHW6fihf7nVi-zveMJINFfUbvprnMRmEzV6c8';
const UPLOAD_FOLDER_ID = '1sQZsZQxmORHisAjgWAwe8qw5lROCjWCz'; // 科技文選_各組上傳簡報 (網站自動儲存)
const GROUPS_SHEET = '報告資訊';
const RATINGS_SHEET = '評分紀錄';
const MAX_UPLOAD_MB = 30;

const GROUP_HEADERS = ['組別', '報告題目', '參考來源', '上傳檔案(JSON)', '最後更新'];
const RATING_HEADERS = ['評分ID', '組別', '評分者信箱', '評分者姓名', '時間', '內容掌握', '簡報設計', '口語台風', '時間問答', '團隊表現', '總分', '評語'];
const SCORE_KEYS = ['content', 'visuals', 'delivery', 'qna', 'teamwork'];

// ==================== 共用工具 ====================
function getSpreadsheet() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function getAccountsSheet() {
  return getSpreadsheet().getSheets()[0];
}

function getOrCreateSheet(name, headers) {
  const ss = getSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function withLock(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

// ==================== 帳號 ====================
function readAccounts() {
  const values = getAccountsSheet().getDataRange().getValues();
  const accounts = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!r[0] && !r[2]) continue;
    accounts.push({
      id: String(r[0] || '').trim(),
      name: String(r[1] || '').trim(),
      email: String(r[2] || '').trim().toLowerCase(),
      groupOrder: r[3] ? Number(r[3]) : null,
      role: String(r[4] || 'student').trim(),
      active: String(r[5]).toUpperCase() !== 'FALSE',
      passwordHash: String(r[6] || '').trim(),
      password: String(r[6] || '').trim(),
      passwordUpdatedAt: r[7] ? String(r[7]).trim() : null
    });
  }
  return accounts;
}

// ==================== 報告資訊 & 評分 ====================
function readPortalData() {
  const ss = getSpreadsheet();
  const gSheet = ss.getSheetByName(GROUPS_SHEET);
  const rSheet = ss.getSheetByName(RATINGS_SHEET);
  const groups = [];
  const ratings = [];

  if (gSheet) {
    const gv = gSheet.getDataRange().getDisplayValues();
    for (let i = 1; i < gv.length; i++) {
      const r = gv[i];
      if (!r[0]) continue;
      let files = [];
      try {
        files = r[3] ? JSON.parse(r[3]) : [];
      } catch (e) {
        files = [];
      }
      groups.push({ order: Number(r[0]), title: r[1], sourceUrl: r[2], files: files, updatedAt: r[4] });
    }
  }

  if (rSheet) {
    const rv = rSheet.getDataRange().getDisplayValues();
    for (let i = 1; i < rv.length; i++) {
      const r = rv[i];
      if (!r[0]) continue;
      const scores = {};
      SCORE_KEYS.forEach((k, idx) => (scores[k] = Number(r[5 + idx]) || 0));
      ratings.push({
        id: r[0],
        groupOrder: Number(r[1]),
        reviewerEmail: String(r[2]).toLowerCase(),
        reviewerName: r[3],
        timestamp: r[4],
        scores: scores,
        comment: r[11] || ''
      });
    }
  }

  return { initialized: Boolean(gSheet && rSheet), groups: groups, ratings: ratings };
}

function findGroupRow(sheet, order) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (Number(values[i][0]) === Number(order)) return { row: i + 1, values: values[i] };
  }
  return null;
}

function getGroupFiles(sheet, order) {
  const found = findGroupRow(sheet, order);
  if (!found) return [];
  try {
    return found.values[3] ? JSON.parse(found.values[3]) : [];
  } catch (e) {
    return [];
  }
}

function writeGroupFields(order, fields) {
  const sheet = getOrCreateSheet(GROUPS_SHEET, GROUP_HEADERS);
  const found = findGroupRow(sheet, order);
  const now = new Date().toISOString();
  if (found) {
    if (fields.title !== undefined) sheet.getRange(found.row, 2).setValue(fields.title);
    if (fields.sourceUrl !== undefined) sheet.getRange(found.row, 3).setValue(fields.sourceUrl);
    if (fields.files !== undefined) sheet.getRange(found.row, 4).setValue(JSON.stringify(fields.files));
    sheet.getRange(found.row, 5).setValue(now);
  } else {
    sheet.appendRow([
      Number(order),
      fields.title || '',
      fields.sourceUrl || '',
      JSON.stringify(fields.files || []),
      now
    ]);
  }
}

function getGroupFolder(order) {
  const root = DriveApp.getFolderById(UPLOAD_FOLDER_ID);
  const name = '第 ' + order + ' 組';
  const it = root.getFoldersByName(name);
  return it.hasNext() ? it.next() : root.createFolder(name);
}

// ==================== GET ====================
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'accounts';
    if (action === 'portalData') {
      return jsonResponse({ success: true, portal: readPortalData() });
    }
    return jsonResponse({ success: true, accounts: readAccounts() });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ==================== POST ====================
function doPost(e) {
  try {
    const payload = JSON.parse((e.postData && e.postData.contents) || '{}');
    const action = payload.action;

    // ---------- 帳號 ----------
    if (action === 'updatePassword' || action === 'upsertAccount' || action === 'deleteAccount') {
      return withLock(() => handleAccountAction(action, payload));
    }

    // ---------- 報告資訊 ----------
    if (action === 'updateGroupInfo') {
      withLock(() =>
        writeGroupFields(payload.groupOrder, {
          title: String(payload.title || '').trim(),
          sourceUrl: String(payload.sourceUrl || '').trim()
        })
      );
      return jsonResponse({ success: true, portal: readPortalData() });
    }

    // ---------- 上傳簡報到 Google Drive ----------
    if (action === 'uploadFile') {
      const order = Number(payload.groupOrder);
      if (!order) throw new Error('缺少組別');
      const bytes = Utilities.base64Decode(String(payload.base64 || ''));
      if (!bytes.length) throw new Error('檔案內容是空的');
      if (bytes.length > MAX_UPLOAD_MB * 1024 * 1024) throw new Error('檔案超過 ' + MAX_UPLOAD_MB + ' MB');

      const blob = Utilities.newBlob(bytes, payload.mimeType || 'application/octet-stream', payload.fileName || 'upload');
      const driveFile = getGroupFolder(order).createFile(blob);
      try {
        driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {
        // 若帳號政策不允許公開連結，則維持私人（只有擁有者可開啟）
      }

      const record = {
        id: driveFile.getId(),
        name: payload.fileName || driveFile.getName(),
        url: driveFile.getUrl(),
        driveId: driveFile.getId(),
        size: bytes.length,
        uploadedBy: String(payload.uploadedBy || ''),
        uploadedAt: new Date().toISOString()
      };

      withLock(() => {
        const sheet = getOrCreateSheet(GROUPS_SHEET, GROUP_HEADERS);
        const files = getGroupFiles(sheet, order);
        files.unshift(record);
        writeGroupFields(order, { files: files });
      });
      return jsonResponse({ success: true, file: record, portal: readPortalData() });
    }

    // ---------- 移除簡報 ----------
    if (action === 'deleteFile') {
      const order = Number(payload.groupOrder);
      const fileId = String(payload.fileId || '');
      withLock(() => {
        const sheet = getOrCreateSheet(GROUPS_SHEET, GROUP_HEADERS);
        const files = getGroupFiles(sheet, order);
        const target = files.find(f => f.id === fileId);
        if (target && target.driveId) {
          try {
            DriveApp.getFileById(target.driveId).setTrashed(true); // 移到垃圾桶，30 天內可復原
          } catch (trashErr) {}
        }
        writeGroupFields(order, { files: files.filter(f => f.id !== fileId) });
      });
      return jsonResponse({ success: true, portal: readPortalData() });
    }

    // ---------- 新增 / 修改評分 ----------
    if (action === 'upsertRating') {
      const r = payload.rating || {};
      const email = String(r.reviewerEmail || '').trim().toLowerCase();
      const order = Number(r.groupOrder);
      if (!email || !order) throw new Error('評分資料不完整');
      const scores = SCORE_KEYS.map(k => Number((r.scores || {})[k]) || 0);
      const total = scores.reduce((a, b) => a + b, 0);

      withLock(() => {
        const sheet = getOrCreateSheet(RATINGS_SHEET, RATING_HEADERS);
        const values = sheet.getDataRange().getValues();
        let id = r.id || 'r_' + order + '_' + Date.now();
        let targetRow = -1;
        for (let i = 1; i < values.length; i++) {
          if (Number(values[i][1]) === order && String(values[i][2]).trim().toLowerCase() === email) {
            targetRow = i + 1;
            id = values[i][0] || id;
            break;
          }
        }
        const rowData = [id, order, email, r.reviewerName || '', r.timestamp || new Date().toLocaleString('zh-TW')]
          .concat(scores)
          .concat([total, String(r.comment || '')]);
        if (targetRow > 0) {
          sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
        } else {
          sheet.appendRow(rowData);
        }
      });
      return jsonResponse({ success: true, portal: readPortalData() });
    }

    // ---------- 刪除評分 ----------
    if (action === 'deleteRating') {
      const rid = String(payload.ratingId || '');
      withLock(() => {
        const sheet = getOrCreateSheet(RATINGS_SHEET, RATING_HEADERS);
        const values = sheet.getDataRange().getValues();
        for (let i = values.length - 1; i >= 1; i--) {
          if (String(values[i][0]) === rid) sheet.deleteRow(i + 1);
        }
      });
      return jsonResponse({ success: true, portal: readPortalData() });
    }

    return jsonResponse({ success: false, error: '未知的操作類型: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ==================== 帳號操作（與 v1 相同） ====================
function handleAccountAction(action, payload) {
  const sheet = getAccountsSheet();
  const values = sheet.getDataRange().getValues();

  if (action === 'updatePassword') {
    const targetId = String(payload.id || '').trim().toLowerCase();
    const targetEmail = String(payload.email || '').trim().toLowerCase();
    const newHash = String(payload.passwordHash || '').trim();
    const updatedAt = String(payload.passwordUpdatedAt || new Date().toISOString());

    for (let i = 1; i < values.length; i++) {
      const rowId = String(values[i][0] || '').trim().toLowerCase();
      const rowEmail = String(values[i][2] || '').trim().toLowerCase();
      if ((targetId && rowId === targetId) || (targetEmail && rowEmail === targetEmail)) {
        if (newHash) sheet.getRange(i + 1, 7).setValue(newHash);
        sheet.getRange(i + 1, 8).setValue(updatedAt);
        return jsonResponse({ success: true, updated: true });
      }
    }
    return jsonResponse({ success: false, error: '找不到對應帳號' });
  }

  if (action === 'upsertAccount') {
    const acc = payload.account || {};
    const origEmail = String(payload.originalEmail || acc.email || '').trim().toLowerCase();
    const rowData = [
      String(acc.id || '').trim(),
      String(acc.name || '').trim(),
      String(acc.email || '').trim().toLowerCase(),
      acc.groupOrder ? Number(acc.groupOrder) : '',
      acc.role === 'admin' ? 'admin' : 'student',
      acc.active !== false ? 'TRUE' : 'FALSE',
      String(acc.passwordHash || acc.password || '').trim(),
      acc.passwordUpdatedAt ? String(acc.passwordUpdatedAt) : ''
    ];

    for (let i = 1; i < values.length; i++) {
      const rowEmail = String(values[i][2] || '').trim().toLowerCase();
      const rowId = String(values[i][0] || '').trim().toLowerCase();
      if (rowEmail === origEmail || (acc.id && rowId === String(acc.id).trim().toLowerCase())) {
        sheet.getRange(i + 1, 1, 1, 8).setValues([rowData]);
        return jsonResponse({ success: true, mode: 'updated' });
      }
    }

    sheet.appendRow(rowData);
    return jsonResponse({ success: true, mode: 'inserted' });
  }

  if (action === 'deleteAccount') {
    const targetEmail = String(payload.email || '').trim().toLowerCase();
    for (let i = 1; i < values.length; i++) {
      const rowEmail = String(values[i][2] || '').trim().toLowerCase();
      if (rowEmail === targetEmail) {
        sheet.deleteRow(i + 1);
        return jsonResponse({ success: true, deleted: true });
      }
    }
    return jsonResponse({ success: false, error: '找不到要刪除的帳號' });
  }

  return jsonResponse({ success: false, error: '未知的操作類型: ' + action });
}
