import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'interactive'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const baseStyles =
      'bg-white dark:bg-[#2a1d15] rounded-xl border border-[#e9d9ce] dark:border-[#3a2e26]'

    const variants = {
      default: '',
      hover: 'hover:shadow-md transition-shadow duration-300',
      interactive:
        'hover:shadow-md hover:border-primary/30 hover:scale-[1.02] transition-all duration-300 cursor-pointer',
    }

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card
