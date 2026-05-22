from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    login: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=255)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ServerCreate(BaseModel):
    ip: str = Field(min_length=1, max_length=45)
    password: str = Field(min_length=1, max_length=255)


class ServerUpdate(BaseModel):
    ip: str = Field(min_length=1, max_length=45)
    password: str = Field(min_length=1, max_length=255)


class TenantCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class TenantUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class ServerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ip: str
    password: str


class TenantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class ServiceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    server_id: int
    tenant_id: int
    api_v: str | None = Field(default=None, max_length=50)
    panel_v: str | None = Field(default=None, max_length=50)
    monitor_url: str | None = None


class ServiceUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    server_id: int
    tenant_id: int
    api_v: str | None = Field(default=None, max_length=50)
    panel_v: str | None = Field(default=None, max_length=50)
    monitor_url: str | None = None


class ServiceStatusOut(BaseModel):
    ok: bool | None
    monitor_url: str | None = None
    error: str | None = None


class ServiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    api_v: str | None
    panel_v: str | None
    monitor_url: str | None
    server_id: int | None
    tenant_id: int | None
