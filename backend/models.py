from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"

class BookingStatus(str, Enum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"

class CompetitionStatus(str, Enum):
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# User Models
class UserBase(BaseModel):
    email: EmailStr
    firstName: str
    lastName: str
    handicapIndex: Optional[float] = None
    role: UserRole = UserRole.USER
    profileImage: Optional[str] = None  # Base64 image

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = True

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}

class UserInDB(User):
    hashedPassword: str

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    email: Optional[str] = None

# Subscription Models
class SubscriptionBase(BaseModel):
    type: str
    startDate: datetime
    endDate: datetime
    status: SubscriptionStatus

class SubscriptionCreate(SubscriptionBase):
    userId: str

class Subscription(SubscriptionBase):
    id: str
    userId: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}

# Course Models
class CourseBase(BaseModel):
    name: str
    description: Optional[str] = None
    holesCount: int = 18

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    id: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}

# TeeTime Models
class TeeTimeBase(BaseModel):
    courseId: str
    date: str  # Format: YYYY-MM-DD
    time: str  # Format: HH:MM
    maxSlots: int = 4

class TeeTimeCreate(TeeTimeBase):
    pass

class TeeTime(TeeTimeBase):
    id: str
    bookedSlots: int = 0
    availableSlots: int = 4
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}

# Booking Models
class GuestPlayer(BaseModel):
    name: str
    handicapIndex: Optional[float] = None

class BookingBase(BaseModel):
    teeTimeId: str
    playersCount: int = 1
    guestPlayers: List[GuestPlayer] = []

class BookingCreate(BookingBase):
    pass

class Booking(BookingBase):
    id: str
    userId: str
    status: BookingStatus = BookingStatus.CONFIRMED
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}

# Competition Models
class CompetitionBase(BaseModel):
    name: str
    description: Optional[str] = None
    date: str  # Format: YYYY-MM-DD
    maxParticipants: int
    entryFee: float = 0.0

class CompetitionCreate(CompetitionBase):
    pass

class Competition(CompetitionBase):
    id: str
    participants: List[str] = []  # List of user IDs
    status: CompetitionStatus = CompetitionStatus.UPCOMING
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}
