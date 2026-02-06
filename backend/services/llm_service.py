from openai import OpenAI
import os
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load .env before reading environment variables
load_dotenv()

# Initialize OpenAI Client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def parse_food_entry(text: str, image_url: Optional[str] = None) -> Dict[str, Any]:
    """
    Parses a natural language food log using an LLM, with optional image analysis.
    Returns structured JSON with nutritional info and mood analysis.
    """
    # Build the prompt based on whether we have an image
    if image_url:
        prompt = f"""
        Analyze the food in this image along with any provided text description.
        
        IMPORTANT: If you don't recognize any food items, do not pattern match. 
        Low confidence should return "unable to identify" for that item.
        Only analyze food items you can clearly see and identify with confidence.
        
        Return a valid JSON object (and ONLY JSON) with this structure:
        {{
            "items": [
                {{
                    "name": "food name or 'unable to identify'",
                    "quantity": "estimated quantity or 'unknown'", 
                    "calories": int (0 if unable to identify),
                    "protein": int (0 if unable to identify),
                    "carbs": int (0 if unable to identify),
                    "fat": int (0 if unable to identify)
                }}
            ],
            "total_calories": int,
            "total_protein": int,
            "total_carbs": int,
            "total_fat": int,
            "mood_analysis": "brief inference of mood from text context (neutral if none)",
            "confidence": "high/medium/low based on image clarity and food recognition"
        }}

        Text description: "{text}"
        """
        
        messages = [
            {"role": "system", "content": "You are a nutritional assistant API. You analyze food images and output only valid JSON. Be conservative with identification - if unsure, say so."},
            {
                "role": "user", 
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]
            }
        ]
        model = "gpt-4o"  # Vision model
    else:
        prompt = f"""
        Analyze the following food log entry. 
        Return a valid JSON object (and ONLY JSON) with this structure:
        {{
            "items": [
                {{
                    "name": "food name",
                    "quantity": "estimated quantity",
                    "calories": int,
                    "protein": int,
                    "carbs": int,
                    "fat": int
                }}
            ],
            "total_calories": int,
            "total_protein": int,
            "total_carbs": int,
            "total_fat": int,
            "mood_analysis": "brief inference of mood based on text context (e.g., stressed, rushed, happy, neutral)",
            "confidence": "high"
        }}

        Food Log: "{text}"
        """
        
        messages = [
            {"role": "system", "content": "You are a nutritional assistant API. You output only valid JSON."},
            {"role": "user", "content": prompt}
        ]
        model = "gpt-4o"

    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from LLM")
            
        return json.loads(content)

    except Exception as e:
        print(f"LLM Error: {e}")
        # Fallback / Error response
        return {
            "error": str(e),
            "raw_text": text,
            "items": [],
            "total_calories": 0,
            "mood_analysis": "Unknown"
        }
