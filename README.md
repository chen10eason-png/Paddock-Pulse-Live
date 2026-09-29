# Paddock Pulse Live Race PoC V0.1

目的：先獨立驗證免費 F1 Live Timing，再整合正式 Paddock Pulse。

## 資料
- Formula 1 live timing SignalR feed
- TimingData / TimingAppData / DriverList
- LapCount / TrackStatus / WeatherData / RaceControlMessages
- 不使用付費 OpenF1
- 不處理 F1 TV 影片

## 執行
1. 安裝 Node.js 18+
2. `npm install`
3. `npm start`
4. 瀏覽 `http://localhost:3000`

沒有 live session 時，`/api/live` 自動回傳 DEMO 資料，方便測 UI。
強制 Demo：`http://localhost:3000/?demo=1`

## 正式整合原則
這個 PoC 不會取代目前 Paddock Pulse。先驗證一場真正 session 的穩定性，再把 Live 卡片/頁面併入 PWA。
