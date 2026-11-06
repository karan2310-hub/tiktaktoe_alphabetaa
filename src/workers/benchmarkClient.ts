import { BenchmarkResult, Board, Player } from '../algorithm/types';
import { runFullBenchmark } from '../algorithm/benchmark';
import {
  BenchmarkWorkerMessage,
  BenchmarkWorkerRequest,
} from './benchmark.worker';

export function runBenchmarkAsync(
  board: Board,
  aiPlayer: Player,
  onProgress: (stage: string, nodes: number) => void
): Promise<BenchmarkResult> {
  return new Promise((resolve, reject) => {
    // Check Web Worker support
    if (typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(
          new URL('./benchmark.worker.ts', import.meta.url),
          { type: 'module' }
        );

        worker.onmessage = (event: MessageEvent<BenchmarkWorkerMessage>) => {
          const msg = event.data;
          if (msg.type === 'PROGRESS') {
            onProgress(msg.stage, msg.nodes);
          } else if (msg.type === 'RESULT') {
            worker.terminate();
            resolve(msg.result);
          } else if (msg.type === 'ERROR') {
            worker.terminate();
            reject(new Error(msg.error));
          }
        };

        worker.onerror = (err) => {
          worker.terminate();
          reject(err);
        };

        const request: BenchmarkWorkerRequest = { board, aiPlayer };
        worker.postMessage(request);
        return;
      } catch (err) {
        console.warn('Worker initialization failed, falling back to main thread async execution', err);
      }
    }

    // Fallback: asynchronous execution in microtasks
    setTimeout(() => {
      try {
        const res = runFullBenchmark(board, aiPlayer, onProgress);
        resolve(res);
      } catch (e) {
        reject(e);
      }
    }, 20);
  });
}

