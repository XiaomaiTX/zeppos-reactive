class ZeppReactive {
  private activeEffect: (() => void) | null;
  private targetMap: WeakMap<object, Map<string, Set<() => void>>>;

  constructor() {
    this.activeEffect = null;
    this.targetMap = new WeakMap<
      NonNullable<object>,
      Map<string, Set<() => void>>
    >();
  }

  public track<T extends NonNullable<object>>(target: T, key: string): void {
    if (this.activeEffect) {
      let depsMap = this.targetMap.get(target);
      if (!depsMap) {
        depsMap = new Map<string, Set<() => void>>();
        this.targetMap.set(target, depsMap);
      }

      let deps = depsMap.get(key);
      if (!deps) {
        deps = new Set<() => void>();
        depsMap.set(key, deps);
      }

      deps.add(this.activeEffect);
    }
  }

  public trigger<T extends NonNullable<object>>(target: T, key: string): void {
    const depsMap = this.targetMap.get(target);
    if (!depsMap) return;

    const deps = depsMap.get(key);
    if (deps) {
      deps.forEach((effect) => {
        effect();
      });
    }
  }

  public reactive<T extends NonNullable<object>>(target: T): T {
    if (typeof target !== "object" || target === null) {
      return target;
    }

    if ((target as any).__isReactive) {
      return target;
    }

    const system = this;
    const proxy = new Proxy(target, {
      get(
        obj: T,
        key: string,
        receiver: any
      ): string extends keyof T ? T[keyof T & string] : any {
        if (key !== "__isReactive") {
          system.track(obj, key);
        }

        const result = Reflect.get(obj, key, receiver);

        if (result && typeof result === "object") {
          return system.reactive(result as object & T) as string extends keyof T
            ? T[keyof T & string]
            : any;
        }

        return result as string extends keyof T ? T[keyof T & string] : any;
      },

      set(
        obj: T,
        key: string | number | symbol,
        value: any,
        receiver: any
      ): boolean {
        const oldValue = obj[key as keyof T];
        const result = Reflect.set(obj, key, value, receiver);

        if (!Object.is(oldValue, value)) {
          system.trigger(obj, key as string);
        }

        return result;
      },
    });

    (proxy as any).__isReactive = true;
    return proxy;
  }

  public memo<T>(
    fn: () => T,
    options?: { equals?: (a: T, b: T) => boolean }
  ): () => T {
    const system = this;
    let value: T;
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

  public effect(
    fn: () => void,
    options?: { scheduler?: () => void }
  ): () => void {
    const system = this;
    let setup = false;
    const effectFn = () => {
      // 保存原 effect，总而允许多层嵌套 effect
      const activeEffect = system.activeEffect;
      try {
        system.activeEffect = effectFn;
        if (setup) {
          options?.scheduler ? options.scheduler() : fn();
        } else {
          setup = true;
          fn();
        }
      } finally {
        system.activeEffect = activeEffect;
      }
    };

    effectFn();

    return effectFn;
  }

  public watch<T>(
    source: () => T,
    cb: (newValue: T, oldValue: T | undefined) => void
  ) {
    let setup = false;
    let oldValue: T | undefined;
    this.effect(() => {
      if (!setup) {
        oldValue = source();
        setup = true;
      } else {
        const newValue = source();
        if (newValue !== oldValue) {
          // 浅层比较，未来可能需要深层
          cb(newValue, oldValue);
          oldValue = newValue;
        }
      }
    });
  }

  public computed<T>(getter: () => T): { get value(): T } {
    let system = this;
    let value: T;
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
            } else {
              if (beDepended) {
                value = getter();
                system.trigger(this, "value");
              } else {
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
  public merge<T1 extends object, T2 extends object>(
    obj1: T1,
    obj2: T2
  ): T1 & T2 {
    return new Proxy({} as Record<string | symbol, any>, {
      has(_, key) {
        return key in obj1 || key in obj2 || key in _;
      },
      get(_, key) {
        return key in obj1
          ? obj1[key as keyof T1]
          : key in obj2
          ? obj2[key as keyof T2]
          : _[key];
      },
      set(_, key, value) {
        if (key in obj1) {
          obj1[key as keyof T1] = value;
        } else if (key in obj2) {
          obj2[key as keyof T2] = value;
        } else {
          _[key] = value;
          console.log(
            `[ZeppReactive] setting an undefined field directly to a reactive object may cause reactivity lose. key: ${String(
              key
            )}.`
          );
        }
        return true;
      },
      ownKeys(_) {
        return Reflect.ownKeys(obj1).concat(
          Reflect.ownKeys(obj2),
          Reflect.ownKeys(_)
        );
      },
    }) as T1 & T2;
  }

  // solid js compatible
  public mergeProps<T extends object[]>(...sources: T): T[number] {
  const system = this;

  // 如果传入的是函数（accessor），用 memo 包装成响应式 getter
  const normalized = sources.map((s) => {
    if (typeof s === "function") {
      return system.memo(s as () => any);
    }
    return s;
  });

  return new Proxy({} as Record<string | symbol, any>, {
    get(_, key) {
      // 从最后一个对象开始查找，后面的覆盖前面的
      for (let i = normalized.length - 1; i >= 0; i--) {
        const source = normalized[i];
        if (source && key in source) {
          const value = (source as any)[key];
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
          (source as any)[key] = value;
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
      const keys: (string | symbol)[] = [];
      for (let i = 0; i < normalized.length; i++) {
        keys.push(...Reflect.ownKeys(normalized[i]));
      }
      return [...new Set(keys.concat(Reflect.ownKeys(_)))];
    }
  }) as T[number];
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
