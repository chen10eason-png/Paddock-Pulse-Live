# Paddock Pulse Live V0.6.3 — Qualifying Continuity

依實機排位賽測試修正兩個問題：

1. Session Clock 不會持續倒數／會跳回舊時間。
2. Q1→Q2、Q2→Q3 的空檔會錯誤切回上一個 Archive（例如 FP3）。

## Session Clock
- 仍每秒更新畫面。
- F1 API 每 5 秒回傳相同 Remaining 時，不再重新把倒數基準設回原值。
- 只在 F1 feed 的 Remaining 真正變更、Session 改變或階段重設時重新校準。
- Practice / Qualifying / Race 的 live session 會本地連續倒數。
- FINAL / Finished 不繼續倒數。

## Qualifying continuity
- Q1/Q2/Q3 間隔期間保留目前 Qualifying live snapshot。
- 不會因短暫 STALE / 非 LIVE 就退回 FP3。
- Archive 只有在追上同一 Session，或 live session 已可安全結束時才接管。
- 畫面新增 Q1 / Q2 / Q3（Sprint Qualifying 則 SQ1 / SQ2 / SQ3）標示。
- 階段只使用 F1 feed 的 BestLapTimes 判斷；空檔維持上一階段，等下一階段真的有資料再切換。

## 保留 V0.6.2
- LIVE 約 5 秒輪詢
- request 防重疊
- 7 秒 timeout
- Best Lap / FASTEST / GAP 自動更新

## 上傳
只需覆蓋：`public/index.html`

`server.js` 不必修改。
