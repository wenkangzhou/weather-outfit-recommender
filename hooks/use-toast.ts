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
    setTimeout(() => setToast(null), 2000);
  }, []);

  return {
    toast: showToast,
    currentToast: toast,
  };
}

export function toast(options: ToastOptions) {
  if (typeof window === 'undefined') return;
  
  // Remove existing
  const existing = document.getElementById('toast-notification');
  if (existing) existing.remove();
  
  const el = document.createElement('div');
  el.id = 'toast-notification';
  
  // 使用与整体风格一致的颜色，带透明度
  const isSuccess = options.variant !== 'destructive';
  const bgColor = isSuccess ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)'; // emerald-500 / red-500 with opacity
  
  el.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9999;
    padding: 16px 24px;
    border-radius: 16px;
    background: ${bgColor};
    color: white;
    box-shadow: 0 20px 50px -10px rgba(0,0,0,0.3);
    font-size: 15px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: toast-pop 0.25s ease-out;
  `;
  
  el.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      ${isSuccess 
        ? '<path d="M20 6L9 17l-5-5"/>' 
        : '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>'
      }
    </svg>
    <span>${options.title || ''}</span>
  `;
  
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes toast-pop {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        70% { transform: translate(-50%, -50%) scale(1.02); }
        100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
      @keyframes toast-fade {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(el);
  
  setTimeout(() => {
    el.style.animation = 'toast-fade 0.2s ease-out forwards';
    setTimeout(() => el.remove(), 200);
  }, 1500);
}
