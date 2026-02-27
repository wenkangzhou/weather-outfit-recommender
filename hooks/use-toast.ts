'use client';

import { useState, useCallback } from 'react';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toast, setToast] = useState<ToastOptions | null>(null);

  const showToast = useCallback((options: ToastOptions) => {
    setToast(options);
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  return {
    toast: showToast,
    currentToast: toast,
  };
}

// Simple toast component that can be used anywhere
export function toast(options: ToastOptions) {
  if (typeof window === 'undefined') return;
  
  // Remove any existing toast
  const existingToast = document.getElementById('toast-notification');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create toast element
  const toastEl = document.createElement('div');
  toastEl.id = 'toast-notification';
  toastEl.className = `fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all duration-300 ${
    options.variant === 'destructive' 
      ? 'bg-destructive text-destructive-foreground' 
      : 'bg-foreground text-background'
  }`;
  toastEl.style.animation = 'toast-in 0.3s ease-out';
  toastEl.innerHTML = `
    <div class="flex items-center gap-2">
      ${options.variant === 'destructive' 
        ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 4V8M8 12H8.01M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 5.5L6.5 12.5L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      }
      <div>
        <div class="font-medium">${options.title || ''}</div>
        ${options.description ? `<div class="text-xs opacity-80 mt-0.5">${options.description}</div>` : ''}
      </div>
    </div>
  `;
  
  // Add animation styles if not present
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes toast-in {
        from { opacity: 0; transform: translate(-50%, -20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      @keyframes toast-out {
        from { opacity: 1; transform: translate(-50%, 0); }
        to { opacity: 0; transform: translate(-50%, -20px); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toastEl);
  
  // Auto remove
  setTimeout(() => {
    toastEl.style.animation = 'toast-out 0.3s ease-out forwards';
    setTimeout(() => toastEl.remove(), 300);
  }, 2500);
}
