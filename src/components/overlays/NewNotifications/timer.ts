export class Timer {
  private readonly callback: () => void;
  private readonly delay: number;

  private remaining: number;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private startTime: number | null = null;

  constructor(callback: () => void, delay: number) {
    this.callback = callback;
    this.delay = delay;
    this.remaining = delay;

    this.resume();
  }

  reset = () => {
    this.clear();
    this.remaining = this.delay;
  };

  pause = () => {
    if (this.timerId === null || this.startTime === null) {
      return;
    }

    this.clear();
    this.remaining -= Date.now() - this.startTime;
  };

  resume = () => {
    this.startTime = Date.now();
    this.clear();
    this.timerId = setTimeout(this.callback, this.remaining);
  };

  private clear() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
