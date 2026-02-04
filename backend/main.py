from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware
from services.llm_service import parse_food_entry

load_dotenv()

app = FastAPI(title="AI Food Logger API")

# CORS Setup (Allow Frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app$",  # All Vercel deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Setup
url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")
# supabase: Client = create_client(url, key)

class FoodLogEntry(BaseModel):
    raw_text: str
    image_url: Optional[str] = None
    mood_rating: Optional[int] = None

@app.get("/")
def read_root():
    return {"status": "ok", "service": "AI Food Logger Backend"}

@app.post("/log/food")
async def log_food(entry: FoodLogEntry):
    # Call LLM Service
    parsed_data = parse_food_entry(entry.raw_text)
    
    # Merge with user input (simulated save)
    response_data = {
        "status": "success",
        "input": entry.dict(),
        "analysis": parsed_data
    }
    
    # TODO: Save response_data to Supabase 'food_logs' table
    
    return response_data

@app.get("/health")
def health_check():
    return {"status": "healthy"}