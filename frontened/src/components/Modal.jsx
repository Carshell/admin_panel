import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function Modal({ title, onClose, children }) {
  const closeOnRelease = useRef(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function handleBackdropPointerDown(e) {
    closeOnRelease.current = e.target === e.currentTarget;
  }

  function handleBackdropPointerUp(e) {
    if (closeOnRelease.current && e.target === e.currentTarget) {
      onClose();
    }
    closeOnRelease.current = false;
  }

  function cancelBackdropClose() {
    closeOnRelease.current = false;
  }

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={handleBackdropPointerDown}
      onMouseUp={handleBackdropPointerUp}
      onTouchStart={handleBackdropPointerDown}
      onTouchEnd={handleBackdropPointerUp}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={cancelBackdropClose}
        onTouchStart={cancelBackdropClose}
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
