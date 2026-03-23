# 🐷 猪哼哼知识库 - 智能文档管理系统

> 记录学习，沉淀思考 - 基于 Docusaurus 的现代化知识管理平台

[![GitHub](https://img.shields.io/badge/GitHub-Peter--cpu333-blue?logo=github)](https://github.com/Peter-cpu333/my-notes)
[![Docusaurus](https://img.shields.io/badge/Built%20with-Docusaurus-green?logo=docusaurus)](https://docusaurus.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🌟 项目简介

这是一个基于 **Docusaurus** 构建的现代化知识库系统，集成了 AI 聊天助手、文件管理、网页内容提取等功能。旨在为个人学习和知识管理提供一站式解决方案。

## ✨ 核心功能

### 🤖 AI 聊天助手
- **智能对话**：集成通义千问大模型，支持自然语言交互
- **文档理解**：能够读取和分析项目中的文档内容
- **在线搜索**：集成 Tavily 搜索引擎，获取实时信息
- **网页提取**：自动提取和分析网页内容
- **移动端优化**：完美适配手机端聊天体验

### 📁 文件管理系统
- **可视化管理**：直观的文件树结构展示
- **在线编辑**：支持在线创建和编辑 Markdown 文件
- **实时预览**：所见即所得的编辑体验
- **智能导航**：快速定位和访问文档

### 🎨 现代化界面
- **响应式设计**：完美适配桌面端和移动端
- **主题切换**：支持明暗主题自动切换
- **优雅交互**：流畅的用户体验和动画效果

### 🔧 技术特性
- **模块化架构**：前后端分离，易于扩展
- **微服务设计**：AI 服务和文件服务独立部署
- **热重载开发**：开发环境下支持实时更新
- **一键部署**：自动化部署脚本

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0
- **Python** >= 3.8
- **npm** 或 **yarn**

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 配置环境变量

创建 `.env` 文件：

```bash
# AI 服务配置
DASHSCOPE_API_KEY=your_dashscope_api_key
TAVILY_API_KEY=your_tavily_api_key
```

### 启动服务

```bash
# 一键启动所有服务
./start.sh

# 或者分别启动
npm start          # 前端服务 (端口 3000)
python backend/ai_service.py      # AI 服务 (端口 5005)
python backend/file_service.py    # 文件服务 (端口 5006)
```

## 📖 使用指南

### 基本操作

1. **访问网站**：打开 `http://localhost:3000`
2. **AI 聊天**：点击右下角聊天按钮，开始与 AI 对话
3. **文件管理**：使用导航栏的"新建文件"和"编辑文档"功能
4. **文档浏览**：在侧边栏中浏览和搜索文档

### AI 助手功能

- 📚 **文档查询**：询问项目中的文档内容
- ✍️ **内容创作**：让 AI 帮助创建和编辑文档
- 🌐 **信息搜索**：获取最新的网络信息
- 🔗 **网页分析**：分析指定网页的内容

### 文件管理

- 📝 **创建文档**：支持 Markdown 格式
- 📂 **组织结构**：灵活的目录结构管理
- 🔍 **快速搜索**：全文搜索功能
- 📱 **移动端支持**：手机上也能轻松管理

## 🏗️ 项目结构
# my-app
