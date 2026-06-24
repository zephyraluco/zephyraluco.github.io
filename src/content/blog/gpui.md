---
title: 'GPUI - 混合式GUI框架'
description: 'GPUI 是 Zed 的 GPU 加速 UI 框架，采用混合立即模式和保留模式的设计'
publishDate: '2026-06-22T00:00:00Z'
updatedDate: '2026-06-25T00:00:00Z'
tags:
  - GUI
  - wgpu
  - taffy
---

![alt text](/images/gpui.png)

## 基本概念

| 抽象        | 描述                                                                              | 主要用例                                                 |
| ----------- | --------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Entity**  | 由 GPUI 应用程序上下文拥有和管理的数据模型                                        | 存储并在 UI 不同部分之间传递共享的应用程序状态           |
| **View**    | `Entity` 的高层抽象，提供对组件状态的受控访问，它实现 `Render` trait 来构建元素树 | 构成应用程序界面的高级声明式 UI 组件                     |
| **Element** | UI 的基本构建块(元素节点)，它提供了一个命令式 API，用于对布局和绘制进行细粒度控制 | 低级 UI 原语、自定义布局以及性能关键型组件（如虚拟列表） |

### Entity实现

```rust
#[derive(Deref, DerefMut)]
pub struct Entity<T> {
    #[deref]
    #[deref_mut]
    pub(crate) any_entity: AnyEntity,
    pub(crate) entity_type: PhantomData<fn(T) -> T>,
}
```

### View实现

```rust
#[derive(Clone, Debug)]
pub struct AnyView {
    entity: AnyEntity,
    render: fn(&AnyView, &mut Window, &mut App) -> AnyElement,
    cached_style: Option<Rc<StyleRefinement>>,
}

impl<V: Render> From<Entity<V>> for AnyView {
    fn from(value: Entity<V>) -> Self {
        AnyView {
            entity: value.into_any(),
            render: any_view::render::<V>,
            cached_style: None,
        }
    }
}
```

### Element实现

```rust
pub trait Element: 'static + IntoElement {
type RequestLayoutState: 'static;
type PrepaintState: 'static;
fn id(&self) -> Option<ElementId>;
fn source_location(&self) -> Option<&'static panic::Location<'static>>;
fn request_layout(...) -> (LayoutId, Self::RequestLayoutState);
fn prepaint(...) -> Self::PrepaintState;
fn paint(...);
fn a11y_role(&self) -> Option<accesskit::Role>;
fn write_a11y_info(&self, _node: &mut accesskit::Node);
}
```

### 渲染生命周期

渲染生命周期由WindowInvalidator管理，通过DrawPhase枚举跟踪当前阶段

1. DrawPhase阶段

`DrawPhase`枚举定义了三个阶段 ：

- **None** - 未在绘制中
- **Prepaint** - 布局计算和hitbox插入
- **Paint** - 实际绘制到Scene

2. draw_roots流程

`draw_roots`是渲染的核心方法 ：

```rust
fn draw_roots(&mut self, cx: &mut App) {
    // 1. 设置Prepaint阶段
    self.invalidator.set_phase(DrawPhase::Prepaint);

    // 2. 布局根元素
    let mut root_element = self.root.as_ref().unwrap().clone().into_any();
    root_element.prepaint_as_root(Point::default(), root_size.into(), self, cx);

    // 3. 处理延迟绘制
    self.prepaint_deferred_draws(cx);

    // 4. 设置Paint阶段
    self.invalidator.set_phase(DrawPhase::Paint);

    // 5. 绘制元素
    root_element.paint(self, cx);

    // 6. 绘制延迟元素
    self.paint_deferred_draws(cx);
}
```

3. Element渲染

`request_layout`: 向Taffy布局引擎请求布局，返回LayoutId和RequestLayoutState

`prepaint`: 在布局完成后提交边界用于hitbox，返回PrepaintState

`paint`: 最终绘制到屏幕

## Action机制

> GPUI 的 Action 是一个**结构化事件描述对象**，当主动或者自动分发时，会向当前 Window 的 Action Dispatch Tree 投递一个 Action

### 宏实现

```rust
#[macro_export]
macro_rules! actions {
    ($namespace:path, [ $( $(#[$attr:meta])* $name:ident),* $(,)? ]) => {
        $(
            #[derive(::std::clone::Clone, ::std::cmp::PartialEq, ::std::default::Default, ::std::fmt::Debug, gpui::Action)]
            #[action(namespace = $namespace)]
            $(#[$attr])*
            pub struct $name;
        )*
    };
    ([ $( $(#[$attr:meta])* $name:ident),* $(,)? ]) => {
        $(
            #[derive(::std::clone::Clone, ::std::cmp::PartialEq, ::std::default::Default, ::std::fmt::Debug, gpui::Action)]
            $(#[$attr])*
            pub struct $name;
        )*
    };
}
```

### 使用方式

```rust
actions!(
    action_example,
    [
        IncrementCounter,
        DecrementCounter,
        ResetCounter,
    ]
);
```

等价于：

```rust
#[derive(Clone, PartialEq, Default, Debug, gpui::Action)]
#[action(namespace = action_example)]
pub struct IncrementCounter;

#[derive(Clone, PartialEq, Default, Debug, gpui::Action)]
#[action(namespace = action_example)]
pub struct DecrementCounter;

#[derive(Clone, PartialEq, Default, Debug, gpui::Action)]
#[action(namespace = action_example)]
pub struct ResetCounter;
```

如果使用的action需要携带参数，则必须使用手动声明

### 事件绑定

- 键盘快捷键
- 鼠标事件
- 菜单点击
- 程序调用

## Task

是一个实现了 `Future` 的句柄，也是控制后台任务执行的主要机制

### 任务句柄与控制

`Task` 包装了实际运行的任务，提供了对任务生命周期的控制

- **取消任务**：丢弃 `Task` 会立即取消正在运行的任务(手动`Drop`或生命周期结束)
- **独立运行**：调用 `detach()` 让任务在后台独立运行，无法再获取结果
- **检查状态**：通过 `is_ready()` 检查任务是否完成

### TaskState 枚举

`Task` 内部使用 `TaskState<T>` 枚举来表示不同的任务状态

```rust
enum TaskState<T> {
Ready(Option<T>), // 已准备好返回值
Spawned(async_task::Task<T, RunnableMeta>), // 正在运行的任务
Downcast { ... }, // 类型擦除后的视图
}
```

### 获取结果

等待后台任务调度完成：
```rust
let task = cx.background_spawn(async move { compute() });
let result = task.await?;
```
立刻执行返回结果：
```rust
cx.background_spawn(async move {
do_work().log_err().await;
}).detach();
```
