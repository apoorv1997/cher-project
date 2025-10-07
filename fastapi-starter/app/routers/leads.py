from typing import List, Optional, Union, Annotated
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.deps import get_current_user
from app.database import get_session
from app.models import Lead, User
from app.schemas import LeadCreate, LeadOut, LeadUpdate

router = APIRouter(prefix="/api/leads", tags=["leads"])

@router.get("", response_model=List[LeadOut])
async def list_leads(
    q: Optional[str] = Query(None, description="search in name/email/phone"),
    status_f: Optional[str] = Query(None, alias="status"),
    source: Optional[str] = None,
    min_budget: Optional[int] = None,
    max_budget: Optional[int] = None,
    page: int = 1,
    size: int = 10,
    session: Annotated[AsyncSession, Depends(get_session)] = None,
    _: Annotated[User, Depends(get_current_user)] = None,
):
    stmt = select(Lead).where(Lead.is_active == True)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (col(Lead.first_name).ilike(like)) |
            (col(Lead.last_name).ilike(like))  |
            (col(Lead.email).ilike(like))      |
            (col(Lead.phone).ilike(like))
        )
    status_norm = (status_f or "").strip().lower()
    if status_norm not in ("", "all"):
            stmt = stmt.where(Lead.status == status_norm)
    if source:   stmt = stmt.where(Lead.source == source)
    if min_budget is not None:
        stmt = stmt.where((Lead.budget_min >= min_budget) | (Lead.budget_max >= min_budget))
    if max_budget is not None:
        stmt = stmt.where((Lead.budget_max <= max_budget) | (Lead.budget_min <= max_budget))

    stmt = stmt.order_by(Lead.created_at.desc()).offset((page - 1) * size).limit(size)
    leads = (await session.exec(stmt)).all()
    return [LeadOut.model_validate(l.__dict__) for l in leads]

@router.post(
    "",
    response_model=Union[LeadOut, List[LeadOut]],
    status_code=status.HTTP_201_CREATED,
    summary="Create one lead or many leads",
)
async def create_leads(
    payload: Annotated[
        Union[LeadCreate, List[LeadCreate]],
        Body(..., description="Accepts a single lead object or an array of lead objects.")
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    _: Annotated[User, Depends(get_current_user)],
):
    if isinstance(payload, list):
        if not payload:
            raise HTTPException(status_code=400, detail="Empty list provided")
        leads = [Lead(**p.model_dump()) for p in payload]
        session.add_all(leads)
        try:
            await session.commit()
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=f"Bulk insert failed: {e}")
        for l in leads:
            await session.refresh(l)
        return [LeadOut.model_validate(l.__dict__) for l in leads]

    lead = Lead(**payload.model_dump())
    session.add(lead)
    await session.commit()
    await session.refresh(lead)
    return LeadOut.model_validate(lead.__dict__)

@router.get("/{lead_id}", response_model=LeadOut)
async def get_lead(lead_id: int, session: Annotated[AsyncSession, Depends(get_session)], _: Annotated[User, Depends(get_current_user)]):
    lead = await session.get(Lead, lead_id)
    if not lead or not lead.is_active:
        raise HTTPException(status_code=404, detail="Lead not found")
    return LeadOut.model_validate(lead.__dict__)

@router.put("/{lead_id}", response_model=LeadOut)
async def update_lead(lead_id: int, payload: LeadUpdate, session: Annotated[AsyncSession, Depends(get_session)], _: Annotated[User, Depends(get_current_user)]):
    lead = await session.get(Lead, lead_id)
    if not lead or not lead.is_active:
        raise HTTPException(status_code=404, detail="Lead not found")
    updates = payload.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(lead, k, v)
    lead.updated_at = datetime.utcnow()
    session.add(lead)
    await session.commit()
    await session.refresh(lead)
    return LeadOut.model_validate(lead.__dict__)

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(lead_id: int, session: Annotated[AsyncSession, Depends(get_session)], _: Annotated[User, Depends(get_current_user)]):
    lead = await session.get(Lead, lead_id)
    if not lead or not lead.is_active:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead.is_active = False
    session.add(lead)
    await session.commit()
    return None
