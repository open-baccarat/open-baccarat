# 贡献指南

感谢你对 OpenBaccarat 的关注！我们欢迎任何形式的贡献。

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+
- Git

### 本地开发

1. **Fork 仓库**
   
   点击 GitHub 页面右上角的 Fork 按钮

2. **克隆仓库**
   ```bash
   git clone https://github.com/YOUR_USERNAME/OpenBaccarat.git
   cd OpenBaccarat
   ```

3. **安装依赖**
   ```bash
   pnpm install
   ```

4. **配置环境变量**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 填入你的配置
   ```

5. **启动开发服务器**
   ```bash
   pnpm dev
   ```

6. **访问应用**
   
   打开 http://localhost:3000

## 📝 贡献流程

### 1. 创建 Issue

在开始工作之前，请先创建或查找相关 Issue：

- 🐛 **Bug 报告**：描述问题、复现步骤、预期行为
- ✨ **功能请求**：描述需求、使用场景、建议实现
- 📚 **文档改进**：指出需要改进的文档

### 2. 创建分支

```bash
# 同步主分支
git checkout main
git pull origin main

# 创建功能分支
git checkout -b feature/your-feature-name

# 或修复分支
git checkout -b fix/issue-description
```

### 3. 编写代码

请遵循以下规范：

- **代码风格**：使用 Prettier 和 ESLint
- **TypeScript**：所有新代码必须使用 TypeScript
- **组件**：遵循 React 最佳实践
- **测试**：为新功能编写测试

```bash
# 格式化代码
pnpm format

# 检查代码
pnpm lint

# 运行测试
pnpm test
```

### 4. 提交代码

使用规范的 commit message：

```bash
# 格式
<type>(<scope>): <description>

# 类型
feat:     新功能
fix:      修复 bug
docs:     文档更新
style:    代码格式（不影响功能）
refactor: 重构
test:     测试相关
chore:    构建/工具相关

# 示例
feat(game): 添加路单大眼仔视图
fix(3d): 修复移动端卡牌渲染问题
docs: 更新 API 文档
```

### 5. 提交 Pull Request

1. 推送分支到你的 fork
   ```bash
   git push origin feature/your-feature-name
   ```

2. 在 GitHub 创建 Pull Request

3. 填写 PR 模板，包括：
   - 变更描述
   - 关联的 Issue
   - 测试说明
   - 截图（如有 UI 变更）

## 🎨 代码规范

### 文件结构

```
src/
├── app/          # Next.js App Router 页面
├── components/   # React 组件
│   ├── ui/       # shadcn/ui 组件
│   ├── game/     # 游戏相关组件
│   ├── 3d/       # 3D 组件
│   └── common/   # 通用组件
├── hooks/        # 自定义 Hooks
├── lib/          # 工具库
│   ├── game/     # 游戏逻辑
│   ├── solana/   # 区块链交互
│   └── supabase/ # 数据库交互
├── stores/       # Zustand 状态管理
└── types/        # TypeScript 类型定义
```

### 命名规范

- **文件名**：kebab-case（如 `game-display.tsx`）
- **组件名**：PascalCase（如 `GameDisplay`）
- **函数名**：camelCase（如 `calculateTotal`）
- **常量名**：UPPER_SNAKE_CASE（如 `DECK_COUNT`）
- **类型名**：PascalCase（如 `GameResult`）

### 组件规范

```tsx
// 组件头部注释
// ============================================
// OpenBaccarat - 组件描述
// ============================================

'use client'; // 客户端组件需要

import { useState } from 'react';

// Props 接口
interface MyComponentProps {
  title: string;
  count?: number;
}

// 导出组件
export function MyComponent({ title, count = 0 }: MyComponentProps) {
  const [state, setState] = useState(false);

  return (
    <div>
      {/* 组件内容 */}
    </div>
  );
}
```

## 🧪 测试指南

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试
pnpm test -- --grep "游戏规则"

# 生成覆盖率报告
pnpm test:coverage
```

### 编写测试

```typescript
import { describe, it, expect } from 'vitest';
import { calculateTotal } from '@/lib/game/rules';

describe('calculateTotal', () => {
  it('应该正确计算点数', () => {
    const cards = [
      { suit: 'heart', rank: '7' },
      { suit: 'spade', rank: '5' },
    ];
    expect(calculateTotal(cards)).toBe(2);
  });
});
```

## 📋 Issue 模板

### Bug 报告

```markdown
**问题描述**
简要描述遇到的问题

**复现步骤**
1. 进入 '...'
2. 点击 '...'
3. 看到错误

**预期行为**
描述预期应该发生什么

**实际行为**
描述实际发生了什么

**环境信息**
- 浏览器: Chrome 120
- 系统: macOS 14
- 设备: MacBook Pro
```

### 功能请求

```markdown
**功能描述**
简要描述希望添加的功能

**使用场景**
描述这个功能的使用场景

**建议实现**
如果有想法，可以描述建议的实现方式
```

## 🏆 贡献者

感谢所有贡献者！

<!-- 贡献者列表会自动更新 -->

## ❓ 常见问题

### 如何处理合并冲突？

```bash
# 同步上游更新
git fetch upstream
git checkout main
git merge upstream/main

# 解决冲突后
git add .
git commit -m "resolve conflicts"
```

### 如何更新依赖？

```bash
pnpm update
```

### 构建失败怎么办？

1. 确保 Node.js 版本正确
2. 删除 node_modules 重新安装
3. 检查环境变量配置
4. 查看错误日志

## 📞 联系方式

- GitHub Issues: 技术问题和 bug 报告
- Discussions: 一般讨论和问答

---

再次感谢你的贡献！🎉
