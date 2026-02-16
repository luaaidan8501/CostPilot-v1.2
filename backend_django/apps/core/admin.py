from django.contrib import admin

from .models import (
    Dish,
    Ingredient,
    PurchaseRecord,
    ReceiptRecord,
    Recipe,
    RecipeIngredient,
    Restaurant,
    SalesRecord,
)

admin.site.register(Restaurant)
admin.site.register(Ingredient)
admin.site.register(Dish)
admin.site.register(Recipe)
admin.site.register(RecipeIngredient)
admin.site.register(PurchaseRecord)
admin.site.register(SalesRecord)
admin.site.register(ReceiptRecord)
