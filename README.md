## @x1a0ma17x/zeppos-reactive

一个极轻量、零依赖、适用于 ZeppOS / 小程序 / 受限环境的响应式系统。


- ✅ reactive() —— 深度响应式对象

- ✅ effect() —— 自动依赖收集 & 响应式副作用

- ✅ computed() —— 具备缓存的计算属性（推 + 拉混合模型）

- ✅ 无 Proxy polyfill 依赖

- ✅ 无 effect 栈、无 scheduler 的极简实现

- ✅ 适合 ZeppOS、IoT、小程序等受限运行环境

### 📦 安装

```bash
npm install @x1a0ma17x/zeppos-reactive
```

或使用 pnpm：

```bash
pnpm add @x1a0ma17x/zeppos-reactive
```

### 🚀 快速开始

```js
import { reactive, effect, computed } from "@x1a0ma17x/zeppos-reactive";

const state = reactive({
  count: 1,
  nested: { value: 10 }
});

effect(() => {
  console.log("count changed:", state.count);
});

state.count++; // 自动触发 effect
```

### 📘 API 文档

#### 1. reactive()

创建一个深度响应式对象。

```js
const obj = reactive({ a: 1, b: { c: 2 } });
```

##### 特点：

- ✅ 深度代理（嵌套对象自动 reactive）

- ✅ 访问属性时自动 track

- ✅ 修改属性时自动 trigger

- ✅ 不会重复代理同一个对象

##### 示例：

```js
const state = reactive({
  count: 0,
  nested: { value: 100 }
});

effect(() => {
  console.log("nested.value =", state.nested.value);
});

state.nested.value = 200; // 自动触发 effect
```

#### 2. effect()

注册一个副作用函数，当其依赖的响应式数据变化时自动重新执行。

```js
effect(() => {
  console.log("count is", state.count);
});
```

##### 特点：

- ✅ 自动依赖收集

- ✅ 支持嵌套 effect

- ✅ 支持动态依赖切换

- ✅ 调用栈即 effect 栈，无需额外维护

##### 示例：动态依赖切换

```js
const state = reactive({ flag: true, a: 1, b: 2 });

effect(() => {
  console.log(state.flag ? state.a : state.b);
});

state.flag = false; // effect 自动切换依赖到 state.b
state.b = 100;      // 触发 effect
```

#### 3. computed()

创建一个具备缓存的计算属性。

```js
const double = computed(() => state.count * 2);

console.log(double.value); // 2
state.count++;
console.log(double.value); // 4
```

##### 特点：

- ✅ 首次访问时计算

- ✅ 缓存结果

- ✅ 依赖变化时自动更新

- ✅ 只有在被 effect 依赖时才会主动触发更新（推式）

- ✅ 在非 effect 中访问时按需重新计算（拉式）

##### 示例：computed 依赖 effect

```js
const sum = computed(() => state.a + state.b);

effect(() => {
  console.log("sum =", sum.value);
});

state.a = 10; // 自动触发 effect
```
