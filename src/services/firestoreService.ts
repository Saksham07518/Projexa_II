import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Student, Course, AttendanceRecord, FeePayment, User } from '../types';
import {
  INITIAL_USERS,
  INITIAL_COURSES,
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE,
  INITIAL_PAYMENTS,
} from '../data/initialData';

export interface SyncStatus {
  connected: boolean;
  syncing: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
}

export const firestoreService = {
  // Listeners for Real-time Data
  subscribeCourses(onData: (courses: Course[]) => void, onError?: (err: Error) => void) {
    const collPath = 'courses';
    return onSnapshot(
      collection(db, collPath),
      (snapshot) => {
        const items: Course[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as Course);
        });
        // Sort by code or id
        items.sort((a, b) => a.code.localeCompare(b.code));
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collPath);
        if (onError) onError(error as Error);
      }
    );
  },

  subscribeStudents(onData: (students: Student[]) => void, onError?: (err: Error) => void) {
    const collPath = 'students';
    return onSnapshot(
      collection(db, collPath),
      (snapshot) => {
        const items: Student[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as Student);
        });
        items.sort((a, b) => a.rollNo.localeCompare(b.rollNo));
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collPath);
        if (onError) onError(error as Error);
      }
    );
  },

  subscribeAttendance(onData: (records: AttendanceRecord[]) => void, onError?: (err: Error) => void) {
    const collPath = 'attendance';
    return onSnapshot(
      collection(db, collPath),
      (snapshot) => {
        const items: AttendanceRecord[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as AttendanceRecord);
        });
        // Sort descending by date
        items.sort((a, b) => b.date.localeCompare(a.date));
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collPath);
        if (onError) onError(error as Error);
      }
    );
  },

  subscribePayments(onData: (payments: FeePayment[]) => void, onError?: (err: Error) => void) {
    const collPath = 'payments';
    return onSnapshot(
      collection(db, collPath),
      (snapshot) => {
        const items: FeePayment[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as FeePayment);
        });
        // Sort descending by payment date
        items.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collPath);
        if (onError) onError(error as Error);
      }
    );
  },

  subscribeUsers(onData: (users: User[]) => void, onError?: (err: Error) => void) {
    const collPath = 'users';
    return onSnapshot(
      collection(db, collPath),
      (snapshot) => {
        const items: User[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as User);
        });
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collPath);
        if (onError) onError(error as Error);
      }
    );
  },

  // Seed initial data if collections are empty
  async seedIfEmpty(): Promise<boolean> {
    const studentsColl = 'students';
    try {
      const snap = await getDocs(collection(db, studentsColl));
      if (!snap.empty) {
        return false; // Already populated
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, studentsColl);
    }

    // Populate initial data in Firestore
    await this.resetToDefaults();
    return true;
  },

  // Reset or initialize all collections to default demo dataset
  async resetToDefaults(): Promise<void> {
    const batch = writeBatch(db);

    // Seed Courses
    for (const c of INITIAL_COURSES) {
      const ref = doc(db, 'courses', c.id);
      batch.set(ref, c);
    }

    // Seed Students
    for (const s of INITIAL_STUDENTS) {
      const ref = doc(db, 'students', s.id);
      batch.set(ref, s);
    }

    // Seed Users
    for (const u of INITIAL_USERS) {
      const ref = doc(db, 'users', u.id);
      batch.set(ref, u);
    }

    // Seed Attendance
    for (const a of INITIAL_ATTENDANCE) {
      const ref = doc(db, 'attendance', a.id);
      batch.set(ref, a);
    }

    // Seed Payments
    for (const p of INITIAL_PAYMENTS) {
      const ref = doc(db, 'payments', p.id);
      batch.set(ref, p);
    }

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'batch-seed');
    }
  },

  // Student CRUD Operations
  async saveStudent(student: Student): Promise<void> {
    const path = `students/${student.id}`;
    try {
      await setDoc(doc(db, 'students', student.id), student);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteStudent(studentId: string): Promise<void> {
    const path = `students/${studentId}`;
    try {
      await deleteDoc(doc(db, 'students', studentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Attendance CRUD Operations
  async saveAttendanceBatch(records: AttendanceRecord[]): Promise<void> {
    const batch = writeBatch(db);
    for (const rec of records) {
      const ref = doc(db, 'attendance', rec.id);
      batch.set(ref, rec);
    }
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'attendance');
    }
  },

  // Fee Payment Operations
  async recordPayment(payment: FeePayment): Promise<void> {
    const path = `payments/${payment.id}`;
    try {
      await setDoc(doc(db, 'payments', payment.id), payment);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deletePayment(paymentId: string): Promise<void> {
    const path = `payments/${paymentId}`;
    try {
      await deleteDoc(doc(db, 'payments', paymentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Course Operations
  async saveCourse(course: Course): Promise<void> {
    const path = `courses/${course.id}`;
    try {
      await setDoc(doc(db, 'courses', course.id), course);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteCourse(courseId: string): Promise<void> {
    const path = `courses/${courseId}`;
    try {
      await deleteDoc(doc(db, 'courses', courseId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // User Profile Operations
  async saveUser(user: User): Promise<void> {
    const path = `users/${user.id}`;
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },
};
