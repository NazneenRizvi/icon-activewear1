from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.cart import CartItem
from ..models.product import Product
from ..schemas.cart import CartItemCreate, CartItemUpdate, CartItemResponse, CartSummaryResponse

router = APIRouter(prefix="/cart", tags=["Cart"])

@router.get("", response_model=CartSummaryResponse)
def get_cart(
    session_id: Optional[str] = Query(None, description="Guest session ID"),
    user_id: Optional[int] = Query(None, description="User ID if logged in"),
    db: Session = Depends(get_db)
):
    query = db.query(CartItem)
    if user_id:
        query = query.filter(CartItem.user_id == user_id)
    elif session_id:
        query = query.filter(CartItem.session_id == session_id)
    else:
        return {"items": [], "total_items": 0, "subtotal_usd": 0.0, "subtotal_pkr": 0.0}

    items = query.all()
    total_qty = sum(item.quantity for item in items)
    subtotal_usd = sum(item.product.usd_price * item.quantity for item in items if item.product)
    subtotal_pkr = sum(item.product.pkr_price * item.quantity for item in items if item.product)

    return {
        "items": items,
        "total_items": total_qty,
        "subtotal_usd": round(subtotal_usd, 2),
        "subtotal_pkr": round(subtotal_pkr, 2)
    }

@router.post("", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
def add_to_cart(cart_in: CartItemCreate, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == cart_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check for existing item with identical variant
    query = db.query(CartItem).filter(
        CartItem.product_id == cart_in.product_id,
        CartItem.selected_color == cart_in.selected_color,
        CartItem.selected_size == cart_in.selected_size
    )
    if user_id:
        query = query.filter(CartItem.user_id == user_id)
    elif cart_in.session_id:
        query = query.filter(CartItem.session_id == cart_in.session_id)

    existing_item = query.first()
    if existing_item:
        existing_item.quantity += cart_in.quantity
        db.commit()
        db.refresh(existing_item)
        return existing_item

    new_item = CartItem(
        user_id=user_id,
        session_id=cart_in.session_id,
        product_id=cart_in.product_id,
        selected_color=cart_in.selected_color,
        selected_size=cart_in.selected_size,
        quantity=cart_in.quantity
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.put("/{item_id}", response_model=CartItemResponse)
def update_cart_item(item_id: int, item_update: CartItemUpdate, db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if item_update.quantity <= 0:
        db.delete(item)
        db.commit()
        raise HTTPException(status_code=204, detail="Item removed")

    item.quantity = item_update.quantity
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_cart(item_id: int, db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    db.commit()
    return None

@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(
    session_id: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(CartItem)
    if user_id:
        query = query.filter(CartItem.user_id == user_id)
    elif session_id:
        query = query.filter(CartItem.session_id == session_id)
    else:
        return None

    query.delete(synchronize_session=False)
    db.commit()
    return None
