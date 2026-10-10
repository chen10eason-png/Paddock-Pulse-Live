# Paddock Pulse Live V0.7.1 — Classification Dim Fix

## 修正
V0.7.0 的標籤與變暗條件不是完全同一套：

- 標籤會依 `x.dnf` 或 `classificationLabel` 顯示。
- 但車手列變暗只看 `x.retired` 或 `classificationLabel`。

因此某些 `Stopped=true / Retired=false` 的 DNF 會顯示 `DNF`，但整列不會變暗。

## V0.7.1
統一規則：

凡是已顯示非正常完賽狀態，都會同步變暗：
- DNF
- DNS
- DSQ
- NC

前端車手列改用：
`x.dnf || x.classificationLabel`

不再只看 `x.retired`。

## 其他功能不變
- Jolpica 歷史分類補強
- DNS 缺席車手補回
- Q/SQ 分段方格旗
- 所有 Session 方格旗 1 小時後隱藏
- IN PIT 車隊色
- Race/Sprint 約 3 秒更新
- FP/Q 約 5 秒更新

## 上傳
覆蓋：
- `public/index.html`
- `server.js`
- `package.json`
- `README.md`
