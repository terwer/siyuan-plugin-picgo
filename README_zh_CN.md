[English](README.md)

# PicGo插件

![](./preview.png)

您喜爱的 PicGo 图床在思源笔记依然可用，没想到吧~

## PicGo 2.0：这一次，上传终于顺了

PicGo 2.0 是一次把历史债真正清掉的版本。现在粘贴一张图片，PicGo 会从第一秒接手到底：不再双上传，不再轮询苦等，不再猜 DOM，也不再让思源默认流程先插入本地图片、再由插件事后改成图床链接。少一次卡顿，少一次疑惑，也少一次“它到底传了几遍”的不安。

更重要的是，底层也重新理顺了：主图床配置可以跟着思源工作空间走，插件依赖、缓存、日志这些重文件安心留在本机；Publisher 和更多插件也能直接借用 PicGo 的上传核心，不必把完整 PicGo 界面塞进每一个场景。老用户一打开就会觉得轻了、顺了；新用户第一次上手，也不用先理解一堆历史包袱。

你每天真正摸得到的，是更轻快的 popup、安静完成的一次性迁移、说得明白的重载提示，以及一条终于干净下来的上传链路。如果你曾经觉得 PicGo 还能更好，2.0 就是那个值得马上重新打开的版本。

## 推荐配置

号外号外！推荐自己搭建 minio 搭配 PicGo 插件使用，不会用的我写了个图文教程💄，[点击这里查看](https://siyuan.wiki/s/20241129133646-lz08gnl) 。

## 版本兼容

> 重要提示：
>
> PicGo `2.0.0+` 调整了配置路径：主配置随工作空间同步，运行时、插件依赖、缓存和日志留在本机。完整路径见下方 `v2.0.0 配置路径变更`。
>
> 思源笔记 `3.0.3` 之前的版本请不要升级本插件，最高只能使用使用 `1.5.1` 版本。 思源笔记 `3.0.3` 之后的版本可升级 PicGO 插件到 `1.6.0+` 。
>
> 思源笔记 `2.10.8` 之前的版本请不要升级本插件，最高只能使用使用 `1.4.5` 版本。 思源笔记 `2.10.8` 之后的版本可升级 PicGO 插件到 `1.5.0+` 。

### v2.0.0 配置路径变更

v2.0.0 是破坏性整理版本，包含前一轮 PicGo 内部重构，也包含本次存储路径拆分。

内置 PicGo 主配置回到工作空间，适合随思源工作空间同步：

```text
[工作空间]/data/storage/syp/picgo/
  picgo.cfg.json
```

设备本地运行时仍留在本机目录，不随工作空间同步：

```text
~/.universal-picgo/
  external-picgo-cfg.json
  package.json
  package-lock.json
  node_modules/
  libs/
  i18n-cli/
  picgo-clipboard-images/
  mac.applescript / windows.ps1 / windows10.ps1 / linux.sh / wsl.sh
  picgo.log
```

迁移规则：如果工作空间缺少 `picgo.cfg.json`，并且 `~/.universal-picgo/picgo.cfg.json` 存在，v2 只复制这一个文件到工作空间；不删除 home 旧文件，不覆盖已有工作空间配置，也不迁移整个目录。

### 历史路径

```text
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
