import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl', position = 'top' }) => {
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionClasses = position === 'center' 
    ? 'items-center' 
    : 'items-start';
  
  const modalClasses = position === 'center'
    ? `bg-white rounded-lg shadow-xl w-full ${maxWidth}`
    : `bg-white rounded-lg shadow-xl w-full ${maxWidth} my-8`;

  const handleBackdropKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleModalKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center ${positionClasses} z-50 p-4 overflow-y-auto`}
      onClick={onClose}
      onKeyDown={handleBackdropKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      tabIndex={-1}
    >
      <div 
        className={modalClasses}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleModalKeyDown}
        role="document"
        tabIndex={0}
      >
        <div className="p-6">
          {title && (
            <h2 id="modal-title" className="text-2xl font-bold mb-4">{title}</h2>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
  maxWidth: PropTypes.string,
  position: PropTypes.oneOf(['top', 'center'])
};

export default Modal;