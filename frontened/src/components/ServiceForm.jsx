import { useState } from "react";
import { postJson, putJson } from "../api.js";
import Modal from "./Modal.jsx";

export default function ServiceForm({
  service,
  server,
  tenant,
  servers,
  tenants,
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(service);
  const [name, setName] = useState(service?.name ?? "");
  const [serverId, setServerId] = useState(
    String(service?.server_id ?? server?.id ?? "")
  );
  const [tenantId, setTenantId] = useState(
    String(service?.tenant_id ?? tenant?.id ?? "")
  );
  const [apiV, setApiV] = useState(service?.api_v ?? "");
  const [panelV, setPanelV] = useState(service?.panel_v ?? "");
  const [monitorUrl, setMonitorUrl] = useState(service?.monitor_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const selectedServer = servers.find((s) => String(s.id) === serverId);
  const selectedTenant = tenants.find((t) => String(t.id) === tenantId);

  const title = isEdit
    ? "Edit service"
    : `Add service — ${server?.ip ?? "?"} × ${tenant?.name ?? "?"}`;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: name.trim(),
        server_id: Number(serverId),
        tenant_id: Number(tenantId),
        api_v: apiV.trim() || null,
        panel_v: panelV.trim() || null,
        monitor_url: monitorUrl.trim() || null,
      };
      if (isEdit) {
        await putJson(`/services/${service.id}`, body);
      } else {
        await postJson("/services", body);
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
    <Modal title={title} onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        {isEdit && (
          <>
            <label>
              Server
              <select
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
                required
              >
                <option value="">Select server</option>
                {servers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ip}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tenant
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                required
              >
                <option value="">Select tenant</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {!isEdit && selectedServer && selectedTenant && (
          <p className="form-hint">
            Cell: {selectedServer.ip} × {selectedTenant.name}
          </p>
        )}
        <label>
          Service name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-service"
            required
          />
        </label>
        <label>
          API version
          <input
            type="text"
            value={apiV}
            onChange={(e) => setApiV(e.target.value)}
            placeholder="1.0"
          />
        </label>
        <label>
          Panel version
          <input
            type="text"
            value={panelV}
            onChange={(e) => setPanelV(e.target.value)}
            placeholder="2.0"
          />
        </label>
        <label>
          Monitor URL
          <input
            type="url"
            value={monitorUrl}
            onChange={(e) => setMonitorUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save" : "Add service"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
