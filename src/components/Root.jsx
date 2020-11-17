import React from 'react';
import CSSCustomProperties from './CSSCustomProperties';

export default function Root({ children }) {
  return (
    <div className="root">
      <CSSCustomProperties />
      {children}
    </div>
  );
}
