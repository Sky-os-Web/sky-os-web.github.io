# Sky OS

Sky OS is now a from-scratch hobby operating system project.

This workspace does not use Ubuntu, Linux remastering, GRUB, Limine, or a prebuilt OS base. The current version is still tiny, but it has real kernel systems:

- custom 512-byte BIOS boot sector
- second-stage BIOS loader with LBA disk reads
- explicit SkyBootInfo v2 handoff from stage 2 to the kernel
- boot manager fields for BIOS/UEFI protocol, CPU mode, loader capabilities, ACPI, EFI, and future kernel64 handoff
- VBE linear framebuffer handoff with VGA text fallback
- separate 32-bit protected-mode C kernel loaded dynamically from disk
- proper C entry path that clears `.bss` before kernel runtime starts
- Global Descriptor Table from the stage-2 loader
- Interrupt Descriptor Table from the kernel
- remapped PIC with IRQ0 timer, IRQ1 keyboard, and IRQ12 mouse stubs
- named CPU exception stubs with panic diagnostics
- remapped Programmable Interrupt Controller
- Programmable Interval Timer IRQ
- keyboard IRQ
- COM1 serial logging code
- BIOS E820 memory-map handoff
- early physical page allocator
- identity paging for the first 4 MiB
- bump kernel heap starting at 0x00200000
- animated Sky OS boot screen
- interactive kernel shell
- editable keyboard input with Enter and Backspace
- protected-mode ATA sector reads after boot
- Sky Partition Table with named system, recovery, files, apps, and settings partitions
- metadata-driven kernel sector loading from the Sky Partition Table
- SkyFS V2 with typed files, 64-bit sector fields, allocation bitmap, safer writes, multi-sector files, path-style directories, SKYEX apps, SkyGame files, SkyImage files, and recognized Windows/Linux/document/media/archive/config extensions
- subsystem status surfaces for core stability, drivers, networking, ports, GUI apps, docs, and SMP planning
- C-based console, shell, heap, memory, SkyFS, IRQ-backed input queue, and module boundary files
- CPUID-backed hardware detection for Intel/AMD-compatible CPUs
- ACPI RSDP/RSDT/XSDT/MADT/FADT parsing and PCI configuration-space/BAR scan in the stable 32-bit kernel
- device manager with PCI device objects, BAR sizes, IRQ lines, and driver candidates
- APIC/IOAPIC routing runtime with LAPIC mapping and masked LAPIC timer setup
- HAL target registry for Intel/AMD x86, Intel/AMD x64, generic ARM64, Apple Silicon ARM64, RISC-V, VBE, NVIDIA, and Apple display backends
- SkyFS recovery journal for create, replace, delete, rename, and copy operations
- framebuffer console, pixel drawing primitives, and SkyGUI v2 when VBE is available
- text-mode UI painter with launcher/files/system panels
- synced PS/2 mouse packets with smoother fixed-point cursor movement
- in-kernel Ethernet/ARP/IPv4/UDP model with bind/listen/send/receive/drop port accounting
- SKYEX process runner with PIDs, process table, process listing, kill command, and file/network/syscall-style app instructions
- cooperative scheduler context objects with saved ESP/EBP/EFLAGS/CR3 fields and process switch accounting
- Windows file compatibility runtime with MZ/PE inspection and a WinCompat launcher for `.exe`, `.dll`, `.sys`, `.bat`, and `.sh` style foreign executable files
- alternate freestanding C kernel scaffold
- VGA text console
- raw bootable disk image for QEMU

## Build

Fast Windows build:

```powershell
winget install --id NASM.NASM --exact
winget install --id SoftwareFreedomConservancy.QEMU --exact
.\scripts\build-windows.ps1
.\scripts\run-windows.ps1
```

This creates:

```text
out/sky-os-bootsector.bin
out/sky-os-stage1-preview.img
out/sky-os.img
```

`out/sky-os.img` is the main 64 MB bootable development disk image. It contains the boot sector, stage-2 loader, 32-bit C kernel, parallel 64-bit kernel stub, recovery sector, Sky Partition Table, and SkyFS V2 filesystem. `out/sky-os-stage1-preview.img` is kept as the older 512-byte experiment.

Current disk layout:

```text
sector 0      boot sector
sector 1-8    stage-2 loader
sector 9-520  32-bit C kernel slot
sector 521-776 64-bit kernel slot
sector 777    recovery info
sector 778    Sky Partition Table and kernel load metadata
sector 779    SkyFS V2 superblock
sector 780-787 SkyFS V2 file table
sector 788    SkyFS V2 allocation bitmap
sector 789+   file data sectors
```

Build from WSL or Linux:

```bash
sudo apt update
sudo apt install -y build-essential gcc-multilib nasm qemu-system-x86 xorriso
./scripts/build.sh
```

Run:

```bash
./scripts/run.sh
```

If you are on Windows, install WSL first:

```powershell
wsl --install
```

Restart Windows if asked, open Ubuntu/WSL, `cd` into this folder through `/mnt/c/Users/roshi/Downloads/sky\ os`, then run the Linux build commands above.

The bootable image is written to:

```text
out/sky-os.img
```

## Project Map

```text
boot/boot.asm          stage-1 BIOS boot sector
boot/stage2.asm        stage-2 loader, LBA reads, memory map, protected-mode switch
boot/sky-os-stage1.asm complete 512-byte bootable preview image
kernel/kernel32.asm    current handwritten 32-bit kernel
kernel/c/              freestanding C kernel and module boundary files
kernel/entry.asm       future C-kernel entry point
kernel/kernel.c        future freestanding C kernel
kernel/linker.ld       future C-kernel memory layout
include/sky/           tiny kernel headers
scripts/build.sh       Linux C-kernel build path
scripts/run.sh         Linux QEMU launcher
scripts/build-windows.ps1 builds the current Windows image
scripts/build-c-kernel-windows.ps1 builds alternate C image
scripts/run-windows.ps1   starts QEMU on Windows
scripts/check-c-toolchain.ps1 checks GCC/binutils
docs/lesson-01.md      walkthrough of what this code does
docs/architecture-foundation.md architecture plan for loader/modules/drivers
docs/release-checklist.md release-mode stability checklist
docs/roadmap.md        next engineering milestones
```

## Current Milestone

Sky OS boots through a stage-1 boot sector and stage-2 loader, shows an animated welcome screen, loads its own C kernel through LBA disk reads, switches to protected mode, clears C runtime `.bss`, reads the BIOS memory map, starts a kernel heap, mounts SkyFS V2 from disk sectors, opens a friendlier shell, and can draw a text-mode desktop.

Stage 2 now builds a `SkyBootInfo v2` structure before entering protected mode. The C kernel is loaded at `0x10000`, validates that boot block, and uses it as the real handoff contract for boot drive, stage-2 location, kernel location/size, Sky Partition Table, SkyFS superblock, RAM disk, BIOS memory map, boot protocol, CPU mode, loader capabilities, and future ACPI/UEFI/kernel64 fields.

`boot2` shows the boot manager: BIOS vs future UEFI protocol, current protected-32 mode, loader capabilities, x64 CPU readiness, ACPI/EFI placeholder fields, and the future 64-bit kernel entry plan.

Stage 2 now tries safe VBE framebuffer modes and records a VBE status code in SkyBootInfo. If VBE succeeds, the kernel enables the framebuffer console and SkyGUI v2. If VBE fails, Sky OS falls back to VGA text.

SkyFS V2 now has a real superblock, eight-sector file table with room for 64 entries, allocation bitmap, typed files, file names, file sizes, multi-sector file data, path-style directories, a recovery sector, and 64-bit sector fields so disks and partitions can be represented up to 16 TB. Creates, copies, deletes, and larger edits now reserve/free sectors through the bitmap instead of only scanning for the highest used sector.

In QEMU, try:

```text
guide
status
boot
boot2
graphics
sleep
restart
shutdown
memory
filesystem
programs
apps
reserve
files
dir
pwd
cd apps
dir
run hello.skyex
ps
contexts
handles
preempt
wait 1
hopen readme.txt
hread 3 128
hseek 3 0
handle 3
hclose 3
sched
yield
cd ..
types
disk
open media/logo.skyimg
open docs/manual.pdf
open media/photo.png
open archives/demo.zip
open config/sky.ini
open foreign/demo.exe
winrun foreign/demo.exe
run foreign/demo.exe
wincompat
open /sys/wincompat
system
doctor
services
service core
assoc
apps
jars
where minecraft
launch calc
java
java tlauncher
java minecraft
run tlauncher
run minecraft
mcinfo
minecraft
run apps/hello.skyex
run apps/disk.skyex
run games/guess.skygame
ps
desktop
core
drivers
cpu
acpi
madt
fadt
pci
pci devices
devices
device 1
apic
abi
gpu
hardware
net
netup
ports
listen 8080
send 8080 hello
recv 8080 reply
closeport 8080
api
docs
multicore
open docs/dev.txt
open docs/api.txt
open source/kernel.txt
open /sys/cpu
open /sys/gpu
open /sys/hardware
create notes.txt
edit notes.txt
.save
append notes.txt
.save
copy notes.txt notes-copy.txt
rename notes-copy.txt ideas.txt
cut ideas.txt
paste moved.txt
delete moved.txt
exit
open readme.txt
open system/info.txt
info system/info.txt
recovery
time
home
desktop
```

`disk` shows the friendly SkyDisk name, total space, used space, free space, file count, partition list, and health checks.

Core system commands: `system`, `doctor`, `services`, `service NAME`, `memory`, `drivers`, `devices`, `device ID`, `cpu`, `acpi`, `madt`, `fadt`, `apic`, `pci`, `pci devices`, `abi`, `gpu`, `hardware`, `programs`, `filesystem`, `apps`, `assoc`, `where NAME`, `launch NAME`, `wincompat`, `mcinfo`, `jars`, `docs`, `net`, `ports`, `ps`, `contexts`, `handles`, `sched`, `preempt`, and `minecraft` show the major OS systems as status panels.

Power commands: `sleep` waits in low-power mode until a key is pressed, `restart`/`reboot` resets through the keyboard controller, and `shutdown`/`shut down` sends common QEMU/ACPI power-off requests.

`desktop` opens SkyGUI v1: a modernized VGA UI shell with a top bar, launcher, file manager panel, window panels, dock, and PS/2 mouse cursor. Click folder rows in the file manager to switch folders. `home` returns to the shell. True pixel framebuffer graphics and custom fonts are the next graphics milestone.

When framebuffer mode is available, `desktop` opens SkyGUI v2 with a pixel background, top bar, window chrome, title buttons, system cards, folder icons, dock, and a crosshair precision pointer. `graphics` reports the framebuffer address, resolution, pitch, and color depth.

`netup` brings up the SkyNet stack with a QEMU-style address, gateway, mask, ARP cache state, and Ethernet/IPv4/UDP counters. `listen PORT` opens a UDP listener, `send PORT TEXT` queues a packet through the stack, `recv PORT TEXT` simulates an inbound packet for that listener, `ports` shows per-port TX/RX/drop stats, and `closeport PORT` closes it.

`run NAME` starts a Sky-native executable. `.skyex` programs now get a PID, appear in `ps` while running, and can call app instructions like `print`, `pid`, `ps`, `files`, `disk`, `open`, `write`, `sleep`, `net`, `ports`, `listen`, and `send`. `kill PID` stops a running process, and `wait PID` checks a process exit record. `.skygame` files run through the game runner.

`handles` shows the kernel object table and per-process handle maps. Sky OS now starts with standard console handles `0`, `1`, and `2`, can open SkyFS file objects with `hopen NAME`, read them with `hread ID BYTES`, seek with `hseek ID POS`, inspect with `handle ID`, and close with `hclose ID`. User processes get local handle numbers through syscall numbers `8-12`; `wait` and `process_status` use syscall numbers `13-14`.

`java`, `jars`, and `javaapps` list installed JavaCompat archives. `java tlauncher`, `java minecraft`, `run tlauncher`, and `run minecraft` resolve friendly app names to the installed SkyFS paths from any folder. JavaCompat creates a real Sky process, opens the `.jar` through the handle layer, scans the JAR local headers, reports the manifest `Main-Class`, and then stops cleanly at exit code `78` because Sky OS does not have a JVM yet. Real Minecraft/TLauncher still requires JVM class loading, bytecode execution/JIT, garbage collection, Java libraries, OpenGL/LWJGL, sockets/TLS, audio, threads, and stronger file APIs.

`mcinfo` opens a SkyFS catalog generated from `C:\Users\roshi\AppData\Roaming\.minecraft`, including detected versions, mods, libraries, assets indexes, Java runtimes, and TLauncher executable sizes.

`open foreign/demo.exe` inspects a Windows MZ/PE file. `winrun foreign/demo.exe` or `run foreign/demo.exe` starts the WinCompat path, validates the PE header, reports machine type, entry point, image layout, sections, import DLLs, imported API names, and loader status. The included demo PE imports `KERNEL32.dll!ExitProcess` so the import scanner has a real table to parse. `wincompat` shows the compatibility runtime state.

`core`, `drivers`, `targets`, `cpu`, `gpu`, `hardware`, `net`, `ports`, `api`, `docs`, and `multicore` show the current subsystem matrix. `cpu` uses CPUID to show the current Intel/AMD-compatible CPU vendor, model, long-mode readiness, APIC, PAE, SSE, NX, and page-size capability. The HAL target registry tracks Intel/AMD x86 as active, marks Intel/AMD x64 ready when long mode is detected, and keeps ARM64, Apple Silicon, RISC-V, NVIDIA, and Apple display as real backend targets. Networking now has a real internal stack model and port table, but external networking still needs a PCI NIC backend such as RTL8139, e1000, or virtio-net. SMP is still planned driver work.

The stage-2 loader reads the kernel size from Sky Partition Table metadata and loads the C kernel from a 512-sector reserved slot. This gives the kernel room to split into modules and grow without immediately breaking boot.

Older aliases like `help`, `mem`, `alloc`, `ls`, `cat`, `clear`, and `uptime` still work.

Serial logging is written to COM1. A useful QEMU command for logs is:

```powershell
qemu-system-i386 -drive "format=raw,file=out\sky-os.img,if=ide,index=0,media=disk" -boot order=c -monitor none -serial file:build\serial.log -no-reboot
```

## Manual Windows Build Commands

The script only saves typing. These are the actual commands:

```powershell
nasm -f bin boot\boot.asm -o build\boot.bin
nasm -f bin boot\stage2.asm -o build\stage2.bin
nasm -f bin kernel\kernel32.asm -o build\kernel32.bin
```

Then place `build\boot.bin` at sector `0`, `build\stage2.bin` at sectors `1-8`, `build\sky-os-c-kernel.bin` at sector `9`, `build\sky-os-kernel64.bin` at sector `521`, the recovery sector at sector `777`, the Sky Partition Table at sector `778`, the SkyFS superblock at sector `779`, the file table at sectors `780-787`, the bitmap at sector `788`, and file data at sector `789+` inside a 64 MB raw image.

Run:

```powershell
qemu-system-i386 -drive "format=raw,file=out\sky-os.img,if=ide,index=0,media=disk" -boot order=c -no-reboot
```
