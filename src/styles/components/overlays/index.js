import React from 'react';
import styles from './TabbedOverlay.module.css';

export const TabbedOverlay = ({ isOpen, children }) =>
  isOpen ? <div className={styles.overlay}>{children}</div> : null;

export const useTabbedOverlay = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false)
  };
};
