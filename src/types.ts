export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  studentId?: string;
  rollNo?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  department: string;
  totalCredits: number;
  tuitionFee?: number;
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  phone: string;
  parentPhone: string;
  courseId: string;
  semester: string;
  enrollmentDate: string;
  totalFee: number;
  status: 'active' | 'inactive';
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  notes?: string;
  markedBy: string; // Teacher or Admin name
  updatedAt: string;
}

export interface FeePayment {
  id: string;
  receiptNo: string;
  studentId: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Credit/Debit Card' | 'Online/UPI' | 'Cheque';
  recordedBy: string;
  notes?: string;
}

export interface StudentAttendanceSummary {
  studentId: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  percentage: number;
  isShortage: boolean; // < 75%
}

export interface StudentFeeSummary {
  studentId: string;
  totalFee: number;
  paidAmount: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid';
  lastPaymentDate?: string;
  paymentsCount: number;
}
