import api from './api';

export interface Course {
  id: string;
  name: string;
  description?: string;
  holesCount: number;
  createdAt: string;
}

export interface TeeTime {
  id: string;
  courseId: string;
  date: string;
  time: string;
  maxSlots: number;
  bookedSlots: number;
  availableSlots: number;
  createdAt: string;
}

export interface GuestPlayer {
  name: string;
  handicapIndex?: number;
}

export interface Booking {
  id: string;
  userId: string;
  teeTimeId: string;
  playersCount: number;
  guestPlayers: GuestPlayer[];
  status: 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface BookingWithDetails extends Booking {
  teeTime?: TeeTime;
  course?: Course;
}

export const bookingService = {
  // Courses
  getCourses: async (): Promise<Course[]> => {
    const response = await api.get('/courses');
    return response.data;
  },

  // Tee Times
  getTeeTimes: async (date?: string, courseId?: string): Promise<TeeTime[]> => {
    const params: any = {};
    if (date) params.date = date;
    if (courseId) params.courseId = courseId;
    const response = await api.get('/tee-times', { params });
    return response.data;
  },

  // Bookings
  createBooking: async (data: {
    teeTimeId: string;
    playersCount: number;
    guestPlayers: GuestPlayer[];
  }): Promise<Booking> => {
    const response = await api.post('/bookings', data);
    return response.data;
  },

  getMyBookings: async (): Promise<Booking[]> => {
    const response = await api.get('/bookings');
    return response.data;
  },

  cancelBooking: async (bookingId: string): Promise<void> => {
    await api.delete(`/bookings/${bookingId}`);
  }
};
