"""
Database Seeding Script for FITNESS JUNKIES E-Commerce
Populates realistic activewear catalog, colors, swatches, prices, and demo users matching the reference image.
"""
import sys
import os

# Add parent directory to path to allow importing app modules
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.product import Product

def seed_database():
    print("Creating tables if they don't exist...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Seed Demo Users
        existing_admin = db.query(User).filter(User.email == "admin@fitnessjunkies.net").first()
        if not existing_admin:
            admin_user = User(
                email="admin@fitnessjunkies.net",
                name="Head Coach Admin",
                hashed_password=get_password_hash("AdminFitness2026!"),
                is_active=True,
                is_admin=True
            )
            db.add(admin_user)
            print("✓ Seeded Admin User: admin@fitnessjunkies.net")

        existing_customer = db.query(User).filter(User.email == "sarah@athlete.com").first()
        if not existing_customer:
            customer_user = User(
                email="sarah@athlete.com",
                name="Sarah Jenkins",
                hashed_password=get_password_hash("fitness2026!"),
                is_active=True,
                is_admin=False
            )
            db.add(customer_user)
            print("✓ Seeded Demo Customer: sarah@athlete.com")

        # 2. Seed Activewear Products from Reference Image
        products_data = [
            {
                "name": "BALANCE SEAMLESS LEGGINGS",
                "slug": "balance-seamless-leggings",
                "category": "seamless-leggings",
                "category_label": "SHOP SEAMLESS",
                "usd_price": 28.99,
                "pkr_price": 8046.40,
                "original_usd_price": 36.00,
                "original_pkr_price": 10000.00,
                "image_url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
                "hover_image_url": "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
                "colors": [
                    {"name": "Olive Heather", "hex": "#636b57"},
                    {"name": "Charcoal Grey", "hex": "#3e3e40"},
                    {"name": "Navy Dusk", "hex": "#283149"},
                    {"name": "Warm Taupe", "hex": "#877c73"},
                    {"name": "Blush Rose", "hex": "#cf9893"}
                ],
                "sizes": ["XS", "S", "M", "L", "XL"],
                "description": "High-waist ribbed compression leggings. Formulated with 4-way stretch circular knit microfiber for complete squat-proof confidence.",
                "details": [
                    "High-waisted compression contour waistband",
                    "100% squat-proof non-sheer knit",
                    "Sweat-wicking, fast-drying seamless yarn",
                    "Subtle glute-enhancing ribbed texture"
                ],
                "fabric": "88% Polyamide, 12% Elastane",
                "support_level": "Medium Support",
                "rating": 4.9,
                "reviews_count": 342,
                "is_new": True,
                "is_best_seller": True,
                "in_stock": True
            },
            {
                "name": "ELITE SEAMLESS LEGGINGS",
                "slug": "elite-seamless-leggings",
                "category": "seamless-leggings",
                "category_label": "SHOP SEAMLESS",
                "usd_price": 32.99,
                "pkr_price": 9073.60,
                "original_usd_price": 40.00,
                "original_pkr_price": 11000.00,
                "image_url": "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80",
                "hover_image_url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
                "colors": [
                    {"name": "Obsidian Black", "hex": "#111111"},
                    {"name": "Forest Moss", "hex": "#2f3e30"},
                    {"name": "Cloud Grey", "hex": "#9ea3a8"},
                    {"name": "Deep Plum", "hex": "#482d3f"}
                ],
                "sizes": ["XS", "S", "M", "L", "XL"],
                "description": "Zoned compressive panelling and ultra-supportive high waistband. Formulated with second-skin compressive yarn that breathes during intense lifts.",
                "details": [
                    "Zoned compressive panelling",
                    "Zero front seam for zero chafing",
                    "Deep ribbed anti-slip waistband"
                ],
                "fabric": "85% Nylon Microfiber, 15% Spandex",
                "support_level": "Maximum Compression",
                "rating": 4.8,
                "reviews_count": 218,
                "is_new": False,
                "is_best_seller": True,
                "in_stock": True
            },
            {
                "name": "CORE SEAMLESS LEGGINGS",
                "slug": "core-seamless-leggings",
                "category": "seamless-leggings",
                "category_label": "SHOP SEAMLESS",
                "usd_price": 30.99,
                "pkr_price": 8560.00,
                "image_url": "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
                "hover_image_url": "https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&w=800&q=80",
                "colors": [
                    {"name": "Camo Heather", "hex": "#4f5548"},
                    {"name": "Charcoal Grey", "hex": "#2a2a2a"},
                    {"name": "Ocean Mist", "hex": "#4d6978"},
                    {"name": "Sage Green", "hex": "#778a76"}
                ],
                "sizes": ["XS", "S", "M", "L", "XL"],
                "description": "Our iconic jacquard camo knit seamless leggings blend subtle textured shading with full athletic flex.",
                "details": [
                    "Jacquard camo seamless weave",
                    "Breathable heat-release eyelets",
                    "Contoured glute micro-ribbing"
                ],
                "fabric": "90% Polyamide, 10% Elastane",
                "support_level": "Medium Support",
                "rating": 4.9,
                "reviews_count": 189,
                "is_new": False,
                "is_best_seller": False,
                "in_stock": True
            },
            {
                "name": "IMPACT SEAMLESS LEGGINGS",
                "slug": "impact-seamless-leggings",
                "category": "seamless-leggings",
                "category_label": "SHOP SEAMLESS",
                "usd_price": 27.99,
                "pkr_price": 7875.20,
                "original_usd_price": 34.00,
                "original_pkr_price": 9500.00,
                "image_url": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80",
                "colors": [
                    {"name": "Midnight Navy", "hex": "#1c2833"},
                    {"name": "Jet Black", "hex": "#0a0a0a"},
                    {"name": "Espresso", "hex": "#3d2b24"},
                    {"name": "Dusty Berry", "hex": "#6d4350"}
                ],
                "sizes": ["XS", "S", "M", "L", "XL"],
                "description": "High-density compression knit that holds shape session after session without sagging or pilling.",
                "details": [
                    "Engineered squat-proof double knit",
                    "Targeted calf cooling ventilation",
                    "No-slip stay-put waistband"
                ],
                "fabric": "86% Nylon, 14% Elastane",
                "support_level": "High Support",
                "rating": 4.7,
                "reviews_count": 164,
                "is_new": False,
                "is_best_seller": False,
                "in_stock": True
            },
            {
                "name": "BOLD SPORTS BRA",
                "slug": "bold-sports-bra",
                "category": "sports-bras",
                "category_label": "SHOP LOW IMPACT",
                "usd_price": 24.00,
                "pkr_price": 6676.80,
                "original_usd_price": 30.00,
                "original_pkr_price": 8300.00,
                "image_url": "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80",
                "colors": [
                    {"name": "Crisp White", "hex": "#fcfcfc"},
                    {"name": "Terracotta", "hex": "#b35d45"},
                    {"name": "Sage Green", "hex": "#82917d"},
                    {"name": "Onyx Black", "hex": "#181818"}
                ],
                "sizes": ["XS", "S", "M", "L", "XL"],
                "description": "Minimalist aesthetic meets low-to-medium athletic support. Features open cross-back strap geometry for full mobility.",
                "details": [
                    "Removable molded cup padding",
                    "Criss-cross back straps for free scapular movement",
                    "Wide bottom band that stays flush without digging"
                ],
                "fabric": "82% Polyamide, 18% Elastane",
                "support_level": "Low Support",
                "rating": 4.9,
                "reviews_count": 295,
                "is_new": False,
                "is_best_seller": True,
                "in_stock": True
            },
            {
                "name": "EXCEL SPORTS BRA",
                "slug": "excel-sports-bra",
                "category": "sports-bras",
                "category_label": "SHOP LOW IMPACT",
                "usd_price": 21.50,
                "pkr_price": 5992.00,
                "image_url": "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
                "colors": [
                    {"name": "Heather Grey", "hex": "#777b80"},
                    {"name": "Dusty Rose", "hex": "#bf8e93"},
                    {"name": "Mocha Tan", "hex": "#7a6458"},
                    {"name": "Muted Olive", "hex": "#586150"}
                ],
                "sizes": ["XS", "S", "M", "L", "XL"],
                "description": "Ultra-lightweight everyday movement bra crafted with butter-soft micro-modal blend.",
                "details": [
                    "Butter-soft second-skin touch",
                    "Plunge scoop neckline",
                    "Non-restrictive flexible underband"
                ],
                "fabric": "80% Microfiber Nylon, 20% Spandex",
                "support_level": "Low Support",
                "rating": 4.8,
                "reviews_count": 178,
                "is_new": False,
                "is_best_seller": False,
                "in_stock": True
            },
            {
                "name": "BOLD SPORTS BRA (MARBLE)",
                "slug": "bold-sports-bra-marble",
                "category": "sports-bras",
                "category_label": "SHOP LOW IMPACT",
                "usd_price": 24.00,
                "pkr_price": 6676.80,
                "image_url": "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80",
                "colors": [
                    {"name": "Granite Marble", "hex": "#949599"},
                    {"name": "Chalk White", "hex": "#f2f2f0"},
                    {"name": "Smoke Black", "hex": "#262626"}
                ],
                "sizes": ["XS", "S", "M", "L", "XL"],
                "description": "Limited edition sublimated marble print. Seamless knit preserves crisp contrast when stretched.",
                "details": [
                    "Sublimated zero-fade active print",
                    "Reinforced double-layered chest panel"
                ],
                "fabric": "84% Polyester, 16% Spandex",
                "support_level": "Low Support",
                "rating": 4.7,
                "reviews_count": 142,
                "is_new": False,
                "is_best_seller": False,
                "in_stock": True
            },
            {
                "name": "ULTRA SPORTS BRA",
                "slug": "ultra-sports-bra",
                "category": "sports-bras",
                "category_label": "SHOP LOW IMPACT",
                "usd_price": 24.00,
                "pkr_price": 6676.80,
                "image_url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
                "colors": [
                    {"name": "Pure White", "hex": "#ffffff"},
                    {"name": "Sunset Coral", "hex": "#de6857"},
                    {"name": "Seafoam Mint", "hex": "#7aa39c"},
                    {"name": "Deep Steel", "hex": "#374151"}
                ],
                "sizes": ["XS", "S", "M", "L", "XL"],
                "description": "Locked-in security with breathable mesh ventilation channels down the spine for instant thermal cooling.",
                "details": [
                    "Racerback silhouette with breathable mesh channel",
                    "Non-slip wide band"
                ],
                "fabric": "85% Nylon, 15% Elastane",
                "support_level": "Medium Support",
                "rating": 4.9,
                "reviews_count": 211,
                "is_new": True,
                "is_best_seller": False,
                "in_stock": True
            }
        ]

        for p_data in products_data:
            existing = db.query(Product).filter(Product.slug == p_data["slug"]).first()
            if not existing:
                prod = Product(**p_data)
                db.add(prod)
                print(f"✓ Seeded Product: {p_data['name']}")

        db.commit()
        print("\nAll database seeds successfully executed!")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
