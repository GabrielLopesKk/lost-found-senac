import { createContext, useContext } from "react";

export type ToastType = "success" | "error";
export type Toast = { id: number; message: string; type: ToastType };
export type ToastHandler = (message: string, type?: ToastType) => void;

export const ToastContext = createContext<ToastHandler>(() => {});

export function useToast() {
  return useContext(ToastContext);
}
