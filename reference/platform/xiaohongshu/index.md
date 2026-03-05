# 小红书平台规则（Post -> Draft -> 指定 Draft 发布）

本文件是小红书平台规则入口。所有产物必须存放在 `item_path`（用户 `note.md` 所在目录）下。

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
  xiaohongshu/
    post.md                      # 文案稿（先生成，供用户修改）
    draft/
      0001/
        final.md                 # 完整审阅稿（文字+图片+标签）
        publish.json             # 该 draft 的发布参数
        assets/
          image/
            cover.png
            card_1.png
            card_2.png
            ...
          video/
```

说明：
- `draft/` 下每个草稿都是独立文件夹。
- 草稿名按创建顺序使用数字：`0001`, `0002`, `0003` ...
- 用户可以反复创建新 draft（新素材、新排版）。
- 强制要求（MUST）：每个 `draft/NNNN/final.md` 必须是完整审阅稿，必须包含该草稿发布所需的全部资料（文字、图片、视频〔如有〕、标签）。

---

## 工作流（必须按顺序）

### 1. 先生成文案稿（post）

先生成 `xiaohongshu/post.md`，只做文字内容，不做最终素材。

建议格式：

```md
# 标题
你的标题（<=20字）

# 正文
正文内容...

# Tags
#标签A #标签B #标签C
```

### 2. 用户修改并确认 post.md

- 用户直接编辑 `post.md`
- 只有用户确认后，才能进入 Draft 生成

### 3. 进入 Draft 生成模式

创建新的 `draft/NNNN/`，生成：
1. `draft/NNNN/assets/image/*`（真实图片素材）
2. `draft/NNNN/final.md`（结构化审阅稿）
3. `draft/NNNN/publish.json`（发布所需字段）

`final.md` 必须包含：
- 标题
- 正文
- 全部图片（Markdown 插图）
- 标签
- （如有）视频素材路径

示例：

```md
# 标题
...

# 正文
...

# 图片
![cover](./assets/image/cover.png)
![card_1](./assets/image/card_1.png)
![card_2](./assets/image/card_2.png)

# Tags
#标签A #标签B #标签C
```

### 4. 发布时必须指定 draft

发布目标不是 `xiaohongshu/` 根目录，而是具体 `draft/NNNN/`。

发布输入应来自：
- `draft/NNNN/publish.json`
- `draft/NNNN/assets/image/*`

---

## 文案规则

- 标题 <= 20 字
- 正文短段落，适度 Emoji
- 标签建议 5-10 个
- 风格贴近小红书：具体、可执行、有经验总结

---

## 发布前检查清单

1. `post.md` 已用户确认
2. 已创建目标 `draft/NNNN/`
3. `final.md` 与 `publish.json` 一致，且 `final.md` 已覆盖该 draft 全部资料（文字/图片/视频）
4. `publish.json` 图片路径指向当前 draft 的 `assets/image`
5. `.env` 中 `XHS_COOKIE` 有效

---

## 常见失败排查

- 草稿发布错乱：确认你指定的 draft 是否正确（`0001` vs `0002`）
- 图片缺失：检查 `draft/NNNN/assets/image/` 文件是否存在
- 发布失败：优先检查 `XHS_COOKIE` 是否过期
- 内容不满意：不要覆盖旧 draft，直接新建下一个 draft
