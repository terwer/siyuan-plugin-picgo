import os

import scriptutils

if __name__ == "__main__":
    # 切换工作空间
    scriptutils.switch_workdir()

    # 获取当前工作空间
    cwd = scriptutils.get_workdir()

    # os.system("find . -name "node_modules" -type d -exec rm -rf {} +")
    # os.system("find . -name "dist" -type d -exec rm -rf {} +")
    # os.system("find . -name ".turbo" -type d -exec rm -rf {} +")
    # os.system("rm -rf ./artifacts")
    # os.system("rm -rf ./build")
    os.system("pnpm build -F picgo-plugin-app")
    os.system("pnpm build -F picgo-plugin-bootstrap")

    dist_folder = "./artifacts/siyuan-plugin-picgo/dist"
    data = scriptutils.read_json_file(cwd + "package.json")
    v = data["version"]

    src_folder = dist_folder
    tmp_folder_name = "./siyuan-plugin-picgo"
    build_zip_path = "./build"
    build_zip_name = "siyuan-plugin-picgo-" + v + ".zip"

    try:
        # 压缩dist为zip
        scriptutils.zip_folder(src_folder, tmp_folder_name, build_zip_path, build_zip_name)
        scriptutils.cp_file(os.path.join(build_zip_path, build_zip_name), os.path.join(build_zip_path, "package.zip"))
    except Exception as e:
        print(f"打包错误,{str(e)}")
    print("插件打包完毕.")
