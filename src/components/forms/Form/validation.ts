import validUrl from 'valid-url';
import { validate as validateEmail } from 'email-validator';

const TYPE_CHECKERS = {
  string(v) {
    return typeof v === 'string';
  },
  number(v) {
    return typeof v === 'number';
  },
  boolean(v) {
    return typeof v === 'boolean';
  },
  method(v) {
    return typeof v === 'function';
  },
  regexp(v) {
    return v instanceof RegExp;
  },
  integer(v) {
    return typeof v === 'number' && v === parseInt(String(v), 10);
  },
  array(v) {
    return Array.isArray(v);
  },
  object(v) {
    return typeof v === 'object' && !Array.isArray(v);
  },
  date(v) {
    return v instanceof Date;
  },
  url(v) {
    return typeof v === 'string' && validUrl.isUri(v);
  },
  hex(v) {
    return typeof v === 'string' && v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  },
  email(v) {
    return validateEmail(v);
  },
  any(v) {
    return true;
  },
};

const TYPE_LIST = Object.keys(TYPE_CHECKERS);

const VALIDATORS = {
  async required(value) {
    if (Array.isArray(value)) {
      return !!value.length ? Promise.resolve() : Promise.reject();
    }

    return !!value || value === 0 ? Promise.resolve() : Promise.reject();
  },
  async whitespace(value) {
    if (typeof value !== 'string' || value.trim()) return Promise.resolve();

    return Promise.reject();
  },
  async pattern(value, rule) {
    const pattern = rule.pattern;

    if (typeof value !== 'string') return Promise.resolve();

    return value.match(pattern) ? Promise.resolve() : Promise.reject();
  },
  async enum(value, rule) {
    const options = rule.enum || [];

    if (!value && value !== 0) return Promise.resolve();

    return options.includes(value) ? Promise.resolve() : Promise.reject();
  },
  async len(value, rule) {
    const len = rule.len;

    if (typeof value === 'number') {
      return value === len ? Promise.resolve() : Promise.reject();
    }

    if (!value || !('length' in value)) return Promise.resolve();

    return value.length === len ? Promise.resolve() : Promise.reject();
  },
  async max(value, rule) {
    const max = rule.max;

    if (typeof value === 'number') {
      return value <= max ? Promise.resolve() : Promise.reject();
    }

    if (!value || (typeof value !== 'string' && !Array.isArray(value)))
      return Promise.resolve();

    return value.length <= max ? Promise.resolve() : Promise.reject();
  },
  async min(value, rule) {
    const min = rule.min;

    if (typeof value === 'number') {
      return value >= min ? Promise.resolve() : Promise.reject();
    }

    if (!value || (typeof value !== 'string' && !Array.isArray(value)))
      return Promise.resolve();

    return value.length >= min ? Promise.resolve() : Promise.reject();
  },
  async validator(value, rule) {
    return rule.validator(rule, value);
  },
  async type(value, rule) {
    const type = rule.type;

    if (!TYPE_LIST.includes(type)) return Promise.resolve();

    return TYPE_CHECKERS[type](value) ? Promise.resolve() : Promise.reject();
  },
};

const VALIDATOR_NAMES = Object.keys(VALIDATORS);

export async function applyRule(value, rule, form) {
  if (typeof rule === 'function') {
    rule = rule(form);
  }

  if (typeof rule.transform === 'function') {
    value = rule.transform(value);
  }

  for (let validatorName of VALIDATOR_NAMES) {
    if (!(validatorName in rule)) continue;

    const checker = VALIDATORS[validatorName];

    await checker(value, rule);
  }
}

export async function applyRules(value, rules, form) {
  if (!rules || !rules.length) return;

  for (let rule of rules) {
    await applyRule(value, rule, form).catch((err) => {
      if (typeof err !== 'string') {
        err = (err?.message || rule.message);
      }

      throw err;
    });
  }
}
