import React from 'react';
import { Card } from '../..';

const TabbedOverlay = ({ isOpen, children }) => (
  isOpen ? (
    <Card
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'var(--overlay-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Card
        style={{
          padding: 'var(--spacing-lg)',
          background: 'var(--background)'
        }}
      >
        {children}
      </Card>
    </Card>
  ) : null
);

TabbedOverlay.Header = ({ children, ...props }) => <div {...props}>{children}</div>;
TabbedOverlay.Footer = ({ children, ...props }) => <div {...props}>{children}</div>;

export const useTabbedOverlay = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false)
  };
};

export { TabbedOverlay };
