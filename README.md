# Markdown 浏览器 - 安装指南

## 环境要求

- Node.js >= 18
- Google Chrome >= 114

## 安装

```bash
npm install
```

## 构建

```bash
npm run build
```

## 加载到 Chrome

1. 打开 `chrome://extensions`
2. 开启右上角 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择本项目根目录（含 `manifest.json` 的文件夹）

## 更新

修改代码后重新构建并刷新扩展：

```bash
npm run build
```

然后在 `chrome://extensions` 页面点击扩展的刷新按钮。
