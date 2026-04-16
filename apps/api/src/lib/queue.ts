export class TaskQueue {
  private readonly queue: Array<() => Promise<void>> = [];
  private running = 0;

  constructor(private readonly concurrency: number) {}

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await task());
        } catch (error) {
          reject(error);
        }
      });
      this.runNext();
    });
  }

  private runNext(): void {
    if (this.running >= this.concurrency) return;
    const task = this.queue.shift();
    if (!task) return;

    this.running += 1;
    task()
      .catch(() => undefined)
      .finally(() => {
        this.running -= 1;
        this.runNext();
      });
  }
}
