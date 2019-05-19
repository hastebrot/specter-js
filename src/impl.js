export const NONE = Symbol("NONE");

export const map = (fn, struct) => {
  const acc = [];
  for (let i = 0; i < struct.length; i++) {
    const result = fn(struct[i]);
    if (result !== NONE) {
      acc.push(result);
    }
  }
  return acc;
};

export const flatMap = (fn, struct) => {
  const acc = [];
  for (let i = 0; i < struct.length; i++) {
    const result = fn(struct[i]);
    if (result === NONE) {
      continue;
    } else if (Array.isArray(result)) {
      acc.push(...result);
    } else {
      acc.push(result);
    }
  }
  return acc;
};

export const concat = (a, b) => a.concat(b);

export const reduceRight = (fn, initial, struct) => {
  let acc = initial;
  for (let i = struct.length - 1; i >= 0; i--) {
    acc = fn(acc, struct[i]);
  }
  return acc;
};

export const reduce = (fn, initial, struct) => {
  let acc = initial;
  for (let i = 0; i < struct.length; i++) {
    acc = fn(acc, struct[i]);
  }
  return acc;
};

export const cons = (a, b) => [a].concat(b);

export const conj = (a, b) => {
  const r = a.slice();
  r.push(b);
  return r;
};

export const insertArray = (idx, value, struct) => {
  const r = struct.slice(0, idx);
  r.push(value, ...struct.slice(idx));
  return r;
};

export const updateArray = (idx, fn, struct) => {
  const result = fn(struct[idx]);
  if (result === NONE) {
    const r = struct.slice(0, idx);
    r.push(...struct.slice(idx + 1));
    return r;
  } else {
    const r = struct.slice(0, idx);
    r.push(result, ...struct.slice(idx + 1));
    return r;
  }
};

export const isArray = Array.isArray;

export const isEmpty = struct => !struct || struct.length === 0;

export const omit = (keys, struct) => {
  const acc = {};
  const Objkeys = Object.keys(struct);
  for (let i = 0; i < Objkeys.length; i++) {
    const key = Objkeys[i];
    if (!keys.includes(key)) {
      acc[key] = struct[key];
    }
  }
  return acc;
};

export const pick = (keys, struct) => {
  const acc = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    acc[key] = struct[key];
  }
  return acc;
};

export const merge = (a, b) => {
  const acc = {};
  const keysA = Object.keys(a);
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    const value = a[key];
    acc[key] = value;
  }
  const keysB = Object.keys(b);
  for (let i = 0; i < keysB.length; i++) {
    const key = keysB[i];
    const value = b[key];
    acc[key] = value;
  }
  return acc;
};

export const mapValues = (fn, struct) => {
  const acc = {};
  const keys = Object.keys(struct);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const v = struct[k];
    const result = fn(v);
    if (result !== NONE) {
      acc[k] = result;
    }
  }
  return acc;
};

export const mapKeys = (fn, struct) => {
  const acc = {};
  const keys = Object.keys(struct);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const v = struct[k];
    const result = fn(k);
    if (result !== NONE) {
      acc[result] = v;
    }
  }
  return acc;
};

export const mapEntries = (fn, struct) => {
  const acc = {};
  const keys = Object.keys(struct);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const v = struct[k];
    const result = fn([k, v]);
    if (result !== NONE) {
      acc[result[0]] = result[1];
    }
  }
  return acc;
};

export const set = (key, value, struct) => merge(struct, { [key]: value });

export const keys = Object.keys;

export const values = obj => {
  const acc = [];
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    acc.push(obj[keys[i]]);
  }
  return acc;
};

export const entries = obj => {
  const acc = [];
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    acc.push([key, obj[key]]);
  }
  return acc;
};

export const isObject = struct =>
  typeof struct === "object" &&
  struct !== null &&
  struct.constructor === Object;
