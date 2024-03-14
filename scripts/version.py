import argparse

import scriptutils


def parse_json(filename, version_field, new_version):
    """
    解析json文件，并修改版本号未指定的值
    :param filename: 文件路径
    :param version_field: 版本号字段
    :param new_version: 版本号
    """

    # 读取 JSON 文件
    data = scriptutils.read_json_file(filename)

    pkg = scriptutils.read_json_file(cwd + "package.json")
    print(f'new_version=>{new_version}')
    print(f'pkgv=>{pkg["version"]}')
    if new_version is None:
        new_version = pkg["version"]

    # 修改 JSON 文件中的属性
    if data[version_field] == new_version:
        print("版本号已经是最新，无需修改")
        return
    data[version_field] = new_version

    # 将修改后的 JSON 写回到文件中
    scriptutils.write_json_file(filename, data)
    print(f"修改 {filename} 完毕，新版本为：" + new_version)


if __name__ == "__main__":
    # 获取当前工作空间
    cwd = scriptutils.get_workdir()

    # 参数解析
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", help="the file to be processed")
    parser.add_argument("-v", "--verbose", action="store_true", help="enable verbose output")
    args = parser.parse_args()

    if args.verbose:
        print("Verbose mode enabled")

    # plugin.json
    parse_json(cwd + "plugin.json", "version", args.version)
    parse_json(cwd + "packages/picgo-plugin-bootstrap/package.json", "version", args.version)
    parse_json(cwd + "packages/picgo-plugin-app/package.json", "version", args.version)