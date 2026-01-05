import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Button } from './button';

export default function AlertDialog({ 
  isOpen, 
  title = "Information", 
  message, 
  type = "info", // info, success, error, warning
  onClose
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-white" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-white" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-white" />;
      default:
        return <Info className="w-6 h-6 text-white" />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'warning':
        return 'bg-gradient-to-r from-amber-500 to-amber-600';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className={`p-6 ${getColor()}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                {getIcon()}
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 text-base leading-relaxed">
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50">
            <Button
              onClick={onClose}
              className="rounded-xl"
            >
              OK
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

