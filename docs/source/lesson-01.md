# Lesson 01: First Boot

This version of Sky OS starts the old-school way, then hands control to a real protected-mode kernel.

## 1. BIOS loads the boot sector

When a PC starts from a raw disk image, the BIOS reads the first 512 bytes into memory at:

```text
0x7C00
```

The last two bytes must be:

```text
55 AA
```

That signature tells the BIOS the sector is bootable.

## 2. The boot sector loads the kernel

`boot/boot.asm` asks the BIOS to read 16 more sectors from disk into memory at:

```text
0x1000
```

This is where the kernel binary is placed by `scripts/build-windows.ps1`.

## 3. The CPU enters protected mode

The boot sector creates a tiny Global Descriptor Table, flips the protected-mode bit in `cr0`, then jumps into 32-bit code.

This lets Sky OS run normal 32-bit C code without DOS, Linux, Windows, or any other OS underneath it.

## 4. The kernel installs the IDT

`kernel/kernel32.asm` creates an Interrupt Descriptor Table at:

```text
0x2000
```

The IDT tells the CPU where to jump when interrupts and exceptions happen.

## 5. The kernel remaps the PIC

The old Programmable Interrupt Controller maps hardware IRQs onto CPU interrupt numbers. Sky OS remaps:

```text
IRQ0 timer    -> interrupt 32
IRQ1 keyboard -> interrupt 33
```

Without this, hardware interrupts would overlap with CPU exception numbers.

## 6. The kernel starts the timer

The Programmable Interval Timer is configured to tick around 100 times per second. Every few ticks the kernel prints a dot, proving IRQ0 is alive.

## 7. The kernel reads keyboard IRQs

The keyboard handler reads scancodes from:

```text
0x60
```

Unlike the first preview, this is interrupt-driven. The CPU sleeps with `hlt` and wakes when hardware interrupts arrive.

## 8. The kernel writes to VGA memory

The kernel writes characters directly to:

```text
0xB8000
```

That address is the classic VGA text buffer.

Each screen cell is two bytes:

```text
character byte
color byte
```

## Your Next Job

Read these files in this order:

```text
boot/boot.asm
kernel/kernel32.asm
scripts/build-windows.ps1
```

Then change the welcome text in `kernel/kernel32.asm`, rebuild, and boot again.
