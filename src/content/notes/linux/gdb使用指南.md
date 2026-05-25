---
title: 'GDB使用指南'
description: 'GDB调试工具常用方法'
order: 1
---

## GDB 简介

GDB（GNU Debugger）是 GNU 项目开发的强大调试工具，支持多种编程语言（C、C++、Fortran、Go 等）。它允许你查看程序执行时的内部状态，追踪程序崩溃原因，以及逐步执行代码。

### 编译准备

为了使用 GDB 进行调试，需要在编译时添加调试信息：

```bash
gcc -g program.c -o program        # C 程序
g++ -g program.cpp -o program      # C++ 程序
gcc -g -O0 program.c -o program    # 禁用优化，便于调试
```

**编译选项说明：**
- `-g`：生成调试信息
- `-O0`：禁用优化（推荐调试时使用，避免代码被优化导致调试困难）
- `-ggdb`：生成 GDB 专用的调试信息（更详细）

---

## 启动 GDB

### 基本启动方式

```bash
gdb program                        # 启动 GDB 并加载程序
gdb program core                   # 分析 core dump 文件
gdb program <pid>                  # 附加到正在运行的进程
gdb --args program arg1 arg2       # 带参数启动程序
```

### 常用启动选项

- `gdb -q program`：安静模式启动（不显示版权信息）
- `gdb -tui program`：启动文本用户界面模式
- `gdb --batch -x commands.gdb`：批处理模式执行命令

---

## 基本命令

### 程序控制

**1. 运行与执行**

- `run` 或 `r`：启动程序
  - `run arg1 arg2`：带参数运行
  - `run < input.txt`：重定向输入
- `start`：启动程序并在 main 函数处停止
- `continue` 或 `c`：继续执行到下一个断点
- `step` 或 `s`：单步执行（进入函数内部）
- `next` 或 `n`：单步执行（不进入函数）
- `finish` 或 `fin`：执行完当前函数并返回
- `until` 或 `u`：执行到指定行
  - `until 50`：执行到第 50 行
- `kill`：终止正在调试的程序
- `quit` 或 `q`：退出 GDB

**2. 断点管理**

- `break` 或 `b`：设置断点
  - `break main`：在 main 函数设置断点
  - `break file.c:42`：在指定文件的第 42 行设置断点
  - `break function`：在函数入口设置断点
  - `break +10`：在当前位置后 10 行设置断点
  - `break *0x400500`：在指定地址设置断点
- `tbreak`：设置临时断点（触发一次后自动删除）
- `condition <n> <expr>`：为断点添加条件
  - `condition 1 i == 10`：断点 1 仅在 i == 10 时触发
- `info breakpoints` 或 `info b`：查看所有断点
- `delete <n>` 或 `d <n>`：删除指定断点
  - `delete`：删除所有断点
- `disable <n>`：禁用断点
- `enable <n>`：启用断点
- `clear`：删除当前行的断点
  - `clear function`：删除函数的断点

**3. 观察点（Watchpoint）**

- `watch <expr>`：当表达式值改变时中断
  - `watch variable`：监视变量变化
  - `watch *(int*)0x12345678`：监视内存地址
- `rwatch <expr>`：当表达式被读取时中断
- `awatch <expr>`：当表达式被读取或写入时中断
- `info watchpoints`：查看所有观察点

**4. 捕获点（Catchpoint）**

- `catch throw`：捕获 C++ 异常抛出
- `catch catch`：捕获 C++ 异常捕获
- `catch syscall`：捕获系统调用
  - `catch syscall open`：捕获 open 系统调用
- `catch signal`：捕获信号
  - `catch signal SIGSEGV`：捕获段错误信号

---

## 查看信息

**1. 变量与表达式**

- `print` 或 `p`：打印变量或表达式的值
  - `print variable`：打印变量
  - `print array[0]@10`：打印数组前 10 个元素
  - `print *pointer`：打印指针指向的值
  - `print/x variable`：以十六进制打印
  - `print/t variable`：以二进制打印
  - `print/d variable`：以十进制打印
  - `print/c variable`：以字符打印
- `display <expr>`：每次程序停止时自动显示表达式
  - `display variable`：自动显示变量
- `undisplay <n>`：取消自动显示
- `info display`：查看所有自动显示
- `x`：检查内存
  - `x/10x 0x12345678`：以十六进制显示 10 个字
  - `x/s pointer`：以字符串形式显示
  - `x/i $pc`：显示当前指令

**2. 栈帧与调用栈**

- `backtrace` 或 `bt`：显示调用栈
  - `bt full`：显示调用栈及局部变量
  - `bt 10`：只显示前 10 层
- `frame <n>` 或 `f <n>`：切换到指定栈帧
- `up`：向上移动一个栈帧
- `down`：向下移动一个栈帧
- `info frame`：显示当前栈帧详细信息
- `info args`：显示当前函数参数
- `info locals`：显示当前函数局部变量

**3. 源代码**

- `list` 或 `l`：显示源代码
  - `list 50`：显示第 50 行附近的代码
  - `list function`：显示函数代码
  - `list file.c:50`：显示指定文件的代码
- `disassemble` 或 `disas`：反汇编
  - `disassemble function`：反汇编函数
  - `disassemble $pc`：反汇编当前位置

**4. 线程与进程**

- `info threads`：显示所有线程
- `thread <n>`：切换到指定线程
- `thread apply all <command>`：对所有线程执行命令
  - `thread apply all bt`：显示所有线程的调用栈
- `info inferiors`：显示所有进程
- `inferior <n>`：切换到指定进程

**5. 寄存器**

- `info registers`：显示所有寄存器
- `info registers rax rbx`：显示指定寄存器
- `print $rax`：打印寄存器值
- `set $rax = 0`：设置寄存器值

---

## 高级调试技巧

**1. 条件断点与命令**

```gdb
# 设置条件断点
break file.c:42 if i > 100

# 为断点添加命令
commands 1
  print i
  continue
end
```

**2. 反向调试**

GDB 支持反向执行，可以"倒退"程序执行：

- `record`：开始记录执行
- `reverse-continue` 或 `rc`：反向继续执行
- `reverse-step` 或 `rs`：反向单步执行
- `reverse-next` 或 `rn`：反向单步执行（不进入函数）

**3. 多线程调试**

```gdb
# 设置调度锁定模式
set scheduler-locking on    # 只运行当前线程
set scheduler-locking off   # 所有线程都运行
set scheduler-locking step  # 单步时只运行当前线程

# 线程特定断点
break file.c:42 thread 2    # 仅在线程 2 中断
```

**4. 调试子进程**

```gdb
# 设置跟踪模式
set follow-fork-mode child   # 跟踪子进程
set follow-fork-mode parent  # 跟踪父进程（默认）

# 同时调试父子进程
set detach-on-fork off
```

**5. 自定义命令**

```gdb
# 定义自定义命令
define print_and_next
  print $arg0
  next
end

# 使用自定义命令
print_and_next variable
```

---

## TUI 模式

GDB 的文本用户界面（TUI）模式提供了更直观的调试体验。

### 启动 TUI 模式

```bash
gdb -tui program              # 启动时开启 TUI
```

或在 GDB 中：
```gdb
tui enable                    # 开启 TUI
Ctrl-x a                      # 切换 TUI 模式
```

### TUI 窗口布局

- `layout src`：显示源代码窗口
- `layout asm`：显示汇编窗口
- `layout split`：同时显示源代码和汇编
- `layout regs`：显示寄存器窗口
- `focus <window>`：切换焦点窗口
  - `focus cmd`：焦点到命令窗口
  - `focus src`：焦点到源代码窗口

### TUI 快捷键

- `Ctrl-x a`：切换 TUI 模式
- `Ctrl-x 1`：单窗口模式
- `Ctrl-x 2`：双窗口模式
- `Ctrl-x o`：切换活动窗口
- `Ctrl-l`：刷新屏幕

---

## 调试 Core Dump

当程序崩溃时，系统可能生成 core dump 文件，包含程序崩溃时的内存快照。

### 启用 Core Dump

```bash
ulimit -c unlimited           # 允许生成 core dump
sudo sysctl -w kernel.core_pattern=core.%p           # 设置core文件的输出路径
```

### 分析 Core Dump

```bash
gdb program core.*              # 加载程序和 core 文件
```

常用命令：
```gdb
bt                            # 查看崩溃时的调用栈
info registers                # 查看寄存器状态
print variable                # 查看变量值
frame <n>                     # 切换到指定栈帧查看
```

---

## 远程调试

GDB 支持通过 gdbserver 进行远程调试。

### 在目标机器上

```bash
gdbserver :1234 program       # 启动 gdbserver，监听 1234 端口
gdbserver :1234 --attach <pid> # 附加到已运行的进程
```

### 在本地机器上

```bash
gdb program
```

在 GDB 中：
```gdb
target remote 192.168.1.100:1234  # 连接到远程 gdbserver
```

---

## 实用技巧

**1. 保存与加载断点**

```gdb
save breakpoints breakpoints.gdb  # 保存断点到文件
source breakpoints.gdb            # 加载断点
```

**2. 日志记录**

```gdb
set logging on                    # 开启日志记录
set logging file gdb.log          # 设置日志文件
set logging overwrite on          # 覆盖已有日志
```

**3. 美化输出**

```gdb
set print pretty on               # 美化结构体输出
set print array on                # 美化数组输出
set print array-indexes on        # 显示数组索引
```

**4. 历史命令**

```gdb
show commands                     # 显示命令历史
!<n>                             # 重复第 n 条命令
```

**5. GDB 初始化文件**

创建 `~/.gdbinit` 文件，在启动时自动执行命令：

```gdb
set print pretty on
set pagination off
set confirm off
```

---

## 常见调试场景

**1. 段错误（Segmentation Fault）**

```gdb
gdb program
run
# 程序崩溃后
bt                               # 查看调用栈
frame 0                          # 切换到崩溃位置
print variable                   # 检查变量值
```

**2. 死循环**

```gdb
gdb program
run
# 程序卡住后按 Ctrl-C
bt                               # 查看当前位置
list                             # 查看源代码
```

**3. 内存泄漏**

结合 Valgrind 使用：
```bash
valgrind --vgdb=yes --vgdb-error=0 program
# 在另一个终端
gdb program
target remote | vgdb
```

**4. 多线程竞态条件**

```gdb
break file.c:42 thread 2
commands
  print variable
  continue
end
run
```

---

## 快捷键与缩写

| 完整命令 | 缩写 | 说明 |
|---------|------|------|
| run | r | 运行程序 |
| continue | c | 继续执行 |
| step | s | 单步进入 |
| next | n | 单步跳过 |
| finish | fin | 执行完当前函数 |
| break | b | 设置断点 |
| print | p | 打印变量 |
| backtrace | bt | 显示调用栈 |
| list | l | 显示源代码 |
| info breakpoints | i b | 查看断点 |
| delete | d | 删除断点 |
| quit | q | 退出 GDB |

---

## 参考资源

- [GDB 官方文档](https://sourceware.org/gdb/documentation/)
- [GDB 快速参考卡](https://sourceware.org/gdb/current/onlinedocs/refcard.pdf)
- `man gdb`：查看 GDB 手册页