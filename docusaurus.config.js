// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '我的笔记',
  tagline: '记录学习，沉淀思考',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://your-docusaurus-site.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'facebook', // Usually your GitHub org/user name.
  projectName: 'docusaurus', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: './docs',
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex], // 启用 rehypeKatex
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      
      // 配置颜色模式，自动跟随用户系统主题偏好
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true, // 关键设置：自动跟随系统主题
      },
      
      navbar: {
        title: '我的笔记',
        logo: {
          alt: '记录学习，沉淀思考',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: '笔记库',
          },
          { to: '/blog', label: '博客', position: 'left' },
          {
            type: 'html',
            position: 'left',
            value: `
              <div class="navbar-file-actions" style="display: flex; align-items: center; margin-left: 1rem;">
                <button 
                  class="navbar__item navbar__link file-action-btn" 
                  data-action="new"
                  onclick="window.openFileModal && window.openFileModal('new')"
                  style="background: none; border: none; cursor: pointer; padding: 0.5rem 0.75rem; font-size: 0.9rem; font-weight: 500; color: var(--ifm-navbar-link-color); text-decoration: none; border-radius: var(--ifm-button-border-radius); transition: all 0.2s ease; white-space: nowrap;"
                  onmouseover="this.style.color='var(--ifm-navbar-link-hover-color)'; this.style.backgroundColor='var(--ifm-color-emphasis-100)';"
                  onmouseout="this.style.color='var(--ifm-navbar-link-color)'; this.style.backgroundColor='transparent';"
                >
                  新建文件
                </button>
                <button 
                  class="navbar__item navbar__link file-action-btn" 
                  data-action="edit-current"
                  onclick="window.openFileModal && window.openFileModal('edit-current')"
                  style="background: none; border: none; cursor: pointer; padding: 0.5rem 0.75rem; font-size: 0.9rem; font-weight: 500; color: var(--ifm-navbar-link-color); text-decoration: none; border-radius: var(--ifm-button-border-radius); transition: all 0.2s ease; white-space: nowrap;"
                  onmouseover="this.style.color='var(--ifm-navbar-link-hover-color)'; this.style.backgroundColor='var(--ifm-color-emphasis-100)';"
                  onmouseout="this.style.color='var(--ifm-navbar-link-color)'; this.style.backgroundColor='transparent';"
                >
                  编辑文档
                </button>
              </div>
              <style>
                @media (max-width: 768px) {
                  .navbar-file-actions {
                    display: none !important;
                  }
                }
              </style>
            `,
          },
          {
            href: 'https://github.com/facebook/docusaurus',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },

      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),

  // 添加 KaTeX 的 CSS 文件
  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css',
      type: 'text/css',
    },
  ],
};

export default config;

