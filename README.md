# Paddock Pulse Live V0.6.8 — Official Finish Expiry

## 修正：方格旗超過 1 小時仍存在

V0.6.6 / V0.6.7 雖然有 1 小時限制，但起點用的是 Server 當下時間。
所以 Render / Server 重新啟動時，可能把「現在」重新當成 Session 結束時間，
讓已經結束很久的 Race / FP / Qualifying 又多顯示一小時方格旗。

## V0.6.8

所有 Session 的 per-driver chequered 改成以官方 Session 結束時間為基準：

- Race / Sprint：優先使用 Race Control `CHEQUERED` 訊息的 UTC timestamp。
- FP / Qualifying：優先使用 `ExtrapolatedClock.Utc + Remaining` 算出的官方 Session end。
- fallback：使用 `SessionInfo` 的 EndDate / EndTime。

因此：
- Server restart 不會重新開始一小時計時。
- 頁面 refresh / 關掉重開不會重新開始一小時計時。
- Race / FP / Qualifying / Sprint 都使用同一條規則。
- 官方 Session 結束時間 + 1 小時後，所有車手方格旗都必須隱藏。

## 其他功能不變
- 每位車手各自過線才出現黑白 checker marker
- DNF / Retired 不自動補旗
- Race tyre badge 在 GAP / INTERVAL / IN PIT 旁
- FP/Q tyre badge 在最快圈時間旁
- Race 約 3 秒更新
- FP/Q 約 5 秒更新

## 上傳
覆蓋：
- `public/index.html`
- `server.js`
- `package.json`
- `README.md`
