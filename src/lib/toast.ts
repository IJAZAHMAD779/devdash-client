import React from "react";

export type ToastType = "default" | "success" | "error" | "info" | "warning" | "loading";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastData {
  id: string;
  type: ToastType;
  title: React.ReactNode;
  description?: React.ReactNode;
  duration?: number;
  action?: ToastAction;
  cancel?: ToastAction;
  icon?: React.ReactNode;
  isClosing?: boolean;
  createdAt: number;
}

export interface ToastOptions {
  id?: string;
  description?: React.ReactNode;
  duration?: number;
  action?: ToastAction;
  cancel?: ToastAction;
  icon?: React.ReactNode;
}

type ToastListener = () => void;

class ToastStore {
  private toasts: ToastData[] = [];
  private listeners: Set<ToastListener> = new Set();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  subscribe = (listener: ToastListener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): ToastData[] => {
    return this.toasts;
  };

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  add(type: ToastType, title: React.ReactNode, options?: ToastOptions): string {
    const id = options?.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = options?.duration !== undefined ? options.duration : type === "loading" ? Infinity : 4000;

    // Remove existing if same ID
    this.clearTimer(id);
    const existingIndex = this.toasts.findIndex((t) => t.id === id);

    const newToast: ToastData = {
      id,
      type,
      title,
      description: options?.description,
      duration,
      action: options?.action,
      cancel: options?.cancel,
      icon: options?.icon,
      isClosing: false,
      createdAt: Date.now(),
    };

    if (existingIndex > -1) {
      this.toasts[existingIndex] = newToast;
    } else {
      // Keep max 5 toasts visible simultaneously
      if (this.toasts.length >= 5) {
        this.toasts = this.toasts.slice(1);
      }
      this.toasts = [...this.toasts, newToast];
    }

    this.notify();

    if (duration !== Infinity && duration > 0) {
      this.startTimer(id, duration);
    }

    return id;
  }

  dismiss = (id?: string) => {
    if (!id) {
      // Dismiss all
      this.toasts.forEach((t) => this.dismiss(t.id));
      return;
    }

    this.clearTimer(id);
    const target = this.toasts.find((t) => t.id === id);
    if (!target || target.isClosing) return;

    // Trigger closing animation
    this.toasts = this.toasts.map((t) => (t.id === id ? { ...t, isClosing: true } : t));
    this.notify();

    // Remove after close duration (250ms per --toast-close)
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
      this.notify();
    }, 250);
  };

  private startTimer(id: string, duration: number) {
    this.clearTimer(id);
    const timer = setTimeout(() => {
      this.dismiss(id);
    }, duration);
    this.timers.set(id, timer);
  }

  private clearTimer(id: string) {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}

export const toastStore = new ToastStore();

// Main Toast Dispatcher
export function toast(title: React.ReactNode, options?: ToastOptions) {
  return toastStore.add("default", title, options);
}

toast.success = (title: React.ReactNode, options?: ToastOptions) =>
  toastStore.add("success", title, options);

toast.error = (title: React.ReactNode, options?: ToastOptions) =>
  toastStore.add("error", title, options);

toast.info = (title: React.ReactNode, options?: ToastOptions) =>
  toastStore.add("info", title, options);

toast.warning = (title: React.ReactNode, options?: ToastOptions) =>
  toastStore.add("warning", title, options);

toast.loading = (title: React.ReactNode, options?: ToastOptions) =>
  toastStore.add("loading", title, options);

toast.dismiss = (id?: string) => toastStore.dismiss(id);

toast.promise = async <T>(
  promise: Promise<T>,
  messages: {
    loading: React.ReactNode;
    success: React.ReactNode | ((data: T) => React.ReactNode);
    error: React.ReactNode | ((err: any) => React.ReactNode);
  },
  options?: ToastOptions
): Promise<T> => {
  const id = toast.loading(messages.loading, options);
  try {
    const result = await promise;
    const successMsg =
      typeof messages.success === "function" ? messages.success(result) : messages.success;
    toast.success(successMsg, { ...options, id });
    return result;
  } catch (err) {
    const errorMsg =
      typeof messages.error === "function" ? messages.error(err) : messages.error;
    toast.error(errorMsg, { ...options, id });
    throw err;
  }
};
