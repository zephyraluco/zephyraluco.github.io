---
title: 'C++版本特性'
description: 'C++17、C++20、C++23 的新特性和库扩展'
order: 1
---

## C++17

> **从 C++11 到 C++17 的演进**：C++11 奠基现代 C++，C++14 优化表达，C++17 增强实用性和库（如文件系统和并行）。这些升级减少了 boilerplate 代码，提高了性能（移动语义、并行）和安全性（智能指针、属性）。

### 新特性

- **结构化绑定（Structured Bindings）**

```cpp
auto [it, inserted] = myset.insert(42);
auto [x, y, z] = std::make_tuple(1, 2.0, "hello");
```

- **`if`/`switch` 初始化语句**

```cpp
if (auto it = mp.find(k); it != mp.end()) {
    // 使用 it
}

switch (auto val = getValue(); val) {
    case 1: break;
    case 2: break;
}
```

- **`if constexpr` 编译期条件分支**

```cpp
template<typename T>
void process(const T& x) {
    if constexpr (std::is_integral_v<T>) {
        // 整型处理
    } else {
        // 其他类型处理
    }
}
```

- **折叠表达式（Fold Expressions）**

```cpp
template<typename... Ts>
auto sum(Ts... xs) {
    return (xs + ...);  // 一元右折叠
}

template<typename... Ts>
void print(Ts... args) {
    (std::cout << ... << args) << '\n';  // 二元左折叠
}
```

- **内联变量（Inline Variables）**

```cpp
inline constexpr double pi = 3.14159;
inline std::string global_name = "default";
```

- **类模板实参推导（CTAD）**

```cpp
std::pair p{1, 2.0};           // 推导为 std::pair<int, double>
std::vector v{1, 2, 3};        // 推导为 std::vector<int>
std::mutex m;
std::lock_guard lock{m};       // 推导为 std::lock_guard<std::mutex>
```

- **嵌套命名空间**：`namespace a::b::c { }`

- **属性（Attributes）**
  - `[[nodiscard]]`：警告忽略返回值
  - `[[maybe_unused]]`：抑制未使用警告
  - `[[fallthrough]]`：标记 switch 穿透

- **`auto` 非类型模板参数**

```cpp
template<auto N>
struct Value {
    static constexpr auto value = N;
};

Value<42> v1;      // N 推导为 int
Value<3.14> v2;    // N 推导为 double
```

- **保证的拷贝省略**：prvalue 物化规则调整，强制省略拷贝

- **异常规范简化**：移除 `throw(T)`，`throw()` 等同 `noexcept(true)`

### 标准库扩展

- **值语义工具**
  - `<any>`：类型安全的任意类型容器
  - `<optional>`：可选值类型
  - `<variant>`：类型安全的联合体

```cpp
std::optional<int> opt = 42;
if (opt.has_value()) {
    std::cout << *opt;
}

std::variant<int, double, std::string> v = "hello";
std::cout << std::get<std::string>(v);
```

- **视图类**：`<string_view>`（轻量级字符串视图，避免拷贝）

```cpp
void process(std::string_view sv) {
    // 无拷贝访问字符串
}
```

- **文件系统**：`<filesystem>`

```cpp
namespace fs = std::filesystem;
fs::path p = "/path/to/file";
if (fs::exists(p)) {
    fs::copy(p, "/backup/file");
}
```

- **并行算法**：`<execution>`

```cpp
std::vector<int> v(1000000);
std::sort(std::execution::par, v.begin(), v.end());  // 并行排序
```

- **低开销数值转换**：`<charconv>`

```cpp
char buf[10];
auto [ptr, ec] = std::to_chars(buf, buf + 10, 42);
```

- **多读单写互斥**：`<shared_mutex>`

```cpp
std::shared_mutex mtx;
std::shared_lock lock(mtx);  // 读锁
std::unique_lock lock2(mtx); // 写锁
```

- **多互斥体锁守卫**：`std::scoped_lock`（无死锁）

```cpp
std::scoped_lock lock(mutex1, mutex2, mutex3);
```

- **PMR 内存资源**：`<memory_resource>`

```cpp
std::pmr::vector<int> vec;
std::pmr::string str;
```

- **实用工具**
  - `std::invoke`：统一调用函数对象
  - `std::apply`：展开 tuple 调用函数
  - `std::clamp`：限制值范围
  - `std::byte`：字节类型
  - `std::as_const`：转换为 const
  - `std::not_fn`：函数取反

- **容器增强**
  - `try_emplace`、`insert_or_assign`
  - `extract`/`merge` 节点句柄

---

## C++20

### 新特性

- **Concepts（概念）**

```cpp
template<typename T>
concept Addable = requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
};

template<Addable T>
T add(T a, T b) { return a + b; }
```

- **Ranges（范围）**

```cpp
auto result = numbers
    | std::views::filter([](int n) { return n % 2 == 0; })
    | std::views::transform([](int n) { return n * 2; })
    | std::views::take(5);
```

- **协程（Coroutines）**

```cpp
generator<int> fibonacci() {
    int a = 0, b = 1;
    while (true) {
        co_yield a;
        auto next = a + b;
        a = b; b = next;
    }
}
```

- **模块（Modules）**

```cpp
// math.ixx
export module math;
export int add(int a, int b) { return a + b; }

// main.cpp
import math;
int main() { return add(1, 2); }
```

- **三路比较运算符（`<=>`）**

```cpp
struct Point {
    int x, y;
    auto operator<=>(const Point&) const = default;
};
```

- **指定初始化器（Designated Initializers）**

```cpp
struct Point { int x, y; };
Point p{.x = 10, .y = 20};
```

- **`constinit`**：保证编译期初始化

```cpp
constinit int global = 42;
```

- **`consteval`**：强制编译期求值

```cpp
consteval int square(int n) { return n * n; }
```

- **`[[likely]]` / `[[unlikely]]`**：分支预测提示

```cpp
if (condition) [[likely]] {
    // 可能执行的分支
}
```

- **Lambda 改进**
  - 模板 lambda：`[]<typename T>(T x) { }`
  - 捕获 `this`：`[=, this]`
  - 默认构造和赋值

### 标准库扩展

- **Ranges 库**：`<ranges>`

```cpp
auto even = [](int n) { return n % 2 == 0; };
auto result = std::views::iota(1, 100)
            | std::views::filter(even)
            | std::views::take(10);
```

- **`std::span`**：无拷贝数组视图

```cpp
void process(std::span<int> data) {
    for (int& x : data) x *= 2;
}
```

- **格式化库**：`<format>`

```cpp
std::string s = std::format("x={}, y={}", 10, 20);
```

- **并发与同步**
  - `std::jthread`：自动 join 的线程
  - `<stop_token>`：停止令牌
  - `std::atomic::wait/notify_one/notify_all`
  - `<latch>`、`<barrier>`、`<semaphore>`
  - `std::atomic_ref`

```cpp
std::jthread t([](std::stop_token st) {
    while (!st.stop_requested()) {
        // 工作
    }
});
// 自动 join
```

- **位操作**：`<bit>`

```cpp
std::bit_cast<float>(0x3f800000);
std::endian::native;
std::countl_zero(0b00001111);
```

- **数学常数**：`<numbers>`

```cpp
std::numbers::pi;
std::numbers::e;
```

- **诊断与实用**
  - `<source_location>`：源码位置信息
  - `std::type_identity`
  - `std::remove_cvref`
  - `std::bind_front`

- **同步流**：`<syncstream>`

```cpp
std::osyncstream(std::cout) << "thread-safe output\n";
```

- **时间库扩展**：`<chrono>`

```cpp
using namespace std::chrono;
auto now = system_clock::now();
year_month_day ymd{2023y/January/1};
zoned_time zt{"America/New_York", now};
```

- **`constexpr` 扩展**：多数 `<algorithm>` 和容器（`std::vector`、`std::string`）支持 `constexpr`

---

## C++23

### 新特性

- **显式对象参数（Deducing `this`）**

```cpp
struct S {
    void foo(this S& self) { /* 可以显式指定 this 的类型 */ }
    void bar(this S const& self) { /* 支持 const */ }
    template<typename Self>
    void generic(this Self&& self) { /* 完美转发 */ }
};
```

- **`if consteval`** - 编译期与运行期分支

```cpp
constexpr int f() {
    if consteval {
        return 42;  // 编译期执行
    } else {
        return compute();  // 运行期执行
    }
}
```

- **多维下标运算符**

```cpp
auto value = matrix[i, j];  // C++23 支持多维下标
```

- **`#warning` 预处理指令**

```cpp
#warning "This code needs review"
```

- **`auto(x)` 和 `auto{x}` 衰退拷贝**

```cpp
auto decay_copy = auto(x);  // 强制衰退拷贝
```

- **`constexpr` 扩展**：`std::unique_ptr`、`std::optional`、`std::variant` 等更多类型支持 `constexpr`

- **字面量后缀改进**：`uz`/`z` 用于 `size_t`/`ptrdiff_t`

```cpp
auto size = 42uz;  // std::size_t
```

### 标准库扩展

- **错误处理**：`<expected>`（`std::expected<T, E>` 用于返回值或错误）

```cpp
std::expected<int, std::string> divide(int a, int b) {
    if (b == 0) return std::unexpected("Division by zero");
    return a / b;
}
```

- **多维数组视图**：`<mdspan>`（`std::mdspan` 零开销多维数组访问）

```cpp
std::mdspan<int, std::extents<int, 3, 4>> matrix(data);
auto value = matrix[i, j];
```

- **格式化输出**：`<print>`（`std::print`/`std::println` 替代 `std::cout`）

```cpp
std::print("x = {}, y = {}\n", x, y);
std::println("Hello, {}!", name);
```

- **扁平容器**：`<flat_map>`、`<flat_set>`（基于连续内存的关联容器）

```cpp
std::flat_map<int, std::string> map;  // 更好的缓存局部性
```

- **协程生成器**：`<generator>`（`std::generator<T>` 简化协程使用）

```cpp
std::generator<int> fibonacci() {
    int a = 0, b = 1;
    while (true) {
        co_yield a;
        auto next = a + b;
        a = b; b = next;
    }
}
```

- **栈追踪**：`<stacktrace>`（`std::stacktrace` 用于调试）

```cpp
auto trace = std::stacktrace::current();
std::println("{}", trace);
```

- **Ranges 增强**：
  - `std::ranges::to<Container>()` - 将 range 转换为容器
  - `std::views::zip`、`std::views::zip_transform`
  - `std::views::adjacent`、`std::views::chunk`
  - `std::views::slide`、`std::views::stride`

```cpp
auto vec = std::views::iota(1, 10)
         | std::views::filter([](int x) { return x % 2 == 0; })
         | std::ranges::to<std::vector>();
```

- **实用工具**：
  - `std::to_underlying` - 枚举转整数
  - `std::unreachable()` - 标记不可达代码
  - `std::byteswap` - 字节序转换
  - `std::is_scoped_enum` - 判断是否为作用域枚举
  - `std::forward_like` - 条件转发

- **字符串增强**：`std::string::contains`、`std::string::resize_and_overwrite`

- **关联容器**：`contains()` 成员函数用于所有关联容器

```cpp
if (map.contains(key)) { /* ... */ }
```
