import { useState } from "react";
import { clearToken } from "../auth.js";
import ServerForm from "./ServerForm.jsx";
import ServiceGrid from "./ServiceGrid.jsx";
import TenantForm from "./TenantForm.jsx";

export default function AdminPanel() {
  const [serverModal, setServerModal] = useState(null);
  const [tenantModal, setTenantModal] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function refreshGrid() {
    setRefreshKey((k) => k + 1);
  }

  function handleLogout() {
    clearToken();
    window.location.reload();
  }

  return (
    <main className="app">
      <header className="app-header">
        <div className="app-header-row">
          <div>
            <h1>Admin Panel</h1>
          </div>
          <div className="toolbar">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setServerModal({ mode: "add" })}
            >
              Add server
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setTenantModal({ mode: "add" })}
            >
              Add tenant
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <ServiceGrid
        refreshKey={refreshKey}
        onRefresh={refreshGrid}
        onEditServer={(server) => setServerModal({ mode: "edit", server })}
        onEditTenant={(tenant) => setTenantModal({ mode: "edit", tenant })}
      />

      {serverModal && (
        <ServerForm
          server={serverModal.mode === "edit" ? serverModal.server : null}
          onClose={() => setServerModal(null)}
          onSaved={refreshGrid}
        />
      )}
      {tenantModal && (
        <TenantForm
          tenant={tenantModal.mode === "edit" ? tenantModal.tenant : null}
          onClose={() => setTenantModal(null)}
          onSaved={refreshGrid}
        />
      )}
    </main>
  );
}
