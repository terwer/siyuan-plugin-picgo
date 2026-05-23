import sys
import os
from pathlib import Path

# 设置标准输出的编码为 UTF-8
# Windows 必须添加此设置
sys.stdout.reconfigure(encoding="utf-8")

dist_dir = Path(__file__).resolve().parents[3] / "artifacts" / "siyuan-plugin-picgo" / "dist"
assets_dir = dist_dir / "assets"
if assets_dir.exists():
    for pattern in ("index-*.js", "index-*.css"):
        for artifact in assets_dir.glob(pattern):
            artifact.unlink()

exit_code = os.system("vue-tsc && vite build")
if exit_code != 0:
    sys.exit(exit_code)
print("PicGO plugin build success")
