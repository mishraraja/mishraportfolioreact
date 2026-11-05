import { useEffect, useRef } from "react";

export function useDialogFocus(open, dialogRef, onClose) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open || !dialogRef.current) return undefined;
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    const selector = 'button:not(:disabled), a[href], input, textarea, [tabindex="0"]';
    if (!dialog.contains(document.activeElement)) dialog.querySelector(selector)?.focus({ preventScroll: true });
    function keys(event) {
      event.stopPropagation();
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
      if (event.key !== "Tab") return;
      const controls = [...dialog.querySelectorAll(selector)];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    dialog.addEventListener("keydown", keys);
    return () => {
      dialog.removeEventListener("keydown", keys);
      if (opener?.isConnected && opener !== document.body) opener.focus({ preventScroll: true });
      else document.querySelector('.dock button[aria-label="Open terminal"]')?.focus({ preventScroll: true });
    };
  }, [open, dialogRef]);
}
