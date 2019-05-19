import * as _ from "./impl";

export const NONE = _.NONE;
const COMPILED = Symbol("COMPILED");
const NAVIGATOR = Symbol("NAVIGATOR");

const navigator = m => {
  const fn = next => operation => m[operation](next(operation));
  fn[NAVIGATOR] = true;
  return fn;
};

const resolveNavigator = nav => {
  const type = typeof nav;
  if (type === "function" && nav[NAVIGATOR]) {
    return nav;
  }

  switch (type) {
    case "string":
      return key(nav);
    case "number":
      return nth(nav);
    case "function":
      return pred(nav);
  }
};

export const compile = path => {
  let defer;

  const compiled = _.reduceRight(
    (acc, nav) => resolveNavigator(nav)(acc),
    op => v => defer(v),
    Array.isArray(path) ? path : [path]
  );

  return (operation, lastFn, struct) => {
    defer = lastFn;
    return compiled(operation)(struct);
  };
};

/**
 * Navigate to every element in an array or key/value pair in an object.
 * Can transform to `NONE` to remove elements.
 */
export const ALL = navigator({
  select: next => struct =>
    _.flatMap(next, _.isObject(struct) ? _.entries(struct) : struct),
  transform: next => struct =>
    _.isObject(struct) ? _.mapEntries(next, struct) : _.map(next, struct)
});

/**
 * Navigate to every value in an object.
 * Can transform to `NONE` to remove entries.
 */
export const MAP_VALS = navigator({
  select: next => struct => _.flatMap(next, _.values(struct)),
  transform: next => struct => _.mapValues(next, struct)
});

/**
 * Navigate to every key in an object.
 * Can transform to `NONE` to remove entries.
 */
export const MAP_KEYS = navigator({
  select: next => struct => _.flatMap(next, _.keys(struct)),
  transform: next => struct => _.mapKeys(next, struct)
});

/**
 * Navigate to the first element in an array.
 * Stops navigation if the array is empty.
 * Can transform to `NONE` to remove the element.
 */
export const FIRST = navigator({
  select: next => struct => (_.isEmpty(struct) ? [] : next(struct[0])),
  transform: next => struct =>
    _.isEmpty(struct) ? struct : _.updateArray(0, next, struct)
});

/**
 * Navigate to the lasy element in an array.
 * Stops navigation if the array is empty.
 * Can transform to `NONE` to remove the element.
 */
export const LAST = navigator({
  select: next => struct =>
    _.isEmpty(struct) ? [] : next(struct[struct.length - 1]),
  transform: next => struct =>
    _.isEmpty(struct) ? struct : _.updateArray(struct.length - 1, next, struct)
});

/**
 * Navigates to the empty array before the beginning of an array.
 * Can be used to add elements to the front of an array.
 */
export const BEGINNING = navigator({
  select: next => struct => [],
  transform: next => struct => {
    const result = next([]);
    return _.isArray(result)
      ? _.concat(result, struct)
      : _.cons(result, struct);
  }
});

/**
 * Navigates to the empty array after the end of an array.
 * Can be used to add elements to the back of an array.
 */
export const END = navigator({
  select: next => struct => [],
  transform: next => struct => {
    const result = next([]);
    return _.isArray(result)
      ? _.concat(struct, result)
      : _.conj(struct, result);
  }
});

/**
 * Navigates to the void element before the beginning of an array.
 * Can be used to add an element to the front of an array.
 */
export const BEFORE_ELEM = navigator({
  select: next => struct => NONE,
  transform: next => struct => {
    const result = next(NONE);
    return result === NONE ? struct : _.cons(result, struct);
  }
});

/**
 * Navigates to the void element after the end of an array.
 * Can be used to add an element to the back of an array.
 */
export const AFTER_ELEM = navigator({
  select: next => struct => NONE,
  transform: next => struct => {
    const result = next(NONE);
    return result === NONE ? struct : _.conj(struct, result);
  }
});

/**
 * Navigates to the value of specified key in an object.
 * Can transform to NONE to remove the entry.
 */
export const key = key =>
  navigator({
    select: next => struct => next(struct[key]),
    transform: next => struct => {
      const result = next(struct[key]);
      return result === NONE ? _.omit(key, struct) : _.set(key, result, struct);
    }
  });

/**
 * Navigate to the element of specified index in an array.
 * Can transform to NONE to remove the element.
 */
export const nth = index =>
  navigator({
    select: next => struct => next(struct[index]),
    transform: next => struct => _.updateArray(index, next, struct)
  });

/**
 * Evaluate predicate function with the navigation.
 * Navigation stop when the predicate return false.
 */
export const pred = pred =>
  navigator({
    select: next => struct => (pred(struct) ? next(struct) : []),
    transform: next => struct => (pred(struct) ? next(struct) : struct)
  });

/**
 * Navigate to the void element before a specified index in an array.
 * Can be used to insert elements in an array at arbitrary positions.
 */
export const beforeIndex = index =>
  navigator({
    select: next => struct => next(NONE),
    transform: next => struct => {
      const result = next(NONE);
      return result === NONE ? struct : _.insertArray(index, result, struct);
    }
  });

export const parser = (parse, unparse) =>
  navigator({
    select: next => struct => next(parse(struct)),
    transform: next => struct => unparse(next(parse(struct)))
  });

export const submap = keys =>
  navigator({
    select: next => struct => next(_.pick(keys, struct)),
    transform: next => struct => _.merge(struct, next(_.pick(keys, struct)))
  });

export const view = fn =>
  navigator({
    select: next => struct => next(fn(struct)),
    transform: next => struct => next(fn(struct))
  });

export const filterer = path => {
  const compiledPath = compile(path);
  return navigator({
    select: next => struct =>
      next(
        _.reduce(
          (acc, v) => {
            const result = compiledSelect(compiledPath, v);
            return result.length ? _.conj(acc, v) : acc;
          },
          [],
          struct
        )
      ),
    transform: next => struct => {
      const mapping = {};
      const filtered = [];
      for (let [i, j] = [0, 0]; i < struct.length; i++) {
        const selected = compiledSelect(compiledPath, struct[i]);
        if (selected.length) {
          mapping[i] = j;
          j++;
          filtered.push(...selected);
        }
      }

      const transformed = next(filtered);
      const result = [];
      for (let i = 0; i < struct.length; i++) {
        const mappedIdx = mapping[i];

        if (mappedIdx !== undefined) {
          if (transformed[mappedIdx] !== undefined) {
            result.push(transformed[mappedIdx]);
          }
        } else {
          result.push(struct[i]);
        }
      }

      return result;
    }
  });
};

export const select = (path, struct) =>
  compile(path)("select", v => [v], struct);

export const compiledSelect = (compiledPath, struct) =>
  compiledPath("select", v => [v], struct);

export const selectOne = (path, struct) =>
  compile(path)("select", v => v, struct);

export const compiledSelectOne = (compiledPath, struct) =>
  compiledPath("select", v => v, struct);

export const transform = (path, update, struct) =>
  compile(path)("transform", update, struct);

export const compiledTransform = (compiledPath, update, struct) =>
  compiledPath("transform", update, struct);

export const setval = (path, value, struct) =>
  compile(path)("transform", () => value, struct);

export const compiledSetval = (compiledPath, value, struct) =>
  compiledPath("transform", () => value, struct);
