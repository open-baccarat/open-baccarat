# OpenBaccarat

<div align="center">

🎰 **区块链可验证随机数实验平台**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Solana](https://img.shields.io/badge/Solana-Blockchain-9945FF)](https://solana.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6)](https://www.typescriptlang.org/)

🌐 **在线演示**: [https://www.open-baccarat.com](https://www.open-baccarat.com)

[English](./README.md) | **中文**

</div>

---

## 📌 项目声明

> ⚠️ **重要声明**：OpenBaccarat 是一个**纯技术实验项目**，旨在展示区块链可验证随机函数 (VRF) 的实际应用。
>
> - 🚫 **不是赌博平台** - 本项目不涉及任何真金下注
> - 🚫 **无用户系统** - 不能登录、不能注册
> - 🚫 **无下注功能** - 只能观看，不能参与
> - ✅ **纯展示用途** - 用于演示真随机数在概率游戏中的表现

## 🎯 项目简介

OpenBaccarat 是一个完全开源的区块链可验证随机数 (VRF) 实验平台。通过百家乐游戏的形式，直观展示区块链真随机数的公平性和可验证性。

每一局游戏的随机数都来自 Solana 区块链的 VRF 预言机，任何人都可以独立验证每一个随机结果的真实性和公正性。

**🕐 游戏在每分钟整点自动开始，全球同步进行。**

## ✨ 核心特性

| 特性 | 描述 |
|------|------|
| 🔓 **完全开源** | 算法、代码、历史记录全部公开透明 |
| ⛓️ **区块链存证** | 每局结果写入 Solana，永久不可篡改 |
| 🎲 **VRF 真随机** | 使用可验证随机函数，任何人可验证 |
| 📊 **完整记录** | 每张牌、每一局、每个牌靴完整追溯 |
| 🔍 **链上验证** | 一键跳转 Solana Explorer 验证结果 |
| 🔌 **开发者友好** | 提供 RESTful API，支持程序化访问 |

## 🌐 在线功能

| 页面 | 地址 | 说明 |
|------|------|------|
| 首页 | [open-baccarat.com](https://www.open-baccarat.com) | 实时游戏展示 |
| 历史记录 | [/history](https://www.open-baccarat.com/history) | 完整历史和路单 |
| 局号查询 | [/round](https://www.open-baccarat.com/round) | 查询任意局详情 |
| 关于 | [/about](https://www.open-baccarat.com/about) | 项目介绍和 API |
| API 文档 | [/api/docs](https://www.open-baccarat.com/api/docs) | OpenAPI 3.0 文档 |

## 🔌 API 接口

OpenBaccarat 提供完整的 RESTful API，方便开发者和 AI 访问：

```bash
# 获取单局详情
curl https://www.open-baccarat.com/api/games/42

# 批量查询（支持多种筛选）
curl "https://www.open-baccarat.com/api/rounds?limit=10&format=compact"

# 按结果筛选
curl "https://www.open-baccarat.com/api/rounds?result=banker_win&shoeNumber=1"

# 获取 API 文档
curl https://www.open-baccarat.com/api/docs
```

### 查询参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `roundNumber` | 精确局号 | `?roundNumber=42` |
| `roundFrom` / `roundTo` | 局号范围 | `?roundFrom=1&roundTo=100` |
| `shoeNumber` | 按牌靴筛选 | `?shoeNumber=3` |
| `result` | 按结果筛选 | `?result=banker_win` |
| `format` | 输出格式 | `?format=minimal` |
| `limit` / `offset` | 分页（最大 100） | `?limit=50&offset=0` |

### 输出格式

- `full` - 完整数据（牌面、时间、区块链信息）
- `compact` - 精简数据（无牌面详情）
- `minimal` - 最小数据（只有结果和点数）

## 🏗️ 技术栈

- **前端**：Next.js 15 + React 19 + TypeScript
- **样式**：Tailwind CSS + shadcn/ui
- **数据库**：Supabase (PostgreSQL)
- **区块链**：Solana + VRF 预言机
- **状态管理**：Zustand
- **实时通信**：Server-Sent Events (SSE)
- **国际化**：next-intl（中/英双语）

## 🚀 快速开始

```bash
# 克隆仓库
git clone https://github.com/open-baccarat/OpenBaccarat.git
cd OpenBaccarat

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入配置

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000 查看应用。

## 🔬 技术原理

### VRF (可验证随机函数)

```
VRF 输入：
  - 上一个区块哈希
  - 牌靴/局号
  - 预言机私钥

VRF 输出：
  - 可验证的随机数
  - 证明（任何人可验证）
```

每局游戏使用 VRF 生成随机数，该随机数：
1. **不可预测** - 在生成前无法预知
2. **可验证** - 任何人可以用公钥验证
3. **不可篡改** - 一旦生成无法修改

### 数据存证

所有游戏结果都会写入 Solana 区块链：
- 🔗 交易签名可在 Solana Explorer 查询
- 📝 游戏数据作为 Memo 写入交易
- ⏰ 区块时间戳作为不可篡改的时间证明

## 📊 项目结构

```
src/
├── app/              # Next.js App Router
│   ├── api/          # API 路由
│   │   ├── games/    # 游戏数据 API
│   │   ├── rounds/   # 灵活查询 API
│   │   ├── docs/     # API 文档
│   │   └── ...
│   ├── round/        # 局号查询页面
│   ├── history/      # 历史记录页面
│   └── about/        # 关于页面
├── components/       # React 组件
│   ├── ui/           # shadcn/ui 组件
│   ├── game/         # 游戏相关组件
│   └── common/       # 通用组件
├── hooks/            # 自定义 Hooks
├── lib/              # 工具库
│   ├── game/         # 游戏逻辑
│   ├── solana/       # 区块链交互
│   └── supabase/     # 数据库查询
├── stores/           # Zustand 状态管理
└── types/            # TypeScript 类型定义
```

## 📖 文档

- [设计文档](./docs/design.md) - 详细的系统设计说明
- [贡献指南](./CONTRIBUTING.md) - 如何参与项目开发
- [API 文档](https://www.open-baccarat.com/api/docs) - 在线 API 文档

## 🤝 参与贡献

我们欢迎任何形式的贡献！请查阅 [贡献指南](./CONTRIBUTING.md) 了解详情。

## 📄 开源协议

本项目采用 [MIT License](./LICENSE) 开源协议。

---

<div align="center">

**OpenBaccarat** - 区块链可验证随机数演示平台

🌐 [网站](https://www.open-baccarat.com) · [GitHub](https://github.com/open-baccarat/OpenBaccarat) · [API 文档](https://www.open-baccarat.com/api/docs)

</div>
