import { Board, Player } from '../algorithm/types';
import { runFullBenchmark } from '../algorithm/benchmark';

export interface BenchmarkWorkerRequest {
  board: Board;
  aiPlayer: Player;
}

export interface BenchmarkWorkerProgressMessage {
  type: 'PROGRESS';
  stage: string;
  nodes: number;
}

export interface BenchmarkWorkerResultMessage {
  type: 'RESULT';
  result: ReturnType<typeof runFullBenchmark>;
}

export interface BenchmarkWorkerErrorMessage {
  type: 'ERROR';
  error: string;
}

export type BenchmarkWorkerMessage =
  | BenchmarkWorkerProgressMessage
  | BenchmarkWorkerResultMessage
  | BenchmarkWorkerErrorMessage;

self.onmessage = (event: MessageEvent<BenchmarkWorkerRequest>) => {
  try {
    const { board, aiPlayer } = event.data;

    const result = runFullBenchmark(board, aiPlayer, (stage, nodes) => {
      const progressMsg: BenchmarkWorkerProgressMessage = {
        type: 'PROGRESS',
        stage,
        nodes,
      };
      self.postMessage(progressMsg);
    });

    const resultMsg: BenchmarkWorkerResultMessage = {
      type: 'RESULT',
      result,
    };
    self.postMessage(resultMsg);
  } catch (err: unknown) {
    const errorMsg: BenchmarkWorkerErrorMessage = {
      type: 'ERROR',
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(errorMsg);
  }
};

