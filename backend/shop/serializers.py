from rest_framework import serializers
from .models import *
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'default']
        read_only_fields = ['id']

class ProductReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()  # Shows the string representation of the user
    
    class Meta:
        model = ProductReview
        fields = ['id', 'user', 'rating', 'title', 'content', 'created']
        read_only_fields = ['id', 'user', 'created']





from django.db.models import Avg


class VendorProfileSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    business_name = serializers.CharField()
    description = serializers.CharField()
    
    class Meta:
        model = Vendor
        fields = ['user', 'business_name', 'description', 'approved']
        read_only_fields = ['approved']
    
    def get_user(self, obj):
        # Return basic user info without sensitive data
        user = obj.user
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'phone': user.phone,
            'is_customer': user.is_customer,
            'is_vendor': user.is_vendor
        }

class CategorySerializer(serializers.ModelSerializer):
    parent = serializers.StringRelatedField()
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'children', 'description', 'image']
        read_only_fields = ['id', 'slug']
    
    def get_children(self, obj):
        # Recursively get child categories
        children = Category.objects.filter(parent=obj)
        serializer = CategorySerializer(children, many=True, context=self.context)
        return serializer.data






# class ProductSerializer(serializers.ModelSerializer):
#     current_price = serializers.SerializerMethodField()
#     in_stock = serializers.SerializerMethodField()
#     avg_rating = serializers.SerializerMethodField()
#     review_count = serializers.SerializerMethodField()
    
#     images = ProductImageSerializer(many=True, read_only=True)
#     reviews = ProductReviewSerializer(many=True, read_only=True)
#     vendor = VendorProfileSerializer(read_only=True)
#     # Change category to use PrimaryKeyRelatedField for writes
#     category = serializers.PrimaryKeyRelatedField(
#         queryset=Category.objects.all(),
#         required=False
#     )

#     def get_current_price(self, obj):
#         return obj.current_price

#     def get_in_stock(self, obj):
#         return obj.stock > 0

#     def get_avg_rating(self, obj):
#         reviews = obj.reviews.all()
#         if reviews:
#             return sum([r.rating for r in reviews]) / reviews.count()
#         return None

#     def get_review_count(self, obj):
#         return obj.reviews.count()

#     class Meta:
#         model = Product
#         fields = [
#             'id', 'name', 'slug', 'description', 'price', 'discount_price',
#             'current_price', 'stock', 'in_stock', 'sku',
#             'images', 'reviews', 'vendor', 'category',
#             'avg_rating', 'review_count', 'featured'
#         ]
#         read_only_fields = ['created', 'updated', 'slug', 'vendor', 'images', 'reviews']






# class ProductSerializer(serializers.ModelSerializer):
#     current_price = serializers.SerializerMethodField()
#     in_stock = serializers.SerializerMethodField()
#     avg_rating = serializers.SerializerMethodField()
#     review_count = serializers.SerializerMethodField()
    
#     images = ProductImageSerializer(many=True, read_only=True)
#     reviews = ProductReviewSerializer(many=True, read_only=True)
#     vendor = VendorProfileSerializer(read_only=True)
#     category = serializers.PrimaryKeyRelatedField(
#         queryset=Category.objects.all(),
#         required=False
#     )

#     def get_current_price(self, obj):
#         return obj.current_price

#     def get_in_stock(self, obj):
#         return obj.stock > 0

#     def get_avg_rating(self, obj):
#         return obj.reviews.aggregate(Avg('rating'))['rating__avg']

#     def get_review_count(self, obj):
#         return obj.reviews.count()

#     class Meta:
#         model = Product
#         fields = [
#             'id', 'name', 'slug', 'description', 'price', 'discount_price',
#             'current_price', 'stock', 'in_stock', 'sku',
#             'images', 'reviews', 'vendor', 'category',
#             'avg_rating', 'review_count', 'featured'
#         ]
#         read_only_fields = ['created', 'updated', 'slug', 'vendor', 'images', 'reviews']
#         extra_kwargs = {
#             'images': {'required': False},
#             'category': {'required': False}
#         }

#     def update(self, instance, validated_data):
#         # Handle partial updates
#         instance.name = validated_data.get('name', instance.name)
#         instance.description = validated_data.get('description', instance.description)
#         instance.price = validated_data.get('price', instance.price)
#         instance.stock = validated_data.get('stock', instance.stock)
#         instance.featured = validated_data.get('featured', instance.featured)
        
#         # Handle category separately
#         if 'category' in validated_data:
#             instance.category = validated_data['category']
        
#         instance.save()
#         return instance



class ProductSerializer(serializers.ModelSerializer):
    current_price = serializers.SerializerMethodField()
    in_stock = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    vendor = VendorProfileSerializer(read_only=True)
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False
    )

    def get_current_price(self, obj):
        return obj.current_price

    def get_in_stock(self, obj):
        return obj.stock > 0

    def get_avg_rating(self, obj):
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0

    def get_review_count(self, obj):
        return obj.reviews.count()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'discount_price',
            'current_price', 'stock', 'in_stock', 'sku',
            'images', 'reviews', 'vendor', 'category',
            'avg_rating', 'review_count', 'featured'
        ]
        read_only_fields = ['created', 'updated', 'slug', 'vendor', 'images', 'reviews']

















class CustomerUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined', 'last_login']

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'is_staff', 'is_active', 'date_joined', 'last_login']
        

class CustomerCreateUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, required=False)
    is_active = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = Customer
        fields = ['id', 'email', 'first_name', 'last_name', 'password', 'phone', 'address', 'birth_date', 'is_active']

    def create(self, validated_data):
        user_data = {
            'email': validated_data.pop('email'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'is_customer': True
        }
        if 'password' in validated_data:
            user_data['password'] = validated_data.pop('password')
        if 'is_active' in validated_data:
            user_data['is_active'] = validated_data.pop('is_active')

        user = User.objects.create_user(**user_data)
        customer = Customer.objects.create(user=user, **validated_data)
        return customer

















User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['is_customer'] = user.is_customer
        token['is_vendor'] = user.is_vendor
        token['username'] = user.username
        return token

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'phone', 'is_customer', 'is_vendor']
    
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords don't match")
        return data
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            phone=validated_data.get('phone', ''),
            is_customer=validated_data.get('is_customer', False),
            is_vendor=validated_data.get('is_vendor', False)
        )
        return user

class CustomerProfileSerializer(serializers.ModelSerializer):
    user = UserRegistrationSerializer()
    
    class Meta:
        model = Customer
        fields = ['user']

# class VendorProfileSerializer(serializers.ModelSerializer):
#     user = UserRegistrationSerializer()
    
#     class Meta:
#         model = Vendor
#         fields = ['user', 'business_name', 'description']
        





class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            'id', 'user', 'street', 'city', 'state', 
            'zip_code', 'country', 'address_type', 'default'
        ]
        read_only_fields = ['id', 'user']

    def validate(self, data):
        # Ensure only one default address per type per user
        if data.get('default', False):
            user = self.context['request'].user
            address_type = data.get('address_type', self.instance.address_type if self.instance else None)
            
            if address_type:
                # Check if there's already a default address of this type
                existing_default = Address.objects.filter(
                    user=user,
                    address_type=address_type,
                    default=True
                ).exclude(pk=self.instance.pk if self.instance else None).exists()
                
                if existing_default:
                    raise serializers.ValidationError(
                        f"You already have a default {address_type} address"
                    )
        return data

class CategorySerializer(serializers.ModelSerializer):
    parent = serializers.StringRelatedField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'description', 'image']
        read_only_fields = ['id', 'slug']

class OrderItemSerializer(serializers.ModelSerializer):
    product = serializers.StringRelatedField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'product', 'price', 'quantity']
        read_only_fields = ['id', 'order', 'price']







# serializers.py
import uuid


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    created_formatted = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'created', 'created_formatted',
            'status', 'status_display', 'payment_method', 'payment_method_display',
            'shipping_address', 'billing_address', 'shipping_cost', 'total',
            'items'
        ]
        read_only_fields = ['order_number', 'created']

    def get_created_formatted(self, obj):
        return obj.created.strftime('%b %d, %Y %I:%M %p') if obj.created else None

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Add any additional formatting here
        representation['total'] = float(representation['total']) if representation.get('total') else 0.0
        return representation







class CartItemSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        required=True  # Make sure product is required
    )
    product_details = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = ['id', 'cart', 'product', 'product_details', 'quantity', 'total_price']
        read_only_fields = ['id', 'cart', 'product_details', 'total_price']
    
    def get_product_details(self, obj):
        return ProductSerializer(obj.product).data
    
    def get_total_price(self, obj):
        return obj.get_cost()



class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    user = serializers.StringRelatedField()
    
    class Meta:
        model = Cart
        fields = ['id', 'user', 'created', 'updated', 'items', 'total']
        read_only_fields = ['id', 'user', 'created', 'updated', 'total']

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ['id', 'code', 'discount', 'valid_from', 'valid_to', 'active']
        read_only_fields = ['id']
    
    def validate(self, data):
        # Validate coupon dates
        valid_from = data.get('valid_from', self.instance.valid_from if self.instance else None)
        valid_to = data.get('valid_to', self.instance.valid_to if self.instance else None)
        
        if valid_from and valid_to and valid_from >= valid_to:
            raise serializers.ValidationError("Valid to date must be after valid from date")
        
        return data





class ContactSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactSubmission
        fields = ['id', 'name', 'email', 'message', 'submitted_at', 'is_responded']
        read_only_fields = ['id', 'submitted_at', 'is_responded']
        extra_kwargs = {
            'name': {
                'error_messages': {
                    'blank': 'Please enter your name',
                    'max_length': 'Name is too long (max 100 characters)'
                }
            },
            'email': {
                'error_messages': {
                    'invalid': 'Please enter a valid email address',
                    'blank': 'Please enter your email'
                }
            },
            'message': {
                'error_messages': {
                    'blank': 'Please enter your message'
                }
            }
        }

    def validate_message(self, value):
        if len(value) < 10:
            raise serializers.ValidationError("Message should be at least 10 characters long")
        return value









class NotificationSerializer(serializers.ModelSerializer):
    time_since = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 
            'title', 
            'message', 
            'notification_type', 
            'is_read', 
            'created_at',
            'time_since',
            'related_object_id'
        ]
        read_only_fields = ['id', 'created_at', 'time_since']
    
    def get_time_since(self, obj):
        return obj.time_since
    












class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'default']

class ProductCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(max_length=100000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )
    thumbnail_image = serializers.ImageField(required=False)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'discount_price',
            'category', 'vendor', 'stock', 'sku', 'featured', 'active',
            'thumbnail_image', 'images'
        ]
        extra_kwargs = {
            'slug': {'required': True},
            'category': {'required': True},
            'vendor': {'required': True},
        }

    def validate(self, data):
        # Validate that discount price is less than regular price if provided
        discount_price = data.get('discount_price')
        if discount_price is not None and discount_price >= data['price']:
            raise serializers.ValidationError(
                "Discount price must be less than regular price"
            )
        
        # Validate SKU uniqueness
        sku = data.get('sku')
        if sku and Product.objects.filter(sku=sku).exists():
            raise serializers.ValidationError(
                {"sku": "A product with this SKU already exists."}
            )
        
        # Validate slug uniqueness
        slug = data.get('slug')
        if slug and Product.objects.filter(slug=slug).exists():
            raise serializers.ValidationError(
                {"slug": "A product with this slug already exists."}
            )
        
        return data

    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        thumbnail_image = validated_data.pop('thumbnail_image', None)
        
        product = Product.objects.create(
            **validated_data,
            thumbnail_image=thumbnail_image
        )
        
        # Create product images
        for image_data in images_data:
            ProductImage.objects.create(
                product=product,
                image=image_data,
                alt_text=product.name
            )
        
        return product
    











# Keep this as your main ProductReviewSerializer
class ProductReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)  # Shows username
    
    class Meta:
        model = ProductReview
        fields = ['id', 'user', 'rating', 'title', 'content', 'created']
        read_only_fields = ['id', 'user', 'created']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    


class ProductReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductReview
        fields = ['rating', 'title', 'content']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def create(self, validated_data):
        # Get product from context
        product = self.context['product']
        # Get user from request
        user = self.context['request'].user
        
        # Check if user already reviewed this product
        if ProductReview.objects.filter(user=user, product=product).exists():
            raise serializers.ValidationError("You have already reviewed this product.")
        
        # Create the review
        review = ProductReview.objects.create(
            product=product,
            user=user,
            **validated_data
        )
        return review