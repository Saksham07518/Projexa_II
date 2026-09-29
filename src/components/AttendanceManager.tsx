import React, { useState, useMemo } from 'react';
import { Student, Course, AttendanceRecord, AttendanceStatus, User } from '../types';
import { calculateStudentAttendance } from '../utils/calculations';
import { 
  Calendar, 
  Check, 
  X, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  Download, 
  Printer, 
  Search, 
  FileText, 
  Filter,
  Save,
  RotateCcw,
  Users
} from 'lucide-react';

interface AttendanceManagerProps {
  students: Student[];
  courses: Course[];
  attendance: AttendanceRecord[];
  currentUser: User;
  onSaveAttendanceBatch: (newRecords: AttendanceRecord[]) => void;
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  students,
  courses,
  attendance,
  currentUser,
  onSaveAttendanceBatch,
}) => {
  // Today's date default
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'register' | 'history'>('register');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Filter students for the selected course
  const enrolledStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesCourse = selectedCourseId ? s.courseId === selectedCourseId : true;
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCourse && matchesSearch && s.status === 'active';
    });
  }, [students, selectedCourseId, searchQuery]);

  // Existing records for this course and date
  const existingDayRecords = useMemo(() => {
    return attendance.filter(
      (r) => r.date === selectedDate && (selectedCourseId ? r.courseId === selectedCourseId : true)
    );
  }, [attendance, selectedDate, selectedCourseId]);

  // Local state for the current day's in-progress register: map studentId -> { status, notes }
  const [dayAttendanceState, setDayAttendanceState] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});

  // Synchronize local state when selectedDate or selectedCourseId changes or when existingDayRecords load
  React.useEffect(() => {
    const map: Record<string, { status: AttendanceStatus; notes: string }> = {};
    enrolledStudents.forEach((student) => {
      const found = existingDayRecords.find((r) => r.studentId === student.id);
      if (found) {
        map[student.id] = { status: found.status, notes: found.notes || '' };
      } else {
        // Default to present for quick computerized logging
        map[student.id] = { status: 'present', notes: '' };
      }
    });
    setDayAttendanceState(map);
    setSaveSuccessMsg(null);
  }, [selectedDate, selectedCourseId, enrolledStudents.length]);

  // Handler to update one student's status
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setDayAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
    setSaveSuccessMsg(null);
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setDayAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
  };

  // Bulk actions
  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; notes: string }> = {};
    enrolledStudents.forEach((s) => {
      updated[s.id] = {
        status,
        notes: dayAttendanceState[s.id]?.notes || '',
      };
    });
    setDayAttendanceState(updated);
    setSaveSuccessMsg(null);
  };

  // Save register
  const handleSaveRegister = () => {
    const now = new Date().toISOString();
    const recordsToSave: AttendanceRecord[] = enrolledStudents.map((student) => {
      const current = dayAttendanceState[student.id] || { status: 'present', notes: '' };
      const existing = existingDayRecords.find((r) => r.studentId === student.id);
      return {
        id: existing?.id || `att_${student.id}_${selectedDate.replace(/-/g, '')}`,
        studentId: student.id,
        courseId: student.courseId,
        date: selectedDate,
        status: current.status,
        notes: current.notes || undefined,
        markedBy: currentUser.name,
        updatedAt: now,
      };
    });

    onSaveAttendanceBatch(recordsToSave);
    setSaveSuccessMsg(`Attendance saved successfully for ${recordsToSave.length} students on ${selectedDate}.`);
    setTimeout(() => setSaveSuccessMsg(null), 5000);
  };

  // Summary counts for the active register
  const currentDayStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    enrolledStudents.forEach((s) => {
      const st = dayAttendanceState[s.id]?.status || 'present';
      if (st === 'present') present++;
      if (st === 'absent') absent++;
      if (st === 'late') late++;
      if (st === 'excused') excused++;
    });

    const total = enrolledStudents.length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, absent, late, excused, rate };
  }, [enrolledStudents, dayAttendanceState]);

  // Historical sessions list for selected course
  const historicalDates = useMemo(() => {
    const courseRecords = attendance.filter((a) =>
      selectedCourseId ? a.courseId === selectedCourseId : true
    );
    const dateMap = new Map<string, { date: string; records: AttendanceRecord[] }>();

    courseRecords.forEach((r) => {
      if (!dateMap.has(r.date)) {
        dateMap.set(r.date, { date: r.date, records: [] });
      }
      dateMap.get(r.date)!.records.push(r);
    });

    return Array.from(dateMap.values())
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, selectedCourseId]);

  // Export to CSV
  const handleExportCSV = () => {
    const selectedCourse = courses.find((c) => c.id === selectedCourseId);
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Roll Number,Student Name,Course,Date,Attendance Status,Cumulative Attendance %,Notes,Marked By\n';

    enrolledStudents.forEach((student) => {
      const summary = calculateStudentAttendance(student.id, attendance);
      const dayRecord = dayAttendanceState[student.id];
      const status = dayRecord?.status || 'unrecorded';
      const notes = (dayRecord?.notes || '').replace(/"/g, '""');

      csvContent += `"${student.rollNo}","${student.name}","${selectedCourse?.code || ''}","${selectedDate}","${status}","${summary.percentage}%","${notes}","${currentUser.name}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${selectedCourse?.code || 'Course'}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <div className="space-y-6">
      {/* Control Header & Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Daily Attendance Register
              </h1>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                {selectedCourse?.code || 'All Classes'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select program and date to take roll call, view real-time attendance percentages, and maintain computerized audit records.
            </p>
          </div>

          {/* Sub-tab view toggles */}
          <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200 self-start md:self-auto">
            <button
              onClick={() => setActiveSubTab('register')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition ${
                activeSubTab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Session
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition ${
                activeSubTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Session History ({historicalDates.length})
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Course Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Academic Program / Course
            </label>
            <select
              id="select-attendance-course"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name} ({course.semester})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Session Date
            </label>
            <div className="relative">
              <input
                id="input-attendance-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Search Student
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="input-search-student-attendance"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or roll #..."
                className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Export / Print Actions */}
          <div className="flex items-end space-x-2">
            <button
              onClick={handleExportCSV}
              title="Download register as CSV spreadsheet"
              className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>
            <button
              onClick={handlePrint}
              title="Print register format"
              className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-md text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-blue-700" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-blue-600 hover:text-blue-900 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeSubTab === 'register' ? (
        <>
          {/* Active Session Stats Banner & Bulk Controls */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Quick Numbers */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-medium">Session Total:</span>
                <span className="font-bold text-slate-900 text-sm">{currentDayStats.total}</span>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-slate-600">Present:</span>
                <span className="font-bold text-slate-900">{currentDayStats.present}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span className="text-slate-600">Absent:</span>
                <span className="font-bold text-rose-700">{currentDayStats.absent}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-600">Late:</span>
                <span className="font-bold text-amber-700">{currentDayStats.late}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-slate-600">Excused:</span>
                <span className="font-bold text-slate-700">{currentDayStats.excused}</span>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500">Day Rate:</span>
                <span className="font-bold text-blue-700 text-sm">{currentDayStats.rate}%</span>
              </div>
            </div>

            {/* Quick Bulk Marking & Save Button */}
            <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleMarkAll('present')}
                className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('absent')}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition"
              >
                Mark All Absent
              </button>
              <button
                type="button"
                id="btn-save-attendance-register"
                onClick={handleSaveRegister}
                className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded shadow-xs transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Register</span>
              </button>
            </div>
          </div>

          {/* Student Attendance Register Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4 font-semibold w-32">Roll Number</th>
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold w-44">Cumulative Attendance</th>
                    <th className="py-3 px-4 font-semibold text-center w-64">Attendance Status</th>
                    <th className="py-3 px-4 font-semibold w-56">Remarks / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrolledStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        No active students found matching the selected course and search criteria.
                      </td>
                    </tr>
                  ) : (
                    enrolledStudents.map((student) => {
                      const summary = calculateStudentAttendance(student.id, attendance);
                      const currentStatus = dayAttendanceState[student.id]?.status || 'present';
                      const currentNotes = dayAttendanceState[student.id]?.notes || '';

                      return (
                        <tr
                          key={student.id}
                          className={`hover:bg-slate-50/70 transition ${
                            summary.isShortage ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          {/* Roll Number */}
                          <td className="py-3 px-4 font-mono font-medium text-blue-900 whitespace-nowrap">
                            {student.rollNo}
                          </td>

                          {/* Student Name & Email */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{student.name}</div>
                            <div className="text-[11px] text-slate-400">{student.email}</div>
                          </td>

                          {/* Cumulative Attendance % */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`font-bold text-xs ${
                                  summary.isShortage ? 'text-rose-700' : 'text-slate-800'
                                }`}
                              >
                                {summary.percentage}%
                              </span>
                              <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    summary.isShortage ? 'bg-rose-600' : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${summary.percentage}%` }}
                                />
                              </div>
                              {summary.isShortage && (
                                <span
                                  className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1 py-0.2 rounded font-medium"
                                  title="Attendance is below minimum required 75% limit"
                                >
                                  Shortage
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {summary.presentCount + summary.lateCount} of {summary.totalSessions} sessions attended
                            </div>
                          </td>

                          {/* Status Chooser Buttons */}
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center space-x-1">
                              {/* Present Button */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'present')}
                                className={`px-2.5 py-1 text-xs font-medium rounded transition flex items-center space-x-1 ${
                                  currentStatus === 'present'
                                    ? 'bg-blue-700 text-white font-semibold shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                title="Present"
                              >
                                <span>P</span>
                              </button>

                              {/* Absent Button */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'absent')}
                                className={`px-2.5 py-1 text-xs font-medium rounded transition flex items-center space-x-1 ${
                                  currentStatus === 'absent'
                                    ? 'bg-rose-700 text-white font-semibold shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                title="Absent"
                              >
                                <span>A</span>
                              </button>

                              {/* Late Button */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'late')}
                                className={`px-2.5 py-1 text-xs font-medium rounded transition flex items-center space-x-1 ${
                                  currentStatus === 'late'
                                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                title="Late"
                              >
                                <span>L</span>
                              </button>

                              {/* Excused Button */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'excused')}
                                className={`px-2.5 py-1 text-xs font-medium rounded transition flex items-center space-x-1 ${
                                  currentStatus === 'excused'
                                    ? 'bg-slate-700 text-white font-semibold shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                title="Excused Leave"
                              >
                                <span>E</span>
                              </button>
                            </div>
                          </td>

                          {/* Notes / Remarks */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={currentNotes}
                              onChange={(e) => handleNotesChange(student.id, e.target.value)}
                              placeholder="Reason / Certificate #"
                              className="w-full text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Save Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Authorized logging by: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
              </span>
              <button
                type="button"
                onClick={handleSaveRegister}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded shadow-xs transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Attendance Register</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Historical Attendance Sessions Tab */
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Recorded Attendance Log Archive
              </h2>
              <p className="text-xs text-slate-500">
                Chronological audit of completed daily attendance sessions for {selectedCourse?.name || 'this program'}.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Total Students</th>
                  <th className="py-3 px-4 font-semibold">Present</th>
                  <th className="py-3 px-4 font-semibold">Absent</th>
                  <th className="py-3 px-4 font-semibold">Late / Excused</th>
                  <th className="py-3 px-4 font-semibold">Daily Attendance Rate</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historicalDates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No historical sessions recorded for this course.
                    </td>
                  </tr>
                ) : (
                  historicalDates.map((item) => {
                    const present = item.records.filter((r) => r.status === 'present').length;
                    const absent = item.records.filter((r) => r.status === 'absent').length;
                    const late = item.records.filter((r) => r.status === 'late').length;
                    const excused = item.records.filter((r) => r.status === 'excused').length;
                    const total = item.records.length;
                    const pct = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

                    return (
                      <tr key={item.date} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">
                          {item.date}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{total}</td>
                        <td className="py-3 px-4 font-semibold text-blue-700">{present}</td>
                        <td className="py-3 px-4 font-semibold text-rose-700">{absent}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {late} late, {excused} excused
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              pct < 75
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {pct}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedDate(item.date);
                              setActiveSubTab('register');
                            }}
                            className="px-2.5 py-1 text-xs font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
                          >
                            Review / Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
