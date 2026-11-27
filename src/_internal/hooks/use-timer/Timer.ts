export class Timer {
  private readonly callback: () => void;
  private readonly delay: number;

  private remaining: number;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private startTime: number | null = null;

  private _status: 'stopped' | 'paused' | 'running' = 'stopped';

  get status() {
    return this._status;
  }

  private set status(status) {
    this._status = status;
  }

  constructor(callback: () => unknown, delay: number) {
    this.callback = callback;
    this.delay = delay;
    this.remaining = delay;

    this.resume();
  }

  reset() {
    this.clear();
    this.remaining = this.delay;
    this.status = 'stopped';
  }

  pause() {
    if (this.timerId === null || this.startTime === null) {
      return;
    }

    this.clear();
    this.remaining -= Date.now() - this.startTime;
    this.status = 'paused';
  }

  resume() {
    if (this.timerId !== null) return;

    this.startTime = Date.now();
    this.clear();

    this.timerId = setTimeout(() => {
      this.reset();
      this.callback();
    }, this.remaining);

    this.status = 'running';
  }

  private clear() {
    if (this.timerId === null) {
      return;
    }

    clearTimeout(this.timerId);
    this.timerId = null;
  }
}
