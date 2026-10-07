from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import datetime

class ProductColorSchema(BaseModel):
    name: str
    hex: str

class ProductBase(BaseModel):
    name: str
    slug: str
    category: str
    category_label: Optional[str] = "SHOP SEAMLESS"
    usd_price: float
    pkr_price: float
    original_usd_price: Optional[float] = None
    original_pkr_price: Optional[float] = None
    image_url: str
    hover_image_url: Optional[str] = None
    colors: List[Any] = []
    sizes: List[str] = []
    description: str
    details: List[str] = []
    fabric: Optional[str] = "88% Polyamide, 12% Elastane"
    support_level: Optional[str] = "Medium Support"
    rating: float = 4.9
    reviews_count: int = 100
    is_new: bool = False
    is_best_seller: bool = False
    in_stock: bool = True

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    total: int
    products: List[ProductResponse]
