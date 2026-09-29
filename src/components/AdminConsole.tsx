import React, { useState } from 'react';
import { User, Student, Course, AttendanceRecord, FeePayment, UserRole } from '../types';
import { calculateStudentAttendance, calculateStudentFees, formatCurrency, formatDate } from '../utils/calculations';
import { 
  ShieldCheck, 
  Users, 
  CreditCard, 
  CalendarCheck, 
  BookOpen, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  FileCheck, 
  ArrowLeftRight, 
  RefreshCw,
  Search,
  Check,
  X,
  FileSpreadsheet,
  Info,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';

interface AdminConsoleProps {
  currentUser: User;
  students: Student[];
  courses: Course[];
  attendance: AttendanceRecord[];
  payments: FeePayment[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onAddCourse?: (course: Course) => void;
  onUpdateCourse?: (course: Course) => void;
  onDeleteCourse?: (courseId: string) => void;
  onRecordPayment: (payment: FeePayment) => void;
  onDeletePayment?: (paymentId: string) => void;
  onSaveAttendanceBatch: (records: AttendanceRecord[]) => void;
  onRoleSwitch: (role: UserRole) => void;
  onResetData: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  currentUser,
  students,
  courses,
  attendance,
  payments,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onRecordPayment,
  onDeletePayment,
  onSaveAttendanceBatch,
  onRoleSwitch,
  onResetData,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'condonation' | 'courses' | 'audit' | 'simulation'>('matrix');

  // Condonation Waiver Modal & Form
  const [selectedStudentForWaiver, setSelectedStudentForWaiver] = useState<Student | null>(null);
  const [waiverReason, setWaiverReason] = useState<string>('Certified Medical Leave (Hospital / Physician note verified)');
  const [waiverSessions, setWaiverSessions] = useState<number>(5);
  const [waiverNotes, setWaiverNotes] = useState<string>('');
  const [waiverSuccessMessage, setWaiverSuccessMessage] = useState<string | null>(null);

  // New Course Modal & Form
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDept, setNewCourseDept] = useState('Computer Science');
  const [newCourseSemester, setNewCourseSemester] = useState('Semester 1');
  const [newCourseCredits, setNewCourseCredits] = useState<number>(22);
  const [newCourseTuition, setNewCourseTuition] = useState<number>(85000);
  const [courseFormError, setCourseFormError] = useState<string | null>(null);

  // Void Payment Confirmation
  const [paymentToVoid, setPaymentToVoid] = useState<FeePayment | null>(null);
  const [voidSuccessMessage, setVoidSuccessMessage] = useState<string | null>(null);

  // Search in condonation tab
  const [condonationSearch, setCondonationSearch] = useState('');

  // Shortage students
  const shortageStudents = students.filter((s) => {
    const summary = calculateStudentAttendance(s.id, attendance);
    return summary.isShortage;
  });

  const filteredShortageStudents = shortageStudents.filter((s) => 
    s.name.toLowerCase().includes(condonationSearch.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(condonationSearch.toLowerCase())
  );

  // Aggregate stats
  const totalBilled = students.reduce((acc, s) => acc + s.totalFee, 0);
  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalDues = Math.max(0, totalBilled - totalCollected);

  // Handle Apply Attendance Condonation
  const handleApplyCondonation = () => {
    if (!selectedStudentForWaiver) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Create excused records to boost attendance percentage
    const newRecords: AttendanceRecord[] = [];
    const countToApply = Math.max(1, waiverSessions);
    
    for (let i = 0; i < countToApply; i++) {
      const recDate = new Date();
      recDate.setDate(recDate.getDate() - (i + 1));
      const dateStr = recDate.toISOString().split('T')[0];

      newRecords.push({
        id: `att_cond_${selectedStudentForWaiver.id}_${Date.now()}_${i}`,
        studentId: selectedStudentForWaiver.id,
        courseId: selectedStudentForWaiver.courseId,
        date: dateStr,
        status: 'excused',
        notes: `[ADMIN STATUTORY CONDONATION]: ${waiverReason}. ${waiverNotes ? `Note: ${waiverNotes}` : ''} Approved by ${currentUser.name} at ${timestamp}`,
        markedBy: `${currentUser.name} (Registrar)`,
        updatedAt: new Date().toISOString(),
      });
    }

    onSaveAttendanceBatch(newRecords);
    setWaiverSuccessMessage(
      `Attendance condonation applied for ${selectedStudentForWaiver.name} (${selectedStudentForWaiver.rollNo}). Added ${countToApply} excused sessions to satisfy statutory examination eligibility.`
    );
    setSelectedStudentForWaiver(null);
    setWaiverNotes('');
  };

  // Handle Add New Course
  const handleAddCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCourseFormError(null);

    const code = newCourseCode.trim().toUpperCase();
    const name = newCourseName.trim();

    if (!code || !name) {
      setCourseFormError('Please enter both course code and academic program name.');
      return;
    }

    const courseId = `crs_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const newCourse: Course = {
      id: courseId,
      code,
      name,
      department: newCourseDept,
      semester: newCourseSemester,
      totalCredits: Number(newCourseCredits) || 20,
      tuitionFee: Number(newCourseTuition) || 75000,
    };

    if (onAddCourse) {
      onAddCourse(newCourse);
    }
    setIsAddCourseModalOpen(false);
    setNewCourseCode('');
    setNewCourseName('');
  };

  // Handle Void Payment
  const handleConfirmVoidPayment = () => {
    if (!paymentToVoid || !onDeletePayment) return;
    onDeletePayment(paymentToVoid.id);
    setVoidSuccessMessage(`Receipt #${paymentToVoid.receiptNo} of ${formatCurrency(paymentToVoid.amount)} was voided and removed from ledger.`);
    setPaymentToVoid(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-800/40 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    Institutional Administration & Permissions Console
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400 text-slate-950 uppercase tracking-wider font-mono">
                    Master Admin
                  </span>
                </div>
                <p className="text-xs text-indigo-200">
                  Role-Based Access Control (RBAC), statutory attendance condonations, Bursar financial ledger authority, & curriculum management
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
              <span className="text-slate-400">Authenticated: </span>
              <span className="font-semibold text-white">{currentUser.name}</span>
            </div>
            <button
              onClick={onResetData}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-800 transition"
              title="Reset Firestore and local database to default institutional demonstration state"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Reset Database</span>
            </button>
          </div>
        </div>

        {/* Quick Institutional Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-900/60">
          <div className="bg-slate-900/60 rounded-lg p-3 border border-indigo-900/40">
            <span className="text-[11px] text-indigo-300">Enrolled Students</span>
            <div className="text-xl font-bold text-white mt-0.5">{students.length}</div>
            <span className="text-[10px] text-emerald-400">{students.filter(s => s.status === 'active').length} active profiles</span>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-3 border border-indigo-900/40">
            <span className="text-[11px] text-indigo-300">Academic Programs</span>
            <div className="text-xl font-bold text-white mt-0.5">{courses.length}</div>
            <span className="text-[10px] text-indigo-200">Courses in catalog</span>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-3 border border-indigo-900/40">
            <span className="text-[11px] text-indigo-300">Total Billed Fees</span>
            <div className="text-xl font-bold text-amber-300 mt-0.5">{formatCurrency(totalBilled)}</div>
            <span className="text-[10px] text-amber-200/80">{formatCurrency(totalDues)} outstanding</span>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-3 border border-indigo-900/40">
            <span className="text-[11px] text-indigo-300">Shortage Defaulters</span>
            <div className="text-xl font-bold text-rose-400 mt-0.5">{shortageStudents.length}</div>
            <span className="text-[10px] text-rose-300/80">&lt; 75% attendance</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'matrix'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>RBAC Permissions Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('condonation')}
          className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'condonation'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Statutory Attendance Condonations</span>
          {shortageStudents.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 text-[10px] rounded-full bg-rose-100 text-rose-700 font-bold">
              {shortageStudents.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'courses'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curriculum & Fee Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Bursar Transaction Audit & Void</span>
        </button>

        <button
          onClick={() => setActiveTab('simulation')}
          className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'simulation'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Role Simulation & Preview</span>
        </button>
      </div>

      {/* Messages */}
      {waiverSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{waiverSuccessMessage}</span>
          </div>
          <button onClick={() => setWaiverSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {voidSuccessMessage && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{voidSuccessMessage}</span>
          </div>
          <button onClick={() => setVoidSuccessMessage(null)} className="text-amber-700 hover:text-amber-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: RBAC PERMISSION MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>Role-Based Access Control (RBAC) Entitlements</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison of functional boundaries and security access levels across system personas.
              </p>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded font-medium self-start sm:self-auto">
              Your Privilege: Level 1 Super Administrator
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4 w-1/3">Feature / System Operation</th>
                  <th className="py-3 px-4 bg-indigo-50/70 text-indigo-950 border-x border-slate-200">
                    <div className="flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Administrator (You)</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-slate-900">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-4 h-4 text-sky-600" />
                      <span>Faculty & Teacher</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-slate-900">
                    <div className="flex items-center space-x-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <span>Student Portal</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div>Enroll New Student Record</div>
                    <div className="text-[11px] text-slate-400 font-normal">Add roll number, course allocation, and guardian contact</div>
                  </td>
                  <td className="py-3 px-4 bg-indigo-50/30 font-semibold text-emerald-700 border-x border-slate-200">
                    <span className="flex items-center space-x-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Full Access</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="flex items-center space-x-1 text-slate-400">
                      <X className="w-4 h-4 text-rose-400" />
                      <span>Restricted (View Only)</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="flex items-center space-x-1 text-emerald-600">
                      <Check className="w-4 h-4" />
                      <span>Self-Registration</span>
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div>Edit & Delete Student Profiles</div>
                    <div className="text-[11px] text-slate-400 font-normal">Update student contact details or purge records</div>
                  </td>
                  <td className="py-3 px-4 bg-indigo-50/30 font-semibold text-emerald-700 border-x border-slate-200">
                    <span className="flex items-center space-x-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Full Access</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="flex items-center space-x-1 text-slate-400">
                      <X className="w-4 h-4 text-rose-400" />
                      <span>Restricted</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="flex items-center space-x-1 text-slate-400">
                      <X className="w-4 h-4 text-rose-400" />
                      <span>Restricted</span>
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div>Collect Tuition Fees & Issue Slips</div>
                    <div className="text-[11px] text-slate-400 font-normal">Record bank, cash, card, or UPI payments with receipt serials</div>
                  </td>
                  <td className="py-3 px-4 bg-indigo-50/30 font-semibold text-emerald-700 border-x border-slate-200">
                    <span className="flex items-center space-x-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Full Authority</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="flex items-center space-x-1 text-slate-400">
                      <X className="w-4 h-4 text-rose-400" />
                      <span>Restricted (Audit View)</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="flex items-center space-x-1 text-emerald-600">
                      <Check className="w-4 h-4" />
                      <span>Online Payment Gateway</span>
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div>Void Erroneous Ledger Transactions</div>
                    <div className="text-[11px] text-slate-400 font-normal">Cancel duplicate receipts and recalculate outstanding dues</div>
                  </td>
                  <td className="py-3 px-4 bg-indigo-50/30 font-semibold text-emerald-700 border-x border-slate-200">
                    <span className="flex items-center space-x-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Exclusive Admin Right</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="flex items-center space-x-1 text-slate-400">
                      <X className="w-4 h-4 text-rose-400" />
                      <span>Restricted</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="flex items-center space-x-1 text-slate-400">
                      <X className="w-4 h-4 text-rose-400" />
                      <span>Restricted</span>
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div>Daily Attendance Roll Call</div>
                    <div className="text-[11px] text-slate-400 font-normal">Take class register for lecture sessions</div>
                  </td>
                  <td className="py-3 px-4 bg-indigo-50/30 font-semibold text-emerald-700 border-x border-slate-200">
                    <span className="flex items-center space-x-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Granted</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-emerald-700 font-medium">
                    <span className="flex items-center space-x-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Granted (Primary Responsibility)</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="flex items-center space-x-1 text-slate-400">
                      <X className="w-4 h-4 text-rose-400" />
                      <span>Read-Only Transcript</span>
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div>Attendance Shortage Condonation / Waiver</div>
                    <div className="text-[11px] text-slate-400 font-normal">Grant statutory medical or sports quota waivers for &lt;75% defaulters</div>
                  </td>
                  <td className="py-3 px-4 bg-indigo-50/30 font-semibold text-emerald-700 border-x border-slate-200">
                    <span className="flex items-center space-x-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Exclusive Admin Right</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="flex items-center space-x-1 text-slate-400">
                      <X className="w-4 h-4 text-rose-400" />
                      <span>Restricted (Recommendation Only)</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="flex items-center space-x-1 text-slate-400">
                      <X className="w-4 h-4 text-rose-400" />
                      <span>Restricted</span>
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div>Curriculum Catalog & Tuition Schedules</div>
                    <div className="text-[11px] text-slate-400 font-normal">Add degree courses, set credit ratings, and modify base tuition rates</div>
                  </td>
                  <td className="py-3 px-4 bg-indigo-50/30 font-semibold text-emerald-700 border-x border-slate-200">
                    <span className="flex items-center space-x-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Full Management</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="flex items-center space-x-1 text-slate-400">
                      <X className="w-4 h-4 text-rose-400" />
                      <span>View Enrolled Only</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="flex items-center space-x-1 text-slate-400">
                      <X className="w-4 h-4 text-rose-400" />
                      <span>View Program Details</span>
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div>Database Reset & Cloud Snapshot</div>
                    <div className="text-[11px] text-slate-400 font-normal">Re-initialize Firestore collections to institutional benchmark data</div>
                  </td>
                  <td className="py-3 px-4 bg-indigo-50/30 font-semibold text-emerald-700 border-x border-slate-200">
                    <span className="flex items-center space-x-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Administrator Access</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="flex items-center space-x-1 text-slate-400">
                      <X className="w-4 h-4 text-rose-400" />
                      <span>Restricted</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="flex items-center space-x-1 text-slate-400">
                      <X className="w-4 h-4 text-rose-400" />
                      <span>Restricted</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE STATUTORY CONDONATION */}
      {activeTab === 'condonation' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  Attendance Shortage Condonation & Medical Waivers
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                  {shortageStudents.length} Students &lt; 75%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Under Statutory University Regulations, the Registrar / Dean may grant up to 10% attendance condonation for certified medical conditions or university representation.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={condonationSearch}
                onChange={(e) => setCondonationSearch(e.target.value)}
                placeholder="Search defaulters by name or roll..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          {filteredShortageStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800">No Attendance Shortages Detected</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                All enrolled students currently meet or exceed the mandatory 75% lecture threshold.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Student Name & Roll No</th>
                    <th className="py-3 px-4">Program & Department</th>
                    <th className="py-3 px-4">Current Attendance</th>
                    <th className="py-3 px-4">Shortage Deficit</th>
                    <th className="py-3 px-4 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredShortageStudents.map((student) => {
                    const att = calculateStudentAttendance(student.id, attendance);
                    const course = courses.find((c) => c.id === student.courseId);
                    const deficitSessions = Math.max(1, Math.ceil(0.75 * att.totalSessions) - (att.presentCount + att.lateCount));

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{student.name}</div>
                          <div className="text-[11px] font-mono text-slate-500">{student.rollNo}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-800">{course?.name}</div>
                          <div className="text-[10px] text-slate-400">{course?.department}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-rose-700 text-sm">{att.percentage}%</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                              Defaulter
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {att.presentCount + att.lateCount} / {att.totalSessions} sessions attended
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-amber-800 font-medium">Needs ~{deficitSessions} session(s)</div>
                          <div className="text-[10px] text-slate-400">to reach statutory 75%</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedStudentForWaiver(student);
                              setWaiverSessions(deficitSessions);
                            }}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-700 hover:bg-indigo-800 text-white shadow-xs transition"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Grant Condonation</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CURRICULUM & DEGREE PROGRAMS */}
      {activeTab === 'courses' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Academic Degree Programs & Tuition Structures</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage university course codes, department allocations, required credit hours, and annual tuition benchmarks.
              </p>
            </div>

            <button
              onClick={() => setIsAddCourseModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Degree Program</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => {
              const enrolledCount = students.filter((s) => s.courseId === course.id).length;
              return (
                <div key={course.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono text-[11px] font-bold">
                        {course.code}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{course.name}</h3>
                      <div className="text-xs text-slate-500">{course.department}</div>
                    </div>
                    {onDeleteCourse && courses.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete course ${course.code}?`)) {
                            onDeleteCourse(course.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete Course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Enrolled</span>
                      <span className="font-semibold text-slate-800">{enrolledCount} Students</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Credit Hours</span>
                      <span className="font-semibold text-slate-800">{course.totalCredits} Credits</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Standard Fee</span>
                      <span className="font-semibold text-emerald-700">{formatCurrency(course.tuitionFee || 85000)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: BURSAR TRANSACTION AUDIT & VOID */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span>Bursar Official Receipt Register & Ledger Void Control</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Admins have exclusive permission to audit all fee collections and void erroneous receipt entries.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
              {payments.length} Total Issued Receipts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Student & Roll No</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Date & Recorded By</th>
                  <th className="py-3 px-4 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payments.map((p) => {
                  const student = students.find((s) => s.id === p.studentId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-700">
                        {p.receiptNo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{student?.name || 'Unknown Student'}</div>
                        <div className="text-[11px] font-mono text-slate-400">{student?.rollNo}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700 text-sm">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-800 border border-slate-200">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800">{formatDate(p.paymentDate)}</div>
                        <div className="text-[10px] text-slate-400">By: {p.recordedBy}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {onDeletePayment && (
                          <button
                            onClick={() => setPaymentToVoid(p)}
                            className="inline-flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded transition"
                            title="Void and cancel this transaction from the official university ledger"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Void Slip</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ROLE SIMULATION & PREVIEW */}
      {activeTab === 'simulation' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
              <span>Permission Simulation & View Testing</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly switch into lower-privilege roles to verify that unauthorized features (like student deletion, tuition adjustments, and receipt voiding) are strictly blocked for staff and students.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Admin Card */}
            <div className="p-5 rounded-xl border-2 border-indigo-500 bg-indigo-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-indigo-950 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Administrator (Current)</span>
                </span>
                <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-indigo-900">
                Full root permissions across student enrollments, fee collection, attendance condonations, and database maintenance.
              </p>
              <div className="text-[11px] text-indigo-700 font-mono">
                Clearance: Level 1 Read & Write
              </div>
            </div>

            {/* Teacher Card */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Faculty & Teacher</span>
                </span>
                <button
                  onClick={() => onRoleSwitch('teacher')}
                  className="text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1 rounded shadow-xs transition"
                >
                  Simulate
                </button>
              </div>
              <p className="text-xs text-slate-600">
                Classroom roll call marking and student roster viewing. Cannot add/delete students or record payments.
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                Clearance: Level 2 Faculty
              </div>
            </div>

            {/* Student Card */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Student Self-Service</span>
                </span>
                <button
                  onClick={() => onRoleSwitch('student')}
                  className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded shadow-xs transition"
                >
                  Simulate
                </button>
              </div>
              <p className="text-xs text-slate-600">
                Personal transcript checking, payment receipt downloads, and self-service online fee payments.
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                Clearance: Student Self-Only
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Apply Attendance Condonation Waiver */}
      {/* ========================================================= */}
      {selectedStudentForWaiver && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Grant Official Attendance Condonation
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Statutory Attendance Regulation Waiver
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForWaiver(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-900">{selectedStudentForWaiver.name}</div>
              <div className="text-slate-500 font-mono">Roll: {selectedStudentForWaiver.rollNo}</div>
              <div className="text-slate-500">
                Course: {courses.find((c) => c.id === selectedStudentForWaiver.courseId)?.name}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Statutory Grounds for Exemption
                </label>
                <select
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="Certified Medical Leave (Hospital / Physician note verified)">
                    Certified Medical Leave (Hospital / Physician Certificate)
                  </option>
                  <option value="Official University Sports / Athletic Representation">
                    Official University Sports / Athletic Representation
                  </option>
                  <option value="Approved Academic Conference / Hackathon Delegation">
                    Approved Academic Conference / Hackathon Delegation
                  </option>
                  <option value="Bereavement / Extreme Compassionate Grounds">
                    Bereavement / Extreme Compassionate Grounds
                  </option>
                  <option value="Special Chancellor / Dean Administrative Discretion">
                    Special Chancellor / Dean Administrative Discretion
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Excused Sessions to Credit
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={waiverSessions}
                  onChange={(e) => setWaiverSessions(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Credits these sessions as authorized 'Excused' to meet the 75% threshold.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Verification & Notes (Optional)
                </label>
                <input
                  type="text"
                  value={waiverNotes}
                  onChange={(e) => setWaiverNotes(e.target.value)}
                  placeholder="e.g. Medical Cert #MD-8821 verified by University Health Center"
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedStudentForWaiver(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCondonation}
                className="px-4 py-2 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg shadow-sm transition"
              >
                Sign & Authorize Condonation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Add Degree Program */}
      {/* ========================================================= */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Add Academic Degree Program
                </h3>
              </div>
              <button
                onClick={() => setIsAddCourseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {courseFormError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {courseFormError}
              </div>
            )}

            <form onSubmit={handleAddCourseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Code (e.g. AI-501)</label>
                <input
                  type="text"
                  required
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  placeholder="AI-501"
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Degree Program Name</label>
                <input
                  type="text"
                  required
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="B.Tech Artificial Intelligence & Machine Learning"
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newCourseDept}
                    onChange={(e) => setNewCourseDept(e.target.value)}
                    placeholder="Computer Science"
                    className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                  <input
                    type="text"
                    value={newCourseSemester}
                    onChange={(e) => setNewCourseSemester(e.target.value)}
                    placeholder="Semester 1"
                    className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Credits</label>
                  <input
                    type="number"
                    value={newCourseCredits}
                    onChange={(e) => setNewCourseCredits(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Annual Fee (₹)</label>
                  <input
                    type="number"
                    value={newCourseTuition}
                    onChange={(e) => setNewCourseTuition(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg shadow-sm transition"
                >
                  Add Course to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Void Ledger Payment Confirmation */}
      {/* ========================================================= */}
      {paymentToVoid && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Void Official Payment Slip?
                </h3>
                <p className="text-xs text-slate-500">
                  Receipt #{paymentToVoid.receiptNo}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to void this transaction of <strong className="text-slate-900">{formatCurrency(paymentToVoid.amount)}</strong>? 
              This will permanently delete the transaction record from Firebase Firestore and restore the student's unpaid dues balance accordingly.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPaymentToVoid(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg"
              >
                Keep Receipt
              </button>
              <button
                type="button"
                onClick={handleConfirmVoidPayment}
                className="px-4 py-2 text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white rounded-lg shadow-sm transition"
              >
                Confirm Void & Delete Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
