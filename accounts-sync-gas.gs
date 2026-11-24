/**
 * 科技文選 — 帳號與密碼雜湊跨裝置同步 API (Google Apps Script)
 * 對應私人試算表：科技文選_帳號與密碼雜湊資料庫
 * Spreadsheet ID: 1mDdrTCfHW6fihf7nVi-zveMJINFfUbvprnMRmEzV6c8
 *
 * 欄位順序 (A~H)：
 * A: id | B: name | C: email | D: groupOrder | E: role | F: active | G: passwordHash | H: passwordUpdatedAt
 */

const SHEET_ID = '1mDdrTCfHW6fihf7nVi-zveMJINFfUbvprnMRmEzV6c8';

function getAccountsSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheets()[0];
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// 1. 讀取所有最新帳號與密碼雜湊 (GET)
function doGet(e) {
  try {
    const sheet = getAccountsSheet();
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return jsonResponse({ success: true, accounts: [] });
    }

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

    return jsonResponse({ success: true, accounts: accounts });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// 2. 更新密碼雜湊、新增/編輯帳號或刪除帳號 (POST)
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const action = payload.action;
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
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}
