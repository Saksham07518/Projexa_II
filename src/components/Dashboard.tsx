import React from 'react';
import { Student, Course, AttendanceRecord, FeePayment, User } from '../types';
import { 
  calculateStudentAttendance, 
  calculateStudentFees, 
  formatCurrency, 
  formatDate 
} from '../utils/calculations';
import { 
  Users, 
  CalendarCheck2, 
  CreditCard, 
  AlertTriangle, 
  ArrowUpRight, 
  TrendingUp, 
  Plus, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  BookOpen,
  IndianRupee
} from 'lucide-react';

interface DashboardProps {
  students: Student[];
  courses: Course[];
  attendance: AttendanceRecord[];
  payments: FeePayment[];
  currentUser: User;
  onNavigateTab: (tab: 'dashboard' | 'attendance' | 'fees' | 'students' | 'reports') => void;
  onOpenRecordPayment: (studentId?: string) => void;
  onOpenAddStudent: () => void;
  onSelectStudent: (student: Student) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  students,
  courses,
  attendance,
  payments,
  currentUser,
  onNavigateTab,
  onOpenRecordPayment,
  onOpenAddStudent,
  onSelectStudent,
}) => {
  // Aggregate Metrics
  const activeStudents = students.filter((s) => s.status === 'active');
  const totalStudents = students.length;

  // Attendance metrics
  const studentAttendanceSummaries = students.map((s) => ({
    student: s,
    summary: calculateStudentAttendance(s.id, attendance),
  }));

  const studentsWithShortage = studentAttendanceSummaries.filter(
    (item) => item.summary.totalSessions > 0 && item.summary.isShortage
  );

  const totalSessionsAll = studentAttendanceSummaries.reduce(
    (acc, curr) => acc + curr.summary.totalSessions,
    0
  );
  const totalAttendedAll = studentAttendanceSummaries.reduce(
    (acc, curr) => acc + curr.summary.presentCount + curr.summary.lateCount,
    0
  );
  const overallAttendanceRate =
    totalSessionsAll > 0 ? Math.round((totalAttendedAll / totalSessionsAll) * 100) : 0;

  // Fee metrics
  const studentFeeSummaries = students.map((s) => ({
    student: s,
    summary: calculateStudentFees(s, payments),
  }));

  const totalBilledFees = students.reduce((acc, s) => acc + s.totalFee, 0);
  const totalCollectedFees = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalPendingFees = Math.max(0, totalBilledFees - totalCollectedFees);
  const feeCollectionRate =
    totalBilledFees > 0 ? Math.round((totalCollectedFees / totalBilledFees) * 100) : 0;

  // Recent 5 fee payments
  const recentPayments = [...payments]
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
    .slice(0, 5);

  // Highest pending balances
  const topPendingStudents = [...studentFeeSummaries]
    .filter((item) => item.summary.balance > 0)
    .sort((a, b) => b.summary.balance - a.summary.balance)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome with Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Academic & Financial Overview
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-medium">
              Active Semester
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time administrative control panel for attendance tracking, student registry, and fee reconciliations.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-quick-attendance"
            onClick={() => onNavigateTab('attendance')}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium rounded-md bg-blue-700 text-white hover:bg-blue-800 shadow-xs transition"
          >
            <CalendarCheck2 className="w-3.5 h-3.5" />
            <span>Mark Daily Attendance</span>
          </button>

          {currentUser.role === 'admin' && (
            <>
              <button
                id="btn-quick-record-payment"
                onClick={() => onOpenRecordPayment()}
                className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition"
              >
                <IndianRupee className="w-3.5 h-3.5 text-blue-400" />
                <span>Collect Fee</span>
              </button>

              <button
                id="btn-quick-add-student"
                onClick={onOpenAddStudent}
                className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Enroll Student</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Enrolled */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="w-8 h-8 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{totalStudents}</span>
            <span className="text-xs text-slate-500 font-medium">
              {activeStudents.length} Active ({courses.length} Programs)
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Course Distribution</span>
            <button
              onClick={() => onNavigateTab('students')}
              className="text-blue-700 hover:text-blue-900 font-medium inline-flex items-center space-x-1"
            >
              <span>View Roster</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 2: Attendance Rate */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Average Attendance
            </span>
            <div className="w-8 h-8 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4 text-blue-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{overallAttendanceRate}%</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {totalSessionsAll} Recorded Marks
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className={`${studentsWithShortage.length > 0 ? 'text-amber-700 font-medium' : 'text-slate-500'}`}>
              {studentsWithShortage.length} Shortage Alerts (&lt;75%)
            </span>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-blue-700 hover:text-blue-900 font-medium inline-flex items-center space-x-1"
            >
              <span>Take Register</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 3: Total Collected Fees */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Fees Collected
            </span>
            <div className="w-8 h-8 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-blue-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalCollectedFees)}
            </span>
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {feeCollectionRate}% Collected
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Billed: {formatCurrency(totalBilledFees)}</span>
            <button
              onClick={() => onNavigateTab('fees')}
              className="text-blue-700 hover:text-blue-900 font-medium inline-flex items-center space-x-1"
            >
              <span>Fee Ledger</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 4: Outstanding Dues */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Pending Dues
            </span>
            <div className="w-8 h-8 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalPendingFees)}
            </span>
            <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
              {topPendingStudents.length} Accounts Due
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Accounts Receivable</span>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-blue-700 hover:text-blue-900 font-medium inline-flex items-center space-x-1"
            >
              <span>Defaulters</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Operations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Watchlist & Shortage Notices */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                  Attendance Watchlist (&lt;75% Threshold)
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Mandatory Academic Minimum: 75%
              </span>
            </div>

            <div className="mt-4">
              {studentsWithShortage.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  No students are currently below the 75% attendance threshold.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {studentsWithShortage.map(({ student, summary }) => {
                    const course = courses.find((c) => c.id === student.courseId);
                    return (
                      <div
                        key={student.id}
                        className="py-3 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded transition"
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {student.rollNo}
                            </span>
                            <span className="text-sm font-semibold text-slate-900 truncate">
                              {student.name}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center space-x-3">
                            <span>{course?.code || 'Course'}</span>
                            <span>•</span>
                            <span>
                              Attended: {summary.presentCount + summary.lateCount} / {summary.totalSessions} sessions
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              {summary.percentage}%
                            </span>
                            <div className="text-[10px] text-rose-600 mt-0.5 font-medium">
                              Defaulter Alert
                            </div>
                          </div>
                          <button
                            onClick={() => onSelectStudent(student)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            title="Inspect Student Record"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Automatic alert generated based on recorded attendance records
            </span>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-xs font-medium text-blue-700 hover:text-blue-900 inline-flex items-center space-x-1"
            >
              <span>Manage Class Attendance</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Fee Transactions & Receivables */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                  Latest Fee Transactions
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Verified Receipts
              </span>
            </div>

            <div className="mt-4">
              {recentPayments.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  No fee payment transactions recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentPayments.map((payment) => {
                    const student = students.find((s) => s.id === payment.studentId);
                    return (
                      <div
                        key={payment.id}
                        className="py-3 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded transition"
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-medium text-blue-800 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                              {payment.receiptNo}
                            </span>
                            <span className="text-sm font-semibold text-slate-900 truncate">
                              {student?.name || 'Student'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center space-x-3">
                            <span>{formatDate(payment.paymentDate)}</span>
                            <span>•</span>
                            <span>{payment.paymentMethod}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-900">
                            +{formatCurrency(payment.amount)}
                          </span>
                          <div className="text-[10px] text-slate-500">
                            Recorded by {payment.recordedBy}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Total {payments.length} transactions processed
            </span>
            <button
              onClick={() => onNavigateTab('fees')}
              className="text-xs font-medium text-blue-700 hover:text-blue-900 inline-flex items-center space-x-1"
            >
              <span>Open Fee Register</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Program / Course Summary Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Departmental Academic Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Course-wise student distribution, cumulative attendance percentage, and fee billing.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-600 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 font-semibold">Course Code</th>
                <th className="py-2.5 px-3 font-semibold">Program Name</th>
                <th className="py-2.5 px-3 font-semibold">Semester</th>
                <th className="py-2.5 px-3 font-semibold">Enrolled</th>
                <th className="py-2.5 px-3 font-semibold">Avg Attendance</th>
                <th className="py-2.5 px-3 font-semibold">Fee Collection</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {courses.map((course) => {
                const enrolled = students.filter((s) => s.courseId === course.id);
                const courseRecords = attendance.filter((a) => a.courseId === course.id);
                const attendedMarks = courseRecords.filter(
                  (a) => a.status === 'present' || a.status === 'late'
                ).length;
                const avgCourseAttendance =
                  courseRecords.length > 0
                    ? Math.round((attendedMarks / courseRecords.length) * 100)
                    : 100;

                const courseBilled = enrolled.reduce((acc, s) => acc + s.totalFee, 0);
                const courseStudentIds = new Set(enrolled.map((s) => s.id));
                const courseCollected = payments
                  .filter((p) => courseStudentIds.has(p.studentId))
                  .reduce((sum, p) => sum + p.amount, 0);
                const courseCollPct =
                  courseBilled > 0 ? Math.round((courseCollected / courseBilled) * 100) : 0;

                return (
                  <tr key={course.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-medium text-blue-800">
                      {course.code}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{course.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{course.semester}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{enrolled.length}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-semibold ${
                            avgCourseAttendance < 75 ? 'text-rose-700' : 'text-slate-800'
                          }`}
                        >
                          {avgCourseAttendance}%
                        </span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              avgCourseAttendance < 75 ? 'bg-rose-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${avgCourseAttendance}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-800">
                        {formatCurrency(courseCollected)}
                      </span>
                      <span className="text-slate-500 text-[11px] ml-1">({courseCollPct}%)</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onNavigateTab('attendance')}
                        className="px-2.5 py-1 text-xs font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
                      >
                        Register
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
