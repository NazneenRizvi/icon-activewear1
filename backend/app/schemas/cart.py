from typing import Optional
from pydantic import BaseModel
from .product import ProductResponse

class CartItemCreate(BaseModel):
    product_id: int
    selected_color: str
    selected_size: str
    quantity: int = 1
    session_id: Optional[str] = None

class CartItemUpdate(BaseModel):
    quantity: int

class CartItemResponse(BaseModel):
    id: int
    product_id: int
    selected_color: str
    selected_size: str
    quantity: int
    product: ProductResponse

    class Config:
        from_attributes = True

class CartSummaryResponse(BaseModel):
    items: list[CartItemResponse]
    total_items: int
    subtotal_usd: float
    subtotal_pkr: float
