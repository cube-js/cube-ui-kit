// @ts-nocheck
// Convert complex js object to dot notation js object
// url: https://github.com/vardars/dotize
// author: vardars

export const dotize = {
  valTypes: {
    none: 'NONE',
    primitive: 'PRIM',
    object: 'OBJECT',
    array: 'ARRAY',
  },

  getValType: function (val) {
    if (!val || typeof val != 'object' || Array.isArray(val))
      return dotize.valTypes.primitive;
    if (typeof val == 'object') return dotize.valTypes.object;
  },

  getPathType: function (arrPath) {
    let arrPathTypes = [];
    for (let path in arrPath) {
      let pathVal = arrPath[path];
      if (!pathVal) arrPathTypes.push(dotize.valTypes.none);
      else if (dotize.isNumber(pathVal))
        arrPathTypes.push(dotize.valTypes.array);
      else arrPathTypes.push(dotize.valTypes.object);
    }
    return arrPathTypes;
  },

  isUndefined: function (obj) {
    return typeof obj == 'undefined';
  },

  isNumber: function (f) {
    return !isNaN(parseInt(f));
  },

  isEmptyObj: function (obj) {
    for (let prop in obj) {
      if (Object.hasOwnProperty.call(obj, prop)) return false;
    }

    return JSON.stringify(obj) === JSON.stringify({});
  },

  isPlainObject: function (obj) {
    if (typeof obj !== 'object' || obj === null) return false;

    return Object.getPrototypeOf(obj) === Object.prototype;
  },

  isNotObject: function (obj) {
    return !obj || !this.isPlainObject(obj);
  },

  isEmptyArray: function (arr) {
    return Array.isArray(arr) && arr.length == 0;
  },

  isNotArray: function (arr) {
    return Array.isArray(arr) == false;
  },

  removeEmptyArrayItem: function (arr) {
    return arr.filter(function (el) {
      return el != null && el != '';
    });
  },

  getFieldName: function (field, prefix, isRoot, isArrayItem, isArray) {
    if (isArray)
      return (
        (prefix ? prefix : '') +
        (dotize.isNumber(field)
          ? '[' + field + ']'
          : (isRoot && !prefix ? '' : '.') + field)
      );
    else if (isArrayItem) return (prefix ? prefix : '') + '[' + field + ']';
    else return (prefix ? prefix + '.' : '') + field;
  },

  startsWith: function (val, valToSearch) {
    return val.indexOf(valToSearch) == 0;
  },

  convert: function (obj, prefix = '') {
    let newObj = {};

    // primitives
    if (dotize.isNotObject(obj)) {
      if (prefix) {
        newObj[prefix] = obj;
        return newObj;
      } else {
        return obj;
      }
    }

    return (function recurse(o, p, isRoot) {
      let isArrayItem = Array.isArray(o);
      for (let f in o) {
        let currentProp = o[f];
        if (
          currentProp &&
          typeof currentProp === 'object' &&
          !Array.isArray(currentProp) &&
          dotize.isPlainObject(currentProp)
        ) {
          if (isArrayItem && dotize.isEmptyObj(currentProp) == false) {
            newObj = recurse(
              currentProp,
              dotize.getFieldName(f, p, isRoot, true),
            ); // array item object
          } else if (dotize.isEmptyObj(currentProp) == false) {
            newObj = recurse(currentProp, dotize.getFieldName(f, p, isRoot)); // object
          } else if (dotize.isEmptyObj(currentProp)) {
            newObj[dotize.getFieldName(f, p, isRoot, isArrayItem)] =
              currentProp;
          }
        } else {
          if (isArrayItem || dotize.isNumber(f)) {
            newObj[dotize.getFieldName(f, p, isRoot, true)] = currentProp; // array item primitive
          } else {
            newObj[dotize.getFieldName(f, p, isRoot)] = currentProp; // primitive
          }
        }
      }

      return newObj;
    })(obj, prefix, true);
  },

  backward: function (obj, prefix) {
    let newObj = {};
    let arStartRegex = /\[(\d+)\]/g;

    // primitives
    if (dotize.isNotObject(obj) && dotize.isNotArray(obj)) {
      if (prefix) {
        return obj[prefix];
      } else {
        return obj;
      }
    }

    for (let tProp in obj) {
      let tPropVal = obj[tProp];

      if (prefix) {
        let prefixRegex = new RegExp('^' + prefix);
        tProp = tProp.replace(prefixRegex, '');
      }

      tProp = tProp.replace(arStartRegex, '.$1');

      if (dotize.startsWith(tProp, '.')) tProp = tProp.replace(/^\./, '');

      var arrPath = tProp.split('.');
      var arrPathTypes = dotize.getPathType(arrPath);

      // has array on root
      if (
        !dotize.isUndefined(arrPathTypes) &&
        arrPathTypes[0] == dotize.valTypes.array &&
        Array.isArray(newObj) == false
      ) {
        newObj = [];
      }

      (function recurse(rPropVal, rObj, rPropValPrev, rObjPrev) {
        let currentPath = arrPath.shift();
        let currentPathType = arrPathTypes.shift();

        if (typeof currentPath == 'undefined' || currentPath == '') {
          newObj = rPropVal;
          return;
        }

        let isArray = currentPathType == dotize.valTypes.array;

        if (dotize.isNumber(currentPath)) currentPath = parseInt(currentPath);

        // has multiple levels
        if (arrPath.length > 0) {
          // is not assigned before
          if (typeof rObj[currentPath] == 'undefined') {
            if (isArray) {
              rObj[currentPath] = [];
            } else {
              rObj[currentPath] = {};
            }
          }

          recurse(rPropVal, rObj[currentPath], currentPath, rObj);
          return;
        }

        if (
          currentPathType == dotize.valTypes.array &&
          rPropValPrev &&
          rObjPrev
        ) {
          if (Array.isArray(rObjPrev[rPropValPrev]) == false)
            rObjPrev[rPropValPrev] = [];
          rObjPrev[rPropValPrev].push(rPropVal);
        } else {
          rObj[currentPath] = rPropVal;
        }
      })(tPropVal, newObj);
    }

    return newObj;
  },
};
