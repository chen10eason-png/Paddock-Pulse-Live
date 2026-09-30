# Paddock Pulse Live Race PoC V0.2

資料可靠性修正版。

- LIVE：Session 正在進行且 TimingData 30 秒內更新
- FINAL：Session 已 Finalised/Finished/Ended，或 ArchiveStatus Complete
- STALE：已有資料但不能確認仍為即時
- CONNECTING：已連線但尚未取得可判斷的 TimingData
- OFFLINE：F1 SignalR 未連線
- DEMO：只有 `/api/live?demo=1` 才啟用
- 過濾 SignalR `_kf` metadata，避免假車手
- 分離 `lastMessageAt` 與 `lastTimingAt`

Render 設定維持：Build `npm install`；Start `npm start`。
