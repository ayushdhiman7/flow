import { useCallback, useRef } from 'react';

interface OptimisticOptions<T, R> {
  onMutate: (variables: T) => Promise<R> | R;
  onError?: (error: Error, variables: T, context: R) => void;
  onSuccess?: (data: any, variables: T, context: R) => void;
  onSettled?: (data: any, error: Error | null, variables: T, context: R) => void;
}

export function useOptimistic<T, R>() {
  const contextRef = useRef<R | null>(null);

  const mutate = useCallback(
    async (variables: T, options: OptimisticOptions<T, R>) => {
      let context: R | undefined;
      let caughtError: Error | null = null;
      try {
        context = await options.onMutate(variables);
        contextRef.current = context;
        const data = await options.onSuccess?.(undefined, variables, context);
        return data;
      } catch (e) {
        caughtError = e as Error;
        options.onError?.(caughtError, variables, context!);
        throw caughtError;
      } finally {
        options.onSettled?.(undefined, caughtError, variables, context!);
      }
    },
    []
  );

  return { mutate };
}