import { PicGo } from "zhi-picgo-core";
declare class SyPicgo {
    private picgo;
    ipcMethods: {
        handleEvent: (channel: string, args?: object) => void;
        registerEvent: (channel: string, eventCallback: any) => void;
        removeEvent: (channel: string) => void;
    };
    constructor(configPath: string);
    /**
     * 初始化
     */
    activate(): void;
    /**
     * 上传图片
     * @param input 图片数组
     */
    upload(input?: any[]): Promise<string>;
    /**
     * 从剪贴板上传图片
     */
    uploadFormClipboard(): Promise<Error | import("zhi-picgo-core").IImgInfo[]>;
    /**
     * 销毁PicGO对象
     */
    deactivate(): void;
    /**
     * 获取PicGO对象
     */
    getPicgoObj(): PicGo;
    /**
     * 合并目录
     *
     * @param appFolder 目录
     * @param filename 文件
     */
    combinePath(appFolder: string, filename: string): string;
    /**
     * 删除文件夹
     *
     * @param folder 文件夹
     */
    rmFolder(folder: string): void;
    /**
     * 删除文件
     *
     * @param filename 文件夹
     */
    rmFile(filename: string): void;
    /**
     * 还原文件
     *
     * @param data json数据
     * @param dstfile 目的地文件
     */
    restoreCfg(data: string, dstfile: string): void;
    /**
     * 读取Json文件
     *
     * @param filename 文件名
     */
    readFileAsJson(filename: string): string;
}
declare const picgoExtension: {
    getCrossPlatformAppDataFolder: () => string | undefined;
    ensurePath: (folder: string) => void;
    upgradeCfg: (oldCfg: string, newCfgFolder: string, newCfgName: string) => void;
    joinPath: (appFolder: string, filename: string) => string;
    initPicgo: (configPath: string) => SyPicgo;
};
export default picgoExtension;
//# sourceMappingURL=index.d.ts.map