from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.core.views import (
    AlertRecordViewSet,
    AnalyticsDataRecordViewSet,
    DashboardKPIRecordViewSet,
    DishViewSet,
    DishesOverTargetRecordViewSet,
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
router.register("alerts", AlertRecordViewSet, basename="alert")
router.register("dashboard-kpis", DashboardKPIRecordViewSet, basename="dashboard-kpi")
router.register("analytics-data", AnalyticsDataRecordViewSet, basename="analytics-data")
router.register("dishes-over-target", DishesOverTargetRecordViewSet, basename="dishes-over-target")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", HealthCheckView.as_view(), name="health"),
    path("api/v1/", include(router.urls)),
]
