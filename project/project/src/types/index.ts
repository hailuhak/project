export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'trainer' | 'trainee' | 'user' | 'pending';
  photoURL?: string;
  createdAt: Date;
  lastLogin: Date;
}

export interface Course {
  id: string;
  title: string;
  instructorId: Array<string>;
  instructorName: string;
  hours?: number; // in hours
  duration?: number; // in days
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  startDate: Date;
  endDate: Date;
  students: Array<string>;
  materials: string[];
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  completionRate?: number; // percentage
}

export interface TrainingSession {
  id: string;
  courseId: string;
  courseName: string;
  createdAt: Date;
  date: Date;
  hours: number;
  trainerId: string;
  attendees?: {
    studentId: string;
    studentName: string;
    status?: "present" | "absent";
  }[];
}


export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  details: string;
  timestamp: Date;
}

export interface Progress {
  id: string;
  userId: string;
  courseId: string;
  completedSessions: string[];
  progress: number;          
  lastAccessed: Date;
  certificateIssued: boolean;
}


export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
} 
export interface AttendanceRecord {
  id?: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  status: 'present' | 'absent';
  timestamp: Date;
}
export interface Feedback {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comments: string;
  createdAt: Date;
}

export interface Materials {
  id: string;
  title: string;
  type: 'document' | 'video' | 'link' | 'other';
  url: string;
  description?: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: Date;
  read: boolean;
}     
export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  title: string;
  generatedBy: string;
  generatedAt: Date;
  type: 'user-activity' | 'course-completion' | 'attendance' | 'custom';
  url: string;
}

export interface SystemSettings {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface Pagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  title: string;
  instructorId?: string;
  instructorName?: string;
  hours?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  startDate?: Date;
  endDate?: Date;
  materials?: string[];
  status: 'active' | 'draft' | 'completed' | 'cancelled';
}
interface EnrollmentCourse {
  id: string;       // ✅ add id
  title: string;
  students?: number;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
}
export interface EnrollmentResponse {
  success: boolean;
  data?: EnrollmentCourse[];
  error?: string;
} 

