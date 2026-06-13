---
layout: post
title: "Google CTF reverse"
toc: true
date: 2026-06-13
categories: 分类名称
tags: [逆向]
---

*暂时是有这个意图，但是看我能不能学明白吧。*🧐*就先放出来放这放着，学多少写多少。*🤓

# Google CTF reverse

## MULTIARCH-1 (p. 1) （2025）

### 预览

  **1. 分析 `PeMapping` Linux 虚拟机环境（`multiarch` 进程）**

**它在为它自己解析并映射自定义的字节码文件（`crackme.masm`）** (pp. 1, 3)。

- 它通过 `mmap` 分配了 3 个大小为 `0x1000` 字节的虚拟内存块（`nmap_section1_1000` 等），用来存放虚拟机的**代码段、数据段和堆栈** (pp. 3-4)。

- 随后，它把解密或提取出来的字节码 `memcpy` 到这些内存里，并初始化了虚拟机的通用寄存器（mA, mB, mC, mD）和 SP（堆栈指针）、PC（程序计数器） (pp. 3-4)。

  **2. 分析 `VmCore`（虚拟机核心分发器）**

当 `PeMapping` 执行完并返回 `Context` 结构体后，主程序会进入一个 `while(VmMachineTick)` 的死循环 (p. 2)。在这个循环的底层，就是最核心的 **`VmCore` 函数** (p. 5)。

根据题解的第 5 节，这个虚拟机采用了**双重处理器模式（Dual-Handler）** (p. 5)：

1\. **栈模式结构（Stack VM）**：当模式标志不为 1 时，进入 `handleVMStack` (p. 5)。

   - 包含基本的栈操作：`PUSH_STACK (0x30)`、`POP_STACK (0x50)`、加减异或等 (pp. 5-7)。

2\. **寄存器模式结构（Register VM）**：当模式标志为 1 时，进入 `handleVMReg` (p. 5)。
   - 包含传统的寄存器操作：`ADD_REG (0x20)`、`XOR_IMM (0x41)`、`CALL (0x61)` 等 (p. 7)。

  **3. 🏁 终极目标：逆向解密三个关卡（Challenges）**

运行这个程序后，虚拟机会要求你回答 **3 个问题**，全对才能拿到 Flag (p. 1)。

1️⃣ 第一关：What's your favorite number? (最爱的数字) (p. 8)

- **虚拟机内部逻辑**：它将两个固定的常量进行异或：`0x8675309 ^ 0x13370539 = 0x1B505630` (pp. 8-9)。然后加上你输入的数字，最后和目标值 `0xAAAAAAAA` 进行比较 (pp. 8-9)。

- **解题公式**：直接用减法逆推 (pp. 9, 12)。

  $Answer = 0xAAAAAAAA - 0x1B505630 = 0x8F5A547A → 2405061754（十进制）$

2️⃣ 第二关：Tell me a joke (讲个笑话) (p. 9)

- **虚拟机内部逻辑**：它是一个循环 7 次的哈希/乘法混淆 (pp. 9-10)。每次将魔术字 `0xCAFEBABE` 乘以你输入的字符的 ASCII 码，右移 32 位（取高 32 位），并不断与寄存器异或 (pp. 9-10)。最终要求高位结果以 `0x7331` 开头 (pp. 10, 12)。
- **解题方法**：由于空间很小（只需爆破 2 个 ASCII 字符），直接写一段简单的脚本（如题解中的 Node.js 脚本）进行**暴力破解** (pp. 10, 12)。
- **正确答案**：字符 **`F'`**（十六进制 `0x4691`） (pp. 10-11)。

3️⃣ 第三关：Predict the future (预测未来) (p. 10)

- **虚拟机内部逻辑**：调用了虚拟机自带的系统调用 `SYS_SRAND` 和 `SYS_RAND` (p. 10)。它将你输入的数字作为伪随机数种子（Seed），生成随机数序列，经过特定的位运算后，要求序列能够碰撞出 `0xC0FFEE` (pp. 11-12)。
- **解题关键（大坑）**：Windows 和 Linux 的 `rand()` 标准库实现不同，导致生成的随机数序列不同 (p. 11)。这题是 Linux 题目，**必须在 Linux 环境下跑爆破脚本**才能得到正确的种子 (pp. 1, 11)。
- **正确答案**：**`1399320`**（十六进制 `0x155A18`） (p. 11)。

### 分析类型

一共两个文件，一个文件是 crackme.masm，另一个文件是 multiarch。

其中 crackme.masm 文件不能分析，直接分析 multiarch 文件。（原始版本）

```c
__int64 __fastcall main(int a1, char **a2, char **a3)
{
  __int64 v3; // rax
  __int64 v4; // rbp
  char *v5; // rbx

  setbuf(stdin, 0);
  setbuf(stdout, 0);
  setbuf(stderr, 0);
  if ( a1 <= 1 )
  {
    fprintf(stderr, "[E] usage: %s [path to .masm file]\n", *a2);
    return 2;
  }
  else
  {
    fwrite("[I] initializing multiarch emulator\n", 1u, 0x24u, stderr);
    v3 = sub_2DD9(a2[1]);
    v4 = v3;
    if ( v3 )
    {
      v5 = sub_1319(v3);
      fwrite("[I] executing program\n", 1u, 0x16u, stderr);
      while ( (unsigned __int8)sub_29D1(v5) )
        ;
      if ( v5[48] )
      {
        fwrite("[E] execution failed\n", 1u, 0x15u, stderr);
        sub_2A1E(v5, 1);
      }
      else
      {
        fwrite("[I] done!\n", 1u, 0xAu, stderr);
      }
      sub_1427(v5);
      sub_2D8D(v4);
      return 0;
    }
    else
    {
      fwrite("[E] couldn't load multiarch program\n", 1u, 0x24u, stderr);
      return 1;
    }
  }
}
```

**特征一：无限循环的 “取指-执行” 核心**

```c
fwrite("[I] executing program\n", 1u, 0x16u, stderr);
while ( (unsigned __int8)sub_29D1(v5) ); // 👈 核心死循环！
```

这是虚拟机最标志性、无法伪装的特征。

正常的 Linux 或 Windows 程序，它的代码是由操作系统和真正的物理 CPU 自动一行行往下跑的。 但在这里，`main` 函数却自己用一个 `while` 锁死了一个函数 `sub_29D1`，并且不间断地、疯狂地调用它。

在计算机架构里，这叫 **轮询（Polling）** 或者 **Tick 驱动**。这说明物理 CPU 只是个“打工人”，真正要执行的程序逻辑被装在 `v5` 里面，必须靠物理 CPU 疯狂抽鞭子（调用 `sub_29D1`），里面的程序才能往前走一步。

**特征二：巨型的 “分发器” 结构**

在 `sub_29D1` 函数中

```c
v1 = sub_17DA();    // 1. 获取某种状态/模式/Opcode
if ( !v1 )
  return sub_1A56(a1); // 2. 根据状态跳向处理函数 A
if ( v1 == 1 )
  return sub_2052(a1); // 3. 根据状态跳向处理函数 B
```

如果点进 `sub_1A56`（也就是分析完版本里的 `handleVMStack`），会看到一个**超级巨大的 `switch-case` 或者是密密麻麻的 `if-else` 链**：

物理 CPU 执行代码是靠硬件电路直接解码。而这里，程序却用纯软件（`if-else` / `switch`）在解密一个数字（Opcode），并根据数字的不同强行跳转到不同的代码块去执行。**这种用软件模拟 CPU 解码芯片的结构，就叫 Dispatcher（分发器），是虚拟机的铁证。**

**特征三：虚拟寄存器和虚拟指针的 “自增”**

其实这个理由有点牵强，毕竟这一步已经分析出来是寄存器了。

在分析 `StackTrace` 时，看到了这几个字段：`a1->memory_offset` (PC) 和 `a1->stack_offset` (SP)。

物理 CPU 的寄存器（如 EIP、ESP）是由硬件自动加减的，根本不需要 C 语言代码去手动 `+1` `-4`。

只有当使用软件 “假装” 一个 CPU 的时候，你才不得不用代码写下：`ctx->pc += 1;` 来模拟指针的移动。

------

**结论：这是一个 VM 虚拟机逆向。**

------

### 虚拟机分析

#### 1. VM 分析

首先看分析完整的主函数（分析完的版本）

```c
__int64 __fastcall main(int a1, char **crackme_masm, char **a3)
{
  _QWORD *peData; // rax
  __int64 v4; // rbp
  Context *context; // rbx

  setbuf(stdin, 0);
  setbuf(stdout, 0);
  setbuf(stderr, 0);
  if ( a1 <= 1 )
  {
    fprintf(stderr, "[E] usage: %s [path to .masm file]\n", *crackme_masm);
    return 2;
  }
  else
  {
    fwrite("[I] initializing multiarch emulator\n", 1u, 0x24u, stderr);
    peData = PeHeaderInit(crackme_masm[1]);
    v4 = (__int64)peData;
    if ( peData )
    {
      context = PeMapping((__int64)peData);
      fwrite("[I] executing program\n", 1u, 0x16u, stderr);
      while ( (unsigned __int8)VmMachineTick(context) )
        ;
      if ( context->trigger_execption )
      {
        fwrite("[E] execution failed\n", 1u, 0x15u, stderr);
        StackTrace((__int64)context, 1);
      }
      else
      {
        fwrite("[I] done!\n", 1u, 0xAu, stderr);
      }
      freemap(&context->nmap_section1_1000);
      freepedata(v4);
      return 0;
    }
    else
    {
      fwrite("[E] couldn't load multiarch program\n", 1u, 0x24u, stderr);
      return 1;
    }
  }
}
```

首先

然后直接分析重点：`PeMapping` 函数

```c
Context *__fastcall PeMapping(__int64 a1)
{
  Context *ctx; // rbx
  void *v3; // r14
  void *v4; // r13
  void *v5; // r12
  __int64 v6; // r13

  ctx = (Context *)calloc(1u, 0x88u);
  v3 = mmap(0, 0x1000u, 7, 33, 0, 0);
  ctx->nmap_section1_1000 = v3;
  v4 = mmap(0, 0x1000u, 7, 33, 0, 0);
  ctx->nmap_section2_1000 = v4;
  ctx->nmap_section3_1000 = mmap(0, 0x1000u, 7, 33, 0, 0);
  v5 = calloc(1u, *(_QWORD *)(a1 + 0x28));
  ctx->unk_calloc = v5;
  ctx->getenv_callback = callback_getevn;
  memcpy(v3, *(const void **)a1, *(_QWORD *)(a1 + 8));
  memcpy(v4, *(const void **)(a1 + 16), *(_QWORD *)(a1 + 24));
  v6 = *(_QWORD *)(a1 + 40);
  memcpy(v5, *(const void **)(a1 + 32), *(_QWORD *)(a1 + 40));
  *(_QWORD *)ctx->reserved_1 = v6;
  ctx->memory_offset = 0x1000;
  ctx->stack_offset = 0x8F00;
  return ctx;
}
// --------------- ↑ 改 --- ↓ 原 ----------------
char *__fastcall sub_1319(__int64 a1)
{
  char *v2; // rbx
  void *v3; // r14
  void *v4; // r13
  void *v5; // r12
  __int64 v6; // r13

  v2 = (char *)calloc(1u, 0x88u);
  v3 = mmap(0, 0x1000u, 7, 33, 0, 0);
  *(_QWORD *)v2 = v3;
  v4 = mmap(0, 0x1000u, 7, 33, 0, 0);
  *((_QWORD *)v2 + 1) = v4;
  *((_QWORD *)v2 + 2) = mmap(0, 0x1000u, 7, 33, 0, 0);
  v5 = calloc(1u, *(_QWORD *)(a1 + 40));
  *((_QWORD *)v2 + 3) = v5;
  *((_QWORD *)v2 + 5) = sub_12E0;
  memcpy(v3, *(const void **)a1, *(_QWORD *)(a1 + 8));
  memcpy(v4, *(const void **)(a1 + 16), *(_QWORD *)(a1 + 24));
  v6 = *(_QWORD *)(a1 + 40);
  memcpy(v5, *(const void **)(a1 + 32), *(_QWORD *)(a1 + 40));
  *((_QWORD *)v2 + 4) = v6;
  *(_DWORD *)(v2 + 51) = 4096;
  *(_DWORD *)(v2 + 55) = 36608;
  return v2;
}
```

`PeMapping` 函数上来就申请了内存：`v2 = (char *)calloc(1u, 0x88u);`。这说明整个虚拟机的核心结构体大小是 **`0x88` 字节**。

------

接下来它对 `v2` 的各个偏移地址进行了赋值。在 64 位程序里，`(_QWORD *)v2 + N` 代表第 N 个 8 字节（指针或 64 位整数），而 `v2 + M` 代表具体的字节偏移。

```c
v3 = mmap(0, 0x1000u, 7, 33, 0, 0);
*(_QWORD *)v2 = v3;                  // 第 0 个 QWORD -> 偏移 0x00

v4 = mmap(0, 0x1000u, 7, 33, 0, 0);
*((_QWORD *)v2 + 1) = v4;            // 第 1 个 QWORD -> 偏移 0x08

*((_QWORD *)v2 + 2) = mmap(0,...);   // 第 2 个 QWORD -> 偏移 0x10
```

> 为什么用 mmap，而不用 malloc 或 calloc？

假设用 `calloc` 申请了一块内存，把 crackme 的机器码拷贝进去，然后让程序跳转过去执行，CPU 会立刻触发异常：因为系统认为你在遭受缓冲区溢出攻击。（程序漏洞）

而 `mmap` 可以通过参数 `7`，合法地向操作系统申请一块允许执行代码的内存。

 🤓 虚拟机连续申请了 3 个大小为 `0x1000` (4096 字节，刚好是一个内存页) 的可读可写可执行（Prot=7，即最高权限）的虚拟内存空间。分别存放在结构体偏移 `0x00`, `0x08`, `0x10` 处。结合后面的 `memcpy`，它们对应的就是虚拟机的**代码段、数据段或栈空间**。

```c
memcpy(v3, *(const void **)a1, *(_QWORD *)(a1 + 8));         // 拷贝到 v3 (偏移 0x00)
memcpy(v4, *(const void **)(a1 + 16), *(_QWORD *)(a1 + 24)); // 拷贝到 v4 (偏移 0x08)
memcpy(v5, *(const void **)(a1 + 32), *(_QWORD *)(a1 + 40)); // 拷贝到 v5 (偏移 0x18)
```

`sub_1319` 的输入参数 `a1` 是一个代表 `.masm` 编译后文件的结构体。这个函数一启动，就把文件里的三块数据，分别原封不动地抄写（memcpy）到了 `v3`、`v4` 和 `v5` 里面。

只要是可执行文件（无论是标准的 ELF/PE，还是这种题目自定义的 VM 目标文件），它被加载到内存里去执行时，最基础的标配就是：存放着机器码 或者 存放着程序里写死的常量、字符串、全局变量。那它们必然对应着这个 `crackme.masm` 程序的**代码内容**和**初始数据内容**。（一定要分析出这点，后面分析程序会用到）

但是只有 v3 和 v4 拷贝了内容，在 `*((_QWORD *)v2 + 2) = mmap(0, 0x1000u, 7, 33, 0, 0);` 中是没有被拷贝的。

```c
// 连续分配了三个 mmap 空间
v3 = mmap(0, 0x1000u, 7, 33, 0, 0);       *(_QWORD *)v2 = v3;                  // 偏移 0x00
v4 = mmap(0, 0x1000u, 7, 33, 0, 0);       *((_QWORD *)v2 + 1) = v4;            // 偏移 0x08
*((_QWORD *)v2 + 2) = mmap(0, 0x1000u, 7, 33, 0, 0);                          // 偏移 0x10
```

所以，程序加载时，一块被分配出来、大小为 `0x1000`（4096字节）、允许读写执行（Prot=7）、但内容全为 0（准确说，是没有从文件里拷贝任何东西）的干净内存，在虚拟机里是干嘛用的？这个区域就叫 **栈 (Stack)**。是临时的、给程序运行时存放临时变量和返回地址的“动态数据区”。

根据后面的代码

```c
*(_DWORD *)(v2 + 51) = 4096;   // 0x33 偏移 = 4096 (0x1000)
*(_DWORD *)(v2 + 55) = 36608;  // 0x37 偏移 = 36608 (0x8F00)
```

也足以证明：当虚拟机执行 `PUSH`（压栈）指令时，它就会去修改 `v2 + 55`（也就是 `stack_offset`）的值，让它在第三个 `mmap` 的空间里往前或往后移动。

------

```c
v5 = calloc(1u, *(_QWORD *)(a1 + 40));
*((_QWORD *)v2 + 3) = v5;            // 第 3 个 QWORD -> 偏移 0x18

*((_QWORD *)v2 + 5) = sub_12E0;      // 第 5 个 QWORD -> 偏移 0x28
```

继续往下看，在偏移 `0x18` 存放了另一个动态分配的内存块 `v5`。然后在偏移 `0x28` 存放了一个函数指针 `sub_12E0`。

------

```c
*((_QWORD *)v2 + 4) = v6;            // 第 4 个 QWORD -> 偏移 0x20
*(_DWORD *)(v2 + 51) = 4096;         // 51 是十进制 = 0x33 -> 偏移 0x33，赋值 4096 (0x1000)
*(_DWORD *)(v2 + 55) = 36608;        // 55 是十进制 = 0x37 -> 偏移 0x37，赋值 36608 (0x8F00)
```

 偏移 `0x33` 赋值了 `4096`，这非常像是虚拟机的 **栈指针初始偏移** 或者 **内存指针初始偏移**。

*不说怎么分析分析出来的，咱没那个实力就不要总想自己分析得到结果*🙃

先看结果：这是完善后的 Context 结构体，从上到下分别对应着分配空间的高地址到低地址。

```c++
struct Context {
    void* nmap_section1_1000; // 0x00: mmap分配的虚拟代码段
    void* nmap_section2_1000; // 0x08: mmap分配的虚拟数据段
    void* nmap_section3_1000; // 0x10: mmap分配的虚拟栈段
    void* unk_calloc;         // 0x18: calloc分配的内存
    char reserved_1[8];       // 0x20: 对应 v6 的大小
    void* getenv_callback;   // 0x28: 存放 sub_12E0 函数指针
    
    // --- 0x30 到 0x32 之间通常是 1 字节的状态标志位 ---
    bool trigger_execption;   // 0x30: 异常触发标志位(main里的 v5[48]，48十进制 = 0x30 判断)
    bool permission_syscall;  // 0x31: 某种权限标志位
    uint8_t eflag;            // 0x32: 标志位
    
    // --- 0x33 开始，整整齐齐排开的 4 字节(DWORD) 虚拟寄存器组 ---
    uint32_t memory_offset;      // 0x33: 程序计数器 (初始为 4096)
    uint32_t stack_offset;    // 0x37: 栈指针寄存器 (初始为 36608)
    uint32_t mA;              // 0x3B: 虚拟寄存器 A
    uint32_t mB;              // 0x3F: 虚拟寄存器 B
    uint32_t mC;              // 0x43: 虚拟寄存器 C
    uint32_t mD;              // 0x47: 虚拟寄存器 D
    // ... 刚好填满到 0x4B 字节
};
```

这个结构为我们提供了足够的信息，可以继续进行下一步工作。

从代码上来看这个偏移 `0x33` 赋值 `4096` 的这段代码完全可以确定是 **内存初始偏移**。

不过单看 `PeMapping` 函数的代码显然是不能确定完整的 Context 的元素。

虽然不是做题者，但是从步骤上来看大概率是最先复原出这个结构体的。

所以我们需要找到另一部分。`PeMapping` 是 `main` 函数内除了初始化函数的第一个执行函数，接下来找到寄存器部分（或者说，偏移 0x3B ~ 0x4B 部分）。

------

想找到寄存器代码在哪，首先要明白一点就是：

```c
printf(
    "  ---[ PC=0x%08x SP=0x%08x | A=0x%08x B=0x%08x C=0x%08x D=0x%08x\n",
    a1->memory_offset,
    a1->stack_offset,
    a1->mA,
    a1->mB,
    a1->mC,
    a1->mD);
```

**这个 printf 输出为什么一定是寄存器？**

这得从程序员的心理学（或者说开发习惯）说起。

出题人在写这个自定义虚拟机（`multiarch`）时，他面临一个巨大的痛苦：虚拟机是用软件模拟硬件，一旦虚拟程序运行报错，他根本不知道虚拟 CPU 此时此刻的内部状态。

所以，任何一个写虚拟机的人，都**100% 会写一个调试/日志函数**，在虚拟机崩溃时把所有的虚拟寄存器倒出来（这个操作在计算机里叫 **Register Dump**）。

出题人当时在 C 语言源码里写的代码，长相必然是这样的： `"  ---[ PC=0x%08x..."` 

IDA 在反编译时，把这个字符串原封不动地拉了出来。既然字符串里明明白白写着 `PC=`、`SP=`、`A=`、`B=`，而后面紧跟着传进去的参数又是 `a1` 结构体的各个偏移，这就等于是**出题人自己留下的代码注释**。这叫“口供物证俱在”，容不得它抵赖。

然后是**怎么找到寄存器函数？**简单，在 `main` 函数里，能看到它在执行完虚拟机的核心循环（`sub_29D1`）后，有这样一段条件判断：

```c
if ( v5[48] ) // 48 十进制 = 0x30。如果触发了异常标志位
{
  fwrite("[E] execution failed\n", 1u, 0x15u, stderr);
  sub_2A1E(v5, 1); // 👈 关键点：报错后，立刻调用了这个函数！
}
```

所以 `sub_2A1E` 函数一定有寄存器。

最后，**怎么判断寄存器的顺序？**

这就要看 **C 语言函数调用约定** 和 **汇编传参** 了。

在 64 位 Linux（AMD64 System V ABI）下，当一个函数要调用 `printf` 打印多个变量时，寄存器的传参顺序是极其严格的固定死律：

- 第 1 个参数（格式化字符串）：放入 `RDI`
- 第 2 个参数：放入 `RSI`
- 第 3 个参数：放入 `RDX`
- 第 4 个参数：放入 `RCX`
- 第 5 个参数：放入 `R8`
- 第 6 个参数：放入 `R9`
- 第 7 个参数及以后：压入栈中

或者说对照着字符串 `"PC=... SP=... | A=... B=... C=... D=..."` 的顺序

- 第 1 个被打印的 `%08x` 是 PC ➡️ 对应 `RSI` ➡️ 对应 `[rdi+33h]`（十进制 51）
- 第 3 个被打印的 `%08x` 是 A  ➡️ 对应 `RCX` ➡️ 对应 `[rdi+3Bh]`（十进制 59）
- 第 6 个被打印的 `%08x` 是 D  ➡️ 对应 栈上 ➡️ 对应 `[rdi+47h]`（十进制 71）

------

**总结这一小部分：**

在虚拟机（VM）逆向中，首先就是要**找全 `Context` 结构体**的 “内部元素”。其内部元素是：**先找 ”内存段“ 指针**（代码段、数据段、栈段），**再找 “控制流寄存器”**（PC、SP），**然后找 “通用寄存器”**（A、B、C、D / R0、R1...），**最后找 “标志位寄存器”**（EFLAGS / Z-Flag）。

本题的 `Context` 结构体就是一个很好的例子。

------

#### 2. 操作码分析
