from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from ..core.database import get_db
from ..models.product import Product
from ..schemas.product import ProductResponse, ProductCreate, ProductListResponse

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=ProductListResponse)
def get_products(
    category: Optional[str] = Query(None, description="Category filter (e.g. seamless-leggings, sports-bras)"),
    search: Optional[str] = Query(None, description="Search query across name & description"),
    sort: Optional[str] = Query("featured", description="Sort order: featured, price-asc, price-desc, rating"),
    in_stock_only: bool = Query(False, description="Filter only in-stock activewear"),
    db: Session = Depends(get_db)
):
    query = db.query(Product)

    if category and category != "all":
        query = query.filter(Product.category == category)

    if search:
        search_pattern = f"%{search.lower()}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_pattern),
                Product.description.ilike(search_pattern),
                Product.fabric.ilike(search_pattern)
            )
        )

    if in_stock_only:
        query = query.filter(Product.in_stock == True)

    # Sorting
    if sort == "price-asc":
        query = query.order_by(asc(Product.usd_price))
    elif sort == "price-desc":
        query = query.order_by(desc(Product.usd_price))
    elif sort == "rating":
        query = query.order_by(desc(Product.rating))
    else:
        # Default featured ordering
        query = query.order_by(desc(Product.is_best_seller), desc(Product.is_new), Product.id)

    products = query.all()
    return {
        "total": len(products),
        "products": products
    }

@router.get("/{id_or_slug}", response_model=ProductResponse)
def get_product(id_or_slug: str, db: Session = Depends(get_db)):
    if id_or_slug.isdigit():
        product = db.query(Product).filter(Product.id == int(id_or_slug)).first()
    else:
        product = db.query(Product).filter(Product.slug == id_or_slug).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product '{id_or_slug}' not found"
        )
    return product

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    existing = db.query(Product).filter(Product.slug == product_in.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A product with this slug already exists"
        )
    
    product = Product(**product_in.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
