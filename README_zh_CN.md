[English](README.md)

# PicGo插件

![](./preview.png)

您喜爱的 PicGo 图床在思源笔记依然可用，没想到吧~

## v3.0.1

v3.0.1 修复了浏览器/Docker 环境下，当内核存储文件缺失或不可用时导致整个设置页白屏崩溃的问题。配置门面在异步读取失败时现在会优雅降级继续使用默认值，而不会直接抛出异常；内核存储适配器的 JSON 解析器也会捕获损坏文件，而不是直接崩溃。

## PicGo 3.0+：配置归一化，同一工作空间内不再割裂

PicGo 3.0 在 2.0 把上传链路理顺了的基础上，继续往前走，把配置链路也补齐。现在，内置图床配置、外部 PicGo/PicList 选择、思源连接配置都有各自清楚的配置文件；无论你在 PC 端打开、在能访问思源 API 的网页端打开，还是用 Docker 方式部署思源，PicGo 都会读取同一套真实的工作空间配置，而不是悄悄掉回浏览器本地默认值。

日常能感受到的变化很直接：换一个入口打开 popup，也能看到之前保存过的图床；外部 PicGo 和 PicList 设置不再散落在另一个本地角落；连接配置也会沿着同一条“先加载、再使用”的链路进入插件。运行时文件仍然安心留在本机，第三方插件依赖、缓存、日志、脚本这些重文件不会被拖进工作空间同步。

底层也更稳了一点：真实配置读取完成后才会进入可用状态；需要保存落盘的界面会等保存完成；迁移按配置域拆开处理，不会因为某一块还需要默认值，就覆盖另一块已有的用户数据。如果说 2.0 让上传变干净，3.0 就是让上传背后的配置也变得踏实。

另外，在网页端或 Docker 这类容易遇到跨域限制的场景，只要思源 API 可用，PicGo 会走思源内置的正向代理，把这些细节尽量藏在底层。看不到的地方，也会好好守住。

## 推荐配置

号外号外！推荐自己搭建 minio 搭配 PicGo 插件使用，不会用的我写了个图文教程💄，[点击这里查看](https://siyuan.wiki/s/20241129133646-lz08gnl) 。

## 版本兼容

> 重要提示：
>
> PicGo `3.0.0+` 使用统一配置来源。内置 PicGo 配置、外部 PicGo/PicList 配置、思源连接配置，在思源 API 可用时都会从工作空间配置文件读取；运行时文件、第三方插件依赖、缓存、脚本和日志仍留在当前设备。
>
> `2.0.0` 的路径拆分说明已经并入下方 `历史路径`，作为老版本迁移参考。
>
> 思源笔记 `3.0.3` 之前的版本请不要升级本插件，最高只能使用 `1.5.1` 版本。 思源笔记 `3.0.3` 之后的版本可升级 PicGO 插件到 `1.6.0+` 。
>
> 思源笔记 `2.10.8` 之前的版本请不要升级本插件，最高只能使用 `1.4.5` 版本。 思源笔记 `2.10.8` 之后的版本可升级 PicGO 插件到 `1.5.0+` 。

### v3.0.0 配置路径变更

v3.0.0 是一次配置链路整理版本。它保留 v2 的运行时拆分，同时把用户可感知的 PicGo 配置都放到明确的工作空间配置文件中。

随工作空间保存的配置：

```text
[工作空间]/data/storage/syp/picgo/
  picgo.cfg.json                  # 内置 PicGo 主配置、上传器设置、插件值、粘贴行为等
  external-picgo-cfg.json         # 外部 PicGo App / PicList API 选择和地址

[工作空间]/data/storage/syp/
  siyuan-cfg.json                 # 思源 API 连接配置
```

设备本地运行时仍留在本机目录，不随工作空间同步：

```text
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

迁移规则：v3 会按配置域导入可迁移的旧数据，写入新的配置文件；已有真实用户配置不会被默认值覆盖。迁移完成后会留下标记，后续启动保持安静。

关于极端同时编辑：如果同一个思源工作空间里的多个 PicGo 入口，几乎同时修改同一项 PicGo 设置，会以最后保存的内容为准。

注意：这不涉及思源多工作空间，多工作空间天然各自隔离。日常正常使用基本遇不到。

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


## 支持图床

- Github<sup>强烈推荐</sup>
- Gitlab<sup>强烈推荐</sup>
- 阿里云
- 腾讯云
- 又拍云
- 七牛云<sup>强烈推荐</sup>
- SM.MS
- imgur
- Amazon S3<sup>强烈推荐</sup> ，感谢 [@hzj629206](https://github.com/hzj629206) 的贡献
- 兰空图床<sup> v1.11.0+</sup>

## 更新历史

请参考 [CHANGELOG](https://github.com/terwer/siyuan-plugin-picgo/blob/main/CHANGELOG.md)

## 捐赠

如果您认可这个项目，请我喝一杯咖啡吧，这将鼓励我持续更新，并创作出更多好用的工具~

### 微信

<div>
<img src="https://static-rs-terwer.oss-cn-beijing.aliyuncs.com/donate/wechat.jpg" alt="wechat" style="width:280px;height:375px;" />
</div>

### 支付宝

<div>
<img src="https://static-rs-terwer.oss-cn-beijing.aliyuncs.com/donate/alipay.jpg" alt="alipay" style="width:280px;height:375px;" />
</div>

## 相关项目

- [sy-picgo-core](https://github.com/terwer/sy-picgo-core)
- [Electron-PicGo-Core](https://github.com/terwer/Electron-PicGo-Core)
- [picgo-plugin-watermark-elec](https://github.com/terwer/picgo-plugin-watermark-elec)

## 感谢

感谢来自开源社区提供的解决方案，简化了本项目的不少工作！

- [PicGo-Core](https://github.com/PicGo/PicGo-Core)
- [PicList](https://github.com/Kuingsmile/PicList)
