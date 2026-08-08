export type ToastKind = "success" | "info" | "warning" | "error";

export type ToastPayload = {
  title: string;
  message?: string;
  kind?: ToastKind;
  duration?: number;
};

export function showToast(payload: ToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastPayload>("halkaarzim-toast", { detail: payload }));
}
