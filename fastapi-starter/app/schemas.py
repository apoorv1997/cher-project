from datetime import datetime, date
from typing import Optional, Any, List
from pydantic import BaseModel, Field

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserCreate(BaseModel):
    username: str = Field(min_length=3)
    email: str
    password: str = Field(min_length=8)
    first_name: str
    last_name: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    created_at: datetime

class LeadCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    status: str = "new"
    source: str = "website"
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    property_interest: Optional[str] = None

class LeadOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: str
    status: str
    source: str
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    property_interest: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    activity_count: int = 0

class LeadUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    property_interest: Optional[str] = None
    is_active: Optional[bool] = None

class ActivityCreate(BaseModel):
    activity_type: str
    title: str
    notes: Optional[str] = None
    duration: Optional[int] = None
    activity_date: date

class ActivityOut(BaseModel):
    id: int
    lead_id: int
    user_id: int
    activity_type: str
    title: str
    notes: Optional[str] = None
    duration: Optional[int] = None
    activity_date: date
    created_at: datetime
    user_name: str

class DashboardStats(BaseModel):
    total_leads: int
    new_leads_this_week: int
    closed_leads_this_month: int
    total_activities: int
    leads_by_status: List[dict[str, Any]]
    recent_activities: List[ActivityOut]
