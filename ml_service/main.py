from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
from deepface import DeepFace
import numpy as np
import logging
import os
import tempfile
from typing import List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# DeepFace model to use - Facenet is a good balance of speed and accuracy
MODEL_NAME = "Facenet"

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Face Recognition ML Service (DeepFace)"}

@app.post("/embed")
async def create_embedding(file: UploadFile = File(...)):
    """
    Accepts an image file, detects faces, and returns the face embedding.
    """
    tmp_path = None
    try:
        content = await file.read()
        
        # Save to temp file (DeepFace works with file paths)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        # Get face embedding using DeepFace
        # represent() returns a list of dicts with 'embedding' key
        result = DeepFace.represent(
            img_path=tmp_path,
            model_name=MODEL_NAME,
            enforce_detection=True
        )
        
        if not result or len(result) == 0:
            return {"success": False, "message": "No face detected in the image"}
        
        # Return the first face's embedding
        embedding = result[0]["embedding"]
        
        return {
            "success": True, 
            "embedding": embedding
        }
        
    except ValueError as e:
        # DeepFace raises ValueError when no face is detected
        logger.warning(f"No face detected: {str(e)}")
        return {"success": False, "message": "No face detected in the image"}
    except Exception as e:
        logger.error(f"Error in /embed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

class VerifyBody(BaseModel):
    candidate_embedding: List[float]
    reference_embeddings: List[dict]  # {id: int, embedding: List[float]}

def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))

@app.post("/verify")
async def verify_face(body: VerifyBody):
    """
    Compares a candidate embedding against a list of reference embeddings.
    Returns the ID of the best match if within tolerance.
    """
    try:
        if not body.candidate_embedding or not body.reference_embeddings:
            return {"success": False, "message": "Missing necessary data"}

        best_match_id = None
        best_score = -1.0 
        # Cosine similarity threshold for Facenet embeddings
        threshold = 0.68
        
        for ref in body.reference_embeddings:
            if not ref.get("embedding"):
                continue
                
            score = cosine_similarity(body.candidate_embedding, ref["embedding"])
            
            if score > best_score:
                best_score = score
                best_match_id = ref["id"]
        
        if best_score >= threshold:
            return {
                "success": True,
                "match": True,
                "student_id": best_match_id,
                "confidence": best_score
            }
        else:
            return {
                "success": True,
                "match": False,
                "message": f"No matching face found (Best score: {best_score:.4f})"
            }

    except Exception as e:
        logger.error(f"Error in /verify: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class LivenessCheckRequest(BaseModel):
    images: List[str]  # List of base64 encoded images to check for liveness

@app.post("/liveness")
async def check_liveness(body: LivenessCheckRequest):
    """
    Basic liveness detection by analyzing multiple frames.
    Checks for face presence and basic movement/variation between frames.
    Returns True if the images appear to be from a live person.
    """
    try:
        if not body.images or len(body.images) < 2:
            return {"success": False, "message": "At least 2 images required for liveness check"}
        
        embeddings = []
        
        for i, img_base64 in enumerate(body.images[:5]):  # Max 5 images
            try:
                # Decode base64
                import base64
                img_data = base64.b64decode(img_base64)
                
                with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
                    tmp.write(img_data)
                    tmp_path = tmp.name
                
                try:
                    result = DeepFace.represent(
                        img_path=tmp_path,
                        model_name=MODEL_NAME,
                        enforce_detection=True
                    )
                    
                    if result and len(result) > 0:
                        embeddings.append(result[0]["embedding"])
                finally:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)
                        
            except ValueError:
                # No face detected in this frame
                continue
            except Exception as e:
                logger.warning(f"Error processing frame {i}: {str(e)}")
                continue
        
        if len(embeddings) < 2:
            return {
                "success": True,
                "is_live": False,
                "message": "Could not detect face in enough frames"
            }
        
        # Check for variation between embeddings
        # A static photo would have very similar embeddings across frames
        # A live person would have slight variations due to micro-movements
        variations = []
        for i in range(1, len(embeddings)):
            similarity = cosine_similarity(embeddings[0], embeddings[i])
            variations.append(1 - similarity)  # Convert to distance
        
        avg_variation = sum(variations) / len(variations)
        
        # If there's almost no variation, it might be a photo
        # But too much variation might mean different people
        # Sweet spot is small but detectable variation
        is_live = 0.001 < avg_variation < 0.3
        
        return {
            "success": True,
            "is_live": is_live,
            "confidence": 1.0 - min(avg_variation * 10, 1.0) if is_live else avg_variation,
            "message": "Liveness check passed" if is_live else "Liveness check failed - possible photo attack"
        }

    except Exception as e:
        logger.error(f"Error in /liveness: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
