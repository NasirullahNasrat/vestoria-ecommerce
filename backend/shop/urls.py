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
    
    # Reviews - Use the views you actually have
    ProductReviewListView,
    ProductReviewCreateView,
    
    # User Profile
    UserProfileView,
    ContactSubmissionCreateView,
    MyTokenObtainPairView,

    DashboardStatsView,
    RecentActivityView,
    AdminOrderListView,
    AdminOrderDetailView,
    CustomerListView,
    CustomerDetailView,
    NotificationListView,
    NotificationMarkAllAsReadView,
    UnreadNotificationCountView,
    NotificationMarkAsReadView,
)

router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')

app_name = 'shop'

urlpatterns = [
    # Authentication URLs
    path('admin_token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
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

    # Product management URLs
    path('products/id/<int:pk>/manage/', ProductUpdateDestroyView.as_view(), name='product-manage-by-id'),
    path('products/<slug:slug>/manage/', ProductUpdateDestroyView.as_view(), name='product-manage-by-slug'),
    
    # Product Review URLs - Add these
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

    # Admin order URLs
    path('orders/admin/', AdminOrderListView.as_view(), name='admin-order-list'),
    path('orders/admin/<int:id>/', AdminOrderDetailView.as_view(), name='admin-order-detail'),
    
    # Coupon URLs
    path('coupons/validate/', CouponValidateView.as_view(), name='coupon-validate'),
    
    # Customer URLs
    path('customer/profile/', CustomerProfileView.as_view(), name='customer-profile'),
    
    # User URLs
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('contact/', ContactSubmissionCreateView.as_view(), name='contact'),

    # Admin URLs
    path('admin/dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('admin/recent-activity/', RecentActivityView.as_view(), name='recent-activity'),
    path('admin/customers/', CustomerListView.as_view(), name='admin-customer-list'),
    path('admin/customers/<int:pk>/', CustomerDetailView.as_view(), name='admin-customer-detail'),

    # Notification URLs
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:notification_id>/read/', NotificationMarkAsReadView.as_view(), name='notification-read'),
    path('notifications/read-all/', NotificationMarkAllAsReadView.as_view(), name='notification-read-all'),
    path('notifications/unread-count/', UnreadNotificationCountView.as_view(), name='notification-unread-count'),

    # Include router URLs (addresses)
    path('', include(router.urls)),
]