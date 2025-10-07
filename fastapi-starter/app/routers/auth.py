from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.deps import get_current_user
from app.core.security import hash_password, verify_password, create_access_token, needs_rehash
from app.database import get_session
from app.models import User
from app.schemas import UserCreate, UserLogin, UserOut, Token

router = APIRouter(prefix="/api/users", tags=["users"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, session: Annotated[AsyncSession, Depends(get_session)]):
    user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
    )
    try:
        async with session.begin():
            session.add(user)
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=409, detail="Username or email already exists")
    await session.refresh(user)
    return UserOut.model_validate(user.__dict__)

@router.post("/token", response_model=Token)
async def login_token(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    result = await session.exec(select(User).where(User.username == form.username))
    user = result.first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    if needs_rehash(user.password_hash):
        user.password_hash = hash_password(form.password)
        async with session.begin():
            session.add(user)
    return Token(access_token=create_access_token(subject=user.username))

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, session: Annotated[AsyncSession, Depends(get_session)]):
    result = await session.exec(select(User).where(User.username == credentials.username))
    user = result.first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    if needs_rehash(user.password_hash):
        user.password_hash = hash_password(credentials.password)
        async with session.begin():
            session.add(user)
    return Token(access_token=create_access_token(subject=user.username))

@router.get("/me", response_model=UserOut)
async def me(current_user: Annotated[User, Depends(get_current_user)]):
    return UserOut.model_validate(current_user.__dict__)
