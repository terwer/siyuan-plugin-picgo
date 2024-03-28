/**
 * 封装一个用于执行 NPM 命令的工具类
 */
declare class NpmPackageManager {
    private logger;
    private zhiCoreNpmPath;
    private depsJsonPath;
    private customCmd;
    /**
     * 构造函数，用于创建 NpmPackageManager 的实例
     *
     * @param zhiCoreNpmPath - Siyuan App 的 NPM 路径
     * @param depsJsonPath - deps.json 路径
     */
    constructor(zhiCoreNpmPath: string, depsJsonPath: string);
    /**
     * 执行 Node 命令
     *
     * @param subCommand - 要执行的 NPM 命令
     * @param oargs - 其它参数
     * @param cwd 当前路径
     * @param env 环境变量
     * @returns 执行结果的 Promise
     */
    nodeCmd(subCommand: string, oargs?: any[], cwd?: string, env?: Record<string, any>): Promise<any>;
    /**
     * 执行 NPM 命令
     *
     * @param subCommand - 要执行的 NPM 命令
     * @param path 命令路径
     * @param oargs - 其它参数
     * @param cwd 当前路径
     * @param env 环境变量
     * @returns 执行结果的 Promise
     */
    npmCmd(subCommand: string, path?: string, oargs?: any[], cwd?: string, env?: Record<string, any>): Promise<any>;
    /**
     * 获取 Node 的版本号
     *
     * @returns Node 版本号的 Promise
     */
    nodeVersion(): Promise<string>;
    /**
     * 获取 NPM 的版本号
     *
     * @returns NPM 版本号的 Promise
     */
    npmVersion(): Promise<string>;
    /**
     * 获取 Electron的 NPM 的版本号
     *
     * @returns NPM 版本号的 Promise
     */
    electronNpmVersion(): Promise<string>;
    /**
     * 获取系统 NPM 的版本号
     *
     * @returns NPM 版本号的 Promise
     */
    systemNpmVersion(): Promise<unknown>;
    /**
     * 安装 NPM 依赖
     *
     * @param moduleName - 可选的模块名，不传默认安装全量
     * @param path 命令路径
     */
    npmInstall(moduleName?: string, path?: string): Promise<void>;
    /**
     * 安装依赖并马上导入
     *
     * @param moduleName - 依赖名称
     * @param path 命令路径
     * @returns 导入的模块
     */
    requireInstall(moduleName: string, path?: string): Promise<any>;
    /**
     * 检测并初始化 Node
     *
     * @param nodeVersion node版本，例如：v18.18.2
     * @param nodeInstallDir 安装路径
     */
    checkAndInitNode(nodeVersion?: string, nodeInstallDir?: string): Promise<boolean>;
    /**
     * 本地服务的 Node 命令
     *
     * @param command 主命令
     * @param subCommand 子命令
     * @param oargs 其它参数
     * @param cwd 当前路径
     * @param env 环境变量
     * @private
     */
    localNodeCmd(command: string, subCommand: string, oargs?: any[], cwd?: string, env?: Record<string, any>): Promise<any>;
    /**
     * 本地服务的 Node exec 命令
     *
     * @param command 主命令
     * @param subCommand 子命令
     * @param path 命令路径
     * @param oargs 其它参数
     * @param cwd 当前路径
     * @param env 环境变量
     * @private
     */
    localNodeExecCmd(command: string, subCommand: string, path?: string, oargs?: any[], cwd?: string, env?: Record<string, any>): Promise<any>;
}
export { NpmPackageManager };
//# sourceMappingURL=npmHelper.d.ts.map