import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from ..core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True) # 'seamless-leggings', 'sports-bras', 'bottoms', 'must-haves'
    category_label = Column(String(100), default="SHOP SEAMLESS")
    usd_price = Column(Float, nullable=False)
    pkr_price = Column(Float, nullable=False)
    original_usd_price = Column(Float, nullable=True)
    original_pkr_price = Column(Float, nullable=True)
    
    image_url = Column(String(500), nullable=False)
    hover_image_url = Column(String(500), nullable=True)
    
    # Stored as JSON arrays
    colors = Column(JSON, default=list) # [{'name': 'Olive Heather', 'hex': '#636b57'}]
    sizes = Column(JSON, default=list) # ['XS', 'S', 'M', 'L', 'XL']
    
    description = Column(Text, nullable=False)
    details = Column(JSON, default=list) # ['100% squat-proof', '4-way flex']
    fabric = Column(String(255), default="88% Polyamide, 12% Elastane")
    support_level = Column(String(100), default="Medium Support")
    
    rating = Column(Float, default=4.9)
    reviews_count = Column(Integer, default=120)
    is_new = Column(Boolean, default=False)
    is_best_seller = Column(Boolean, default=False)
    in_stock = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    cart_items = relationship("CartItem", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
