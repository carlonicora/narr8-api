import { Injectable } from "@nestjs/common";

@Injectable()
export class PoolService {
  async asyncPool<T, R>(concurrency: number, items: T[], handler: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
      const task = handler(item).then((result) => {
        results.push(result);
      });

      executing.push(task);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex((t) => t === task),
          1,
        );
      }
    }

    await Promise.all(executing);
    return results;
  }
}
