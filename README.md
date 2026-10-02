# Paddock Pulse Live Race PoC V0.6

V0.6 = Live + Results Archive。

- 有正在進行中的 session：顯示 SignalR LIVE
- 沒有 live session：自動改顯示 F1 Live Timing Archive 最近完成的 session
- 歷史結果：可切換 2026 各站與 Practice / Qualifying / Sprint / Race
- Archive 直接讀官方 `livetiming.formula1.com/static/2026/Index.json`
- 每個 session 讀取官方 keyframe：SessionInfo / TimingData / TimingAppData / DriverList / WeatherData / RaceControlMessages / LapCount / TrackStatus / ExtrapolatedClock
- Archive proxy 由 Render backend 負責，避免前端 CORS / 403 問題
- 缺資料顯示 `—`，不自行猜測
