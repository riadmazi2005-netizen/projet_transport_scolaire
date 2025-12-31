import React from 'react';

const Textarea = React.forwardRef(({ 
  className = '', 
  ...props 
}, ref) => {
  return (
    <textarea
      ref={ref}
      className={`w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${className}`}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };







