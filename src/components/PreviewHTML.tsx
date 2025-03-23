import React from 'react';

interface PreviewHTMLProps {
  html: string;
  className?: string;
}

export function PreviewHTML({ html, className = '' }: PreviewHTMLProps) {
  return (
    <div 
      className={`prose prose-sm ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}