from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

class OrderItemCreate(BaseModel):
    product_id: int
    selected_color: str
    selected_size: str
    quantity: int

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    shipping_address: str
    city: str
    postal_code: str
    country: str
    payment_method: str = "credit_card" # 'credit_card', 'cash_on_delivery', 'apple_pay'
    currency: str = "PKR"
    promo_code: Optional[str] = None
    items: List[OrderItemCreate]

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    selected_color: str
    selected_size: str
    quantity: int
    unit_price: float

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_name: str
    customer_email: str
    shipping_address: str
    city: str
    country: str
    subtotal: float
    discount: float
    shipping: float
    total: float
    currency: str
    payment_method: str
    status: str
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True
