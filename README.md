[中文](README_zh_CN.md)

# PicGo Plugin

![](./preview.png)

Your favorite PicGo image bed is still available in siyuan-notes, wuhu~

## Recent Changes

- **v3.0.3** — HarmonyOS platform support: plugin now installable on harmony devices
- **v3.0.1** — Fix settings page crash on browser and Docker environments
- **v3.0.0** — Unified workspace configuration across desktop, browser, and Docker

See [CHANGELOG.md](./CHANGELOG.md) for full history.

## Recommended Configuration

Recommended: use [rustfs](https://siyuan.wiki/x/20260525135317-fc5wirw) with the PicGo plugin for the best self-hosted image hosting setup.

## Version Compatibility

> Important Note:
>
> PicGo `3.0.0+` uses a unified configuration source. The bundled PicGo config, external PicGo/PicList config, and SiYuan connection config are read from workspace-backed configuration files when the SiYuan API is available. Runtime files, third-party plugin dependencies, cache, scripts, and logs still stay on the current device.
>
> The `2.0.0` path split is now listed under `Historical paths` for reference.
>
> Please refrain from updating this plugin for versions of siyuan-note prior to `3.0.3`; the highest permissible version remains `1.5.1`. For siyuan-note versions `3.0.3` and beyond, the PicGO plugin may be upgraded to `1.6.0+`.
>
> For versions of siyuan-note before `2.10.8`, it is advised not to upgrade this plugin beyond version `1.4.5`. Subsequent to siyuan-note `2.10.8`, the PicGO plugin can be updated to `1.5.0+`.

### v3.0.0 configuration paths

v3.0.0 is a configuration cleanup release. It keeps the v2 runtime split, and moves all user-facing PicGo configuration into explicit workspace configuration files.

Workspace-backed configuration:

```text
[workspace]/data/storage/syp/picgo/
  picgo.cfg.json                  # bundled PicGo config, uploaders, plugin values, paste behavior
  external-picgo-cfg.json         # external PicGo App / PicList API selection and endpoint

[workspace]/data/storage/syp/
  siyuan-cfg.json                 # SiYuan API connection settings
```

Device-local runtime files stay outside workspace sync:

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

Migration rule: v3 imports eligible legacy data by domain, writes the new configuration files, and leaves existing real user configuration in place. After migration finishes, PicGo records a marker and stays quiet on later starts.

About rare simultaneous edits: if multiple PicGo entry points in the same SiYuan workspace edit the same setting at almost the same time, the last save wins.

Note: this does not affect SiYuan's multiple-workspace model; separate workspaces remain naturally isolated. Most users will never hit this.

### Historical paths

```text
2.0.0 - 2.x
[workspace]/data/storage/syp/picgo/picgo.cfg.json
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
[workspace]/data/storage/syp/picgo/picgo.cfg.json
[workspace]/data/storage/syp/picgo/external-picgo-cfg.json
[workspace]/data/storage/syp/picgo/package.json
[workspace]/data/storage/syp/picgo/package-lock.json
[workspace]/data/storage/syp/picgo/node_modules/
[workspace]/data/storage/syp/picgo/libs/
[workspace]/data/storage/syp/picgo/i18n-cli/
[workspace]/data/storage/syp/picgo/picgo-clipboard-images/
[workspace]/data/storage/syp/picgo/*.script
[workspace]/data/storage/syp/picgo/picgo.log
```


## Image Hosting Support

- Github<sup>recommended</sup>
- Gitlab<sup>recommended</sup>
- Alibaba Cloud
- Tencent Cloud
- Upyun
- Qiniu Cloud<sup>recommended</sup>
- SM.MS
- imgur
- Amazon S3<sup>recommended</sup>, thanks to [@hzj629206](https://github.com/hzj629206)
- Lsky pro<sup> v1.11.0+</sup>

## Changelog

Please refer to [CHANGELOG](https://github.com/terwer/siyuan-plugin-picgo/blob/main/CHANGELOG.md)

## Donate

If you approve of this project, invite me to have a cup of coffee, which will encourage me to keep updating and create more useful tools~

### WeChat

<div>
<img src="https://static-rs-terwer.oss-cn-beijing.aliyuncs.com/donate/wechat.jpg" alt="wechat" style="width:280px;height:375px;" />
</div>

### Alipay

<div>
<img src="https://static-rs-terwer.oss-cn-beijing.aliyuncs.com/donate/alipay.jpg" alt="alipay" style="width:280px;height:375px;" />
</div>

## Related Items

- [sy-picgo-core](https://github.com/terwer/sy-picgo-core)
- [Electron-PicGo-Core](https://github.com/terwer/Electron-PicGo-Core)
- [picgo-plugin-watermark-elec](https://github.com/terwer/picgo-plugin-watermark-elec)

## Thanks

Thanks to the solutions provided by the open source community, which simplifies a lot of work for this project!

- [PicGo-Core](https://github.com/PicGo/PicGo-Core)
- [PicList](https://github.com/Kuingsmile/PicList)
