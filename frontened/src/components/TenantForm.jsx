import { useState } from "react";
import { postJson, putJson } from "../api.js";
import Modal from "./Modal.jsx";

export default function TenantForm({ tenant, onClose, onSaved }) {
  const isEdit = Boolean(tenant);
  const [name, setName] = useState(tenant?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = { name: name.trim() };
      if (isEdit) {
        await putJson(`/tenants/${tenant.id}`, body);
      } else {
        await postJson("/tenants", body);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit tenant" : "Add tenant"} onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <label>
          Tenant name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Corp"
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save" : "Add tenant"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
