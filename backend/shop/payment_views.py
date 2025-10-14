# # views.py
# import stripe
# import json
# from django.conf import settings
# from django.http import JsonResponse
# from django.views.decorators.csrf import csrf_exempt
# from django.views.decorators.http import require_POST

# stripe.api_key = settings.STRIPE_SECRET_KEY

# @require_POST
# @csrf_exempt
# def create_payment_intent(request):
#     try:
#         data = json.loads(request.body)
#         print("Received data:", data)  # Debug: See what's coming from React
        
#         # Calculate order amount based on items from React
#         amount = calculate_order_amount(data['items'])
#         print("Calculated amount:", amount)  # Debug: See the calculated amount
        
#         # Create a PaymentIntent with the order amount and currency
#         intent = stripe.PaymentIntent.create(
#             amount=amount,
#             currency='usd',
#             automatic_payment_methods={
#                 'enabled': True,
#             },
#         )
#         return JsonResponse({
#             'clientSecret': intent['client_secret'],
#             'calculatedAmount': amount  # Send back for debugging
#         })
#     except Exception as e:
#         print("Error in create_payment_intent:", str(e))  # Debug: See any errors
#         return JsonResponse({'error': str(e)}, status=403)

# def calculate_order_amount(items):
#     """
#     Calculate the total order amount from items sent by React frontend
#     """
#     total_amount = 0
#     print("Items received for calculation:", items)  # Debug: See items structure
    
#     for item in items:
#         # Try different possible locations for the price
#         price = 0
#         quantity = item.get('quantity', 1)
        
#         # Debug: Print the item structure
#         print(f"Processing item: {item}")
        
#         # Option 1: Price in product_details
#         if 'product_details' in item and item['product_details']:
#             product_details = item['product_details']
#             if 'current_price' in product_details:
#                 price = float(product_details['current_price'])
#                 print(f"Found price in product_details: {price}")
#             elif 'price' in product_details:
#                 price = float(product_details['price'])
#                 print(f"Found price in product_details (alt): {price}")
        
#         # Option 2: Direct price field in item
#         elif 'current_price' in item:
#             price = float(item['current_price'])
#             print(f"Found price in item (current_price): {price}")
#         elif 'price' in item:
#             price = float(item['price'])
#             print(f"Found price in item (price): {price}")
        
#         # Calculate item total
#         item_total = price * quantity * 100  # Convert to cents
#         total_amount += int(item_total)
#         print(f"Item total: {item_total} cents (${price} × {quantity})")
    
#     # Ensure minimum amount is met (Stripe requires at least $0.50)
#     if total_amount < 50:
#         total_amount = 50
    
#     print(f"Final total amount: {total_amount} cents (${total_amount/100})")
#     return total_amount









# views.py
import stripe
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .models import SystemSettings  # Import your SystemSettings model

@require_POST
@csrf_exempt
def create_payment_intent(request):
    try:
        # Load system settings and get Stripe secret key
        system_settings = SystemSettings.load()
        
        if not system_settings.stripe_secret_key:
            return JsonResponse({'error': 'Stripe secret key not configured'}, status=500)
        
        # Set Stripe API key from model
        stripe.api_key = system_settings.stripe_secret_key
        
        data = json.loads(request.body)
        print("Received data:", data)  # Debug: See what's coming from React
        
        # Calculate order amount based on items from React
        amount = calculate_order_amount(data['items'])
        print("Calculated amount:", amount)  # Debug: See the calculated amount
        
        # Create a PaymentIntent with the order amount and currency
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='usd',
            automatic_payment_methods={
                'enabled': True,
            },
        )
        return JsonResponse({
            'clientSecret': intent['client_secret'],
            'calculatedAmount': amount  # Send back for debugging
        })
    except Exception as e:
        print("Error in create_payment_intent:", str(e))  # Debug: See any errors
        return JsonResponse({'error': str(e)}, status=403)

def calculate_order_amount(items):
    """
    Calculate the total order amount from items sent by React frontend
    """
    total_amount = 0
    print("Items received for calculation:", items)  # Debug: See items structure
    
    for item in items:
        # Try different possible locations for the price
        price = 0
        quantity = item.get('quantity', 1)
        
        # Debug: Print the item structure
        print(f"Processing item: {item}")
        
        # Option 1: Price in product_details
        if 'product_details' in item and item['product_details']:
            product_details = item['product_details']
            if 'current_price' in product_details:
                price = float(product_details['current_price'])
                print(f"Found price in product_details: {price}")
            elif 'price' in product_details:
                price = float(product_details['price'])
                print(f"Found price in product_details (alt): {price}")
        
        # Option 2: Direct price field in item
        elif 'current_price' in item:
            price = float(item['current_price'])
            print(f"Found price in item (current_price): {price}")
        elif 'price' in item:
            price = float(item['price'])
            print(f"Found price in item (price): {price}")
        
        # Calculate item total
        item_total = price * quantity * 100  # Convert to cents
        total_amount += int(item_total)
        print(f"Item total: {item_total} cents (${price} × {quantity})")
    
    # Ensure minimum amount is met (Stripe requires at least $0.50)
    if total_amount < 50:
        total_amount = 50
    
    print(f"Final total amount: {total_amount} cents (${total_amount/100})")
    return total_amount