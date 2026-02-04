from openai import OpenAI
import os
import json
from typing import Dict, Any
from dotenv import load_dotenv

# Load .env before reading environment variables
load_dotenv()

# Initialize OpenAI Client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def parse_food_entry(text: str) -> Dict[str, Any]:
    """
    Parses a natural language food log using an LLM.
    Returns structured JSON with nutritional info and mood analysis.
    """
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
        "mood_analysis": "brief inference of mood based on text context (e.g., stressed, rushed, happy, neutral)"
    }}

    Food Log: "{text}"
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",  # or gpt-3.5-turbo if cost is a concern
            messages=[
                {"role": "system", "content": "You are a nutritional assistant API. You output only valid JSON."},
                {"role": "user", "content": prompt}
            ],
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
