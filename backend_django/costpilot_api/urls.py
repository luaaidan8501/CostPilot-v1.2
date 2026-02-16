from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.core.views import (
    DishViewSet,
    HealthCheckView,
    IngredientViewSet,
    PurchaseRecordViewSet,
    ReceiptRecordViewSet,
    RecipeViewSet,
    RestaurantViewSet,
    SalesRecordViewSet,
)

router = DefaultRouter()
router.register("restaurants", RestaurantViewSet, basename="restaurant")
router.register("ingredients", IngredientViewSet, basename="ingredient")
router.register("dishes", DishViewSet, basename="dish")
router.register("recipes", RecipeViewSet, basename="recipe")
router.register("purchases", PurchaseRecordViewSet, basename="purchase")
router.register("sales-records", SalesRecordViewSet, basename="sales-record")
router.register("receipts", ReceiptRecordViewSet, basename="receipt")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", HealthCheckView.as_view(), name="health"),
    path("api/v1/", include(router.urls)),
]
