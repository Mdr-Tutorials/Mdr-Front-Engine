---
layout: home

hero:
  name: 'MdrFrontEngine'
  text: '可视化前端开发平台'
  tagline: 融合蓝图设计、节点图逻辑与代码生成，从原型到部署的一站式解决方案
  image:
    src: /logo.svg
    alt: MdrFrontEngine
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看简介
      link: /guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/Mdr-Tutorials/Mdr-Front-Engine

features:
  - icon: 🎨
    title: 可视化蓝图编辑
    details: 拖拽式组件设计，所见即所得。支持组件树管理、属性检查器、实时预览，让 UI 设计变得直观高效。
  - icon: 🔗
    title: 节点图编程
    details: 图形化逻辑编排系统，通过连接节点来构建业务逻辑。支持断点调试、状态监控，降低编程门槛。
  - icon: 📦
    title: MIR 中间表示
    details: 统一的组件中间表示格式，支持导出为 React、Vue、Angular 等多种框架代码，一次设计多端运行。
  - icon: 🧩
    title: 组件化架构
    details: 内置丰富的 UI 组件库，支持自定义组件扩展。符合 Web Components 标准，可无缝集成第三方库。
  - icon: 🚀
    title: 一键部署
    details: 集成 GitHub Pages、Vercel、Netlify 等主流平台，支持 Web3 去中心化部署，一键发布你的应用。
  - icon: 🌐
    title: 完全开源
    details: MIT 许可证，无付费墙、无隐藏功能。活跃的社区生态，支持模板共享和组件复用。
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #bd34fe 30%, #41d1ff);

  --vp-home-hero-image-background-image: linear-gradient(-45deg, #bd34fe 50%, #47caff 50%);
  --vp-home-hero-image-filter: blur(44px);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px);
  }
}
</style>

## 为什么选择 MdrFrontEngine？

MdrFrontEngine 旨在**降低前端开发门槛，同时不牺牲灵活性与工程能力**。无论是快速搭建静态站点，还是构建具备复杂交互逻辑的动态应用，均可在统一环境中高效完成。

### 适用场景

| 场景           | 描述                                             |
| -------------- | ------------------------------------------------ |
| **快速原型**   | 几分钟内将想法转化为可交互的原型                 |
| **MVP 开发**   | 快速构建最小可行产品，验证商业假设               |
| **前端学习**   | 通过可视化方式理解前端概念和组件交互             |
| **设计师协作** | 设计师可以直接参与 UI 构建，减少设计到开发的损耗 |
| **Web3 应用**  | 原生支持钱包连接、链上数据绑定、去中心化部署     |

### 技术栈

MdrFrontEngine 基于现代 Web 技术构建：

- **前端**: React 19 + TypeScript + Vite + Tailwind CSS
- **后端**: Go + Gin
- **构建**: pnpm + Turborepo (Monorepo)
- **测试**: Vitest + Playwright
- **文档**: VitePress + Storybook

---

<div style="text-align: center; margin-top: 2rem;">
  <p style="color: var(--vp-c-text-2);">
    准备好开始了吗？
  </p>
  <a href="./guide/getting-started" style="display: inline-block; padding: 0.75rem 1.5rem; background: var(--vp-c-brand-1); color: white; border-radius: 8px; text-decoration: none; font-weight: 500;">
    开始使用
  </a>
</div>
