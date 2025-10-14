from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions, viewsets, filters
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.http import Http404
from django.db.models import Q, Sum
from .models import (
    Product, Customer, Vendor, Address, Category,
    Order, OrderItem, Cart, CartItem, Coupon,
    ProductImage, ProductReview, Notification, SystemSettings
)
from .serializers import (
    ProductSerializer, CustomTokenObtainPairSerializer,
    UserRegistrationSerializer, CustomerProfileSerializer,
    VendorProfileSerializer, AddressSerializer, CategorySerializer,
    OrderSerializer, OrderItemSerializer, CartSerializer,
    CartItemSerializer, CouponSerializer, ProductImageSerializer,
    ProductReviewSerializer, NotificationSerializer, ProductReviewSerializer, ProductReviewCreateSerializer, SystemSettingsSerializer, UserProfileSerializer, PasswordChangeSerializer
)

User = get_user_model()

# ==================== Authentication Views ====================
# class CustomTokenObtainPairView(TokenObtainPairView):
#     serializer_class = CustomTokenObtainPairSerializer

#     def post(self, request, *args, **kwargs):
#         response = super().post(request, *args, **kwargs)
#         if response.status_code == 200:
#             user = User.objects.get(username=request.data['username'])
#             response.data['user'] = {
#                 'id': user.id,
#                 'username': user.username,
#                 'email': user.email,
#                 'is_customer': user.is_customer,
#                 'is_vendor': user.is_vendor
#             }
#         return response


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        # Modify the request data to use 'username' field for both username and email
        if 'email' in request.data and 'username' not in request.data:
            request.data._mutable = True
            request.data['username'] = request.data['email']
            request.data._mutable = False
        
        response = super().post(request, *args, **kwargs)
        return response





# ==================== Registration Views ====================
class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "user": {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_customer': user.is_customer,
                'is_vendor': user.is_vendor
            },
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "message": "User created successfully"
        }, status=status.HTTP_201_CREATED)

class CustomerRegistrationView(generics.CreateAPIView):
    serializer_class = CustomerProfileSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        user_data = request.data.get('user', {})
        if not user_data:
            return Response(
                {"error": "User data is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user_data['is_customer'] = True
        user_serializer = UserRegistrationSerializer(data=user_data)
        user_serializer.is_valid(raise_exception=True)
        user = user_serializer.save()
        
        Customer.objects.create(user=user)
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "user": {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_customer': user.is_customer,
                'is_vendor': user.is_vendor
            },
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "message": "Customer registered successfully"
        }, status=status.HTTP_201_CREATED)

class VendorRegistrationView(generics.CreateAPIView):
    serializer_class = VendorProfileSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        user_data = request.data.get('user', {})
        if not user_data:
            return Response(
                {"error": "User data is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user_data['is_vendor'] = True
        user_serializer = UserRegistrationSerializer(data=user_data)
        user_serializer.is_valid(raise_exception=True)
        user = user_serializer.save()
        
        Vendor.objects.create(
            user=user,
            business_name=request.data.get('business_name', ''),
            description=request.data.get('description', '')
        )
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "user": {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_customer': user.is_customer,
                'is_vendor': user.is_vendor
            },
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "message": "Vendor registered successfully"
        }, status=status.HTTP_201_CREATED)









class PasswordChangeView(generics.GenericAPIView):
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        new_password = serializer.validated_data['new_password']
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response(
            {"message": "Password changed successfully"},
            status=status.HTTP_200_OK
        )






# ==================== Product Views ====================
class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'category__name', 'vendor__business_name']
    ordering_fields = ['price', 'created', 'name']

    def get_queryset(self):
        queryset = Product.objects.filter(active=True)
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__slug=category)
            
        # Filter by vendor
        vendor = self.request.query_params.get('vendor', None)
        if vendor:
            queryset = queryset.filter(vendor__id=vendor)
            
        # Filter by price range
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
            
        return queryset

# class ProductDetailView(generics.RetrieveAPIView):
#     queryset = Product.objects.filter(active=True)
#     serializer_class = ProductSerializer
#     permission_classes = [permissions.AllowAny]
#     lookup_field = 'slug'


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        return Product.objects.select_related('vendor', 'category')\
                             .prefetch_related('images', 'reviews')\
                             .filter(active=True)
    
    def get_object(self):
        queryset = self.get_queryset()
        
        # Check which URL pattern was matched
        if 'pk' in self.kwargs:
            # ID-based lookup
            lookup = {'pk': self.kwargs['pk']}
        elif 'slug' in self.kwargs:
            # Slug-based lookup
            lookup = {'slug': self.kwargs['slug']}
        else:
            raise Http404("No valid lookup parameter provided")
        
        try:
            return queryset.get(**lookup)
        except Product.DoesNotExist:
            raise Http404("Product not found")


class ProductCreateView(generics.CreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def perform_create(self, serializer):
        if self.request.user.is_vendor:
            vendor = Vendor.objects.get(user=self.request.user)
            serializer.save(vendor=vendor)
        else:
            raise permissions.PermissionDenied("Only vendors can create products")








# class ProductUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
#     queryset = Product.objects.all()
#     serializer_class = ProductSerializer
#     permission_classes = [permissions.IsAuthenticated]
#     lookup_field = 'id'  # Changed from 'slug' to 'id' to match your frontend

#     def get_serializer_class(self):
#         if self.request.method in ['PUT', 'PATCH']:
#             # Use a different serializer for updates if needed
#             return ProductSerializer
#         return super().get_serializer_class()

#     def perform_update(self, serializer):
#         product = self.get_object()
#         if self.request.user != product.vendor.user and not self.request.user.is_staff:
#             raise permissions.PermissionDenied("You don't have permission to edit this product")
        
#         # Handle images separately if needed
#         images = self.request.FILES.getlist('images')
#         if images:
#             # Clear existing images if needed
#             product.images.all().delete()
#             for image in images:
#                 ProductImage.objects.create(product=product, image=image)
        
#         serializer.save()



class ProductUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # Handle both ID and slug lookups
    def get_object(self):
        queryset = self.get_queryset()
        
        if 'pk' in self.kwargs:
            # ID-based lookup
            lookup = {'pk': self.kwargs['pk']}
        elif 'slug' in self.kwargs:
            # Slug-based lookup
            lookup = {'slug': self.kwargs['slug']}
        else:
            raise Http404("No valid lookup parameter provided")
        
        try:
            return queryset.get(**lookup)
        except Product.DoesNotExist:
            raise Http404("Product not found")

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAdminUser()]
        return super().get_permissions()

    def perform_update(self, serializer):
        product = self.get_object()
        
        # Handle images
        images = self.request.FILES.getlist('images')
        if images:
            # Clear existing images if needed
            product.images.all().delete()
            for image in images:
                ProductImage.objects.create(product=product, image=image)
        
        serializer.save()








# ==================== Category Views ====================
class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class CategoryDetailView(generics.RetrieveAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

# ==================== Address Views ====================
class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Set only one default address per type
        address_type = serializer.validated_data.get('address_type')
        default = serializer.validated_data.get('default', False)
        
        if default and address_type:
            Address.objects.filter(
                user=self.request.user,
                address_type=address_type,
                default=True
            ).update(default=False)
            
        serializer.save(user=self.request.user)

# ==================== Cart Views ====================
class CartDetailView(generics.RetrieveAPIView):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart



class CartItemCreateView(generics.CreateAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        product = serializer.validated_data['product']
        
        # Check if item already exists in cart
        cart_item = CartItem.objects.filter(cart=cart, product=product).first()
        if cart_item:
            cart_item.quantity += serializer.validated_data.get('quantity', 1)
            cart_item.save()
            serializer.instance = cart_item  # Return the updated instance
        else:
            serializer.save(cart=cart)

class CartItemUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return CartItem.objects.filter(cart=cart)

# ==================== Order Views ====================
# Update your OrderListView to ensure proper serialization
class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        
        # Return a properly structured response
        return Response({
            'success': True,
            'count': queryset.count(),
            'orders': serializer.data  # Make sure this is an array
        })

from decimal import Decimal
from rest_framework.permissions import IsAuthenticated











from decimal import Decimal, InvalidOperation
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from rest_framework import status
# from rest_framework.views import APIView



import uuid
from django.db import transaction
from rest_framework import serializers






class OrderCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        cart = Cart.objects.filter(user=user).first()
        
        if not cart or not cart.items.exists():
            return Response(
                {"detail": "Your cart is empty"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create or get addresses (same as before)
        shipping_address_data = request.data.get('shipping_address', {})
        billing_address_data = request.data.get('billing_address', {})
        
        shipping_address = Address.objects.create(
            user=user,
            street=shipping_address_data.get('street'),
            city=shipping_address_data.get('city'),
            state=shipping_address_data.get('state'),
            zip_code=shipping_address_data.get('zip_code'),
            country=shipping_address_data.get('country'),
            address_type='S',
            default=shipping_address_data.get('save', False)
        )
        
        if request.data.get('same_billing_address', True):
            billing_address = shipping_address
        else:
            billing_address = Address.objects.create(
                user=user,
                street=billing_address_data.get('street'),
                city=billing_address_data.get('city'),
                state=billing_address_data.get('state'),
                zip_code=billing_address_data.get('zip_code'),
                country=billing_address_data.get('country'),
                address_type='B',
                default=billing_address_data.get('save', False)
            )

        # Calculate totals
        subtotal = sum(item.get_cost() for item in cart.items.all())
        shipping_cost = request.data.get('shipping_cost', 0)
        total = subtotal + Decimal(str(shipping_cost))

        # Generate unique order_number
        order_number = self.generate_unique_order_number()

        try:
            # Start transaction
            with transaction.atomic():
                # Create order with unique order_number
                order = Order.objects.create(
                    user=user,
                    shipping_address=shipping_address,
                    billing_address=billing_address,
                    shipping_cost=shipping_cost,
                    total=total,
                    payment_method=request.data.get('payment_method', 'credit'),
                    status='P',  # Pending
                    order_number=order_number
                )

                # Create order items from cart items and reduce product stock
                for cart_item in cart.items.all():
                    product = cart_item.product
                    quantity = cart_item.quantity
                    
                    # Check if enough stock is available
                    if product.stock < quantity:
                        raise serializers.ValidationError(
                            f"Not enough stock for {product.name}. Only {product.stock} available."
                        )
                    
                    # Create order item
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        price=product.current_price,
                        quantity=quantity
                    )
                    
                    # Reduce product stock
                    product.stock -= quantity
                    product.save()

                # Clear the cart
                cart.items.all().delete()

                serializer = OrderSerializer(order)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def generate_unique_order_number(self):
        while True:
            order_number = str(uuid.uuid4())[:8].upper()
            if not Order.objects.filter(order_number=order_number).exists():
                return order_number














class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

# ==================== Vendor Views ====================
class VendorListView(generics.ListAPIView):
    queryset = Vendor.objects.filter(approved=True)
    serializer_class = VendorProfileSerializer
    permission_classes = [permissions.AllowAny]

class VendorDetailView(generics.RetrieveAPIView):
    queryset = Vendor.objects.filter(approved=True)
    serializer_class = VendorProfileSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'pk'

class VendorProductsView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        vendor_id = self.kwargs['vendor_id']
        return Product.objects.filter(vendor__id=vendor_id, active=True)

# ==================== Customer Views ====================
class CustomerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = CustomerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return Customer.objects.get(user=self.request.user)

# ==================== Coupon Views ====================
class CouponValidateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response(
                {"error": "Coupon code is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            coupon = Coupon.objects.get(code=code, active=True)
            if coupon.is_valid():
                return Response({
                    "code": coupon.code,
                    "discount": coupon.discount,
                    "valid": True
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "code": coupon.code,
                    "valid": False,
                    "message": "Coupon has expired"
                }, status=status.HTTP_400_BAD_REQUEST)
        except Coupon.DoesNotExist:
            return Response(
                {"error": "Invalid coupon code"},
                status=status.HTTP_404_NOT_FOUND
            )

# ==================== Product Review Views ====================
class ProductReviewCreateView(generics.CreateAPIView):
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        product = Product.objects.get(id=self.kwargs['product_id'])
        serializer.save(user=self.request.user, product=product)

class ProductReviewListView(generics.ListAPIView):
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return ProductReview.objects.filter(product__id=product_id).order_by('-created')

# ==================== User Profile Views ====================
class UserProfileView(generics.RetrieveUpdateAPIView):
    # Use the new serializer for profile updates
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        # Use different serializers for different actions if needed
        if self.request.method == 'PUT' or self.request.method == 'PATCH':
            return UserProfileSerializer
        return UserRegistrationSerializer  # For GET requests if needed



from rest_framework import generics, status
from rest_framework.response import Response
from .models import ContactSubmission
from .serializers import ContactSubmissionSerializer
from django.utils import timezone
from rest_framework.permissions import AllowAny

class ContactSubmissionCreateView(generics.CreateAPIView):
    queryset = ContactSubmission.objects.all()
    serializer_class = ContactSubmissionSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Add additional data before saving
        submission = serializer.save(
            submitted_at=timezone.now(),
            ip_address=self.get_client_ip(request)
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                'status': 'success',
                'message': 'Your message has been submitted successfully',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ContactSubmissionListView(generics.ListAPIView):
    queryset = ContactSubmission.objects.all()
    serializer_class = ContactSubmissionSerializer
    filterset_fields = ['is_responded', 'email']
    ordering_fields = ['submitted_at']
    ordering = ['-submitted_at']






# In your token view or serializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer



class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['is_admin'] = self.user.is_staff  # or self.user.is_superuser
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer











from rest_framework import permissions
from django.db.models import Count, Sum
 

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        total_revenue = Order.objects.filter(status='C').aggregate(
            total=Sum('total')
        )['total'] or 0
        pending_orders = Order.objects.filter(status='P').count()
        support_tickets = ContactSubmission.objects.filter(is_responded=False).count()

        return Response({
            'total_users': total_users,
            'total_revenue': float(total_revenue),  # Convert Decimal to float for JSON
            'pending_orders': pending_orders,
            'support_tickets': support_tickets
        })
    

# views.py
from django.utils import timezone
from datetime import timedelta

class RecentActivityView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        # Get recent user registrations
        recent_users = User.objects.filter(
            date_joined__gte=timezone.now() - timedelta(days=7)
        ).order_by('-date_joined')[:5]

        # Get recent orders
        recent_orders = Order.objects.order_by('-created')[:5]

        # Get recent support tickets
        recent_tickets = ContactSubmission.objects.order_by('-submitted_at')[:5]

        activity = []
        
        for user in recent_users:
            activity.append({
                'type': 'primary',
                'icon': 'user-plus',
                'title': 'New user',
                'description': f'{user.username} registered',
                'timestamp': user.date_joined
            })
            
        for order in recent_orders:
            activity.append({
                'type': 'success',
                'icon': 'shopping-cart',
                'title': 'New order',
                'description': f'#{order.order_number} received',
                'timestamp': order.created
            })
            
        for ticket in recent_tickets:
            activity.append({
                'type': 'info',
                'icon': 'ticket-alt',
                'title': 'Support ticket',
                'description': f'from {ticket.email}',
                'timestamp': ticket.submitted_at
            })
        
        # Sort by timestamp descending
        activity.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return Response(activity[:10])  # Return top 10 most recent


from django.utils import timezone
from datetime import timedelta

class RecentActivityView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        # Get recent user registrations
        recent_users = User.objects.filter(
            date_joined__gte=timezone.now() - timedelta(days=7)
        ).order_by('-date_joined')[:5]

        # Get recent orders
        recent_orders = Order.objects.order_by('-created')[:5]

        # Get recent support tickets
        recent_tickets = ContactSubmission.objects.order_by('-submitted_at')[:5]

        activity = []
        
        for user in recent_users:
            activity.append({
                'type': 'primary',
                'icon': 'user-plus',
                'title': 'New user',
                'description': f'{user.username} registered',
                'timestamp': user.date_joined
            })
            
        for order in recent_orders:
            activity.append({
                'type': 'success',
                'icon': 'shopping-cart',
                'title': 'New order',
                'description': f'#{order.order_number} received',
                'timestamp': order.created
            })
            
        for ticket in recent_tickets:
            activity.append({
                'type': 'info',
                'icon': 'ticket-alt',
                'title': 'Support ticket',
                'description': f'from {ticket.email}',
                'timestamp': ticket.submitted_at
            })
        
        # Sort by timestamp descending
        activity.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return Response(activity[:10])  # Return top 10 most recent









# class AdminOrderListView(generics.ListAPIView):
#     serializer_class = OrderSerializer
#     permission_classes = [permissions.IsAdminUser]
#     queryset = Order.objects.all().order_by('-created')



class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        queryset = Order.objects.all()
        user_id = self.request.query_params.get('user_id')
        if user_id:
            # Make sure you're filtering correctly
            queryset = queryset.filter(user__id=user_id)
        return queryset
    



class AdminOrderDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Order.objects.all()
    lookup_field = 'id'



from .serializers import CustomerSerializer, CustomerCreateUpdateSerializer
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        return Response({
            'links': {
                'next': self.get_next_link(),
                'previous': self.get_previous_link()
            },
            'count': self.page.paginator.count,
            'results': data
        })






# class CustomerListView(generics.ListCreateAPIView):
#     serializer_class = CustomerSerializer
#     permission_classes = [permissions.IsAdminUser]
#     queryset = Customer.objects.all().select_related('user')
#     pagination_class = StandardResultsSetPagination

#     def get_queryset(self):
#         queryset = super().get_queryset()
        
#         # Search filter
#         search = self.request.query_params.get('search', '')
#         if search:
#             queryset = queryset.filter(
#                 Q(user__email__icontains=search) |
#                 Q(user__first_name__icontains=search) |
#                 Q(user__last_name__icontains=search) |
#                 Q(phone__icontains=search)
#             )
        
#         # Role filter
#         role = self.request.query_params.get('role', '')
#         if role.lower() == 'admin':
#             queryset = queryset.filter(user__is_staff=True)
#         elif role.lower() == 'customer':
#             queryset = queryset.filter(user__is_staff=False)
        
#         # Status filter
#         status = self.request.query_params.get('status', '')
#         if status.lower() == 'active':
#             queryset = queryset.filter(user__is_active=True)
#         elif status.lower() == 'inactive':
#             queryset = queryset.filter(user__is_active=False)
        
#         return queryset.order_by('-user__date_joined')

#     def list(self, request, *args, **kwargs):
#         queryset = self.filter_queryset(self.get_queryset())
#         page = self.paginate_queryset(queryset)
        
#         if page is not None:
#             serializer = self.get_serializer(page, many=True)
#             return self.get_paginated_response(serializer.data)
        
#         serializer = self.get_serializer(queryset, many=True)
#         return Response(serializer.data)    
    
from rest_framework.permissions import IsAdminUser

class CustomerListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = CustomerSerializer
    
    def get_queryset(self):
        queryset = User.objects.filter(is_staff=False)  # or your customer model
        
        # Add filtering logic based on query parameters
        search = self.request.query_params.get('search', None)
        role = self.request.query_params.get('role', None)
        status = self.request.query_params.get('status', None)
        
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) | 
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        if role == 'admin':
            queryset = queryset.filter(is_staff=True)
        elif role == 'customer':
            queryset = queryset.filter(is_staff=False)
        
        if status == 'active':
            queryset = queryset.filter(is_active=True)
        elif status == 'inactive':
            queryset = queryset.filter(is_active=False)
        
        return queryset





# class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
#     serializer_class = CustomerSerializer
#     permission_classes = [permissions.IsAdminUser]
#     queryset = Customer.objects.all().select_related('user')

#     def get_serializer_class(self):
#         if self.request.method in ['PUT', 'PATCH']:
#             return CustomerCreateUpdateSerializer
#         return super().get_serializer_class()

#     def perform_update(self, serializer):
#         user_data = {}
#         if 'email' in self.request.data:
#             user_data['email'] = self.request.data['email']
#         if 'first_name' in self.request.data:
#             user_data['first_name'] = self.request.data['first_name']
#         if 'last_name' in self.request.data:
#             user_data['last_name'] = self.request.data['last_name']
#         if 'is_active' in self.request.data:
#             user_data['is_active'] = self.request.data['is_active']
        
#         customer = serializer.save()
#         if user_data:
#             User.objects.filter(id=customer.user.id).update(**user_data)

#     def destroy(self, request, *args, **kwargs):
#         instance = self.get_object()
#         user = instance.user
#         self.perform_destroy(instance)
#         user.delete()  # Also delete the associated user
#         return Response(status=status.HTTP_204_NO_CONTENT)
    





class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.filter(is_staff=False)  # use User not Customer













# class NotificationListView(generics.ListAPIView):
#     serializer_class = NotificationSerializer
#     permission_classes = [permissions.IsAuthenticated]
    
#     def get_queryset(self):
#         return Notification.objects.filter(
#             recipient=self.request.user
#         ).order_by('-created_at')
    

class LimitPagination(PageNumberPagination):
    page_size_query_param = 'limit'
    max_page_size = 100

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = LimitPagination
    
    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by('-created_at')
    



class NotificationMarkAsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=request.user
            )
            notification.is_read = True
            notification.save()
            return Response({'status': 'success'})
        except Notification.DoesNotExist:
            return Response(
                {'error': 'Notification not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class NotificationMarkAllAsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True)
        return Response({'status': 'success'})

class UnreadNotificationCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        return Response({'count': count})
    







from .serializers import ProductCreateSerializer

class ProductCreateView(generics.CreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductCreateSerializer
    permission_classes = [permissions.IsAdminUser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED,
                headers=headers
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        










from django.shortcuts import get_object_or_404

class ProductReviewListView(generics.ListAPIView):
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return ProductReview.objects.filter(product_id=product_id).order_by('-created')

class ProductReviewCreateView(generics.CreateAPIView):
    serializer_class = ProductReviewCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['product'] = get_object_or_404(Product, id=self.kwargs['product_id'])
        return context
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if user already reviewed this product
        product_id = self.kwargs['product_id']
        if ProductReview.objects.filter(user=request.user, product_id=product_id).exists():
            return Response(
                {"error": "You have already reviewed this product."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        # Return the created review with full details
        review_serializer = ProductReviewSerializer(serializer.instance)
        return Response(
            review_serializer.data,
            status=status.HTTP_201_CREATED, 
            headers=headers
        )
    


# views.py
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

class SystemSettingsRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    """
    View to retrieve and update system settings.
    Only one instance exists (singleton pattern).
    """
    serializer_class = SystemSettingsSerializer
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_object(self):
        # Always return the singleton instance
        return SystemSettings.load()
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Handle file uploads separately
        if 'logo' in request.FILES:
            # For file uploads, we need to use the request data directly
            serializer = self.get_serializer(instance, data=request.data, partial=True)
        else:
            # For JSON data, we can use request.data as is
            serializer = self.get_serializer(instance, data=request.data, partial=True)
        
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        except serializers.ValidationError as e:
            return Response(
                {"error": "Validation error", "details": e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": str(e), "details": "An unexpected error occurred"},
                status=status.HTTP_400_BAD_REQUEST
            )




