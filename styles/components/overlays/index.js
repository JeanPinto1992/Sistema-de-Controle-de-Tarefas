import React from 'react';

export const TabbedOverlay = ({ isOpen, children }) => (isOpen ? <div>{children}</div> : null);

export const useTabbedOverlay = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false)
  };
};
