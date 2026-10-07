import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..core.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # Customer Details
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=False)
    customer_phone = Column(String(100), nullable=False)
    
    # Shipping Address
    shipping_address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    postal_code = Column(String(50), nullable=False)
    country = Column(String(100), nullable=False)
    
    # Financials
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    shipping = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    currency = Column(String(10), default="PKR")
    
    payment_method = Column(String(50), default="credit_card") # 'credit_card', 'cash_on_delivery', 'apple_pay'
    status = Column(String(50), default="confirmed") # 'confirmed', 'processing', 'shipped', 'delivered'
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    product_name = Column(String(255), nullable=False)
    selected_color = Column(String(100), nullable=False)
    selected_size = Column(String(50), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, nullable=False)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
