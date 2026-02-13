---
title: 'Rust错误处理'
description: 'Rust中错误层次结构'
order: 8
---

## Error的层次结构

```rust
┌──────────────────────────────┐
│ panic! (致命错误, 不可恢复)  │
├──────────────────────────────┤
│ std::error::Error trait      │ ← 所有“可恢复错误”的统一接口
├──────────────────────────────┤
│ 标准库错误类型               │
│ ├─ std::io::Error            │
│ ├─ std::fmt::Error           │
│ ├─ std::num::ParseIntError   │
│ └─ std::str::Utf8Error       │
├──────────────────────────────┤
│ 自定义错误类型（组合层）     │ ← 你定义的 ApplicationError / LibError 等,只需要实现std::error::Error trait即可
│ └─ 封装、聚合底层错误类型     │
└──────────────────────────────┘
```

## 常用组合

- **`thiserror`**：定义自定义错误类型（library 级别，typed error）
- **`anyhow`**：简化错误传播与封装（application 级别，untyped error）
