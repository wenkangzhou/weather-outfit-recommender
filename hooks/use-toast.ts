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
  
  // 深色背景配合白色文字，对比度更好
  const isSuccess = options.variant !== 'destructive';
  const bgColor = isSuccess ? 'rgba(30, 41, 59, 0.95)' : 'rgba(220, 38, 38, 0.95)'; // slate-800 / red-600 with opacity
  
  el.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9999;
    padding: 16px 24px;
    border-radius: 12px;
    background: ${bgColor};
    color: white;
    box-shadow: 0 20px 50px -10px rgba(0,0,0,0.4);
    animation: toast-pop 0.25s ease-out;
  `;
  
  const descHtml = options.description 
    ? `<div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:6px;line-height:1.5;">${options.description}</div>` 
    : '';
  
  el.innerHTML = `
    <div style="font-weight:600;font-size:16px;">${options.title || ''}</div>
    ${descHtml}
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
