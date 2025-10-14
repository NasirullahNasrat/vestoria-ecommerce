import json
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.conf import settings
from openai import OpenAI
from .models import SystemSettings  # Import the SystemSettings model

# Fixed function: now generates SEO descriptions (with keywords inside)
@csrf_exempt
@require_POST
def generate_seo_keywords(request):
    try:
        # Get system settings with ID=1
        system_settings = SystemSettings.load()
        
        if not system_settings.ai_api_key:
            return JsonResponse({"error": "AI API key is not configured in system settings"}, status=500)
        
        data = json.loads(request.body)
        product_name = data.get('product_name', '')
        product_description = data.get('product_description', '')
        
        # Initialize the OpenAI client with configuration from system settings
        client = OpenAI(
            api_key=system_settings.ai_api_key,
            base_url=system_settings.ap_api_url or "https://api.deepseek.com/v1"
        )
        
        # Create a prompt for DeepSeek
        prompt = f"""
        ACT AS AN SEO SPECIALIST AND E-COMMERCE MARKETING EXPERT.

        TASK: Write an SEO-friendly product description that naturally includes relevant keywords.

        PRODUCT NAME: {product_name}
        PRODUCT DESCRIPTION: {product_description}

        REQUIREMENTS:
        - Write a product description of 150–250 words
        - Naturally weave in 10–15 highly relevant SEO keywords
        - Include both short-tail and long-tail keywords
        - Focus on commercial/buying intent
        - Use synonyms and related terms where appropriate
        - Make it persuasive and engaging for e-commerce customers
        - Ensure keywords flow naturally (avoid keyword stuffing)
        - Return ONLY the description text (no explanations, no formatting instructions)
        """
        
        # Call the API
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=350
        )
        
        ai_content = response.choices[0].message.content.strip()
        
        return JsonResponse({"seo_description": ai_content})
            
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# Improved content generation function
@csrf_exempt
@require_POST
def generate_content(request):
    """
    Generate content based on user instruction - can create descriptions or keywords
    Expected JSON payload:
    {
        "product_info": "Information about the product",
        "instruction": "What to generate (e.g., 'create SEO keywords' or 'write a product description')"
    }
    """
    try:
        # Get system settings with ID=1
        system_settings = SystemSettings.load()
        
        if not system_settings.ai_api_key:
            return JsonResponse({"error": "AI API key is not configured in system settings"}, status=500)
        
        data = json.loads(request.body)
        product_info = data.get('product_info', '')
        instruction = data.get('instruction', '')
        
        if not product_info:
            return JsonResponse({"error": "product_info is required"}, status=400)
            
        if not instruction:
            return JsonResponse({"error": "instruction is required"}, status=400)
        
        # Initialize the OpenAI client with configuration from system settings
        client = OpenAI(
            api_key=system_settings.ai_api_key,
            base_url=system_settings.ap_api_url or "https://api.deepseek.com/v1"
        )
        
        instruction_lower = instruction.lower()
        
        if any(word in instruction_lower for word in ['keyword', 'seo', 'search', 'optimization']):
            # Generate SEO keywords
            prompt = f"""
            ACT AS AN SEO SPECIALIST AND E-COMMERCE MARKETING EXPERT.

            TASK: Generate highly relevant SEO keywords for an e-commerce product.

            PRODUCT INFORMATION: {product_info}
            SPECIFIC INSTRUCTION: {instruction}

            REQUIREMENTS:
            - Generate 10-15 highly relevant SEO keywords
            - Include a mix of short-tail and long-tail keywords
            - Focus on commercial intent keywords (buying keywords)
            - Consider synonyms and related terms
            - Prioritize keywords with good search volume and commercial value
            - Format as a comma-separated list

            Return ONLY the comma-separated keywords without any additional text or explanations.
            """
            max_tokens = 100
            
        elif any(word in instruction_lower for word in ['description', 'describe', 'write', 'create content']):
            # Generate product description with keywords included
            prompt = f"""
            ACT AS AN E-COMMERCE PRODUCT DESCRIPTION WRITER AND SEO EXPERT.
            
            TASK: Create an engaging and persuasive product description for an e-commerce store that includes SEO keywords.
            
            PRODUCT INFORMATION: {product_info}
            SPECIFIC INSTRUCTION: {instruction}
            
            REQUIREMENTS:
            - Write 150-250 words
            - Focus on benefits, not just features
            - Use persuasive language that encourages purchases
            - Include 8–12 relevant SEO keywords naturally
            - Make it engaging and easy to read
            - Ensure the keywords blend smoothly (no keyword stuffing)
            
            Return ONLY the product description without any additional text or explanations.
            """
            max_tokens = 350
            
        else:
            # Generic content generation based on instruction
            prompt = f"""
            ACT AS AN E-COMMERCE CONTENT CREATOR.

            TASK: {instruction}

            PRODUCT INFORMATION: {product_info}

            REQUIREMENTS:
            - Follow the instruction exactly as requested
            - Create high-quality, engaging content
            - Make it suitable for e-commerce use
            - Ensure it's original and persuasive

            Return ONLY the requested content without any additional text or explanations.
            """
            max_tokens = 300
        
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=max_tokens
        )
        
        ai_content = response.choices[0].message.content.strip()
        
        content_type = "keywords" if "keyword" in instruction_lower else "description"
        
        return JsonResponse({
            "content_type": content_type,
            "generated_content": ai_content,
            "instruction": instruction
        })
            
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# Keep the original test endpoint
@require_GET
def test_seo_keywords(request):
    """Test endpoint that returns sample keywords without calling the API"""
    sample_keywords = "wireless headphones, bluetooth headphones, noise cancelling earbuds, wireless earbuds for running, premium audio accessories, best headphones 2023, gaming headset, studio headphones, bass boost earphones"
    
    return JsonResponse({
        "keywords": sample_keywords,
        "message": "This is a test response. Use POST method with product data for real API calls."
    })


# Add a test endpoint for the new content generation function
@require_GET
def test_content_generation(request):
    """Test endpoint for the content generation function"""
    instruction = request.GET.get('instruction', 'create SEO keywords')
    
    if 'description' in instruction.lower():
        sample_content = """Introducing our premium wireless headphones, designed for the ultimate listening experience. These sleek, comfortable headphones feature advanced noise cancellation technology that blocks out distractions, allowing you to immerse yourself completely in your music, podcasts, or calls.

Crafted with premium materials and memory foam ear cushions, these headphones provide all-day comfort without compromising on style. The 40-hour battery life ensures you can enjoy uninterrupted listening throughout your week."""
        content_type = "description"
    else:
        sample_content = "wireless headphones, bluetooth headphones, noise cancelling earbuds, wireless earbuds for running, premium audio accessories"
        content_type = "keywords"
    
    return JsonResponse({
        "content_type": content_type,
        "generated_content": sample_content,
        "instruction": instruction,
        "message": "This is a test response. Use POST method for real API calls."
    })


# Updated health check endpoint to use system settings
@require_GET
def api_health_check(request):
    """Check if the API is accessible and working"""
    try:
        # Get system settings with ID=1
        system_settings = SystemSettings.load()
        
        if not system_settings.ai_api_key:
            return JsonResponse({
                "status": "error",
                "message": "AI API key is not configured in system settings"
            }, status=500)
        
        client = OpenAI(
            api_key=system_settings.ai_api_key,
            base_url=system_settings.ap_api_url or "https://api.deepseek.com/v1"
        )
        
        return JsonResponse({
            "status": "healthy",
            "message": "API endpoint is accessible",
            "api_base": system_settings.ap_api_url or "https://api.deepseek.com/v1",
            "api_key_configured": bool(system_settings.ai_api_key)
        })
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)