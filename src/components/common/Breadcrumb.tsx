// src/components/common/Breadcrumb.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <Link 
        href="/" 
        className="text-[#666666] hover:text-white transition-colors flex items-center gap-1"
        title="Home"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-[#444444]" />
          {item.current || !item.href ? (
            <span 
              className={`${
                item.current 
                  ? 'text-white font-medium' 
                  : 'text-[#666666]'
              } max-w-xs truncate`}
              aria-current={item.current ? 'page' : undefined}
            >
              {item.label}
            </span>
          ) : (
            <Link 
              href={item.href}
              className="text-[#666666] hover:text-white transition-colors max-w-xs truncate"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};