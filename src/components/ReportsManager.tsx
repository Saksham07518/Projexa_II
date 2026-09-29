import React, { useState, useRef, useEffect } from 'react';
import { Student, Course, AttendanceRecord, FeePayment, User } from '../types';
import { 
  calculateStudentAttendance, 
  calculateStudentFees, 
  formatCurrency, 
  formatDate 
} from '../utils/calculations';
import { 
  FileSpreadsheet, 
  AlertTriangle, 
  CreditCard, 
  Download, 
  Printer, 
  Phone, 
  Mail, 
  CalendarCheck2,
  Users,
  CheckCircle2,
  ArrowRight,
  Archive,
  FolderDown,
  FileText,
  ChevronDown,
  Database,
  Check,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

interface ReportsManagerProps {
  students: Student[];
  courses: Course[];
  attendance: AttendanceRecord[];
  payments: FeePayment[];
  currentUser: User;
  onSelectStudent: (student: Student) => void;
  onOpenRecordPayment: (studentId: string) => void;
}

export const ReportsManager: React.FC<ReportsManagerProps> = ({
  students,
  courses,
  attendance,
  payments,
  currentUser,
  onSelectStudent,
  onOpenRecordPayment,
}) => {
  const [activeReport, setActiveReport] = useState<'attendance_shortage' | 'fee_dues' | 'archive_export'>('attendance_shortage');
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Flash export success notification
  const flashSuccess = (message: string) => {
    setExportSuccessMessage(message);
    setTimeout(() => {
      setExportSuccessMessage(null);
    }, 4500);
  };

  // Safe CSV cell escaping
  const escapeCsv = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  // Safe client-side file downloader using Blob + UTF-8 BOM
  const triggerCsvDownload = (filename: string, csvContent: string, count: number, label: string) => {
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    flashSuccess(`Exported ${count} ${label} to ${filename} for offline archiving.`);
    setExportDropdownOpen(false);
  };

  const currentDateStr = new Date().toISOString().split('T')[0];

  // Attendance Defaulters (< 75%)
  const attendanceDefaulters = students
    .map((s) => ({
      student: s,
      course: courses.find((c) => c.id === s.courseId),
      att: calculateStudentAttendance(s.id, attendance),
      fee: calculateStudentFees(s, payments),
    }))
    .filter((item) => item.att.totalSessions > 0 && item.att.isShortage)
    .sort((a, b) => a.att.percentage - b.att.percentage);

  // Fee Defaulters (balance > 0)
  const feeDefaulters = students
    .map((s) => ({
      student: s,
      course: courses.find((c) => c.id === s.courseId),
      att: calculateStudentAttendance(s.id, attendance),
      fee: calculateStudentFees(s, payments),
    }))
    .filter((item) => item.fee.balance > 0)
    .sort((a, b) => b.fee.balance - a.fee.balance);

  // 1. Export Attendance Shortage Defaulters CSV
  const exportAttendanceDefaultersCSV = () => {
    const headers = [
      'Roll Number',
      'Student Name',
      'Student Email',
      'Program Code',
      'Program Name',
      'Semester',
      'Parent Phone',
      'Student Phone',
      'Attended Sessions',
      'Total Sessions',
      'Attendance Percentage',
      'Shortage Deficit',
      'Intervention Status'
    ];
    let rows = headers.map(escapeCsv).join(',') + '\n';

    attendanceDefaulters.forEach(({ student, course, att }) => {
      const margin = 75 - att.percentage;
      const attended = att.presentCount + att.lateCount;
      const row = [
        student.rollNo,
        student.name,
        student.email,
        course?.code || '',
        course?.name || '',
        student.semester,
        student.parentPhone,
        student.phone,
        attended,
        att.totalSessions,
        `${att.percentage}%`,
        `-${margin}%`,
        'Critical Defaulter (< 75%)'
      ];
      rows += row.map(escapeCsv).join(',') + '\n';
    });

    triggerCsvDownload(
      `Attendance_Shortage_Defaulters_${currentDateStr}.csv`,
      rows,
      attendanceDefaulters.length,
      'defaulter records'
    );
  };

  // 2. Export Outstanding Fee Defaulters CSV
  const exportFeeDefaultersCSV = () => {
    const headers = [
      'Roll Number',
      'Student Name',
      'Student Email',
      'Program Code',
      'Program Name',
      'Semester',
      'Parent Contact',
      'Student Contact',
      'Total Tuition Fee (INR)',
      'Amount Paid (INR)',
      'Outstanding Balance (INR)',
      'Account Status',
      'Receipts Issued',
      'Last Payment Date'
    ];
    let rows = headers.map(escapeCsv).join(',') + '\n';

    feeDefaulters.forEach(({ student, course, fee }) => {
      const row = [
        student.rollNo,
        student.name,
        student.email,
        course?.code || '',
        course?.name || '',
        student.semester,
        student.parentPhone,
        student.phone,
        fee.totalFee,
        fee.paidAmount,
        fee.balance,
        fee.status === 'partial' ? 'Partial Balance' : 'Unpaid',
        fee.paymentsCount,
        fee.lastPaymentDate ? formatDate(fee.lastPaymentDate) : 'No Payments'
      ];
      rows += row.map(escapeCsv).join(',') + '\n';
    });

    triggerCsvDownload(
      `Fee_Defaulters_Dues_${currentDateStr}.csv`,
      rows,
      feeDefaulters.length,
      'fee due records'
    );
  };

  // 3. Export Comprehensive Student Attendance Summary (All Students)
  const exportAllAttendanceSummaryCSV = () => {
    const headers = [
      'Roll Number',
      'Student Name',
      'Email',
      'Contact Phone',
      'Parent Phone',
      'Program Code',
      'Program Name',
      'Semester',
      'Total Sessions Held',
      'Present Count',
      'Late Count',
      'Excused Count',
      'Absent Count',
      'Effective Attended',
      'Attendance Percentage',
      'Statutory Compliance Status'
    ];
    let rows = headers.map(escapeCsv).join(',') + '\n';

    students.forEach((s) => {
      const course = courses.find((c) => c.id === s.courseId);
      const att = calculateStudentAttendance(s.id, attendance);
      const attended = att.presentCount + att.lateCount;
      const status = att.totalSessions === 0 
        ? 'No Sessions Recorded'
        : att.isShortage 
          ? 'Shortage Defaulter (< 75%)' 
          : 'Compliant (>= 75%)';

      const row = [
        s.rollNo,
        s.name,
        s.email,
        s.phone,
        s.parentPhone,
        course?.code || '',
        course?.name || '',
        s.semester,
        att.totalSessions,
        att.presentCount,
        att.lateCount,
        att.excusedCount,
        att.absentCount,
        attended,
        `${att.percentage}%`,
        status
      ];
      rows += row.map(escapeCsv).join(',') + '\n';
    });

    triggerCsvDownload(
      `Complete_Attendance_Summary_Archive_${currentDateStr}.csv`,
      rows,
      students.length,
      'student attendance summaries'
    );
  };

  // 4. Export Detailed Daily Attendance Activity Log (Raw Roll Call Entries)
  const exportDetailedAttendanceLogsCSV = () => {
    const headers = [
      'Record ID',
      'Session Date',
      'Program Code',
      'Program Name',
      'Student Roll No',
      'Student Name',
      'Attendance Status',
      'Marked By Faculty',
      'Remarks / Notes',
      'Last Updated'
    ];
    let rows = headers.map(escapeCsv).join(',') + '\n';

    // Sort chronologically by date descending
    const sortedAttendance = [...attendance].sort((a, b) => b.date.localeCompare(a.date));

    sortedAttendance.forEach((rec) => {
      const student = students.find((s) => s.id === rec.studentId);
      const course = courses.find((c) => c.id === rec.courseId);
      const row = [
        rec.id,
        rec.date,
        course?.code || '',
        course?.name || '',
        student?.rollNo || 'N/A',
        student?.name || 'N/A',
        rec.status.toUpperCase(),
        rec.markedBy || 'Faculty',
        rec.notes || '',
        rec.updatedAt || rec.date
      ];
      rows += row.map(escapeCsv).join(',') + '\n';
    });

    triggerCsvDownload(
      `Detailed_Attendance_Activity_Logs_${currentDateStr}.csv`,
      rows,
      sortedAttendance.length,
      'session logs'
    );
  };

  // 5. Export Comprehensive Fee Accounts Ledger (All Students)
  const exportAllFeeLedgerCSV = () => {
    const headers = [
      'Roll Number',
      'Student Name',
      'Email',
      'Phone',
      'Parent Phone',
      'Program Code',
      'Semester',
      'Enrollment Date',
      'Total Tuition Fee (INR)',
      'Total Amount Paid (INR)',
      'Outstanding Balance (INR)',
      'Payment Status',
      'Receipts Issued Count',
      'Last Payment Date'
    ];
    let rows = headers.map(escapeCsv).join(',') + '\n';

    students.forEach((s) => {
      const course = courses.find((c) => c.id === s.courseId);
      const fee = calculateStudentFees(s, payments);
      const row = [
        s.rollNo,
        s.name,
        s.email,
        s.phone,
        s.parentPhone,
        course?.code || '',
        s.semester,
        s.enrollmentDate,
        fee.totalFee,
        fee.paidAmount,
        fee.balance,
        fee.status.toUpperCase(),
        fee.paymentsCount,
        fee.lastPaymentDate ? formatDate(fee.lastPaymentDate) : 'None'
      ];
      rows += row.map(escapeCsv).join(',') + '\n';
    });

    triggerCsvDownload(
      `Comprehensive_Fee_Accounts_Ledger_${currentDateStr}.csv`,
      rows,
      students.length,
      'student fee accounts'
    );
  };

  // 6. Export Fee Payment Receipts & Transactions Register
  const exportAllFeeTransactionsCSV = () => {
    const headers = [
      'Receipt Number',
      'Transaction Date',
      'Student Roll No',
      'Student Name',
      'Program Code',
      'Amount Received (INR)',
      'Payment Mode',
      'Cashier / Recorded By',
      'Transaction Ref / Notes',
      'Record ID'
    ];
    let rows = headers.map(escapeCsv).join(',') + '\n';

    // Sort chronologically descending
    const sortedPayments = [...payments].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

    sortedPayments.forEach((p) => {
      const student = students.find((s) => s.id === p.studentId);
      const course = student ? courses.find((c) => c.id === student.courseId) : undefined;
      const row = [
        p.receiptNo,
        p.paymentDate,
        student?.rollNo || 'N/A',
        student?.name || 'N/A',
        course?.code || '',
        p.amount,
        p.paymentMethod,
        p.recordedBy,
        p.notes || '',
        p.id
      ];
      rows += row.map(escapeCsv).join(',') + '\n';
    });

    triggerCsvDownload(
      `Fee_Payment_Receipts_Register_${currentDateStr}.csv`,
      rows,
      sortedPayments.length,
      'payment transaction records'
    );
  };

  // Export for current active tab
  const handleExportCurrentView = () => {
    if (activeReport === 'attendance_shortage') {
      exportAttendanceDefaultersCSV();
    } else if (activeReport === 'fee_dues') {
      exportFeeDefaultersCSV();
    } else {
      exportAllAttendanceSummaryCSV();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate high-level institutional metrics for the archive hub
  const totalTuitionRevenue = students.reduce((sum, s) => sum + s.totalFee, 0);
  const totalTuitionCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstandingBalance = Math.max(0, totalTuitionRevenue - totalTuitionCollected);

  return (
    <div className="space-y-6">
      {/* Toast Notification for CSV Export */}
      {exportSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportSuccessMessage}</span>
          </div>
          <button
            onClick={() => setExportSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Academic & Bursar Audits & Data Archiving
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Automated institutional reporting for attendance regulation, fee recovery, and offline CSV data archiving.
            </p>
          </div>

          <div className="flex items-center space-x-2 relative" ref={dropdownRef}>
            {/* Quick Export Current Button */}
            <button
              id="btn-export-current-csv"
              onClick={handleExportCurrentView}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-md bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition"
              title="Export current view to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Comprehensive Export Menu Dropdown */}
            <div className="relative">
              <button
                id="btn-export-options-dropdown"
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="flex items-center space-x-1 px-2.5 py-2 text-xs font-medium rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition"
                title="Select specific report format to archive"
              >
                <FolderDown className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Archive Options</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {exportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Attendance CSV Archives
                  </div>
                  <button
                    onClick={exportAllAttendanceSummaryCSV}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <CalendarCheck2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800">All Students Attendance Summary</div>
                      <div className="text-[10px] text-slate-400">{students.length} students roster with percentages</div>
                    </div>
                  </button>
                  <button
                    onClick={exportDetailedAttendanceLogsCSV}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800">Detailed Daily Session Logs</div>
                      <div className="text-[10px] text-slate-400">{attendance.length} roll call entries archive</div>
                    </div>
                  </button>
                  <button
                    onClick={exportAttendanceDefaultersCSV}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800">Shortage Defaulters (&lt;75%)</div>
                      <div className="text-[10px] text-slate-400">{attendanceDefaulters.length} students flagged</div>
                    </div>
                  </button>

                  <div className="mt-1 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-t border-b border-slate-100">
                    Fee & Financial CSV Archives
                  </div>
                  <button
                    onClick={exportAllFeeLedgerCSV}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800">Tuition Accounts Ledger</div>
                      <div className="text-[10px] text-slate-400">{students.length} student balances and dues</div>
                    </div>
                  </button>
                  <button
                    onClick={exportAllFeeTransactionsCSV}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800">Payment Receipts Register</div>
                      <div className="text-[10px] text-slate-400">{payments.length} issued fee transactions</div>
                    </div>
                  </button>
                  <button
                    onClick={exportFeeDefaultersCSV}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800">Outstanding Fee Defaulters</div>
                      <div className="text-[10px] text-slate-400">{feeDefaulters.length} students with dues</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Audit</span>
            </button>
          </div>
        </div>

        {/* Report Selector Pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            id="report-tab-attendance"
            onClick={() => setActiveReport('attendance_shortage')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs font-semibold transition ${
              activeReport === 'attendance_shortage'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Attendance Shortage Defaulters ({attendanceDefaulters.length})</span>
          </button>

          <button
            id="report-tab-fee"
            onClick={() => setActiveReport('fee_dues')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs font-semibold transition ${
              activeReport === 'fee_dues'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Outstanding Fee Defaulters ({feeDefaulters.length})</span>
          </button>

          <button
            id="report-tab-archive"
            onClick={() => setActiveReport('archive_export')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs font-semibold transition ${
              activeReport === 'archive_export'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Offline Archiving & Data Export Hub</span>
          </button>
        </div>
      </div>

      {/* Active Report View */}
      {activeReport === 'attendance_shortage' ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-rose-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <h2 className="text-sm font-bold text-rose-950">
                  Critical Attendance Shortage Register (&lt; 75% Regulation)
                </h2>
              </div>
              <p className="text-xs text-rose-800/80 mt-0.5">
                Students listed here fail to meet the statutory 75% university lecture attendance criteria and require immediate parental notice.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportAttendanceDefaultersCSV}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 transition"
              >
                <Download className="w-3 h-3" />
                <span>Export Defaulters CSV</span>
              </button>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-white rounded border border-rose-200 text-rose-800">
                Total: {attendanceDefaulters.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Roll No</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Program</th>
                  <th className="py-3 px-4 font-semibold">Parent / Guardian Contact</th>
                  <th className="py-3 px-4 font-semibold">Sessions Attended</th>
                  <th className="py-3 px-4 font-semibold">Current %</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceDefaulters.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      All enrolled students satisfy the minimum 75% attendance requirement.
                    </td>
                  </tr>
                ) : (
                  attendanceDefaulters.map(({ student, course, att }) => (
                    <tr key={student.id} className="hover:bg-rose-50/20 transition">
                      <td className="py-3 px-4 font-mono font-medium text-blue-900 whitespace-nowrap">
                        {student.rollNo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{student.name}</div>
                        <div className="text-[11px] text-slate-400">{student.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-medium">{course?.code}</div>
                        <div className="text-[10px] text-slate-400">{student.semester}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5 font-mono text-slate-800">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{student.parentPhone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {att.presentCount + att.lateCount} of {att.totalSessions} sessions ({att.absentCount} missed)
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {att.percentage}%
                        </span>
                        <div className="text-[10px] text-rose-600 mt-0.5 font-medium">
                          Deficit: -{75 - att.percentage}%
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectStudent(student)}
                          className="px-2.5 py-1 text-xs font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
                        >
                          View Dossier
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeReport === 'fee_dues' ? (
        /* Outstanding Fee Defaulters Table */
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <h2 className="text-sm font-bold text-amber-950">
                  Accounts Receivable & Outstanding Fee Defaulters
                </h2>
              </div>
              <p className="text-xs text-amber-800/80 mt-0.5">
                Students with uncleared tuition balances requiring Bursar follow-up or installment collection.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportFeeDefaultersCSV}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 transition"
              >
                <Download className="w-3 h-3" />
                <span>Export Dues CSV</span>
              </button>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-white rounded border border-amber-200 text-amber-900">
                Total: {formatCurrency(feeDefaulters.reduce((acc, curr) => acc + curr.fee.balance, 0))}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Roll No</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Program</th>
                  <th className="py-3 px-4 font-semibold">Total Fee</th>
                  <th className="py-3 px-4 font-semibold">Amount Paid</th>
                  <th className="py-3 px-4 font-semibold">Outstanding Due</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feeDefaulters.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      All student tuition accounts are paid in full.
                    </td>
                  </tr>
                ) : (
                  feeDefaulters.map(({ student, course, fee }) => (
                    <tr key={student.id} className="hover:bg-amber-50/20 transition">
                      <td className="py-3 px-4 font-mono font-medium text-blue-900 whitespace-nowrap">
                        {student.rollNo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{student.name}</div>
                        <div className="text-[11px] text-slate-400">
                          Guardian: {student.parentPhone}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-medium">{course?.code}</div>
                        <div className="text-[10px] text-slate-400">{student.semester}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {formatCurrency(fee.totalFee)}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {formatCurrency(fee.paidAmount)}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-700">
                        {formatCurrency(fee.balance)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            fee.status === 'partial'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {fee.status === 'partial' ? 'Partial Balance' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {currentUser.role === 'admin' ? (
                          <button
                            onClick={() => onOpenRecordPayment(student.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition"
                          >
                            Collect
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectStudent(student)}
                            className="px-2.5 py-1 text-xs font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Dedicated Offline Archiving & Data Export Hub */
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-lg p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Archive className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold">Institutional Data Archiving & Export Center</h2>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Generate sanitized, standards-compliant CSV spreadsheets for institutional audits, university registrar compliance, accreditation archives, and local offline spreadsheets (Microsoft Excel / Google Sheets).
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2.5 py-1 bg-slate-800 text-emerald-400 rounded border border-slate-700 font-mono">
                  UTF-8 BOM Encoded
                </span>
              </div>
            </div>
          </div>

          {/* 4 Primary Archive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Attendance Roster Summary */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                      <CalendarCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Attendance Summary Archive</h3>
                      <p className="text-[11px] text-slate-500">All enrolled student percentage records</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-200">
                    {students.length} Students
                  </span>
                </div>

                <div className="py-3 text-xs text-slate-600 space-y-1.5">
                  <p>
                    Exports aggregated attendance metrics across all registered academic programs.
                  </p>
                  <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc list-inside">
                    <li>Roll No, Student & Guardian contact details</li>
                    <li>Total sessions, present, absent, late, excused counts</li>
                    <li>Calculated attendance % and statutory shortage status</li>
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">Complete_Attendance_Summary_*.csv</span>
                <button
                  id="btn-archive-attendance-summary"
                  onClick={exportAllAttendanceSummaryCSV}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* Card 2: Detailed Daily Attendance Activity Logs */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Daily Attendance Activity Logs</h3>
                      <p className="text-[11px] text-slate-500">Raw chronological roll-call audit records</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold border border-indigo-200">
                    {attendance.length} Sessions
                  </span>
                </div>

                <div className="py-3 text-xs text-slate-600 space-y-1.5">
                  <p>
                    Complete granular session logs of every individual attendance record ever registered in the system.
                  </p>
                  <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc list-inside">
                    <li>Session Date, Course Code, and Section</li>
                    <li>Individual student roll call status (P/A/L/E)</li>
                    <li>Marked-by faculty identifier and update timestamp</li>
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">Detailed_Attendance_Activity_*.csv</span>
                <button
                  id="btn-archive-attendance-logs"
                  onClick={exportDetailedAttendanceLogsCSV}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-700 hover:bg-indigo-800 text-white shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* Card 3: Fee Accounts Ledger */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Student Fee Accounts Ledger</h3>
                      <p className="text-[11px] text-slate-500">Cumulative tuition balances & receivables</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                    {formatCurrency(totalTuitionCollected)}
                  </span>
                </div>

                <div className="py-3 text-xs text-slate-600 space-y-1.5">
                  <p>
                    Institutional financial balance sheet per enrolled student.
                  </p>
                  <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc list-inside">
                    <li>Total assessed tuition fee & amount paid to date</li>
                    <li>Outstanding balance due and status (Paid / Partial / Unpaid)</li>
                    <li>Total receipts issued and last payment date</li>
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">Comprehensive_Fee_Accounts_*.csv</span>
                <button
                  id="btn-archive-fee-ledger"
                  onClick={exportAllFeeLedgerCSV}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* Card 4: Fee Payment Transactions & Receipts Register */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between hover:border-teal-300 transition">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Payment Receipts Register</h3>
                      <p className="text-[11px] text-slate-500">Every transactional receipt issued</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-semibold border border-teal-200">
                    {payments.length} Receipts
                  </span>
                </div>

                <div className="py-3 text-xs text-slate-600 space-y-1.5">
                  <p>
                    Chronological audit register of all bursar collections and issued receipts.
                  </p>
                  <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc list-inside">
                    <li>Official receipt number (REC-YYYY-XXXX) and date</li>
                    <li>Student roll number, name, program, and amount (INR)</li>
                    <li>Payment method (UPI, Bank Transfer, Card, Cash) & Cashier</li>
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">Fee_Payment_Receipts_*.csv</span>
                <button
                  id="btn-archive-fee-transactions"
                  onClick={exportAllFeeTransactionsCSV}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-teal-700 hover:bg-teal-800 text-white shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Defaulter CSV Archive Row */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Statutory Defaulter Audits CSV Downloads
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white border border-rose-200 rounded-md p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-rose-950">Attendance Defaulters List</div>
                    <div className="text-[11px] text-rose-700">{attendanceDefaulters.length} students &lt; 75% attendance</div>
                  </div>
                </div>
                <button
                  onClick={exportAttendanceDefaultersCSV}
                  className="px-2.5 py-1 text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded transition flex items-center space-x-1"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
              </div>

              <div className="bg-white border border-amber-200 rounded-md p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-amber-950">Outstanding Fee Defaulters List</div>
                    <div className="text-[11px] text-amber-700">{feeDefaulters.length} students with pending balance</div>
                  </div>
                </div>
                <button
                  onClick={exportFeeDefaultersCSV}
                  className="px-2.5 py-1 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded transition flex items-center space-x-1"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

