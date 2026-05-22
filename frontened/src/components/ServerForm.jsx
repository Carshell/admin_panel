import { useState } from "react";
import { postJson, putJson } from "../api.js";
import Modal from "./Modal.jsx";

export default function ServerForm({ server, onClose, onSaved }) {
  const isEdit = Boolean(server);
  const [ip, setIp] = useState(server?.ip ?? "");
  const [password, setPassword] = useState(server?.password ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = { ip: ip.trim(), password };
      if (isEdit) {
        await putJson(`/servers/${server.id}`, body);
      } else {
        await postJson("/servers", body);
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
    <Modal title={isEdit ? "Edit server" : "Add server"} onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <label>
          IP address
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="10.0.0.1"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save" : "Add server"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
