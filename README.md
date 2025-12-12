# ZeppOS Ractive

![npm version](https://img.shields.io/npm/v/@x1a0ma17x/zeppos-reactive)
![minified size](https://img.shields.io/bundlephobia/min/@x1a0ma17x/zeppos-reactive)
![license](https://img.shields.io/npm/l/@x1a0ma17x/zeppos-reactive)

[中文文档](./README_zh-CN.md)

An extremely lightweight reactive system designed for performance-constrained JavaScript environments.

- ✅ Minimal implementation without effect stacks or schedulers
- ✅ Suitable for constrained runtime environments like ZeppOS, IoT, and Mini Programs

## 📦 Installation

```bash
pnpm add @x1a0ma17x/zeppos-reactive
```

## 🚀 Quick Start

```js
import { reactive, effect, computed, memo, merge, mergeProps, watch } from "@x1a0ma17x/zeppos-reactive";

const state = reactive({
    count: 1,
});

effect(() => {
    console.log("count changed:", state.count);
});

state.count++; // Automatically triggers the effect
```
