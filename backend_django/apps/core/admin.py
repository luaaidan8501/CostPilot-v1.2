from django.contrib import admin

from .models import Dish, Ingredient, Recipe, RecipeIngredient, Restaurant

admin.site.register(Restaurant)
admin.site.register(Ingredient)
admin.site.register(Dish)
admin.site.register(Recipe)
admin.site.register(RecipeIngredient)
