import React from 'react';
import { HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineInformationCircle, HiOutlineX } from 'react-icons/hi';

const Alert = ({ type = 'info', message, onClose }) => {
  const config = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: HiOutlineCheckCircle,
      iconColor: 'text-green-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: HiOutlineExclamationCircle,
      iconColor: 'text-red-600',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: HiOutlineExclamationCircle,
      iconColor: 'text-yellow-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: HiOutlineInformationCircle,
      iconColor: 'text-blue-600',
    },
  };

  const { bg, border, text, icon: Icon, iconColor } = config[type] || config.info;

  return (
    <div className={`rounded-xl ${bg} border ${border} p-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className={`ml-3 flex-1 text-sm ${text}`}>
          {message}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`ml-3 flex-shrink-0 ${text} hover:opacity-75`}
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
