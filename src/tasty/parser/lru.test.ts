import { Lru } from './lru';

describe('Lru', () => {
  it('should call onEvict callback when items are evicted', () => {
    const evictedItems: Array<{ key: string; value: string }> = [];
    const onEvict = (key: string, value: string) => {
      evictedItems.push({ key, value });
    };

    const lru = new Lru<string, string>(2, onEvict);

    // Fill cache
    lru.set('a', 'value-a');
    lru.set('b', 'value-b');

    // No evictions yet
    expect(evictedItems).toHaveLength(0);

    // This should evict 'a'
    lru.set('c', 'value-c');

    expect(evictedItems).toHaveLength(1);
    expect(evictedItems[0]).toEqual({ key: 'a', value: 'value-a' });

    // This should evict 'b'
    lru.set('d', 'value-d');

    expect(evictedItems).toHaveLength(2);
    expect(evictedItems[1]).toEqual({ key: 'b', value: 'value-b' });
  });

  it('should allow setting onEvict callback after construction', () => {
    const evictedItems: Array<{ key: string; value: string }> = [];
    const lru = new Lru<string, string>(2);

    // Set callback later
    lru.setOnEvict((key, value) => {
      evictedItems.push({ key, value });
    });

    lru.set('a', 'value-a');
    lru.set('b', 'value-b');
    lru.set('c', 'value-c'); // Should evict 'a'

    expect(evictedItems).toHaveLength(1);
    expect(evictedItems[0]).toEqual({ key: 'a', value: 'value-a' });
  });

  it('should return all keys via keys() method', () => {
    const lru = new Lru<string, string>(3);

    lru.set('first', 'value1');
    lru.set('second', 'value2');
    lru.set('third', 'value3');

    const keys = Array.from(lru.keys());
    expect(keys).toHaveLength(3);
    expect(keys).toContain('first');
    expect(keys).toContain('second');
    expect(keys).toContain('third');
  });

  it('should handle eviction callback errors gracefully', () => {
    const errorCallback = () => {
      throw new Error('Eviction error');
    };

    const lru = new Lru<string, string>(1, errorCallback);

    // This should not throw despite the callback error
    expect(() => {
      lru.set('a', 'value-a');
      lru.set('b', 'value-b'); // Should evict 'a' and call errorCallback
    }).not.toThrow();
  });

  it('should work without onEvict callback', () => {
    const lru = new Lru<string, string>(2);

    expect(() => {
      lru.set('a', 'value-a');
      lru.set('b', 'value-b');
      lru.set('c', 'value-c'); // Should evict 'a' without error
    }).not.toThrow();

    expect(lru.get('a')).toBeUndefined();
    expect(lru.get('b')).toBe('value-b');
    expect(lru.get('c')).toBe('value-c');
  });
});
