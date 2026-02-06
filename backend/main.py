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
if url and key and url != "placeholder" and key != "placeholder":
    try:
        supabase = create_client(url, key)
        print("✓ Supabase connected successfully")
    except Exception as e:
        print(f"✗ Supabase connection failed: {e}")
        supabase = None
else:
    print("! Supabase not configured (using placeholder values)")

class FoodLogEntry(BaseModel):
    raw_text: str
    image_url: Optional[str] = None
    mood_rating: Optional[int] = None

class MacroUpdate(BaseModel):
    total_calories: Optional[int] = None
    total_protein: Optional[float] = None
    total_carbs: Optional[float] = None
    total_fat: Optional[float] = None

class FoodItem(BaseModel):
    name: str
    quantity: str
    calories: int
    protein: float = 0
    carbs: float = 0
    fat: float = 0

class ItemsUpdate(BaseModel):
    items: List[FoodItem]
    recalculate_totals: bool = True

def verify_token(authorization: Optional[str] = Header(None)) -> str:
    """Extract and verify JWT token using Supabase client, return user_id"""
    # Default user for backwards compatibility (if no auth header)
    default_user_id = "00000000-0000-0000-0000-000000000001"
    
    if not authorization or not supabase:
        print("! No authorization header or Supabase not configured, using default user")
        return default_user_id
    
    try:
        # Extract token from "Bearer <token>"
        token = authorization.replace("Bearer ", "")
        
        # Use Supabase to verify the token (modern approach)
        response = supabase.auth.get_user(token)
        user = response.user
        
        if user and user.id:
            print(f"✓ Authenticated user: {user.id}")
            return user.id
        else:
            print("! Invalid token or no user, using default user")
            return default_user_id
        
    except Exception as e:
        print(f"! Token verification failed ({e}), using default user")
        return default_user_id

@app.get("/")
def read_root():
    return {"status": "ok", "service": "AI Food Logger Backend"}

@app.post("/log/food")
async def log_food(entry: FoodLogEntry, user_id: str = Depends(verify_token)):
    # Call LLM Service (with optional image)
    parsed_data = parse_food_entry(entry.raw_text, entry.image_url)
    
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
            print(f"✓ Saved to database: {result}")
            
        except Exception as e:
            print(f"✗ Database save failed: {e}")
            print(f"✗ Food log data: {food_log_data}")
            # Don't fail the request if database save fails
    else:
        print("✗ Supabase not configured - missing SUPABASE_URL or SUPABASE_KEY")
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
                "image_url": log.get("image_url"),  # Include image if available
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
        print(f"✗ History fetch failed: {e}")
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

@app.put("/entries/{entry_id}")
async def update_food_entry(entry_id: str, entry: FoodLogEntry, user_id: str = Depends(verify_token)):
    """Update an existing food log entry"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Verify entry exists and belongs to user
        existing_entry = supabase.table("food_logs").select("*").eq("id", entry_id).eq("user_id", user_id).execute()
        if not existing_entry.data:
            raise HTTPException(status_code=404, detail="Entry not found or access denied")
        
        # Parse the updated text (don't re-analyze unless requested)
        update_data = {
            "raw_input": entry.raw_text,
            "image_url": entry.image_url,
            "mood_rating": entry.mood_rating
        }
        
        result = supabase.table("food_logs").update(update_data).eq("id", entry_id).eq("user_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Entry not found")
            
        return {"status": "success", "message": "Entry updated successfully", "data": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ Update failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update entry: {str(e)}")

@app.delete("/entries/{entry_id}")
async def delete_food_entry(entry_id: str, user_id: str = Depends(verify_token)):
    """Delete a food log entry"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Verify entry exists and belongs to user before deleting
        existing_entry = supabase.table("food_logs").select("id").eq("id", entry_id).eq("user_id", user_id).execute()
        if not existing_entry.data:
            raise HTTPException(status_code=404, detail="Entry not found or access denied")
        
        result = supabase.table("food_logs").delete().eq("id", entry_id).eq("user_id", user_id).execute()
        
        return {"status": "success", "message": "Entry deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ Delete failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete entry: {str(e)}")

@app.post("/entries/{entry_id}/reanalyze")
async def reanalyze_food_entry(entry_id: str, user_id: str = Depends(verify_token)):
    """Re-analyze an existing food log entry with AI"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Get existing entry
        existing_entry = supabase.table("food_logs").select("*").eq("id", entry_id).eq("user_id", user_id).execute()
        if not existing_entry.data:
            raise HTTPException(status_code=404, detail="Entry not found or access denied")
        
        entry_data = existing_entry.data[0]
        
        # Re-run AI analysis on the raw input
        parsed_data = parse_food_entry(entry_data["raw_input"])
        
        # Update with new analysis
        update_data = {
            "parsed_content": {
                "items": parsed_data.get("items", []),
                "mood_analysis": parsed_data.get("mood_analysis", "")
            },
            "macros": {
                "total_calories": parsed_data.get("total_calories", 0),
                "total_protein": parsed_data.get("total_protein", 0),
                "total_carbs": parsed_data.get("total_carbs", 0),
                "total_fat": parsed_data.get("total_fat", 0)
            }
        }
        
        result = supabase.table("food_logs").update(update_data).eq("id", entry_id).eq("user_id", user_id).execute()
        
        return {
            "status": "success", 
            "message": "Entry re-analyzed successfully",
            "analysis": parsed_data,
            "data": result.data[0] if result.data else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ Re-analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to re-analyze entry: {str(e)}")

@app.patch("/entries/{entry_id}/macros")
async def update_macros(entry_id: str, macros: MacroUpdate, user_id: str = Depends(verify_token)):
    """Update macros for an existing food log entry"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Verify entry exists and belongs to user
        existing_entry = supabase.table("food_logs").select("*").eq("id", entry_id).eq("user_id", user_id).execute()
        if not existing_entry.data:
            raise HTTPException(status_code=404, detail="Entry not found or access denied")
        
        # Get current macros and update only provided values
        current_macros = existing_entry.data[0].get("macros", {})
        updated_macros = current_macros.copy()
        
        # Only update provided values
        if macros.total_calories is not None:
            updated_macros["total_calories"] = macros.total_calories
        if macros.total_protein is not None:
            updated_macros["total_protein"] = macros.total_protein
        if macros.total_carbs is not None:
            updated_macros["total_carbs"] = macros.total_carbs
        if macros.total_fat is not None:
            updated_macros["total_fat"] = macros.total_fat
        
        # Update database
        update_data = {
            "macros": updated_macros
        }
        
        result = supabase.table("food_logs").update(update_data).eq("id", entry_id).eq("user_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Entry not found")
            
        return {"status": "success", "message": "Macros updated successfully", "macros": updated_macros}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ Macro update failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update macros: {str(e)}")

@app.patch("/entries/{entry_id}/items")
async def update_items(entry_id: str, items_update: ItemsUpdate, user_id: str = Depends(verify_token)):
    """Update food items for an existing entry"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Verify entry exists and belongs to user
        existing_entry = supabase.table("food_logs").select("*").eq("id", entry_id).eq("user_id", user_id).execute()
        if not existing_entry.data:
            raise HTTPException(status_code=404, detail="Entry not found or access denied")
        
        # Convert items to dict format
        items_data = [item.dict() for item in items_update.items]
        
        # Calculate totals from items if requested
        updated_macros = None
        if items_update.recalculate_totals:
            updated_macros = {
                "total_calories": sum(item.calories for item in items_update.items),
                "total_protein": sum(item.protein for item in items_update.items), 
                "total_carbs": sum(item.carbs for item in items_update.items),
                "total_fat": sum(item.fat for item in items_update.items)
            }
        
        # Update parsed content
        current_parsed = existing_entry.data[0].get("parsed_content", {})
        updated_parsed = current_parsed.copy()
        updated_parsed["items"] = items_data
        
        update_data = {
            "parsed_content": updated_parsed
        }
        
        # Also update macros if recalculating
        if updated_macros:
            update_data["macros"] = updated_macros
        
        result = supabase.table("food_logs").update(update_data).eq("id", entry_id).eq("user_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Entry not found")
            
        return {
            "status": "success", 
            "message": "Items updated successfully", 
            "items": items_data,
            "macros": updated_macros
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ Items update failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update items: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "healthy"}