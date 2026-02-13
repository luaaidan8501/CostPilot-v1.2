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
    queryset = Ingredient.objects.select_related("restaurant").all().order_by("name")
    serializer_class = IngredientSerializer


class DishViewSet(viewsets.ModelViewSet):
    queryset = Dish.objects.select_related("restaurant").all().order_by("name")
    serializer_class = DishSerializer


class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.select_related("restaurant", "dish").prefetch_related("items__ingredient")
    serializer_class = RecipeSerializer
