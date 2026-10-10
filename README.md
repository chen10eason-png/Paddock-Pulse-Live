# Paddock Pulse Live V0.7.2 — Qualifying Phase Flags

## Q1 / Q2 / Q3（SQ1 / SQ2 / SQ3）顯示
- 每個 Qualifying Session 重新從 Q1 / SQ1 開始。
- Server 回傳目前 `qualifyingStage`。
- Live 偵測官方 ExtrapolatedClock 從約 00:00 重設到下一段時間時，立即切 Q1→Q2、Q2→Q3。
- TimingData BestLapTimes 保留作 fallback。
- 跑 Q1 顯示 Q1；跑 Q2 顯示 Q2；跑 Q3 顯示 Q3。

## 晉級車手下一段開始時清除上一段方格旗
- Q1/SQ1 結束後，完成該段的車手出旗。
- Q2/SQ2 開始時，只清除晉級車手的上一段方格旗。
- 沒晉級的車手保留上一段方格旗。
- Q3/SQ3 同理。
- 非晉級車手的方格旗在段落切換期間仍保持可見。

## 時間到時人在 PIT
Qualifying / Sprint Qualifying 某車手在該段時間歸零時已經在 PIT：
- 直接視為該段已完成。
- 立即顯示個人方格旗，不需要再等一次過線 TimingData。

## 保留
- 最終 Session 結束後 1 小時內顯示 checker，之後隱藏
- DNF / DNS / DSQ / NC 歷史分類補強與變暗
- IN PIT 使用車隊顏色
- Race/Sprint 約 3 秒更新
- FP/Q 約 5 秒更新
- tyre badge 邏輯不變

## 上傳
覆蓋：
- `public/index.html`
- `server.js`
- `package.json`
- `README.md`
