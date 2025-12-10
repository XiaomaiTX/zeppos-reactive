class ZeppReactive {
    activeEffect;
    targetMap;
    constructor() {
        this.activeEffect = null;
        this.targetMap = new WeakMap();
    }
    track(target, key) {
        if (this.activeEffect) {
            let depsMap = this.targetMap.get(target);
            if (!depsMap) {
                depsMap = new Map();
                this.targetMap.set(target, depsMap);
            }
            let deps = depsMap.get(key);
            if (!deps) {
                deps = new Set();
                depsMap.set(key, deps);
            }
            deps.add(this.activeEffect);
        }
    }
    trigger(target, key) {
        const depsMap = this.targetMap.get(target);
        if (!depsMap)
            return;
        const deps = depsMap.get(key);
        if (deps) {
            deps.forEach((effect) => {
                effect();
            });
        }
    }
    reactive(target) {
        if (typeof target !== "object" || target === null) {
            return target;
        }
        if (target.__isReactive) {
            return target;
        }
        const system = this;
        const proxy = new Proxy(target, {
            get(obj, key, receiver) {
                if (key !== "__isReactive") {
                    system.track(obj, key);
                }
                const result = Reflect.get(obj, key, receiver);
                if (result && typeof result === "object") {
                    return system.reactive(result);
                }
                return result;
            },
            set(obj, key, value, receiver) {
                const oldValue = obj[key];
                const result = Reflect.set(obj, key, value, receiver);
                if (!Object.is(oldValue, value)) {
                    system.trigger(obj, key);
                }
                return result;
            },
        });
        proxy.__isReactive = true;
        return proxy;
    }
    memo(fn, options) {
        const system = this;
        let value;
        let initialized = false;
        const equal = options?.equals ?? Object.is;
        const runner = () => {
            const newValue = fn();
            if (!initialized || !equal(newValue, value)) {
                value = newValue;
                initialized = true;
                system.trigger(getter, "value");
            }
        };
        this.effect(runner);
        function getter() {
            if (system.activeEffect) {
                system.track(getter, "value");
            }
            return value;
        }
        return getter;
    }
    effect(fn, options) {
        const system = this;
        let setup = false;
        const effectFn = () => {
            // 保存原 effect，总而允许多层嵌套 effect
            const activeEffect = system.activeEffect;
            try {
                system.activeEffect = effectFn;
                if (setup) {
                    options?.scheduler ? options.scheduler() : fn();
                }
                else {
                    setup = true;
                    fn();
                }
            }
            finally {
                system.activeEffect = activeEffect;
            }
        };
        effectFn();
        return effectFn;
    }
    watch(source, cb) {
        let setup = false;
        let oldValue;
        this.effect(() => {
            if (!setup) {
                oldValue = source();
                setup = true;
            }
            else {
                const newValue = source();
                if (newValue !== oldValue) {
                    // 浅层比较，未来可能需要深层
                    cb(newValue, oldValue);
                    oldValue = newValue;
                }
            }
        });
    }
    computed(getter) {
        let system = this;
        let value;
        let dirty = true;
        let setup = false;
        let beDepended = false;
        return {
            get value() {
                if (!setup) {
                    system.effect(() => {
                        if (!setup) {
                            value = getter();
                            dirty = false;
                            setup = true;
                        }
                        else {
                            if (beDepended) {
                                value = getter();
                                system.trigger(this, "value");
                            }
                            else {
                                dirty = true;
                            }
                        }
                    });
                }
                if (dirty) {
                    value = getter();
                    dirty = false;
                }
                if (system.activeEffect) {
                    system.track(this, "value");
                    beDepended = true;
                }
                return value;
            },
        };
    }
    // simple and high performance
    merge(obj1, obj2) {
        return new Proxy({}, {
            has(_, key) {
                return key in obj1 || key in obj2 || key in _;
            },
            get(_, key) {
                return key in obj1
                    ? obj1[key]
                    : key in obj2
                        ? obj2[key]
                        : _[key];
            },
            set(_, key, value) {
                if (key in obj1) {
                    obj1[key] = value;
                }
                else if (key in obj2) {
                    obj2[key] = value;
                }
                else {
                    _[key] = value;
                    console.log(`[ZeppReactive] setting an undefined field directly to a reactive object may cause reactivity lose. key: ${String(key)}.`);
                }
                return true;
            },
            ownKeys(_) {
                return Reflect.ownKeys(obj1).concat(Reflect.ownKeys(obj2), Reflect.ownKeys(_));
            },
        });
    }
    // solid js compatible
    mergeProps(...sources) {
        const system = this;
        // 如果传入的是函数（accessor），用 memo 包装成响应式 getter
        const normalized = sources.map((s) => {
            if (typeof s === "function") {
                return system.memo(s);
            }
            return s;
        });
        return new Proxy({}, {
            get(_, key) {
                // 从最后一个对象开始查找，后面的覆盖前面的
                for (let i = normalized.length - 1; i >= 0; i--) {
                    const source = normalized[i];
                    if (source && key in source) {
                        const value = source[key];
                        // 如果是 accessor（函数），调用它
                        return typeof value === "function" ? value() : value;
                    }
                }
                return undefined;
            },
            set(_, key, value) {
                // 写回到最后一个拥有该属性的对象
                for (let i = normalized.length - 1; i >= 0; i--) {
                    const source = normalized[i];
                    if (source && key in source) {
                        source[key] = value;
                        return true;
                    }
                }
                // 如果所有源对象都没有这个 key，就直接写到代理对象上
                _[key] = value;
                return true;
            },
            has(_, key) {
                return normalized.some((s) => s && key in s) || key in _;
            },
            ownKeys(_) {
                const keys = [];
                for (let i = 0; i < normalized.length; i++) {
                    keys.push(...Reflect.ownKeys(normalized[i]));
                }
                return [...new Set(keys.concat(Reflect.ownKeys(_)))];
            }
        });
    }
}
const zeppReactive = new ZeppReactive();
export const reactive = zeppReactive.reactive.bind(zeppReactive);
export const effect = zeppReactive.effect.bind(zeppReactive);
export const computed = zeppReactive.computed.bind(zeppReactive);
export const merge = zeppReactive.merge.bind(zeppReactive);
export const watch = zeppReactive.watch.bind(zeppReactive);
export const memo = zeppReactive.memo.bind(zeppReactive);
export const mergeProps = zeppReactive.mergeProps.bind(zeppReactive);
export { ZeppReactive };
