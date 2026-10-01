# Paddock Pulse Live Race PoC V0.4

V0.4 聚焦 Live Race timing tower UI，保留 V0.3 已驗證的資料可靠性層。

## 新增
- 車隊色條
- P1 / P2 / P3 視覺強調
- GAP / INTERVAL 切換
- 全場最快圈標記（依 API `bestLap` 比較）
- PIT / OUT 狀態標籤
- 顯示 STOP 次數
- LAST / BEST Lap 同列
- Race Control 依 Yellow / Red / Green / Clear / Blue / SC/VSC / Penalty 分類
- LIVE / FINAL / STALE / CONNECTING / OFFLINE / DEMO 狀態保留
- 每 2 秒更新 `/api/live`

## 資料原則
只呈現 F1 Live Timing feed 已提供的資料；缺值顯示 `—`，不自行猜測或補值。

Render 設定維持：
- Build: `npm install`
- Start: `npm start`
