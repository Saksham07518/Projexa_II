import React, { useState, useMemo } from 'react';
import { Student, Course, AttendanceRecord, FeePayment, User } from '../types';
import { 
  calculateStudentAttendance, 
  calculateStudentFees, 
  formatCurrency, 
  formatDate 
} from '../utils/calculations';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Mail, 
  Phone, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  CreditCard,
  Download,
  X,
  ShieldAlert
} from 'lucide-react';

interface StudentDirectoryProps {
  students: Student[];
  courses: Course[];
  attendance: AttendanceRecord[];
  payments: FeePayment[];
  currentUser: User;
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onOpenRecordPayment: (studentId: string) => void;
  isAddModalOpenInitially?: boolean;
  onCloseInitialAddModal?: () => void;
}

export const StudentDirectory: React.FC<StudentDirectoryProps> = ({
  students,
  courses,
  attendance,
  payments,
  currentUser,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onOpenRecordPayment,
  isAddModalOpenInitially,
  onCloseInitialAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [shortageFilter, setShortageFilter] = useState<'all' | 'shortage' | 'good'>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(Boolean(isAddModalOpenInitially));
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Form States
  const [formRollNo, setFormRollNo] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formCourseId, setFormCourseId] = useState(courses[0]?.id || '');
  const [formSemester, setFormSemester] = useState('Semester 4');
  const [formTotalFee, setFormTotalFee] = useState('85000');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  React.useEffect(() => {
    if (isAddModalOpenInitially) {
      handleOpenAddModal();
    }
  }, [isAddModalOpenInitially]);

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormRollNo(`CS-2024-${String(students.length + 1).padStart(3, '0')}`);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormParentPhone('');
    setFormCourseId(courses[0]?.id || '');
    setFormSemester(courses[0]?.semester || 'Semester 4');
    setFormTotalFee('85000');
    setFormStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormRollNo(student.rollNo);
    setFormName(student.name);
    setFormEmail(student.email);
    setFormPhone(student.phone);
    setFormParentPhone(student.parentPhone);
    setFormCourseId(student.courseId);
    setFormSemester(student.semester);
    setFormTotalFee(student.totalFee.toString());
    setFormStatus(student.status);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    if (onCloseInitialAddModal) onCloseInitialAddModal();
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRollNo.trim() || !formName.trim()) {
      alert('Roll Number and Student Name are required.');
      return;
    }

    const feeNum = parseFloat(formTotalFee);
    const totalFee = isNaN(feeNum) ? 85000 : feeNum;

    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        rollNo: formRollNo.trim(),
        name: formName.trim(),
        email: formEmail.trim() || `${formRollNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.ac.in`,
        phone: formPhone.trim(),
        parentPhone: formParentPhone.trim(),
        courseId: formCourseId,
        semester: formSemester,
        totalFee,
        status: formStatus,
      };
      onUpdateStudent(updated);
    } else {
      const newStudent: Student = {
        id: `st_${Date.now()}`,
        rollNo: formRollNo.trim(),
        name: formName.trim(),
        email: formEmail.trim() || `${formRollNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.ac.in`,
        phone: formPhone.trim(),
        parentPhone: formParentPhone.trim(),
        courseId: formCourseId,
        semester: formSemester,
        enrollmentDate: new Date().toISOString().split('T')[0],
        totalFee,
        status: formStatus,
      };
      onAddStudent(newStudent);
    }

    handleCloseModal();
  };

  const handleDelete = (student: Student) => {
    if (window.confirm(`Are you sure you want to delete student record "${student.name}" (${student.rollNo})?`)) {
      onDeleteStudent(student.id);
    }
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery);

      const matchesCourse = courseFilter === 'all' ? true : s.courseId === courseFilter;
      const matchesStatus = statusFilter === 'all' ? true : s.status === statusFilter;

      let matchesShortage = true;
      if (shortageFilter !== 'all') {
        const att = calculateStudentAttendance(s.id, attendance);
        if (shortageFilter === 'shortage') {
          matchesShortage = att.totalSessions > 0 && att.isShortage;
        } else if (shortageFilter === 'good') {
          matchesShortage = att.percentage >= 75;
        }
      }

      return matchesSearch && matchesCourse && matchesStatus && matchesShortage;
    });
  }, [students, attendance, searchQuery, courseFilter, statusFilter, shortageFilter]);

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Roll Number,Full Name,Email,Phone,Guardian Contact,Course,Semester,Status,Attendance %,Total Sessions,Total Fee,Paid Fee,Balance Due\n';

    students.forEach((s) => {
      const att = calculateStudentAttendance(s.id, attendance);
      const fee = calculateStudentFees(s, payments);
      const course = courses.find((c) => c.id === s.courseId);

      csvContent += `"${s.rollNo}","${s.name}","${s.email}","${s.phone}","${s.parentPhone}","${course?.code || ''}","${s.semester}","${s.status}","${att.percentage}%",${att.totalSessions},${fee.totalFee},${fee.paidAmount},${fee.balance}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Students_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Student Directory & Master Records
              </h1>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                {students.length} Total Registered
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Store and manage student roll numbers, program allocations, guardian contacts, attendance standing, and fee profiles.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Roster</span>
            </button>

            {currentUser.role === 'admin' && (
              <button
                id="btn-add-student-modal"
                onClick={handleOpenAddModal}
                className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Student</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, roll #, phone..."
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

          {/* Attendance Standing Filter */}
          <div>
            <select
              value={shortageFilter}
              onChange={(e) => setShortageFilter(e.target.value as any)}
              className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Attendance Standing</option>
              <option value="shortage">Shortage Alert (&lt;75% Attendance)</option>
              <option value="good">Standard Standing (≥75% Attendance)</option>
            </select>
          </div>

          {/* Enrollment status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Enrolled Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive / Suspended</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <div className="mt-4 border border-slate-200 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Roll No</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Program</th>
                  <th className="py-3 px-4 font-semibold">Contact / Guardian</th>
                  <th className="py-3 px-4 font-semibold">Attendance</th>
                  <th className="py-3 px-4 font-semibold">Fee Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No student records found matching the specified criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const course = courses.find((c) => c.id === student.courseId);
                    const attSummary = calculateStudentAttendance(student.id, attendance);
                    const feeSummary = calculateStudentFees(student, payments);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition">
                        {/* Roll Number */}
                        <td className="py-3 px-4 font-mono font-medium text-blue-900 whitespace-nowrap">
                          {student.rollNo}
                        </td>

                        {/* Name & Email */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                            <span>{student.name}</span>
                            {student.status === 'inactive' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{student.email}</div>
                        </td>

                        {/* Program */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{course?.code || 'N/A'}</div>
                          <div className="text-[11px] text-slate-500">{student.semester}</div>
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-4 text-slate-600">
                          <div className="text-[11px]">{student.phone}</div>
                          <div className="text-[10px] text-slate-400">
                            Parent: {student.parentPhone}
                          </div>
                        </td>

                        {/* Attendance % */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-bold ${
                                attSummary.isShortage ? 'text-rose-700' : 'text-slate-800'
                              }`}
                            >
                              {attSummary.percentage}%
                            </span>
                            {attSummary.isShortage && (
                              <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1 py-0.2 rounded font-medium">
                                Shortage
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {attSummary.presentCount + attSummary.lateCount} / {attSummary.totalSessions} sessions
                          </div>
                        </td>

                        {/* Fee Status */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1.5">
                            {feeSummary.status === 'paid' && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                                Clear
                              </span>
                            )}
                            {feeSummary.status === 'partial' && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                Due {formatCurrency(feeSummary.balance)}
                              </span>
                            )}
                            {feeSummary.status === 'unpaid' && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                Due {formatCurrency(feeSummary.balance)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => setViewingStudent(student)}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded"
                              title="View Full Profile & Transcript"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {currentUser.role === 'admin' && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(student)}
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                                  title="Edit Student Details"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(student)}
                                  className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded"
                                  title="Delete Student Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
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

      {/* Modal: Add or Edit Student Record */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingStudent ? 'Edit Student Record' : 'Enroll New Student'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formRollNo}
                    onChange={(e) => setFormRollNo(e.target.value)}
                    placeholder="e.g. CS-2024-001"
                    className="w-full text-xs font-mono font-medium px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Academic Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Academic Program
                  </label>
                  <select
                    value={formCourseId}
                    onChange={(e) => setFormCourseId(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Semester / Term
                  </label>
                  <input
                    type="text"
                    value={formSemester}
                    onChange={(e) => setFormSemester(e.target.value)}
                    placeholder="e.g. Semester 4"
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="a.sharma@student.ac.in"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Student Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Parent / Guardian Phone *
                  </label>
                  <input
                    type="text"
                    value={formParentPhone}
                    onChange={(e) => setFormParentPhone(e.target.value)}
                    placeholder="+91 98765 01234"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Annual Tuition Fee (₹ INR)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formTotalFee}
                  onChange={(e) => setFormTotalFee(e.target.value)}
                  placeholder="85000"
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-2 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-md bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition"
                >
                  {editingStudent ? 'Save Changes' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Comprehensive Student Profile Drawer */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {viewingStudent.name}
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 font-semibold">
                    {viewingStudent.rollNo}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Enrolled since {viewingStudent.enrollmentDate} • {viewingStudent.status.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Profile Bio & Contact Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-md border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Academic Course</span>
                  <span className="font-medium text-slate-900">
                    {courses.find((c) => c.id === viewingStudent.courseId)?.name || 'Course'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Semester / Term</span>
                  <span className="font-medium text-slate-900">{viewingStudent.semester}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Student Phone</span>
                  <span className="font-mono text-slate-800">{viewingStudent.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Parent Contact</span>
                  <span className="font-mono font-medium text-slate-900">
                    {viewingStudent.parentPhone || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Attendance Breakdown */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-700" />
                    <span>Attendance Performance</span>
                  </h4>
                  {(() => {
                    const att = calculateStudentAttendance(viewingStudent.id, attendance);
                    return (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          att.isShortage
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {att.percentage}% Cumulative Attendance
                      </span>
                    );
                  })()}
                </div>

                {(() => {
                  const att = calculateStudentAttendance(viewingStudent.id, attendance);
                  return (
                    <div className="grid grid-cols-4 gap-2 p-3 bg-white border border-slate-200 rounded-md text-center text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Total Sessions</span>
                        <span className="font-bold text-slate-800">{att.totalSessions}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Present</span>
                        <span className="font-bold text-blue-700">{att.presentCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Absent</span>
                        <span className="font-bold text-rose-700">{att.absentCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Late / Excused</span>
                        <span className="font-bold text-slate-700">
                          {att.lateCount + att.excusedCount}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Fee Ledger Summary */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-700" />
                    <span>Fee Clearance & Ledger</span>
                  </h4>
                  {(() => {
                    const fee = calculateStudentFees(viewingStudent, payments);
                    return (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          fee.status === 'paid'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : fee.status === 'partial'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {fee.status === 'paid'
                          ? 'Fully Cleared'
                          : `Balance Due: ${formatCurrency(fee.balance)}`}
                      </span>
                    );
                  })()}
                </div>

                {(() => {
                  const fee = calculateStudentFees(viewingStudent, payments);
                  const studentPayments = payments.filter((p) => p.studentId === viewingStudent.id);

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 p-3 bg-white border border-slate-200 rounded-md text-center text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Total Tuition</span>
                          <span className="font-bold text-slate-900">{formatCurrency(fee.totalFee)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Total Paid</span>
                          <span className="font-bold text-blue-700">{formatCurrency(fee.paidAmount)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Pending Due</span>
                          <span className={`font-bold ${fee.balance > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                            {formatCurrency(fee.balance)}
                          </span>
                        </div>
                      </div>

                      {/* Itemized payments */}
                      <div className="border border-slate-200 rounded-md overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                              <th className="py-2 px-3">Receipt #</th>
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Method</th>
                              <th className="py-2 px-3 font-semibold text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {studentPayments.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-4 text-center text-slate-500">
                                  No payments recorded yet.
                                </td>
                              </tr>
                            ) : (
                              studentPayments.map((p) => (
                                <tr key={p.id}>
                                  <td className="py-2 px-3 font-mono text-blue-800">{p.receiptNo}</td>
                                  <td className="py-2 px-3 text-slate-600">{p.paymentDate}</td>
                                  <td className="py-2 px-3 text-slate-600">{p.paymentMethod}</td>
                                  <td className="py-2 px-3 font-semibold text-slate-900 text-right">
                                    {formatCurrency(p.amount)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Official Student Academic & Bursar Dossier
              </span>
              <div className="flex space-x-2">
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      const sId = viewingStudent.id;
                      setViewingStudent(null);
                      onOpenRecordPayment(sId);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition"
                  >
                    Collect Fee Payment
                  </button>
                )}
                <button
                  onClick={() => setViewingStudent(null)}
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
