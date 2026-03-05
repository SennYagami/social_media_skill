# X 平台规则（Post -> Draft -> 指定 Draft 发布）

本文件是 X 平台（Twitter/X）规则入口。所有产物必须存放在 `item_path`（用户 `note.md` 所在目录）下。

---

## item_path 定义

`item_path` 指向单条内容目录（包含 `note.md`）。

示例：
- `/workspace/mock_obsidian/0001_item2`
- `./mock_obsidian/0001_item2`

---

## 标准目录结构

```text
<item_path>/
  note.md
  X/
    post.md                      # 文案稿（先生成，供用户修改）
    draft/
      0001/
        final.md                 # 完整审阅稿（文字+图片/视频）
        publish.json             # 该 draft 的发布参数
        assets/
          image/
            generated/
              *.png
          video/
            generated/
              *.mp4
```

说明：
- `draft/` 下每个草稿都是独立文件夹。
- 草稿名按创建顺序使用数字：`0001`, `0002`, `0003` ...
- 用户可以让 AI 创建新的 draft 并生成新素材。
- 强制要求（MUST）：每个 `draft/NNNN/final.md` 必须是完整审阅稿，必须包含该草稿发布所需的全部资料（文字、图片、视频、标签）。

---

## 工作流（必须按顺序）

### 1. 先生成文案稿（post）

AI 根据 `note.md` 先生成 `X/post.md`，只做文字内容。

建议格式：

```md
# Tweet
这里是最终推文正文（<=280字符）

# Tags
#标签A #标签B
```

### 2. 用户修改并确认 post.md

- 用户直接编辑 `post.md`
- 用户确认前，不创建真实发布草稿

### 3. 进入 Draft 生成模式

创建新的 `draft/NNNN/`，生成：
1. `draft/NNNN/assets/image/*` 或 `assets/video/*`（真实素材）
2. `draft/NNNN/final.md`（审阅稿）
3. `draft/NNNN/publish.json`（发布参数）

配图可用 Gemini 脚本（写入当前 draft 资产目录）：

```bash
node reference/utils/gemini_image.js --prompt "tweet visual concept ..." --style shinkai --output <item_path>/X/draft/0001/assets/image/generated/gemini_shinkai_001.png
```

`final.md` 示例：

```md
# Tweet
...

# Tags
#标签A #标签B

# Images
![img_1](./assets/image/generated/gemini_shinkai_001.png)

# Videos
- ./assets/video/generated/clip_001.mp4
```

要求：
- `final.md` 不是摘要，而是该 draft 的完整审阅清单与内容展示。
- 所有待发布媒体都必须在 `final.md` 中出现（图片插入、视频路径列出）。

### 4. 发布时必须指定 draft

发布必须显式指定草稿编号：

```bash
node reference/platform/X/scripts/publish_x_post.js <item_path> --draft 0001 --dry-run
node reference/platform/X/scripts/publish_x_post.js <item_path> --draft 0001
```

发布输入来自：
- `X/draft/0001/publish.json`
- `X/draft/0001/assets/*`

---

## 推文规则

- 单条推文 <= 280 字
- 建议 1-2 个 hashtag
- 句子短、观点明确、信息密度高
- 发送内容是纯推文文本（不带 Markdown 标题语法）

---

## Gemini 配图

风格提示词文件在：`reference/utils/style-prompts/*.txt`

查看可用风格：

```bash
node reference/utils/gemini_image.js --list-styles
```

查看支持模型：

```bash
node reference/utils/gemini_image.js --list-models
```

当前图片模型仅支持：`gemini-2.5-flash-image`

---

## 发布前检查清单

1. `X/post.md` 已用户确认
2. 已创建目标 `X/draft/NNNN/`
3. `final.md` 与 `publish.json` 一致，且 `final.md` 已覆盖该 draft 全部资料（文字/图片/视频/标签）
4. `publish.json` 的图片/视频路径指向当前 draft 资产
5. 图片数量 <= 4（X 单条推文限制）
6. `.env` 中 X 凭证完整：
   - `X_API_KEY`
   - `X_API_SECRET`
   - `X_ACCESS_TOKEN`
   - `X_ACCESS_TOKEN_SECRET`

---

## 常见失败排查

- `--draft is required`：发布命令缺少草稿编号
- `publish.json not found`：目标 draft 下缺少发布参数文件
- `Image not found`：路径未指向该 draft 的 `assets/` 目录
- `X supports at most 4 images`：减少单条推文图片数量
- 401/403：检查 token 有效性与 App 权限（Read and Write）
