# Paddock Pulse Live V0.6.6 — Tyre Badge & Flag Polish

基準：GitHub 已部署的 V0.6.5 Driver Chequered。

## FP / Qualifying 輪胎
- 不再在輪胎前加 `BEST`。
- LIVE：顯示車手當下使用的輪胎。
- Session 結束：顯示車手跑出個人最快圈時使用的輪胎。
- 輪胎移到最快圈時間右側，以圓形 badge 顯示：
  - S = Soft
  - M = Medium
  - H = Hard
  - I = Intermediate
  - W = Wet
- badge 使用對應輪胎顏色。

## Driver Chequered
- 仍是每位車手個別出現，不是全場 TRACK 狀態。
- 移除 emoji 方格旗。
- 改成單純黑白相間 checker marker。
- FP / Qualifying：時間到後，車手完成最後一圈才出現。
- Race：官方 CHEQUERED 後，車手逐一過線才出現。
- DNF / Retired 不自動補旗。

## 顯示期限
- 方格旗只在 finish phase 開始後 1 小時內顯示。
- 超過 1 小時自動隱藏。

## 保留
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
