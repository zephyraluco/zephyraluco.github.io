---
title: 'ARM汇编指令'
description: 'ARM汇编指令说明'
order: 1
---

## 常用汇编指令

### 1. `bl` —— Branch with Link（带链接的跳转，即函数调用）

```asm
bl  SystemInit            ; 调用 SystemInit()
bl  __libc_init_array     ; 调用 C 运行时初始化 / 静态构造函数
bl  entry                 ; 调用 RT-Thread 入口
```

- 把返回地址（PC+4）压入 `lr`（即 `r14`），然后跳到目标标号
- 相当于 x86 的 `call`，被调用函数用 `bx lr` 返回

### 2. `ldr` —— Load Register（从存储器加载到寄存器）

文件里出现两种形态：

#### 形式 A：`ldr rX, =symbol`（汇编成 `ldr rX, [pc, #imm]`，访问 literal pool）

```asm
ldr r0, =_sdata     ; r0 ← _sdata 的地址（.data 在 RAM 的起始）
ldr r1, =_edata     ; r1 ← _edata 的地址（.data 在 RAM 的结束）
ldr r2, =_sidata    ; r2 ← _sidata 的地址（.data 在 FLASH 的源）
ldr r2, =_sbss      ; r2 ← _sbss 的地址（.bss 起始）
ldr r4, =_ebss      ; r4 ← _ebss 的地址（.bss 结束）
```

- GAS 会把符号地址放进一个常量池（literal pool），再生成 `ldr rX, [pc, #偏移]` 把它加载到寄存器
- 因为是 32 位绝对地址，无法用一条 `mov` 完成，所以必须这样加载

#### 形式 B：`ldr rX, [base, offset]`（真实访存指令）

```asm
ldr r4, [r2, r3]    ; r4 ← Memory[r2 + r3]，从 FLASH 源地址读 4 字节
```

- 这是真正的存储器→寄存器加载，用基址 + 偏移寻址

### 3. `movs` —— Move with Set flags（赋值并更新标志）

```asm
movs r3, #0         ; r3 ← 0，并更新 NZCV 标志位
```

- 把立即数 0 写入 `r3`
- `s` 后缀表示**更新 CPSR 标志位**（N/Z/V/C），这里之后要用 `cmp`/`bcc`，先清标志有助于一致性，也确保 `Z=1`
- 如果不加 `s`，就是 `mov`，不更新标志

### 4. `b` —— Branch（无条件跳转）

```asm
b  LoopCopyDataInit    ; 跳到循环判断
b  LoopFillZerobss     ; 跳到清零循环
b  Infinite_Loop       ; Default_Handler 的死循环
```

- 不带链接、不返回，直接改 PC，等价于 C 的 `goto`
- `b Infinite_Loop` 在 `Default_Handler` 中形成**死循环**，让未处理的中断停在原地便于调试

### 5. `str` —— Store Register（把寄存器存到存储器）

```asm
str r4, [r0, r3]    ; Memory[r0 + r3] ← r4，把 4 字节写入 RAM 目标
str r3, [r2]        ; Memory[r2] ← r3（=0），把 0 写入 .bss 当前位置
```

- 与 `ldr` 相反方向，配合 `ldr r4, [r2, r3]` 实现 4 字节复制

### 6. `adds` —— Add with Set flags（加法并更新标志）

```asm
adds r3, r3, #4     ; r3 ← r3 + 4（偏移量前进 4 字节）
adds r4, r0, r3     ; r4 ← r0 + r3（算出当前目标地址，用于边界判断）
adds r2, r2, #4     ; r2 ← r2 + 4（.bss 指针前进 4 字节）
```

- 加法，结果写回寄存器，并更新标志位
- 后续 `cmp`/`bcc` 会用到这些标志位来判断循环是否结束
- `adds r4, r0, r3` 这种"算地址"的用法很巧妙：算出的 `r4` 既参与比较（`cmp r4, r1`），又是判断依据

### 7. `cmp` —— Compare（比较）

```asm
cmp r4, r1     ; 计算 r4 - r1，丢弃结果，只更新标志位
cmp r2, r4     ; 计算 r2 - r4，更新标志位
```

- 不写回结果，只设标志（N/Z/C/V）
- 配合下一条 `bcc` 决定是否跳转

### 8. `bcc` —— Branch if Carry Clear（C=0 时跳转）

```asm
bcc CopyDataInit   ; 如果 r4 < r1（无符号），跳回继续复制
bcc FillZerobss    ; 如果 r2 < r4（无符号），跳回继续清零
```

- `bcc` 也写作 `blo`（Branch if Lower）
- `cmp a, b` 之后 `bcc` 表示 `a < b`（无符号比较）时跳转
  - 原理：`a - b` 不够减时借位使 `C=0`，所以 "Carry Clear" = "小于"
- 这里实现"指针未到结束地址就继续循环"的判断

### 9. `bx` —— Branch and Exchange（跳转并切换状态）

```asm
bx lr     ; 返回调用者
```

- 把 `lr` 的值装入 `PC`，从而返回 `bl` 的下一条指令
- "Exchange" 指根据目标地址最低位切换 ARM/Thumb 状态：Cortex-M 只支持 Thumb，`lr` 最低位是 1，跳转后保持 Thumb 状态
- 在本文件中，`Reset_Handler` 末尾 `bx lr` 实际上**几乎不会执行**——因为 `bl entry` 进入 RT-Thread 后通常不再返回（`entry` 不会返回），但作为防御性写法保留

### 总结

| 指令 | 功能 | 是否更新标志 | 在本文件的作用 |
|------|------|------------|---------------|
| `bl` | 调用函数 | 否 | 调 SystemInit / __libc_init_array / entry |
| `ldr` | 内存→寄存器 | 否 | 取段边界、读 FLASH 数据 |
| `str` | 寄存器→内存 | 否 | 写 RAM 数据、清 .bss |
| `movs` | 立即数→寄存器 | 是 | 偏移清零、清零值准备 |
| `adds` | 加法 | 是 | 偏移/指针前进、算当前地址 |
| `cmp` | 比较 | 是 | 循环边界判断 |
| `bcc` | C=0 跳转 | 否 | 未到结束继续循环 |
| `b`   | 无条件跳转 | 否 | 循环入口、死循环 |
| `bx`  | 跳转+切换状态 | 否 | 函数返回 |

---

## 伪指令

伪指令（Directive）不是 CPU 执行的机器码，而是给汇编器（`arm-none-eabi-as`）的指示，用来控制段布局、符号属性、数据定义等；本文件出现的伪指令按功能分组说明

### 1. 架构与语法控制（文件头部）

```asm
.syntax unified     ; 使用 ARM 统一汇编语法（UAL）
.cpu cortex-m3       ; 目标 CPU 为 Cortex-M3
.fpu softvfp         ; 使用软浮点（无硬件 FPU）
.thumb               ; 汇编为 Thumb/Thumb-2 指令集
```

| 伪指令 | 作用 |
|--------|------|
| `.syntax unified` | 切到 UAL 语法，让新旧两种 Thumb 语法统一 |
| `.cpu cortex-m3` | 告诉汇编器目标核心，影响可用指令集 |
| `.fpu softvfp` | 不使用硬件浮点，浮点运算走软库 |
| `.thumb` | 后续代码按 16/32 位 Thumb 编码（Cortex-M 只支持 Thumb） |

### 2. 符号可见性控制

```asm
.global g_pfnVectors
.global Default_Handler
```

| 伪指令 | 作用 |
|--------|------|
| `.global` | 把符号标记为全局可见，链接器和其他目标文件能引用它 |

### 3. 数据定义

```asm
.word _sidata
.word _sdata
.word _edata
.word _sbss
.word _ebss
.equ  BootRAM, 0xF108F85F
```

| 伪指令 | 作用 |
|--------|------|
| `.word expr` | 在当前位置写一个 32 位字（4 字节），这里把链接脚本符号的值当作数据导出到映像 |
| `.equ name, value` | 定义编译期常量，不占存储，`BootRAM` 只是个名字，供后面 `.word BootRAM` 引用 |

### 4. 段控制

```asm
.section .text.Reset_Handler
.section .text.Default_Handler,"ax",%progbits
.section .isr_vector,"a",%progbits
```

| 伪指令 | 作用 |
|--------|------|
| `.section name, "flags", type` | 切到指定段，`a`=可分配(allocatable)，`x`=可执行(executable)，`%progbits`=含实际数据 |

- `.text.Reset_Handler` / `.text.Default_Handler` 是 `.text` 下的子段，便于链接脚本单独定位或 `KEEP`
- `.isr_vector` 是中断向量表段，链接脚本用 `KEEP(*(.isr_vector))` 放到 FLASH 起始

### 5. 符号类型与大小

```asm
.weak Reset_Handler
.type Reset_Handler, %function
.size Reset_Handler, .-Reset_Handler

.type g_pfnVectors, %object
.size g_pfnVectors, .-g_pfnVectors
```

| 伪指令 | 作用 |
|--------|------|
| `.weak sym` | 声明为弱符号，可被同名强符号覆盖 |
| `.type sym, %function` | 标记为函数（Thumb 地址最低位会被置 1） |
| `.type sym, %object` | 标记为数据对象 |
| `.size sym, .-sym` | 用"当前位置减去符号位置"算出符号大小，供调试器/elf 工具使用 |

### 6. Thumb 弱别名

```asm
.weak NMI_Handler
.thumb_set NMI_Handler, Default_Handler
```

| 伪指令 | 作用 |
|--------|------|
| `.thumb_set alias, target` | 把 `alias` 设为 `target` 的 Thumb 别名，地址最低位自动置 1，且是弱符号 |

这是 ST 模板里"默认中断处理"的核心套路：每个 `XXX_IRQHandler` 都弱别名到 `Default_Handler`，用户在 C 代码里写同名函数即可覆盖

### 总结

| 伪指令 | 类别 | 作用 |
|--------|------|------|
| `.syntax` | 架构控制 | 选择汇编语法风格 |
| `.cpu` | 架构控制 | 指定目标 CPU |
| `.fpu` | 架构控制 | 指定浮点方式 |
| `.thumb` | 架构控制 | 使用 Thumb 指令集 |
| `.global` | 符号可见性 | 全局符号 |
| `.weak` | 符号属性 | 弱符号，可被覆盖 |
| `.type` | 符号属性 | 标记函数/对象 |
| `.size` | 符号属性 | 设置符号大小 |
| `.thumb_set` | 符号属性 | 设弱 Thumb 别名 |
| `.equ` | 数据定义 | 定义编译期常量 |
| `.word` | 数据定义 | 写 32 位字 |
| `.section` | 段控制 | 切段 |
---