import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'en-US',
  title: 'Gemini Web Bridge',
  description: 'Developer documentation for a local Gemini Web compatibility API',
  base: process.env.DOCS_BASE || '/gemini-web-bridge/',
  cleanUrls: true,
  lastUpdated: true,
  locales: {
    root: { label: 'English', lang: 'en-US' },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: {
        nav: [
          { text: '指南', link: '/zh/guide/quickstart' },
          { text: '架构', link: '/zh/architecture/overview' },
          { text: '参考', link: '/zh/reference/configuration' },
          { text: 'GitHub', link: 'https://github.com/Chucklery/gemini-web-bridge' },
        ],
        sidebar: {
          '/zh/guide/': [
            { text: '开始使用', items: [
              { text: '快速开始', link: '/zh/guide/quickstart' },
              { text: '认证流程', link: '/zh/guide/authentication' },
              { text: 'API 使用', link: '/zh/guide/api-usage' },
              { text: '故障排查', link: '/zh/guide/troubleshooting' },
              { text: '贡献指南', link: '/zh/guide/contributing' },
            ] },
            { text: '工作流', items: [
              { text: '从安装到请求', link: '/zh/guide/workflows' },
            ] },
          ],
        },
        '/zh/architecture/': [
          { text: '系统原理', items: [
            { text: '架构总览', link: '/zh/architecture/overview' },
            { text: '认证与 Cookie 生命周期', link: '/zh/architecture/auth-lifecycle' },
              { text: '流式响应与重连', link: '/zh/architecture/streaming' },
              { text: 'Google Gemini Web Provider 开发', link: '/zh/architecture/google-web-client-development' },
              { text: '账户池与错误治理', link: '/zh/architecture/accounts-and-errors' },
            { text: '演进路线', link: '/zh/architecture/evolution' },
          ] },
        ],
        '/zh/reference/': [
          { text: '参考', items: [
            { text: '配置', link: '/zh/reference/configuration' },
            { text: 'HTTP 端点', link: '/zh/reference/endpoints' },
            { text: '代码地图', link: '/zh/reference/code-map' },
            { text: '测试与发布', link: '/zh/reference/ci' },
          ] },
        ],
        footer: { message: '非 Google 官方 API。请遵守适用的服务条款和组织策略。', copyright: 'Copyright © 2026 Gemini Web Bridge contributors' },
      },
    },
  },
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Gemini Web Bridge',
    nav: [
      { text: 'Guides', link: '/guide/quickstart' },
      { text: 'Architecture', link: '/architecture/overview' },
      { text: 'Reference', link: '/reference/configuration' },
      { text: 'GitHub', link: 'https://github.com/Chucklery/gemini-web-bridge' },
    ],
    sidebar: {
      '/guide/': [
        { text: 'Getting started', items: [
          { text: 'Project overview', link: '/guide/' },
          { text: 'Quick start', link: '/guide/quickstart' },
          { text: 'Authentication', link: '/guide/authentication' },
          { text: 'API usage', link: '/guide/api-usage' },
          { text: 'Troubleshooting', link: '/guide/troubleshooting' },
          { text: 'Contributing', link: '/guide/contributing' },
        ] },
        { text: 'Workflows', items: [
          { text: 'Install to request', link: '/guide/workflows' },
        ] },
      ],
      '/architecture/': [
        { text: 'Architecture', items: [
          { text: 'Overview', link: '/architecture/overview' },
          { text: 'Authentication lifecycle', link: '/architecture/auth-lifecycle' },
          { text: 'Streaming and reconnects', link: '/architecture/streaming' },
          { text: 'Accounts and errors', link: '/architecture/accounts-and-errors' },
          { text: 'Evolution', link: '/architecture/evolution' },
        ] },
      ],
      '/reference/': [
        { text: 'Reference', items: [
          { text: 'Configuration', link: '/reference/configuration' },
          { text: 'HTTP endpoints', link: '/reference/endpoints' },
          { text: 'Code map', link: '/reference/code-map' },
          { text: 'Testing and release', link: '/reference/ci' },
        ] },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Chucklery/gemini-web-bridge' }],
    editLink: { pattern: 'https://github.com/Chucklery/gemini-web-bridge/edit/main/docs/:path' },
    footer: { message: 'Not Google\'s official API. Follow applicable terms and organizational policies.', copyright: 'Copyright © 2026 Gemini Web Bridge contributors' },
    search: { provider: 'local' },
  },
})
