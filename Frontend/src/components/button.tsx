import { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

type Variant = 'primary' | 'ghost' | 'danger' | 'success' | 'outline'
type Size    = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?:  Variant
  size?:     Size
  loading?:  boolean
  icon?:     React.ReactNode
  iconRight?: React.ReactNode
  children?: React.ReactNode
}

const sizeMap: Record<Size, string> = {
  sm:   'px-3 py-1.5 text-xs gap-1.5 rounded-md',
  md:   'px-4 py-2 text-sm gap-2 rounded-lg',
  lg:   'px-5 py-2.5 text-sm gap-2 rounded-lg',
  icon: 'p-2 rounded-lg',
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background:  'var(--accent)',
    color:       '#fff',
    border:      '1px solid transparent',
  },
  ghost: {
    background:  'transparent',
    color:       'var(--text-secondary)',
    border:      '1px solid transparent',
  },
  danger: {
    background:  'var(--danger-dim)',
    color:       'var(--danger)',
    border:      '1px solid transparent',
  },
  success: {
    background:  'var(--success-dim)',
    color:       'var(--success)',
    border:      '1px solid transparent',
  },
  outline: {
    background:  'transparent',
    color:       'var(--text-primary)',
    border:      '1px solid var(--border-base)',
  },
}

const hoverStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--accent-hover)', boxShadow: '0 0 16px var(--accent-glow)' },
  ghost:   { background: 'var(--bg-overlay)', color: 'var(--text-primary)', borderColor: 'var(--border-base)' },
  danger:  { background: 'var(--danger)', color: '#fff' },
  success: { background: 'var(--success)', color: '#080809' },
  outline: { background: 'var(--bg-overlay)', borderColor: 'var(--border-strong)' },
}

const Spinner = () => (
  <svg
    width="14" height="14" viewBox="0 0 14 14"
    fill="none" style={{ animation: 'spin 0.7s linear infinite' }}
  >
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeDasharray="28" strokeDashoffset="10" opacity="0.8"/>
  </svg>
)

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant  = 'ghost',
      size     = 'md',
      loading  = false,
      icon,
      iconRight,
      children,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        className={`btn ${sizeMap[size]} font-medium select-none`}
        style={{
          ...variantStyles[variant],
          fontFamily:   'var(--font-sans)',
          transition:   'background 150ms ease, color 150ms ease, border-color 150ms ease, box-shadow 150ms ease, opacity 150ms ease',
          opacity:      isDisabled ? 0.45 : 1,
          cursor:       isDisabled ? 'not-allowed' : 'pointer',
          ...style,
        }}
        whileHover={!isDisabled ? hoverStyles[variant] : undefined}
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
        transition={{ duration: 0.12 }}
        {...props}
      >
        {loading ? <Spinner /> : icon}
        {children}
        {!loading && iconRight}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
export default Button