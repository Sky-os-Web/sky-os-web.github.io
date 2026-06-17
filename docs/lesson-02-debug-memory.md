# Lesson 02: Debug And Memory Foundations

Sky OS now has the pieces needed to debug early kernel work.

## Serial Logging

The kernel initializes COM1 at:

```text
0x3F8
```

Serial logs matter because VGA output may fail during graphics, paging, or panic work. Serial gives the kernel a second voice.

## Exception Panic Path

The IDT now points CPU exceptions 0 through 31 at named stubs.

For exceptions without a CPU error code, the stub pushes a fake `0` error code. For exceptions with a real CPU error code, the stub preserves it. The common panic path prints:

```text
vector
error code
EIP
```

## BIOS Memory Map

The boot sector asks BIOS interrupt `0x15, EAX=0xE820` for the memory map before entering protected mode.

Entries are stored at:

```text
0x8000
```

The kernel receives:

```text
ESI = memory map pointer
EBX = memory map entry count
```

## Early Page Allocator

The first allocator is intentionally simple. It finds the top of usable memory and hands out 4 KiB pages starting at:

```text
0x00100000
```

This is not the final allocator yet. It is the first stable hook for paging and a kernel heap.

## C Kernel Track

`kernel/c/sky_kernel.c` is a freestanding C scaffold. It can be built into:

```text
out/sky-os-c.img
```

The assembly kernel remains the main image for now because it has the richer interrupt/debug foundation. The next migration step is moving console, serial, panic, and memory code into C while keeping boot and interrupt entry stubs in assembly.

