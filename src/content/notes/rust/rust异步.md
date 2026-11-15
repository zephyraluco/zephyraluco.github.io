---
title: '异步编程'
description: 'Rust异步相关问题'
order: 1
---

## async和await
Future 是 Rust 异步模型的核心抽象：一个可被 poll 的延迟计算**状态机**，用于表达“未来会完成的值”

Rust 的异步设计有两个最核心的特点：
1. **无堆分配（Zero-cost / No implicit allocation）**：异步任务在未显式要求时，不需要在堆（Heap）上分配内存。
2. **基于状态机（State Machine）**：编译器将你的异步代码转化为一个结构体状态机。
### 什么是Future
一切的基石是标准库中的 `std::future::Future` Trait。它的定义大致如下：
```rust
pub trait Future {
    type Output;

    // 核心方法：尝试推进 Future 的状态
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}

pub enum Poll<T> {
    Ready(T),   // 任务完成，返回结果
    Pending,    // 任务未完成，当前被阻塞，已让出 CPU
}
```
### async
`async` 关键字是一个**语法糖**。无论是 `async fn` 还是 `async` 块/表达式，编译器在幕后都会把它们转换成一个实现了 `std::future::Future` 的状态机  
异步函数：
```rust
async fn add(x: i32, y: i32) -> i32 {
    x + y
}
```
编译器展开代码：
```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

// ==========================================
// 1. 编译器生成的匿名枚举（状态机）
// ==========================================
enum __AddFutureStateMachine {
    // 初始状态：保存了传入的参数，等待被第一次 poll
    Start { x: i32, y: i32 },
    // 结束状态：任务已经执行完毕，不再持有任何数据
    Done,
}

// ==========================================
// 2. 为该状态机实现 Future Trait
// ==========================================
impl Future for __AddFutureStateMachine {
    type Output = i32; // 异步函数的返回值类型

    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {
        // 通过 get_mut 安全地获取不可移动的底层可变引用
        //（因为这个结构不包含自引用，所以直接取出来是安全的）
        let this = unsafe { self.get_unchecked_mut() };

        // 核心：通过 match 驱动状态转移
        match this {
            __AddFutureStateMachine::Start { x, y } => {
                // 1. 计算结果（执行原函数体内的同步代码）
                let result = *x + *y;
                
                // 2. 状态转移：将自身标记为已完成（Done），释放入参占用的内存
                *this = __AddFutureStateMachine::Done;
                
                // 3. 返回 Ready 状态和结果
                Poll::Ready(result)
            }
            __AddFutureStateMachine::Done => {
                // 如果一个 Future 已经 Ready 了，Runtime 再次 poll 它属于非法操作
                panic!("polled AddFutureStateMachine after completion");
            }
        }
    }
}

// ==========================================
// 3. 最终的外壳函数
// ==========================================
fn add(x: i32, y: i32) -> impl Future<Output = i32> {
    // 实例化这个状态机，并将其作为 Future 返回
    __AddFutureStateMachine::Start { x, y }
}
```
当编译器看到 `async` 块或函数时，它会：
1. 分析里面有哪些 `.await` 点
2. 将这个异步块编译成一个定制的 `enum`（状态机）
3. 每一个 `.await` 就是状态机的一个状态
4. 当驱动（`poll`）这个 `Future` 时，它会执行到下一个 `.await` 处。如果数据没准备好，就返回 `Poll::Pending` 并让出 CPU；如果准备好了，就跳转到下一个状态，直到最终返回 `Poll::Ready(Output)`