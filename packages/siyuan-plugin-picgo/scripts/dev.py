import shutil
import sys
import os

# 设置标准输出的编码为 UTF-8
# Windows 必须添加此设置
sys.stdout.reconfigure(encoding="utf-8")

# siyuan-plugin-bootstrap
# os.system("")

# picgo-app
os.system("vue-tsc && vite build --watch")