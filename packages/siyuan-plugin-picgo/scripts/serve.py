import shutil
import sys

# 设置标准输出的编码为 UTF-8
# Windows 必须添加此设置
sys.stdout.reconfigure(encoding="utf-8")

# "serve": "cp index.siyuan-nginx.html index.html && cp vite.config.siyuan-nginx.ts vite.config.ts && vite"
shutil.copyfile("vite.config.web.ts", "vite.config.ts")
print("Config is reset to web, will serve as browser")

# vite
# 会阻塞，最好在 npm 的 scripts 里面，便于及时查看日志
