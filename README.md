# Paddock Pulse Live V0.6.5 — Driver Chequered

這是 V0.6.5 的更正版；未使用先前「TRACK 全場方格旗」設計。

## FP / Qualifying 輪胎
- LIVE：顯示車手當下使用的 compound。
- Session 結束：顯示該車手跑出個人最快圈時使用的 compound。
- Server 在 Best Lap 更新時記錄當下 tyre compound。
- 無法確認就不猜。

## Race — IN PIT
- 正賽 `InPit=true` 時，GAP / INTERVAL 主位置改成 `IN PIT`。
- 出 pit 後恢復差距。
- Last Lap / Best Lap 保留。

## 方格旗：每位車手個別顯示
方格旗不再放在 TRACK 卡。

### FP / Qualifying
- Session 時間到 00:00 後進入 finish phase。
- 還在最後一圈的車手先維持正常顯示。
- 該車手下一次通過終點線（TimingData 的 lap / last-lap 更新）後，
  才在自己的車手列顯示 `🏁`。

### Race
- 收到官方 Race Control `CHEQUERED` 後進入 finish phase。
- 當下 P1 先顯示 `🏁`。
- 其他車手之後各自通過終點線時，再逐一顯示 `🏁`。
- DNF / Retired 不因 session 結束而自動補旗。

TRACK 卡仍只顯示賽道全場狀態：
GREEN / YELLOW / SC / VSC / RED FLAG 等。

## 保留 V0.6.4
- Race LIVE 約 3 秒輪詢
- FP / Qualifying LIVE 約 5 秒
- Session Clock UTC anchor 修正
- SC / VSC 黃色、Red Flag 紅色
- 輪胎標準顏色
- request 防重疊與 timeout

## 上傳
覆蓋：
- `public/index.html`
- `server.js`
- `package.json`
- `README.md`
