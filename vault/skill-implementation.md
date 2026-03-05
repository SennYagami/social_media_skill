# social_media_skill 实现方案（Obsidian + 平台直连）

本文档描述 `social_media_skill` 的当前实现方式：
以 Obsidian Vault 为内容源，AI 按平台规则直接执行该平台脚本，不再通过统一 CLI/adapter/registry 分发。

---

## 1. 目标与范围

**核心目标**
- 以 `note.md` 作为内容源（SSOT）。
- 按平台规则生成平台内容与素材（文字 + 图片）。
- 在需要时调用平台发布脚本。
- 平台间解耦，避免共享业务规则导致污染。

**当前已实现平台**
- 小红书（内容生成 + 卡片渲染 + 发布脚本）

---

## 2. Vault 结构规范

以单个 item 为最小单元：

```text
<item>/
  note.md
  xiaohongshu/
    post.md
    render.md
    images/
      cover.png
      card_1.png
      ...
    publish.json
```

**原则**
- `note.md` 是唯一源。
- 平台目录仅存放该平台产物。
- 发布时以 `publish.json` 或当前产物作为输入快照。

---

## 3. 目录设计（当前）

```text
social_media_skill/
  SKILL.md
  README.md
  requirements.txt
  package.json
  env.example.txt
  reference/
    platform/
      xiaohongshu/
        index.md
        scripts/
          render_xhs_v2.js
          publish_xhs.py
        assets/
          styles.css
          themes/*
      X/
        index.md
```

说明：
- 已移除 `reference/utils`（包含旧的统一 CLI、adapter、registry）。
- 每个平台以 `reference/platform/<platform>/index.md` 作为规则入口。

---

## 4. 工作流（平台直连）

1. 读取 `<item>/note.md`。
2. 按平台规则生成 `<item>/xiaohongshu/post.md`。
3. 生成 `<item>/xiaohongshu/render.md`（含 YAML 头）。
4. 执行渲染脚本生成卡片。
5. 组装发布参数并调用发布脚本（可选）。

示例命令：

```bash
node reference/platform/xiaohongshu/scripts/render_xhs_v2.js <item>/xiaohongshu/render.md -o <item>/xiaohongshu/images --style purple
python3 reference/platform/xiaohongshu/scripts/publish_xhs.py --title "标题" --desc "正文" --images <item>/xiaohongshu/images/cover.png <item>/xiaohongshu/images/card_1.png
```

---

## 5. 小红书规则与产物约束

权威规则文件：`reference/platform/xiaohongshu/index.md`

关键约束：
- 标题不超过 20 字。
- 正文短段落，适度 Emoji。
- 结尾 5-10 个标签。
- 渲染输入必须是独立 `render.md`，不能直接拿正文渲染。

---

## 6. 依赖与环境

Node 侧：
- `playwright`（卡片渲染）

Python 侧：
- `xhs`、`python-dotenv`、`requests` 等（发布）

初始化建议：

```bash
pip install -r requirements.txt
npm install
npx playwright install chromium
```

---

## 7. 扩展新平台规范

新增平台只需要：
1. 新建 `reference/platform/<new_platform>/index.md`（平台规则）。
2. 在 `reference/platform/<new_platform>/scripts/` 放置该平台脚本。
3. 定义该平台的 item 产物结构（如 `post.md`、`media/`、`publish.json`）。
4. 由 AI 按该平台规则执行，不需要接入统一注册机制。

---

## 8. 错误处理约定

- `note.md` 缺失：直接报错并给出绝对路径。
- 渲染失败：优先检查 Playwright 浏览器与系统依赖。
- 发布失败：优先检查 Cookie、图片路径、发布时间格式。

---

## 9. 现状结论

当前架构是“平台规则 + 平台脚本”直连模式：
- 优点：简单、低耦合、可快速迭代。
- 代价：跨平台通用能力需由 AI 侧流程保证一致性。
