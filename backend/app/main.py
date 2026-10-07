from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import engine, Base
from .models import user, product, cart, order
from .routers import auth, products, cart as cart_router, orders

# Automatically create tables if using SQLite / simple setup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production REST API for FITNESS JUNKIES athletic apparel e-commerce platform.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for Next.js / frontend client
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under /api
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(cart_router.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to FITNESS JUNKIES E-Commerce API",
        "docs": "/docs",
        "status": "healthy"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}
