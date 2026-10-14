export type SubmissionStatus = 'pending' | 'submitted' | 'late' | 'graded';
export type AssignmentType = 'individual' | 'group';

export interface Assignment {
  id: string;
  academic_year_id?: string | null;
  semester_id?: string | null;
  subject_id: string;
  classroom_id: string;
  teacher_id?: string | null;
  title: string;
  description?: string | null;
  max_score: number;
  due_date?: string | null;
  assignment_type: AssignmentType;
  created_at?: string;
  updated_at?: string;
  // Joined relation fields
  subject?: {
    id: string;
    subject_code: string;
    subject_name: string;
  };
  classroom?: {
    id: string;
    level: string;
    room: string;
  };
  teacher?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  submissions_summary?: {
    total: number;
    submitted: number;
    graded: number;
    pending: number;
    late: number;
  };
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  status: SubmissionStatus;
  score?: number | null;
  submitted_at?: string | null;
  feedback?: string | null;
  checked_by?: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined relation fields
  student?: {
    id: string;
    student_code: string;
    first_name: string;
    last_name: string;
    nickname?: string;
    gender?: string | null;
    classroom_id?: string;
  };
  checker?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  is_received?: boolean;
  group_name?: string | null;
}

export interface CreateAssignmentDTO {
  academic_year_id?: string | null;
  semester_id?: string | null;
  subject_id: string;
  classroom_id: string;
  teacher_id?: string | null;
  title: string;
  description?: string | null;
  max_score: number;
  due_date?: string | null;
  assignment_type?: AssignmentType;
  student_ids?: string[];
  group_name?: string | null;
}

export interface UpdateAssignmentDTO {
  title?: string;
  description?: string | null;
  max_score?: number;
  due_date?: string | null;
  assignment_type?: AssignmentType;
  group_name?: string | null;
}

export interface UpdateSubmissionDTO {
  status: SubmissionStatus;
  score?: number | null;
  feedback?: string | null;
  checked_by?: string | null;
  submitted_at?: string | null;
  is_received?: boolean;
  group_name?: string | null;
}

export interface BatchSubmissionUpdateItem {
  id: string;
  status: SubmissionStatus;
  score?: number | null;
  feedback?: string | null;
  is_received?: boolean;
  group_name?: string | null;
}

export interface AssignmentFilter {
  academicYearId?: string;
  semesterId?: string;
  subjectId?: string;
  classroomId?: string;
  teacherId?: string;
}

export interface AssignmentSummaryStats {
  totalAssignments: number;
  totalSubmissions: number;
  submittedCount: number;
  gradedCount: number;
  pendingCount: number;
  lateCount: number;
  submissionRate: number; // percentage 0 - 100
}

export interface TeacherCourseClassroom {
  subject_id: string;
  subject_code: string;
  subject_name: string;
  classroom_id: string;
  classroom_level: string;
  classroom_room: string;
  teacher_id?: string;
  teacher_name?: string;
}

