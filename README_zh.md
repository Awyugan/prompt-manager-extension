# Prompt Manager - 智能提示词管理工具

Prompt Manager 是一款功能强大的 Chrome 浏览器扩展，专为 AI 提示词（Prompts）管理而设计。它帮助用户高效地创建、组织和使用提示词，提升与 AI 交互的效率和效果。

## 🌟 主要功能

- **智能提示词管理**：轻松创建、编辑、删除和分类提示词
- **AI 自动标签**：集成 DeepSeek API，自动为提示词生成标题和标签
- **多语言支持**：完整支持中文和英文界面
- **快速搜索**：通过关键词快速查找提示词
- **回收站功能**：防止误删重要提示词
- **数据备份**：支持导入/导出提示词数据

## 🚀 安装方法

### 从 Chrome 网上应用店安装

Prompt Manager 插件即将上架 Chrome 网上应用店。届时，您可以通过以下步骤安装：

1.  访问 [Chrome 网上应用店](https://chrome.google.com/webstore/)
2.  搜索 "Prompt Manager"
3.  点击 "添加至 Chrome"

### 通过 CRX 文件安装

如果您希望通过 CRX 文件安装，可以从 [GitHub Releases 页面](https://github.com/awyugan/prompt-manager-extension/releases) 下载最新版本的 `.crx` 文件，然后按照以下步骤操作：

1.  打开 Chrome 浏览器，访问 `chrome://extensions/`
2.  开启右上角的 "开发者模式"
3.  将下载的 `.crx` 文件拖拽到 `chrome://extensions/` 页面
4.  在弹出的确认框中点击 "添加扩展程序"

### 开发者模式安装

1. 下载扩展代码
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择包含 `manifest.json` 的文件夹

## 🛠️ 使用指南

### 添加新提示词

1. 点击浏览器工具栏中的扩展图标
2. 点击"新建提示词"按钮
3. 输入提示词标题、内容和标签
4. 点击"保存"

### 使用提示词

1. 在任何文本输入框中点击右键
2. 选择"插入提示词"
3. 从列表中选择要插入的提示词

### 自动标签功能

1. 在设置中启用"自动生成标签"
2. 添加 DeepSeek API 密钥
3. 创建或编辑提示词时，系统会自动生成标题和标签

## ⚙️ 设置

在扩展选项中，您可以：

- 启用/禁用自动标签功能
- 配置 DeepSeek API 密钥
- 切换界面语言
- 导入/导出提示词数据

## 📦 技术细节

- 使用 Chrome Extension Manifest V3 开发
- 数据存储在浏览器的本地存储中
- 支持 Chrome 最新版本

## 📧 联系我们

如有任何问题或建议，请通过 GitHub Issues 联系我们
