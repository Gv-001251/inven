import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-breeze-blue ${sizeClasses[size]}`} />
      {text && <p className="mt-4 text-sm text-gray-500">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
