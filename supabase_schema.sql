-- School Attendance Management System (SAMS) Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Types
CREATE TYPE user_role AS ENUM ('ADMIN', 'TEACHER', 'ADVISOR', 'STUDENT', 'PARENT');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'LEAVE');
CREATE TYPE common_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE leave_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Tables

-- 1. users (Extending auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'STUDENT',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. parents
CREATE TABLE public.parents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  line_user_id TEXT,
  user_id UUID REFERENCES public.users(id)
);

-- 3. teachers
CREATE TABLE public.teachers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_code TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  department TEXT,
  photo_url TEXT,
  user_id UUID REFERENCES public.users(id)
);

-- 4. academic_years
CREATE TABLE public.academic_years (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  year_name TEXT NOT NULL,
  status common_status DEFAULT 'ACTIVE'
);

-- 5. semesters
CREATE TABLE public.semesters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  semester_name TEXT NOT NULL,
  academic_year_id UUID REFERENCES public.academic_years(id),
  status common_status DEFAULT 'ACTIVE'
);

-- 6. classrooms
CREATE TABLE public.classrooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  level TEXT NOT NULL, -- e.g., ม.1, ม.2
  room TEXT NOT NULL, -- e.g., 1, 2, 3
  academic_year_id UUID REFERENCES public.academic_years(id),
  advisor_id UUID REFERENCES public.teachers(id)
);

-- 7. students
CREATE TABLE public.students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_code TEXT UNIQUE NOT NULL,
  citizen_id TEXT UNIQUE,
  prefix TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nickname TEXT,
  gender TEXT,
  birth_date DATE,
  phone TEXT,
  address TEXT,
  classroom_id UUID REFERENCES public.classrooms(id),
  parent_id UUID REFERENCES public.parents(id),
  photo_url TEXT,
  status common_status DEFAULT 'ACTIVE',
  user_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. subjects
CREATE TABLE public.subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject_code TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  subject_name_en TEXT,
  description TEXT,
  department TEXT,
  credit DECIMAL(3,1),
  semester_id UUID REFERENCES public.semesters(id),
  academic_year_id UUID REFERENCES public.academic_years(id),
  teacher_id UUID REFERENCES public.teachers(id),
  status common_status DEFAULT 'ACTIVE'
);

-- 9. schedules
CREATE TABLE public.schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id),
  teacher_id UUID REFERENCES public.teachers(id),
  classroom_id UUID REFERENCES public.classrooms(id),
  day_of_week INT NOT NULL, -- 1=Mon, 5=Fri
  period INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_name TEXT
);

-- 10. attendance_sessions
CREATE TABLE public.attendance_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id),
  teacher_id UUID REFERENCES public.teachers(id),
  schedule_id UUID REFERENCES public.schedules(id),
  session_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  qr_code TEXT,
  status common_status DEFAULT 'ACTIVE'
);

-- 11. attendance
CREATE TABLE public.attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id),
  session_id UUID REFERENCES public.attendance_sessions(id),
  checkin_time TIMESTAMPTZ,
  status attendance_status,
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  device_id TEXT,
  ip_address TEXT
);

-- 12. homeroom_attendance
CREATE TABLE public.homeroom_attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id),
  attendance_date DATE NOT NULL,
  checkin_time TIMESTAMPTZ,
  status attendance_status,
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  device_id TEXT
);

-- 13. leave_requests
CREATE TABLE public.leave_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id),
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  attachment_url TEXT,
  approved_by UUID REFERENCES public.teachers(id),
  status leave_status DEFAULT 'PENDING'
);

-- 14. notifications
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. audit_logs
CREATE TABLE public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  ip_address TEXT,
  device TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Enablement
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homeroom_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Note: Basic Policies
CREATE POLICY "Allow public read for testing" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public read for testing" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Allow public read for testing" ON public.classrooms FOR SELECT USING (true);
CREATE POLICY "Allow public read for testing" ON public.subjects FOR SELECT USING (true);
