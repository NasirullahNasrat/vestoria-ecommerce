from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.core.validators import MinValueValidator, EmailValidator
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone


class User(AbstractUser):
    """Custom user model with roles"""
    is_customer = models.BooleanField(default=False)
    is_vendor = models.BooleanField(default=False)
    phone = models.CharField(max_length=20, blank=True)
    profile_pic = models.ImageField(upload_to='profile_pics/', blank=True)

    # Add these to resolve the conflicts
    groups = models.ManyToManyField(
        Group,
        verbose_name=_('groups'),
        blank=True,
        help_text=_(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        related_name="shop_user_set",
        related_query_name="shop_user",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Specific permissions for this user.'),
        related_name="shop_user_set",
        related_query_name="shop_user",
    )

    def __str__(self):
        return self.username


class Customer(models.Model):
    """Customer profile extending User"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True)
    shipping_address = models.ForeignKey(
        'Address', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='shipping_customers'
    )
    billing_address = models.ForeignKey(
        'Address', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='billing_customers'
    )

    def __str__(self):
        return f"Customer: {self.user.username}"


class Vendor(models.Model):
    """Vendor profile extending User"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True)
    business_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    approved = models.BooleanField(default=False)

    def __str__(self):
        return f"Vendor: {self.business_name}"


class Address(models.Model):
    """Address model for customers"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    address_type = models.CharField(max_length=1, choices=[('B', 'Billing'), ('S', 'Shipping')])
    default = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = "Addresses"

    def __str__(self):
        return f"{self.street}, {self.city}, {self.country}"


class Category(models.Model):
    """Product categories with hierarchy"""
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    """Main product model"""
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    discount_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        blank=True, 
        null=True,
        validators=[MinValueValidator(0)]
    )
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    stock = models.PositiveIntegerField(default=0)
    sku = models.CharField(max_length=50, unique=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=True)
    featured = models.BooleanField(default=False)
    thumbnail_image = models.ImageField(upload_to='products/', null=True)

    def __str__(self):
        return self.name

    @property
    def current_price(self):
        return self.discount_price if self.discount_price else self.price


class ProductImage(models.Model):
    """Multiple images per product"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=100, blank=True)
    default = models.BooleanField(default=False)

    def __str__(self):
        return f"Image for {self.product.name}"


class ProductReview(models.Model):
    """Product reviews and ratings"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(choices=[(i, i) for i in range(1, 6)])
    title = models.CharField(max_length=200)
    content = models.TextField()
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review for {self.product.name} by {self.user.username}"


class Order(models.Model):
    """Customer orders"""
    STATUS_CHOICES = [
        ('P', 'Pending'),
        ('C', 'Complete'),
        ('F', 'Failed'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    order_number = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=1, choices=STATUS_CHOICES, default='P')
    shipping_address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, related_name='shipping_orders')
    billing_address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, related_name='billing_orders')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=50)
    paid = models.BooleanField(default=False)

    def __str__(self):
        return f"Order #{self.order_number}"


class OrderItem(models.Model):
    """Items within an order"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

    def get_cost(self):
        return self.price * self.quantity


class Cart(models.Model):
    """Shopping cart"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart for {self.user.username}"

    @property
    def total(self):
        return sum(item.get_cost() for item in self.items.all())


class CartItem(models.Model):
    """Items in the cart"""
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

    def get_cost(self):
        return self.product.current_price * self.quantity


class Coupon(models.Model):
    """Discount coupons"""
    code = models.CharField(max_length=15, unique=True)
    discount = models.DecimalField(max_digits=5, decimal_places=2)
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.code



class ContactSubmission(models.Model):
    # Basic contact information
    name = models.CharField(
        max_length=100,
        verbose_name="Full Name",
        help_text="Enter your full name"
    )
    
    email = models.EmailField(
        max_length=100,
        validators=[EmailValidator()],
        verbose_name="Email Address",
        help_text="Enter a valid email address"
    )
    
    message = models.TextField(
        verbose_name="Your Message",
        help_text="Enter your message here",
        max_length=2000
    )
    
    # Meta information
    submitted_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Submission Date/Time"
    )
    
    is_responded = models.BooleanField(
        default=False,
        verbose_name="Responded?",
        help_text="Mark if this submission has been responded to"
    )
    
    response_notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Response Notes",
        help_text="Any notes about the response",
        max_length=2000
    )
    
    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
        verbose_name="IP Address"
    )
    
    class Meta:
        verbose_name = "Contact Submission"
        verbose_name_plural = "Contact Submissions"
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"Contact from {self.name} ({self.email}) on {self.submitted_at.strftime('%Y-%m-%d %H:%M')}"
    
    def save(self, *args, **kwargs):
        # Add any pre-save logic here
        if not self.submitted_at:
            self.submitted_at = timezone.now()
        super().save(*args, **kwargs)
    
    @property
    def short_message(self):
        """Return a shortened version of the message for admin display"""
        return (self.message[:75] + '...') if len(self.message) > 75 else self.message