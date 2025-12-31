import React from 'react';

const Input = React.forwardRef(({ 
  className = '', 
  type = 'text',
  error = false,
  ...props 
}, ref) => {
  const baseStyles = "flex w-full rounded-xl border bg-white px-4 py-2 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50";
  
  const errorStyles = error 
    ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
    : "border-gray-200 focus:ring-amber-500 focus:border-amber-500";

  return (
    <input
      type={type}
      className={`${baseStyles} ${errorStyles} ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };