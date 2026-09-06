export type WorkerInMessage<TReq = unknown> = {
  type: 'START_JOB';
  payload: TReq;
};

export type WorkerOutMessage<TRes = unknown> =
  | { type: 'PROGRESS'; payload: number }
  | { type: 'COMPLETE'; payload: TRes }
  | { type: 'ERROR'; payload: string };

export type WorkerMessage<TReq = unknown, TRes = unknown> =
  | WorkerInMessage<TReq>
  | WorkerOutMessage<TRes>;

export interface WorkerJobOptions<TReq, TRes> {
  workerFactory: () => Worker;
  payload: TReq;
  onProgress?: (progress: number) => void;
  onComplete?: (result: TRes) => void;
  onError?: (error: string) => void;
}

/**
 * A generic dispatcher for Web Workers.
 * It enforces a strict message passing protocol (START_JOB, PROGRESS, COMPLETE, ERROR).
 * It creates a new worker instance per job, runs the job, and terminates the worker immediately after completion or error.
 */
export function dispatchWorkerJob<TReq, TRes>({
  workerFactory,
  payload,
  onProgress,
  onComplete,
  onError,
}: WorkerJobOptions<TReq, TRes>): () => void {
  const worker = workerFactory();
  let isCancelled = false;

  worker.onmessage = (event: MessageEvent<WorkerOutMessage<TRes>>) => {
    if (isCancelled) return;

    const message = event.data;

    switch (message.type) {
      case 'PROGRESS':
        onProgress?.(message.payload);
        break;
      case 'COMPLETE':
        onComplete?.(message.payload);
        worker.terminate();
        break;
      case 'ERROR':
        onError?.(message.payload);
        worker.terminate();
        break;
    }
  };

  worker.onerror = (error) => {
    if (isCancelled) return;
    onError?.(`Worker encountered a fatal error: ${error.message}`);
    worker.terminate();
  };

  // Start the job
  worker.postMessage({ type: 'START_JOB', payload } satisfies WorkerInMessage<TReq>);

  // Return a cancellation function
  return () => {
    isCancelled = true;
    worker.terminate();
  };
}
