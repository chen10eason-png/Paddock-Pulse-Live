# Paddock Pulse Live V0.6.9 — Quali Phase Flags & DNF

## Q1/SQ1 → Q2/SQ2 → Q3/SQ3 方格旗
- Q1/SQ1 結束：完成最後一圈的車手出現黑白 checker。
- Q2/SQ2 開始後：有晉級的車手，上一段 checker 會移除。
- 未晉級車手可保留上一段完成狀態。
- Q2/SQ2 結束後，晉級車手完成最後一圈再出現 checker。
- Q3/SQ3 同理。
- 所有 checker 仍受「官方 Session 結束 + 1 小時」限制。

Phase 使用 TimingData 的 BestLapTimes 判斷；晉級名單優先依 KnockedOut，
必要時用當下 classification cut line fallback（Q2 top 15、Q3 top 10）。

## DNF 修正
之前前端只看 `Retired`，因此部分 `Stopped=true`、`Retired=false` 的正賽車手會漏掉 DNF。

V0.6.9：
- Race / Sprint：`Retired` 或 `Stopped` 都會顯示 DNF。
- Qualifying 的 `KnockedOut` 不會被誤標為 DNF。
- FP/Q 一般停車不直接當成 DNF。

## IN PIT 顏色
`IN PIT` 改用車手所屬車隊顏色，不再固定黃色。

## 保留
- Race tyre badge 在 GAP / INTERVAL / IN PIT 旁
- FP/Q tyre badge 在最快圈時間旁
- Race 約 3 秒更新
- FP/Q 約 5 秒更新
- 官方 Session 結束 + 1 小時後 checker 隱藏
- SC / VSC 黃色、Red Flag 紅色

## 上傳
覆蓋：
- `public/index.html`
- `server.js`
- `package.json`
- `README.md`
