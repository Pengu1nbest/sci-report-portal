# 科技文選 — 分組報告與線上評分系統 (`sci-report-portal`)

提供報告學生以學校 Google 信箱（`s學號@stu.edu.tw`）登入、查看 12 組評分總表（五項指標各 20 分，滿分 100 分）、線上同儕評分、上傳本組報告簡報，以及管理員（`s25101114@stu.edu.tw`）後台與帳號管理、匯出所有組別分數總覽 Excel (`.xlsx`)。

---

## 在 Windows 本地端 (`D:\coding_stuff\sci-report-portal`) 啟動方式

### 方法一：雙擊一鍵啟動（推薦）
1. 將專案解壓縮或放置於 `D:\coding_stuff\sci-report-portal`。
2. 直接雙擊資料夾內的 **`start.bat`**。
3. 腳本會自動檢查並安裝所需套件（`npm install`），啟動伺服器並自動在瀏覽器開啟 `http://localhost:3000`。

### 方法二：使用終端機 (PowerShell / CMD)
```powershell
cd D:\coding_stuff\sci-report-portal
npm install
npm start
```
接著在瀏覽器開啟 `http://localhost:3000`。

---

## 預設帳號與權限說明
- **系統主管理員**：`s25101114@stu.edu.tw`（學號：`25101114`，第 5 組 張亦傑）
  - 擁有完整後台權限：新增/編輯/停用/刪除帳號、切換其他學生管理員權限、代傳各組報告檔案、管理評分紀錄，以及**一鍵匯出所有組別分數總覽 Excel (`.xlsx`)**。
- **第 1～12 組學生帳號**：輸入各自的學校信箱（例如 `s25101101@stu.edu.tw`）或學號即可登入對應組別。
