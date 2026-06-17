# Sky OS Architecture Foundation

Sky OS now boots through:

```text
sector 0      stage 1 boot sector
sector 1-8    stage 2 loader
sector 9-520  32-bit C kernel slot, loaded at physical 0x10000
sector 521-776 64-bit kernel slot, future load at physical 0x00200000
sector 777    recovery info
sector 778    Sky Partition Table and kernel load metadata
sector 779    SkyFS V2 superblock
sector 780-787 SkyFS V2 file table
sector 788    SkyFS V2 allocation bitmap
sector 789+   file data
```

Stage 1 only loads stage 2. Stage 2 owns BIOS memory-map collection, LBA disk reads, dynamic kernel loading, SkyFS superblock loading, A20, GDT, protected mode, and the handoff into the C kernel. The 32-bit kernel slot is reserved for 512 sectors and the 64-bit kernel slot is reserved for 256 sectors. The actual loaded sector counts are read from Sky Partition Table metadata.

Before switching to protected mode, stage 2 writes a `SkyBootInfo v2` block at `0x6000`. The C entry preserves the pointer and passes it as the first argument to `sky_kernel_main`.

`SkyBootInfo` contains:

- magic/version/size
- BIOS boot drive
- stage-2 disk location
- kernel disk location and loaded sector count
- Sky Partition Table LBA
- SkyFS superblock LBA
- RAM disk address/sector count
- E820 memory-map address/count
- optional VBE framebuffer address, dimensions, pitch, bpp, and RGB masks
- boot protocol: BIOS now, UEFI later
- CPU mode: protected32 now, long64 later
- loader capabilities: LBA, E820, VBE, dynamic kernel metadata, BootInfo v2
- reserved ACPI RSDP and EFI system table pointers
- reserved kernel64 disk location and entry point

The C entry path now clears `.bss` before calling `sky_kernel_main`, so runtime globals start from a known state.

## Bootloader V2

Current:

- stage 1 loads stage 2 from fixed disk sectors
- stage 2 reads Sky Partition Table metadata to learn the actual kernel sector count
- stage 2 fills BootInfo v2 and enters 32-bit protected mode
- kernel command `boot2` reports protocol, CPU mode, loader capabilities, ACPI/EFI placeholders, and x64 readiness
- `kernel/c/entry64.asm` exists as the future long-mode landing pad
- `boot/x64-transition.asm` builds as a checked transition artifact with PML4/PDPT/PD setup, PAE, EFER.LME, paging, a 64-bit GDT, and a jump to `0x00200000`

Target sequence for Intel/AMD x64:

1. Keep the BIOS protected-32 path as fallback.
2. Use CPUID to require long mode and PAE.
3. Build PML4, PDPT, and page-directory identity maps.
4. Enable PAE in CR4.
5. Set EFER.LME.
6. Enable paging with long mode.
7. Far jump to a 64-bit code segment.
8. Call `sky_kernel64_entry` with BootInfo v2.

Target sequence for UEFI:

1. Build a PE/COFF EFI app.
2. Use GOP for framebuffer info.
3. Read the UEFI memory map.
4. Capture ACPI RSDP and EFI system table pointers.
5. Load the kernel image from the EFI system partition.
6. Enter the same BootInfo v2 kernel contract.

## Module Split

The build now compiles module boundary files alongside the monolithic kernel. Driver descriptors live in the module files, while most runtime code still remains in `sky_kernel.c`.

The next refactor should move actual function bodies out of `sky_kernel.c` in this order:

1. `console.c`
2. `keyboard.c`
3. `skyfs.c`
4. `shell.c`
5. `process.c`
6. `mouse.c`
7. `wincompat.c`

Move one subsystem at a time and boot-test after each move.

## Interrupt-Driven Input

Current:

- IDT is loaded by the C kernel.
- PIC is remapped to vectors `0x20-0x2F`.
- IRQ0 increments kernel ticks.
- IRQ1 pushes keyboard characters into the input queue.
- IRQ12 consumes PS/2 mouse packets while GUI mouse is enabled.
- The main loop no longer polls keyboard every tick.

Target:

- IRQ0 timer drives ticks/scheduling.
- IRQ1 keyboard handler pushes `sky_key_event`.
- IRQ12 mouse handler pushes pointer events.
- Shell consumes only keyboard events.
- GUI consumes keyboard and mouse events.

No input driver should write directly to shell state.

## Scheduler

Current:

- process records include saved context fields for ESP, EBP, EFLAGS, CR3, and mode
- cooperative `yield` rotates runnable process ownership and switches the selected process CR3
- IRQ0 records timeslice expirations and sets preemption requests
- safe-point preemption service can honor a pending request outside the IRQ stack path
- waitable process objects can block on sleep deadlines or process exit records
- `sched` reports cooperative switches, timer preemption requests, context saves/loads, wait wakeups, and last from/to PIDs
- `contexts` reports saved context state per process
- true timer task switching still waits for safe interrupt-frame save/restore

Target:

- save full interrupt frame on timer IRQ
- switch CR3 and kernel stack through TSS
- restore another runnable process frame
- support blocking waits without freezing the shell

## Object Handles

Current:

- the kernel seeds standard handles `0` stdin, `1` stdout, and `2` stderr
- SkyFS files can be opened as kernel-managed file handle objects
- each handle tracks type, owner PID, rights, position, size, LBA, flags, and name
- user processes get local handle maps that point at kernel handle objects
- process exit closes file handles owned by that PID
- shell diagnostics: `handles`, `handle ID`, `hopen NAME`, `hread ID BYTES`, `hseek ID POS`, `hclose ID`
- VFS diagnostic: `open /proc/handles`
- syscall ABI numbers `8-12` cover handle open/read/close/seek/info
- syscall ABI numbers `13-14` cover process wait/status

Target:

- add reference counts and object namespaces
- add file write handles, device handles, pipes, events, timers, and process handles
- enforce rights at syscall boundaries

## Memory Manager

Target:

- page frame bitmap from E820 usable RAM
- kernel heap with free lists
- process address regions
- user/app stacks
- guard pages once paging is expanded

## Executables

Target Sky native format:

```text
magic       SKYBIN1
entry       virtual entry point
code_size   bytes
data_size   bytes
bss_size    bytes
flags       console/gui/network/fs permissions
```

SKYEX can stay as readable script apps. SKYBIN should become the native binary app format.

JavaCompat currently recognizes `.jar` and `.class` files, creates a Sky process, opens the archive through the handle layer, and reports the runtime pieces needed for Minecraft/TLauncher. Real Java app execution still needs a JVM bytecode runtime/JIT, class library, zip/jar filesystem, TLS/networking, OpenGL/LWJGL or native GPU backend, audio, and threads.

## Filesystem Safety

Target:

- directory entries as first-class records
- larger file extents
- bitmap transaction journal
- recovery scan
- safe replace by write-new-then-swap

Current:

- create, replace, delete, rename, and copy write a recovery journal record before and after disk mutation
- `recovery` reports pending or committed journal state, operation, path, LBA, sectors, and file count

## Graphics

Current:

- stage 2 tries safe VBE linear framebuffer modes
- framebuffer fields and VBE status are recorded in SkyBootInfo
- kernel has pixel, rectangle, text, cursor, and SkyGUI v2 drawing
- SkyGUI v2 has window chrome, title buttons, icon tiles, system cards, dock, and a crosshair pointer
- VGA text remains the fallback path

Target:

- bitmap font renderer
- pointer sprite
- panels/windows compositor
- icon cache
- file manager app

## Driver Model

Current:

- `include/sky/driver.h` defines `sky_driver`.
- `include/sky/input.h` defines `sky_input_event`.
- module files define descriptors for VGA text, ATA PIO, PS/2 keyboard, and PS/2 mouse.
- the C kernel registers HAL targets for Intel/AMD x86, Intel/AMD x64, PC ACPI/PCI, generic ARM64, Apple Silicon ARM64, RISC-V, VBE, NVIDIA GPU, and Apple display.
- CPUID detection records the active CPU vendor, family, model, stepping, APIC, PAE, SSE/SSE2, long mode, NX, and large-page readiness.
- ACPI detection scans EBDA and BIOS high memory for the RSDP.
- ACPI parsing follows RSDT/XSDT entries and extracts MADT LAPIC/IOAPIC/interrupt override counts plus FADT power/reset fields.
- PCI detection scans bus 0 through config ports `0xCF8/0xCFC`, stores BAR0-BAR5 and IRQ lines for the first devices, and counts storage, network, display, and bridge devices.

Target:

- each driver has init, poll/irq, status
- PCI enumeration
- ATA/IDE behind disk API
- PS/2 behind input API
- NIC behind network API

## Universal Hardware Targets

Sky OS is active today on the BIOS i386 path. The universal target registry is the bridge toward more hardware without pretending those ports are finished.

Current command surfaces:

- `cpu` or `open /sys/cpu`: detected Intel/AMD-compatible CPU details from CPUID
- `acpi` or `open /sys/acpi`: ACPI RSDP detection
- `madt` or `open /sys/madt`: APIC table summary
- `fadt` or `open /sys/fadt`: power/reset table summary
- `pci` or `open /sys/pci`: PCI config-space scan
- `pci devices` or `open /sys/pci/devices`: stored PCI devices with BARs
- `gpu` or `open /sys/gpu`: VBE framebuffer state plus NVIDIA/Apple display backend requirements
- `hardware` or `open /sys/hardware`: full HAL report
- `targets`: compact target table
- `target NAME`: one backend requirement

Port order:

1. Intel/AMD x64: long mode, PML4 paging, APIC/IOAPIC, ACPI, PCI.
2. Generic ARM64: UEFI or DTB boot, EL1 setup, GIC, ARMv8 MMU.
3. RISC-V: SBI boot, trap vector, PLIC/CLINT, Sv39 paging.
4. Apple Silicon: m1n1-style boot chain, Apple device tree, interrupt/timer/display bring-up.
5. NVIDIA/Apple display: PCI/device-tree discovery, BAR or display-controller mapping, modeset, firmware/protocol support.
