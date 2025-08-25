import React from 'react';
import { Card, Title } from '../../index';
import styles from './TabbedOverlay.module.css';

export const TabbedOverlay = ({ isOpen, title, icon, children, footer }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <Card className={styles.card}>
        {title && (
          <div className={styles.header}>
            {icon && <span className={styles.icon}>{icon}</span>}
            <Title level={3}>{title}</Title>
          </div>
        )}
        <div className={styles.content}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </Card>
    </div>
  );
};

export const useTabbedOverlay = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false)
  };
};
