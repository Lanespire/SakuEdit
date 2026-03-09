import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg'

    const variants = {
      primary:
        'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20',
      secondary:
        'bg-white dark:bg-[#2a1d15] text-[#1c130d] dark:text-white border border-[#e9d9ce] dark:border-[#3a2e26] hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white',
      outline:
        'bg-transparent border border-[#e9d9ce] dark:border-[#3a2e26] text-[#6b584b] dark:text-[#9e8b7d] hover:border-primary hover:text-primary',
      ghost:
        'bg-transparent hover:bg-[#f4ece6] dark:hover:bg-[#3a2e26] text-[#6b584b] dark:text-[#9e8b7d]',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="material-symbols-outlined animate-spin mr-2">sync</span>
            処理中...
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
