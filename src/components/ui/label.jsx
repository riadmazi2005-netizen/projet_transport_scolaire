import React from 'react';

const Label = React.forwardRef(({ 
  className = '', 
  required = false,
  children,
  ...props 
}, ref) => {
  return (
    <label
      ref={ref}
      className={`text-sm font-medium text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
});

Label.displayName = "Label";

export { Label };