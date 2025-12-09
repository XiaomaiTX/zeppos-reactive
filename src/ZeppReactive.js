class ZeppReactive {
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
    if (!depsMap) return;
    
    const deps = depsMap.get(key);
    if (deps) {
      deps.forEach(effect => {
        effect();
      });
    }
  }

  reactive(target) {
    if (typeof target !== 'object' || target === null) {
      return target;
    }
    
    if (target.__isReactive) {
      return target;
    }
    
    const system = this;
    const proxy = new Proxy(target, {
      get(obj, key, receiver) {
        if (key !== '__isReactive') {
          system.track(obj, key);
        }
        
        const result = Reflect.get(obj, key, receiver);
        
        if (result && typeof result === 'object') {
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
      }
    });
    
    proxy.__isReactive = true;
    return proxy;
  }

  effect(fn) {
    const system = this;
    const effectFn = () => {
      try {
        system.activeEffect = effectFn;
        return fn();
      } finally {
        system.activeEffect = null;
      }
    };
    
    effectFn();
    
    return effectFn;
  }

computed(getter) {
  const system = this;
  let value;
  let dirty = true;
  
  const effectFn = system.effect(() => {
    dirty = true;
    system.trigger(this, 'value');
  }, { 
    lazy: true,
    scheduler: () => {
      dirty = true;
      system.trigger(this, 'value');
    }
  });
  
  return {
    get value() {
      if (dirty) {
        system.activeEffect = effectFn;
        value = getter();
        system.activeEffect = null;
        dirty = false;
      }
      system.track(this, 'value');
      return value;
    }
  };
}}

const zeppReactive = new ZeppReactive();

export const reactive = zeppReactive.reactive.bind(zeppReactive);
export const effect = zeppReactive.effect.bind(zeppReactive);
export const computed = zeppReactive.computed.bind(zeppReactive);

export { ZeppReactive };