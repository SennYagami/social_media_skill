# social_media_skill

基于 Obsidian 的多平台内容生成与发布技能。当前支持：
- 小红书（内容生成 + 卡片渲染 + 发布）
- X（AI撰写推文 + Gemini 配图 + 发布）

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
npm install
npx playwright install chromium
```

### 2. 配置环境变量

```bash
cp env.example.txt .env
```

编辑 `.env`，至少填入：

```bash
# 小红书
XHS_COOKIE=...

# X
X_API_KEY=...
X_API_SECRET=...
X_ACCESS_TOKEN=...
X_ACCESS_TOKEN_SECRET=...

# Gemini
GEMINI_API_KEY=...
```

## 平台 1：小红书（平台直连）

示例目录：

```text
<item>/
  note.md
  xiaohongshu/
```

执行流程：

1. 根据 `note.md` 生成 `xiaohongshu/post.md`
2. 生成 `xiaohongshu/render.md`（带 YAML 头）
3. 渲染图片

```bash
node reference/platform/xiaohongshu/scripts/render_xhs_v2.js <item>/xiaohongshu/render.md -o <item>/xiaohongshu/images --style purple
```

4. 发布（可选）

```bash
python3 reference/platform/xiaohongshu/scripts/publish_xhs.py --title "标题" --desc "正文" --images <item>/xiaohongshu/images/cover.png <item>/xiaohongshu/images/card_1.png
```

## 平台 2：X（AI撰写推文 + 配图 + 发布）

示例目录：

```text
<item>/
  note.md
  X/
    assets/
      image/
      video/
```

1. 由 AI 根据 `<item>/note.md` 生成 `X/post.md` 与 `X/publish.json`（文字与标签）

2. 按需生成配图并保存到 `X/assets/image/...`

```bash
node reference/utils/gemini_image.js --prompt "tweet visual concept ..." --style shinkai --output <item>/X/assets/image/generated/gemini_shinkai_001.png
```

3. 预演发布

```bash
node reference/platform/X/scripts/publish_x_post.js <item> --dry-run
```

4. 正式发布

```bash
node reference/platform/X/scripts/publish_x_post.js <item>
```

### X 配图风格

- `shinkai`（新海诚）
- `miyazaki`（宫崎骏）
- `realistic`（写实）
- `lego`（乐高）
- `cyberpunk`（赛博朋克）
- `watercolor`（水彩）

## 平台规则

- `reference/platform/xiaohongshu/index.md`
- `reference/platform/X/index.md`

## 设计说明

- 平台直连：按 `reference/platform/<platform>/index.md` 执行
- 通用 Gemini 配图能力放在 `reference/utils/gemini_image.js`
- 资产管理统一为 `assets/image` 与 `assets/video`，并支持子目录细分
