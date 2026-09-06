import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          {
            'bg-indigo-600 text-white shadow hover:bg-indigo-700': variant === 'default',
            'bg-red-500/20 text-red-500 border border-red-500/20 hover:bg-red-500/30': variant === 'destructive',
            'border border-border bg-muted hover:bg-muted/80 text-foreground': variant === 'outline',
            'bg-slate-800 text-foreground hover:bg-slate-700': variant === 'secondary',
            'hover:bg-muted text-muted-foreground hover:text-foreground': variant === 'ghost',
            'text-indigo-400 underline-offset-4 hover:underline': variant === 'link',
            'h-9 px-4 py-2': size === 'default',
            'h-8 rounded-md px-3 text-xs': size === 'sm',
            'h-10 rounded-md px-8': size === 'lg',
            'h-9 w-9': size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
