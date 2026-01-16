#!/usr/bin/env python
import requests
import base64
import random

BASE_URL = 'http://localhost:3000/api'
SAMPLE_IMAGE_PATH = 'tests/sample_face.png'

# Login as teacher
print('=== Login as Teacher ===')
resp = requests.post(f'{BASE_URL}/auth/login', json={
    'email': 'e2e_teacher2@test.com',
    'password': 'Test123!'
})
teacher_data = resp.json()
teacher_token = teacher_data.get('token')
teacher_id = teacher_data.get('id')
print(f"Teacher ID: {teacher_id}")

# Create a new class for this teacher
print('\n=== Create Class ===')
headers = {'Authorization': f'Bearer {teacher_token}'}
class_code = f"FACE{random.randint(1000, 9999)}"
resp = requests.post(f'{BASE_URL}/classes', 
                    json={
                        'name': 'Face Recognition Test Class',
                        'code': class_code,
                        'description': 'Testing face attendance',
                        'startDate': '2025-01-01',
                        'endDate': '2025-12-31',
                        'schedule': 'Mon 10:00 AM'
                    },
                    headers=headers)
print(f'Create Class Status: {resp.status_code}')
if resp.status_code in [200, 201]:
    class_data = resp.json()
    class_id = class_data.get('id') or class_data.get('class', {}).get('id')
    print(f'Created class ID: {class_id}')
else:
    print(f'Response: {resp.text[:300]}')
    # Get classes owned by this teacher
    resp = requests.get(f'{BASE_URL}/classes', headers=headers)
    classes = resp.json()
    if isinstance(classes, dict) and 'classes' in classes:
        classes = classes['classes']
    # Find a class owned by this teacher
    for c in classes:
        if c.get('teacherId') == teacher_id:
            class_id = c['id']
            print(f'Using existing class ID: {class_id}')
            break
    else:
        class_id = classes[0]['id'] if classes else 1
        print(f'Using first available class ID: {class_id}')

# Login as student
print('\n=== Login as Student ===')
resp = requests.post(f'{BASE_URL}/auth/login', json={
    'email': 'e2e_student2@test.com',
    'password': 'Test123!'
})
student_data = resp.json()
student_token = student_data.get('token')
student_id = student_data.get('id')
print(f"Student ID: {student_id}")

# Enroll student in this class
print('\n=== Enroll Student ===')
headers = {'Authorization': f'Bearer {teacher_token}'}
resp = requests.post(f'{BASE_URL}/classes/{class_id}/enroll', 
                    json={'studentIds': [student_id]},
                    headers=headers)
print(f'Enroll Status: {resp.status_code} - {resp.text[:200]}')

# Try face attendance
print('\n=== Mark Attendance with Face ===')
with open(SAMPLE_IMAGE_PATH, 'rb') as f:
    image_data = base64.b64encode(f.read()).decode()

headers = {'Authorization': f'Bearer {student_token}'}
resp = requests.post(f'{BASE_URL}/attendance/face', 
                    json={'classId': class_id, 'imageData': image_data},
                    headers=headers)
print(f'Attendance Status: {resp.status_code}')
print(f'Response: {resp.text}')
