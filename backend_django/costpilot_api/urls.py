from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.core.views import (
    DishViewSet,
    HealthCheckView,
    IngredientViewSet,
    RecipeViewSet,
    RestaurantViewSet,
)

router = DefaultRouter()
router.register("restaurants", RestaurantViewSet, basename="restaurant")
router.register("ingredients", IngredientViewSet, basename="ingredient")
router.register("dishes", DishViewSet, basename="dish")
router.register("recipes", RecipeViewSet, basename="recipe")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", HealthCheckView.as_view(), name="health"),
    path("api/v1/", include(router.urls)),
]
