import React from 'react';
import { HiOutlineInbox } from 'react-icons/hi';

const EmptyState = ({ icon: Icon = HiOutlineInbox, title = 'No data found', message = 'There is no data to display at this time.', action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
      <Icon className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-500 text-center max-w-md mb-6">{message}</p>
    {action && (
      <div className="mt-2">
        {action}
      </div>
    )}
  </div>
);

export default EmptyState;
