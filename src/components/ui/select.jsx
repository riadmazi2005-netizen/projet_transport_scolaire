import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const Select = ({ children, value, onValueChange, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract SelectItems from SelectContent for displaying selected value
  let selectItems = [];
  React.Children.forEach(children, child => {
    if (child && child.type === SelectContent) {
      const contentChildren = React.Children.toArray(child.props.children);
      contentChildren.forEach(item => {
        if (item && item.type === SelectItem) {
          selectItems.push(item);
        }
      });
    }
  });

  return (
    <div ref={selectRef} className="relative" {...props}>
      {React.Children.map(children, child => {
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, { 
            isOpen, 
            onClick: () => setIsOpen(!isOpen),
            value,
            selectItems
          });
        }
        if (child.type === SelectContent) {
          return React.cloneElement(child, { 
            isOpen, 
            onSelect: (val) => {
              onValueChange(val);
              setIsOpen(false);
            },
            value
          });
        }
        return child;
      })}
    </div>
  );
};

const SelectTrigger = ({ className = '', children, isOpen, onClick, value, selectItems = [], ...props }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${className}`}
      {...props}
    >
      {React.Children.map(children, child => {
        if (child.type === SelectValue) {
          return React.cloneElement(child, { value, selectItems });
        }
        return child;
      })}
      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
};

const SelectValue = ({ placeholder, children, value, selectItems = [] }) => {
  // If children are provided directly, use them
  if (children) {
    return <span className="text-gray-900">{children}</span>;
  }
  
  // Otherwise, find the matching SelectItem from selectItems
  if (value && selectItems.length > 0) {
    const selectedItem = selectItems.find(item => item.props.value === value);
    if (selectedItem) {
      return <span className="text-gray-900">{selectedItem.props.children}</span>;
    }
  }
  
  return <span className="text-gray-500">{placeholder}</span>;
};

const SelectContent = ({ children, isOpen, onSelect, value, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div className={`absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-fadeIn ${className}`} style={{ pointerEvents: 'auto' }}>
      <div className="max-h-60 overflow-y-auto">
        {React.Children.map(children, child => 
          React.cloneElement(child, { onSelect, selectedValue: value })
        )}
      </div>
    </div>
  );
};

const SelectItem = ({ value, children, onSelect, selectedValue, className = '' }) => {
  const isSelected = value === selectedValue;
  
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-amber-50 transition-colors ${
        isSelected ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-700'
      } ${className}`}
    >
      {children}
      {isSelected && <Check className="w-4 h-4 text-amber-600" />}
    </button>
  );
};

// Export du wrapper pour récupérer la valeur sélectionnée
const SelectValueWrapper = ({ value, placeholder, children }) => {
  const selectedChild = React.Children.toArray(children).find(
    child => child.props.value === value
  );
  
  return (
    <SelectValue placeholder={placeholder}>
      {selectedChild?.props.children}
    </SelectValue>
  );
};

export { Select, SelectTrigger, SelectValue, SelectValueWrapper, SelectContent, SelectItem };