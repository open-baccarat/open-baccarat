# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 单局详情页面 `/round/[id]`
- 验证工具页面 `/verify`
- 关于页面 `/about`
- 404 错误页面
- 500 错误页面
- SSE 实时推送端点和 Hook
- 单局详情 API `/api/games/[id]`
- 牌靴详情 API `/api/shoes/[id]`
- 牌靴已用牌 API `/api/shoes/[id]/cards`
- Vitest 测试框架
- 游戏规则单元测试
- 发牌靴逻辑单元测试
- 路单算法单元测试

### Changed
- 优化首页布局，符合设计文档规范
- 添加倒计时和下一局时间显示
- 实现响应式布局（桌面两列，移动端 Tab 切换）

## [0.1.0] - 2026-01-26

### Added
- 项目初始化
- Next.js 14 + App Router
- TypeScript 严格模式
- Tailwind CSS 配置
- shadcn/ui 组件库
- 游戏规则实现（百家乐完整规则）
- 发牌靴逻辑（8副牌、洗牌、烧牌）
- 路单算法（大路、大眼仔、小路、珠盘路）
- 3D 场景基础（React Three Fiber）
- 扑克牌弯折效果（顶点着色器）
- Supabase 数据库 schema
- Solana 客户端
- VRF 随机数验证
- Zustand 状态管理
- 演示模式

### Database
- `shoes` 表：牌靴信息、烧牌数据、区块链信息
- `rounds` 表：游戏记录、发牌结果、VRF 证明
- `used_cards` 表：已发牌记录
- 多个视图：`game_stats`、`current_shoe_detail`、`rounds_list`、`roadmap_data`
- 触发器：自动更新时间戳和统计

### Security
- Supabase RLS 策略
- 匿名只读访问
- Service role 完全访问

---

## 版本说明

- **Major (主版本)**：不兼容的 API 变更
- **Minor (次版本)**：向后兼容的新功能
- **Patch (补丁)**：向后兼容的问题修复

## 链接

- [GitHub 仓库](https://github.com/open-baccarat/OpenBaccarat)
- [Issue 跟踪](https://github.com/open-baccarat/OpenBaccarat/issues)
- [项目文档](https://github.com/open-baccarat/OpenBaccarat/tree/main/docs)
