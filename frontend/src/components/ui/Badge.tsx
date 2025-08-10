import { HTMLAttributes } from 'react';
import { cn, getStatusBadgeColor } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'status';
  status?: string;
}

export function Badge({
  className,
  variant = 'default',
  status,
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

  let variantStyles = '';

  if (variant === 'status' && status) {
    variantStyles = getStatusBadgeColor(status);
  } else {
    variantStyles = 'bg-gray-100 text-gray-800';
  }

  return (
    <span className={cn(baseStyles, variantStyles, className)} {...props}>
      {children || status}
    </span>
  );
}
