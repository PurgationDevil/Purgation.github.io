---
layout: post
title: "Google CTF reverse"
toc: true
date: 2026-06-20
categories: 分类名称
tags: [逆向]
---

# Google CTF reverse

## multiarch-1（2025）

> Description: Stacks are fun, registers are easy, but why do one when you can do both? Welcome to the multiarch. 
>
> 描述：栈很有趣，寄存器很容易，但既然可以两者兼顾，为什么只做其中一个呢？欢迎来到多架构时代。

------

### 下载题目

[点击下载题目][https://github.com/PurgationDevil/Reverse-Challenge-Share]

re_Google_multiarch-1.zip

### 预览

**1. 分析 `PeMapping` Linux 虚拟机环境（`multiarch` 进程）**

**它在为它自己解析并映射自定义的字节码文件（`crackme.masm`）**。

- 它通过 `mmap` 分配了 3 个大小为 `0x1000` 字节的虚拟内存块（`nmap_section1_1000` 等），用来存放虚拟机的**代码段、数据段和堆栈**。

- 随后，它把解密或提取出来的字节码 `memcpy` 到这些内存里，并初始化了虚拟机的通用寄存器（mA, mB, mC, mD）和 SP（堆栈指针）、PC（程序计数器）。

**2. 分析 `VmCore`（虚拟机核心分发器）**

当 `PeMapping` 执行完并返回 `Context` 结构体后，主程序会进入一个 `while(VmMachineTick)` 的死循环。在这个循环的底层，就是最核心的 **`VmCore` 函数**。

这个虚拟机采用了**双重处理器模式（Dual-Handler）**：

1\. **栈模式结构（Stack VM）**：当模式标志为 0 时，进入 `handleVMStack`。

   - 包含基本的栈操作：`PUSH_STACK (0x30)`、`POP_STACK (0x50)`、加减异或等。

2\. **寄存器模式结构（Register VM）**：当模式标志为 1 时，进入 `handleVMReg`。

   - 包含传统的寄存器操作：`ADD_REG (0x20)`、`XOR_IMM (0x41)`、`CALL (0x61)` 等。

**3. 🏁 终极目标：逆向解密三个关卡（Challenges）**

运行这个程序后，虚拟机会问 **3 个问题**，全对才能拿到 Flag。

1️⃣ 第一关：What's your favorite number? (最爱的数字)

- **虚拟机内部逻辑**：它将两个固定的常量进行异或：`0x8675309 ^ 0x13370539 = 0x1B505630`。然后加上输入的数字，最后和目标值 `0xAAAAAAAA` 进行比较。

- **解题公式**：直接用减法逆推。

  $Answer = 0xAAAAAAAA - 0x1B505630 = 0x8F5A547A → 2405061754（十进制）$

2️⃣ 第二关：Tell me a joke (讲个笑话)

- **虚拟机内部逻辑**：它是一个循环 7 次的哈希/乘法混淆。每次将魔术字 `0xCAFEBABE` 乘以输入的字符的 ASCII 码，右移 32 位（取高 32 位），并不断与寄存器异或。最终要求高位结果以 `0x7331` 开头。
- **解题方法**：由于空间很小（只需爆破 2 个 ASCII 字符），直接写一段简单的脚本进行**暴力破解**。
- **正确答案**：字符 **`F'`**（十六进制 `0x4691`）。

3️⃣ 第三关：Predict the future (预测未来)

- **虚拟机内部逻辑**：调用了虚拟机自带的系统调用 `SYS_SRAND` 和 `SYS_RAND`。它将输入的数字作为伪随机数种子，生成随机数序列，经过特定的位运算后，要求序列能够碰撞出 `0xC0FFEE`。
- **解题关键（大坑）**：Windows 和 Linux 的 `rand()` 标准库实现不同，导致生成的随机数序列不同。这题是 Linux 题目，**必须在 Linux 环境下跑爆破脚本**才能得到正确的种子。
- **正确答案**：**`1399320`**（十六进制 `0x155A18`）。

------

### 分析类型

一共两个文件，一个文件是 `crackme.masm`，另一个文件是 `multiarch`。

其中 `crackme.masm` 文件不能分析，直接分析 `multiarch` 文件。（原始版本）

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

`sub_1319` 的输入参数 `a1` 是一个代表 `.masm` 编译后文件的结构体。这个函数一启动，就把文件里的三块数据，分别原封不动地抄写（`memcpy`）到了 `v3`、`v4` 和 `v5` 里面。

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

修改：在需要修改的函数中，把初始化参数类型右键点击 `Reset Type` 或者通过 `y` 键改成 `Context*`

------

**总结这一小部分：**

在虚拟机（VM）逆向中，首先就是要**找全 `Context` 结构体**的 “内部元素”。其内部元素是：**先找 ”内存段“ 指针**（代码段、数据段、栈段），**再找 “控制流寄存器”**（PC、SP），**然后找 “通用寄存器”**（A、B、C、D / R0、R1...），**最后找 “标志位寄存器”**（EFLAGS / Z-Flag）。

本题的 `Context` 结构体就是一个很好的例子。

------

#### 2. 操作码分析

（这里为了方便比对直接拿成品进行分析）

这里相当于是操作码的 main 函数。

```c
__int64 __fastcall VmMachineTick(Context *ctx, __int64 a2)
{
  unsigned __int8 vmMode; // al
  __int64 v3; // rdx
  __int64 v4; // rcx
  unsigned __int64 v5; // r8

  vmMode = getVMMode(ctx);
  if ( !vmMode )
    return handleVMStack(ctx, a2, v3, v4, v5);
  if ( vmMode == 1 )
    return handleVMReg(ctx);
  fwrite("[E] nice qubit\n", 1u, 0xFu, stderr);
  return 0;
}
```

主要的逻辑非常阴，**如果结果是 `0` ➡️ 变身“栈虚拟机”，如果结果是 `1` ➡️ 变身“寄存器虚拟机”**。

重点是：它是会发生“选择”和“切换”！

它是以“栈模式”为主体结构启动的。（根据后面的分析）

当需要做复杂乘法时，它会切入寄存器模式。

在寄存器模式里疯狂运算完之后，执行寄存器模式的退出指令，再次把开关拨回栈模式。

首先分析 `handleVMStack` 函数（容易一些）

------

**`handleVMStack` 第一部分**

第一步处理程序的基本运算符、跳转指令和系统调用如下所示。

```c
case ADD:                             // ADD
  if ( (unsigned __int8)pop_stack_u32(ctx, (char *)&syscall_id + 1)
    && (unsigned __int8)pop_stack_u32(ctx, &operand2)
    && (unsigned __int8)push_stack_u32(ctx, *(SyscallIDs *)((char *)&syscall_id + 1) + operand2) )
  {
    goto LABEL_22;
  }
  ctx->trigger_execption = 1;
  return 0;
case SUB:                             // SUB
  if ( (unsigned __int8)pop_stack_u32(ctx, (char *)&syscall_id + 1)
    && (unsigned __int8)pop_stack_u32(ctx, &operand2)
    && (unsigned __int8)push_stack_u32(ctx, *(SyscallIDs *)((char *)&syscall_id + 1) - operand2) )
  {
    goto LABEL_22;
  }
  ctx->trigger_execption = 1;
  return 0;
case XOR:                             // XOR
  if ( (unsigned __int8)pop_stack_u32(ctx, (char *)&syscall_id + 1)
    && (unsigned __int8)pop_stack_u32(ctx, &operand2)
    && (unsigned __int8)push_stack_u32(ctx, operand2 ^ *(SyscallIDs *)((char *)&syscall_id + 1)) )
  {
     goto LABEL_22;
  }
  ctx->trigger_execption = 1;
  return 0;
case AND:                             // AND
  if ( (unsigned __int8)pop_stack_u32(ctx, (char *)&syscall_id + 1)
    && (unsigned __int8)pop_stack_u32(ctx, &operand2)
    && (unsigned __int8)push_stack_u32(ctx, operand2 & *(SyscallIDs *)((char *)&syscall_id + 1)) )
  {
    goto LABEL_22;
  }
  ctx->trigger_execption = 1;
  return 0;
```

这些都比较好辨识。带 `+`、`-`、`^`、`&` 这些符号。主要是下面的逻辑。

------

**`handleVMStack`第二部分**

```c
case JMP:                             // JMP
  ctx->memory_offset = *(StackVMOpcodes *)((char *)&opcode + 1);
  return success;
case JZ:                              // JZ
  if ( (ctx->eflag & 1) == 0 )
    goto LABEL_22;
  ctx->memory_offset = *(StackVMOpcodes *)((char *)&opcode + 1);
  return success;
case JNZ:                             // JNZ
  if ( (ctx->eflag & 1) != 0 )
    goto LABEL_22;
  ctx->memory_offset = *(StackVMOpcodes *)((char *)&opcode + 1);
  return success;
case CMP:                             // CMP
  if ( !(unsigned __int8)pop_stack_u32(ctx, (char *)&syscall_id + 1)
    || !(unsigned __int8)pop_stack_u32(ctx, &operand2) )
  {
    ctx->trigger_execption = 1;
    return 0;
  }
  compare(ctx, *(SyscallIDs *)((char *)&syscall_id + 1), operand2);
  break;
default:
  goto LABEL_91;
```

1\. `case JMP:` （无条件跳转）

```c
ctx->memory_offset = *(StackVMOpcodes *)((char *)&opcode + 1);
return success;
```

`ctx->memory_offset` 就是虚拟机的 **`PC`（程序计数器）**

没有任何 `if` 判断，把 `opcode` 后面紧跟的 4 个字节（也就是跳转的目标地址）**强行塞给了 `ctx->memory_offset`**。

2\. `case JZ:` 和 `case JNZ:` （条件跳转）

```c
if ( (ctx->eflag & 1) == 0 )   // 👈 如果标志位是 0 
  goto LABEL_22;               // 绕过修改 PC 的代码（不跳转）

ctx->memory_offset = *(StackVMOpcodes *)((char *)&opcode + 1); // 否则，修改 PC（发生跳转）
return success;

if ( (ctx->eflag & 1) != 0 )   // 👈 如果标志位不是 0
  goto LABEL_22;               // 绕过修改 PC 的代码（不跳转）

ctx->memory_offset = *(StackVMOpcodes *)((char *)&opcode + 1); // 否则，修改 PC（发生跳转）
return success;
```

它们都在开头检查了 `ctx->eflag & 1`（这道题里，标志位第 0 位代表比较结果）

- 在 `JZ` 里：如果标志位是 0（代表之前比较的结果**不相等/不为零**），它就 `goto LABEL_22` 溜了，也就是**不跳转**；只有当标志位是 1 时，才会执行修改 `ctx->memory_offset` 的操作。
- 在 `JNZ` 里：逻辑正好相反。

3\. `case CMP:` （比较指令）

```c
if ( !(unsigned __int8)pop_stack_u32(ctx, ...) || !(unsigned __int8)pop_stack_u32(ctx, &operand2) )
{
  ctx->trigger_execption = 1; // 弹栈失败就触发异常崩溃
  return 0;
}
compare(ctx, *(SyscallIDs *)((char *)&syscall_id + 1), operand2); // 👈 核心运算
break;
```

- 它连续调用了两次 `pop_stack_u32`。这说明什么？说明这是一个**栈虚拟机**的比较指令，它要比较的两个数字，是**刚刚被压入栈顶的两个元素**。它先把这两个数从栈里“拔”出来。
- 拿到这两个数后，它调用了一个出题人自己写的函数：`compare(ctx, 数1, 数2);`。
- 如果双击点进这个 `compare` 函数，100% 会看到：它在里面对这两个数做了减法或者比对，然后**把比对结果（0或1）写进了 `ctx->eflag`**。

------

**`handleVMStack`第三部分**

```c
if ( (_BYTE)opcode == SYSCALL )             // syscall
{
    if ( IsSyscallAllowed(ctx) )
    {
        if ( (unsigned __int8)GetSyscallIndex(ctx, &syscall_id) )
        {
            switch ( (char)syscall_id )
            {
                case SYS_GET_INPUT:
                    if ( (unsigned __int8)sub_1805((__int64)ctx, (__int64)&operand2)
                        && (unsigned __int8)push_stack_u32(ctx, operand2) )
                    {
                        goto LABEL_22;
                    }
                    ctx->trigger_execption = 1;
                    return 0;
                case SYS_PRINT:
                    fwrite("[E] unsupported syscall!\n", 1u, 0x19u, stderr);
                    ctx->trigger_execption = 1;
                    return 0;
                case SYS_WRITE:
                    if ( (unsigned __int8)pop_stack_u32(ctx, &operand2)
                        && (unsigned __int8)GetSyscallIndex(ctx, (char *)&syscall_id + 1)
                        && (unsigned __int8)sub_18C5(ctx, operand2, BYTE1(syscall_id)) )
                    {
                        goto LABEL_22;
                    }
                    ctx->trigger_execption = 1;
                    return 0;
                case SYS_SRAND:
                    if ( !(unsigned __int8)pop_stack_u32(ctx, &operand2) )
                    {
                        ctx->trigger_execption = 1;
                        return 0;
                    }
                    srand(operand2);
                    break;
                case SYS_RAND:
                    if ( (unsigned __int8)sub_194C((__int64)ctx, &operand2) && (unsigned __int8)push_stack_u32(ctx, operand2) )
                        goto LABEL_22;
                    ctx->trigger_execption = 1;
                    return 0;
                case SYS_FLAG:
                    if ( (unsigned __int8)sub_196B(ctx) )
                        goto LABEL_22;
                    ctx->trigger_execption = 1;
                    return 0;
                case SYS_MALLOC:
                    if ( (unsigned __int8)pop_stack_u32(ctx, (char *)&syscall_id + 1)
                        && (unsigned __int8)syscall_mem_alloc(
                            (__int64)ctx,
                            *(SyscallIDs *)((char *)&syscall_id + 1),
                            &operand2,
                            v11,
                            v12)
                        && (unsigned __int8)push_stack_u32(ctx, operand2) )
                    {
                        goto LABEL_22;
                    }
                    ctx->trigger_execption = 1;
                    return 0;
                default:
                    fwrite("[E] bad syscall!\n", 1u, 0x11u, stderr);
                    ctx->trigger_execption = 1;
                    return 0;
            }
            goto LABEL_22;
        }
        ctx->trigger_execption = 1;
    }
    else
    {
        fwrite("[E] can't execute that syscall!\n", 1u, 0x20u, stderr);
        ctx->trigger_execption = 1;
    }
    return 0;
}
```

这里是系统调用（SYSCALL）

**1. `case SYS_GET_INPUT:`**（获取输入）

```c
if ( (unsigned __int8)sub_1805((__int64)ctx, (__int64)&operand2)
  && (unsigned __int8)push_stack_u32(ctx, operand2) )
```

**行为特征：** 它先调用了 `sub_1805` 读入数据（里面包着 `fgetc` 和 `__isoc99_fscanf`），存入 `operand2`，接着**立刻调用 `push_stack_u32` 把输入压入虚拟栈顶**。

**做题影响：** 这就是为什么在运行 Challenge 1、2、3 时，程序会停下来问你话。在这里输入的东西，就是通过这个分支吃进去并放到栈里的。

**2. `case SYS_PRINT:`**（空壳子）

```c
fwrite("[E] unsupported syscall!\n", 1u, 0x19u, stderr);
```

报错就输出，无意义。

**3. `case SYS_WRITE:`**（打印输出）

```c
if ( (unsigned __int8)pop_stack_u32(ctx, &operand2)
  && (unsigned __int8)GetSyscallIndex(ctx, (char *)&syscall_id + 1)
  && (unsigned __int8)sub_18C5(ctx, operand2, BYTE1(syscall_id)) )
```

**行为特征：** 它先从栈顶 `pop` 出一个数字（这通常是字符串的内存地址或者长度），然后调用 `sub_18C5`（里面是用 `fwrite` 输出）。

**做题影响：** 屏幕上显示的那些 `"What's your favorite number?"` 或者是 `"Challenge 1 Passed!"`，全都是通过这个 `SYS_WRITE` 吐出来的

**4. `case SYS_SRAND:` 和 `case SYS_RAND:`**（致命的随机数陷阱）

这两个是**第三关（Challenge 3）能够通关的绝对核心**

```c
// SYS_SRAND：设置随机数种子
if ( !(unsigned __int8)pop_stack_u32(ctx, &operand2) ) // ...
srand(operand2); // 👈 调用了 C 语言的 srand

// SYS_RAND：生成随机数并压栈
if ( (unsigned __int8)sub_194C((__int64)ctx, &operand2) && (unsigned __int8)push_stack_u32(ctx, operand2) )
```

**行为特征：** * `SYS_SRAND` 弹出栈顶的数字，直接作为种子传给底层的 `srand()`。

- `SYS_RAND` 在 `sub_194C` 里调用了底层的 `rand()`，生成随机数后，**立刻 `push_stack_u32` 塞回虚拟栈顶**。

**做题影响（还记得我们第一轮聊的坑吗）：** 因为它们直接调用了系统的 `srand()` 和 `rand()`。如果该程序在 Windows 下跑这个虚拟机，它调用的就是 Windows 的随机数算法；在 Linux 下跑，调用的就是 Linux 的 `glibc` 随机数。 **两者的算法算出来的数字序列完全不同！** 导致在 Windows 下后续的 `CMP` 永远不可能相等，只能走向 `trigger_exception = 1` 崩溃。

所以 Challenge 3 必须在 Linux 环境下跑。

**5. `case SYS_FLAG:`**（输出 flag）

```c
if ( (unsigned __int8)sub_196B(ctx) )
```

**行为特征：** 当程序一路过关斩将走到这里时，说明你前面的输入全对了。它会触发 `SYS_FLAG`，调用 `sub_196B`（读取 flag）。

**6. `case SYS_MALLOC:`**（动态内存分配）

```c
if ( (unsigned __int8)pop_stack_u32(ctx, (char *)&syscall_id + 1)
  && (unsigned __int8)syscall_mem_alloc(
    (__int64)ctx,
    *(SyscallIDs *)((char *)&syscall_id + 1),
    &operand2,
    v11,
    v12)
  && (unsigned __int8)push_stack_u32(ctx, operand2) )
```

**行为特征：** 弹出栈顶需要的大小，然后在虚拟机内部调用 `syscall_mem_alloc` 分配一块新内存，并把分配好的虚拟内存地址压回栈顶（`push_stack_u32`）。

**做题影响：** 为后面的复杂算法（比如第二关、第三关）在运行时临时开辟草稿纸空间。

------

**`handleVMStack` 第四部分**

```c
case PUSH_STACK:
v9 = push_stack_u32(ctx, *(StackVMOpcodes *)((char *)&opcode + 1));
  if ( (_BYTE)v9 )
    goto LABEL_22;
  ctx->trigger_execption = 1;
  return v9;
case S_LDP:
  if ( (unsigned __int8)getInstructionsSize4(ctx, *(unsigned int *)((char *)&opcode + 1), &operand2) )
  {
    if ( (unsigned __int8)push_stack_u32(ctx, operand2) )
      goto LABEL_22;
  }
  else
  {
    fwrite("[E] invalid S.LDP, bad addr\n", 1u, 0x1Cu, stderr);
  }
  ctx->trigger_execption = 1;
  return 0;
case POP_STACK:
  v10 = pop_stack_u32(ctx, &operand2);
  if ( (_BYTE)v10 )
    goto LABEL_22;
  ctx->trigger_execption = 1;
  return v10;
// ......
if ( (_BYTE)opcode != S_HLT )
  goto LABEL_91;
success = 0;
if ( memcmp((char *)&opcode + 1, &unk_40E4, 4u) )
{
  fwrite("[E] invalid S.HLT\n", 1u, 0x12u, stderr);
  ctx->trigger_execption = 1;
}
```

**1. `case PUSH_STACK:`**（压入立即数）

```c
v9 = push_stack_u32(ctx, *(StackVMOpcodes *)((char *)&opcode + 1));
if ( (_BYTE)v9 )
  goto LABEL_22;
```

把 `opcode` 后面跟着的 4 字节数据 直接调用 `push_stack_u32` 丢进虚拟栈的栈顶。

```c
__int64 __fastcall push_stack_u32(Context *ctx, int a2)
{
  __int64 v3; // rsi

  v3 = ctx->stack_offset - 4;
  ctx->stack_offset = v3;
  return sub_1659((__int64)ctx, v3, a2);
}
```

**2. `case S_LDP:`**（Load Pointer / 虚拟指针读取）

```c
if ( (unsigned __int8)getInstructionsSize4(ctx, *(unsigned int *)((char *)&opcode + 1), &operand2) )
{
  if ( (unsigned __int8)push_stack_u32(ctx, operand2) )
    goto LABEL_22;
}
```

它先取出了这条指令后面跟着的 4 字节虚拟内存地址：`*(unsigned int *)((char *)&opcode + 1)`。

然后调用了 `getInstructionsSize4`。这个函数会当一个“搬运工”，**前往虚拟机的数据段（`data_section`）或者代码段，把那个地址里存着的 4 字节数据抠出来**，存进 `operand2`。

最后，通过 `push_stack_u32(ctx, operand2)`，把**抠出来的这 4 字节数据压入栈顶**。

**3. `case POP_STACK:`**（出栈）

```c
v10 = pop_stack_u32(ctx, &operand2);
if ( (_BYTE)v10 )
  goto LABEL_22;
```

把栈顶的那个 4 字节数字“拔”出来，存进 `operand2` 里。

**4. `S_HLT`**（验证）

```c
if ( memcmp((char *)&opcode + 1, &unk_40E4, 4u) )
```

------

**`handleVMStack: `**

```c
enum StackVMOpcodes
{
    S_LDB = 0x10,
    S_LDW = 0x20,
    PUSH_STACK = 0x30,
    S_LDP = 0x40,
    POP_STACK = 0x50,
    ADD = 0x60,
    SUB = 0x61,
    XOR = 0x62,
    AND = 0x63,
    JMP = 0x70,
    JZ = 0x71,
    JNZ = 0x72,
    CMP = 0x80,
    SYSCALL = 0xA0,
    S_HLT = 0xFF,
};
```

```c
enum SyscallIDs
{
    SYS_GET_INPUT = 0x0,
    SYS_PRINT = 0x1,
    SYS_WRITE = 0x2,
    SYS_SRAND = 0x3,
    SYS_RAND = 0x4,
    SYS_FLAG = 0x5,
    SYS_MALLOC = 0x6,
};
```

------

**`handleVMReg`**

因为这个函数与 `handleVMStack` 差不多，找类似 switch-case 的就可以。这里就不一一分析了。

```c
enum RegVMOpcodes
{
    REG_HALT = 0x0,
    REG_SYSCALL = 0x1,
    REG_PUSH = 0x10,
    PUSH_REG0 = 0x11,
    PUSH_REG1 = 0x12,
    PUSH_REG2 = 0x13,
    PUSH_REG3 = 0x14,
    POP_REG0 = 0x15,
    POP_REG1 = 0x16,
    POP_REG2 = 0x17,
    POP_REG3 = 0x18,
    ADD_REG = 0x20,
    ADD_IMM = 0x21,
    SUB_REG = 0x30,
    SUB_IMM = 0x31,
    XOR_REG = 0x40,
    XOR_IMM = 0x41,
    MUL_REG = 0x50,
    MUL_IMM = 0x51,
    JMP_ABS = 0x60,
    CALL = 0x61,
    JZ_REG = 0x62,
    JNZ_REG = 0x63,
    JMP_FLAG2 = 0x64,
    JMP_IMM = 0x68,
};
```

**1. 基础控制与系统调用**

- **`REG_HALT = 0x0`**：退出当前寄存器模式，把控制权交还给栈模式。
- **`REG_SYSCALL = 0x1`**：拉起系统调用（比如打印、输入、申请内存、生成随机数等）。

**2. 数据传输（栈与寄存器互动）**

这里的 `REG0 ~ REG3` 分别对应结构体里的 `mA, mB, mC, mD`。

- **`REG_PUSH = 0x10`**：把一个立即数（写死的数字）压入虚拟栈。
- **`PUSH_REG0 ~ PUSH_REG3 (0x11~0x14)`**：把寄存器（`mA/mB/mC/mD`）里的值压入虚拟栈。
- **`POP_REG0 ~ POP_REG3 (0x15~0x18)`**：从虚拟栈顶弹出一个值，写进对应的寄存器中。

**3. 数学运算（核心算法区）**

- **`ADD_REG / ADD_IMM (0x20/0x21)`**：加法。要么两个寄存器相加，要么寄存器加一个立即数。
- **`SUB_REG / SUB_IMM (0x30/0x31)`**：减法。
- **`XOR_REG / XOR_IMM (0x40/0x41)`**：异或。
- **`MUL_REG / MUL_IMM (0x50/0x51)`**：乘法。**注意：** 它做的是 64 位乘法，乘积的低 32 位扔进 `mA`，高 32 位扔进 `mD`。

**4. 跳转与分支（控制流）**

- **`JMP_ABS = 0x60`**：绝对跳转（类似于函数调用或直接跳到某个 PC 地址）。
- **`CALL = 0x61`**：调用子程序。
- **`JZ_REG / JNZ_REG (0x62/0x63)`**：条件跳转。`JZ` 是结果为 0（或相等）时跳，`JNZ` 是结果不为 0（或不相等）时跳。
- **`JMP_FLAG2 = 0x64`**：根据第二个状态标志位进行跳转。
- **`JMP_IMM = 0x68`**：带着立即数偏移进行跳转。

------

自此，虚拟机分析完毕。开始进军 Google CTF 2025 `multiarch` 核心解密！

我们可以根据 IDA 解出的程序 16 进制码，自己写脚本反编译出可读代码。

或者，我们为所有操作码设置断点，并开始监视调用链。然后，我们跳过完整的跟踪链，只关注任务的主要操作。

------

### 手动反编译

```python
import struct

# 1. 录入之前找齐的密码本（Opcode 对照表）
STACK_OPCODES = {
    0x10: "S_LDB", 0x20: "S_LDW", 0x30: "PUSH_STACK",
    0x40: "S_LDP", 0x50: "POP_STACK", 0x60: "ADD",
    0x61: "SUB", 0x62: "XOR", 0x63: "AND",
    0x70: "JMP", 0x71: "JZ", 0x72: "JNZ",
    0x80: "CMP", 0xA0: "SYSCALL", 0xFF: "S_HLT",
}

REG_OPCODES = {
    0x00: "REG_HALT", 0x01: "REG_SYSCALL", 0x10: "REG_PUSH",
    0x11: "PUSH_REG0", 0x12: "PUSH_REG1", 0x13: "PUSH_REG2", 0x14: "PUSH_REG3",
    0x15: "POP_REG0", 0x16: "POP_REG1", 0x17: "POP_REG2", 0x18: "POP_REG3",
    0x20: "ADD_REG", 0x21: "ADD_IMM", 0x30: "SUB_REG", 0x31: "SUB_IMM",
    0x40: "XOR_REG", 0x41: "XOR_IMM", 0x50: "MUL_REG", 0x51: "MUL_IMM",
    0x60: "JMP_ABS", 0x61: "CALL", 0x62: "JZ_REG", 0x63: "JNZ_REG",
    0x64: "JMP_FLAG2", 0x68: "JMP_IMM",
}

# 2. 读取从题目程序（crackme.masm）里抠出来的纯二进制字节码
# 假设你已经把代码段保存为了 crackme_code.bin （在与 py 脚本同一文件夹下）
with open("./crackme_code.bin", "rb") as f:
    code = f.read()

pc = 0
mode = 0 # 默认 0 是栈模式，1 是寄存器模式

print("=== 虚拟机反汇编剧本开始 ===")

while pc < len(code):
    # 如果撞到了故事对白区，直接闭眼跳过去
    if pc == 0:
        pc = 0x13  # 直接空降到字符串后面的代码区
        continue
    if pc == 0x176:
        print(f"--- [跳过 0x176 ~ 0x2c7 的字符串数据区] ---")
        pc = 0x2c7
        continue

    current_pc = pc
    opcode = code[pc]

    # ---------------- 栈模式解析 (Mode 0) ----------------
    if mode == 0:
        op_name = STACK_OPCODES.get(opcode, f"UNK_STACK_{hex(opcode)}")

        # 只要不是未知的乱码指令，我们统统当成 5 字节指令（吃掉后面的4字节对齐）
        if not op_name.startswith("UNK_STACK_"):
            chunk = code[pc + 1:pc + 5]
            if len(chunk) < 4:
                chunk = chunk.ljust(4, b'\x00')
            imm = struct.unpack("<I", chunk)[0]

            # 如果后面带的 4 字节是 0，说明只是对齐用的空壳，我们打印好看一点
            if imm == 0:
                print(f"[StackVM] {hex(current_pc)}: {op_name}")
            else:
                print(f"[StackVM] {hex(current_pc)}: {op_name} {hex(imm)}")

            pc += 5  # 强行推过 5 个字节！
        else:
            # 只有遇到真正认不出来的字节，才 1 字节 1 字节地往前挪，暴露真相
            print(f"[StackVM] {hex(current_pc)}: {op_name}")
            pc += 1

    # ---------------- 寄存器模式解析 (Mode 1) ----------------
    else:
        op_name = REG_OPCODES.get(opcode, f"UNK_REG_{hex(opcode)}")

        # 寄存器模式下带 4 字节立即数的指令
        if op_name in ["REG_PUSH", "ADD_IMM", "SUB_IMM", "XOR_IMM", "MUL_IMM", "JMP_ABS", "JMP_IMM"]:
            chunk = code[pc + 1:pc + 5]
            if len(chunk) < 4:
                chunk = chunk.ljust(4, b'\x00')
            imm = struct.unpack("<I", chunk)[0]
            print(f"[RegVM]   {hex(current_pc)}: {op_name} {hex(imm)}")
            pc += 5
        # 寄存器模式下带 1 字节寄存器索引的指令
        elif op_name in ["ADD_REG", "SUB_REG", "XOR_REG", "MUL_REG"]:
            reg_info = code[pc + 1]
            reg1 = (reg_info >> 4) - 1
            reg2 = (reg_info & 0xF) - 1
            print(f"[RegVM]   {hex(current_pc)}: {op_name} m{reg1}, m{reg2}")
            pc += 2
        elif op_name == "REG_HALT":
            print(f"[RegVM]   {hex(current_pc)}: REG_HALT (切回栈模式)")
            mode = 0  # 还原模式
            pc += 1
        else:
            print(f"[RegVM]   {hex(current_pc)}: {op_name}")
            pc += 1
```

这段代码会还原部分可读代码。但是依然需要分析

#### Challenge 1 - What's your favorite number?

```text
=== 虚拟机反汇编剧本开始 ===
[StackVM] 0x13: S_LDB 0x4b        加载打印 Welcome 的参数
[StackVM] 0x18: PUSH_STACK 0x2000 把缓冲区指针压栈
[StackVM] 0x1d: S_LDB 0x2
[StackVM] 0x22: SYSCALL           拉起系统调用：打印 Welcome
[StackVM] 0x27: S_LDB 0x2b        加载 Challenge 1题目的参数
[StackVM] 0x2c: PUSH_STACK 0x20ad
[StackVM] 0x31: S_LDB 0x2
[StackVM] 0x36: SYSCALL           打印“Challenge 1 - What's your favorite number?”
[StackVM] 0x3b: S_LDB
[StackVM] 0x40: SYSCALL           拉起系统调用：等待选手在控制台敲入第一个数字
[StackVM] 0x45: S_LDW 0x1337      把0x1337压入虚拟栈（2字节）
[StackVM] 0x4a: S_LDW 0x539       把0x539压入虚拟栈（2字节）
[StackVM] 0x4f: PUSH_STACK 0x8675309 把0x8675309压入虚拟栈（4字节）
[StackVM] 0x54: XOR               把栈顶的两个数进行异或
[StackVM] 0x59: ADD               然后再加上输入的数字
[StackVM] 0x5e: PUSH_STACK 0xaaaaaaaa 把0xaaaaaaaa压入虚拟栈
[StackVM] 0x63: CMP               算好的数字与栈顶的0xaaaaaaaa比较
[StackVM] 0x68: JNZ 0x110b        对不上就跳转（退出程序）
```

这里有一个坑，在压入栈时执行了三次，但是计算时是把两个数进行计算而非三个数。我在压入栈的步骤里明确写了是 2 字节。在原码中 20 37 13  00 00 20 39 05 00 00，栈中这两个 2 字节的数据是挨在一起的。在计算机底层原理中，4 字节是一个单位（又叫 “字长”）（C语言的 int 理解），所以被后续的计算当作了一个值。

不难看出计算公式：$0x13370539 \oplus 0x8675309 + input = 0xAAAAAAAA$

#### Challenge 2 和 Challenge 3 放弃手动反编译

手动独立反编译在这里遇到了困难，如果没有其他题解的帮助根本不知道哪里是 Challenge 2。所以还是需要动态调试辅助定位。

而且后面的输出内容完全是乱的，如果想完全修改需要花费很多的时间研究思考，所以这里放弃手动反编译。

------

### 动态调试还原

#### Challenge 1 - What's your favorite number?

检查操作数中包含的内容：

- **操作数 1：** `0x8675309`
- **操作数 2：** `0x13370539`
- **结果：** `0x1B505630`

先记下这一点，然后继续进行下一步。

然后在 Local Types 的页面观察下一个操作码，下一个操作码是 ADD。查看操作数，可以看到 XOR 结果是如何添加到数字中的： `0x1B505630 + (we entered 123321)` 。然后再次记录这一点，然后继续执行。

接下来，立即执行了 CMP 操作码，将数字 `0x1B5237E9` 与参考值 `0xAAAAAAAA` 进行比较，这将立即导致 `trigger_exception = true` 并退出程序。

Challenge 1 没有了，就只有这些。现在我们可以完整地看到检查数字的算法：

```python
def challenge1(value):
    # 1. 异或运算
    r1 = 0x8675309 ^ 0x13370539
    
    # 2. 加法运算（同样用 & 0xFFFFFFFF 模拟 32 位底层溢出截断）
    r2 = (r1 + value) & 0xFFFFFFFF
    
    # 3. 终极碰撞
    if r2 == 0xAAAAAAAA:
        return True
    
    return False

print(f"验证结果: {challenge1(test_value)}")
```

得到 `0x8F5A547A`。这就是正确答案。

#### Challenge 2 - Tell me a joke

**执行步骤：**

  1\. 使用 MUL_IMM 指令将 `0xCAFEBABE` （常量）乘以我们的 ASCII 符号。

  2\. 将结果值放入寄存器 A 中。

  3\. 使用常量 `>> 0x20` 将结果截断并放入寄存器 D 中

  4\. 对 B 和 D 执行按位异或运算（B 等于 0，值也是常量）。

  5\. 执行此算法 7 次

  6\. 使用 CMP 进行参考值检查

大致代码逻辑如下：

```python
bool challenge2(uint32_t hex_symbol)
{
    uint32_t A{};
    uint64_t D{};
    uint64_t B{};

    for (int i = 0; i < 7; i++)
    {
        uint32_t A = 0xCAFEBABE * hex_symbol;
        
        D = A >> 0x20;
        B = B ^ D;
    }
    
    if (B == expected_value)
    {
        return true;
    }
    
    return false;
}
```

需要得到一个数字，该数字以参考编号 `0x7331` 开头，乘以 `0xCAFEBABE` （不需要关心后面的值，它们将被 `>> 0x20` 截断）

其实完全不用关注异或运算，因为在第 7 次迭代后就会返回结果数字。

这里采用最优解 $→$ 暴力破解：

```python
for i in range(0x10FFF + 1):
    result = i * 0xCAFEBABE
    
    # 转成十六进制字符串，并变成大写
    pair_hex = f"{i:04X}"
    result_hex = f"{result:X}"
    
    # 寻找以 7331 开头的数字
    if result_hex.startswith("7331"):
        print(f"通关输入 HEX: {pair_hex} -> 乘法结果: {result_hex}")
```

**结果：** `9146 -> 乘法结果: 7331C96CADF4`

`0x4691` 它的 ASCII 码是 **`F'`**

#### Challenge 3 - Almost there! But can you predict the future? What number am I thinking of?

输入一个数字 `value` 这个数会被当成随机数 `srand(value)`

然后生成 32 位的随机数：因为标准的 `rand()` 函数通常只返回 15 位或 16 位的随机数，出题人为了凑满一个 4 字节的单位，做了一个高低位拼接：`val = rand(); val |= rand() << 16;`（把两次生成的随机数拼成一个大的 32 位数字）。

拿拼好的随机数异或 `0x133700`。

再异或 `0xF2F2F2F2`。

最后用 `& 0xFFFFFF` 只切出它的低 24 位。

终极对比：看切出来的低 24 位是不是等于 0xC0FFEE（黑客界著名的魔术常数 Coffee ☕）。如果等于，你就成功“预测了未来”！

Windows 系统无法解出但 Linux 系统就能够解出。这需要计算机底层的逆向视角，这个锅必须由 微软的 C 运行时库来背。

这是计算机底层一个非常经典的跨平台大坑：Windows 和 Linux 的 `rand()` 算法完全不一样。

- Windows (MSVCRT) 用的随机数公式：它的最大随机数（RAND_MAX）只有 0x7FFF（32767）。它每次只生成 15 位的随机数。

- Linux (glibc) 用的随机数公式：它的最大随机数（RAND_MAX）高达 0x7FFFFFFF（21亿）。它每次能生成 31 位的随机数。

由于这个虚拟机在被出题人编译时，是在 Linux 环境下编译的。所以虚拟机在执行 RAND 这条特制指令时，用的是 Linux 的 glibc 随机数大口袋算法。

```python
import sys

# 🌟 手动还原 Linux (glibc) 的伪随机数生成器 (LGCG算法)
# 该代码无论是在 Windows 还是在 Mac 运行，结果都和 Linux 完全一致
class LinuxRand:
    def __init__(self, seed):
        self.state = seed

    def rand(self):
        # Linux glibc 的标准线性同余公式参数
        self.state = (self.state * 1103515245 + 12345) & 0x7FFFFFFF
        # 提取高 15 位作为随机数返回
        return (self.state >> 16) & 0x7FFF

def challenge3(value):
    # 初始化 Linux 随机数种子
    lr = LinuxRand(value)

    for i in range(10):
        # 1. 模拟 C++ 里的两次 rand() 并拼接成 32 位大口袋
        val_low = lr.rand()
        val_high = lr.rand()
        val = val_low | (val_high << 16)

        # 2. 完美复刻题解里的三次连环魔改
        r1 = 0x133700 ^ val
        r2 = r1 ^ 0xF2F2F2F2
        r3 = r2 & 0xFFFFFF  # 只切出低 24 位

        # 3. 终极碰撞 Coffee
        if r3 == 0xC0FFEE:
            return True
            
    return False

# 为了极速出结果，我们根据题解的范围缩小到 0x200000 即可
for i in range(0x200000):
    if challenge3(i):
        print(f"成功抓到通关种子! 十六进制: {hex(i).upper()} | 十进制: {i}")
        sys.exit(0)

print("未找到结果，请检查魔术常数验证。")
```

multiarch-1 完结

------





















------

如果你在阅读时发现了任何错误，请评论或发邮件告诉我，因为错误是学习和发展的一部分！
