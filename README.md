# Paddock Pulse Live V0.6.7 — Race Tyre Timing Badge

基準：GitHub 已部署 V0.6.6。

## Race tyre placement
正賽輪胎現在和 FP / Qualifying 使用同一種圓形 S / M / H / I / W badge。

位置改為右側 Timing 數值旁：
- GAP 模式：`+3.421  [M]`
- INTERVAL 模式：`+0.742  [M]`
- IN PIT：`IN PIT  [M]`

不再把 `SOFT / MEDIUM / HARD ...` 文字放在車隊名稱後方。

正賽仍顯示「當下 stint」使用的輪胎；不會在正賽結束後切成最快圈輪胎。

## Driver chequered — 1 hour
V0.6.6 的 Server 邏輯已經是所有 finish phase 共用 1 小時期限，
因此 Race 也一樣：
- 官方 CHEQUERED 後，車手逐一過線才出現黑白 checker marker。
- finish phase 開始後 1 小時自動隱藏。
- DNF / Retired 不自動補旗。

FP / Qualifying 同樣維持 1 小時上限。

## 保留
- FP/Q LIVE 顯示當下輪胎，結束後顯示個人最快圈輪胎
- Race `IN PIT` 取代 GAP / INTERVAL
- Race LIVE 約 3 秒更新
- FP / Qualifying LIVE 約 5 秒
- Session Clock UTC anchor
- SC / VSC 黃色、Red Flag 紅色

## 上傳
覆蓋：
- `public/index.html`
- `server.js`
- `package.json`
- `README.md`
