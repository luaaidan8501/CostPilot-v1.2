from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Dish, Ingredient, Recipe, Restaurant
from .serializers import (
    DishSerializer,
    IngredientSerializer,
    RecipeSerializer,
    RestaurantSerializer,
)


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok", "service": "costpilot-django"})


class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all().order_by("-created_at")
    serializer_class = RestaurantSerializer


class IngredientViewSet(viewsets.ModelViewSet):
    serializer_class = IngredientSerializer

    def get_queryset(self):
        queryset = Ingredient.objects.select_related("restaurant").all().order_by("name")
        restaurant_id = self.request.query_params.get("restaurant")
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)
        return queryset


class DishViewSet(viewsets.ModelViewSet):
    serializer_class = DishSerializer

    def get_queryset(self):
        queryset = Dish.objects.select_related("restaurant").all().order_by("name")
        restaurant_id = self.request.query_params.get("restaurant")
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)
        return queryset


class RecipeViewSet(viewsets.ModelViewSet):
    serializer_class = RecipeSerializer

    def get_queryset(self):
        queryset = Recipe.objects.select_related("restaurant", "dish").prefetch_related(
            "items__ingredient"
        )
        restaurant_id = self.request.query_params.get("restaurant")
        dish_id = self.request.query_params.get("dish")
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)
        if dish_id:
            queryset = queryset.filter(dish_id=dish_id)
        return queryset
