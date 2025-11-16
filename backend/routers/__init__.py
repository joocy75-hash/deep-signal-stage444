# backend/routes/__init__.py
from .auth import router as auth_router
from .crypto import router as crypto_router

__all__ = ["auth_router", "crypto_router"]