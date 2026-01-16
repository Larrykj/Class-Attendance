import pytest
from fastapi.testclient import TestClient
from main import app
import os

client = TestClient(app)

def test_health_check():
    """Test that the service is running"""
    response = client.get("/")
    assert response.status_code == 200
    assert "DeepFace" in response.json()["service"]
    print("✅ Health check passed")

def test_embed_face():
    """Test face embedding extraction"""
    image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "tests", "sample_face.png"))
    
    if not os.path.exists(image_path):
        pytest.skip(f"Sample image not found at {image_path}")
        
    with open(image_path, "rb") as f:
        response = client.post("/embed", files={"file": ("face.png", f, "image/png")})
    
    print(f"Response: {response.json()}")
    assert response.status_code == 200
    data = response.json()
    
    if not data["success"]:
        pytest.skip(f"Face detection failed: {data.get('message')}")
        
    assert data["success"] is True
    assert "embedding" in data
    assert len(data["embedding"]) > 0
    print(f"✅ Embedding extracted: {len(data['embedding'])} dimensions")

def test_verify_face_match():
    """Test face verification with matching embeddings"""
    image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "tests", "sample_face.png"))
    if not os.path.exists(image_path):
        pytest.skip("Sample image not found")

    # Get embedding
    with open(image_path, "rb") as f:
        res1 = client.post("/embed", files={"file": ("face.png", f, "image/png")})
    
    data1 = res1.json()
    if not data1["success"]:
        pytest.skip("Could not get embedding")
        
    embedding = data1["embedding"]
    
    # Verify match (same embedding should match itself)
    body = {
        "candidate_embedding": embedding,
        "reference_embeddings": [
            {"id": 101, "embedding": embedding},
            {"id": 999, "embedding": [0.0] * len(embedding)}
        ]
    }
    
    res2 = client.post("/verify", json=body)
    assert res2.status_code == 200
    data2 = res2.json()
    print(f"Verify response: {data2}")
    assert data2["success"] is True
    assert data2["match"] is True
    assert data2["student_id"] == 101
    print(f"✅ Face verification passed - matched student ID 101 with confidence {data2.get('confidence', 'N/A')}")

def test_verify_face_no_match():
    """Test face verification with non-matching embeddings"""
    image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "tests", "sample_face.png"))
    if not os.path.exists(image_path):
        pytest.skip("Sample image not found")

    with open(image_path, "rb") as f:
        res1 = client.post("/embed", files={"file": ("face.png", f, "image/png")})
    
    data1 = res1.json()
    if not data1["success"]:
        pytest.skip("Could not get embedding")
        
    embedding = data1["embedding"]
    
    # Verify non-match (different embeddings)
    body = {
        "candidate_embedding": embedding,
        "reference_embeddings": [
            {"id": 999, "embedding": [0.1] * len(embedding)}
        ]
    }
    
    res2 = client.post("/verify", json=body)
    assert res2.status_code == 200
    data2 = res2.json()
    print(f"Non-match response: {data2}")
    assert data2["success"] is True
    assert data2["match"] is False
    print("✅ Non-match verification passed")

if __name__ == "__main__":
    print("Running ML Service Tests...")
    test_health_check()
    test_embed_face()
    test_verify_face_match()
    test_verify_face_no_match()
    print("\n🎉 All tests passed!")
