[English](README.md)

# PicGo插件

![](./preview.png)

您喜爱的 PicGo 图床在思源笔记依然可用，没想到吧~

> 重要提示：
> 
> 思源笔记 `3.0.3` 之前的版本请不要升级本插件，最高只能使用使用 `1.5.1` 版本。 思源笔记 `3.0.3` 之后的版本可升级 PicGO 插件到 `1.6.0+` 。
> 
> 思源笔记 `2.10.8` 之前的版本请不要升级本插件，最高只能使用使用 `1.4.5` 版本。 思源笔记 `2.10.8` 之后的版本可升级 PicGO 插件到 `1.5.0+` 。

## 支持图床

- Github<sup>强烈推荐</sup>
- Gitlab<sup>强烈推荐</sup>
- 阿里云
- 腾讯云
- 又拍云
- 七牛云<sup>强烈推荐</sup>
- SM.MS
- imgur
- Amazon S3<sup>强烈推荐</sup> ，感谢 @hzj629206 的贡献

## 配置

1.6.0+ 采用新的存储逻辑，配置文件位置已改变。

```
1.5.6 之前的配置位置

[工作空间]/data/storage/syp/picgo/picgo.cfg.json
   [工作空间]/data/storage/syp/picgo/mac.applescript
   [工作空间]/data/storage/syp/picgo/i18n-cli
   [工作空间]/data/storage/syp/picgo/picgo-clipboard-images
   [工作空间]/data/storage/syp/picgo/external-picgo-cfg.json
   [工作空间]/data/storage/syp/picgo/picgo.log
   [工作空间]/data/storage/syp/picgo/picgo.log
   [工作空间]/data/storage/syp/picgo/package.json
   [工作空间]/data/storage/syp/picgo/package-lock.json
   [工作空间]/data/storage/syp/picgo/node_modules


1.6.0+ 默认存储位置

~/.universal-picgo/picgo.cfg.json
~/.universal-picgo/mac.applescript
~/.universal-picgo/i18n-cli
~/.universal-picgo/picgo-clipboard-images
~/.universal-picgo/external-picgo-cfg.json
~/.universal-picgo/picgo.log
~/.universal-picgo/package.json
~/.universal-picgo/package-lock.json
~/.universal-picgo/node_modules
   ~/.universal-picgo/node_modules/plugin-1
   ~/.universal-picgo/node_modules/plugin-2
```

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