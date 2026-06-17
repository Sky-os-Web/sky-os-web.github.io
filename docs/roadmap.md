# Sky OS Roadmap

## V0.1: First Heartbeat

- handmade boot sector
- 512-byte standalone preview

## V0.2: Real Kernel Basics

- boot sector loads separate kernel
- protected-mode switch
- kernel-owned VGA console
- Interrupt Descriptor Table
- Programmable Interrupt Controller remap
- Programmable Interval Timer
- keyboard interrupt driver
- halt/wake interrupt loop

## V0.3: C Kernel Track

- freestanding C build on Windows or WSL
- alternate C boot image
- C kernel entry
- linker script cleanup
- assembly entry stub for C
- VGA text output
- command prompt

- serial logging
- panic screen
- better console

## V0.4: Debug And Memory

- COM1 serial driver
- named exception stubs
- panic vector, error code, and EIP reporting
- BIOS E820 memory map
- first physical page allocator
- interactive shell
- RAM filesystem demo
- memory allocation commands
- quiet timer tick counter
- uptime command
- bootloader-loaded SkyFS sector
- animated boot screen
- identity paging
- kernel heap
- friendlier command names

## V0.5: Memory Management

- bitmap physical memory allocator
- move shell/console/memory code into C

## V0.6: Programs

- process structure
- cooperative scheduler
- user mode
- syscall gate
- simple executable format

## V0.7: Files

- ATA or AHCI disk reading
- RAM disk
- simple SkyFS filesystem
- file browser commands

## V0.8: Graphics

- VESA or GOP framebuffer boot
- pixel drawing
- font renderer
- mouse driver
- compositor experiments

## V1.0: Sky Desktop

- graphical shell
- windows
- launcher
- settings
- file manager
- basic app toolkit

## Long-Term Compatibility

Running Windows, Linux, and macOS apps is not a first-kernel feature. It needs compatibility layers:

- Linux: ELF loader plus syscall compatibility
- Windows: PE loader plus Win32/NT API layer, similar in spirit to Wine
- Games: graphics/audio/input translation, eventually Vulkan/OpenGL/DirectX translation
- macOS: Mach-O and Cocoa-like compatibility, much harder and legally sensitive
