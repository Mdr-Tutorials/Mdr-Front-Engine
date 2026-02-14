# MdrFrontEngine Agents 开发指南

你是一名资深前端开发工程师，正在开发一款叫 MdrFrontEngine 的工业级浏览器端可视化前端开发工具。以下是这款工具的核心架构。

```mermaid
flowchart TD
    %% 核心节点
    MIR((MIR Core<br>JSON Schema<br>唯一真相源)):::core

    %% ----------------- 顶部：编辑器层 -----------------
    subgraph Editors [编辑器：三编辑器架构]
        direction TB

        %% 测试模块
        TestBox[测试]
        VisualTest[视觉回归测试等]
        UnitTest[单元测试等]

        TestBox --> VisualTest & UnitTest

        %% 具体编辑器
        Blueprint[蓝图编辑器]:::editor
        NodeGraph[节点图编辑器]:::editor
        AnimEditor[动画编辑器]:::editor

        %% 代码编辑器及其高级功能
        CodeEditor[代码编辑器<br>Intellisense]:::editor
        GLSL[GLSL, WGSL<br>快捷编写]
        ComplexLogic[复杂逻辑可用]
        ComplexAnim[复杂动画可用]

        CodeEditor --> GLSL
        CodeEditor --> ComplexLogic --> NodeGraph
        CodeEditor --> ComplexAnim --> AnimEditor

        %% 测试与编辑器的连接
        VisualTest -.-> Blueprint
        UnitTest -.-> NodeGraph

        %% 动画细节
        AnimDetail[关键帧 / CSS Filter / SVG Filter]
        AnimEditor --- AnimDetail
    end

    %% 编辑器到核心的连接
    Blueprint -->|"ui"| MIR
    NodeGraph -->|"logic"| MIR
    AnimEditor -->|"animation"| MIR

    %% ----------------- 左侧：资源与项目 -----------------
    subgraph Assets [资源与依赖]
        ESM[esm.sh]
        ExtLib[外部库]
        BuiltIn[内置组件]
        HTML[HTML 原生]

        ESM --> ExtLib
        ExtLib & BuiltIn & HTML --> ProjectScope

        subgraph ProjectScope [项目]
            Router[路由]
            Component[组件]
        end
    end

    Assets --> MIR
    ESM -.-> AnimEditor

    %% ----------------- 核心功能扩展 -----------------
    LLM[LLM 辅助开发] --> MIR

    %% ----------------- 右侧：后端与 Git -----------------
    subgraph BackendSys [后端与社区]
        Backend[后端] --> Community[社区系统]
        Community --> OtherPlatform[其他平台上的社区]
    end

    MIR <--> Backend

    subgraph VersionControl [版本控制]
        Git[Git]:::infra
        GitPlat[GitHub / Gitee / GitLab]
        License[依赖项 LICENSE 处理]

        Git <--> GitPlat
        License --> Git
    end

    MIR -->|MIR 文件树| Git

    %% ----------------- 底部：编译与部署 -----------------
    subgraph Compilation [编译器与输出]
        Compiler[编译器]:::output

        %% 框架列表
        Frameworks[原生 / Web Components / React / Vue / Angular<br>Qwik / Svelte / Solid / Lit / Astro]

        Build[构建]
        Deploy[部署]:::infra

        %% 部署目标
        Targets[Nginx 配置 / Cloudflare 等 / 服务器 / CDN]
        Hosting[GitHub Pages / Vercel / Netlify]
        Perf[性能监控]

        Compiler --> Frameworks
        Frameworks --> Build --> Deploy
        Deploy --> Targets & Hosting
        Perf --> Targets
    end

    %% 连接核心到编译器
    MIR --> Compiler
    Git -->|源代码| Frameworks

    %% ----------------- 右下角：文档 -----------------
    Docs[文档]
    Tutorials[教程]
```

## 代码规范

1. 读写文档都要用 UTF-8 编码。
2. 所有代码必须考虑可扩展性和健壮性。
3. `@mdr/ui` 包下组件库使用 SCSS 进行样式编写，其他样式则用 Tailwind。要用最新的 Tailwind 4 写法，摒弃旧写法。
4. 为方便开发者看懂代码，当且仅当在重要模块的核心方法或核心组件前编写规范的文档注释，写明白模块的调用链路的逻辑。不要写无用注释。
5. 如果文件过长，拆分。
6. 当且仅当需要测试时，补全测试。考虑边界条件。
7. 当完整的功能写好后，先运行 `pnpm run format` 来格式化代码，再提交并推送。commit msg 使用纯英文，按照业界规范写法：使用 `type(scope): description` 格式。
8. 在保持 monochrome-ui 设计风格的前提下，样式和 UX 设计可以模仿 Figma 和 Dify。
