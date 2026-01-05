# ZeppOS Ractive

![npm version](https://img.shields.io/npm/v/@x1a0ma17x/zeppos-reactive)
![minified size](https://img.shields.io/bundlephobia/min/@x1a0ma17x/zeppos-reactive)
![license](https://img.shields.io/npm/l/@x1a0ma17x/zeppos-reactive)

一个极轻量、适用于性能受限 js 环境的响应式系统。

- ✅ 轻量无依赖：基于 WeakMap + Proxy 深度追踪，按需递归
- ✅ 精简 effect：支持嵌套与可选 scheduler，Object.is 去重触发
- ✅ 完整 API：reactive/effect/computed/memo/watch/merge/mergeProps，兼容 accessor

## 📦 安装

```bash
pnpm add @x1a0ma17x/zeppos-reactive
```

## 🚀 快速开始

```js
import { reactive, effect, computed, memo, merge, mergeProps, watch } from "@x1a0ma17x/zeppos-reactive";

const state = reactive({
    count: 1,
});

effect(() => {
    console.log("count changed:", state.count);
});

state.count++; // 自动触发 effect
```

### reactive

```js
import { reactive, effect } from "@x1a0ma17x/zeppos-reactive";

const state = reactive({ nested: { count: 0 } });

effect(() => {
  console.log(state.nested.count);
});

state.nested.count++;
```

### effect

```js
import { reactive, effect } from "@x1a0ma17x/zeppos-reactive";

const state = reactive({ count: 0 });

effect(() => {
  console.log(state.count);
});

state.count++;
```

### computed

```js
import { reactive, computed, effect } from "@x1a0ma17x/zeppos-reactive";

const state = reactive({ count: 1 });
const doubled = computed(() => state.count * 2);

effect(() => {
  console.log(doubled.value);
});

state.count++;
```

### memo

```js
import { reactive, memo, effect } from "@x1a0ma17x/zeppos-reactive";

const state = reactive({ first: "A", last: "B" });
const full = memo(() => state.first + state.last);

effect(() => {
  console.log(full());
});

state.last = "C";
```

### watch

```js
import { reactive, watch } from "@x1a0ma17x/zeppos-reactive";

const state = reactive({ count: 0 });

watch(() => state.count, (n, o) => {
  console.log(n, o);
});

state.count++;
```

### merge

```js
import { reactive, merge, effect } from "@x1a0ma17x/zeppos-reactive";

const a = reactive({ count: 0 });
const b = reactive({ name: "x" });
const m = merge(a, b);

effect(() => {
  console.log(m.count, m.name);
});

a.count++;
m.name = "y";
```

### mergeProps

```js
import { reactive, mergeProps, effect } from "@x1a0ma17x/zeppos-reactive";

const state = reactive({ count: 1 });

const base = { a: 1, b: () => state.count };
const override = { a: 2 };
const props = mergeProps(base, override);

effect(() => {
  console.log(props.a, props.b);
});

state.count++;
```

## 开发指南

安装依赖

```bash
pnpm install
```

构建:

```bash
pnpm build
```

构建并监听文件变化:

```bash
pnpm build:watch
```
