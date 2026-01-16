#!/usr/bin/env python

"""
End-to-end test for the Face Attendance System.
Tests the complete flow: Register user -> Register face -> Create class -> Mark attendance via face
"""

import requests
import base64
import os

BASE_URL = "http://localhost:3000/api"
ML_SERVICE_URL = "http://localhost:8000"

# Test data
STUDENT_EMAIL = "e2e_student2@test.com"
TEACHER_EMAIL = "e2e_teacher2@test.com"
PASSWORD = "Test123!"
SAMPLE_IMAGE_PATH = os.path.join(os.path.dirname(__file__), "sample_face.png")

def test_end_to_end():
    print("=" * 60)
    print("🧪 End-to-End Face Attendance System Test")
    print("=" * 60)
    
    # Step 1: Register Teacher
    print("\n📝 Step 1: Registering teacher...")
    resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": TEACHER_EMAIL,
        "password": PASSWORD,
        "firstName": "Test",
        "lastName": "Teacher",
        "role": "teacher"
    })
    print(f"   Response: {resp.status_code} - {resp.text[:200] if resp.text else ''}")
    
    # Step 1b: Login as teacher
    print("\n🔐 Step 1b: Logging in as teacher...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": TEACHER_EMAIL,
        "password": PASSWORD
    })
    if resp.status_code == 200:
        teacher_data = resp.json()
        teacher_token = teacher_data.get("token")
        teacher_id = teacher_data.get("id")
        print(f"   ✅ Teacher logged in (ID: {teacher_id})")
    else:
        print(f"   ❌ Teacher login failed: {resp.text}")
        return
    
    # Step 2: Register Student
    print("\n📝 Step 2: Registering student...")
    resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": STUDENT_EMAIL,
        "password": PASSWORD,
        "firstName": "Test",
        "lastName": "Student",
        "role": "student"
    })
    print(f"   Response: {resp.status_code} - {resp.text[:200] if resp.text else ''}")
    
    # Step 2b: Login as student
    print("\n🔐 Step 2b: Logging in as student...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": STUDENT_EMAIL,
        "password": PASSWORD
    })
    if resp.status_code == 200:
        student_data = resp.json()
        student_token = student_data.get("token")
        student_id = student_data.get("id")
        print(f"   ✅ Student logged in (ID: {student_id})")
    else:
        print(f"   ❌ Student login failed: {resp.text}")
        return
    
    # Step 3: First, let's test the ML service directly
    print("\n� Step 3: Testing ML service directly...")
    if os.path.exists(SAMPLE_IMAGE_PATH):
        with open(SAMPLE_IMAGE_PATH, "rb") as f:
            files = {"file": ("face.png", f, "image/png")}
            resp = requests.post(f"{ML_SERVICE_URL}/embed", files=files)
            print(f"   ML Service /embed response: {resp.status_code}")
            if resp.status_code == 200:
                embed_data = resp.json()
                print(f"   Success: {embed_data.get('success')}")
                if embed_data.get('embedding'):
                    print(f"   Embedding length: {len(embed_data.get('embedding', []))}")
    
    # Step 4: Create a class
    print("\n🏫 Step 4: Creating a test class...")
    headers = {"Authorization": f"Bearer {teacher_token}"}
    import random
    class_code = f"FACE{random.randint(100, 999)}"
    resp = requests.post(f"{BASE_URL}/classes", 
                        json={
                            "name": "Test Face Recognition Class",
                            "code": class_code,
                            "description": "A class for testing face recognition attendance",
                            "startDate": "2025-01-01",
                            "endDate": "2025-12-31",
                            "schedule": "Mon, Wed 10:00 AM"
                        },
                        headers=headers)
    print(f"   Response: {resp.status_code} - {resp.text[:300] if resp.text else ''}")
    if resp.status_code in [200, 201]:
        class_data = resp.json()
        class_id = class_data.get("id") or class_data.get("class", {}).get("id")
        print(f"   ✅ Class created (ID: {class_id})")
    else:
        # Try to get existing class
        resp = requests.get(f"{BASE_URL}/classes", headers=headers)
        if resp.status_code == 200:
            classes = resp.json()
            if isinstance(classes, list) and len(classes) > 0:
                class_id = classes[0].get("id")
                print(f"   ℹ️ Using existing class (ID: {class_id})")
            elif isinstance(classes, dict) and classes.get('classes'):
                class_id = classes['classes'][0].get("id")
                print(f"   ℹ️ Using existing class (ID: {class_id})")
            else:
                class_id = 1
                print(f"   ⚠️ Using default class ID 1")
        else:
            class_id = 1
    
    # Step 5: Enroll student in class
    print("\n👥 Step 5: Enrolling student in class...")
    resp = requests.post(f"{BASE_URL}/classes/{class_id}/enroll", 
                        json={"studentId": student_id},
                        headers=headers)
    print(f"   Enrollment response: {resp.status_code} - {resp.text[:200] if resp.text else ''}")
    
    # Step 6: Register face for student (by calling the service directly or via an endpoint)
    print("\n📷 Step 6: Registering face for student...")
    # The backend should have an endpoint to register face data
    # Let's check what endpoints are available or register via direct service call
    if os.path.exists(SAMPLE_IMAGE_PATH):
        with open(SAMPLE_IMAGE_PATH, "rb") as f:
            image_data = base64.b64encode(f.read()).decode()
        
        # Try to register face data via user update or dedicated endpoint
        headers_student = {"Authorization": f"Bearer {student_token}"}
        # Check if there's a face registration endpoint
        resp = requests.post(f"{BASE_URL}/users/{student_id}/face", 
                           json={"imageData": image_data},
                           headers=headers_student)
        print(f"   Face registration response: {resp.status_code} - {resp.text[:200] if resp.text else ''}")
    
    # Step 7: Mark attendance with face
    print("\n👤 Step 7: Testing face attendance marking...")
    if os.path.exists(SAMPLE_IMAGE_PATH):
        with open(SAMPLE_IMAGE_PATH, "rb") as f:
            image_data = base64.b64encode(f.read()).decode()
        
        headers = {"Authorization": f"Bearer {student_token}"}
        resp = requests.post(f"{BASE_URL}/attendance/face", 
                           json={"classId": class_id, "imageData": image_data},
                           headers=headers)
        print(f"   Response: {resp.status_code}")
        print(f"   Body: {resp.text[:500] if resp.text else 'No response'}")
    
    print("\n" + "=" * 60)
    print("🏁 End-to-End Test Complete!")
    print("=" * 60)

if __name__ == "__main__":
    test_end_to_end()
