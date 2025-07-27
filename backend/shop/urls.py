from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenVerifyView
from .views import (
    # Authentication
    CustomTokenObtainPairView,
    UserRegistrationView,
    CustomerRegistrationView,
    VendorRegistrationView,
    
    # Products
    ProductListView,
    ProductDetailView,
    ProductCreateView,
    ProductUpdateDestroyView,
    
    # Categories
    CategoryListView,
    CategoryDetailView,
    
    # Addresses
    AddressViewSet,
    
    # Cart
    CartDetailView,
    CartItemCreateView,
    CartItemUpdateDestroyView,
    
    # Orders
    OrderListView,
    OrderCreateView,
    OrderDetailView,
    
    # Vendors
    VendorListView,
    VendorDetailView,
    VendorProductsView,
    
    # Customers
    CustomerProfileView,
    
    # Coupons
    CouponValidateView,
    
    # Reviews
    ProductReviewCreateView,
    ProductReviewListView,
    
    # User Profile
    UserProfileView,
    ContactSubmissionCreateView,
    
)

router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')

app_name = 'shop'

urlpatterns = [
    # Authentication URLs
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('register/customer/', CustomerRegistrationView.as_view(), name='register-customer'),
    path('register/vendor/', VendorRegistrationView.as_view(), name='register-vendor'),
    
    # Product URLs
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/create/', ProductCreateView.as_view(), name='product-create'),
    path('products/id/<int:pk>/', ProductDetailView.as_view(), name='product-detail-by-id'),
    path('products/slug/<slug:slug>/', ProductDetailView.as_view(), name='product-detail-by-slug'),
    path('products/<slug:slug>/manage/', ProductUpdateDestroyView.as_view(), name='product-manage'),
    
    # Product Review URLs
    path('products/<int:product_id>/reviews/', ProductReviewListView.as_view(), name='product-review-list'),
    path('products/<int:product_id>/reviews/create/', ProductReviewCreateView.as_view(), name='product-review-create'),
    
    # Category URLs
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('categories/<slug:slug>/', CategoryDetailView.as_view(), name='category-detail'),
    
    # Vendor URLs
    path('vendors/', VendorListView.as_view(), name='vendor-list'),
    path('vendors/<int:pk>/', VendorDetailView.as_view(), name='vendor-detail'),
    path('vendors/<int:vendor_id>/products/', VendorProductsView.as_view(), name='vendor-products'),
    
    # Cart URLs
    path('cart/', CartDetailView.as_view(), name='cart-detail'),
    path('cart/items/', CartItemCreateView.as_view(), name='cart-item-create'),
    path('cart/items/<int:pk>/', CartItemUpdateDestroyView.as_view(), name='cart-item-manage'),
    
    # Order URLs
    path('orders/', OrderListView.as_view(), name='order-list'),
    path('orders/create/', OrderCreateView.as_view(), name='order-create'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    
    # Coupon URLs
    path('coupons/validate/', CouponValidateView.as_view(), name='coupon-validate'),
    
    # Customer URLs
    path('customer/profile/', CustomerProfileView.as_view(), name='customer-profile'),
    
    # User URLs
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('contact/', ContactSubmissionCreateView.as_view(), name='contact' ),
    
    # Include router URLs (addresses)
    path('', include(router.urls)),
]