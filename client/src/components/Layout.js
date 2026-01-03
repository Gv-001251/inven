import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-mint">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen ml-64 overflow-hidden">
        {/* Header is not fixed in the design, but let's keep it at top for now or inside content? 
            Design shows Dashboard title inside content. We will keep Header for Search/Profile at top. */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <Header />
          <div className="mt-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
