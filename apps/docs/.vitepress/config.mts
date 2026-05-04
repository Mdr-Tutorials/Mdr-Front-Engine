import { defineConfig } from 'vitepress';

const base = process.env.VITEPRESS_BASE ?? '/';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base,
  title: 'MdrFrontEngine',
  description: '可视化前端开发平台 - 从设计到部署的一站式解决方案',
  lang: 'zh-CN',
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }],
    ['meta', { name: 'theme-color', content: '#5f67ee' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'MdrFrontEngine' }],
    [
      'meta',
      {
        property: 'og:description',
        content: '可视化前端开发平台 - 从设计到部署的一站式解决方案',
      },
    ],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'MdrFrontEngine',

    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/introduction' },
      { text: '参考', link: '/reference/mir-spec' },
      {
        text: 'API',
        items: [
          { text: '组件库', link: '/api/components' },
          { text: 'CLI 工具', link: '/api/cli' },
          { text: '后端 API', link: '/api/backend' },
        ],
      },
      { text: 'Storybook', link: '/storybook/' },
      { text: '社区', link: '/community/contributing' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '入门',
          items: [
            { text: '简介', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '项目结构', link: '/guide/project-structure' },
          ],
        },
        {
          text: '核心概念',
          items: [{ text: 'AI 助手', link: '/guide/ai-assistant' }],
        },
      ],
      '/reference/': [
        {
          text: '规范',
          items: [
            { text: 'MIR 语法规范', link: '/reference/mir-spec' },
            {
              text: '作者态符号环境',
              link: '/reference/authoring-symbol-environment',
            },
            { text: '错误码与诊断', link: '/reference/diagnostic-codes' },
          ],
        },
        {
          text: '错误码',
          collapsed: true,
          items: [
            {
              text: 'MIR',
              link: '/reference/diagnostics/mir',
              collapsed: true,
              items: [
                { text: 'MIR-1001', link: '/reference/diagnostics/mir-1001' },
                { text: 'MIR-1002', link: '/reference/diagnostics/mir-1002' },
                { text: 'MIR-1003', link: '/reference/diagnostics/mir-1003' },
                { text: 'MIR-2001', link: '/reference/diagnostics/mir-2001' },
                { text: 'MIR-2002', link: '/reference/diagnostics/mir-2002' },
                { text: 'MIR-2003', link: '/reference/diagnostics/mir-2003' },
                { text: 'MIR-2004', link: '/reference/diagnostics/mir-2004' },
                { text: 'MIR-2005', link: '/reference/diagnostics/mir-2005' },
                { text: 'MIR-2006', link: '/reference/diagnostics/mir-2006' },
                { text: 'MIR-2007', link: '/reference/diagnostics/mir-2007' },
                { text: 'MIR-3001', link: '/reference/diagnostics/mir-3001' },
                { text: 'MIR-3002', link: '/reference/diagnostics/mir-3002' },
                { text: 'MIR-3010', link: '/reference/diagnostics/mir-3010' },
                { text: 'MIR-4001', link: '/reference/diagnostics/mir-4001' },
                { text: 'MIR-9001', link: '/reference/diagnostics/mir-9001' },
              ],
            },
            {
              text: 'Workspace',
              link: '/reference/diagnostics/wks',
              collapsed: true,
              items: [
                { text: 'WKS-1001', link: '/reference/diagnostics/wks-1001' },
                { text: 'WKS-1002', link: '/reference/diagnostics/wks-1002' },
                { text: 'WKS-2001', link: '/reference/diagnostics/wks-2001' },
                { text: 'WKS-3001', link: '/reference/diagnostics/wks-3001' },
                { text: 'WKS-3002', link: '/reference/diagnostics/wks-3002' },
                { text: 'WKS-4001', link: '/reference/diagnostics/wks-4001' },
                { text: 'WKS-4002', link: '/reference/diagnostics/wks-4002' },
                { text: 'WKS-4003', link: '/reference/diagnostics/wks-4003' },
                { text: 'WKS-5001', link: '/reference/diagnostics/wks-5001' },
                { text: 'WKS-5002', link: '/reference/diagnostics/wks-5002' },
                { text: 'WKS-9001', link: '/reference/diagnostics/wks-9001' },
              ],
            },
            {
              text: 'Editor',
              link: '/reference/diagnostics/edt',
              collapsed: true,
              items: [
                { text: 'EDT-1001', link: '/reference/diagnostics/edt-1001' },
                { text: 'EDT-2001', link: '/reference/diagnostics/edt-2001' },
                { text: 'EDT-2002', link: '/reference/diagnostics/edt-2002' },
                { text: 'EDT-3001', link: '/reference/diagnostics/edt-3001' },
                { text: 'EDT-3002', link: '/reference/diagnostics/edt-3002' },
                { text: 'EDT-4001', link: '/reference/diagnostics/edt-4001' },
                { text: 'EDT-5001', link: '/reference/diagnostics/edt-5001' },
                { text: 'EDT-5002', link: '/reference/diagnostics/edt-5002' },
                { text: 'EDT-9001', link: '/reference/diagnostics/edt-9001' },
              ],
            },
            {
              text: 'Code',
              link: '/reference/diagnostics/cod',
              collapsed: true,
              items: [
                { text: 'COD-1001', link: '/reference/diagnostics/cod-1001' },
                { text: 'COD-1002', link: '/reference/diagnostics/cod-1002' },
                { text: 'COD-2001', link: '/reference/diagnostics/cod-2001' },
                { text: 'COD-2002', link: '/reference/diagnostics/cod-2002' },
                { text: 'COD-2003', link: '/reference/diagnostics/cod-2003' },
                { text: 'COD-2004', link: '/reference/diagnostics/cod-2004' },
                { text: 'COD-3001', link: '/reference/diagnostics/cod-3001' },
                { text: 'COD-3002', link: '/reference/diagnostics/cod-3002' },
                { text: 'COD-3003', link: '/reference/diagnostics/cod-3003' },
                { text: 'COD-4001', link: '/reference/diagnostics/cod-4001' },
                { text: 'COD-5001', link: '/reference/diagnostics/cod-5001' },
                { text: 'COD-5002', link: '/reference/diagnostics/cod-5002' },
                { text: 'COD-9001', link: '/reference/diagnostics/cod-9001' },
              ],
            },
            {
              text: 'External Library',
              link: '/reference/diagnostics/elib',
              collapsed: true,
              items: [
                { text: 'ELIB-1001', link: '/reference/diagnostics/elib-1001' },
                { text: 'ELIB-1004', link: '/reference/diagnostics/elib-1004' },
                { text: 'ELIB-1099', link: '/reference/diagnostics/elib-1099' },
                { text: 'ELIB-2001', link: '/reference/diagnostics/elib-2001' },
                { text: 'ELIB-3001', link: '/reference/diagnostics/elib-3001' },
              ],
            },
            {
              text: 'Codegen',
              link: '/reference/diagnostics/gen',
              collapsed: true,
              items: [
                { text: 'GEN-1001', link: '/reference/diagnostics/gen-1001' },
                { text: 'GEN-2001', link: '/reference/diagnostics/gen-2001' },
                { text: 'GEN-2002', link: '/reference/diagnostics/gen-2002' },
                { text: 'GEN-3001', link: '/reference/diagnostics/gen-3001' },
                { text: 'GEN-3002', link: '/reference/diagnostics/gen-3002' },
                { text: 'GEN-4001', link: '/reference/diagnostics/gen-4001' },
                { text: 'GEN-5001', link: '/reference/diagnostics/gen-5001' },
                { text: 'GEN-9001', link: '/reference/diagnostics/gen-9001' },
              ],
            },
            {
              text: 'API',
              link: '/reference/diagnostics/api',
              collapsed: true,
              items: [
                { text: 'API-1001', link: '/reference/diagnostics/api-1001' },
                { text: 'API-1002', link: '/reference/diagnostics/api-1002' },
                { text: 'API-2001', link: '/reference/diagnostics/api-2001' },
                { text: 'API-2002', link: '/reference/diagnostics/api-2002' },
                { text: 'API-3001', link: '/reference/diagnostics/api-3001' },
                { text: 'API-4001', link: '/reference/diagnostics/api-4001' },
                { text: 'API-4004', link: '/reference/diagnostics/api-4004' },
                { text: 'API-4009', link: '/reference/diagnostics/api-4009' },
                { text: 'API-5001', link: '/reference/diagnostics/api-5001' },
                { text: 'API-6001', link: '/reference/diagnostics/api-6001' },
                { text: 'API-9001', link: '/reference/diagnostics/api-9001' },
              ],
            },
            {
              text: 'AI',
              link: '/reference/diagnostics/ai',
              collapsed: true,
              items: [
                { text: 'AI-1001', link: '/reference/diagnostics/ai-1001' },
                { text: 'AI-1002', link: '/reference/diagnostics/ai-1002' },
                { text: 'AI-2001', link: '/reference/diagnostics/ai-2001' },
                { text: 'AI-2002', link: '/reference/diagnostics/ai-2002' },
                { text: 'AI-3001', link: '/reference/diagnostics/ai-3001' },
                { text: 'AI-4001', link: '/reference/diagnostics/ai-4001' },
                { text: 'AI-4002', link: '/reference/diagnostics/ai-4002' },
                { text: 'AI-5001', link: '/reference/diagnostics/ai-5001' },
                { text: 'AI-9001', link: '/reference/diagnostics/ai-9001' },
              ],
            },
            {
              text: 'Route',
              link: '/reference/diagnostics/rte',
              collapsed: true,
              items: [
                { text: 'RTE-1001', link: '/reference/diagnostics/rte-1001' },
                { text: 'RTE-1002', link: '/reference/diagnostics/rte-1002' },
                { text: 'RTE-2001', link: '/reference/diagnostics/rte-2001' },
                { text: 'RTE-3001', link: '/reference/diagnostics/rte-3001' },
                { text: 'RTE-3002', link: '/reference/diagnostics/rte-3002' },
                { text: 'RTE-4001', link: '/reference/diagnostics/rte-4001' },
                { text: 'RTE-9001', link: '/reference/diagnostics/rte-9001' },
              ],
            },
            {
              text: 'NodeGraph',
              link: '/reference/diagnostics/ngr',
              collapsed: true,
              items: [
                { text: 'NGR-1001', link: '/reference/diagnostics/ngr-1001' },
                { text: 'NGR-2001', link: '/reference/diagnostics/ngr-2001' },
                { text: 'NGR-2002', link: '/reference/diagnostics/ngr-2002' },
                { text: 'NGR-3001', link: '/reference/diagnostics/ngr-3001' },
                { text: 'NGR-4001', link: '/reference/diagnostics/ngr-4001' },
                { text: 'NGR-5001', link: '/reference/diagnostics/ngr-5001' },
                { text: 'NGR-9001', link: '/reference/diagnostics/ngr-9001' },
              ],
            },
            {
              text: 'Animation',
              link: '/reference/diagnostics/ani',
              collapsed: true,
              items: [
                { text: 'ANI-1001', link: '/reference/diagnostics/ani-1001' },
                { text: 'ANI-1002', link: '/reference/diagnostics/ani-1002' },
                { text: 'ANI-2001', link: '/reference/diagnostics/ani-2001' },
                { text: 'ANI-3001', link: '/reference/diagnostics/ani-3001' },
                { text: 'ANI-3002', link: '/reference/diagnostics/ani-3002' },
                { text: 'ANI-4001', link: '/reference/diagnostics/ani-4001' },
                { text: 'ANI-5001', link: '/reference/diagnostics/ani-5001' },
                { text: 'ANI-9001', link: '/reference/diagnostics/ani-9001' },
              ],
            },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '组件库', link: '/api/components' },
            { text: 'CLI 工具', link: '/api/cli' },
            { text: '后端 API', link: '/api/backend' },
          ],
        },
      ],
      '/community/': [
        {
          text: '社区',
          items: [
            { text: '贡献指南', link: '/community/contributing' },
            { text: '开发指南', link: '/community/development' },
            { text: '更新日志', link: '/community/changelog' },
          ],
        },
      ],
    },

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/Mdr-Tutorials/Mdr-Front-Engine',
      },
    ],

    footer: {
      message: '基于 MIT 许可证发布',
      copyright: 'Copyright © 2024-present MdrFrontEngine Team',
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
            },
          },
        },
      },
    },

    outline: {
      label: '页面导航',
      level: [2, 3],
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium',
      },
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
  },
});
