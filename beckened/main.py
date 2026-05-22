import asyncio
import os

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from auth import create_access_token, get_current_user, verify_password
from database import Base, engine, get_db
from health_check import check_monitor_url
from models import Server, Service, Tenant, User
from schemas import (
    LoginRequest,
    ServerCreate,
    ServerOut,
    ServerUpdate,
    ServiceCreate,
    ServiceOut,
    ServiceStatusOut,
    ServiceUpdate,
    TenantCreate,
    TenantOut,
    TenantUpdate,
    TokenResponse,
)
from seed import run_seed

app = FastAPI(title="Vana Admin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        run_seed(db)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.get("/")
async def root():
    return {"message": "Vana Admin API"}


@app.get("/health")
async def health():
    db_status = "ok"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except OperationalError:
        db_status = "unavailable"
    return {"api": "ok", "database": db_status}


@app.post("/auth/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.login == body.login).first()
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid login or password")
    token = create_access_token(user.id, user.login)
    return TokenResponse(access_token=token)


@app.get("/auth/me")
def auth_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "login": current_user.login}


@app.get("/services", response_model=list[ServiceOut])
def list_services(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Service).order_by(Service.id).all()


async def _check_service(service: Service) -> tuple[int, ServiceStatusOut]:
    if not service.monitor_url:
        return service.id, ServiceStatusOut(ok=None, monitor_url=None)

    ok, error = await check_monitor_url(service.monitor_url)
    return service.id, ServiceStatusOut(
        ok=ok,
        monitor_url=service.monitor_url,
        error=error,
    )


@app.get("/services/status")
async def services_status(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    services = db.query(Service).order_by(Service.id).all()
    if not services:
        return {"statuses": {}}

    results = await asyncio.gather(*[_check_service(s) for s in services])
    return {"statuses": {str(sid): status for sid, status in results}}


@app.get("/tenants", response_model=list[TenantOut])
def list_tenants(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Tenant).order_by(Tenant.id).all()


@app.get("/servers", response_model=list[ServerOut])
def list_servers(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Server).order_by(Server.id).all()


@app.post("/servers", response_model=ServerOut, status_code=201)
def create_server(
    body: ServerCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    server = Server(ip=body.ip, password=body.password)
    db.add(server)
    db.commit()
    db.refresh(server)
    return server


@app.put("/servers/{server_id}", response_model=ServerOut)
def update_server(
    server_id: int,
    body: ServerUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    server = db.get(Server, server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    server.ip = body.ip
    server.password = body.password
    db.commit()
    db.refresh(server)
    return server


@app.delete("/servers/{server_id}", status_code=204)
def delete_server(
    server_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    server = db.get(Server, server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    db.delete(server)
    db.commit()


@app.post("/tenants", response_model=TenantOut, status_code=201)
def create_tenant(
    body: TenantCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tenant = Tenant(name=body.name)
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


@app.put("/tenants/{tenant_id}", response_model=TenantOut)
def update_tenant(
    tenant_id: int,
    body: TenantUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant.name = body.name
    db.commit()
    db.refresh(tenant)
    return tenant


@app.delete("/tenants/{tenant_id}", status_code=204)
def delete_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    db.delete(tenant)
    db.commit()


@app.post("/services", response_model=ServiceOut, status_code=201)
def create_service(
    body: ServiceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    server = db.get(Server, body.server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    tenant = db.get(Tenant, body.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    service = Service(
        name=body.name,
        server_id=body.server_id,
        tenant_id=body.tenant_id,
        api_v=body.api_v,
        panel_v=body.panel_v,
        monitor_url=body.monitor_url,
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@app.put("/services/{service_id}", response_model=ServiceOut)
def update_service(
    service_id: int,
    body: ServiceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    server = db.get(Server, body.server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    tenant = db.get(Tenant, body.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    service.name = body.name
    service.server_id = body.server_id
    service.tenant_id = body.tenant_id
    service.api_v = body.api_v
    service.panel_v = body.panel_v
    service.monitor_url = body.monitor_url
    db.commit()
    db.refresh(service)
    return service


@app.delete("/services/{service_id}", status_code=204)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(service)
    db.commit()
