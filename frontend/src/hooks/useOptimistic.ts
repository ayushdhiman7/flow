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
      try {
        context = await options.onMutate(variables);
        contextRef.current = context;
        const data = await options.onSuccess?.(undefined, variables, context);
        return data;
      } catch (error) {
        options.onError?.(error as Error, variables, context!);
        throw error;
      } finally {
        options.onSettled?.(undefined, error as Error | null, variables, context!);
      }
    },
    []
  );

  return { mutate };
}