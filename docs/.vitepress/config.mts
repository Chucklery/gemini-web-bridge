import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'Gemini Web Bridge',
  description: '将 Gemini Web 会话转换为本地兼容 API 的开发者文档',
  base: process.env.DOCS_BASE || '/gemini-web-bridge/',
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Gemini Web Bridge',
    nav: [
      { text: '指南', link: '/guide/quickstart' },
      { text: '原理', link: '/architecture/overview' },
      { text: '参考', link: '/reference/configuration' },
      { text: 'GitHub', link: 'https://github.com/Chucklery/gemini-web-bridge' },
    ],
    sidebar: {
      '/guide/': [
        { text: '开始使用', items: [
          { text: '项目定位', link: '/guide/' },
          { text: '快速开始', link: '/guide/quickstart' },
          { text: '认证流程', link: '/guide/authentication' },
          { text: '调用兼容 API', link: '/guide/api-usage' },
          { text: '故障排查', link: '/guide/troubleshooting' },
          { text: '贡献者工作流', link: '/guide/contributing' },
        ] },
      ],
      '/architecture/': [
        { text: '系统原理', items: [
          { text: '架构总览', link: '/architecture/overview' },
          { text: '认证与 Cookie 生命周期', link: '/architecture/auth-lifecycle' },
          { text: '流式响应与重连', link: '/architecture/streaming' },
          { text: '账户池与错误治理', link: '/architecture/accounts-and-errors' },
          { text: '演进路线', link: '/architecture/evolution' },
        ] },
      ],
      '/reference/': [
        { text: '参考', items: [
          { text: '环境变量', link: '/reference/configuration' },
          { text: 'HTTP 端点', link: '/reference/endpoints' },
          { text: '代码地图', link: '/reference/code-map' },
          { text: '测试与发布', link: '/reference/ci' },
        ] },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Chucklery/gemini-web-bridge' }],
    editLink: { pattern: 'https://github.com/Chucklery/gemini-web-bridge/edit/main/docs/:path' },
    footer: { message: '非 Google 官方 API。请遵守适用的服务条款和组织策略。', copyright: 'Copyright © 2026 Gemini Web Bridge contributors' },
    search: { provider: 'local' },
  },
})
