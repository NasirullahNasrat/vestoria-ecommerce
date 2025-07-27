from rest_framework import serializers
from .models import *
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import uuid


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








class ProductSerializer(serializers.ModelSerializer):
    current_price = serializers.SerializerMethodField()
    in_stock = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    vendor = VendorProfileSerializer(read_only=True)
    category = CategorySerializer(read_only=True)

    def get_current_price(self, obj):
        return obj.current_price

    def get_in_stock(self, obj):
        return obj.stock > 0  # or any condition that determines if the product is in stock

    def get_avg_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews:
            return sum([r.rating for r in reviews]) / reviews.count()
        return None

    def get_review_count(self, obj):
        return obj.reviews.count()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'discount_price',
            'current_price', 'stock', 'in_stock', 'sku',
            'images', 'reviews', 'vendor', 'category',
            'avg_rating', 'review_count',
        ]













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

class VendorProfileSerializer(serializers.ModelSerializer):
    user = UserRegistrationSerializer()
    
    class Meta:
        model = Vendor
        fields = ['user', 'business_name', 'description']
        





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





class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('order_number',)

    def create(self, validated_data):
        # Generate unique order number
        validated_data['order_number'] = str(uuid.uuid4())[:8].upper()
        return super().create(validated_data)










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


