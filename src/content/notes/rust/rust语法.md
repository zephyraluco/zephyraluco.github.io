---
title: 'Rust语法补充'
description: 'Rust中非常见的语法问题'
order: 9
---

## rust循环标签

循环标签（Loop Labels）是 Rust 中用于标识循环的特殊语法，允许在嵌套循环中精确控制 `break` 和 `continue` 的目标循环。

### 语法

循环标签以单引号 `'` 开头，后跟标识符名称，放置在循环关键字之前：

```rust
'label_name: loop {
    // 循环体
}
```

- 循环标签必须以单引号 `'` 开头
- 标签名称遵循 Rust 标识符命名规则（通常使用 snake_case）
- 只能用于 `loop`、`while` 和 `for` 循环
- 不带标签的 `break` 和 `continue` 默认作用于最内层循环
- 标签的作用域仅限于其标记的循环体内

### 基本用法

**1. 标记单个循环**

```rust
'outer: loop {
    println!("进入外层循环");
    break 'outer;  // 跳出标记为 'outer 的循环
}
```

**2. 嵌套循环中的应用**

```rust
'outer: for i in 0..5 {
    'inner: for j in 0..5 {
        if i == 2 && j == 2 {
            break 'outer;  // 跳出外层循环
        }
        println!("i = {}, j = {}", i, j);
    }
}
```

**3. 使用 continue 跳过外层循环的当前迭代**

```rust
'outer: for i in 0..3 {
    for j in 0..3 {
        if j == 1 {
            continue 'outer;  // 跳过外层循环的当前迭代
        }
        println!("i = {}, j = {}", i, j);
    }
}
```

### 循环标签的返回值

循环标签可以与 `break` 一起返回值：

```rust
let result = 'outer: loop {
    for i in 0..10 {
        if i == 5 {
            break 'outer i * 2;  // 从标记的循环中返回值
        }
    }
};
println!("结果: {}", result);  // 输出: 结果: 10
```

## Rust表达式

> 在 Rust 中，虽然传统编程语言（如 C/C++）中的**左值（lvalue）** 和 **右值（rvalue）** 概念仍然具有一定的借鉴意义，但 Rust 官方文档和社区更倾向于使用 **“位置表达式（Place Expression）”** 和 **“值表达式（Value Expression）”** 这两个术语来描述表达式的类别。

### 位置表达式 (Place Expression)

**位置表达式（Place Expression）在传统概念中类似于左值（lvalue）**。

- **含义：** 位置表达式表示一个**内存位置**（place，即一个可以存储值的“家”）。这个位置拥有一个**地址**，并且在表达式使用结束后仍然**持续存在**。
- **特性：** 可以作为赋值操作符 `=` 的左操作数，因此可以**被赋值**或**被修改**

### 值表达式 (Value Expression)

- **含义：** 值表达式表示一个**实际的值**，它本身不一定对应一个长期稳定的内存位置。它通常是**临时的**，在表达式求值后就可能被销毁或移动。
- **特性：** 它可以作为赋值操作符 `=` 的右操作数，不能直接作为赋值操作符的左操作数。

### 位置和值表达式解引用

| 上下文 (Usage Context) | 目的 (Goal)                           | 必需条件 (Requirement)         | 调用的 Trait 方法 (Method Called) | 结果类别 (Result Category) |
| ---------------------- | ------------------------------------- | ------------------------------ | --------------------------------- | -------------------------- |
| **左值上下文**         | **修改**底层数据 (赋值, 可变借用)     | 表达式必须是**可变**的 (`mut`) | `DerefMut::deref_mut(&mut self)`  | **位置表达式** (`&mut T`)  |
| **右值上下文**         | **读取**底层数据 (使用值, 不可变借用) | 表达式可以是不可变或可变的     | `Deref::deref(&self)`             | **值表达式** (`&T`)        |

## 完全限定语法（Fully Qualified Syntax, UFCS）

- 类型有**固有方法（inherent method）**与 trait 方法同名，直接 `x.method()` 会产生二义性或优先选择固有方法。
- 同一个类型实现了**多个 trait**，这些 trait 定义了同名方法（方法冲突）。
- 需要访问 **trait 的关联类型或关联常量**：`<T as Trait>::AssociatedType` / `<T as Trait>::CONST`。
- 需要对 **泛型方法显式指定类型参数**。
- 想在 `impl` 内部显式调用另一个 trait 的实现（例如调用超 trait 的实现或另外一个 trait 的实现）。

```rust
trait MyRead {
    fn read(&self);
}

impl<T> MyRead for *mut T {
    fn read(&self) {
        println!("MyRead::read called");
    }
}

fn main() {
    let p: *mut i32 = std::ptr::null_mut();
    // 调用 trait 的 read（这里必须显式指定）
    <*mut i32 as MyRead>::read(&p);
    // 若要调用指针固有的 read（返回值的 unsafe 版本）
    // unsafe { p.read(); } // 这是固有方法（std::ptr::read）
}
```
