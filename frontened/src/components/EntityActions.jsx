export default function EntityActions({ onEdit, onDelete, editLabel = "Edit", deleteLabel = "Delete" }) {
  return (
    <div className="entity-actions">
      <button
        type="button"
        className="btn-icon"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        title={editLabel}
        aria-label={editLabel}
      >
        ✎
      </button>
      <button
        type="button"
        className="btn-icon btn-icon-danger"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title={deleteLabel}
        aria-label={deleteLabel}
      >
        ×
      </button>
    </div>
  );
}
