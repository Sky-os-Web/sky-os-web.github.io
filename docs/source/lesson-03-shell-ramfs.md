# Lesson 03: Shell, Input, And RAMFS

Sky OS now has a tiny kernel shell and a bootloader-loaded SkyFS RAM disk.

## Input

Keyboard IRQ1 no longer prints directly to the screen. It now feeds `shell_accept_key`.

The shell supports:

```text
Enter
Backspace
printable ASCII characters
```

The command buffer is 64 bytes for now.

## Commands

```text
help   show commands
clear  clear the screen
mem    show memory allocator state
alloc  allocate one 4 KiB physical page
ls     list the tiny RAM filesystem
cat    show readme.txt from RAM filesystem
panic  intentionally trigger a CPU exception
```

## SkyFS RAM Disk

The bootloader loads one filesystem sector from the disk image into memory at:

```text
0x7000
```

The kernel receives that pointer in `EDI`.

The filesystem sector starts with:

```text
SKYFS1
file count
file entries
file names and data
```

Each entry has:

```text
name offset
data offset
size
```

The offsets are relative to the start of the SkyFS sector.

Next filesystem step:

```text
protected-mode sector reads -> larger SkyFS blocks -> directories -> create/write/delete
```

## Memory

`mem` prints:

```text
memory_top
next_free_page
```

`alloc` hands out one 4 KiB page and advances `next_free_page`.
