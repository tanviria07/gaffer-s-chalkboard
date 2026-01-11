"""
FastAPI Agent for Gaffer's Chalkboard
Main entry point for video frame analysis and NFL analogy generation
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import asyncio
from dotenv import load_dotenv
from models.schemas import AnalyzeRequest, AnalyzeResponse, HealthResponse
from services.caption_extractor import YouTubeCaptionExtractor
from services.analogy_generator import AnalogyGenerator
from services.cache_manager import CacheManager
from services.vision_analyzer import VisionAnalyzer
from services.youtube_extractor import YouTubeFrameExtractor

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Gaffer's Chalkboard Agent",
    description="AI-powered video frame analysis and NFL analogy generation",
    version="1.0.0"
)

# CORS configuration
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:8080,http://localhost:5173,http://localhost:8083").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ai_provider = (os.getenv("AI_PROVIDER", "stub")).lower()
api_key = os.getenv("ANTHROPIC_API_KEY") if ai_provider == "anthropic" else os.getenv("ANTHROPIC_API_KEY")

caption_extractor = YouTubeCaptionExtractor()
analogy_generator = AnalogyGenerator(api_key=api_key)
vision_analyzer = VisionAnalyzer(api_key=api_key)
frame_extractor = YouTubeFrameExtractor()
cache = CacheManager()


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_video(request: AnalyzeRequest):
    """
    Main endpoint: Extract frame from video and generate analysis using vision AI
    
    Request body:
    - videoId: Video URL (any site) or YouTube video ID
    - timestamp: Current video timestamp in seconds
    
    Returns:
    - originalCommentary: Soccer commentary from vision analysis
    - nflAnalogy: NFL analogy explanation
    - timestamp: Timestamp used for analysis
    - cached: Whether result was from cache
    """
    try:
        # Check cache first - try exact timestamp and nearby timestamps (±2 seconds)
        base_timestamp = int(request.timestamp)
        cache_keys = [
            f"{request.videoId}:{base_timestamp}",  # Exact match
            f"{request.videoId}:{base_timestamp - 1}",  # 1 second before
            f"{request.videoId}:{base_timestamp + 1}",  # 1 second after
            f"{request.videoId}:{base_timestamp - 2}",  # 2 seconds before
            f"{request.videoId}:{base_timestamp + 2}",  # 2 seconds after
        ]
        
        for cache_key in cache_keys:
            cached = cache.get(cache_key)
            if cached:
                print(f"Cache hit for {cache_key}")
                # Update timestamp to match request
                cached['timestamp'] = request.timestamp
                return AnalyzeResponse(**cached, cached=True)
        
        print(f"Analyzing {request.videoId} at {request.timestamp}s")
        
        # Step 1: Extract frame from video
        print(f"[STEP 1] Extracting frame from video at {request.timestamp}s...")
        frame_base64 = None
        frame_extraction_error = None
        try:
            frame_base64 = await asyncio.wait_for(
                frame_extractor.extract_frame(request.videoId, request.timestamp),
                timeout=5.0  # 5 second timeout for frame extraction
            )
            if frame_base64:
                print(f"[STEP 1] ✓ Frame extracted successfully (size: {len(frame_base64)} chars)")
            else:
                print("[STEP 1] ✗ Frame extraction returned None")
        except asyncio.TimeoutError:
            frame_extraction_error = "Timeout after 5 seconds"
            print(f"[STEP 1] ✗ Frame extraction timed out: {frame_extraction_error}")
        except Exception as e:
            frame_extraction_error = str(e)
            print(f"[STEP 1] ✗ Frame extraction error: {frame_extraction_error}")
            import traceback
            traceback.print_exc()
        
        # Step 2: Generate commentary from frame using vision AI
        commentary = None
        vision_analysis_error = None
        if frame_base64:
            if vision_analyzer.client is None:
                print("[STEP 2] ✗ Vision analyzer not initialized (no API key)")
                vision_analysis_error = "Vision analyzer not initialized - ANTHROPIC_API_KEY not set"
            else:
                print("[STEP 2] Analyzing frame with vision AI...")
                try:
                    commentary = await asyncio.wait_for(
                        vision_analyzer.analyze_frame(frame_base64),
                        timeout=5.0  # 5 second timeout for vision analysis
                    )
                    if commentary:
                        print(f"[STEP 2] ✓ Generated commentary from vision: {commentary[:50]}...")
                    else:
                        print("[STEP 2] ✗ Vision analysis returned empty commentary")
                except asyncio.TimeoutError:
                    vision_analysis_error = "Timeout after 5 seconds"
                    print(f"[STEP 2] ✗ Vision analysis timed out: {vision_analysis_error}")
                except Exception as e:
                    vision_analysis_error = str(e)
                    print(f"[STEP 2] ✗ Vision analysis error: {vision_analysis_error}")
                    import traceback
                    traceback.print_exc()
        else:
            print("[STEP 2] ⏭ Skipping vision analysis - no frame available")
            vision_analysis_error = frame_extraction_error or "Frame extraction failed"
        
        # Step 3: Fallback to captions if vision analysis failed
        if not commentary:
            print(f"[STEP 3] Vision analysis failed ({vision_analysis_error}), trying caption extraction...")
            try:
                commentary = await asyncio.wait_for(
                    caption_extractor.get_caption_at_timestamp(
                        request.videoId,
                        request.timestamp
                    ),
                    timeout=3.0
                )
                if commentary:
                    print(f"[STEP 3] ✓ Found caption: {commentary[:50]}...")
                else:
                    print("[STEP 3] ✗ No captions available")
            except asyncio.TimeoutError:
                print("[STEP 3] ✗ Caption extraction timed out")
            except Exception as e:
                print(f"[STEP 3] ✗ Caption extraction error: {e}")
                import traceback
                traceback.print_exc()
        
        # Step 4: Final fallback to stub commentary
        if not commentary:
            print("[STEP 4] Using stub commentary as final fallback")
            import random
            stubs = [
                "Players are moving into position, creating space for a potential attack.",
                "The team is building up play from the back, looking for passing options.",
                "A counter-attack is developing with players sprinting forward.",
                "Defensive shape is compact, denying space in the central areas.",
                "The ball is in the final third, with attackers looking for an opening."
            ]
            commentary = random.choice(stubs)
            print(f"[STEP 4] ✓ Using stub commentary: {commentary}")
        
        # Step 5: Generate NFL analogy
        print("[STEP 5] Generating NFL analogy...")
        if not api_key:
            # Instant stub - no API call!
            print("[STEP 5] Using stub analogy (no API key)")
            analogy = analogy_generator._generate_stub_analogy(commentary)
        else:
            # Real AI - slower but better
            print("[STEP 5] Using AI to generate analogy...")
            try:
                analogy = await analogy_generator.generate(commentary)
                print(f"[STEP 5] ✓ Generated analogy: {analogy[:50]}...")
            except Exception as e:
                print(f"[STEP 5] ✗ Analogy generation error: {e}, using stub")
                analogy = analogy_generator._generate_stub_analogy(commentary)
        
        # Prepare response
        response_data = {
            "originalCommentary": commentary,
            "nflAnalogy": analogy,
            "timestamp": request.timestamp,
            "cached": False
        }
        
        # Cache for 10 minutes (longer cache for better performance)
        # Use the exact timestamp cache key
        primary_cache_key = f"{request.videoId}:{base_timestamp}"
        cache.set(primary_cache_key, response_data, expire=600)
        
        print(f"[COMPLETE] Analysis complete: {commentary[:50]}...")
        print(f"[SUMMARY] Commentary source: {'Vision AI' if frame_base64 and vision_analyzer.client else 'Captions' if commentary and not any('Players are moving' in commentary or 'The team is building' in commentary) else 'Stub'}")
        return AnalyzeResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Analysis error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    api_key_set = bool(os.getenv("ANTHROPIC_API_KEY"))
    vision_enabled = vision_analyzer.client is not None
    
    return {
        "status": "healthy",
        "service": "gaffer-agent",
        "version": "1.0.0",
        "has_api_key": api_key_set,
        "has_vision": vision_enabled,
        "port": int(os.getenv("PORT", 8000)),
        "message": "Vision analysis enabled" if vision_enabled else "Vision analysis disabled - set ANTHROPIC_API_KEY in .env to enable"
    }


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "Gaffer's Chalkboard Agent",
        "version": "1.0.0",
        "endpoints": {
            "analyze": "/api/analyze",
            "health": "/health",
            "docs": "/docs"
        },
        "ai_provider": ai_provider,
        "vision_enabled": vision_analyzer.client is not None
    }


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"Starting Gaffer's Chalkboard Agent on {host}:{port}")
    print(f"AI Provider: {ai_provider}")
    print(f"Vision Analysis: {'Enabled' if vision_analyzer.client else 'Disabled (no API key)'}")
    print(f"API Docs available at: http://{host}:{port}/docs")
    
    uvicorn.run(app, host=host, port=port)
