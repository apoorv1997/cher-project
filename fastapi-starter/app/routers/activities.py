from typing import List, Union, Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.deps import get_current_user
from app.database import get_session
from app.models import Activity, Lead, User
from app.schemas import ActivityCreate, ActivityOut

router = APIRouter(prefix="/api/leads/{lead_id}/activities", tags=["activities"])

async def _get_lead_or_404(lead_id: int, session: AsyncSession) -> Lead:
    lead = await session.get(Lead, lead_id)
    if not lead or not lead.is_active:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@router.get("")
@router.get("/")
async def list_activities(lead_id: int, session: Annotated[AsyncSession, Depends(get_session)], _: Annotated[User, Depends(get_current_user)]) -> List[ActivityOut]:
    await _get_lead_or_404(lead_id, session)
    rows = (await session.exec(
        select(Activity).where(Activity.lead_id == lead_id).order_by(Activity.activity_date.desc(), Activity.created_at.desc())
    )).all()
    return [ActivityOut.model_validate(r.__dict__) for r in rows]

@router.post("", response_model=Union[ActivityOut, List[ActivityOut]], status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=Union[ActivityOut, List[ActivityOut]], status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def add_activities(
    lead_id: int,
    payload: Annotated[Union[ActivityCreate, List[ActivityCreate]], Body(..., description="Single object or array.")],
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    lead = await _get_lead_or_404(lead_id, session)

    if isinstance(payload, list):
        if not payload:
            raise HTTPException(status_code=400, detail="Empty list provided")
        activities = [
            Activity(
                lead_id=lead.id,
                user_id=current_user.id,
                user_name=f"{current_user.first_name} {current_user.last_name}",
                **p.model_dump(),
            )
            for p in payload
        ]
        session.add_all(activities)
        lead.activity_count += len(activities)
        session.add(lead)
        try:
            await session.commit()
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=f"Bulk insert failed: {e}")
        for a in activities:
            await session.refresh(a)
        return [ActivityOut.model_validate(a.__dict__) for a in activities]

    activity = Activity(
        lead_id=lead.id,
        user_id=current_user.id,
        user_name=f"{current_user.first_name} {current_user.last_name}",
        **payload.model_dump(),
    )
    session.add(activity)
    lead.activity_count += 1
    session.add(lead)
    await session.commit()
    await session.refresh(activity)
    return ActivityOut.model_validate(activity.__dict__)