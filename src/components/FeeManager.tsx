import React, { useState, useMemo } from 'react';
import { Student, Course, FeePayment, User } from '../types';
import { 
  calculateStudentFees, 
  formatCurrency, 
  formatDate, 
  generateReceiptNumber 
} from '../utils/calculations';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Printer, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building2,
  IndianRupee,
  FileSpreadsheet,
  X
} from 'lucide-react';

interface FeeManagerProps {
  students: Student[];
  courses: Course[];
  payments: FeePayment[];
  currentUser: User;
  onRecordPayment: (payment: FeePayment) => void;
  initialSelectedStudentId?: string;
  onClearInitialStudent?: () => void;
}

export const FeeManager: React.FC<FeeManagerProps> = ({
  students,
  courses,
  payments,
  currentUser,
  onRecordPayment,
  initialSelectedStudentId,
  onClearInitialStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  // Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(Boolean(initialSelectedStudentId));
  const [paymentStudentId, setPaymentStudentId] = useState<string>(initialSelectedStudentId || students[0]?.id || '');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<FeePayment['paymentMethod']>('Bank Transfer');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState(generateReceiptNumber(payments));

  // Receipt Preview Modal
  const [viewingReceipt, setViewingReceipt] = useState<FeePayment | null>(null);
  const [viewingLedgerStudent, setViewingLedgerStudent] = useState<Student | null>(null);

  // When initialSelectedStudentId changes
  React.useEffect(() => {
    if (initialSelectedStudentId) {
      setPaymentStudentId(initialSelectedStudentId);
      setIsPaymentModalOpen(true);
      const student = students.find((s) => s.id === initialSelectedStudentId);
      if (student) {
        const feeSummary = calculateStudentFees(student, payments);
        setPaymentAmount(feeSummary.balance.toString());
      }
    }
  }, [initialSelectedStudentId]);

  // Aggregate stats
  const totalBilled = students.reduce((sum, s) => sum + s.totalFee, 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = Math.max(0, totalBilled - totalCollected);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // Filtered Student List
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const summary = calculateStudentFees(student, payments);

      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCourse = courseFilter === 'all' ? true : student.courseId === courseFilter;

      const matchesStatus = statusFilter === 'all' ? true : summary.status === statusFilter;

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [students, payments, searchQuery, courseFilter, statusFilter]);

  // Open Payment Modal
  const handleOpenPaymentModal = (studentId?: string) => {
    const targetId = studentId || students[0]?.id || '';
    setPaymentStudentId(targetId);
    setReceiptNumber(generateReceiptNumber(payments));
    const targetStudent = students.find((s) => s.id === targetId);
    if (targetStudent) {
      const summary = calculateStudentFees(targetStudent, payments);
      setPaymentAmount(summary.balance.toString());
    } else {
      setPaymentAmount('');
    }
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleStudentSelectInModal = (id: string) => {
    setPaymentStudentId(id);
    const targetStudent = students.find((s) => s.id === id);
    if (targetStudent) {
      const summary = calculateStudentFees(targetStudent, payments);
      setPaymentAmount(summary.balance.toString());
    }
  };

  // Submit Payment
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid positive payment amount.');
      return;
    }

    const targetStudent = students.find((s) => s.id === paymentStudentId);
    if (!targetStudent) return;

    const newPayment: FeePayment = {
      id: `pay_${Date.now()}`,
      receiptNo: receiptNumber,
      studentId: paymentStudentId,
      amount: amountNum,
      paymentDate,
      paymentMethod,
      recordedBy: currentUser.name,
      notes: paymentNotes || undefined,
    };

    onRecordPayment(newPayment);
    setIsPaymentModalOpen(false);
    if (onClearInitialStudent) onClearInitialStudent();

    // Automatically offer to view the generated receipt
    setViewingReceipt(newPayment);
  };

  // Export Fee Ledger CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Roll Number,Student Name,Course,Total Fee,Amount Paid,Pending Balance,Payment Status,Total Payments,Last Payment Date\n';

    students.forEach((student) => {
      const summary = calculateStudentFees(student, payments);
      const course = courses.find((c) => c.id === student.courseId);
      csvContent += `"${student.rollNo}","${student.name}","${course?.code || ''}",${summary.totalFee},${summary.paidAmount},${summary.balance},"${summary.status}",${summary.paymentsCount},"${summary.lastPaymentDate || '-'}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fee_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Billed Fees
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(totalBilled)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Enrolled student tuition obligation
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Collected
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(totalCollected)}
          </div>
          <div className="mt-2 text-xs text-blue-700 font-medium">
            {collectionRate}% Overall Recovery Rate
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Outstanding / Pending
          </span>
          <div className="mt-2 text-2xl font-bold text-amber-700">
            {formatCurrency(totalPending)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Across active student accounts
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Transactions Audited
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900">{payments.length}</div>
          <div className="mt-2 text-xs text-slate-500">
            Formal receipt slips recorded
          </div>
        </div>
      </div>

      {/* Main Ledger Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Student Fee Register & Dues Ledger
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Automated institutional tracking of student fee commitments, installment payments, receipt issuances, and overdue balances.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Ledger</span>
            </button>

            {currentUser.role === 'admin' && (
              <button
                id="btn-collect-payment"
                onClick={() => handleOpenPaymentModal()}
                className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name or roll #..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Course filter */}
          <div>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Academic Programs</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid in Full</option>
              <option value="partial">Partial Payment</option>
              <option value="unpaid">Unpaid / Full Dues Pending</option>
            </select>
          </div>

          <div className="flex items-center text-xs text-slate-500 justify-end">
            Showing {filteredStudents.length} of {students.length} accounts
          </div>
        </div>

        {/* Ledger Table */}
        <div className="mt-4 border border-slate-200 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Roll Number</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Program</th>
                  <th className="py-3 px-4 font-semibold">Total Fee</th>
                  <th className="py-3 px-4 font-semibold">Paid Amount</th>
                  <th className="py-3 px-4 font-semibold">Pending Due</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No student records match the selected fee criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const summary = calculateStudentFees(student, payments);
                    const course = courses.find((c) => c.id === student.courseId);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-medium text-blue-900 whitespace-nowrap">
                          {student.rollNo}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{student.name}</div>
                          <div className="text-[11px] text-slate-400">{student.email}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {course?.code || 'General'}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {formatCurrency(summary.totalFee)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {formatCurrency(summary.paidAmount)}
                        </td>
                        <td className="py-3 px-4 font-bold">
                          <span
                            className={summary.balance > 0 ? 'text-amber-700' : 'text-slate-500'}
                          >
                            {formatCurrency(summary.balance)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {summary.status === 'paid' && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                              Paid in Full
                            </span>
                          )}
                          {summary.status === 'partial' && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              Partial Due
                            </span>
                          )}
                          {summary.status === 'unpaid' && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setViewingLedgerStudent(student)}
                              className="px-2.5 py-1 text-xs font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
                              title="View Payment Ledger & Receipts"
                            >
                              Ledger ({summary.paymentsCount})
                            </button>

                            {currentUser.role === 'admin' && summary.balance > 0 && (
                              <button
                                onClick={() => handleOpenPaymentModal(student.id)}
                                className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition"
                                title="Record Fee Payment"
                              >
                                Pay
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Record Payment */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded bg-blue-700 text-white flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Record Fee Payment</h3>
                  <p className="text-[11px] text-slate-500">
                    Generate an official university receipt and update balance
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  if (onClearInitialStudent) onClearInitialStudent();
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-5 space-y-4">
              {/* Student selection */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Student Account
                </label>
                <select
                  value={paymentStudentId}
                  onChange={(e) => handleStudentSelectInModal(e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  {students.map((s) => {
                    const sum = calculateStudentFees(s, payments);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.rollNo} - {s.name} (Pending: {formatCurrency(sum.balance)})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Account summary display box */}
              {(() => {
                const sel = students.find((s) => s.id === paymentStudentId);
                if (!sel) return null;
                const sum = calculateStudentFees(sel, payments);
                return (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Total Tuition:</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(sum.totalFee)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Paid to Date:</span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(sum.paidAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Current Balance:</span>
                      <span className="font-bold text-amber-700">
                        {formatCurrency(sum.balance)}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Payment Amount & Quick Pay */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Payment Amount (₹ INR)
                  </label>
                  {(() => {
                    const sel = students.find((s) => s.id === paymentStudentId);
                    if (!sel) return null;
                    const sum = calculateStudentFees(sel, payments);
                    return sum.balance > 0 ? (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(sum.balance.toString())}
                        className="text-[11px] text-blue-700 hover:text-blue-900 font-medium"
                      >
                        Set Full Remaining ({formatCurrency(sum.balance)})
                      </button>
                    ) : null;
                  })()}
                </div>
                <input
                  type="number"
                  step="any"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              {/* Payment Date & Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash Deposit</option>
                    <option value="Credit/Debit Card">Credit/Debit Card</option>
                    <option value="Online/UPI">Online / UPI</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>
              </div>

              {/* Receipt Number */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Receipt / Transaction Reference Number
                </label>
                <input
                  type="text"
                  required
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full text-xs font-mono font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Installment 2 clearance, Bank ref #99801"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    if (onClearInitialStudent) onClearInitialStudent();
                  }}
                  className="px-3.5 py-2 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-payment"
                  className="px-4 py-2 text-xs font-semibold rounded-md bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition"
                >
                  Confirm & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Student Fee Ledger & Payment History */}
      {viewingLedgerStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Fee Ledger: {viewingLedgerStudent.name}
                  </h3>
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                    {viewingLedgerStudent.rollNo}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Comprehensive audit trail of all tuition receipts and balance clearances.
                </p>
              </div>
              <button
                onClick={() => setViewingLedgerStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Summary overview */}
              {(() => {
                const summary = calculateStudentFees(viewingLedgerStudent, payments);
                const course = courses.find((c) => c.id === viewingLedgerStudent.courseId);
                return (
                  <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 rounded-md border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Program</span>
                      <span className="font-medium text-slate-800">{course?.code || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Total Fee</span>
                      <span className="font-bold text-slate-900">{formatCurrency(summary.totalFee)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Paid to Date</span>
                      <span className="font-bold text-blue-700">{formatCurrency(summary.paidAmount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Remaining Due</span>
                      <span className={`font-bold ${summary.balance > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                        {formatCurrency(summary.balance)}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Transactions List */}
              <div>
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
                  Transaction Audit Log
                </h4>
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                        <th className="py-2.5 px-3 font-semibold">Receipt #</th>
                        <th className="py-2.5 px-3 font-semibold">Date</th>
                        <th className="py-2.5 px-3 font-semibold">Method</th>
                        <th className="py-2.5 px-3 font-semibold">Amount</th>
                        <th className="py-2.5 px-3 font-semibold">Auditor</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.filter((p) => p.studentId === viewingLedgerStudent.id).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            No payments recorded yet for this student.
                          </td>
                        </tr>
                      ) : (
                        payments
                          .filter((p) => p.studentId === viewingLedgerStudent.id)
                          .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
                          .map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 font-mono font-medium text-blue-800">
                                {p.receiptNo}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">
                                {formatDate(p.paymentDate)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">{p.paymentMethod}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">
                                {formatCurrency(p.amount)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                {p.recordedBy}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => setViewingReceipt(p)}
                                  className="text-xs text-blue-700 hover:text-blue-900 font-medium inline-flex items-center space-x-1"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>View Slip</span>
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Institutional record maintained by Finance Office
                </span>
                <div className="flex space-x-2">
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        const sId = viewingLedgerStudent.id;
                        setViewingLedgerStudent(null);
                        handleOpenPaymentModal(sId);
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition"
                    >
                      Record New Payment
                    </button>
                  )}
                  <button
                    onClick={() => setViewingLedgerStudent(null)}
                    className="px-3.5 py-1.5 text-xs font-medium rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Official Printed Receipt View */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-700" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Official Institutional Receipt
                </span>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5" id="printable-receipt">
              {/* Header */}
              <div className="text-center pb-4 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  CENTRAL UNIVERSITY ACADEMIC REGISTRY
                </h2>
                <p className="text-xs text-slate-500">
                  Office of Bursar & Student Accounts • Fee Clearance Receipt
                </p>
                <div className="mt-2 inline-block px-2.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-900 font-mono text-xs font-semibold">
                  Receipt No: {viewingReceipt.receiptNo}
                </div>
              </div>

              {/* Receipt Details */}
              {(() => {
                const student = students.find((s) => s.id === viewingReceipt.studentId);
                const course = courses.find((c) => c.id === student?.courseId);
                const summary = student ? calculateStudentFees(student, payments) : null;

                return (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded border border-slate-200">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Student Name:</span>
                        <span className="font-bold text-slate-900">{student?.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Roll Number:</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {student?.rollNo || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Academic Course:</span>
                        <span className="font-medium text-slate-800">{course?.name || 'N/A'}</span>
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
                        <span className="font-medium text-slate-900">
                          {viewingReceipt.paymentMethod}
                        </span>
                      </div>
                      {viewingReceipt.notes && (
                        <div className="flex justify-between text-slate-600">
                          <span>Remarks:</span>
                          <span className="font-medium text-slate-800">
                            {viewingReceipt.notes}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                        <span>Amount Received:</span>
                        <span className="text-blue-700">
                          {formatCurrency(viewingReceipt.amount)}
                        </span>
                      </div>
                      {summary && (
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Remaining Balance:</span>
                          <span className="font-semibold text-slate-700">
                            {formatCurrency(summary.balance)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex justify-between items-end text-[11px] text-slate-500">
                      <div>
                        <div>Recorded By: {viewingReceipt.recordedBy}</div>
                        <div>Computerized Digital Slip</div>
                      </div>
                      <div className="text-right">
                        <div className="h-8 border-b border-slate-400 w-32 mb-1" />
                        <span>Authorized Bursar Signature</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setViewingReceipt(null)}
                  className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
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
