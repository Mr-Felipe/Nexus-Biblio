import { Injectable, signal } from '@angular/core';

export interface Toast {
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  current = signal<Toast | null>(null);

  show(type: Toast['type'], text: string) {
    this.current.set({ type, text });
    setTimeout(() => {
      if (this.current()?.text === text) {
        this.current.set(null);
      }
    }, 4500);
  }

  dismiss() {
    this.current.set(null);
  }
}
