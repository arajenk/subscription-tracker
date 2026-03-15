# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec for the subtracker FastAPI sidecar.
# Build with: python -m PyInstaller subtracker-backend.spec --clean --noconfirm

import sys

hiddenimports = [
    # uvicorn internals not auto-detected by PyInstaller
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.loops.asyncio",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.http.h11_impl",
    "uvicorn.protocols.websockets",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    "uvicorn.lifespan.off",
    "h11",
    # pydantic v2 validators
    "pydantic.deprecated.class_validators",
]

# plyer uses platform-specific backends loaded at runtime
if sys.platform == "darwin":
    hiddenimports += ["plyer.platforms.macosx.notification"]
elif sys.platform == "win32":
    hiddenimports += ["plyer.platforms.win.notification"]
else:
    hiddenimports += ["plyer.platforms.linux.notification"]

a = Analysis(
    ["main.py"],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter", "matplotlib", "numpy", "pandas", "PIL"],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="subtracker-backend",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,           # keep console so Tauri can read stdout/stderr
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
