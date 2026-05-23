---
title: 'Rust宏系统'
description: 'Rust宏相关问题'
order: 3
---

> 主要分为两种：**声明式宏( *declarative macros* )** `macro_rules!` 和三种**过程宏( *procedural macros* )**

## 声明宏 `macro_rules!`

**声明宏也是将一个值跟对应的模式进行匹配，且该模式会与特定的代码相关联**。但是与 `match` 不同的是，**宏里的值是一段 Rust 源代码**(字面量)，模式用于跟这段源代码的结构相比较，一旦匹配，传入宏的那段源代码将被模式关联的代码所替换，最终实现宏展开。

```rust
#[macro_export] // 进行宏导出
macro_rules! vec {
    ( $( $x:expr ),* ) => {
        {
            let mut temp_vec = Vec::new();
            $(
                temp_vec.push($x);
            )*
            temp_vec
        }
    };
}
```

## 过程宏

第二种常用的宏就是[_过程宏_](https://doc.rust-lang.org/reference/procedural-macros.html) ( *procedural macros* )，从形式上来看，过程宏跟函数较为相像，但过程宏是使用源代码作为输入参数，基于代码进行一系列操作后，再输出一段全新的代码。<span style="background:#d3f8b6">(过程宏放入独立包的原因在于它必须先被编译后才能使用)</span>

Rust 过程宏的三种形式：

| 类型         | 声明方式                  | 作用位置        | 常见用途         |
| ------------ | ------------------------- | --------------- | ---------------- |
| **函数式宏** | `#[proc_macro]`           | 表达式 / item   | DSL、代码生成    |
| **派生宏**   | `#[proc_macro_derive]`    | `struct / enum` | 自动实现 trait   |
| **属性宏**   | `#[proc_macro_attribute]` | item            | 修改 / 包裹 item |

### 1. crate 类型

```rust
[lib]
proc-macro = true
```

### 2. 入口函数特征

- **必须在 proc-macro crate 中**
- **参数和返回值都是 `proc_macro::TokenStream`**

### 属性宏（Attribute Macro）

#### 1. 语法形式

```rust
#[my_attr(...)]
fn foo() {}
```

#### 2. 定义方式

```rust
#[proc_macro_attribute]
pub fn my_attr(attr: TokenStream, item: TokenStream)
    -> TokenStream
```

### 函数式宏（Function-like Macro）

#### 1. 语法形式

```rust
my_macro!(...);
```

#### 2. 定义方式

```rust
#[proc_macro]
pub fn my_macro(input: TokenStream) -> TokenStream
```

### 派生宏（Derive Macro）

#### 1. 语法形式

```rust
#[derive(MyDerive)]
struct A;
```

#### 2. 定义方式

```rust
#[proc_macro_derive(MyDerive, attributes(my_attr))]
pub fn derive_my(input: TokenStream) -> TokenStream
```

## 常用crates

```rust
extern crate proc_macro;
use proc_macro::TokenStream;
use quote::quote;
use syn;
use syn::DeriveInput;
#[proc_macro_derive(HelloMacro)]
pub fn hello_macro_derive(input: TokenStream) -> TokenStream {
    // 基于 input 构建 AST 语法树
    let ast:DeriveInput = syn::parse(input).unwrap();
    // 构建特征实现代码
    impl_hello_macro(&ast)
}

fn impl_hello_macro(ast: &syn::DeriveInput) -> TokenStream {
    let name = &ast.ident;
    let gen = quote! {
        impl HelloMacro for #name {
            fn hello_macro() {
                println!("Hello, Macro! My name is {}!", stringify!(#name));
            }
        }
    };
    gen.into()
}
```

### 总览关系图

```rust
TokenStream (输入)
        │
        ▼
   proc_macro2::TokenStream
        │
        ▼
      syn::parse
        │
        ▼
      syn AST
        │
        ▼
   quote! { ... }
        │
        ▼
 proc_macro2::TokenStream
        │
        ▼
 proc_macro::TokenStream (输出)

```

| Crate           | 职责                     | 本质         |
| --------------- | ------------------------ | ------------ |
| **proc_macro2** | 稳定、可测试的 Token API | Token 抽象层 |
| **syn**         | 将 Token 解析为 Rust AST | 解析器       |
| **quote**       | 从 AST / 变量生成 Token  | 代码生成器   |

## Questions

### 过程宏声明方式？

在 `Cargo.toml` 中：

```rust
[lib]
proc-macro = true
```

一旦设置：

- 该 crate **只能**作为过程宏 crate
- 编译产物是 **编译器插件**
- **不能**：
  - 导出普通库 API
  - 作为 runtime 依赖使用

| 阶段     | 普通 crate | proc-macro crate     |
| -------- | ---------- | -------------------- |
| 编译时机 | 被编译     | **先被编译并加载**   |
| 执行方式 | 运行时     | **编译期执行**       |
| 产物     | rlib / bin | **编译器插件 dylib** |

