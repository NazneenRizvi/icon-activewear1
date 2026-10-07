import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    session_id = Column(String(255), nullable=True, index=True) # for guest users
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    selected_color = Column(String(100), nullable=False)
    selected_size = Column(String(50), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="cart_items")
    product = relationship("Product", back_populates="cart_items")
