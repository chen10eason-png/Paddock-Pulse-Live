# Paddock Pulse Live V0.6.4 — Race Visual & Clock Fix

依 2026/10/04 正賽實機測試修正。

## 1. 輪胎顏色
正賽 Timing Tower 的英文 compound 依標準顏色顯示：
- SOFT：紅
- MEDIUM：黃
- HARD：白
- INTERMEDIATE：綠
- WET：藍

## 2. Track 狀態
- SC：黃色
- VSC：黃色
- VSC ENDING：黃色
- YELLOW：黃色
- RED FLAG：紅色

顏色套在 TRACK 卡片本身，不只改文字。

## 3. Session Clock refresh / reopen
V0.6.3 在頁面刷新或關掉重開後，會重新以舊的 Remaining 當作新的起點。

V0.6.4 改為優先使用官方 ExtrapolatedClock 的 Utc anchor：
`effective remaining = Remaining - (現在時間 - 官方 anchor Utc)`

因此重新整理 / 重開時，會先校正到當下應有的剩餘時間，再繼續倒數。
官方 feed 若明確 `Extrapolating=false`（例如 session 暫停），倒數會停住，不自行扣時間。

## 4. Race 更新頻率
- Race LIVE：3 秒
- Practice / Qualifying LIVE：維持 5 秒
- Session Clock 畫面：仍每秒平滑顯示
- request 防重疊與 timeout 保留

## 上傳
只需覆蓋：
`public/index.html`

`server.js` 不必修改。
