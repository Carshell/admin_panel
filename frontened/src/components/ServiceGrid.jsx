import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteJson, fetchJson } from "../api.js";
import EntityActions from "./EntityActions.jsx";
import ServiceForm from "./ServiceForm.jsx";
import StatusDot from "./StatusDot.jsx";

const HEALTH_CHECK_MS = 3 * 60 * 1000;

function cellKey(serverId, tenantId) {
  return `${serverId}-${tenantId}`;
}

function ServiceCell({ services, statusMap, checking, onEdit, onDelete }) {
  if (!services?.length) {
    return null;
  }

  return (
    <div className="cell-services">
      {services.map((s) => {
        const st = statusMap[String(s.id)];
        return (
          <div key={s.id} className="cell-service">
            <div className="cell-service-header">
              <StatusDot
                status={st?.ok}
                error={st?.error}
                checking={checking}
              />
              <div className="cell-service-name">{s.name}</div>
              <EntityActions
                onEdit={() => onEdit(s)}
                onDelete={() => onDelete(s)}
                editLabel={`Edit ${s.name}`}
                deleteLabel={`Delete ${s.name}`}
              />
            </div>
            {(s.api_v || s.panel_v) && (
              <div className="cell-service-versions">
                {s.api_v && <span>API {s.api_v}</span>}
                {s.panel_v && <span>Panel {s.panel_v}</span>}
              </div>
            )}
            {s.monitor_url && (
              <a
                href={s.monitor_url}
                target="_blank"
                rel="noopener noreferrer"
                className="cell-service-link"
              >
                Monitor
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GridCell({
  server,
  tenant,
  services,
  statusMap,
  checking,
  onAdd,
  onEditService,
  onDeleteService,
}) {
  return (
    <td>
      <div className="grid-cell">
        <ServiceCell
          services={services}
          statusMap={statusMap}
          checking={checking}
          onEdit={onEditService}
          onDelete={onDeleteService}
        />
        <button
          type="button"
          className="cell-add"
          onClick={(e) => {
            e.stopPropagation();
            onAdd(server, tenant);
          }}
          title={`Add service for ${server.ip} / ${tenant.name}`}
          aria-label={`Add service for ${server.ip} and ${tenant.name}`}
        >
          +
        </button>
      </div>
    </td>
  );
}

export default function ServiceGrid({
  refreshKey = 0,
  onRefresh,
  onEditServer,
  onEditTenant,
}) {
  const [servers, setServers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [services, setServices] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceModal, setServiceModal] = useState(null);

  const runHealthCheck = useCallback(async () => {
    if (!services.length) return;
    setChecking(true);
    try {
      const data = await fetchJson("/services/status");
      setStatusMap(data.statuses || {});
    } catch {
      /* keep previous statuses */
    } finally {
      setChecking(false);
    }
  }, [services]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [serversData, tenantsData, servicesData] = await Promise.all([
          fetchJson("/servers"),
          fetchJson("/tenants"),
          fetchJson("/services"),
        ]);
        if (!cancelled) {
          setServers(serversData);
          setTenants(tenantsData);
          setServices(servicesData);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!services.length) return;

    runHealthCheck();
    const interval = setInterval(runHealthCheck, HEALTH_CHECK_MS);
    return () => clearInterval(interval);
  }, [services, runHealthCheck]);

  const serviceMap = useMemo(() => {
    const map = new Map();
    for (const service of services) {
      if (service.server_id == null || service.tenant_id == null) continue;
      const key = cellKey(service.server_id, service.tenant_id);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(service);
    }
    return map;
  }, [services]);

  async function handleDeleteServer(server) {
    if (!window.confirm(`Delete server "${server.ip}"?`)) return;
    try {
      await deleteJson(`/servers/${server.id}`);
      onRefresh?.();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleDeleteTenant(tenant) {
    if (!window.confirm(`Delete tenant "${tenant.name}"?`)) return;
    try {
      await deleteJson(`/tenants/${tenant.id}`);
      onRefresh?.();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleDeleteService(service) {
    if (!window.confirm(`Delete service "${service.name}"?`)) return;
    try {
      await deleteJson(`/services/${service.id}`);
      onRefresh?.();
    } catch (e) {
      alert(e.message);
    }
  }

  if (loading) {
    return <p className="grid-message">Loading…</p>;
  }

  if (error) {
    return <p className="grid-message grid-error">{error}</p>;
  }

  if (!servers.length || !tenants.length) {
    return (
      <p className="grid-message">
        Use <strong>Add server</strong> and <strong>Add tenant</strong> to build the grid.
      </p>
    );
  }

  return (
    <>
      <div className="grid-wrap">
        <table className="service-grid">
          <thead>
            <tr>
              <th className="corner">Server \ Tenant</th>
              {tenants.map((tenant) => (
                <th key={tenant.id}>
                  <div className="header-cell">
                    <span>{tenant.name}</span>
                    <EntityActions
                      onEdit={() => onEditTenant?.(tenant)}
                      onDelete={() => handleDeleteTenant(tenant)}
                      editLabel={`Edit tenant ${tenant.name}`}
                      deleteLabel={`Delete tenant ${tenant.name}`}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {servers.map((server) => (
              <tr key={server.id}>
                <th className="row-header">
                  <div className="header-cell row-header-cell">
                    <div>
                      <span className="row-ip">{server.ip}</span>
                      <span className="row-id">#{server.id}</span>
                    </div>
                    <EntityActions
                      onEdit={() => onEditServer?.(server)}
                      onDelete={() => handleDeleteServer(server)}
                      editLabel={`Edit server ${server.ip}`}
                      deleteLabel={`Delete server ${server.ip}`}
                    />
                  </div>
                </th>
                {tenants.map((tenant) => (
                  <GridCell
                    key={tenant.id}
                    server={server}
                    tenant={tenant}
                    services={serviceMap.get(cellKey(server.id, tenant.id))}
                    statusMap={statusMap}
                    checking={checking}
                    servers={servers}
                    tenants={tenants}
                    onAdd={(server, tenant) =>
                      setServiceModal({ mode: "add", server, tenant })
                    }
                    onEditService={(service) =>
                      setServiceModal({ mode: "edit", service })
                    }
                    onDeleteService={handleDeleteService}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {serviceModal && (
        <ServiceForm
          service={serviceModal.mode === "edit" ? serviceModal.service : null}
          server={serviceModal.server}
          tenant={serviceModal.tenant}
          servers={servers}
          tenants={tenants}
          onClose={() => setServiceModal(null)}
          onSaved={() => onRefresh?.()}
        />
      )}
    </>
  );
}
