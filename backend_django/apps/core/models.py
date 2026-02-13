from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Restaurant(TimeStampedModel):
    name = models.CharField(max_length=255)
    region = models.CharField(max_length=120, blank=True)
    city = models.CharField(max_length=120, blank=True)
    target_food_cost_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    def __str__(self) -> str:
        return self.name


class Ingredient(TimeStampedModel):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name="ingredients")
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=80, default="Others")
    unit = models.CharField(max_length=20, default="kg")
    last_purchase_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    benchmark_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    current_stock = models.DecimalField(max_digits=12, decimal_places=3, default=0)

    class Meta:
        unique_together = ("restaurant", "name")

    def __str__(self) -> str:
        return self.name


class Dish(TimeStampedModel):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name="dishes")
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=80, default="Mains")
    selling_price = models.DecimalField(max_digits=12, decimal_places=2)
    has_recipe = models.BooleanField(default=False)

    class Meta:
        unique_together = ("restaurant", "name")

    def __str__(self) -> str:
        return self.name


class Recipe(TimeStampedModel):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name="recipes")
    dish = models.OneToOneField(Dish, on_delete=models.CASCADE, related_name="recipe")
    total_plate_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    food_cost_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)


class RecipeIngredient(TimeStampedModel):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="items")
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity_per_portion = models.DecimalField(max_digits=12, decimal_places=4)
    cost_per_unit = models.DecimalField(max_digits=12, decimal_places=4)
    cost_per_portion = models.DecimalField(max_digits=12, decimal_places=4)

    class Meta:
        unique_together = ("recipe", "ingredient")
