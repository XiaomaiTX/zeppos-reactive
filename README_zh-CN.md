# ZeppOS Ractive

![npm version](https://img.shields.io/npm/v/@x1a0ma17x/zeppos-reactive)
![minified size](https://img.shields.io/bundlephobia/min/@x1a0ma17x/zeppos-reactive)
![license](https://img.shields.io/npm/l/@x1a0ma17x/zeppos-reactive)

一个极轻量、适用于性能受限 js 环境的响应式系统。

- ✅ 无 effect 栈、无 scheduler 的极简实现

- ✅ 适合 ZeppOS、IoT、小程序等受限运行环境

## 📦 安装

```bash
pnpm add @x1a0ma17x/zeppos-reactive
```

## 🚀 快速开始

```js
import { reactive, effect, computed } from "@x1a0ma17x/zeppos-reactive";

const state = reactive({
    count: 1,
});

effect(() => {
    console.log("count changed:", state.count);
});

state.count++; // 自动触发 effect
```
