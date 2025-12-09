import React from "react";
import styles from "./Modal.module.css";

const Modal = ({ open, title, message, type = "info", onClose }) => {
  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>

        <div className={styles.body}>
          <p className={styles.message}>{message}</p>
        </div>

        <div className={styles.footer}>
          <button
            className={`${styles.btn} ${
              type === "success" ? styles.btnSuccess : styles.btnDanger
            }`}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
