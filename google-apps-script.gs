/**
 * ============================================================================
 * 科技文選 — 分組報告與線上評分系統 (Google Apps Script 雲端後端 API)
 * ============================================================================
 * 用途：讓部署於 GitHub Pages 的靜態網站可以直接讀寫 Google Sheets 總表、
 *       新增或覆寫（更新）各組回覆試算表中的學生評分，並將簡報存入 Google Drive。
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

function toFormScale1to5(score20) {
  const num = Number(score20 || 0);
  if (num <= 5) return Math.max(1, Math.min(5, Math.round(num)));
  return Math.max(1, Math.min(5, Math.round(num / 4)));
}

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
      const sheetId = GROUP_RESPONSE_SHEETS[groupOrder];

      // 1. Upsert (Update existing row if reviewerEmail already exists, else appendRow)
      if (sheetId && rating) {
        const ss = SpreadsheetApp.openById(sheetId);
        const sheet = ss.getSheets()[0];
        const s = rating.scores;
        const rowValues = [
          rating.timestamp,
          rating.reviewerEmail,
          toFormScale1to5(s.content),
          toFormScale1to5(s.visuals),
          toFormScale1to5(s.delivery),
          toFormScale1to5(s.qna),
          toFormScale1to5(s.teamwork)
        ];

        const data = sheet.getDataRange().getValues();
        const targetEmail = String(rating.reviewerEmail || '').trim().toLowerCase();
        let foundRowIndex = -1;
        for (let i = 1; i < data.length; i++) {
          const rowEmail = String(data[i][1] || '').trim().toLowerCase();
          if (rowEmail === targetEmail) {
            foundRowIndex = i + 1; // 1-indexed
            break;
          }
        }

        if (foundRowIndex > 1) {
          sheet.getRange(foundRowIndex, 1, 1, 7).setValues([rowValues]);
        } else {
          sheet.appendRow(rowValues);
        }
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
