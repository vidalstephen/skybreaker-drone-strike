import type { MouseEventHandler, ReactNode } from 'react';

export interface MenuButtonProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
}

export function MenuButton({ icon, variant = 'secondary', className = '', children, type = 'button', ...props }: MenuButtonProps) {
  const variants = {
    primary: 'bg-orange-500 text-black border-orange-500 hover:bg-white hover:border-white',
    secondary: 'bg-black/55 text-white border-white/15 hover:border-orange-500 hover:text-orange-300',
    tertiary: 'bg-transparent text-white/40 border-white/8 hover:text-white/65 hover:border-white/20',
    danger: 'bg-red-600/20 text-red-100 border-red-500/40 hover:bg-red-600 hover:border-red-400',
  };

  return (
    <button
      className={`pointer-events-auto w-full min-h-12 px-3 py-3 border ${variants[variant]} transition-colors uppercase tracking-[0.14em] text-[11px] font-black flex items-center justify-center gap-2 text-center sm:px-4 sm:tracking-[0.18em] sm:text-xs sm:gap-3 ${className}`}
      type={type}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
