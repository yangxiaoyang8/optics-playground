# 光学游乐场：相机参数模拟小游戏

这是一个纯静态网页。调整焦距、光圈和对焦对象，可以观察视角、透视和景深的变化。

## 发布到 GitHub Pages

1. 在 GitHub 创建公开仓库，例如 `optics-playground`。
2. 把 `index.html`、`styles.css`、`game.js` 上传到仓库根目录（和本文件同级）。
3. 打开仓库的 **Settings → Pages**，在 **Build and deployment** 下选择 **Deploy from a branch**，分支选 `main`，目录选 `/(root)`，然后保存。
4. 等待 Pages 完成部署，GitHub 会在同一页面显示网址，格式通常是 `https://用户名.github.io/仓库名/`。

以后更新网页，只需修改并提交这三个文件；GitHub Pages 会再次发布。

## 本地使用

在这个文件夹打开终端，运行 `python3 -m http.server 8000`，然后访问 `http://localhost:8000`。结束时在终端按 Ctrl+C。

网页不需要后台服务或外部 JavaScript 库。
