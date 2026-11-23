/**
 * ============================================================================
 * 科技文選 — 分組報告與線上評分系統 (Google Apps Script 雲端後端 API)
 * ============================================================================
 * 用途：讓部署於 GitHub Pages 的靜態網站可以直接讀寫 Google Sheets 總表、
 *       寫入各組回覆試算表，並將學生上傳的簡報檔案直接存入 Google Drive 資料夾。
 *
 * 【部署步驟】：
 * 1. 開啟「科技文選分組報告評分表」Google 試算表：
 *    https://docs.google.com/spreadsheets/d/1iBFfy31wZxUXPb0ojm3D4UCrWNSisRS4UCS4_mlzWWE/edit
 * 2. 點選上方選單「擴充功能 (Extensions)」 -> 「Apps Script」。
 * 3. 將本檔案所有程式碼貼入 `Code.gs` 並儲存。
 * 4. 點選右上角「部署 (Deploy)」 -> 「新增部署作業 (New deployment)」。
 * 5. 選取類型：「網頁應用程式 (Web app)」：
 *    - 執行身分 (Execute as)：我 (Me)
 *    - 誰可以存取 (Who has access)：所有人 (Anyone)
 * 6. 部署後複製「網頁應用程式網址 (Web App URL)」，貼到網站管理員後台的
 *    「Google OAuth 與雲端 API 設定」中即可完成雙向自動同步！
 */

const SUMMARY_SHEET_ID = '1iBFfy31wZxUXPb0ojm3D4UCrWNSisRS4UCS4_mlzWWE';
const DRIVE_FOLDER_ID = '19oLtHpGGpNsq_0qR5EDou4x4rB0ANxCH';

const GROUP_RESPONSE_SHEETS = {
  1: '1iLbBMufB6H33tuGqE_s9jehTI5vBMi_peE4twQ6ZKxM',
  2: '1-RdHWNoXJj3d1Ty5TlClQf9cNAmYEO4HsUzdXRK46IM',
  3: '1Un0WT3JcqD-Z7Xh5evQ70hUcEvso1tGOqOuwCPjRgSc',
  4: '1crdychJQc_opZUAYIecKSX4oL3TA1Jo1XCfKoXpnXY4',
  5: '1cMNadGQ10juZV6XHH7eLpUZyyN6dS2h41Hx2eR_eLOw',
  6: '17iq5ikoGaxGZok1AvLVqapfrJ25UnOrTzjel27_A4dc',
  7: '1bImwMoWwA2aDM7XEKP852tirwU0439xT3A840wWmGZ8',
  8: '1zOl3hwW0CdH46zPCuJhhyh7lyqZvf0I4sozhUYHid7E',
  9: '1g13goJHeKAtKZDDX07NnP4GxlAkXfVQ-w0gGIZM18AQ',
  10: '1zmopD7oFqZk5ZQj-wPXyvbMG8MW-v8ROIJD2D7nKgkI',
  11: '1jdl29m-v08PACWHxrmZCRqycmKwGrFVTa6I4P8cDbRM',
  12: '1701gKKXLTG_BEc0Vq4R-7B0Y1AN7Ukn4nPELWQuDBW4'
};

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', service: '科技文選分組報告與評分系統 GAS API' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    if (action === 'rate') {
      const { groupOrder, rating, avgScores, commentSummary } = payload;
      // 1. Append to group response sheet
      const sheetId = GROUP_RESPONSE_SHEETS[groupOrder];
      if (sheetId && rating) {
        const ss = SpreadsheetApp.openById(sheetId);
        const sheet = ss.getSheets()[0];
        const s = rating.scores;
        sheet.appendRow([
          rating.timestamp,
          rating.reviewerEmail,
          s.content,
          s.visuals,
          s.delivery,
          s.qna,
          s.teamwork
        ]);
      }

      // 2. Update master summary sheet row
      if (avgScores) {
        const master = SpreadsheetApp.openById(SUMMARY_SHEET_ID).getSheetByName('評分表');
        const rowIdx = 12 + Number(groupOrder);
        master.getRange(rowIdx, 6, 1, 5).setValues([[
          avgScores.content,
          avgScores.visuals,
          avgScores.delivery,
          avgScores.qna,
          avgScores.teamwork
        ]]);
        if (commentSummary !== undefined) {
          master.getRange(rowIdx, 12).setValue(commentSummary);
        }
      }

      return jsonResponse({ success: true });
    }

    if (action === 'updateInfo') {
      const { groupOrder, title, sourceUrl } = payload;
      const master = SpreadsheetApp.openById(SUMMARY_SHEET_ID).getSheetByName('評分表');
      const rowIdx = 12 + Number(groupOrder);
      if (title) master.getRange(rowIdx, 4).setValue(title);
      if (sourceUrl) {
        master.getRange(rowIdx, 5).setFormula(`=HYPERLINK("${sourceUrl}", "連結")`);
      }
      return jsonResponse({ success: true });
    }

    if (action === 'uploadFile') {
      const { groupOrder, fileName, mimeType, base64Data } = payload;
      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      const decoded = Utilities.base64Decode(base64Data);
      const blob = Utilities.newBlob(decoded, mimeType || 'application/octet-stream', `第${groupOrder}組_${fileName}`);
      const file = folder.createFile(blob);
      const driveUrl = file.getUrl();

      return jsonResponse({
        success: true,
        driveFileId: file.getId(),
        driveUrl: driveUrl
      });
    }

    return jsonResponse({ error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
