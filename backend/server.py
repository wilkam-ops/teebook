from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List
from datetime import datetime, timedelta
import uuid

from models import (
    User, UserCreate, UserLogin, UserInDB, Token,
    Course, CourseCreate,
    TeeTime, TeeTimeCreate,
    Booking, BookingCreate, BookingStatus,
    Competition, CompetitionCreate, CompetitionStatus,
    Subscription, SubscriptionCreate, SubscriptionStatus,
    UserRole
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_current_admin
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="TeeBook API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= AUTH ROUTES =============

@api_router.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user_dict = {
        "id": user_id,
        "email": user_data.email,
        "firstName": user_data.firstName,
        "lastName": user_data.lastName,
        "handicapIndex": user_data.handicapIndex,
        "role": user_data.role,
        "hashedPassword": hashed_password,
        "createdAt": datetime.utcnow(),
        "isActive": True
    }
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_data.email})
    
    user = User(
        id=user_id,
        email=user_data.email,
        firstName=user_data.firstName,
        lastName=user_data.lastName,
        handicapIndex=user_data.handicapIndex,
        role=user_data.role
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    # Find user
    user_dict = await db.users.find_one({"email": credentials.email})
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user_dict["hashedPassword"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user is active
    if not user_dict.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": credentials.email})
    
    user = User(
        id=user_dict["id"],
        email=user_dict["email"],
        firstName=user_dict["firstName"],
        lastName=user_dict["lastName"],
        handicapIndex=user_dict.get("handicapIndex"),
        role=user_dict["role"],
        createdAt=user_dict["createdAt"],
        isActive=user_dict.get("isActive", True)
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user_email: str = Depends(get_current_user)):
    user_dict = await db.users.find_one({"email": current_user_email})
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return User(
        id=user_dict["id"],
        email=user_dict["email"],
        firstName=user_dict["firstName"],
        lastName=user_dict["lastName"],
        handicapIndex=user_dict.get("handicapIndex"),
        role=user_dict["role"],
        createdAt=user_dict["createdAt"],
        isActive=user_dict.get("isActive", True),
        profileImage=user_dict.get("profileImage")
    )

@api_router.put("/auth/profile-image")
async def update_profile_image(
    profile_image: str,
    current_user_email: str = Depends(get_current_user)
):
    """Update user profile image (base64)"""
    user_dict = await db.users.find_one({"email": current_user_email})
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update profile image
    await db.users.update_one(
        {"email": current_user_email},
        {"$set": {"profileImage": profile_image}}
    )
    
    return {"message": "Profile image updated successfully"}

# ============= COURSES ROUTES =============

@api_router.post("/courses", response_model=Course, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    _: str = Depends(get_current_admin)
):
    course_id = str(uuid.uuid4())
    course_dict = {
        "id": course_id,
        **course_data.dict(),
        "createdAt": datetime.utcnow()
    }
    
    await db.courses.insert_one(course_dict)
    return Course(**course_dict)

@api_router.get("/courses", response_model=List[Course])
async def get_courses():
    courses = await db.courses.find().to_list(1000)
    return [Course(**course) for course in courses]

# ============= TEE TIMES ROUTES =============

@api_router.post("/tee-times", response_model=TeeTime, status_code=status.HTTP_201_CREATED)
async def create_tee_time(
    tee_time_data: TeeTimeCreate,
    _: str = Depends(get_current_admin)
):
    tee_time_id = str(uuid.uuid4())
    tee_time_dict = {
        "id": tee_time_id,
        **tee_time_data.dict(),
        "bookedSlots": 0,
        "availableSlots": tee_time_data.maxSlots,
        "createdAt": datetime.utcnow()
    }
    
    await db.tee_times.insert_one(tee_time_dict)
    return TeeTime(**tee_time_dict)

@api_router.get("/tee-times", response_model=List[TeeTime])
async def get_tee_times(date: str = None, courseId: str = None):
    query = {}
    if date:
        query["date"] = date
    if courseId:
        query["courseId"] = courseId
    
    tee_times = await db.tee_times.find(query).to_list(1000)
    return [TeeTime(**tee_time) for tee_time in tee_times]

# ============= BOOKINGS ROUTES =============

@api_router.post("/bookings", response_model=Booking, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingCreate,
    current_user_email: str = Depends(get_current_user)
):
    # Get user info
    user_dict = await db.users.find_one({"email": current_user_email})
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check tee time availability
    tee_time = await db.tee_times.find_one({"id": booking_data.teeTimeId})
    if not tee_time:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tee time not found"
        )
    
    if tee_time["availableSlots"] < booking_data.playersCount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough available slots"
        )
    
    # Create booking
    booking_id = str(uuid.uuid4())
    booking_dict = {
        "id": booking_id,
        "userId": user_dict["id"],
        **booking_data.dict(),
        "status": BookingStatus.CONFIRMED,
        "createdAt": datetime.utcnow()
    }
    
    await db.bookings.insert_one(booking_dict)
    
    # Update tee time slots
    await db.tee_times.update_one(
        {"id": booking_data.teeTimeId},
        {
            "$inc": {
                "bookedSlots": booking_data.playersCount,
                "availableSlots": -booking_data.playersCount
            }
        }
    )
    
    return Booking(**booking_dict)

@api_router.get("/bookings", response_model=List[Booking])
async def get_user_bookings(current_user_email: str = Depends(get_current_user)):
    user_dict = await db.users.find_one({"email": current_user_email})
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    bookings = await db.bookings.find({"userId": user_dict["id"]}).to_list(1000)
    return [Booking(**booking) for booking in bookings]

@api_router.delete("/bookings/{booking_id}")
async def cancel_booking(
    booking_id: str,
    current_user_email: str = Depends(get_current_user)
):
    user_dict = await db.users.find_one({"email": current_user_email})
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    booking = await db.bookings.find_one({"id": booking_id, "userId": user_dict["id"]})
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    if booking["status"] == BookingStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking already cancelled"
        )
    
    # Update booking status
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": BookingStatus.CANCELLED}}
    )
    
    # Restore tee time slots
    await db.tee_times.update_one(
        {"id": booking["teeTimeId"]},
        {
            "$inc": {
                "bookedSlots": -booking["playersCount"],
                "availableSlots": booking["playersCount"]
            }
        }
    )
    
    return {"message": "Booking cancelled successfully"}

# ============= COMPETITIONS ROUTES =============

@api_router.post("/competitions", response_model=Competition, status_code=status.HTTP_201_CREATED)
async def create_competition(
    competition_data: CompetitionCreate,
    _: str = Depends(get_current_admin)
):
    competition_id = str(uuid.uuid4())
    competition_dict = {
        "id": competition_id,
        **competition_data.dict(),
        "participants": [],
        "status": CompetitionStatus.UPCOMING,
        "createdAt": datetime.utcnow()
    }
    
    await db.competitions.insert_one(competition_dict)
    return Competition(**competition_dict)

@api_router.get("/competitions", response_model=List[Competition])
async def get_competitions():
    competitions = await db.competitions.find().to_list(1000)
    return [Competition(**competition) for competition in competitions]

@api_router.post("/competitions/{competition_id}/register")
async def register_for_competition(
    competition_id: str,
    current_user_email: str = Depends(get_current_user)
):
    user_dict = await db.users.find_one({"email": current_user_email})
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    competition = await db.competitions.find_one({"id": competition_id})
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competition not found"
        )
    
    if user_dict["id"] in competition["participants"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already registered for this competition"
        )
    
    if len(competition["participants"]) >= competition["maxParticipants"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Competition is full"
        )
    
    await db.competitions.update_one(
        {"id": competition_id},
        {"$push": {"participants": user_dict["id"]}}
    )
    
    return {"message": "Successfully registered for competition"}

@api_router.delete("/competitions/{competition_id}/unregister")
async def unregister_from_competition(
    competition_id: str,
    current_user_email: str = Depends(get_current_user)
):
    user_dict = await db.users.find_one({"email": current_user_email})
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    competition = await db.competitions.find_one({"id": competition_id})
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competition not found"
        )
    
    if user_dict["id"] not in competition["participants"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not registered for this competition"
        )
    
    await db.competitions.update_one(
        {"id": competition_id},
        {"$pull": {"participants": user_dict["id"]}}
    )
    
    return {"message": "Successfully unregistered from competition"}

# ============= SUBSCRIPTIONS ROUTES =============

@api_router.post("/subscriptions", response_model=Subscription, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    _: str = Depends(get_current_admin)
):
    subscription_id = str(uuid.uuid4())
    subscription_dict = {
        "id": subscription_id,
        **subscription_data.dict(),
        "createdAt": datetime.utcnow()
    }
    
    await db.subscriptions.insert_one(subscription_dict)
    return Subscription(**subscription_dict)

@api_router.get("/subscriptions/my", response_model=List[Subscription])
async def get_my_subscriptions(current_user_email: str = Depends(get_current_user)):
    user_dict = await db.users.find_one({"email": current_user_email})
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    subscriptions = await db.subscriptions.find({"userId": user_dict["id"]}).to_list(1000)
    return [Subscription(**subscription) for subscription in subscriptions]

# ============= ADMIN ROUTES =============

@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(_: str = Depends(get_current_admin)):
    users = await db.users.find().to_list(1000)
    return [User(
        id=user["id"],
        email=user["email"],
        firstName=user["firstName"],
        lastName=user["lastName"],
        handicapIndex=user.get("handicapIndex"),
        role=user["role"],
        createdAt=user["createdAt"],
        isActive=user.get("isActive", True)
    ) for user in users]

@api_router.get("/admin/bookings", response_model=List[Booking])
async def get_all_bookings(_: str = Depends(get_current_admin)):
    bookings = await db.bookings.find().to_list(1000)
    return [Booking(**booking) for booking in bookings]

@api_router.get("/admin/subscriptions", response_model=List[Subscription])
async def get_all_subscriptions(_: str = Depends(get_current_admin)):
    subscriptions = await db.subscriptions.find().to_list(1000)
    return [Subscription(**subscription) for subscription in subscriptions]

@api_router.get("/admin/dashboard")
async def get_dashboard_stats(_: str = Depends(get_current_admin)):
    total_users = await db.users.count_documents({})
    total_bookings = await db.bookings.count_documents({"status": BookingStatus.CONFIRMED})
    active_subscriptions = await db.subscriptions.count_documents({"status": SubscriptionStatus.ACTIVE})
    upcoming_competitions = await db.competitions.count_documents({"status": CompetitionStatus.UPCOMING})
    
    return {
        "totalUsers": total_users,
        "totalBookings": total_bookings,
        "activeSubscriptions": active_subscriptions,
        "upcomingCompetitions": upcoming_competitions
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
