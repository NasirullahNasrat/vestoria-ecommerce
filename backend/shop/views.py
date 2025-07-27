from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions, viewsets, filters
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.http import Http404
from django.db.models import Q, Sum
from decimal import Decimal
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal, InvalidOperation
from rest_framework import generics, status
from rest_framework.response import Response
from .models import ContactSubmission
from .serializers import ContactSubmissionSerializer
from django.utils import timezone
from rest_framework.permissions import AllowAny







from .models import (
    Product, Customer, Vendor, Address, Category,
    Order, OrderItem, Cart, CartItem, Coupon,
    ProductImage, ProductReview
)




from .serializers import (
    ProductSerializer, CustomTokenObtainPairSerializer,
    UserRegistrationSerializer, CustomerProfileSerializer,
    VendorProfileSerializer, AddressSerializer, CategorySerializer,
    OrderSerializer, OrderItemSerializer, CartSerializer,
    CartItemSerializer, CouponSerializer, ProductImageSerializer,
    ProductReviewSerializer
)

User = get_user_model()

# ==================== Authentication Views ====================
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(username=request.data['username'])
            response.data['user'] = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_customer': user.is_customer,
                'is_vendor': user.is_vendor
            }
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

class ProductUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'

    def perform_update(self, serializer):
        product = self.get_object()
        if self.request.user != product.vendor.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("You don't have permission to edit this product")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user != instance.vendor.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("You don't have permission to delete this product")
        instance.active = False
        instance.save()

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
class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created')












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
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        # Don't allow updating password through this endpoint
        if 'password' in request.data:
            request.data.pop('password')
        return super().update(request, *args, **kwargs)








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
