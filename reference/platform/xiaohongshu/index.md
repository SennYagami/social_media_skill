# 小红书平台规则（Post -> Draft -> 指定 Draft 发布）

本文件是小红书平台执行规范。AI 执行时必须按本文件流程运行，且所有产物必须落在 `item_path`（用户 `note.md` 所在目录）内。

---

## 1. 作用域与路径

- `item_path`：单条内容目录，必须包含 `note.md`。
- 示例：`/workspace/mock_obsidian/0001_item2`
- 禁止把该条内容的文件写到其他 item 目录。

---

## 2. 目录规范（强制）

```text
<item_path>/
  note.md
  xiaohongshu/
    post.md
    draft/
      0001/
        render.md
        final.md
        publish.json
        assets/
          image/
          video/
      0002/
      ...
```

规则：
- `post.md`：文案阶段文件（先产出，供用户修改确认）。
- `draft/NNNN/`：一次完整草稿产物（可并存多个）。
- `NNNN`：4 位递增数字（`0001`、`0002` ...）。
- 每个 draft 必须自洽，不能依赖其他 draft 的私有素材。

---

## 3. 执行流程（必须按阶段）

### 阶段 A：生成文案稿（只生成文字）

输入：`note.md`

输出：`xiaohongshu/post.md`

建议格式：

```md
# 标题
你的标题（<=20字）

# 正文
正文内容...

# Tags
#标签A #标签B #标签C
```

要求：
- 只做文案，不生成最终发布素材。
- 标题、正文、标签结构必须清晰。

### 阶段 B：用户审阅 post.md

- 用户可修改 `post.md`。
- 未确认前，不进入 Draft 生成。

### 阶段 C：生成 Draft（完整审阅稿 + 素材）

触发条件：用户已确认 `post.md`。

创建新目录：`xiaohongshu/draft/NNNN/`，并生成以下文件：
- `render.md`：用于渲染卡片。
- `assets/image/*`：渲染后图片。
- `final.md`：完整审阅稿。
- `publish.json`：发布参数。

`final.md` 强制要求（MUST）：
- 必须包含该 draft 的全部发布资料：标题、正文、标签、图片、视频（如有）。
- 图片必须用 Markdown 引用该 draft 内路径。
- 必须是“可审阅、可复核、可追溯”的单一入口文件。

`render.md` 强制要求（MUST）：
- 包含 YAML 头：`emoji`、`title`、`subtitle`。
- 正文按分页策略组织（见第 4 节）。

### 阶段 D：发布指定 Draft

- 发布时必须显式指定 draft（例如 `0001`）。
- 发布输入只允许来自目标 `draft/NNNN/`：
  - `publish.json`
  - `assets/image/*`（以及视频，如有）
- 禁止混用其他 draft 的资产。

---

## 4. 分页策略（渲染稳定性）

优先级：手动分段优先，自动切分兜底。

1. 手动分段（推荐）
- 在 `render.md` 用 `---` 按逻辑章节分卡。
- 每段建议 150-250 字，尽量语义完整。

2. 自动切分（兜底）
- 当段落不可控时，允许渲染脚本按高度自动切分。
- 需接受可能出现的语义截断风险。

建议：
- 关键结论、步骤、对比内容优先手动分卡。
- 长列表或超长段落避免放在同一卡片。

---

## 5. 文件内容模板（最小约束）

### 5.1 render.md 示例

```md
---
emoji: "💡"
title: "主标题"
subtitle: "副标题"
---

第一页内容...

---

第二页内容...
```

### 5.2 final.md 示例

```md
# 标题
...

# 正文
...

# 图片
![cover](./assets/image/cover.png)
![card_1](./assets/image/card_1.png)

# 视频
- ./assets/video/demo.mp4

# Tags
#标签A #标签B #标签C
```

### 5.3 publish.json 示例

```json
{
  "title": "标题",
  "desc": "正文",
  "images": [
    "./assets/image/cover.png",
    "./assets/image/card_1.png"
  ],
  "videos": []
}
```

---

## 6. 脚本调用（执行层）

1. 渲染图片（示例）

```bash
node reference/platform/xiaohongshu/scripts/render_xhs_v2.js <item_path>/xiaohongshu/draft/0001/render.md -o <item_path>/xiaohongshu/draft/0001/assets/image --style xiaohongshu
```

2. 发布（示例）

```bash
python3 reference/platform/xiaohongshu/scripts/publish_xhs.py --title "标题" --desc "正文" --images <item_path>/xiaohongshu/draft/0001/assets/image/cover.png <item_path>/xiaohongshu/draft/0001/assets/image/card_1.png
```

说明：
- 实际执行前先核对 `final.md` 与 `publish.json`。
- `XHS_COOKIE` 必须有效。

---

## 7. 发布前检查清单

1. `post.md` 已经用户确认。
2. 已创建本次目标 `draft/NNNN/`。
3. `final.md` 已包含全部资料（文字、图片、视频如有）。
4. `publish.json` 中引用路径均指向当前 draft。
5. 所需环境变量已配置且未过期。

---

## 8. 失败处理

- 发布失败优先检查 Cookie 过期。
- 图片缺失优先检查 `assets/image/` 产物是否存在。
- 草稿不满意时新建下一 draft，不覆盖历史 draft。

---

