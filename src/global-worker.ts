import * as Comlink from "comlink";
import type { WorkerApi, Handler, SolverMode } from "./worker";

const INIT_TIMEOUT_MS = 30_000;

type Session = {
  close: (reason: Error, graceful?: boolean) => void;
};

let session: Session | null = null;
export let handler: Comlink.Remote<Handler> | null = null;

// Also invalidate completed/paused trees when an idle worker reports a failure.
const failureListeners = new Set<(error: Error) => void>();
export const onWorkerFailure = (listener: (error: Error) => void) => {
  failureListeners.add(listener);
  return () => { failureListeners.delete(listener); };
};

export const terminate = () => {
  session?.close(new Error("SOLVER_WORKER_REPLACED"), true);
};

export const init = async (numThreads: number, forceSingleThread = false): Promise<SolverMode> => {
  terminate();

  const worker = new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
  });
  const proxy = Comlink.wrap<WorkerApi>(worker);
  const pending = new Set<(reason: Error) => void>();
  let failure: Error | null = null;
  let timer: ReturnType<typeof setTimeout>;

  const guard = <T>(operation: PromiseLike<T>): Promise<T> => new Promise((resolve, reject) => {
    if (failure) {
      // Consume a possibly rejected RPC even if the worker failed just before it.
      Promise.resolve(operation).catch(() => {});
      reject(failure);
      return;
    }
    pending.add(reject);
    Promise.resolve(operation).then(
      (value) => { pending.delete(reject); resolve(value); },
      (error) => { pending.delete(reject); reject(error); }
    );
  });

  const close = (reason: Error, graceful = false) => {
    if (failure) return;
    failure = reason;
    clearTimeout(timer);
    worker.removeEventListener("error", onError);
    worker.removeEventListener("messageerror", onMessageError);
    if (session === current) {
      session = null;
      handler = null;
    }
    pending.forEach((reject) => reject(reason));
    pending.clear();
    if (graceful) {
      // Never await a dead worker's shutdown before creating its replacement.
      const deadline = setTimeout(() => worker.terminate(), 1000);
      Promise.resolve(proxy.beforeTerminate()).catch(() => {}).then(() => {
        clearTimeout(deadline);
        worker.terminate();
      });
    } else {
      worker.terminate();
    }
  };
  const fail = (error: Error) => {
    if (failure) return;
    close(error);
    failureListeners.forEach((listener) => listener(error));
  };
  const onError = (event: ErrorEvent) => {
    event.preventDefault(); // The solver UI records this once, with its retry action.
    fail(new Error(event.message || "SOLVER_WORKER_ERROR"));
  };
  const onMessageError = () => fail(new Error("SOLVER_WORKER_MESSAGE_ERROR"));
  const current: Session = { close };
  session = current;
  worker.addEventListener("error", onError);
  worker.addEventListener("messageerror", onMessageError);
  timer = setTimeout(() => fail(new Error("SOLVER_WORKER_INIT_TIMEOUT")), INIT_TIMEOUT_MS);

  try {
    const remote = await guard(proxy.initHandler(numThreads, forceSingleThread));
    const mode = await guard(remote.mode);
    // The Comlink handler lives on a MessagePort: worker errors alone do not reject
    // its pending calls. Guard every call, without any calculation time limit.
    handler = new Proxy(remote, {
      get(target, key) {
        const value = Reflect.get(target, key);
        if (key === "mode") return guard(value);
        if (typeof key !== "string" || key === "then") return value;
        return (...args: unknown[]) => guard(Promise.resolve().then(() => {
          if (failure) throw failure;
          return Reflect.apply(value, target, args);
        }));
      },
    });
    return mode;
  } catch (error) {
    close(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    clearTimeout(timer);
  }
};
