#!/usr/bin/env python3
"""
IvoirGolf Backend API Test Suite
Tests all backend endpoints with realistic data
"""

import requests
import json
from datetime import datetime, timedelta
import sys

# Get backend URL from frontend .env
try:
    with open('/app/frontend/.env', 'r') as f:
        for line in f:
            if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                BACKEND_URL = line.split('=')[1].strip()
                break
    API_BASE_URL = f"{BACKEND_URL}/api"
except:
    print("❌ Could not read backend URL from frontend/.env")
    sys.exit(1)

print(f"🔗 Testing API at: {API_BASE_URL}")

# Test data
TEST_USER = {
    "email": "test@ivoirgolf.com",
    "password": "test123",
    "firstName": "Jean",
    "lastName": "Dupont",
    "handicapIndex": 15.5,
    "role": "user"
}

TEST_ADMIN = {
    "email": "admin@ivoirgolf.com", 
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "IvoirGolf",
    "role": "admin"
}

# Global variables for tokens and IDs
user_token = None
admin_token = None
course_id = None
tee_time_id = None
booking_id = None
competition_id = None
subscription_id = None

def make_request(method, endpoint, data=None, headers=None, params=None):
    """Make HTTP request with error handling"""
    url = f"{API_BASE_URL}{endpoint}"
    print(f"    🔗 {method} {url}")
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, params=params, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=10)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        print(f"    📊 Status: {response.status_code}")
        return response
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None

def test_auth_endpoints():
    """Test authentication endpoints"""
    global user_token, admin_token
    
    print("\n🔐 Testing Authentication Endpoints...")
    
    # Test user registration (might already exist)
    print("  📝 Testing user registration...")
    response = make_request("POST", "/auth/register", TEST_USER)
    if response:
        if response.status_code == 201:
            print("  ✅ User registration successful")
        elif response.status_code == 400 and "already registered" in response.text:
            print("  ℹ️  User already exists (expected)")
        else:
            print(f"  ❌ User registration failed: {response.status_code}")
            print(f"      Response: {response.text}")
            return False
    else:
        print("  ❌ User registration failed: No response")
        return False
    
    # Test admin registration (might already exist)
    print("  📝 Testing admin registration...")
    response = make_request("POST", "/auth/register", TEST_ADMIN)
    if response:
        if response.status_code == 201:
            print("  ✅ Admin registration successful")
        elif response.status_code == 400 and "already registered" in response.text:
            print("  ℹ️  Admin already exists (expected)")
        else:
            print(f"  ❌ Admin registration failed: {response.status_code}")
            print(f"      Response: {response.text}")
            return False
    else:
        print("  ❌ Admin registration failed: No response")
        return False
    
    # Test user login
    print("  🔑 Testing user login...")
    response = make_request("POST", "/auth/login", {
        "email": TEST_USER["email"],
        "password": TEST_USER["password"]
    })
    if response and response.status_code == 200:
        data = response.json()
        user_token = data["access_token"]
        print("  ✅ User login successful")
    else:
        print(f"  ❌ User login failed: {response.status_code if response else 'No response'}")
        if response:
            print(f"      Response: {response.text}")
        return False
    
    # Test admin login
    print("  🔑 Testing admin login...")
    response = make_request("POST", "/auth/login", {
        "email": TEST_ADMIN["email"],
        "password": TEST_ADMIN["password"]
    })
    if response and response.status_code == 200:
        data = response.json()
        admin_token = data["access_token"]
        print("  ✅ Admin login successful")
    else:
        print(f"  ❌ Admin login failed: {response.status_code if response else 'No response'}")
        if response:
            print(f"      Response: {response.text}")
        return False
    
    # Test /auth/me with user token
    print("  👤 Testing /auth/me with user token...")
    headers = {"Authorization": f"Bearer {user_token}"}
    response = make_request("GET", "/auth/me", headers=headers)
    if response and response.status_code == 200:
        data = response.json()
        if data["email"] == TEST_USER["email"]:
            print("  ✅ /auth/me working correctly")
        else:
            print("  ❌ /auth/me returned wrong user data")
            return False
    else:
        print(f"  ❌ /auth/me failed: {response.status_code if response else 'No response'}")
        if response:
            print(f"      Response: {response.text}")
        return False
    
    return True

def test_courses_endpoints():
    """Test courses endpoints"""
    global course_id
    
    print("\n🏌️ Testing Courses Endpoints...")
    
    # Test create course (admin only)
    print("  ➕ Testing course creation (admin)...")
    course_data = {
        "name": "Golf Club d'Abidjan",
        "description": "Magnifique parcours 18 trous au cœur d'Abidjan",
        "holesCount": 18
    }
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = make_request("POST", "/courses", course_data, headers)
    if response and response.status_code == 201:
        data = response.json()
        course_id = data["id"]
        print("  ✅ Course creation successful")
    else:
        print(f"  ❌ Course creation failed: {response.status_code if response else 'No response'}")
        return False
    
    # Test get courses (public)
    print("  📋 Testing get courses (public)...")
    response = make_request("GET", "/courses")
    if response and response.status_code == 200:
        data = response.json()
        if len(data) > 0 and any(course["id"] == course_id for course in data):
            print("  ✅ Get courses working correctly")
        else:
            print("  ❌ Created course not found in courses list")
            return False
    else:
        print(f"  ❌ Get courses failed: {response.status_code if response else 'No response'}")
        return False
    
    # Test unauthorized course creation (user token)
    print("  🚫 Testing unauthorized course creation (user)...")
    headers = {"Authorization": f"Bearer {user_token}"}
    response = make_request("POST", "/courses", course_data, headers)
    if response and response.status_code == 403:
        print("  ✅ Unauthorized access properly blocked")
    else:
        print(f"  ❌ Authorization check failed: {response.status_code if response else 'No response'}")
        return False
    
    return True

def test_tee_times_endpoints():
    """Test tee times endpoints"""
    global tee_time_id
    
    print("\n⏰ Testing TeeTime Endpoints...")
    
    if not course_id:
        print("  ❌ No course ID available for tee time testing")
        return False
    
    # Test create tee time (admin only)
    print("  ➕ Testing tee time creation (admin)...")
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    tee_time_data = {
        "courseId": course_id,
        "date": tomorrow,
        "time": "09:00",
        "maxSlots": 4
    }
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = make_request("POST", "/tee-times", tee_time_data, headers)
    if response and response.status_code == 201:
        data = response.json()
        tee_time_id = data["id"]
        print("  ✅ Tee time creation successful")
    else:
        print(f"  ❌ Tee time creation failed: {response.status_code if response else 'No response'}")
        return False
    
    # Test get all tee times
    print("  📋 Testing get all tee times...")
    response = make_request("GET", "/tee-times")
    if response and response.status_code == 200:
        data = response.json()
        if len(data) > 0 and any(tt["id"] == tee_time_id for tt in data):
            print("  ✅ Get all tee times working correctly")
        else:
            print("  ❌ Created tee time not found in list")
            return False
    else:
        print(f"  ❌ Get all tee times failed: {response.status_code if response else 'No response'}")
        return False
    
    # Test get tee times with date filter
    print("  🔍 Testing get tee times with date filter...")
    params = {"date": tomorrow}
    response = make_request("GET", "/tee-times", params=params)
    if response and response.status_code == 200:
        data = response.json()
        if len(data) > 0 and all(tt["date"] == tomorrow for tt in data):
            print("  ✅ Date filter working correctly")
        else:
            print("  ❌ Date filter not working properly")
            return False
    else:
        print(f"  ❌ Date filter test failed: {response.status_code if response else 'No response'}")
        return False
    
    # Test get tee times with course filter
    print("  🔍 Testing get tee times with course filter...")
    params = {"courseId": course_id}
    response = make_request("GET", "/tee-times", params=params)
    if response and response.status_code == 200:
        data = response.json()
        if len(data) > 0 and all(tt["courseId"] == course_id for tt in data):
            print("  ✅ Course filter working correctly")
        else:
            print("  ❌ Course filter not working properly")
            return False
    else:
        print(f"  ❌ Course filter test failed: {response.status_code if response else 'No response'}")
        return False
    
    return True

def test_bookings_endpoints():
    """Test bookings endpoints"""
    global booking_id
    
    print("\n📅 Testing Booking Endpoints...")
    
    if not tee_time_id:
        print("  ❌ No tee time ID available for booking testing")
        return False
    
    # Test create booking (user authenticated)
    print("  ➕ Testing booking creation (user)...")
    booking_data = {
        "teeTimeId": tee_time_id,
        "playersCount": 3,
        "guestPlayers": [
            {"name": "Pierre Martin", "handicapIndex": 12.0},
            {"name": "Marie Kouassi", "handicapIndex": 18.5}
        ]
    }
    headers = {"Authorization": f"Bearer {user_token}"}
    response = make_request("POST", "/bookings", booking_data, headers)
    if response and response.status_code == 201:
        data = response.json()
        booking_id = data["id"]
        print("  ✅ Booking creation successful")
        
        # Verify slots were updated
        response = make_request("GET", "/tee-times")
        if response and response.status_code == 200:
            tee_times = response.json()
            tee_time = next((tt for tt in tee_times if tt["id"] == tee_time_id), None)
            if tee_time and tee_time["availableSlots"] == 1:  # 4 - 3 = 1
                print("  ✅ Tee time slots updated correctly")
            else:
                print("  ❌ Tee time slots not updated properly")
                return False
    else:
        print(f"  ❌ Booking creation failed: {response.status_code if response else 'No response'}")
        return False
    
    # Test get user bookings
    print("  📋 Testing get user bookings...")
    headers = {"Authorization": f"Bearer {user_token}"}
    response = make_request("GET", "/bookings", headers=headers)
    if response and response.status_code == 200:
        data = response.json()
        if len(data) > 0 and any(booking["id"] == booking_id for booking in data):
            print("  ✅ Get user bookings working correctly")
        else:
            print("  ❌ Created booking not found in user bookings")
            return False
    else:
        print(f"  ❌ Get user bookings failed: {response.status_code if response else 'No response'}")
        return False
    
    # Test booking with insufficient slots
    print("  🚫 Testing booking with insufficient slots...")
    booking_data_fail = {
        "teeTimeId": tee_time_id,
        "playersCount": 2,  # Only 1 slot available
        "guestPlayers": []
    }
    headers = {"Authorization": f"Bearer {user_token}"}
    response = make_request("POST", "/bookings", booking_data_fail, headers)
    if response and response.status_code == 400:
        print("  ✅ Insufficient slots properly handled")
    else:
        print(f"  ❌ Insufficient slots check failed: {response.status_code if response else 'No response'}")
        return False
    
    return True

def test_booking_cancellation():
    """Test booking cancellation"""
    print("\n❌ Testing Booking Cancellation...")
    
    if not booking_id:
        print("  ❌ No booking ID available for cancellation testing")
        return False
    
    # Test cancel booking
    print("  🗑️ Testing booking cancellation...")
    headers = {"Authorization": f"Bearer {user_token}"}
    response = make_request("DELETE", f"/bookings/{booking_id}", headers=headers)
    if response and response.status_code == 200:
        print("  ✅ Booking cancellation successful")
        
        # Verify slots were restored
        response = make_request("GET", "/tee-times")
        if response and response.status_code == 200:
            tee_times = response.json()
            tee_time = next((tt for tt in tee_times if tt["id"] == tee_time_id), None)
            if tee_time and tee_time["availableSlots"] == 4:  # Back to original
                print("  ✅ Tee time slots restored correctly")
            else:
                print("  ❌ Tee time slots not restored properly")
                return False
    else:
        print(f"  ❌ Booking cancellation failed: {response.status_code if response else 'No response'}")
        return False
    
    # Test cancel already cancelled booking
    print("  🚫 Testing cancel already cancelled booking...")
    headers = {"Authorization": f"Bearer {user_token}"}
    response = make_request("DELETE", f"/bookings/{booking_id}", headers=headers)
    if response and response.status_code == 400:
        print("  ✅ Already cancelled booking properly handled")
    else:
        print(f"  ❌ Already cancelled check failed: {response.status_code if response else 'No response'}")
        return False
    
    return True

def test_competitions_endpoints():
    """Test competitions endpoints"""
    global competition_id
    
    print("\n🏆 Testing Competition Endpoints...")
    
    # Test create competition (admin only)
    print("  ➕ Testing competition creation (admin)...")
    tomorrow = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    competition_data = {
        "name": "Tournoi Mensuel IvoirGolf",
        "description": "Compétition mensuelle ouverte à tous les membres",
        "date": tomorrow,
        "maxParticipants": 4,
        "entryFee": 25000.0
    }
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = make_request("POST", "/competitions", competition_data, headers)
    if response and response.status_code == 201:
        data = response.json()
        competition_id = data["id"]
        print("  ✅ Competition creation successful")
    else:
        print(f"  ❌ Competition creation failed: {response.status_code if response else 'No response'}")
        return False
    
    # Test get competitions (public)
    print("  📋 Testing get competitions (public)...")
    response = make_request("GET", "/competitions")
    if response and response.status_code == 200:
        data = response.json()
        if len(data) > 0 and any(comp["id"] == competition_id for comp in data):
            print("  ✅ Get competitions working correctly")
        else:
            print("  ❌ Created competition not found in list")
            return False
    else:
        print(f"  ❌ Get competitions failed: {response.status_code if response else 'No response'}")
        return False
    
    # Test register for competition (user)
    print("  📝 Testing competition registration (user)...")
    headers = {"Authorization": f"Bearer {user_token}"}
    response = make_request("POST", f"/competitions/{competition_id}/register", headers=headers)
    if response and response.status_code == 200:
        print("  ✅ Competition registration successful")
        
        # Verify user was added to participants
        response = make_request("GET", "/competitions")
        if response and response.status_code == 200:
            competitions = response.json()
            competition = next((comp for comp in competitions if comp["id"] == competition_id), None)
            if competition and len(competition["participants"]) == 1:
                print("  ✅ Participant added correctly")
            else:
                print("  ❌ Participant not added properly")
                return False
    else:
        print(f"  ❌ Competition registration failed: {response.status_code if response else 'No response'}")
        return False
    
    # Test duplicate registration
    print("  🚫 Testing duplicate registration...")
    headers = {"Authorization": f"Bearer {user_token}"}
    response = make_request("POST", f"/competitions/{competition_id}/register", headers=headers)
    if response and response.status_code == 400:
        print("  ✅ Duplicate registration properly blocked")
    else:
        print(f"  ❌ Duplicate registration check failed: {response.status_code if response else 'No response'}")
        return False
    
    return True

def test_competition_unregister():
    """Test competition unregistration"""
    print("\n🚪 Testing Competition Unregistration...")
    
    if not competition_id:
        print("  ❌ No competition ID available for unregistration testing")
        return False
    
    # Test unregister from competition
    print("  🗑️ Testing competition unregistration...")
    headers = {"Authorization": f"Bearer {user_token}"}
    response = make_request("DELETE", f"/competitions/{competition_id}/unregister", headers=headers)
    if response and response.status_code == 200:
        print("  ✅ Competition unregistration successful")
        
        # Verify user was removed from participants
        response = make_request("GET", "/competitions")
        if response and response.status_code == 200:
            competitions = response.json()
            competition = next((comp for comp in competitions if comp["id"] == competition_id), None)
            if competition and len(competition["participants"]) == 0:
                print("  ✅ Participant removed correctly")
            else:
                print("  ❌ Participant not removed properly")
                return False
    else:
        print(f"  ❌ Competition unregistration failed: {response.status_code if response else 'No response'}")
        return False
    
    return True

def test_subscriptions_endpoints():
    """Test subscriptions endpoints"""
    global subscription_id
    
    print("\n💳 Testing Subscription Endpoints...")
    
    # Get user ID first
    headers = {"Authorization": f"Bearer {user_token}"}
    response = make_request("GET", "/auth/me", headers=headers)
    if not response or response.status_code != 200:
        print("  ❌ Could not get user ID for subscription testing")
        return False
    user_data = response.json()
    user_id = user_data["id"]
    
    # Test create subscription (admin only)
    print("  ➕ Testing subscription creation (admin)...")
    start_date = datetime.now()
    end_date = start_date + timedelta(days=365)
    subscription_data = {
        "userId": user_id,
        "type": "Premium Annual",
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "status": "active"
    }
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = make_request("POST", "/subscriptions", subscription_data, headers)
    if response and response.status_code == 201:
        data = response.json()
        subscription_id = data["id"]
        print("  ✅ Subscription creation successful")
    else:
        print(f"  ❌ Subscription creation failed: {response.status_code if response else 'No response'}")
        return False
    
    # Test get my subscriptions (user)
    print("  📋 Testing get my subscriptions (user)...")
    headers = {"Authorization": f"Bearer {user_token}"}
    response = make_request("GET", "/subscriptions/my", headers=headers)
    if response and response.status_code == 200:
        data = response.json()
        if len(data) > 0 and any(sub["id"] == subscription_id for sub in data):
            print("  ✅ Get my subscriptions working correctly")
        else:
            print("  ❌ Created subscription not found in user subscriptions")
            return False
    else:
        print(f"  ❌ Get my subscriptions failed: {response.status_code if response else 'No response'}")
        return False
    
    return True

def test_admin_endpoints():
    """Test admin endpoints"""
    print("\n👑 Testing Admin Endpoints...")
    
    # Test get all users (admin only)
    print("  👥 Testing get all users (admin)...")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = make_request("GET", "/admin/users", headers=headers)
    if response and response.status_code == 200:
        data = response.json()
        if len(data) >= 2:  # At least test user and admin
            print("  ✅ Get all users working correctly")
        else:
            print("  ❌ Not enough users returned")
            return False
    else:
        print(f"  ❌ Get all users failed: {response.status_code if response else 'No response'}")
        return False
    
    # Test get all bookings (admin only)
    print("  📅 Testing get all bookings (admin)...")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = make_request("GET", "/admin/bookings", headers=headers)
    if response and response.status_code == 200:
        data = response.json()
        print("  ✅ Get all bookings working correctly")
    else:
        print(f"  ❌ Get all bookings failed: {response.status_code if response else 'No response'}")
        return False
    
    # Test get all subscriptions (admin only)
    print("  💳 Testing get all subscriptions (admin)...")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = make_request("GET", "/admin/subscriptions", headers=headers)
    if response and response.status_code == 200:
        data = response.json()
        if len(data) > 0:  # Should have at least the one we created
            print("  ✅ Get all subscriptions working correctly")
        else:
            print("  ❌ No subscriptions returned")
            return False
    else:
        print(f"  ❌ Get all subscriptions failed: {response.status_code if response else 'No response'}")
        return False
    
    # Test dashboard stats (admin only)
    print("  📊 Testing dashboard stats (admin)...")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = make_request("GET", "/admin/dashboard", headers=headers)
    if response and response.status_code == 200:
        data = response.json()
        required_fields = ["totalUsers", "totalBookings", "activeSubscriptions", "upcomingCompetitions"]
        if all(field in data for field in required_fields):
            print("  ✅ Dashboard stats working correctly")
            print(f"    📈 Stats: {data}")
        else:
            print("  ❌ Dashboard stats missing required fields")
            return False
    else:
        print(f"  ❌ Dashboard stats failed: {response.status_code if response else 'No response'}")
        return False
    
    # Test unauthorized access (user trying to access admin endpoints)
    print("  🚫 Testing unauthorized admin access (user)...")
    headers = {"Authorization": f"Bearer {user_token}"}
    response = make_request("GET", "/admin/users", headers=headers)
    if response and response.status_code == 403:
        print("  ✅ Unauthorized admin access properly blocked")
    else:
        print(f"  ❌ Admin authorization check failed: {response.status_code if response else 'No response'}")
        return False
    
    return True

def test_authorization_scenarios():
    """Test various authorization scenarios"""
    print("\n🔒 Testing Authorization Scenarios...")
    
    # Test access without token
    print("  🚫 Testing access without token...")
    response = make_request("GET", "/auth/me")
    if response and response.status_code == 401:
        print("  ✅ No token access properly blocked")
    else:
        print(f"  ❌ No token check failed: {response.status_code if response else 'No response'}")
        if response:
            print(f"      Response: {response.text}")
        return False
    
    # Test access with invalid token
    print("  🚫 Testing access with invalid token...")
    headers = {"Authorization": "Bearer invalid_token_here"}
    response = make_request("GET", "/auth/me", headers=headers)
    if response and response.status_code == 401:
        print("  ✅ Invalid token properly blocked")
    else:
        print(f"  ❌ Invalid token check failed: {response.status_code if response else 'No response'}")
        if response:
            print(f"      Response: {response.text}")
        return False
    
    return True

def run_all_tests():
    """Run all test suites"""
    print("🚀 Starting IvoirGolf Backend API Tests")
    print("=" * 50)
    
    test_results = []
    
    # Run all test suites
    test_suites = [
        ("Authentication", test_auth_endpoints),
        ("Courses", test_courses_endpoints),
        ("TeeTime", test_tee_times_endpoints),
        ("Bookings", test_bookings_endpoints),
        ("Booking Cancellation", test_booking_cancellation),
        ("Competitions", test_competitions_endpoints),
        ("Competition Unregistration", test_competition_unregister),
        ("Subscriptions", test_subscriptions_endpoints),
        ("Admin Endpoints", test_admin_endpoints),
        ("Authorization", test_authorization_scenarios)
    ]
    
    for suite_name, test_func in test_suites:
        try:
            result = test_func()
            test_results.append((suite_name, result))
        except Exception as e:
            print(f"❌ {suite_name} test suite crashed: {e}")
            test_results.append((suite_name, False))
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)
    
    passed = 0
    failed = 0
    
    for suite_name, result in test_results:
        if result:
            print(f"✅ {suite_name}: PASSED")
            passed += 1
        else:
            print(f"❌ {suite_name}: FAILED")
            failed += 1
    
    print(f"\n📈 Total: {passed + failed} tests")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Backend API is working correctly.")
    else:
        print(f"\n⚠️  {failed} test suite(s) failed. Please check the details above.")
    
    return failed == 0

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)