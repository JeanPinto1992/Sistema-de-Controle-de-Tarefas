import React from 'react';
import styles from './index.module.css';

export const Button = ({ variant = 'primary', className = '', children, ...props }) => {
  const variantClass =
    variant === 'secondary' ? styles.buttonSecondary : styles.buttonPrimary;
  return (
    <button
      className={`${styles.button} ${variantClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};

export const Card = ({ className = '', children, ...props }) => (
  <div className={`${styles.card} ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const Input = ({ as = 'input', className = '', ...props }) => {
  const Component = as;
  return (
    <Component className={`${styles.input} ${className}`.trim()} {...props} />
  );
};

export const Title = ({ level = 1, className = '', children, ...props }) => {
  const Tag = `h${level}`;
  return (
    <Tag className={`${styles.title} ${className}`.trim()} {...props}>
      {children}
    </Tag>
  );
};

export const Form = ({ className = '', children, ...props }) => (
  <form className={`${styles.form} ${className}`.trim()} {...props}>
    {children}
  </form>
);

export const FormGroup = ({ className = '', children, ...props }) => (
  <div className={`${styles.formGroup} ${className}`.trim()} {...props}>
    {children}
  </div>
);
