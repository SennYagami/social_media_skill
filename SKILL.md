---
name: social-media-skill
description: 基于 Obsidian 的多平台内容生成与发布技能。当前支持小红书与 X（AI撰写推文、Gemini 配图、发布）。
---

# social_media_skill

本技能用于以 Obsidian Vault 为内容源，按平台规则生成素材并执行发布。

## 使用场景

- 用户在 Obsidian 中写好 `note.md`，需要生成并发布小红书内容。
- 用户需要为 X 生成平台风格推文（由 AI 直接撰写）、生成配图并发布。

## 结构约定

```text
<item>/
  note.md
  assets/
    image/
    video/
  xiaohongshu/
    post.md
    render.md
    images/
    publish.json
  X/
    post.md
    publish.json
    assets/
      image/
      video/
```

资产管理约定：
- 每个平台都使用 `assets/` 管理媒体素材。
- `assets/` 下固定包含 `image/` 与 `video/`。
- 可在 `image/` 或 `video/` 下继续细分目录（如 `generated/`, `cover/`, `campaign_2026/`）。

## 执行方式（平台直连）

不使用统一 CLI；AI 按平台规则文档直接执行对应平台脚本。

## 平台规则

每个平台规则在 `reference/platform/<platform>/index.md` 中定义：
- 内容生成规则
- 渲染/素材规则
- 发布约束

## 小红书能力

- 基于 `note.md` 生成 `post.md`（标题 + 正文 + tags）
- 生成 `render.md`（YAML 头 + Markdown）
- 调用 `reference/platform/xiaohongshu/scripts/render_xhs_v2.js` 渲染图片
- 调用 `reference/platform/xiaohongshu/scripts/publish_xhs.py` 发布

## X 能力

- AI 直接根据 `note.md` 生成 X 推文文案与记录文件（`X/post.md` / `X/publish.json`）
- 调用通用图片脚本 `reference/utils/gemini_image.js` 生成配图并存入 `X/assets/image/...`
- 调用 `reference/platform/X/scripts/publish_x_post.js` 执行单条推文发布（文字+图片）

## X 工作流

1. 读取 `note.md`，生成 X 风格推文（含 hashtag 规则）。
2. 如需配图，调用 `reference/utils/gemini_image.js` 生成指定风格图片，保存到 `X/assets/image/...`。
3. 根据你的发布指令执行发布脚本，读取 `X/publish.json` 与资产路径发布到 X。

## Gemini 图片脚本调用约定

- 图片脚本：`reference/utils/gemini_image.js`
- 当前仅支持图片模型：`gemini-2.5-flash-image`
- 查询支持模型：
  - `node reference/utils/gemini_image.js --list-models`
- 查询风格：
  - `node reference/utils/gemini_image.js --list-styles`
- 生成图片示例：
  - `node reference/utils/gemini_image.js --prompt "tweet visual concept" --style shinkai --output <item>/X/assets/image/generated/gemini_shinkai_001.png`
