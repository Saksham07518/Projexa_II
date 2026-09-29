import { Student, AttendanceRecord, FeePayment, StudentAttendanceSummary, StudentFeeSummary } from '../types';

/**
 * Calculates cumulative attendance summary for a specific student.
 */
export function calculateStudentAttendance(
  studentId: string,
  records: AttendanceRecord[]
): StudentAttendanceSummary {
  const studentRecords = records.filter((r) => r.studentId === studentId);
  const totalSessions = studentRecords.length;

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;

  studentRecords.forEach((rec) => {
    switch (rec.status) {
      case 'present':
        presentCount++;
        break;
      case 'absent':
        absentCount++;
        break;
      case 'late':
        lateCount++;
        break;
      case 'excused':
        excusedCount++;
        break;
    }
  });

  // Late students are considered attended, excused does not penalize attendance if calculated
  const attendedCount = presentCount + lateCount;
  const effectiveTotal = totalSessions > 0 ? totalSessions : 0;
  const percentage = effectiveTotal > 0 ? Math.round((attendedCount / effectiveTotal) * 100) : 100;

  return {
    studentId,
    totalSessions,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    percentage,
    isShortage: totalSessions > 0 && percentage < 75,
  };
}

/**
 * Calculates fee summary for a specific student.
 */
export function calculateStudentFees(
  student: Student,
  payments: FeePayment[]
): StudentFeeSummary {
  const studentPayments = payments.filter((p) => p.studentId === student.id);
  const paidAmount = studentPayments.reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(0, student.totalFee - paidAmount);

  let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
  if (paidAmount >= student.totalFee && student.totalFee > 0) {
    status = 'paid';
  } else if (paidAmount > 0) {
    status = 'partial';
  }

  // Sort payments to get the latest date
  const sorted = [...studentPayments].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  const lastPaymentDate = sorted[0]?.paymentDate;

  return {
    studentId: student.id,
    totalFee: student.totalFee,
    paidAmount,
    balance,
    status,
    lastPaymentDate,
    paymentsCount: studentPayments.length,
  };
}

/**
 * Generates an automated formal receipt number
 */
export function generateReceiptNumber(payments: FeePayment[]): string {
  const currentYear = new Date().getFullYear();
  const nextNumber = payments.length + 101;
  return `REC-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Formats currency values in Indian Rupees (INR)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats date into readable string (e.g. Sep 12, 2026)
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return dateString;
}
