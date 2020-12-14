import React from 'react';
import GlobalStyles from './GlobalStyles';

export default function Root({ children, publicUrl }) {
  return (
    <div className="root">
      <GlobalStyles publicUrl={publicUrl} />
      {children}
    </div>
  );
}
