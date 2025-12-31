import React from 'react';
import { motion } from 'framer-motion';

const Button = React.forwardRef(({ 
  className = '', 
  variant = 'default', 
  size = 'default', 
  disabled = false,
  type = 'button',
  children, 
  ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    default: "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500 shadow-lg hover:shadow-xl",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    destructive: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-lg hover:shadow-xl",
    outline: "border-2 border-amber-500 text-amber-600 hover:bg-amber-50 focus:ring-amber-500",
    ghost: "hover:bg-gray-100 text-gray-700 focus:ring-gray-500",
    link: "text-amber-600 underline-offset-4 hover:underline focus:ring-amber-500"
  };
  
  const sizes = {
    default: "h-11 px-6 py-2",
    sm: "h-9 px-4 text-sm",
    lg: "h-12 px-8 text-lg",
    icon: "h-10 w-10"
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
});

Button.displayName = "Button";

export { Button };