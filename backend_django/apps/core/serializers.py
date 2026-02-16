from rest_framework import serializers

from .models import (
    AlertRecord,
    AnalyticsDataRecord,
    DashboardKPIRecord,
    Dish,
    DishesOverTargetRecord,
    Ingredient,
    PurchaseRecord,
    ReceiptRecord,
    Recipe,
    RecipeIngredient,
    Restaurant,
    SalesRecord,
)


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
    dish_name = serializers.CharField(source="dish.name", read_only=True)
    dish_selling_price = serializers.DecimalField(
        source="dish.selling_price", max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = Recipe
        fields = [
            "id",
            "restaurant",
            "dish",
            "dish_name",
            "dish_selling_price",
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


class PurchaseRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseRecord
        fields = "__all__"


class SalesRecordSerializer(serializers.ModelSerializer):
    dish_id = serializers.IntegerField(source="dish.id", read_only=True)

    class Meta:
        model = SalesRecord
        fields = "__all__"


class ReceiptRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceiptRecord
        fields = "__all__"


class AlertRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertRecord
        fields = "__all__"


class DashboardKPIRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardKPIRecord
        fields = "__all__"


class AnalyticsDataRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsDataRecord
        fields = "__all__"


class DishesOverTargetRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DishesOverTargetRecord
        fields = "__all__"
