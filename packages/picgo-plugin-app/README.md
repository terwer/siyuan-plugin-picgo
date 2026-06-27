# picgo-plugin-app

picgo plugin app for siyuan-note

## Deps

```
├── universal-picgo
```

## Docs

### v3.0.0 路径契约

v3.0.0 是配置链路整理版本：用户可感知的 PicGo 配置都进入思源工作空间配置文件，设备本地运行时仍留在 `~/.universal-picgo`。

```text
[工作空间]/data/storage/syp/picgo/
  picgo.cfg.json                  # 内置 PicGo 主配置、上传器设置、插件值、粘贴行为等
  external-picgo-cfg.json         # 外部 PicGo App / PicList API 选择和地址

[工作空间]/data/storage/syp/
  siyuan-cfg.json                 # 思源 API 连接配置

~/.universal-picgo/
  package.json
  package-lock.json
  node_modules/
  libs/
  i18n-cli/
  picgo-clipboard-images/
  mac.applescript / windows.ps1 / windows10.ps1 / linux.sh / wsl.sh
  picgo.log
```

`external-picgo-cfg.json` 与 `siyuan-cfg.json` 从 3.0 开始也归入工作空间配置；PicGo 第三方插件、`node_modules`、缓存、脚本、日志仍不随工作空间同步。

### 历史路径

```text
2.0.0 - 2.x
[工作空间]/data/storage/syp/picgo/picgo.cfg.json
~/.universal-picgo/external-picgo-cfg.json
~/.universal-picgo/package.json
~/.universal-picgo/package-lock.json
~/.universal-picgo/node_modules/
~/.universal-picgo/libs/
~/.universal-picgo/i18n-cli/
~/.universal-picgo/picgo-clipboard-images/
~/.universal-picgo/*.script
~/.universal-picgo/picgo.log

1.6.0+
~/.universal-picgo/picgo.cfg.json
~/.universal-picgo/external-picgo-cfg.json
~/.universal-picgo/package.json
~/.universal-picgo/package-lock.json
~/.universal-picgo/node_modules/
~/.universal-picgo/libs/
~/.universal-picgo/i18n-cli/
~/.universal-picgo/picgo-clipboard-images/
~/.universal-picgo/*.script
~/.universal-picgo/picgo.log

<= 1.5.6
[工作空间]/data/storage/syp/picgo/picgo.cfg.json
[工作空间]/data/storage/syp/picgo/external-picgo-cfg.json
[工作空间]/data/storage/syp/picgo/package.json
[工作空间]/data/storage/syp/picgo/package-lock.json
[工作空间]/data/storage/syp/picgo/node_modules/
[工作空间]/data/storage/syp/picgo/libs/
[工作空间]/data/storage/syp/picgo/i18n-cli/
[工作空间]/data/storage/syp/picgo/picgo-clipboard-images/
[工作空间]/data/storage/syp/picgo/*.script
[工作空间]/data/storage/syp/picgo/picgo.log
```
