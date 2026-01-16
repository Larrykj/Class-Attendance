import requests
import base64
import os
import json

BASE_URL = "http://localhost:8000"
SAMPLE_IMAGE_PATH = os.path.join(os.path.dirname(__file__), "sample_face.png")

def test_liveness_endpoint():
    print("=" * 60)
    print("🧪 Testing Liveness Detection Endpoint")
    print("=" * 60)
    
    if not os.path.exists(SAMPLE_IMAGE_PATH):
        print(f"❌ Sample image not found at {SAMPLE_IMAGE_PATH}")
        return

    with open(SAMPLE_IMAGE_PATH, "rb") as f:
        image_data = base64.b64encode(f.read()).decode()
    
    # Case 1: Single image (Should fail validation)
    print("\n📝 Test 1: Sending single image (Expect error)")
    payload = {"images": [image_data]}
    resp = requests.post(f"{BASE_URL}/liveness", json=payload)
    print(f"   Status: {resp.status_code}")
    print(f"   Response: {resp.json()}")
    
    # Case 2: Same image duplicated (Static photo attack)
    print("\n📝 Test 2: Sending duplicate images (Static photo attack)")
    # Simulating a video feed where the frames are identical (spoofing with a static photo)
    payload = {"images": [image_data, image_data, image_data]}
    resp = requests.post(f"{BASE_URL}/liveness", json=payload)
    print(f"   Status: {resp.status_code}")
    data = resp.json()
    print(f"   Response: {data}")
    
    if data.get("success") and not data.get("is_live"):
        print("   ✅ correctly detected static images as non-live")
    else:
        print("   ⚠️ Unexpected result for static images")

    # Case 3 (Hypothetical): We can't easily simulate "real" liveness with just one static image
    # as we need slight variations. 
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    test_liveness_endpoint()
