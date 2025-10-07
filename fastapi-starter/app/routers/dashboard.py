from datetime import datetime, timedelta
from typing import List, Dict, Any, Annotated
from fastapi import APIRouter, Depends
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.deps import get_current_user
from app.database import get_session
from app.models import Lead, Activity, User
from app.schemas import DashboardStats, ActivityOut

router = APIRouter(prefix="/api", tags=["dashboard"])

@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(session: Annotated[AsyncSession, Depends(get_session)], _: Annotated[User, Depends(get_current_user)]):
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_leads = (await session.exec(select(func.count()).select_from(Lead).where(Lead.is_active == True))).one()
    new_leads_this_week = (await session.exec(select(func.count()).select_from(Lead).where(Lead.is_active == True, Lead.created_at >= week_ago))).one()
    closed_leads_this_month = (await session.exec(select(func.count()).select_from(Lead).where(Lead.status == "closed", Lead.created_at >= month_start))).one()
    total_activities = (await session.exec(select(func.count()).select_from(Activity))).one()

    rows = (await session.exec(select(Lead.status, func.count(Lead.id)).where(Lead.is_active == True).group_by(Lead.status))).all()
    leads_by_status: List[Dict[str, Any]] = [{"status": s, "count": c} for (s, c) in rows]

    recent = (await session.exec(select(Activity).order_by(Activity.activity_date.desc(), Activity.created_at.desc()).limit(10))).all()
    recent_out = [ActivityOut.model_validate(a.__dict__) for a in recent]

    return DashboardStats(
        total_leads=total_leads,
        new_leads_this_week=new_leads_this_week,
        closed_leads_this_month=closed_leads_this_month,
        total_activities=total_activities,
        leads_by_status=leads_by_status,
        recent_activities=recent_out,
    )