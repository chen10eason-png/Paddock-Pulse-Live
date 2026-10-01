# Paddock Pulse Live Race PoC V0.3

V0.3 加入第一版 iPhone 優先 Live Race UI，保留 V0.2 的資料可靠性判斷。

- LIVE / FINAL / STALE / CONNECTING / OFFLINE / DEMO 狀態
- 賽事名稱、Session、Lap、Track Status
- 天氣摘要：氣溫、賽道溫度、濕度、風速
- P1–P22 排名
- Gap / Interval / Last Lap
- 輪胎 compound / tyre laps
- PIT 狀態
- Race Control 最新訊息
- 每 2 秒更新 `/api/live`
- `_kf` metadata 過濾
- FINAL 不會誤標 LIVE

Render 設定維持：Build `npm install`；Start `npm start`。
