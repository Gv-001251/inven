import React from 'react';
import { HiOutlineExclamationCircle, HiOutlineX } from 'react-icons/hi';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) => {
  if (!isOpen) return null;

  const typeColors = {
    warning: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-start">
            <div className={`flex-shrink-0 p-3 rounded-full ${typeColors[type] || typeColors.warning}`}>
              <HiOutlineExclamationCircle className="h-6 w-6" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <HiOutlineX className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-breeze-blue rounded-xl hover:bg-blue-800"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
