from fastapi import APIRouter

from app.api import auth, crawler, dashboard, exports, health, imports, orders, products, sources, storefront


api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(auth.users_router)
api_router.include_router(sources.router)
api_router.include_router(crawler.router)
api_router.include_router(products.router)
api_router.include_router(products.public_router)
api_router.include_router(storefront.router)
api_router.include_router(orders.store_order_router)
api_router.include_router(orders.admin_order_router)
api_router.include_router(imports.router)
api_router.include_router(exports.router)
api_router.include_router(dashboard.router)

