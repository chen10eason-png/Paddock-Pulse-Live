# Paddock Pulse Live V0.6.2 — Stable Live Refresh

這版針對 FP3 實機測試修正「畫面要手動刷新才看到新的個人最快圈／Session 剩餘時間不動」。

## 更新
- LIVE 時採約 5 秒輪詢，不追求 1–2 秒，優先穩定
- request 尚未回來時不重疊第二個 request
- 每次 request 有 7 秒 timeout，避免 Safari / Render request 卡住
- 使用遞迴 `setTimeout`，不使用會疊 request 的固定 `setInterval`
- 新的個人 Best Lap 會在下一次成功輪詢後自動更新
- FASTEST 標記與 GAP to Fastest 每次 render 都重新計算
- 個人最快圈更新時該列會短暫亮一下
- Session Clock 每秒顯示更新；只有 F1 feed 明確 `Extrapolating=true` 時才本地倒數
- STALE 但 TimingData 仍在 90 秒內時保留 live 畫面，避免瞬間跳回 Archive
- 非 LIVE 狀態降至約 20 秒檢查，減少 Render Free 負擔
- History / Archive 模式不做高頻刷新

## 上傳
覆蓋：
`public/index.html`

後端 `server.js` 不必修改；V0.6.2 使用既有 V0.6.1 API contract。
