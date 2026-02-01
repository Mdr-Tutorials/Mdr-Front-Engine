import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "MdrFrontEngine",
  description: "可视化前端开发平台 - 从设计到部署的一站式解决方案",
  lang: 'zh-CN',
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#5f67ee' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'MdrFrontEngine' }],
    ['meta', { property: 'og:description', content: '可视化前端开发平台 - 从设计到部署的一站式解决方案' }],
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
        ]
      },
      { text: '社区', link: '/community/contributing' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '入门',
          items: [
            { text: '简介', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '项目结构', link: '/guide/project-structure' },
          ]
        },
        {
          text: '核心概念',
          items: [
            { text: '蓝图编辑器', link: '/guide/blueprint-editor' },
            { text: '节点图系统', link: '/guide/node-graph' },
            { text: 'MIR 中间表示', link: '/guide/mir' },
            { text: '组件系统', link: '/guide/components' },
          ]
        },
        {
          text: '进阶',
          items: [
            { text: '代码导出', link: '/guide/export' },
            { text: '部署', link: '/guide/deployment' },
            { text: '主题定制', link: '/guide/theming' },
            { text: '国际化', link: '/guide/i18n' },
          ]
        }
      ],
      '/reference/': [
        {
          text: '规范',
          items: [
            { text: 'MIR 语法规范', link: '/reference/mir-spec' },
            { text: '组件规范', link: '/reference/component-spec' },
            { text: '节点规范', link: '/reference/node-spec' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '组件库', link: '/api/components' },
            { text: 'CLI 工具', link: '/api/cli' },
            { text: '后端 API', link: '/api/backend' },
          ]
        }
      ],
      '/community/': [
        {
          text: '社区',
          items: [
            { text: '贡献指南', link: '/community/contributing' },
            { text: '开发指南', link: '/community/development' },
            { text: '更新日志', link: '/community/changelog' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mdr-front-engine/mdr-front-engine' }
    ],

    footer: {
      message: '基于 MIT 许可证发布',
      copyright: 'Copyright © 2024-present MdrFrontEngine Team'
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换'
            }
          }
        }
      }
    },

    outline: {
      label: '页面导航',
      level: [2, 3]
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  }
})
