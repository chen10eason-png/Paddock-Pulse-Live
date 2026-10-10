# Paddock Pulse Live V0.7.0 — Historical Classification

## 問題
V0.6.9 對 Live 的 DNF 判斷已加入 `Retired / Stopped`，
但歷史 Race / Sprint 仍只靠 F1 Live Timing Archive。

這不足以完整還原：
- DNF
- DNS
- DSQ
- NC

而且 DNS 車手有時根本不會存在於 Live Timing rows。

## V0.7.0

歷史 Race / Sprint 在 F1 Live Timing Archive 之外，
再用 Jolpica Ergast-compatible results 做「正式分類補強」。

### 顯示
- `DNF`：官方 positionText = R
- `DNS`：官方 status = Did not start，或 positionText = W
- `DSQ`：官方 Disqualified / positionText = D
- `NC`：官方 Not classified / positionText = N
- Finished / +1 Lap / +2 Laps 等正常完賽不標 DNF

### 重要
- Live Race / Sprint 仍以 F1 Live Timing 為主，不等待 Jolpica。
- Jolpica 只補 Session 結束 / 歷史結果。
- 如果 Jolpica 暫時取不到資料，就保留原本 F1 Archive 結果，不猜。
- 如果 DNS 車手完全不在 Live Timing Archive，會從正式結果補回車手列。

## 其他 V0.6.9 功能保留
- Q1/SQ1 → Q2/SQ2 → Q3/SQ3 晉級車手清除上一段方格旗
- 所有 Session 方格旗官方結束後 1 小時隱藏
- IN PIT 使用車隊顏色
- Race/Sprint 約 3 秒更新
- FP/Q 約 5 秒更新
- Race tyre badge 在 Timing 旁
- FP/Q tyre badge 在最快圈時間旁

## 上傳
覆蓋：
- `public/index.html`
- `server.js`
- `package.json`
- `README.md`
