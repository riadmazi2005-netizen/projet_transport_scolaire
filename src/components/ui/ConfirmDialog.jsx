import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './button';

export default function ConfirmDialog({ 
  isOpen, 
  title = "Confirmation", 
  message, 
  onConfirm, 
  onCancel,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "destructive" // destructive ou default
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className={`p-6 ${variant === 'destructive' ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
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
          <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
            <Button
              variant="outline"
              onClick={onCancel}
              className="rounded-xl"
            >
              {cancelText}
            </Button>
            <Button
              variant={variant}
              onClick={onConfirm}
              className={`rounded-xl ${variant === 'destructive' ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              {confirmText}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

