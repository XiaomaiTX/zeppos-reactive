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

  public effect(fn: () => void, options?: { scheduler?: () => void }): () => void {
    const system = this;
    const effectFn = () => {
      // 保存原 effect，总而允许多层嵌套 effect
      const activeEffect = system.activeEffect;
      try {
        system.activeEffect = effectFn;
        return fn();
      } finally {
        system.activeEffect = activeEffect;
      }
    };

    effectFn();

    return effectFn;
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
}

const zeppReactive = new ZeppReactive();

export const reactive = zeppReactive.reactive.bind(zeppReactive);
export const effect = zeppReactive.effect.bind(zeppReactive);
export const computed = zeppReactive.computed.bind(zeppReactive);

export { ZeppReactive };
