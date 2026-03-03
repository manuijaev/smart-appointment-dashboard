export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  loadingText = 'Processing',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  tone = 'default',
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title || 'Confirmation dialog'}>
      <div className="modal-card">
        <h3>{title || 'Please Confirm'}</h3>
        <p>{message || 'Are you sure you want to continue?'}</p>
        <div className="modal-actions">
          <button type="button" className="btn-muted" onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </button>
          <button type="button" className={tone === 'danger' ? 'btn-danger' : ''} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <span className="loading-label">
                {loadingText}
                <span className="loading-dots" aria-hidden="true">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
