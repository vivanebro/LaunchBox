const noop = () => {};
const asyncNoop = () => Promise.resolve(null);

const handler = {
  get: (_t, prop) => {
    if (prop === 'then') return undefined;
    if (prop === Symbol.toPrimitive) return () => '';
    return new Proxy(asyncNoop, handler);
  },
  apply: () => Promise.resolve(null),
};

export const base44 = new Proxy(noop, handler);
