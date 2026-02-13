from rest_framework import serializers

from .models import Dish, Ingredient, Recipe, RecipeIngredient, Restaurant


class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = "__all__"


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = "__all__"


class DishSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dish
        fields = "__all__"


class RecipeIngredientSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source="ingredient.name", read_only=True)

    class Meta:
        model = RecipeIngredient
        fields = [
            "id",
            "ingredient",
            "ingredient_name",
            "quantity_per_portion",
            "cost_per_unit",
            "cost_per_portion",
        ]


class RecipeSerializer(serializers.ModelSerializer):
    items = RecipeIngredientSerializer(many=True, required=False)

    class Meta:
        model = Recipe
        fields = [
            "id",
            "restaurant",
            "dish",
            "total_plate_cost",
            "food_cost_percentage",
            "items",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        recipe = Recipe.objects.create(**validated_data)
        for item in items_data:
            RecipeIngredient.objects.create(recipe=recipe, **item)
        return recipe

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                RecipeIngredient.objects.create(recipe=instance, **item)

        return instance
