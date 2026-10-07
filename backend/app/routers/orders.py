import uuid
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.order import Order, OrderItem
from ..models.product import Product
from ..models.cart import CartItem
from ..schemas.order import OrderCreate, OrderResponse

router = APIRouter(prefix="", tags=["Orders & Checkout"])

@router.post("/checkout", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def checkout(order_in: OrderCreate, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    if not order_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot checkout with empty items list"
        )

    # Calculate itemized totals from verified DB prices
    subtotal = 0.0
    items_to_create = []

    for item in order_in.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product ID {item.product_id} not found"
            )
        
        price = product.pkr_price if order_in.currency == "PKR" else product.usd_price
        subtotal += price * item.quantity

        items_to_create.append({
            "product_id": product.id,
            "product_name": product.name,
            "selected_color": item.selected_color,
            "selected_size": item.selected_size,
            "quantity": item.quantity,
            "unit_price": price
        })

    # Apply promo discount if present
    discount = 0.0
    if order_in.promo_code:
        code = order_in.promo_code.upper().strip()
        if code == "WELCOME10":
            discount = subtotal * 0.10
        elif code in ["FITNESS20", "MOVEMENT20"]:
            discount = subtotal * 0.20

    # Free shipping logic
    threshold = 20000.0 if order_in.currency == "PKR" else 75.0
    shipping = 0.0 if subtotal >= threshold or order_in.promo_code == "FREESHIP" else (1500.0 if order_in.currency == "PKR" else 5.99)
    total = max(0.0, subtotal - discount + shipping)

    order_num = f"FJ-{uuid.uuid4().hex[:6].upper()}"

    new_order = Order(
        order_number=order_num,
        user_id=user_id,
        customer_name=order_in.customer_name,
        customer_email=order_in.customer_email,
        customer_phone=order_in.customer_phone,
        shipping_address=order_in.shipping_address,
        city=order_in.city,
        postal_code=order_in.postal_code,
        country=order_in.country,
        subtotal=round(subtotal, 2),
        discount=round(discount, 2),
        shipping=round(shipping, 2),
        total=round(total, 2),
        currency=order_in.currency,
        payment_method=order_in.payment_method,
        status="confirmed",
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # Create associated OrderItems
    for it in items_to_create:
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=it["product_id"],
            product_name=it["product_name"],
            selected_color=it["selected_color"],
            selected_size=it["selected_size"],
            quantity=it["quantity"],
            unit_price=it["unit_price"]
        )
        db.add(order_item)

    db.commit()
    db.refresh(new_order)
    return new_order

@router.get("/orders/{order_number}", response_model=OrderResponse)
def get_order(order_number: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_number} not found"
        )
    return order
