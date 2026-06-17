# Sky OS Release Checklist

Release builds must be boring, reproducible, and debuggable.

## Required Before Any Public Image

- Clean boot into `sky>` three times in a row.
- `guide`, `files`, `open readme.txt`, `disk`, `recovery`, and `status` work.
- `desktop` can open, and `home` returns to shell without corrupting input.
- `run apps/hello.skyex` exits cleanly.
- `run games/guess.skygame`, then `exit`, returns to shell.
- Unknown commands print `"name" is not recognized as an internal command`.
- QEMU boot smoke test survives at least 10 seconds.

## Diagnostics

- Keep serial logging available.
- Panic screen must include exception name and code.
- Recovery command must show disk/SkyFS/kernel metadata.

## Known Limitations To Publish

- Windows PE files are inspected through WinCompat but real WinAPI execution is not complete.
- GUI is currently text-mode, not a true framebuffer desktop.
- Networking is an internal stack model until a NIC backend is added.
- Mouse is GUI-scoped and must not affect shell input.

## Versioning

Each release image should print:

```text
Sky OS version
build date
disk layout version
SkyFS version
```

