import { createFormStore } from './store';

import type { FormStore, RegistrationToken } from './types';
import type { FormPath } from './values';

const paths: FormPath[] = ['a', 'b.c', 'toString', ['rows', 0, 'count']];

/** Replay the same deterministic workload with and without publication batching. */
describe('mixed modern store command sequences', () => {
  it.each([7, 41, 2026])(
    'keeps the same state across transaction boundaries (seed %i)',
    (seed) => {
      let randomState = seed;
      const random = (max: number) => {
        randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
        return (randomState >>> 8) % max;
      };
      const defaults = (value: number) => ({
        a: value,
        'b.c': 'default',
        rows: [{ count: value }],
      });
      // Conflicting duplicate defaults are intentional in this workload; the
      // pointed diagnostics themselves are asserted in lifecycle.test.ts.
      const serial = createFormStore({
        defaultValues: defaults(0),
        onDevelopmentError: () => {},
      });
      const batched = createFormStore({
        defaultValues: defaults(0),
        onDevelopmentError: () => {},
      });
      const serialTokens = new Map<number, RegistrationToken>();
      const batchedTokens = new Map<number, RegistrationToken>();
      const serialListener = vi.fn();
      const batchedListener = vi.fn();
      serial.subscribe(serialListener);
      batched.subscribe(batchedListener);

      function comparable(store: FormStore) {
        const {
          dirtyFields,
          touchedFields,
          revision: _revision,
          ...snapshot
        } = store.getSnapshot();
        return {
          ...snapshot,
          dirtyFields: [...dirtyFields],
          touchedFields: [...touchedFields],
        };
      }

      for (let group = 0; group < 20; group++) {
        const commands = Array.from({ length: 10 }, (_, index) => ({
          kind: random(8),
          path: paths[random(paths.length)],
          value: random(10),
          id: group * 10 + index,
          release: random(group * 10 + index + 1),
        }));
        function apply(
          store: FormStore,
          tokens: Map<number, RegistrationToken>,
        ) {
          for (const command of commands) {
            switch (command.kind) {
              case 0:
                store.setValue(command.path, command.value, { source: 'user' });
                break;
              case 1:
                store.touch(command.path, command.value % 2 === 0);
                break;
              case 2:
                tokens.set(
                  command.id,
                  store.register(command.path, {
                    preserve: command.value % 2 === 0,
                    defaultValue: command.value,
                  }),
                );
                break;
              case 3:
                tokens.get(command.release)?.release();
                tokens.delete(command.release);
                break;
              case 4:
                store.reset();
                break;
              case 5:
                store.setDefaultValues(defaults(command.value));
                break;
              case 6:
                store.adoptDefaultValues(defaults(command.value), {
                  when: 'always',
                  preserveDirty: true,
                });
                break;
              case 7:
                store.setFieldErrors(
                  command.path,
                  command.value % 2 ? ['error'] : [],
                );
                break;
            }
          }
        }
        apply(serial, serialTokens);
        batched.batch(() => {
          apply(batched, batchedTokens);
        });
        expect(comparable(batched)).toEqual(comparable(serial));
        expect(batched.debug.registrationCount()).toBe(batchedTokens.size);
        expect(serial.debug.registrationCount()).toBe(serialTokens.size);
      }

      expect(batchedListener.mock.calls.length).toBeLessThanOrEqual(20);
      expect(serialListener.mock.calls.length).toBeGreaterThan(
        batchedListener.mock.calls.length,
      );
      for (const token of serialTokens.values()) token.release();
      for (const token of batchedTokens.values()) token.release();
      expect(serial.debug.registrationCount()).toBe(0);
      expect(batched.debug.registrationCount()).toBe(0);
      expect(batched.getActiveValues()).toEqual({});
      serial.dispose();
      batched.dispose();
      expect(serial.debug.listenerCount()).toBe(0);
      expect(batched.debug.listenerCount()).toBe(0);
    },
  );
});
