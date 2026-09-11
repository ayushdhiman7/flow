import { classNames } from '../../utils';
import { getInitials } from '../../utils';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'away' | 'busy' | 'offline';
  className?: string;
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

const statusSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
};

const statusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-slate-400',
};

export function Avatar({ src, name, size = 'md', status, className }: AvatarProps) {
  return (
    <div className={classNames('relative inline-flex', className)}>
      <div className={classNames('rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-medium', sizes[size])}>
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-slate-600 dark:text-slate-300">{getInitials(name)}</span>
        )}
      </div>
      {status && (
        <span
          className={classNames(
            'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-slate-800',
            statusColors[status],
            statusSizes[size]
          )}
        />
      )}
    </div>
  );
}