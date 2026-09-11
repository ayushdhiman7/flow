import { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '../../utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={classNames('bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700', className)} {...props}>
      {children}
    </div>
  );
}
