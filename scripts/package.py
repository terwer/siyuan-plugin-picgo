import os
import subprocess

import scriptutils

if __name__ == "__main__":
    # 切换工作空间
    scriptutils.switch_workdir()

    # 获取当前工作空间
    cwd = scriptutils.get_workdir()

    dist_folder = "./artifacts/siyuan-plugin-picgo/dist"
    scriptutils.rm_folder(dist_folder)

    subprocess.run(["pnpm", "build", "-F", "picgo-plugin-app", "--force"], check=True)
    subprocess.run(["pnpm", "build", "-F", "picgo-plugin-bootstrap", "--force"], check=True)

    required_artifacts = [
        "index.html",
        "index.js",
        "plugin.json",
    ]
    for artifact in required_artifacts:
        artifact_path = os.path.join(dist_folder, artifact)
        if not os.path.exists(artifact_path):
            raise FileNotFoundError(f"打包产物缺失: {artifact_path}")

    data = scriptutils.read_json_file(cwd + "package.json")
    v = data["version"]

    src_folder = dist_folder
    tmp_folder_name = "./siyuan-plugin-picgo"
    build_zip_path = "./build"
    build_zip_name = "siyuan-plugin-picgo-" + v + ".zip"

    # 压缩dist为zip。这里不能吞异常：zip/copy 任何一步失败都必须让 pnpm package 失败，避免继续发旧包。
    scriptutils.zip_folder(src_folder, tmp_folder_name, build_zip_path, build_zip_name)
    scriptutils.cp_file(os.path.join(build_zip_path, build_zip_name), os.path.join(build_zip_path, "package.zip"))
    print("插件打包完毕.")
