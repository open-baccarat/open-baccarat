# OpenBaccarat

<div align="center">

🎰 **Blockchain Verifiable Random Number Experiment Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Solana](https://img.shields.io/badge/Solana-Blockchain-9945FF)](https://solana.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6)](https://www.typescriptlang.org/)

🌐 **Live Demo**: [https://www.open-baccarat.com](https://www.open-baccarat.com)

**English** | [中文](./README.zh-CN.md)

</div>

---

## 📌 Disclaimer

> ⚠️ **Important Notice**: OpenBaccarat is a **pure technical experiment** designed to demonstrate the practical application of blockchain Verifiable Random Functions (VRF).
>
> - 🚫 **NOT a gambling platform** - No real money betting involved
> - 🚫 **No user system** - Cannot login or register
> - 🚫 **No betting feature** - Watch only, cannot participate
> - ✅ **Demonstration only** - Shows how true randomness performs in probability games

## 🎯 About

OpenBaccarat is a fully open-source blockchain VRF (Verifiable Random Function) experiment platform. Through the format of Baccarat, it visually demonstrates the fairness and verifiability of blockchain true random numbers.

Every random number in each game round comes from Solana blockchain's VRF oracle. Anyone can independently verify the authenticity and fairness of every random result.

**🕐 Games start automatically at the top of every minute, synchronized globally.**

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔓 **Fully Open Source** | Algorithms, code, and history all transparent |
| ⛓️ **Blockchain Records** | Every result recorded on Solana, immutable |
| 🎲 **VRF True Random** | Verifiable Random Function, anyone can verify |
| 📊 **Complete History** | Every card, round, and shoe fully traceable |
| 🔍 **On-chain Verification** | One-click to Solana Explorer to verify |
| 🔌 **Developer Friendly** | RESTful API for programmatic access |

## 🌐 Online Features

| Page | URL | Description |
|------|-----|-------------|
| Home | [open-baccarat.com](https://www.open-baccarat.com) | Live game display |
| History | [/history](https://www.open-baccarat.com/history) | Full history & roadmaps |
| Round Lookup | [/round](https://www.open-baccarat.com/round) | Query any round details |
| About | [/about](https://www.open-baccarat.com/about) | Project info & API guide |
| API Docs | [/api/docs](https://www.open-baccarat.com/api/docs) | OpenAPI 3.0 documentation |

## 🔌 API Endpoints

OpenBaccarat provides a complete RESTful API for developers and AI access:

```bash
# Get single round details
curl https://www.open-baccarat.com/api/games/42

# Batch query with filters
curl "https://www.open-baccarat.com/api/rounds?limit=10&format=compact"

# Filter by result
curl "https://www.open-baccarat.com/api/rounds?result=banker_win&shoeNumber=1"

# Get API documentation (OpenAPI 3.0)
curl https://www.open-baccarat.com/api/docs
```

### Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `roundNumber` | Exact round number | `?roundNumber=42` |
| `roundFrom` / `roundTo` | Round number range | `?roundFrom=1&roundTo=100` |
| `shoeNumber` | Filter by shoe number | `?shoeNumber=3` |
| `result` | Filter by result | `?result=banker_win` |
| `format` | Output format | `?format=minimal` |
| `limit` / `offset` | Pagination (max 100) | `?limit=50&offset=0` |

### Output Formats

- `full` - Complete data (cards, timing, blockchain info)
- `compact` - Essential fields only (no card details)
- `minimal` - Just result and totals

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Blockchain**: Solana + VRF Oracle
- **State Management**: Zustand
- **Real-time**: Server-Sent Events (SSE)
- **i18n**: next-intl (English/Chinese)

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/open-baccarat/OpenBaccarat.git
cd OpenBaccarat

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
pnpm dev
```

Visit http://localhost:3000 to view the application.

## 🔬 How It Works

### VRF (Verifiable Random Function)

```
VRF Input:
  - Previous block hash
  - Shoe/Round number
  - Oracle private key

VRF Output:
  - Verifiable random number
  - Proof (anyone can verify)
```

Each game uses VRF to generate random numbers that are:
1. **Unpredictable** - Cannot be known before generation
2. **Verifiable** - Anyone can verify with public key
3. **Immutable** - Cannot be modified once generated

### Blockchain Recording

All game results are written to Solana blockchain:
- 🔗 Transaction signatures queryable on Solana Explorer
- 📝 Game data written as Memo in transaction
- ⏰ Block timestamp as immutable time proof

## 📊 Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── api/          # API Routes
│   │   ├── games/    # Game data API
│   │   ├── rounds/   # Flexible query API
│   │   ├── docs/     # API documentation
│   │   └── ...
│   ├── round/        # Round lookup page
│   ├── history/      # History page
│   └── about/        # About page
├── components/       # React Components
│   ├── ui/           # shadcn/ui components
│   ├── game/         # Game components
│   └── common/       # Common components
├── hooks/            # Custom Hooks
├── lib/              # Utilities
│   ├── game/         # Game logic
│   ├── solana/       # Blockchain interaction
│   └── supabase/     # Database queries
├── stores/           # Zustand state
└── types/            # TypeScript types
```

## 📖 Documentation

- [Design Document](./docs/design.md) - Detailed system design
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [API Documentation](https://www.open-baccarat.com/api/docs) - Online API docs

## 🤝 Contributing

We welcome contributions of any kind! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

<div align="center">

**OpenBaccarat** - Demonstrating Blockchain Verifiable Randomness

🌐 [Website](https://www.open-baccarat.com) · [GitHub](https://github.com/open-baccarat/OpenBaccarat) · [API Docs](https://www.open-baccarat.com/api/docs)

</div>
