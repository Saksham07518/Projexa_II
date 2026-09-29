/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, UserRole, Student, Course, AttendanceRecord, FeePayment } from './types';
import { storage } from './services/storage';
import { auth, signOut, onAuthStateChanged, testConnection } from './services/firebase';
import { firestoreService } from './services/firestoreService';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { AttendanceManager } from './components/AttendanceManager';
import { FeeManager } from './components/FeeManager';
import { StudentDirectory } from './components/StudentDirectory';
import { ReportsManager } from './components/ReportsManager';
import { LoginPage } from './components/LoginPage';
import { StudentPortal } from './components/StudentPortal';
import { AdminConsole } from './components/AdminConsole';
import { CheckCircle2, Info, Building2, ShieldCheck, UserCheck, LogOut, ArrowLeftRight, Flame } from 'lucide-react';

export default function App() {
  // Master data states
  const [currentUser, setCurrentUser] = useState<User | null>(() => storage.getCurrentUser());
  const [courses, setCourses] = useState<Course[]>(() => storage.getCourses());
  const [students, setStudents] = useState<Student[]>(() => storage.getStudents());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => storage.getAttendance());
  const [payments, setPayments] = useState<FeePayment[]>(() => storage.getPayments());

  // Firebase Synchronization States
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Navigation & View States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance' | 'fees' | 'students' | 'reports' | 'admin'>('dashboard');
  const [selectedStudentForDossier, setSelectedStudentForDossier] = useState<Student | null>(null);
  const [pendingPaymentStudentId, setPendingPaymentStudentId] = useState<string | undefined>(undefined);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Real-time Firestore synchronization & seed check
  useEffect(() => {
    let isMounted = true;

    // 1. Verify Firestore connectivity
    testConnection().then((connected) => {
      if (isMounted) {
        setIsFirebaseConnected(connected);
      }
    });

    // 2. Ensure initial seed if Firestore collections are empty
    firestoreService.seedIfEmpty().catch((err) => {
      console.warn('Initial Firestore seed check:', err);
    });

    // 3. Subscribe to real-time updates from Firestore
    const unsubCourses = firestoreService.subscribeCourses((fbCourses) => {
      if (!isMounted) return;
      if (fbCourses.length > 0) {
        setCourses(fbCourses);
        storage.saveCourses?.(fbCourses);
      }
    });

    const unsubStudents = firestoreService.subscribeStudents((fbStudents) => {
      if (!isMounted) return;
      if (fbStudents.length > 0) {
        setStudents(fbStudents);
        storage.saveStudents(fbStudents);
      }
      setIsFirebaseConnected(true);
    });

    const unsubAttendance = firestoreService.subscribeAttendance((fbAttendance) => {
      if (!isMounted) return;
      if (fbAttendance.length > 0) {
        setAttendance(fbAttendance);
        storage.saveAttendance(fbAttendance);
      }
    });

    const unsubPayments = firestoreService.subscribePayments((fbPayments) => {
      if (!isMounted) return;
      if (fbPayments.length > 0) {
        setPayments(fbPayments);
        storage.savePayments(fbPayments);
      }
    });

    // 4. Monitor Firebase Auth state
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (!isMounted) return;
      if (fbUser && !storage.getCurrentUser()) {
        const email = fbUser.email || '';
        const name = fbUser.displayName || 'Authorized User';
        let role: UserRole = 'teacher';
        let dept = 'Academic Faculty';

        if (
          email.toLowerCase() === 'mishrasaksham058@gmail.com' ||
          email.toLowerCase().includes('admin') ||
          email.toLowerCase().includes('registrar')
        ) {
          role = 'admin';
          dept = 'Academic Administration & Bursar Office';
        }

        const appUser: User = {
          id: fbUser.uid,
          name,
          email,
          role,
          department: dept,
        };

        setCurrentUser(appUser);
        storage.setCurrentUser(appUser);
      }
    });

    return () => {
      isMounted = false;
      unsubCourses();
      unsubStudents();
      unsubAttendance();
      unsubPayments();
      unsubAuth();
    };
  }, []);

  // Auth Handling
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    storage.setCurrentUser(user);
    showToast(`Signed in successfully as ${user.name} (${user.role.toUpperCase()})`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setCurrentUser(null);
    storage.setCurrentUser(null);
    showToast('Logged out of session. Redirected to login portal.');
  };

  // Role switching (for faculty/admin)
  const handleRoleSwitch = (newRole: UserRole) => {
    if (newRole === 'student') {
      const firstStudent = students[0];
      const studentUser: User = {
        id: `usr_${firstStudent.id}`,
        name: firstStudent.name,
        email: firstStudent.email,
        role: 'student',
        department: courses.find((c) => c.id === firstStudent.courseId)?.department || 'Computer Science',
        studentId: firstStudent.id,
        rollNo: firstStudent.rollNo,
      };
      handleLogin(studentUser);
      return;
    }
    const allUsers = storage.getUsers();
    const userToSet = allUsers.find((u) => u.role === newRole) || allUsers[0];
    setCurrentUser(userToSet);
    storage.setCurrentUser(userToSet);
    showToast(`Switched active profile to ${userToSet.name} (${newRole.toUpperCase()})`);
  };

  // Reset Cloud & Local Data
  const handleResetData = async () => {
    if (window.confirm('Reset all academic records, attendance history, and fee receipts to default demonstration dataset in Firebase Firestore?')) {
      try {
        setIsSyncing(true);
        await firestoreService.resetToDefaults();
        storage.resetAllData();
        setStudents(storage.getStudents());
        setAttendance(storage.getAttendance());
        setPayments(storage.getPayments());
        showToast('All Firestore database collections restored to initial university dataset.');
      } catch (err) {
        console.error('Reset error:', err);
        storage.resetAllData();
        showToast('Reset completed locally.');
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Student management
  const handleAddStudent = async (newStudent: Student) => {
    // Optimistic local state update
    const updated = [newStudent, ...students];
    setStudents(updated);
    storage.saveStudents(updated);
    showToast(`Enrolled student ${newStudent.name} (${newStudent.rollNo}) successfully.`);

    // Persist to Firestore
    try {
      setIsSyncing(true);
      await firestoreService.saveStudent(newStudent);
    } catch (err) {
      console.error('Firestore saveStudent error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    // Optimistic local state update
    const updated = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    setStudents(updated);
    storage.saveStudents(updated);
    showToast(`Updated student profile for ${updatedStudent.name}.`);

    // Persist to Firestore
    try {
      setIsSyncing(true);
      await firestoreService.saveStudent(updatedStudent);
    } catch (err) {
      console.error('Firestore updateStudent error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    const target = students.find((s) => s.id === studentId);
    const updated = students.filter((s) => s.id !== studentId);
    setStudents(updated);
    storage.saveStudents(updated);
    showToast(`Deleted student record ${target?.rollNo || studentId}.`);

    // Delete in Firestore
    try {
      setIsSyncing(true);
      await firestoreService.deleteStudent(studentId);
    } catch (err) {
      console.error('Firestore deleteStudent error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Attendance management
  const handleSaveAttendanceBatch = async (newRecords: AttendanceRecord[]) => {
    // Merge by studentId + date
    const newRecordKeys = new Set(newRecords.map((r) => `${r.studentId}_${r.date}`));
    const retained = attendance.filter((r) => !newRecordKeys.has(`${r.studentId}_${r.date}`));
    const updated = [...retained, ...newRecords];
    setAttendance(updated);
    storage.saveAttendance(updated);
    showToast(`Recorded and calculated daily attendance for ${newRecords.length} students.`);

    // Save batch to Firestore
    try {
      setIsSyncing(true);
      await firestoreService.saveAttendanceBatch(newRecords);
    } catch (err) {
      console.error('Firestore saveAttendanceBatch error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Fee management
  const handleRecordPayment = async (payment: FeePayment) => {
    const updated = [payment, ...payments];
    setPayments(updated);
    storage.savePayments(updated);
    const student = students.find((s) => s.id === payment.studentId);
    showToast(`Receipt #${payment.receiptNo} issued for ${student?.name || 'student'}.`);

    // Persist payment to Firestore
    try {
      setIsSyncing(true);
      await firestoreService.recordPayment(payment);
    } catch (err) {
      console.error('Firestore recordPayment error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Admin Payment Voiding
  const handleVoidPayment = async (paymentId: string) => {
    const target = payments.find((p) => p.id === paymentId);
    const updated = payments.filter((p) => p.id !== paymentId);
    setPayments(updated);
    storage.savePayments(updated);
    showToast(`Voided receipt #${target?.receiptNo || paymentId} from institutional ledger.`);

    try {
      setIsSyncing(true);
      await firestoreService.deletePayment(paymentId);
    } catch (err) {
      console.error('Firestore deletePayment error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Admin Course Curriculum Management
  const handleSaveCourse = async (course: Course) => {
    const exists = courses.some((c) => c.id === course.id);
    const updated = exists ? courses.map((c) => (c.id === course.id ? course : c)) : [course, ...courses];
    setCourses(updated);
    storage.saveCourses?.(updated);
    showToast(`Saved curriculum degree program for ${course.name} (${course.code}).`);

    try {
      setIsSyncing(true);
      await firestoreService.saveCourse(course);
    } catch (err) {
      console.error('Firestore saveCourse error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    const target = courses.find((c) => c.id === courseId);
    const updated = courses.filter((c) => c.id !== courseId);
    setCourses(updated);
    storage.saveCourses?.(updated);
    showToast(`Deleted course program ${target?.code || courseId}.`);

    try {
      setIsSyncing(true);
      await firestoreService.deleteCourse(courseId);
    } catch (err) {
      console.error('Firestore deleteCourse error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenRecordPaymentForStudent = (studentId?: string) => {
    setPendingPaymentStudentId(studentId);
    setActiveTab('fees');
  };

  const handleOpenAddStudentModal = () => {
    setIsAddStudentOpen(true);
    setActiveTab('students');
  };

  const handleSelectStudentForInspection = (student: Student) => {
    setSelectedStudentForDossier(student);
    setActiveTab('students');
  };

  // If user is not logged in, render the login page
  if (!currentUser) {
    return (
      <LoginPage
        students={students}
        courses={courses}
        onLogin={handleLogin}
        onRegisterStudent={handleAddStudent}
        initialRole="admin"
      />
    );
  }

  // If user is a student, render the dedicated Student Self-Service Portal
  if (currentUser.role === 'student') {
    return (
      <StudentPortal
        currentUser={currentUser}
        students={students}
        courses={courses}
        attendance={attendance}
        payments={payments}
        onRecordPayment={handleRecordPayment}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Banner Navigation */}
      <Navbar
        currentUser={currentUser}
        onRoleSwitch={handleRoleSwitch}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetData={handleResetData}
        onLogout={handleLogout}
        isFirebaseConnected={isFirebaseConnected}
        isSyncing={isSyncing}
      />

      {/* Role Notice Indicator Banner */}
      <div className="bg-slate-900/5 border-b border-slate-200 py-1.5 px-4 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-900">Current Session:</span>
            <span>{currentUser.name}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">{currentUser.department}</span>
          </div>
          <div className="flex items-center space-x-3 font-medium">
            <div className="hidden sm:flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] bg-amber-50 text-amber-800 border border-amber-200">
              <Flame className="w-3 h-3 text-amber-600" />
              <span>Firebase Cloud DB Active</span>
            </div>

            {currentUser.role === 'admin' ? (
              <div className="flex items-center space-x-2">
                <span className="text-indigo-900 bg-indigo-100/90 px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1.5 border border-indigo-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Admin Clearance: Level 1 Access</span>
                </span>
                <button
                  id="btn-quick-admin-console"
                  onClick={() => setActiveTab('admin')}
                  className={`text-[11px] px-2.5 py-0.5 rounded font-medium transition flex items-center space-x-1 ${
                    activeTab === 'admin'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3 text-amber-500" />
                  <span>Admin Console</span>
                </button>
              </div>
            ) : (
              <span className="text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5 text-sky-700" />
                <span>Faculty View: Attendance Roll Call & Student Rosters</span>
              </span>
            )}

            <button
              onClick={() => {
                const firstStudent = students[0];
                if (firstStudent) {
                  handleLogin({
                    id: `usr_${firstStudent.id}`,
                    name: firstStudent.name,
                    email: firstStudent.email,
                    role: 'student',
                    department: courses.find((c) => c.id === firstStudent.courseId)?.department || 'Computer Science',
                    studentId: firstStudent.id,
                    rollNo: firstStudent.rollNo,
                  });
                }
              }}
              className="hidden md:inline-flex items-center space-x-1 text-[11px] text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200 transition font-medium"
              title="Quickly test student self-service portal"
            >
              <ArrowLeftRight className="w-3 h-3 text-emerald-600" />
              <span>Switch to Student Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 text-xs font-medium flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            students={students}
            courses={courses}
            attendance={attendance}
            payments={payments}
            currentUser={currentUser}
            onNavigateTab={setActiveTab}
            onOpenRecordPayment={handleOpenRecordPaymentForStudent}
            onOpenAddStudent={handleOpenAddStudentModal}
            onSelectStudent={handleSelectStudentForInspection}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceManager
            students={students}
            courses={courses}
            attendance={attendance}
            currentUser={currentUser}
            onSaveAttendanceBatch={handleSaveAttendanceBatch}
          />
        )}

        {activeTab === 'fees' && (
          <FeeManager
            students={students}
            courses={courses}
            payments={payments}
            currentUser={currentUser}
            onRecordPayment={handleRecordPayment}
            initialSelectedStudentId={pendingPaymentStudentId}
            onClearInitialStudent={() => setPendingPaymentStudentId(undefined)}
          />
        )}

        {activeTab === 'students' && (
          <StudentDirectory
            students={students}
            courses={courses}
            attendance={attendance}
            payments={payments}
            currentUser={currentUser}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onOpenRecordPayment={handleOpenRecordPaymentForStudent}
            isAddModalOpenInitially={isAddStudentOpen}
            onCloseInitialAddModal={() => setIsAddStudentOpen(false)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsManager
            students={students}
            courses={courses}
            attendance={attendance}
            payments={payments}
            currentUser={currentUser}
            onSelectStudent={handleSelectStudentForInspection}
            onOpenRecordPayment={handleOpenRecordPaymentForStudent}
          />
        )}

        {activeTab === 'admin' && (
          <AdminConsole
            currentUser={currentUser}
            students={students}
            courses={courses}
            attendance={attendance}
            payments={payments}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onVoidPayment={handleVoidPayment}
            onSaveCourse={handleSaveCourse}
            onDeleteCourse={handleDeleteCourse}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSwitchRole={handleRoleSwitch}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Institutional Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-700" />
            <span className="font-semibold text-slate-800">
              Student Attendance and Fee Management System
            </span>
            <span className="text-slate-300">|</span>
            <span>Community SDG • Academic & Financial Records</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Compliant with 75% statutory attendance regulation and computerized Bursar ledger protocols.
          </div>
        </div>
      </footer>
    </div>
  );
}
