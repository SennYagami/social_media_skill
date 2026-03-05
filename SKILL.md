---
name: social-media-skill
description: 基于 Obsidian 的多平台内容生成与发布技能（小红书、X）。
---

# social_media_skill

本技能用于以 Obsidian Vault 为内容源，按各平台规则完成内容创作、素材组织、草稿审阅与发布。

## 使用场景

- 用户在 Obsidian 中写好 `note.md`，需要生成平台内容并发布。
- 用户需要按不同平台规范生成文字与素材，并进行草稿审阅。

## 结构约定

```text
<item>/
  note.md
  assets/
    image/
    video/
  xiaohongshu/
    ... (平台私有文件)
  X/
    ... (平台私有文件)
```

资产管理约定：
- `<item>/assets/` 是跨平台可复用的公用资产目录。
- 每个平台目录（如 `xiaohongshu/`、`X/`）必须管理自己的平台私有产物与私有资产，不与其他平台混用。
- 公用资产与平台私有资产都建议采用 `image/`、`video/` 的子目录结构，并允许继续细分。

## 执行方式（平台直连）

不使用统一 CLI；AI 应按平台规则文档执行对应流程与操作。

## 平台规则

每个平台规则在 `reference/platform/<platform>/index.md` 中定义。  
AI 在执行具体平台任务前，必须先读取对应平台的 `index.md`，并严格遵循其中的：
- 内容创作流程
- 草稿与资产组织规范
- 发布前校验与发布步骤
