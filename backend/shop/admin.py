from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, Customer, Vendor, Address, 
    Category, Product, ProductImage, ProductReview,
    Order, OrderItem, Cart, CartItem, Coupon, ContactSubmission, Notification
)

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'is_customer', 'is_vendor', 'is_staff')
    list_filter = ('is_customer', 'is_vendor', 'is_staff', 'is_superuser')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'phone', 'profile_pic')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'is_customer', 'is_vendor', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'is_customer', 'is_vendor'),
        }),
    )

class CustomerAdmin(admin.ModelAdmin):
    list_display = ('user', 'shipping_address', 'billing_address')
    search_fields = ('user__username', 'user__email')

class VendorAdmin(admin.ModelAdmin):
    list_display = ('user', 'business_name', 'approved')
    list_filter = ('approved',)
    search_fields = ('business_name', 'user__username')
    raw_id_fields = ('user',)

class AddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'street', 'city', 'state', 'country', 'address_type', 'default')
    list_filter = ('country', 'address_type', 'default')
    search_fields = ('user__username', 'street', 'city')

class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'vendor', 'price', 'current_price', 'stock', 'active', 'featured')
    list_filter = ('category', 'vendor', 'active', 'featured')
    search_fields = ('name', 'description', 'sku')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline]
    raw_id_fields = ('vendor',)

class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'rating', 'created')
    list_filter = ('rating', 'created')
    search_fields = ('product__name', 'user__username', 'title')

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    raw_id_fields = ('product',)
    extra = 0

class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user', 'status', 'total', 'paid', 'created')
    list_filter = ('status', 'paid', 'created')
    search_fields = ('order_number', 'user__username')
    inlines = [OrderItemInline]

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0

class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'created', 'updated', 'total')
    inlines = [CartItemInline]

class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount', 'valid_from', 'valid_to', 'active')
    list_filter = ('active', 'valid_from', 'valid_to')
    search_fields = ('code',)

# Register all models
admin.site.register(User, CustomUserAdmin)
admin.site.register(Customer, CustomerAdmin)
admin.site.register(Vendor, VendorAdmin)
admin.site.register(Address, AddressAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(Product, ProductAdmin)
admin.site.register(ProductReview, ProductReviewAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(Cart, CartAdmin)
admin.site.register(Coupon, CouponAdmin)
admin.site.register(ContactSubmission)
admin.site.register(Notification)