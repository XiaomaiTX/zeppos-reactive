# ZeppOS Ractive

![npm version](https://img.shields.io/npm/v/@x1a0ma17x/zeppos-reactive)
![minified size](https://img.shields.io/bundlephobia/min/@x1a0ma17x/zeppos-reactive)
![license](https://img.shields.io/npm/l/@x1a0ma17x/zeppos-reactive)

[中文文档](./README_zh-CN.md)

An extremely lightweight reactive system designed for performance-constrained JavaScript environments.

- ✅ Lightweight and dependency-free: WeakMap + Proxy deep tracking with on-demand recursion
- ✅ Minimal effect model: nested effects, optional scheduler, Object.is-based dedupe triggering
- ✅ Complete APIs: reactive/effect/computed/memo/watch/merge/mergeProps; accessor-compatible for constrained runtimes

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

## Developer Guide

Install dependencies:

```bash
pnpm install
```

build:

```bash
pnpm build
```

build and watch:

```bash
pnpm build:watch
```
