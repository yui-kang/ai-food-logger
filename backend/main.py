from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware
from services.llm_service import parse_food_entry

load_dotenv()

app = FastAPI(title="AI Food Logger API")

# CORS Setup (Allow Frontend) - Permissive for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins temporarily
    allow_credentials=False,  # Must be False when allow_origins is "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Setup
url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

supabase: Client = None
if url and key:
    supabase = create_client(url, key)

class FoodLogEntry(BaseModel):
    raw_text: str
    image_url: Optional[str] = None
    mood_rating: Optional[int] = None

def verify_token(authorization: Optional[str] = Header(None)) -> str:
    """Extract and verify JWT token using Supabase client, return user_id"""
    # Default user for backwards compatibility (if no auth header)
    default_user_id = "00000000-0000-0000-0000-000000000001"
    
    if not authorization or not supabase:
        print("⚠️ No authorization header or Supabase not configured, using default user")
        return default_user_id
    
    try:
        # Extract token from "Bearer <token>"
        token = authorization.replace("Bearer ", "")
        
        # Use Supabase to verify the token (modern approach)
        response = supabase.auth.get_user(token)
        user = response.user
        
        if user and user.id:
            print(f"✅ Authenticated user: {user.id}")
            return user.id
        else:
            print("⚠️ Invalid token or no user, using default user")
            return default_user_id
        
    except Exception as e:
        print(f"⚠️ Token verification failed ({e}), using default user")
        return default_user_id

@app.get("/")
def read_root():
    return {"status": "ok", "service": "AI Food Logger Backend"}

@app.post("/log/food")
async def log_food(entry: FoodLogEntry, user_id: str = Depends(verify_token)):
    # Call LLM Service
    parsed_data = parse_food_entry(entry.raw_text)
    
    # Save to database if Supabase is configured
    if supabase:
        try:
            # Ensure user exists in profiles (for RLS) - for default user only
            if user_id == "00000000-0000-0000-0000-000000000001":
                try:
                    supabase.table("profiles").upsert({
                        "id": user_id,
                        "email": "default@foodcoin.app",
                        "full_name": "Default User"
                    }).execute()
                except:
                    pass  # User might already exist
            
            food_log_data = {
                "user_id": user_id,
                "raw_input": entry.raw_text,
                "image_url": entry.image_url,
                "parsed_content": {
                    "items": parsed_data.get("items", []),
                    "mood_analysis": parsed_data.get("mood_analysis", "")
                },
                "macros": {
                    "total_calories": parsed_data.get("total_calories", 0),
                    "total_protein": parsed_data.get("total_protein", 0), 
                    "total_carbs": parsed_data.get("total_carbs", 0),
                    "total_fat": parsed_data.get("total_fat", 0)
                },
                "mood_rating": entry.mood_rating
            }
            
            result = supabase.table("food_logs").insert(food_log_data).execute()
            print(f"✅ Saved to database: {result}")
            
        except Exception as e:
            print(f"❌ Database save failed: {e}")
            print(f"❌ Food log data: {food_log_data}")
            # Don't fail the request if database save fails
    else:
        print("❌ Supabase not configured - missing SUPABASE_URL or SUPABASE_KEY")
        print(f"SUPABASE_URL set: {bool(url)}")
        print(f"SUPABASE_KEY set: {bool(key)}")
    
    # Return response (same format as before)
    response_data = {
        "status": "success",
        "input": entry.dict(),
        "analysis": parsed_data
    }
    
    return response_data

@app.get("/history")
async def get_food_history(user_id: str = Depends(verify_token)):
    """Get food log history from database"""
    if not supabase:
        return {"error": "Database not configured"}
    
    try:
        result = supabase.table("food_logs").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        
        # Transform database format to frontend format
        history_data = []
        for log in result.data:
            # Parse the stored JSON data
            parsed_content = log.get("parsed_content", {})
            macros = log.get("macros", {})
            
            history_entry = {
                "id": log["id"],
                "date": log["created_at"][:10],  # Extract date part
                "time": log["created_at"][11:16],  # Extract time part (HH:MM)
                "raw_text": log["raw_input"],
                "mood_analysis": parsed_content.get("mood_analysis", "neutral"),
                "total_calories": macros.get("total_calories", 0),
                "total_protein": macros.get("total_protein", 0),
                "total_carbs": macros.get("total_carbs", 0),
                "total_fat": macros.get("total_fat", 0),
                "items": parsed_content.get("items", [])
            }
            history_data.append(history_entry)
        
        return {"status": "success", "data": history_data}
        
    except Exception as e:
        print(f"❌ History fetch failed: {e}")
        return {"error": f"Failed to fetch history: {str(e)}"}

@app.get("/test-db")
async def test_database():
    """Test database connection"""
    if not supabase:
        return {"status": "error", "message": "Supabase not configured"}
    
    try:
        # Try a simple select to test connection
        result = supabase.table("food_logs").select("id").limit(1).execute()
        return {"status": "success", "message": "Database connected", "data": result.data}
    except Exception as e:
        return {"status": "error", "message": f"Database error: {str(e)}"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}