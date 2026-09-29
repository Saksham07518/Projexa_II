import React, { useState } from 'react';
import { User, Student, Course, AttendanceRecord, FeePayment } from '../types';
import { 
  calculateStudentAttendance, 
  calculateStudentFees, 
  formatCurrency, 
  formatDate 
} from '../utils/calculations';
import { 
  Building2, 
  GraduationCap, 
  CalendarCheck, 
  CreditCard, 
  LogOut, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Download, 
  Printer, 
  X, 
  UserCheck, 
  Phone, 
  Mail, 
  BookOpen, 
  ShieldAlert, 
  IndianRupee,
  Receipt,
  Sparkles,
  Flame
} from 'lucide-react';

interface StudentPortalProps {
  currentUser: User;
  students: Student[];
  courses: Course[];
  attendance: AttendanceRecord[];
  payments: FeePayment[];
  onRecordPayment: (payment: FeePayment) => void;
  onLogout: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  students,
  courses,
  attendance,
  payments,
  onRecordPayment,
  onLogout,
}) => {
  // Find logged in student
  const student = students.find(
    (s) => s.id === currentUser.studentId || s.rollNo.toUpperCase() === currentUser.rollNo?.toUpperCase()
  ) || students[0];

  const course = courses.find((c) => c.id === student?.courseId);

  // Student specific data
  const studentAttendanceRecords = attendance
    .filter((a) => a.studentId === student?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const studentPayments = payments
    .filter((p) => p.studentId === student?.id)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  const attendanceSummary = student ? calculateStudentAttendance(student.id, studentAttendanceRecords) : null;
  const feeSummary = student ? calculateStudentFees(student, payments) : null;

  // View tabs
  const [activeTab, setActiveTab] = useState<'attendance' | 'fees' | 'course'>('attendance');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent'>('all');

  // Receipt modal state
  const [viewingReceipt, setViewingReceipt] = useState<FeePayment | null>(null);

  // Online Pay Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'Online/UPI' | 'Bank Transfer' | 'Credit/Debit Card'>('Online/UPI');
  const [payNotes, setPayNotes] = useState('Online fee payment via Student Portal');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  const filteredAttendance = studentAttendanceRecords.filter((r) => {
    if (attendanceFilter === 'all') return true;
    if (attendanceFilter === 'present') return r.status === 'present' || r.status === 'late';
    if (attendanceFilter === 'absent') return r.status === 'absent';
    return true;
  });

  const handleOpenPayModal = () => {
    if (feeSummary) {
      setPayAmount(feeSummary.balance > 0 ? feeSummary.balance.toString() : '5000');
    }
    setPaymentSuccessMsg(null);
    setIsPayModalOpen(true);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const receiptNum = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPay: FeePayment = {
      id: `pay_${Date.now()}`,
      receiptNo: receiptNum,
      studentId: student.id,
      amount: amountNum,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: payMethod,
      recordedBy: 'Student Portal (Online Gateway)',
      notes: payNotes,
    };

    onRecordPayment(newPay);
    setPaymentSuccessMsg(`Payment of ${formatCurrency(amountNum)} processed successfully. Receipt #${receiptNum} generated.`);
    setTimeout(() => {
      setIsPayModalOpen(false);
      setPaymentSuccessMsg(null);
    }, 2200);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm border border-emerald-500">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm sm:text-base tracking-tight text-white">
                    CAMPUS REGISTRY
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    STUDENT PORTAL
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Student Self-Service Attendance & Bursar Clearance
                </p>
              </div>
            </div>

            {/* Student Info & Logout */}
            <div className="flex items-center space-x-3">
              <div 
                title="Connected to Firebase Cloud Firestore for real-time fee receipts and attendance sync"
                className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-800 rounded-md text-[11px] text-emerald-300"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono text-[10px]">Cloud Synced</span>
              </div>

              <div className="hidden sm:flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  {student?.name?.charAt(0) || 'S'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-white leading-tight">
                    {student?.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {student?.rollNo}
                  </div>
                </div>
              </div>

              <button
                id="btn-student-logout"
                onClick={onLogout}
                className="flex items-center space-x-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-md border border-slate-700 transition"
                title="Sign out of student account"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="bg-slate-950 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-2 py-1">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-medium transition ${
                  activeTab === 'attendance'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <CalendarCheck className="w-4 h-4" />
                <span>My Attendance History</span>
              </button>
              <button
                onClick={() => setActiveTab('fees')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-medium transition ${
                  activeTab === 'fees'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Fee Ledger & Receipts</span>
              </button>
              <button
                onClick={() => setActiveTab('course')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-medium transition ${
                  activeTab === 'course'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Academic Program</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Student Profile Dossier Banner */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                {student?.name?.charAt(0)}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    {student?.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Student
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-mono font-medium text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    Roll No: {student?.rollNo}
                  </span>
                  <span>Program: {course?.name} ({student?.semester})</span>
                  <span>•</span>
                  <span>Dept: {course?.department}</span>
                </div>
              </div>
            </div>

            {/* Contact Chips */}
            <div className="flex flex-wrap gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-1.5 pr-3 border-r border-slate-200">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{student?.email}</span>
              </div>
              <div className="flex items-center space-x-1.5 pr-3 border-r border-slate-200">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Student: {student?.phone}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Guardian: {student?.parentPhone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top 2 Primary Status Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Attendance Standing */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <CalendarCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Attendance Standing</h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">Statutory Mandate: 75%</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-3xl font-extrabold tracking-tight ${
                    attendanceSummary && attendanceSummary.percentage < 75 ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {attendanceSummary ? `${attendanceSummary.percentage}%` : '0%'}
                  </span>
                  <span className="text-xs text-slate-500">Aggregate Present</span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Attended {attendanceSummary?.presentCount || 0} of {attendanceSummary?.totalSessions || 0} total scheduled lectures
                </div>
              </div>

              {/* Status Badge */}
              {attendanceSummary && attendanceSummary.percentage < 75 ? (
                <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Shortage Deficit</span>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Exam Eligible</span>
                </div>
              )}
            </div>

            {/* Attendance Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-500 ${
                    attendanceSummary && attendanceSummary.percentage < 75 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, attendanceSummary?.percentage || 0)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0%</span>
                <span className="font-semibold text-slate-600">75% (Exam Threshold)</span>
                <span>100%</span>
              </div>
            </div>

            {/* Regulatory Advice Box */}
            {attendanceSummary && attendanceSummary.percentage < 75 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Attendance Shortage Warning: </span>
                  Your current attendance is below the university required 75%. You are at risk of being debarred from the end-semester examinations. Please contact your course coordinator immediately.
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Good Academic Standing: </span>
                  Your attendance satisfies institutional requirements. You are eligible for end-semester admit card generation.
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Fee Ledger & Clearance */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <IndianRupee className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Bursar Fee Account</h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">Academic Year 2025–26</span>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
              <div>
                <span className="text-[11px] text-slate-500 block">Total Tuition Fee</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(feeSummary?.totalFee || student?.totalFee || 0)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Paid Amount</span>
                <span className="text-sm font-bold text-emerald-600">
                  {formatCurrency(feeSummary?.paidAmount || 0)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Balance Pending</span>
                <span className={`text-sm font-bold ${feeSummary && feeSummary.balance > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {formatCurrency(feeSummary?.balance || 0)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs text-slate-500 block">Bursar Clearance Status:</span>
                <span className="text-xs font-bold text-slate-900">
                  {feeSummary && feeSummary.status === 'paid' ? (
                    <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Full Fee Cleared • No Dues Certificate Issued</span>
                    </span>
                  ) : feeSummary && feeSummary.status === 'partial' ? (
                    <span className="text-amber-700 font-semibold flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Partial Dues Pending ({formatCurrency(feeSummary.balance)})</span>
                    </span>
                  ) : (
                    <span className="text-rose-700 font-semibold flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Unpaid • Immediate Clearance Required</span>
                    </span>
                  )}
                </span>
              </div>

              {feeSummary && feeSummary.balance > 0 && (
                <button
                  id="btn-student-pay-dues"
                  onClick={handleOpenPayModal}
                  className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay Dues Online</span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-500">
              Receipt count: {studentPayments.length} transactions recorded on official university bursar ledger.
            </div>
          </div>
        </div>

        {/* Interactive Tabbed Content */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:px-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Daily Lecture Attendance Log</h3>
                <p className="text-xs text-slate-500">
                  Official roll calls recorded by faculty instructors for {course?.name}
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setAttendanceFilter('all')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    attendanceFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Sessions ({studentAttendanceRecords.length})
                </button>
                <button
                  onClick={() => setAttendanceFilter('present')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    attendanceFilter === 'present' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Present ({attendanceSummary?.presentCount || 0})
                </button>
                <button
                  onClick={() => setAttendanceFilter('absent')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    attendanceFilter === 'absent' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Absent ({attendanceSummary?.absentCount || 0})
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Course / Subject</th>
                    <th className="px-4 py-3 font-semibold">Instructor</th>
                    <th className="px-4 py-3 font-semibold">Attendance Status</th>
                    <th className="px-4 py-3 font-semibold">Absence Remarks / Duty Leave</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No session records match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                          {formatDate(record.date)}
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          <span className="font-mono text-slate-500 mr-1.5">{course?.code}</span>
                          {course?.name}
                        </td>
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          {record.markedBy}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {record.status === 'present' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              Present
                            </span>
                          ) : record.status === 'absent' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">
                              Absent
                            </span>
                          ) : record.status === 'late' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                              Late Arrival
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-800">
                              Excused / On-Duty
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 italic">
                          {record.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fees Tab */}
        {activeTab === 'fees' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Official Fee Clearance Receipts</h3>
                <p className="text-xs text-slate-500">
                  Electronic receipts issued by the University Bursar & Accounts Office
                </p>
              </div>
              {feeSummary && feeSummary.balance > 0 && (
                <button
                  onClick={handleOpenPayModal}
                  className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay Remaining Balance</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Receipt Number</th>
                    <th className="px-4 py-3 font-semibold">Payment Date</th>
                    <th className="px-4 py-3 font-semibold">Amount Paid</th>
                    <th className="px-4 py-3 font-semibold">Payment Mode</th>
                    <th className="px-4 py-3 font-semibold">Bursar Remarks</th>
                    <th className="px-4 py-3 font-semibold text-right">Official Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No payments recorded yet for this student account.
                      </td>
                    </tr>
                  ) : (
                    studentPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-blue-800 whitespace-nowrap">
                          {p.receiptNo}
                        </td>
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          {formatDate(p.paymentDate)}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-medium">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {p.notes || 'Tuition Clearance'}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            id={`btn-view-receipt-${p.receiptNo}`}
                            onClick={() => setViewingReceipt(p)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 text-blue-700 hover:text-blue-800 border border-slate-300 font-semibold text-xs transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View / Print Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Academic Course Info Tab */}
        {activeTab === 'course' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Academic Program Curriculum
              </h3>
              <p className="text-xs text-slate-500">
                Departmental syllabus schedule and faculty course coordinator
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 block">Course Code</span>
                <span className="text-base font-bold font-mono text-slate-900">{course?.code}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 block">Program Name</span>
                <span className="text-sm font-bold text-slate-900">{course?.name}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 block">Academic Credits</span>
                <span className="text-base font-bold text-slate-900">{course?.totalCredits} Credits</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 block">Assigned Department</span>
                <span className="text-sm font-bold text-slate-900">{course?.department}</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50/60 rounded-lg border border-blue-200 text-xs text-slate-700 space-y-2">
              <div className="font-bold text-blue-900 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-blue-700" />
                <span>Examination Eligibility Guidelines</span>
              </div>
              <p>
                As per Central University regulations, admit cards for end-semester examinations are automatically issued to students who maintain at least <strong>75% attendance</strong> and hold a <strong>Zero Balance Fee Clearance Slip</strong> from the Accounts Office.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL: ONLINE FEE PAYMENT FOR STUDENTS */}
      {/* ========================================================= */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <IndianRupee className="w-5 h-5 text-blue-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Student Fee Clearance Gateway
                </h3>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              {paymentSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{paymentSuccessMsg}</span>
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-bold text-slate-900">{student?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Roll Number:</span>
                  <span className="font-mono font-semibold text-slate-900">{student?.rollNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Outstanding:</span>
                  <span className="font-bold text-rose-600">
                    {formatCurrency(feeSummary?.balance || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount (₹ INR)
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  max={feeSummary?.balance ? feeSummary.balance + 10000 : 200000}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Mode / Gateway
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  <option value="Online/UPI">UPI / QR Code (Google Pay, PhonePe, Paytm)</option>
                  <option value="Bank Transfer">Net Banking (SBI, HDFC, ICICI, PNB)</option>
                  <option value="Credit/Debit Card">Credit / Debit Card (RuPay, Visa, Mastercard)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Narration
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm"
                >
                  Confirm & Clear Fee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: OFFICIAL PRINTABLE RECEIPT */}
      {/* ========================================================= */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-700" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Official Institutional Fee Receipt
                </span>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5" id="student-printable-receipt">
              {/* Header */}
              <div className="text-center pb-4 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  CENTRAL UNIVERSITY ACADEMIC REGISTRY
                </h2>
                <p className="text-xs text-slate-500">
                  Office of the Bursar & Student Accounts • Digital Fee Voucher
                </p>
                <div className="mt-2 inline-block px-2.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-900 font-mono text-xs font-semibold">
                  Receipt No: {viewingReceipt.receiptNo}
                </div>
              </div>

              {/* Receipt Details */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Student Name:</span>
                    <span className="font-bold text-slate-900">{student?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Roll Number:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {student?.rollNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Academic Course:</span>
                    <span className="font-medium text-slate-800">{course?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Payment Date:</span>
                    <span className="font-medium text-slate-800">
                      {formatDate(viewingReceipt.paymentDate)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-b border-slate-200 py-3 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Payment Mode:</span>
                    <span className="font-medium text-slate-900">{viewingReceipt.paymentMethod}</span>
                  </div>
                  {viewingReceipt.notes && (
                    <div className="flex justify-between text-slate-600">
                      <span>Narration / Notes:</span>
                      <span className="font-medium text-slate-800">{viewingReceipt.notes}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                    <span>Amount Received:</span>
                    <span className="text-blue-700">{formatCurrency(viewingReceipt.amount)}</span>
                  </div>
                  {feeSummary && (
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Remaining Balance:</span>
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(feeSummary.balance)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-between items-end text-[11px] text-slate-500">
                  <div>
                    <div>Recorded By: {viewingReceipt.recordedBy}</div>
                    <div>Computerized Institutional Voucher</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-800">Finance & Bursar Seal</div>
                    <div className="text-emerald-600 font-bold">VERIFIED DIGITAL SLIP</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">Valid for admit card verification</span>
              <div className="flex space-x-2">
                <button
                  onClick={handlePrintReceipt}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded bg-blue-700 hover:bg-blue-800 text-white flex items-center space-x-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setViewingReceipt(null)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
