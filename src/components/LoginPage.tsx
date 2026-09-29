import React, { useState, useEffect } from 'react';
import { User, UserRole, Student, Course } from '../types';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, firebaseProjectInfo } from '../services/firebase';
import { firestoreService } from '../services/firestoreService';
import { formatCurrency } from '../utils/calculations';
import { 
  Building2, 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  UserCheck, 
  KeyRound, 
  Mail, 
  IdCard, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Lock,
  Sparkles,
  Flame,
  Globe,
  UserPlus,
  Phone,
  BadgeCheck,
  RefreshCw,
  Calendar,
  Layers,
  ArrowLeft
} from 'lucide-react';

interface LoginPageProps {
  students: Student[];
  courses: Course[];
  onLogin: (user: User) => void;
  onRegisterStudent?: (student: Student) => void | Promise<void>;
  initialRole?: 'admin' | 'teacher' | 'student';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  students,
  courses,
  onLogin,
  onRegisterStudent,
  initialRole = 'admin',
}) => {
  const [portalTab, setPortalTab] = useState<'admin' | 'teacher' | 'student'>(initialRole);

  // Admin Form State
  const [adminEmail, setAdminEmail] = useState('registrar.sharma@university.ac.in');
  const [adminPassword, setAdminPassword] = useState('••••••••');
  const [adminSecurityPin, setAdminSecurityPin] = useState('8821');
  const [adminShowPassword, setAdminShowPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Teacher Form State
  const [teacherEmail, setTeacherEmail] = useState('a.sen@university.ac.in');
  const [teacherPassword, setTeacherPassword] = useState('••••••••');
  const [teacherShowPassword, setTeacherShowPassword] = useState(false);
  const [teacherError, setTeacherError] = useState<string | null>(null);

  // Student Form State
  const [studentPortalMode, setStudentPortalMode] = useState<'signin' | 'register'>('signin');
  const [studentRollNo, setStudentRollNo] = useState('CS-2024-001');
  const [studentPassword, setStudentPassword] = useState('••••••••');
  const [studentShowPassword, setStudentShowPassword] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);

  // Student Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regParentPhone, setRegParentPhone] = useState('');
  const [regCourseId, setRegCourseId] = useState('');
  const [regSemester, setRegSemester] = useState('Semester 1');
  const [regRollNo, setRegRollNo] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regTotalFee, setRegTotalFee] = useState<number | string>(75000);
  const [regError, setRegError] = useState<string | null>(null);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [registeredStudentInfo, setRegisteredStudentInfo] = useState<{ student: Student; user: User } | null>(null);

  // Roll number generator helper based on course & existing students
  const generateSuggestedRollNo = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    const code = course?.code || 'CS';
    const year = new Date().getFullYear();
    const courseStudents = students.filter((s) => s.courseId === courseId);
    const nextSeq = courseStudents.length + 1;
    return `${code}-${year}-${String(nextSeq).padStart(3, '0')}`;
  };

  // Sync initial registration course and roll number defaults
  useEffect(() => {
    if (courses.length > 0 && !regCourseId) {
      const defaultCourse = courses[0];
      setRegCourseId(defaultCourse.id);
      setRegRollNo(generateSuggestedRollNo(defaultCourse.id));
      setRegTotalFee(defaultCourse.tuitionFee || 75000);
    }
  }, [courses]);

  const handleCourseSelectChange = (newCourseId: string) => {
    setRegCourseId(newCourseId);
    const crs = courses.find((c) => c.id === newCourseId);
    setRegRollNo(generateSuggestedRollNo(newCourseId));
    if (crs?.tuitionFee) {
      setRegTotalFee(crs.tuitionFee);
    }
  };

  const handleRegenerateRollNo = () => {
    if (regCourseId) {
      setRegRollNo(generateSuggestedRollNo(regCourseId));
    }
  };

  // Firebase Google Auth State
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);

  const handleGoogleSignIn = async (preferredRole: 'admin' | 'teacher' | 'student') => {
    try {
      setIsSigningInGoogle(true);
      setAdminError(null);
      setTeacherError(null);
      setStudentError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const email = fbUser.email || '';
      const name = fbUser.displayName || (preferredRole === 'student' ? 'Student User' : preferredRole === 'admin' ? 'University Administrator' : 'Faculty Member');

      let role: UserRole = preferredRole === 'student' ? 'student' : preferredRole === 'admin' ? 'admin' : 'teacher';
      let dept = preferredRole === 'admin' ? 'Academic Administration & Bursar Office' : 'Academic Faculty';
      let studentId: string | undefined = undefined;
      let rollNo: string | undefined = undefined;

      // Special check for user email or admin keywords
      if (
        preferredRole === 'admin' ||
        email.toLowerCase() === 'mishrasaksham058@gmail.com' ||
        email.toLowerCase().includes('admin') ||
        email.toLowerCase().includes('registrar') ||
        email.toLowerCase().includes('sharma')
      ) {
        role = 'admin';
        dept = 'Academic Administration & Bursar Office';
      } else if (preferredRole === 'student') {
        const matched = students.find((s) => s.email.toLowerCase() === email.toLowerCase()) || students[0];
        if (matched) {
          studentId = matched.id;
          rollNo = matched.rollNo;
          const crs = courses.find((c) => c.id === matched.courseId);
          dept = crs?.department || 'Department of Computer Science';
        }
      }

      const userProfile: User = {
        id: fbUser.uid,
        name,
        email,
        role,
        department: dept,
        studentId,
        rollNo,
      };

      await firestoreService.saveUser(userProfile);
      onLogin(userProfile);
    } catch (err: unknown) {
      console.error('Google Sign-In failed:', err);
      const msg = err instanceof Error ? err.message : 'Authentication with Firebase failed. Please try again.';
      if (preferredRole === 'admin') {
        setAdminError(msg);
      } else if (preferredRole === 'student') {
        setStudentError(msg);
      } else {
        setTeacherError(msg);
      }
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  // Submit Admin Login
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    const emailTrimmed = adminEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      setAdminError('Please enter your administrator institutional email address.');
      return;
    }

    if (emailTrimmed.includes('dean')) {
      onLogin({
        id: 'user_admin_dean',
        name: 'Prof. K. N. Rao',
        email: emailTrimmed,
        role: 'admin',
        department: 'Office of the Dean of Academic Affairs',
      });
    } else if (emailTrimmed.includes('bursar') || emailTrimmed.includes('finance') || emailTrimmed.includes('sundaram')) {
      onLogin({
        id: 'user_admin_bursar',
        name: 'Smt. Meenakshi Sundaram',
        email: emailTrimmed,
        role: 'admin',
        department: 'Office of the University Bursar & Comptroller',
      });
    } else {
      onLogin({
        id: 'user_admin',
        name: 'Dr. Rajeshwar Sharma',
        email: emailTrimmed,
        role: 'admin',
        department: 'Academic Administration & Bursar Office',
      });
    }
  };

  // Quick Admin Demo Login
  const handleAdminDemoLogin = (email: string, name: string, dept: string) => {
    setAdminError(null);
    onLogin({
      id: 'user_admin',
      name,
      email,
      role: 'admin',
      department: dept,
    });
  };

  // Quick Faculty Login
  const handleFacultyDemoLogin = (email: string, name: string, role: 'teacher' | 'admin', dept: string) => {
    setTeacherError(null);
    onLogin({
      id: role === 'admin' ? 'user_admin' : 'user_teacher',
      name,
      email,
      role,
      department: dept,
    });
  };

  // Submit Teacher Login
  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError(null);

    const emailTrimmed = teacherEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      setTeacherError('Please enter your faculty or staff email address.');
      return;
    }

    if (emailTrimmed.includes('admin') || emailTrimmed.includes('sharma') || emailTrimmed.includes('registrar')) {
      onLogin({
        id: 'user_admin',
        name: 'Dr. Rajeshwar Sharma',
        email: emailTrimmed,
        role: 'admin',
        department: 'Academic Administration & Bursar Office',
      });
    } else {
      onLogin({
        id: 'user_teacher',
        name: emailTrimmed.includes('sen') ? 'Prof. Ananya Sen' : 'Prof. Vikram Malhotra',
        email: emailTrimmed,
        role: 'teacher',
        department: 'Department of Computer Science & Engineering',
      });
    }
  };

  // Quick Student Demo Login
  const handleStudentDemoLogin = (roll: string) => {
    setStudentError(null);
    const found = students.find((s) => s.rollNo.toLowerCase() === roll.toLowerCase());
    if (found) {
      const course = courses.find((c) => c.id === found.courseId);
      onLogin({
        id: `usr_${found.id}`,
        name: found.name,
        email: found.email,
        role: 'student',
        department: course?.department || 'Department of Computer Science',
        studentId: found.id,
        rollNo: found.rollNo,
      });
    } else {
      setStudentError(`Student with roll number ${roll} was not found.`);
    }
  };

  // Submit Student Login
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError(null);

    const rollTrimmed = studentRollNo.trim().toUpperCase();
    if (!rollTrimmed) {
      setStudentError('Please enter your University Roll Number.');
      return;
    }

    const matched = students.find(
      (s) => s.rollNo.toUpperCase() === rollTrimmed || s.email.toLowerCase() === studentRollNo.trim().toLowerCase()
    );

    if (!matched) {
      setStudentError(
        `Roll Number "${rollTrimmed}" was not found in the institutional enrollment records. Please verify or use one of the demo roll numbers below.`
      );
      return;
    }

    const course = courses.find((c) => c.id === matched.courseId);

    onLogin({
      id: `usr_${matched.id}`,
      name: matched.name,
      email: matched.email,
      role: 'student',
      department: course?.department || 'Department of Computer Science & Engineering',
      studentId: matched.id,
      rollNo: matched.rollNo,
    });
  };

  // Submit New Student Registration
  const handleRegisterStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const nameTrimmed = regName.trim();
    const rollTrimmed = regRollNo.trim().toUpperCase();
    const emailTrimmed = regEmail.trim().toLowerCase();

    if (!nameTrimmed) {
      setRegError('Please enter the student’s full legal name.');
      return;
    }
    if (!rollTrimmed) {
      setRegError('Please enter or generate a University Roll Number.');
      return;
    }
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      setRegError('Please enter a valid official student email address.');
      return;
    }
    if (!regCourseId) {
      setRegError('Please select an enrolled academic program / course.');
      return;
    }

    // Check duplicate roll number
    const existingRoll = students.find((s) => s.rollNo.toUpperCase() === rollTrimmed);
    if (existingRoll) {
      setRegError(`Roll number "${rollTrimmed}" is already registered for ${existingRoll.name}. Please choose or generate another roll number.`);
      return;
    }

    // Check duplicate email
    const existingEmail = students.find((s) => s.email.toLowerCase() === emailTrimmed);
    if (existingEmail) {
      setRegError(`Student email "${emailTrimmed}" is already registered (Roll: ${existingEmail.rollNo}). Please sign in instead.`);
      return;
    }

    try {
      setIsSubmittingReg(true);

      const course = courses.find((c) => c.id === regCourseId);
      const parsedFee = Number(regTotalFee);
      const feeAmount = !isNaN(parsedFee) && parsedFee >= 0 ? parsedFee : (course?.tuitionFee || 75000);

      const studentId = `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const newStudent: Student = {
        id: studentId,
        rollNo: rollTrimmed,
        name: nameTrimmed,
        email: emailTrimmed,
        phone: regPhone.trim() || undefined,
        parentPhone: regParentPhone.trim() || undefined,
        courseId: regCourseId,
        semester: regSemester,
        enrollmentDate: new Date().toISOString().split('T')[0],
        totalFee: feeAmount,
        status: 'active',
      };

      const userProfile: User = {
        id: `usr_${newStudent.id}`,
        name: newStudent.name,
        email: newStudent.email,
        role: 'student',
        department: course?.department || course?.name || 'Department of Engineering',
        studentId: newStudent.id,
        rollNo: newStudent.rollNo,
      };

      // Persist student to state and database
      if (onRegisterStudent) {
        await onRegisterStudent(newStudent);
      } else {
        await firestoreService.saveStudent(newStudent);
      }

      // Save user profile for authorization
      try {
        await firestoreService.saveUser(userProfile);
      } catch (userErr) {
        console.warn('Could not save user profile:', userErr);
      }

      // Store PIN if supplied
      if (regPassword.trim()) {
        try {
          localStorage.setItem(`student_pin_${rollTrimmed}`, regPassword.trim());
        } catch {
          // ignore
        }
      }

      setRegisteredStudentInfo({
        student: newStudent,
        user: userProfile,
      });

    } catch (err) {
      console.error('Registration failed:', err);
      setRegError(err instanceof Error ? err.message : 'Registration failed. Please verify your connection.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Header bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-md border border-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white">
                  BHARAT INSTITUTE OF TECHNOLOGY & SCIENCE
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700 font-mono hidden sm:inline">
                  ERP PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Student Attendance & Bursar Fee Registry System
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 text-amber-300 bg-amber-950/70 border border-amber-800/80 px-2.5 py-1 rounded-full shadow-xs">
              <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-mono text-[11px] font-medium hidden sm:inline">Firebase Connected</span>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Session: 2025–2026</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="max-w-xl w-full">
          {/* Top Segmented Tabs: Admin vs Teacher vs Student */}
          <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 shadow-xl mb-6 grid grid-cols-3 gap-1">
            <button
              id="tab-select-admin"
              type="button"
              onClick={() => {
                setPortalTab('admin');
                setAdminError(null);
              }}
              className={`flex items-center justify-center space-x-1.5 py-3 px-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                portalTab === 'admin'
                  ? 'bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-md border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Administrator</span>
            </button>
            <button
              id="tab-select-teacher"
              type="button"
              onClick={() => {
                setPortalTab('teacher');
                setTeacherError(null);
              }}
              className={`flex items-center justify-center space-x-1.5 py-3 px-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                portalTab === 'teacher'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Faculty & Staff</span>
            </button>
            <button
              id="tab-select-student"
              type="button"
              onClick={() => {
                setPortalTab('student');
                setStudentError(null);
              }}
              className={`flex items-center justify-center space-x-1.5 py-3 px-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                portalTab === 'student'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Student Portal</span>
            </button>
          </div>

          {/* ========================================================== */}
          {/* ADMINISTRATOR LOGIN VIEW */}
          {/* ========================================================== */}
          {portalTab === 'admin' && (
            <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Card Banner */}
              <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-6 sm:px-8 py-6 text-white border-b border-indigo-950 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center space-x-2">
                        <span>Central Administration & Bursar</span>
                      </h1>
                      <p className="text-xs text-indigo-200">
                        Full administrative authority: fee collection, admissions, & condonations
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 border border-amber-300 font-mono">
                    LEVEL 1 ADMIN
                  </span>
                </div>
              </div>

              {/* Card Form */}
              <div className="p-6 sm:p-8 space-y-6">
                {adminError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{adminError}</span>
                  </div>
                )}

                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Administrator Institutional Email or Master ID
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        id="admin-email-input"
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="registrar.sharma@university.ac.in"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:outline-hidden transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Master Password
                        </label>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          id="admin-password-input"
                          type={adminShowPassword ? 'text' : 'password'}
                          required
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:outline-hidden transition"
                        />
                        <button
                          type="button"
                          onClick={() => setAdminShowPassword(!adminShowPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                          title={adminShowPassword ? 'Hide password' : 'Show password'}
                        >
                          {adminShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Security Clearance PIN
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          id="admin-security-pin"
                          type="text"
                          value={adminSecurityPin}
                          onChange={(e) => setAdminSecurityPin(e.target.value)}
                          placeholder="8821"
                          maxLength={6}
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono tracking-widest focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:outline-hidden transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Keep administrative session alive (Level 1 Clearance)</span>
                    </label>
                  </div>

                  <button
                    id="btn-admin-login-submit"
                    type="submit"
                    className="w-full mt-2 py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    <span>Sign In to Administrator Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase">
                      <span className="bg-white px-2 text-slate-400 font-medium">Or continue with Cloud Identity</span>
                    </div>
                  </div>

                  <button
                    id="btn-admin-google-login"
                    type="button"
                    disabled={isSigningInGoogle}
                    onClick={() => handleGoogleSignIn('admin')}
                    className="w-full py-2 px-3 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition flex items-center justify-center space-x-2 disabled:opacity-60"
                  >
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>{isSigningInGoogle ? 'Connecting Firebase...' : 'Sign In with Google (Admin Authorization)'}</span>
                  </button>
                </form>

                {/* Quick Admin Demo Credentials */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>One-Click Verified Administrator Profiles:</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Root Access</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      id="demo-login-admin-sharma"
                      type="button"
                      onClick={() =>
                        handleAdminDemoLogin(
                          'registrar.sharma@university.ac.in',
                          'Dr. Rajeshwar Sharma',
                          'Academic Administration & Bursar Office'
                        )
                      }
                      className="text-left p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/80 transition"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded bg-indigo-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          RS
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-900 truncate">Dr. R. Sharma</div>
                          <div className="text-[10px] text-indigo-700 truncate">Registrar & Bursar</div>
                        </div>
                      </div>
                    </button>

                    <button
                      id="demo-login-admin-dean"
                      type="button"
                      onClick={() =>
                        handleAdminDemoLogin(
                          'dean.academics@university.ac.in',
                          'Prof. K. N. Rao',
                          'Office of the Dean of Academic Affairs'
                        )
                      }
                      className="text-left p-2.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          KR
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-900 truncate">Prof. K. N. Rao</div>
                          <div className="text-[10px] text-slate-600 truncate">Dean Academics</div>
                        </div>
                      </div>
                    </button>

                    <button
                      id="demo-login-admin-bursar"
                      type="button"
                      onClick={() =>
                        handleAdminDemoLogin(
                          'bursar.controller@university.ac.in',
                          'Smt. Meenakshi Sundaram',
                          'Office of the University Bursar & Comptroller'
                        )
                      }
                      className="text-left p-2.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded bg-emerald-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          MS
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-900 truncate">Smt. M. Sundaram</div>
                          <div className="text-[10px] text-slate-600 truncate">Bursar Comptroller</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Exclusive Permissions Breakdown */}
                <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200/80 text-[11px] text-indigo-950 space-y-1.5">
                  <div className="font-bold text-indigo-900 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Exclusive Administrator Permissions Granted:</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-indigo-900">
                    <li className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"></span>
                      <span>Bursar Fee Collection & Ledger Voiding</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"></span>
                      <span>Student Admission & Deletion Rights</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"></span>
                      <span>Attendance Statutory Condonation & Waivers</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"></span>
                      <span>Curriculum Degree Catalog Control</span>
                    </li>
                  </ul>
                </div>

                {/* Switch Links */}
                <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
                  <div>
                    <span>Teaching Faculty? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPortalTab('teacher');
                        setTeacherError(null);
                      }}
                      className="font-semibold text-blue-700 hover:text-blue-800 hover:underline"
                    >
                      Switch to Faculty Login &rarr;
                    </button>
                  </div>
                  <div>
                    <span>Enrolled Student? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPortalTab('student');
                        setStudentError(null);
                      }}
                      className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      Switch to Student Portal &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TEACHER / FACULTY LOGIN VIEW */}
          {/* ========================================================== */}
          {portalTab === 'teacher' && (
            <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Card Banner */}
              <div className="bg-gradient-to-r from-blue-900 to-slate-900 px-6 sm:px-8 py-6 text-white border-b border-blue-950">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                        Faculty & Staff Gateway
                      </h1>
                      <p className="text-xs text-blue-200">
                        Attendance registers, student rosters & grade management
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-800/60 text-blue-200 border border-blue-700 font-mono">
                    FACULTY
                  </span>
                </div>
              </div>

              {/* Card Form */}
              <div className="p-6 sm:p-8 space-y-6">
                {teacherError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{teacherError}</span>
                  </div>
                )}

                <form onSubmit={handleTeacherSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Institutional Faculty Email or Employee ID
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        id="teacher-email-input"
                        type="email"
                        required
                        value={teacherEmail}
                        onChange={(e) => setTeacherEmail(e.target.value)}
                        placeholder="a.sen@university.ac.in"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Faculty Password
                      </label>
                      <span className="text-[11px] text-blue-700 hover:underline cursor-pointer">
                        Forgot password?
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        id="teacher-password-input"
                        type={teacherShowPassword ? 'text' : 'password'}
                        required
                        value={teacherPassword}
                        onChange={(e) => setTeacherPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition"
                      />
                      <button
                        type="button"
                        onClick={() => setTeacherShowPassword(!teacherShowPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        title={teacherShowPassword ? 'Hide password' : 'Show password'}
                      >
                        {teacherShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Keep me signed in on this workstation</span>
                    </label>
                  </div>

                  <button
                    id="btn-teacher-login-submit"
                    type="submit"
                    className="w-full mt-2 py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    <span>Sign In to Faculty Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase">
                      <span className="bg-white px-2 text-slate-400 font-medium">Or continue with Cloud Identity</span>
                    </div>
                  </div>

                  <button
                    id="btn-teacher-google-login"
                    type="button"
                    disabled={isSigningInGoogle}
                    onClick={() => handleGoogleSignIn('teacher')}
                    className="w-full py-2 px-3 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition flex items-center justify-center space-x-2 disabled:opacity-60"
                  >
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>{isSigningInGoogle ? 'Connecting Firebase...' : 'Sign In with Google (Firebase Auth)'}</span>
                  </button>
                </form>

                {/* Quick Demo Credentials */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>One-Click Faculty Demo Profiles:</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Instant Access</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      id="demo-login-teacher"
                      type="button"
                      onClick={() =>
                        handleFacultyDemoLogin(
                          'a.sen@university.ac.in',
                          'Prof. Ananya Sen',
                          'teacher',
                          'Department of Computer Science & Engineering'
                        )
                      }
                      className="text-left p-2.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 transition"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                          AS
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-900">Prof. Ananya Sen</div>
                          <div className="text-[10px] text-blue-700">Faculty Instructor (CSE)</div>
                        </div>
                      </div>
                    </button>

                    <button
                      id="demo-login-admin"
                      type="button"
                      onClick={() =>
                        handleFacultyDemoLogin(
                          'registrar.sharma@university.ac.in',
                          'Dr. Rajeshwar Sharma',
                          'admin',
                          'Academic Administration & Bursar Office'
                        )
                      }
                      className="text-left p-2.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                          RS
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-900">Dr. Rajeshwar Sharma</div>
                          <div className="text-[10px] text-slate-600">Registrar & Bursar (Admin)</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Institutional Note */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-500 space-y-1">
                  <div className="font-semibold text-slate-700">Statutory Notice for Faculty:</div>
                  <p>
                    Daily lecture attendance rolls must be marked within 24 hours of session completion. 
                    Unmarked registers after the deadline require Head of Department override.
                  </p>
                </div>

                {/* Switch Links */}
                <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
                  <div>
                    <span>Administrative Authority? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPortalTab('admin');
                        setAdminError(null);
                      }}
                      className="font-semibold text-indigo-700 hover:text-indigo-800 hover:underline"
                    >
                      Administrator Gateway &rarr;
                    </button>
                  </div>
                  <div>
                    <span>Enrolled Student? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPortalTab('student');
                        setStudentError(null);
                      }}
                      className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      Student Portal &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* STUDENT PORTAL LOGIN & REGISTRATION VIEW */}
          {/* ========================================================== */}
          {portalTab === 'student' && (
            <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Card Banner */}
              <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 px-6 sm:px-8 py-6 text-white border-b border-emerald-950">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600/30 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center space-x-2">
                        <span>Student Self-Service Portal</span>
                      </h1>
                      <p className="text-xs text-emerald-200">
                        Attendance tracker, fee payment receipts & online admission registration
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-800/60 text-emerald-200 border border-emerald-700 font-mono">
                    STUDENT
                  </span>
                </div>
              </div>

              {/* Sub-navigation Switch: Sign In vs Register New Student */}
              <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 sm:px-8 pt-3">
                <button
                  id="tab-student-signin"
                  type="button"
                  onClick={() => {
                    setStudentPortalMode('signin');
                    setRegisteredStudentInfo(null);
                    setStudentError(null);
                  }}
                  className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center space-x-2 transition ${
                    studentPortalMode === 'signin' && !registeredStudentInfo
                      ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg border-t border-x border-slate-200 -mb-px'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Student Sign In</span>
                </button>
                <button
                  id="tab-student-register"
                  type="button"
                  onClick={() => {
                    setStudentPortalMode('register');
                    setRegisteredStudentInfo(null);
                    setRegError(null);
                    if (courses.length > 0 && !regCourseId) {
                      setRegCourseId(courses[0].id);
                      setRegRollNo(generateSuggestedRollNo(courses[0].id));
                      setRegTotalFee(courses[0].tuitionFee || 75000);
                    }
                  }}
                  className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center space-x-2 transition ${
                    studentPortalMode === 'register' || registeredStudentInfo
                      ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg border-t border-x border-slate-200 -mb-px'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register New Student</span>
                  <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                    New Admission
                  </span>
                </button>
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-8 space-y-6">

                {/* ========================================================== */}
                {/* 1. REGISTRATION SUCCESS CONFIRMATION VIEW */}
                {/* ========================================================== */}
                {registeredStudentInfo && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
                      <div className="flex items-center space-x-2 text-emerald-700">
                        <BadgeCheck className="w-6 h-6 text-emerald-600" />
                        <span className="font-bold text-base text-emerald-900">
                          Student Registration Completed Successfully!
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800">
                        Your academic admission profile has been registered in the university system. You can now immediately access your attendance tracker, lecture logs, and fee clearance ledger.
                      </p>
                    </div>

                    {/* Official Admission Credential Slip */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Official Admission Summary
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                          Active Enrolled Status
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Full Student Name:</span>
                          <span className="font-bold text-slate-900 text-sm">{registeredStudentInfo.student.name}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">University Roll Number:</span>
                          <span className="font-mono font-bold text-emerald-700 text-sm">
                            {registeredStudentInfo.student.rollNo}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Academic Course:</span>
                          <span className="font-semibold text-slate-800">
                            {courses.find((c) => c.id === registeredStudentInfo.student.courseId)?.name || registeredStudentInfo.student.courseId}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Current Semester:</span>
                          <span className="font-semibold text-slate-800">{registeredStudentInfo.student.semester}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Registered Email:</span>
                          <span className="text-slate-700 font-mono">{registeredStudentInfo.student.email}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Assessed Annual Tuition Fee:</span>
                          <span className="font-bold text-slate-900">{formatCurrency(registeredStudentInfo.student.totalFee)}</span>
                        </div>
                      </div>

                      {regPassword && (
                        <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                          <div>
                            <span className="text-slate-500 text-[11px] block">Your Student Login PIN:</span>
                            <span className="font-mono font-bold text-slate-800 tracking-wider">
                              {regPassword}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">Save for future sign-ins</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        id="btn-enter-portal-after-reg"
                        type="button"
                        onClick={() => onLogin(registeredStudentInfo.user)}
                        className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
                      >
                        <span>Directly Enter Student Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        id="btn-back-to-signin-after-reg"
                        type="button"
                        onClick={() => {
                          setStudentRollNo(registeredStudentInfo.student.rollNo);
                          setRegisteredStudentInfo(null);
                          setStudentPortalMode('signin');
                        }}
                        className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-medium transition flex items-center justify-center space-x-1.5"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Sign In with Roll Number</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ========================================================== */}
                {/* 2. STUDENT SIGN IN FORM VIEW */}
                {/* ========================================================== */}
                {!registeredStudentInfo && studentPortalMode === 'signin' && (
                  <>
                    {studentError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                        <span>{studentError}</span>
                      </div>
                    )}

                    <form onSubmit={handleStudentSubmit} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            University Roll Number
                          </label>
                          <span className="text-[11px] text-slate-400 font-mono">e.g. CS-2024-001</span>
                        </div>
                        <div className="relative">
                          <IdCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                          <input
                            id="student-roll-input"
                            type="text"
                            required
                            value={studentRollNo}
                            onChange={(e) => setStudentRollNo(e.target.value.toUpperCase())}
                            placeholder="CS-2024-001"
                            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono uppercase bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-hidden transition"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            Date of Birth / Student PIN
                          </label>
                          <span className="text-[11px] text-emerald-700 hover:underline cursor-pointer">
                            Trouble logging in?
                          </span>
                        </div>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                          <input
                            id="student-password-input"
                            type={studentShowPassword ? 'text' : 'password'}
                            required
                            value={studentPassword}
                            onChange={(e) => setStudentPassword(e.target.value)}
                            placeholder="DD/MM/YYYY or Student PIN"
                            className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-hidden transition"
                          />
                          <button
                            type="button"
                            onClick={() => setStudentShowPassword(!studentShowPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                            title={studentShowPassword ? 'Hide PIN' : 'Show PIN'}
                          >
                            {studentShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Save student credentials on this browser</span>
                        </label>
                      </div>

                      <button
                        id="btn-student-login-submit"
                        type="submit"
                        className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
                      >
                        <span>Sign In to Student Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <div className="relative my-3">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-[11px] uppercase">
                          <span className="bg-white px-2 text-slate-400 font-medium">Or continue with Student Google ID</span>
                        </div>
                      </div>

                      <button
                        id="btn-student-google-login"
                        type="button"
                        disabled={isSigningInGoogle}
                        onClick={() => handleGoogleSignIn('student')}
                        className="w-full py-2 px-3 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition flex items-center justify-center space-x-2 disabled:opacity-60"
                      >
                        <Flame className="w-4 h-4 text-emerald-600" />
                        <span>{isSigningInGoogle ? 'Connecting Firebase...' : 'Sign In with Google (Firebase Auth)'}</span>
                      </button>

                      {/* Prompt to register if new student */}
                      <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
                        <span>New student enrolling this academic session?</span>
                        <button
                          id="btn-switch-to-register-prompt"
                          type="button"
                          onClick={() => {
                            setStudentPortalMode('register');
                            setRegError(null);
                            if (courses.length > 0 && !regCourseId) {
                              setRegCourseId(courses[0].id);
                              setRegRollNo(generateSuggestedRollNo(courses[0].id));
                              setRegTotalFee(courses[0].tuitionFee || 75000);
                            }
                          }}
                          className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Register New Student &rarr;</span>
                        </button>
                      </div>
                    </form>

                    {/* Quick Student Demo Accounts */}
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>One-Click Student Demo Accounts:</span>
                        </span>
                        <span className="text-[10px] text-slate-500">Select Test Profile</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          id="demo-student-aarav"
                          type="button"
                          onClick={() => handleStudentDemoLogin('CS-2024-001')}
                          className="text-left p-2 rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 transition"
                        >
                          <div className="text-xs font-bold text-slate-900 truncate">Aarav Sharma</div>
                          <div className="text-[10px] font-mono text-emerald-800">CS-2024-001</div>
                          <div className="text-[10px] text-emerald-600 font-medium">90% (Eligible)</div>
                        </button>

                        <button
                          id="demo-student-rohan"
                          type="button"
                          onClick={() => handleStudentDemoLogin('CS-2024-003')}
                          className="text-left p-2 rounded-lg border border-amber-200 bg-amber-50/60 hover:bg-amber-100 transition"
                        >
                          <div className="text-xs font-bold text-slate-900 truncate">Rohan Verma</div>
                          <div className="text-[10px] font-mono text-amber-800">CS-2024-003</div>
                          <div className="text-[10px] text-amber-700 font-medium">60% (Shortage!)</div>
                        </button>

                        <button
                          id="demo-student-kabir"
                          type="button"
                          onClick={() => handleStudentDemoLogin('CS-2024-005')}
                          className="text-left p-2 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 transition"
                        >
                          <div className="text-xs font-bold text-slate-900 truncate">Kabir Mukherjee</div>
                          <div className="text-[10px] font-mono text-rose-800">CS-2024-005</div>
                          <div className="text-[10px] text-rose-600 font-medium">₹85,000 Due</div>
                        </button>
                      </div>
                    </div>

                    {/* University Regulation Notice */}
                    <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 text-[11px] text-slate-600 space-y-1">
                      <div className="font-semibold text-emerald-900 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>University Ordinance Clause 4.2:</span>
                      </div>
                      <p>
                        All enrolled students must maintain a minimum of <strong>75% aggregate attendance</strong> to qualify for semester examinations. Official electronic fee clearance slips are required for admit card generation.
                      </p>
                    </div>
                  </>
                )}

                {/* ========================================================== */}
                {/* 3. REGISTER NEW STUDENT FORM VIEW */}
                {/* ========================================================== */}
                {!registeredStudentInfo && studentPortalMode === 'register' && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <div className="text-xs text-slate-600">
                        <div className="font-bold text-slate-900">
                          Student Self-Registration & Portal Provisioning
                        </div>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          Enrolling sets up your university academic records and creates your personal self-service portal account.
                        </p>
                      </div>
                    </div>

                    {regError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                        <span>{regError}</span>
                      </div>
                    )}

                    <form onSubmit={handleRegisterStudentSubmit} className="space-y-4">
                      {/* Row 1: Program and Name */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Academic Program / Degree <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Layers className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <select
                              id="reg-course-select"
                              value={regCourseId}
                              onChange={(e) => handleCourseSelectChange(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-hidden transition"
                              required
                            >
                              {courses.map((crs) => (
                                <option key={crs.id} value={crs.id}>
                                  {crs.code} - {crs.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Full Legal Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="reg-name-input"
                            type="text"
                            required
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="e.g. Saksham Mishra"
                            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-hidden transition"
                          />
                        </div>
                      </div>

                      {/* Row 2: Roll Number & Semester */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              University Roll Number <span className="text-rose-500">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={handleRegenerateRollNo}
                              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium flex items-center space-x-1"
                              title="Generate Next Serial Roll Number"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Auto-Format</span>
                            </button>
                          </div>
                          <div className="relative">
                            <IdCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <input
                              id="reg-roll-input"
                              type="text"
                              required
                              value={regRollNo}
                              onChange={(e) => setRegRollNo(e.target.value.toUpperCase())}
                              placeholder="CS-2025-001"
                              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono uppercase bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-hidden transition"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Current Semester <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <select
                              id="reg-semester-select"
                              value={regSemester}
                              onChange={(e) => setRegSemester(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-hidden transition"
                            >
                              <option value="Semester 1">Semester 1 (Freshman)</option>
                              <option value="Semester 2">Semester 2</option>
                              <option value="Semester 3">Semester 3 (Sophomore)</option>
                              <option value="Semester 4">Semester 4</option>
                              <option value="Semester 5">Semester 5 (Junior)</option>
                              <option value="Semester 6">Semester 6</option>
                              <option value="Semester 7">Semester 7 (Senior)</option>
                              <option value="Semester 8">Semester 8</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Official Email & Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Student Official Email <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <input
                              id="reg-email-input"
                              type="email"
                              required
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              placeholder="student@university.ac.in"
                              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-hidden transition"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Student Mobile Phone
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <input
                              id="reg-phone-input"
                              type="tel"
                              value={regPhone}
                              onChange={(e) => setRegPhone(e.target.value)}
                              placeholder="+91 98765 43210"
                              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-hidden transition"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Row 4: Guardian Phone & Assessed Tuition Fee */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              Parent / Guardian Phone
                            </label>
                            <span className="text-[10px] text-slate-400">Attendance & Fee alerts</span>
                          </div>
                          <div className="relative">
                            <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <input
                              id="reg-parent-phone-input"
                              type="tel"
                              value={regParentPhone}
                              onChange={(e) => setRegParentPhone(e.target.value)}
                              placeholder="+91 98765 11223"
                              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-hidden transition"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Annual Tuition Fee (INR) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="reg-fee-input"
                            type="number"
                            min="0"
                            step="1000"
                            required
                            value={regTotalFee}
                            onChange={(e) => setRegTotalFee(e.target.value)}
                            placeholder="75000"
                            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-hidden transition"
                          />
                        </div>
                      </div>

                      {/* Row 5: Set PIN / Password */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            Create Student Login PIN / Password
                          </label>
                          <span className="text-[11px] text-slate-400">Used for future portal sign-in</span>
                        </div>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                          <input
                            id="reg-password-input"
                            type={regShowPassword ? 'text' : 'password'}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="e.g. 4-digit PIN or secret password"
                            className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-hidden transition"
                          />
                          <button
                            type="button"
                            onClick={() => setRegShowPassword(!regShowPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                            title={regShowPassword ? 'Hide PIN' : 'Show PIN'}
                          >
                            {regShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Submit and Cancel Buttons */}
                      <div className="pt-2 space-y-2">
                        <button
                          id="btn-submit-registration"
                          type="submit"
                          disabled={isSubmittingReg}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
                        >
                          {isSubmittingReg ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Enrolling & Provisioning Portal...</span>
                            </>
                          ) : (
                            <>
                              <span>Complete Registration & Access Portal</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>

                        <button
                          id="btn-cancel-registration"
                          type="button"
                          onClick={() => {
                            setStudentPortalMode('signin');
                            setRegError(null);
                          }}
                          className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 transition text-center"
                        >
                          Already have a Roll Number? Back to Student Sign In
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Switch Link to Faculty and Admin Portal */}
                <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200 gap-2">
                  <div>
                    <span>Administrator? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPortalTab('admin');
                        setAdminError(null);
                      }}
                      className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      Administrator Gateway &rarr;
                    </button>
                  </div>
                  <div>
                    <span>Faculty Member? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPortalTab('teacher');
                        setTeacherError(null);
                      }}
                      className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Faculty Login &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Portal Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            &copy; 2026 Academic Registry & Finance Bursar. All rights reserved.
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>Helpdesk: support@university.ac.in</span>
            <span>•</span>
            <span>Registrar Office: ext 104 / 108</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
