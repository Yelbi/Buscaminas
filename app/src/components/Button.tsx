import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'win' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  style?: CSSProperties;
}

const PALETTE: Record<ButtonVariant, { c: string; glow: string }> = {
  primary: { c: 'var(--neon-cyan)', glow: 'rgba(25,227,255,0.55)' },
  secondary: { c: 'var(--neon-magenta)', glow: 'rgba(255,46,151,0.55)' },
  win: { c: 'var(--neon-lime)', glow: 'rgba(157,255,61,0.55)' },
  danger: { c: 'var(--neon-red)', glow: 'rgba(255,59,92,0.55)' },
  ghost: { c: 'var(--neon-cyan)', glow: 'rgba(25,227,255,0.0)' },
};

const SIZES: Record<ButtonSize, { h: string; px: string; fs: string }> = {
  sm: { h: 'var(--ctl-sm)', px: '14px', fs: 'var(--fs-sm)' },
  md: { h: 'var(--ctl-md)', px: '20px', fs: 'var(--fs-body)' },
  lg: { h: 'var(--ctl-lg)', px: '28px', fs: 'var(--fs-lg)' },
};

/**
 * Button — primary action control with neon glow.
 * Variants: primary (cyan), secondary (magenta), ghost, danger, win.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  style = {},
  ...rest
}: ButtonProps) {
  const palette = PALETTE[variant] || PALETTE.primary;
  const sizes = SIZES[size];
  const isGhost = variant === 'ghost';

  const base: CSSProperties = {
    display: block ? 'flex' : 'inline-flex',
    width: block ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--sp-2)',
    height: sizes.h,
    padding: `0 ${sizes.px}`,
    fontFamily: 'var(--font-display)',
    fontSize: sizes.fs,
    fontWeight: 600,
    letterSpacing: '0.02em',
    lineHeight: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 'var(--r-md)',
    border: `2px solid ${palette.c}`,
    color: isGhost ? palette.c : '#07070f',
    background: isGhost ? 'transparent' : palette.c,
    boxShadow: isGhost ? 'none' : `0 0 18px ${palette.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
    textShadow: isGhost ? `0 0 10px ${palette.glow}` : 'none',
    opacity: disabled ? 0.4 : 1,
    transition: 'transform var(--dur-fast) var(--ease-snap), box-shadow var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)',
    WebkitFontSmoothing: 'antialiased',
    ...style,
  };

  return (
    <button
      type="button"
      disabled={disabled}
      style={base}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'translateY(1px) scale(0.98)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'none'; }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.boxShadow = isGhost
          ? `0 0 20px ${palette.glow.replace('0.0', '0.4')}`
          : `0 0 28px ${palette.glow}, inset 0 1px 0 rgba(255,255,255,0.3)`;
        if (isGhost) e.currentTarget.style.background = 'rgba(25,227,255,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = (base.boxShadow as string) || 'none';
        if (isGhost) e.currentTarget.style.background = 'transparent';
      }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
