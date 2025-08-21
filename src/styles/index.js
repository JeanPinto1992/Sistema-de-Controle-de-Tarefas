import React from 'react';

export const Button = ({ children, ...props }) => <button {...props}>{children}</button>;
export const Card = ({ children, className = '', ...props }) => (
  <div className={['card', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);
export const Input = ({ as = 'input', ...props }) => {
  const Component = as === 'textarea' ? 'textarea' : as === 'select' ? 'select' : 'input';
  return <Component {...props} />;
};
export const Title = ({ level = 1, children, ...props }) => {
  const Tag = `h${level}`;
  return <Tag {...props}>{children}</Tag>;
};
export const Form = ({ children, ...props }) => <form {...props}>{children}</form>;
export const FormGroup = ({ children, ...props }) => <div {...props}>{children}</div>;
