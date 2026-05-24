# Prompt 管理器

一款 Chrome 浏览器扩展，用于高效管理和组织你的 AI Prompts。

## 功能

### 新建 Prompt
- 24 种 Emoji 图标可选
- 标题、描述、Prompt 内容编辑
- 9 种分类：提示词工程、写作、翻译、编程、营销、教育、商务、创意、其他
- 自定义标签，支持逗号分隔批量添加

### 我的 Prompts
- 搜索：支持按标题、描述、内容、标签搜索
- 分类筛选：全部 / 翻译 / 写作 / 编程
- 点击卡片一键复制 Prompt 内容到剪贴板
- 编辑 / 删除已有 Prompt

### 导入导出 & 更多
- **导入/导出 JSON**：备份和恢复你的 Prompts
- **从 AIPM 导入**：兼容 AIPM 格式数据
- **导出 CSV**：以表格形式导出
- **Prompt 评估**：对 Prompt 进行质量评分（清晰度、具体性、结构化）
- **API 配置**：支持 OpenAI / Anthropic / Google 服务商配置
- **管理标签**：查看所有已使用的标签
- **深色/浅色模式**：一键切换主题

## 安装

1. 下载或克隆本项目到本地
2. 打开 Chrome 浏览器，地址栏输入 `chrome://extensions/`
3. 右上角开启 **开发者模式**
4. 点击 **加载已解压的扩展程序**
5. 选择项目文件夹 `prompt_manage`

## 文件结构

```
prompt_manage/
├── manifest.json      # 扩展清单 (Manifest V3)
├── popup.html         # 弹窗界面
├── popup.css          # 样式（支持深色/浅色主题）
├── popup.js           # 界面逻辑
├── storage.js         # 数据存储 & 默认数据
├── background.js      # 后台服务
└── icons/
    ├── icon16.png     # 16x16 图标
    ├── icon48.png     # 48x48 图标
    └── icon128.png    # 128x128 图标
```

## 预置 Prompts

首次使用自动填充 8 条示例 Prompt：

| 图标 | 名称 | 分类 |
|------|------|------|
|   | 翻译成中文 | 翻译 |
|   | 翻译并保持格式 | 翻译 |
|   | 简洁总结 | 写作 |
|   | YouTube 视频脚本 | 写作 |
|   | 爆款推文生成器 | 营销 |
|   | 代码审查助手 | 编程 |
|   | AI 绘图提示词优化 | 创意 |
|   | 邮件润色 | 商务 |

## 技术栈

- Chrome Extension Manifest V3
- chrome.storage.local 本地存储
- 原生 HTML / CSS / JavaScript，无依赖

## License

MIT
