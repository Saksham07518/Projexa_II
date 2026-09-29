import { Student, Course, AttendanceRecord, FeePayment, User } from '../types';
import { INITIAL_USERS, INITIAL_COURSES, INITIAL_STUDENTS, INITIAL_ATTENDANCE, INITIAL_PAYMENTS } from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'erp_users_v2_in',
  CURRENT_USER: 'erp_current_user_v2_in',
  COURSES: 'erp_courses_v2_in',
  STUDENTS: 'erp_students_v2_in',
  ATTENDANCE: 'erp_attendance_v2_in',
  PAYMENTS: 'erp_payments_v2_in',
};

export const storage = {
  getUsers: (): User[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  },

  getCurrentUser: (): User | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) return JSON.parse(data);
      return null;
    } catch {
      return null;
    }
  },

  setCurrentUser: (user: User | null) => {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  },

  getCourses: (): Course[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COURSES);
      return data ? JSON.parse(data) : INITIAL_COURSES;
    } catch {
      return INITIAL_COURSES;
    }
  },

  saveCourses: (courses: Course[]) => {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  },

  getStudents: (): Student[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return data ? JSON.parse(data) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  },

  saveStudents: (students: Student[]) => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  },

  getAttendance: (): AttendanceRecord[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      return data ? JSON.parse(data) : INITIAL_ATTENDANCE;
    } catch {
      return INITIAL_ATTENDANCE;
    }
  },

  saveAttendance: (records: AttendanceRecord[]) => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  },

  getPayments: (): FeePayment[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return data ? JSON.parse(data) : INITIAL_PAYMENTS;
    } catch {
      return INITIAL_PAYMENTS;
    }
  },

  savePayments: (payments: FeePayment[]) => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  },

  resetAllData: () => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(INITIAL_COURSES));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
  },
};
