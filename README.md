# Paddock Pulse Live Race PoC V0.6.1

Session-aware Timing Tower。

- FP1 / FP2 / FP3：顯示 Position / Best Lap / Gap to Fastest / Gap to car ahead / Laps
- Qualifying / Sprint Qualifying：顯示 Best Lap / Gap to P1，若 F1 feed 提供 `BestLapTimes` 則列出 Q1 / Q2 / Q3
- Race / Sprint：維持 Race Gap / Interval / Last Lap / Best Lap
- Practice / Qualifying 的 GAP 優先使用 F1 `Stats.TimeDiffToFastest`；沒有時才由 Best Lap 數學計算
- 不猜測缺失圈速；無資料顯示 `—`
