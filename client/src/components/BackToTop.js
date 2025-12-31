import React, { useState, useEffect } from 'react';
import { HiOutlineArrowUp } from 'react-icons/hi';

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-40 p-3 bg-breeze-blue text-white rounded-full shadow-lg hover:bg-blue-800 transition-all duration-300 hover:scale-110"
      aria-label="Back to top"
    >
      <HiOutlineArrowUp className="h-6 w-6" />
    </button>
  );
};

export default BackToTop;
