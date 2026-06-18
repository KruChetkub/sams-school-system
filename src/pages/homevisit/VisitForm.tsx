import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { getStudents, updateStudent } from '../../services/studentService';
import { useAcademicYearStore } from '../../store/academicYearStore';
import { createHomeVisit, updateHomeVisit, saveHomeVisitAssessment, uploadVisitPhoto, deleteVisitPhoto, getHomeVisitByStudentAndTeacher } from '../../services/homevisit/visitService';
import { MapPin, Camera, Save, ArrowLeft, Loader2, Printer, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, User, Users, AlertCircle, FileText, UploadCloud, Compass } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toJpeg } from 'html-to-image';
import ReportPrintView from '../../components/homevisit/ReportPrintView';
import VisitMap from '../../components/homevisit/VisitMap';
import SignaturePad from '../../components/homevisit/SignaturePad';

const INITIAL_FORM_DATA = {
  national_id: '',

  // 2. ข้อมูลผู้ปกครอง
  parent_name: '',
  parent_phone: '',
  no_parent: false,
  parent_relation: '',
  parent_relation_other: '',
  parent_occupation: '',
  parent_education: '',
  parent_national_id: '',
  no_parent_id: false,
  state_welfare: '',

  // 3. ความสัมพันธ์ในครอบครัว
  time_together_hours: '',
  relation_with_members: {} as Record<string, string>,
  relation_with_members_other: '',
  left_with: '',
  left_with_other: '',
  household_income_per_person: '',
  expense_from: '',
  student_works: false,
  student_work_detail: '',
  student_work_income: '',
  daily_allowance: '',
  school_help_needs: [] as string[],
  help_received: [] as string[],
  parent_concerns: '',

  // 4. พฤติกรรมและความเสี่ยง
  health_issues: [] as string[],
  welfare_safety: [] as string[],
  commute_distance_km: '',
  commute_time: '',
  commute_method: '',
  commute_method_other: '',
  housing_condition: [] as string[],
  responsibilities: [] as string[],
  responsibilities_other: '',
  hobbies: [] as string[],
  hobbies_other: '',
  substance_abuse: [] as string[],
  violence: [] as string[],
  sexual_behavior: [] as string[],
  gaming_addiction: [] as string[],
  gaming_addiction_other: '',
  internet_access: '',
  device_usage: [] as string[],

  // Form 3
  house_type: '',
  house_type_other: '',
  roof_material: '',

  // Form 4
  travel_description: '',

  // 5. ผู้ให้ข้อมูลนักเรียน
  informant: '',
  informant_other: '',
};

type FormData = typeof INITIAL_FORM_DATA;

const Section = ({ title, icon: Icon, children, isOpen, onToggle }: any) => (
  <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden mb-6 transition-all duration-300">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-emerald-50/50 to-white hover:bg-emerald-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
          <Icon size={20} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      {isOpen ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
    </button>
    <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
      <div className="p-6 border-t border-emerald-50 bg-white">
        {children}
      </div>
    </div>
  </div>
);

const CheckboxGroup = ({ label, options, selected, onChange, otherLabel, otherValue, onOtherChange }: any) => (
  <div className="mb-5">
    <label className="block text-sm font-bold text-gray-700 mb-3">{label}</label>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {options.map((opt: string) => (
        <label key={opt} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-emerald-50/50 cursor-pointer transition-colors group">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={(e) => {
              if (e.target.checked) onChange([...selected, opt]);
              else onChange(selected.filter((item: string) => item !== opt));
            }}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-gray-700 group-hover:text-emerald-900 leading-relaxed">{opt}</span>
        </label>
      ))}
      {otherLabel && (
        <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 cursor-pointer group">
          <input
            type="checkbox"
            checked={selected.includes('อื่นๆ')}
            onChange={(e) => {
              if (e.target.checked) onChange([...selected, 'อื่นๆ']);
              else {
                onChange(selected.filter((item: string) => item !== 'อื่นๆ'));
                onOtherChange('');
              }
            }}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <div className="flex-1 flex flex-col gap-2">
            <span className="text-sm text-gray-700">{otherLabel}</span>
            {selected.includes('อื่นๆ') && (
              <input
                type="text"
                value={otherValue}
                onChange={(e) => onOtherChange(e.target.value)}
                placeholder="โปรดระบุ..."
                className="w-full text-sm border-b border-emerald-300 focus:border-emerald-600 outline-none pb-1 bg-transparent"
              />
            )}
          </div>
        </label>
      )}
    </div>
  </div>
);

const RadioGroup = ({ label, name, options, selected, onChange }: any) => (
  <div className="mb-5">
    <label className="block text-sm font-bold text-gray-700 mb-3">{label}</label>
    <div className="flex flex-wrap gap-4">
      {options.map((opt: string) => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt}
            checked={selected === opt}
            onChange={(e) => onChange(e.target.value)}
            className="w-5 h-5 border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-gray-700">{opt}</span>
        </label>
      ))}
    </div>
  </div>
);

export default function VisitForm() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const queryClient = useQueryClient();

  const { selectedYear } = useAcademicYearStore();
  const { data: students, isPending: isLoadingStudents, isError: isErrorStudents } = useQuery({
    queryKey: ['students', selectedYear?.id],
    queryFn: () => getStudents(selectedYear?.id)
  });
  const student = students?.find(s => s.id === studentId);

  const [isLoading, setIsLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [existingVisitId, setExistingVisitId] = useState<string | null>(null);

  // Modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showGpsConfirmModal, setShowGpsConfirmModal] = useState(false);
  const [gpsErrorModal, setGpsErrorModal] = useState({ show: false, message: '' });
  const [saveErrorModal, setSaveErrorModal] = useState({ show: false, message: '' });
  const [activeMobileMember, setActiveMobileMember] = useState<string | null>(null); // Mobile relationship selector

  const [activeTab, setActiveTab] = useState(1);

  // Core GPS & Legacy Data
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [distanceToSchoolAuto, setDistanceToSchoolAuto] = useState<number | null>(null);
  const [gpsInput, setGpsInput] = useState<string>('');
  const [gpsInputError, setGpsInputError] = useState<string | null>(null);
  const [riskLevel, setRiskLevel] = useState<'NORMAL' | 'WATCH' | 'URGENT'>('NORMAL');

  const [photoExteriorFile, setPhotoExteriorFile] = useState<File | null>(null);
  const [photoExteriorPreview, setPhotoExteriorPreview] = useState<string | null>(null);
  const [photoInteriorFile, setPhotoInteriorFile] = useState<File | null>(null);
  const [photoInteriorPreview, setPhotoInteriorPreview] = useState<string | null>(null);

  const [studentPhotoFile, setStudentPhotoFile] = useState<File | null>(null);
  const [studentPhotoPreview, setStudentPhotoPreview] = useState<string | null>(null);

  const handleStudentPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStudentPhotoFile(file);
      setStudentPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveStudentPhoto = () => {
    setStudentPhotoFile(null);
    setStudentPhotoPreview(null);
  };

  // Signature
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [teacherSignatureDataUrl, setTeacherSignatureDataUrl] = useState<string | null>(null);

  const [mapPhotoFile, setMapPhotoFile] = useState<File | null>(null);
  const [mapPhotoPreview, setMapPhotoPreview] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isCapturingMap, setIsCapturingMap] = useState(false);

  // Dates
  const today = new Date();
  const [bDay, setBDay] = useState(today.getDate().toString());
  const [bMonth, setBMonth] = useState((today.getMonth() + 1).toString());
  const [bYear, setBYear] = useState((today.getFullYear() + 543).toString());

  // Extended Form Data
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

  // Section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    s1: true, s2: false, s3: false, s4: false, s5: false
  });

  const toggleSection = (s: string) => setOpenSections(prev => ({ ...prev, [s]: !prev[s] }));

  // Update specific form field
  const updateForm = (key: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Fetch existing visit if any
  const { data: existingData, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['home_visit', studentId, user?.id, role],
    queryFn: () => studentId && user?.id ? getHomeVisitByStudentAndTeacher(studentId, user.id, role) : null,
    enabled: !!studentId && !!user?.id
  });

  // ดึงชื่อครูประจำชั้น (Advisor) จากตาราง Classrooms -> Teachers เพื่อมาแสดงเป็นครูที่ปรึกษา
  const { data: advisorProfile } = useQuery({
    queryKey: ['classroom_advisor_profile', student?.classroom_id],
    queryFn: async () => {
      if (!student?.classroom_id) return null;

      // 1. ดึง advisor_id และ advisor2_id จากตาราง classrooms
      const { data: classroomData, error: classroomError } = await supabase
        .from('classrooms')
        .select('advisor_id, advisor2_id')
        .eq('id', student.classroom_id)
        .maybeSingle();

      if (classroomError) throw classroomError;
      if (!classroomData) return null;

      const ids = [classroomData.advisor_id, classroomData.advisor2_id].filter(Boolean) as string[];
      if (ids.length === 0) return null;

      // 2. ดึงข้อมูลของครูประจำชั้นทุกคน
      const { data: teachersData, error: teacherError } = await supabase
        .from('teachers')
        .select('first_name, last_name')
        .in('id', ids);

      if (teacherError) throw teacherError;
      return teachersData;
    },
    enabled: !!student?.classroom_id
  });

  const advisorFullName = advisorProfile && Array.isArray(advisorProfile)
    ? advisorProfile.map(t => {
        const name = `${t.first_name || ''} ${t.last_name || ''}`.trim();
        return name.startsWith('ครู') ? name : `ครู${name}`;
      }).join(', ')
    : '';

  // ดึงโปรไฟล์ของครูที่กำลังเข้าใช้งานระบบอยู่ขณะนี้ (Logged-in Teacher)
  const { data: currentUserProfile } = useQuery({
    queryKey: ['current_user_teacher_profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('teachers')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const currentUserFullName = role === 'ADMIN' ? 'แอดมิน' : (currentUserProfile
    ? (() => {
        const name = `${currentUserProfile.first_name || ''} ${currentUserProfile.last_name || ''}`.trim();
        return name.startsWith('ครู') ? name : `ครู${name}`;
      })()
    : '');

  useEffect(() => {
    // Initial fetch handled by query
  }, [student]);

  // Load existing data into form
  useEffect(() => {
    if (existingData) {
      setExistingVisitId(existingData.visit.id);

      if (existingData.visit.visit_date) {
        const [y, m, d] = existingData.visit.visit_date.split('-');
        setBYear((parseInt(y, 10) + 543).toString());
        setBMonth(parseInt(m, 10).toString());
        setBDay(parseInt(d, 10).toString());
      }
      if (existingData.visit.latitude) setLatitude(existingData.visit.latitude);
      if (existingData.visit.longitude) setLongitude(existingData.visit.longitude);
      if (existingData.visit.distance_to_school) setDistanceToSchoolAuto(existingData.visit.distance_to_school);

      if (existingData.assessment) {
        setRiskLevel(existingData.assessment.risk_level || 'NORMAL');
        if (existingData.assessment.form_data) {
          setFormData(prev => ({ ...prev, ...existingData.assessment.form_data }));
        }
      }

      if (existingData.photos && existingData.photos.length > 0) {
        const exteriorPhoto = existingData.photos.find((p: any) => p.description === 'ภาพถ่ายสภาพบ้านภายนอก');
        const interiorPhoto = existingData.photos.find((p: any) => p.description === 'ภาพถ่ายภายในบ้าน');
        const mapPhotoDb = existingData.photos.find((p: any) => p.description === 'แผนที่การเดินทาง');
        const studentPhotoDb = existingData.photos.find((p: any) => p.description === 'รูปถ่ายนักเรียน');
        if (exteriorPhoto) setPhotoExteriorPreview(exteriorPhoto.photo_url);
        else if (existingData.photos[0] && existingData.photos[0].description !== 'รูปถ่ายนักเรียน' && existingData.photos[0].description !== 'ภาพถ่ายภายในบ้าน' && existingData.photos[0].description !== 'แผนที่การเดินทาง') {
          setPhotoExteriorPreview(existingData.photos[0].photo_url);
        }
        if (interiorPhoto) setPhotoInteriorPreview(interiorPhoto.photo_url);
        if (mapPhotoDb) setMapPhotoPreview(mapPhotoDb.photo_url);
        if (studentPhotoDb) setStudentPhotoPreview(studentPhotoDb.photo_url);
      }
    }
  }, [existingData]);

  // Sync coordinates to input string
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      const parts = gpsInput.split(',');
      if (parts.length === 2) {
        const parsedLat = parseFloat(parts[0]);
        const parsedLng = parseFloat(parts[1]);
        if (parsedLat === latitude && parsedLng === longitude) {
          return;
        }
      }
      setGpsInput(`${latitude.toFixed(6)},${longitude.toFixed(6)}`);
      setGpsInputError(null);
    } else {
      setGpsInput('');
    }
  }, [latitude, longitude]);

  const updateLocationAndDistance = async (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    try {
      const SCHOOL_LAT = 20.2445000;
      const SCHOOL_LNG = 100.4125000;
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${SCHOOL_LNG},${SCHOOL_LAT};${lng},${lat}?overview=false`);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const distanceKm = +(data.routes[0].distance / 1000).toFixed(2);
        setDistanceToSchoolAuto(distanceKm);
      } else {
        setDistanceToSchoolAuto(null);
      }
    } catch (err) {
      console.error('Error calculating distance:', err);
    }
  };

  const handleGpsInputChange = (val: string) => {
    setGpsInput(val);
    if (!val.trim()) {
      setLatitude(null);
      setLongitude(null);
      setDistanceToSchoolAuto(null);
      setGpsInputError(null);
      return;
    }

    const parts = val.split(',');
    if (parts.length === 2) {
      const latStr = parts[0].trim();
      const lngStr = parts[1].trim();
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);

      if (!isNaN(lat) && !isNaN(lng)) {
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          setGpsInputError(null);
          updateLocationAndDistance(lat, lng);
          return;
        }
      }
    }
    setGpsInputError('รูปแบบพิกัดไม่ถูกต้อง (ตัวอย่าง: 20.229939,100.407324)');
  };

  const handleGetLocation = () => {
    setShowGpsConfirmModal(true);
  };

  const executeGetLocation = () => {
    setShowGpsConfirmModal(false);
    setGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          await updateLocationAndDistance(lat, lng);
          setGpsLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setGpsErrorModal({
            show: true,
            message: 'ไม่สามารถดึงพิกัดได้ กรุณาอนุญาตการเข้าถึงตำแหน่งที่ตั้ง (Location/GPS) ก่อนครับ'
          });
          setGpsLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setGpsErrorModal({
        show: true,
        message: 'ขออภัย อุปกรณ์หรือเบราว์เซอร์ของคุณไม่รองรับการดึงพิกัดตำแหน่งครับ'
      });
      setGpsLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'exterior' | 'interior') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'exterior') {
        setPhotoExteriorFile(file);
        setPhotoExteriorPreview(URL.createObjectURL(file));
      } else {
        setPhotoInteriorFile(file);
        setPhotoInteriorPreview(URL.createObjectURL(file));
      }
    }
  };

  const dataURLtoFile = (dataurl: string, filename: string) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)![1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !studentId) return;

    setIsLoading(true);
    try {
      let visitId = existingVisitId;

      const gregorianYear = parseInt(bYear) - 543;
      const formattedDate = `${gregorianYear}-${bMonth.padStart(2, '0')}-${bDay.padStart(2, '0')}`;

      // 1. Visit Record
      if (!visitId) {
        const visit = await createHomeVisit({
          student_id: studentId,
          teacher_id: user.id,
          visit_date: formattedDate,
          status: 'COMPLETED',
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          distance_to_school: distanceToSchoolAuto || undefined,
        });
        visitId = visit.id;
      } else {
        await updateHomeVisit(visitId, {
          visit_date: formattedDate,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          distance_to_school: distanceToSchoolAuto || undefined,
        });
      }

      // 2. Assessment Data
      await saveHomeVisitAssessment({
        id: existingData?.assessment?.id,
        visit_id: visitId!,
        risk_level: riskLevel,
        form_data: formData
      });

      // 3. Photos & Signature
      // Handle explicit deletions of photos if they were removed in the UI
      const hadStudentPhoto = existingData?.photos?.some((p: any) => p.description === 'รูปถ่ายนักเรียน');
      if (hadStudentPhoto && !studentPhotoPreview) {
        await deleteVisitPhoto(visitId!, 'รูปถ่ายนักเรียน');
      }
      const hadExteriorPhoto = existingData?.photos?.some((p: any) => p.description === 'ภาพถ่ายสภาพบ้านภายนอก');
      if (hadExteriorPhoto && !photoExteriorPreview) {
        await deleteVisitPhoto(visitId!, 'ภาพถ่ายสภาพบ้านภายนอก');
      }
      const hadInteriorPhoto = existingData?.photos?.some((p: any) => p.description === 'ภาพถ่ายภายในบ้าน');
      if (hadInteriorPhoto && !photoInteriorPreview) {
        await deleteVisitPhoto(visitId!, 'ภาพถ่ายภายในบ้าน');
      }
      const hadMapPhoto = existingData?.photos?.some((p: any) => p.description === 'แผนที่การเดินทาง');
      if (hadMapPhoto && !mapPhotoPreview) {
        await deleteVisitPhoto(visitId!, 'แผนที่การเดินทาง');
      }

      if (studentPhotoFile) {
        await uploadVisitPhoto(visitId!, student!.student_code, studentPhotoFile, 'รูปถ่ายนักเรียน');
      }
      if (photoExteriorFile) {
        await uploadVisitPhoto(visitId!, student!.student_code, photoExteriorFile, 'ภาพถ่ายสภาพบ้านภายนอก');
      }
      if (mapPhotoFile) {
        await uploadVisitPhoto(visitId, student.student_code, mapPhotoFile, 'แผนที่การเดินทาง');
      }
      if (photoInteriorFile) {
        await uploadVisitPhoto(visitId!, student!.student_code, photoInteriorFile, 'ภาพถ่ายภายในบ้าน');
      }
      if (signatureDataUrl) {
        const signatureFile = dataURLtoFile(signatureDataUrl, 'signature.png');
        await uploadVisitPhoto(visitId!, student!.student_code, signatureFile, 'ลายเซ็นผู้ให้ข้อมูล');
      }
      if (teacherSignatureDataUrl) {
        const teacherSignatureFile = dataURLtoFile(teacherSignatureDataUrl, 'teacher_signature.png');
        await uploadVisitPhoto(visitId!, student!.student_code, teacherSignatureFile, 'ลายเซ็นครูที่ปรึกษา');
      }

      setShowSuccessModal(true);
    } catch (error: any) {
      console.error(error);
      setSaveErrorModal({
        show: true,
        message: error?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptureMap = async () => {
    if (!mapContainerRef.current) return;
    setIsCapturingMap(true);
    try {
      const dataUrl = await toJpeg(mapContainerRef.current, { quality: 0.8 });
      setMapPhotoPreview(dataUrl);

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'map_screenshot.jpg', { type: 'image/jpeg' });
      setMapPhotoFile(file);
    } catch (e: any) {
      console.error('Failed to capture map:', e);
      setSaveErrorModal({
        show: true,
        message: 'ไม่สามารถบันทึกภาพแผนที่ได้: ' + (e?.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ')
      });
    } finally {
      setIsCapturingMap(false);
    }
  };

  if (isLoadingStudents || isLoadingExisting) return <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-3"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /> <span>กำลังโหลดข้อมูล...</span></div>;
  if (isErrorStudents) return <div className="p-8 text-center text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูลรายชื่อนักเรียน</div>;
  if (!student) return <div className="p-8 text-center text-gray-500">ไม่พบข้อมูลนักเรียน</div>;

  return (
    <div className="max-w-4xl mx-auto pb-28 sm:pb-12 px-4">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-semibold transition-colors">
          <ArrowLeft size={20} /> กลับไปรายชื่อนักเรียน
        </button>
      </div>

      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 shadow-lg mb-8 text-white">
        <h2 className="text-2xl font-black mb-2 tracking-tight">แบบฟอร์มบันทึกการเยี่ยมบ้าน</h2>
        <p className="text-emerald-100 opacity-90">ระบบบริหารจัดการและดูแลช่วยเหลือนักเรียน (SAMS)</p>
      </div>

      {/* Tabs Navigation */}
      <div
        className="flex flex-nowrap md:flex-wrap gap-1.5 md:gap-2 mb-8 bg-gray-100 p-1.5 rounded-2xl overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {[1, 2, 3, 4, 5].map(tab => {
          const tabNamesDesktop = ['หน้า 1 (ข้อมูลเบื้องต้น)', 'หน้า 2 (พฤติกรรม)', 'หน้า 3 (ภาพถ่าย)', 'หน้า 4 (แผนที่)', 'หน้า 5 (แสดงรายงาน)'];
          const tabNamesMobile = ['🪪 ข้อมูล', '📝 พฤติกรรม', '📷 ภาพถ่าย', '📍 พิกัด', '📊 รายงาน'];
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 shrink-0 py-3 px-1.5 md:px-3 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
            >
              <span className="md:hidden">{tabNamesMobile[tab - 1]}</span>
              <span className="hidden md:inline">{tabNamesDesktop[tab - 1]}</span>
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section 1: Student & GPS */}
        {/* Tab 1 */}
        <div className={activeTab === 1 ? 'space-y-6 block' : 'hidden'}>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-emerald-700 mb-6 border-b pb-3 flex items-center gap-2"><User /> 1. ข้อมูลนักเรียน</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-xs text-gray-500 font-bold mb-1">ชื่อ - นามสกุล (นักเรียน)</p>
                <p className="font-bold text-gray-900 text-lg">{student.prefix}{student.first_name} {student.last_name}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-xs text-gray-500 font-bold mb-1">ชั้น / ห้อง</p>
                <p className="font-bold text-gray-900 text-lg">{student.classroom ? `${student.classroom.level}/${student.classroom.room}` : 'ยังไม่ระบุ'}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">เลขที่บัตรประชาชน (13 หลัก)</label>
                <input
                  type="text"
                  maxLength={13}
                  value={formData.national_id}
                  onChange={e => updateForm('national_id', e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="กรอกตัวเลข 13 หลัก"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">รูปถ่ายนักเรียน (ขนาด 102 x 126 px)</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-[102px] h-[126px] border border-gray-300 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center shrink-0 shadow-sm">
                    {studentPhotoPreview ? (
                      <img src={studentPhotoPreview} alt="รูปถ่ายนักเรียน" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-xs text-center font-medium">รูปถ่าย<br />นักเรียน</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-colors text-center border border-emerald-100">
                      {studentPhotoPreview ? 'เปลี่ยนรูปภาพ' : 'อัปโหลดรูปภาพ'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleStudentPhotoChange} />
                    </label>
                    {studentPhotoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveStudentPhoto}
                        className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-rose-100"
                      >
                        ลบรูปภาพ
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <hr className="my-6 border-gray-100" />

            <div className="space-y-4 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                {/* Column 1: Automatic GPS */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="text-emerald-500 w-4 h-4" /> พิกัดที่อยู่อาศัย (GPS)
                  </h4>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gpsLoading}
                    className="w-full bg-emerald-50 text-emerald-700 px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                  >
                    {gpsLoading ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                    กดเพื่อดึงพิกัดปัจจุบัน
                  </button>
                </div>

                {/* Column 2: Manual GPS */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Compass className="text-emerald-500 w-4 h-4" /> กรอกพิกัดที่อยู่อาศัย (GPS)
                  </h4>
                  <div className="relative">
                    <input
                      type="text"
                      value={gpsInput}
                      onChange={(e) => handleGpsInputChange(e.target.value)}
                      placeholder="กรอกพิกัดด้วยตัวเอง (เช่น 20.229939,100.407324)"
                      className={`w-full border ${gpsInputError && gpsInput.length > 5 ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'} rounded-xl p-3 outline-none focus:ring-2 text-sm bg-white transition-colors`}
                    />
                    {gpsInputError && gpsInput.length > 5 && (
                      <p className="text-xs text-rose-500 mt-1 font-medium">{gpsInputError}</p>
                    )}
                  </div>
                </div>
              </div>

              {latitude && longitude && (
                <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-sm font-bold text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                    ละติจูด: {latitude.toFixed(6)}
                  </span>
                  <span className="text-sm font-bold text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                    ลองจิจูด: {longitude.toFixed(6)}
                  </span>
                  {distanceToSchoolAuto !== null && distanceToSchoolAuto !== undefined && (
                    <span className="text-sm font-black text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm">
                      🛣️ ระยะทางจากโรงเรียน: {distanceToSchoolAuto} กม.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Parent Info */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-emerald-700 mb-6 border-b pb-3 flex items-center gap-2"><Users /> 2. ข้อมูลผู้ปกครอง</h3>
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer bg-amber-50 p-3 rounded-xl border border-amber-100 w-max">
                <input
                  type="checkbox"
                  checked={formData.no_parent}
                  onChange={e => updateForm('no_parent', e.target.checked)}
                  className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm font-bold text-amber-800">นักเรียนไม่มีผู้ปกครอง</span>
              </label>
            </div>

            {!formData.no_parent && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อ - นามสกุล ผู้ปกครอง</label>
                  <input type="text" value={formData.parent_name} onChange={e => updateForm('parent_name', e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">เบอร์โทรศัพท์</label>
                  <input type="tel" value={formData.parent_phone} onChange={e => updateForm('parent_phone', e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="flex flex-col md:flex-row md:items-start gap-3">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">ความสัมพันธ์กับนักเรียน</label>
                    <select value={formData.parent_relation} onChange={e => updateForm('parent_relation', e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                      <option value="">-- เลือก --</option>
                      <option value="บิดา">บิดา</option>
                      <option value="มารดา">มารดา</option>
                      <option value="ปู่/ตา">ปู่ / ตา</option>
                      <option value="ย่า/ยาย">ย่า / ยาย</option>
                      <option value="ลุง/ป้า/น้า/อา">ลุง / ป้า / น้า / อา</option>
                      <option value="พี่">พี่</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>
                  {formData.parent_relation === 'อื่นๆ' && (
                    <div className="flex-1 w-full mt-0 md:mt-7">
                      <input
                        type="text"
                        value={formData.parent_relation_other}
                        onChange={e => updateForm('parent_relation_other', e.target.value)}
                        placeholder="โปรดระบุความสัมพันธ์..."
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">อาชีพ</label>
                  <input type="text" value={formData.parent_occupation} onChange={e => updateForm('parent_occupation', e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ระดับการศึกษาสูงสุด</label>
                  <select value={formData.parent_education} onChange={e => updateForm('parent_education', e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="">-- เลือก --</option>
                    <option value="ไม่ได้ศึกษา">ไม่ได้ศึกษา</option>
                    <option value="ประถมศึกษา">ประถมศึกษา</option>
                    <option value="มัธยมศึกษาตอนต้น">มัธยมศึกษาตอนต้น</option>
                    <option value="มัธยมศึกษาตอนปลาย/ปวช.">มัธยมศึกษาตอนปลาย / ปวช.</option>
                    <option value="อนุปริญญา/ปวส.">อนุปริญญา / ปวส.</option>
                    <option value="ปริญญาตรี">ปริญญาตรี</option>
                    <option value="สูงกว่าปริญญาตรี">สูงกว่าปริญญาตรี</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
                    เลขที่บัตรประชาชนของผู้ปกครอง
                    <label className="flex items-center gap-1 font-normal text-xs bg-gray-100 px-2 py-1 rounded-md cursor-pointer">
                      <input type="checkbox" checked={formData.no_parent_id} onChange={e => updateForm('no_parent_id', e.target.checked)} className="rounded text-emerald-600" />
                      ไม่มีบัตร
                    </label>
                  </label>
                  <input type="text" maxLength={13} disabled={formData.no_parent_id} value={formData.no_parent_id ? '' : formData.parent_national_id} onChange={e => updateForm('parent_national_id', e.target.value.replace(/\D/g, ''))} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-gray-100" />
                </div>
                <div className="md:col-span-2">
                  <RadioGroup
                    label="เคยลงทะเบียนเพื่อสวัสดิการแห่งรัฐ (ลงทะเบียนคนจน) หรือไม่"
                    name="state_welfare"
                    options={['เคย', 'ไม่เคย']}
                    selected={formData.state_welfare}
                    onChange={(val: string) => updateForm('state_welfare', val)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Family Relations */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-emerald-700 mb-6 border-b pb-3 flex items-center gap-2"><Users /> 3. ความสัมพันธ์ในครอบครัว</h3>
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold text-gray-700">3.1 สมาชิกในครอบครัวมีเวลาอยู่ร่วมกัน</span>
                <input type="number" min="0" max="24" value={formData.time_together_hours} onChange={e => updateForm('time_together_hours', e.target.value)} className="w-20 border border-gray-300 rounded-xl p-2 text-center focus:ring-2 focus:ring-emerald-500 outline-none" />
                <span className="text-sm text-gray-600">ชั่วโมง/วัน</span>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">3.2 ความสัมพันธ์ระหว่างนักเรียนกับสมาชิกครอบครัว</label>

                {/* Desktop View (Table style) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-600 border border-gray-200 rounded-xl overflow-hidden min-w-[600px]">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="px-4 py-3 border-b border-gray-200">สมาชิก</th>
                        {['สนิทสนม', 'เฉยๆ', 'ห่างเหิน', 'ขัดแย้ง', 'ไม่มี'].map(level => (
                          <th key={level} className="px-4 py-3 border-b border-gray-200 text-center whitespace-nowrap">{level}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {['บิดา', 'มารดา', 'พี่ชาย/น้องชาย', 'พี่สาว/น้องสาว', 'ปู่/ย่า/ตา/ยาย', 'ญาติ', 'อื่นๆ'].map((member, idx) => (
                        <tr key={member} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-4 py-3 border-b border-gray-100 font-medium whitespace-nowrap">
                            {member === 'อื่นๆ' ? (
                              <div className="flex items-center gap-2">
                                <span>อื่นๆ</span>
                                <input
                                  type="text"
                                  value={formData.relation_with_members_other || ''}
                                  onChange={e => updateForm('relation_with_members_other', e.target.value)}
                                  placeholder="ระบุ..."
                                  className="border-b border-gray-300 focus:border-emerald-500 outline-none text-sm w-32 px-1 bg-transparent"
                                />
                              </div>
                            ) : member}
                          </td>
                          {['สนิทสนม', 'เฉยๆ', 'ห่างเหิน', 'ขัดแย้ง', 'ไม่มี'].map(level => (
                            <td key={level} className="px-4 py-3 border-b border-gray-100 text-center">
                              <input
                                type="radio"
                                name={`relation_${member}`}
                                value={level}
                                checked={(formData.relation_with_members as any)?.[member] === level}
                                onChange={(e) => {
                                  const currentRelations = (formData.relation_with_members as any) || {};
                                  const newRelations = { ...currentRelations, [member]: e.target.value };
                                  updateForm('relation_with_members', newRelations);
                                }}
                                className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 cursor-pointer border-gray-300"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View (Touch-friendly card list with bottom sheet modal) */}
                <div className="block md:hidden space-y-3">
                  {['บิดา', 'มารดา', 'พี่ชาย/น้องชาย', 'พี่สาว/น้องสาว', 'ปู่/ย่า/ตา/ยาย', 'ญาติ', 'อื่นๆ'].map((member) => {
                    const selectedVal = (formData.relation_with_members as any)?.[member];

                    // Style badges based on selection value
                    const badgeStyles: Record<string, string> = {
                      'สนิทสนม': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      'เฉยๆ': 'bg-sky-50 text-sky-700 border-sky-200',
                      'ห่างเหิน': 'bg-amber-50 text-amber-700 border-amber-200',
                      'ขัดแย้ง': 'bg-rose-50 text-rose-700 border-rose-200',
                      'ไม่มี': 'bg-gray-50 text-gray-500 border-gray-200',
                    };

                    const defaultBadgeStyle = 'bg-gray-50 text-gray-400 border-dashed border-gray-300';

                    return (
                      <div key={member} className="p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-center gap-3">
                          <div className="flex-1 min-w-0">
                            {member === 'อื่นๆ' ? (
                              <div className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-800">ระบุสมาชิกอื่นๆ</span>
                                <input
                                  type="text"
                                  value={formData.relation_with_members_other || ''}
                                  onChange={e => updateForm('relation_with_members_other', e.target.value)}
                                  placeholder="พิมพ์ระบุ เช่น น้าชาย..."
                                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
                                />
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-gray-800">{member}</span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveMobileMember(member)}
                            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shrink-0 select-none ${selectedVal ? badgeStyles[selectedVal] : defaultBadgeStyle
                              }`}
                          >
                            {selectedVal || 'แตะเพื่อเลือก +'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">3.3 กรณีผู้ปกครองไม่อยู่บ้านฝากนักเรียนอาศัยอยู่กับใคร</label>
                <div className="flex flex-wrap gap-4">
                  {['ญาติ', 'เพื่อนบ้าน', 'นักเรียนอยู่บ้านด้วยตนเอง'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="left_with" value={opt} checked={formData.left_with === opt} onChange={e => updateForm('left_with', e.target.value)} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="left_with" value="อื่นๆ" checked={formData.left_with === 'อื่นๆ'} onChange={e => updateForm('left_with', e.target.value)} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm text-gray-700">อื่นๆ</span>
                    {formData.left_with === 'อื่นๆ' && (
                      <input type="text" value={formData.left_with_other} onChange={e => updateForm('left_with_other', e.target.value)} placeholder="ระบุ..." className="border-b border-gray-300 focus:border-emerald-500 outline-none text-sm w-32 px-1" />
                    )}
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold text-gray-700">3.4 รายได้ครัวเรือนเฉลี่ยต่อคน(รวมรายได้ครัวเรือน หารด้วยจำนวนสมาชิกทั้งหมด)</span>
                <input type="number" value={formData.household_income_per_person} onChange={e => updateForm('household_income_per_person', e.target.value)} placeholder="บาท/คน" className="w-32 border border-gray-300 rounded-xl p-2 text-center focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>

              <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <span className="text-sm font-bold text-gray-700">3.5 นักเรียนได้รับค่าใช้จ่ายจาก</span>
                  <input type="text" value={formData.expense_from} onChange={e => updateForm('expense_from', e.target.value)} className="flex-1 border border-gray-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="flex items-start gap-4 flex-col md:flex-row md:items-center w-full">
                  <label className="flex items-start gap-3 font-bold text-sm text-gray-700 cursor-pointer w-full">
                    <input type="checkbox" checked={formData.student_works} onChange={e => updateForm('student_works', e.target.checked)} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 shrink-0 mt-0.5" />
                    <span className="flex-1 break-words whitespace-normal text-sm text-gray-700 leading-normal">
                      นักเรียนทำงานหารายได้ อาชีพ (ไม่ได้ทำให้เว้นว่างไม่ต้องติ๊ก)
                    </span>
                  </label>
                  {formData.student_works && (
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                      <input type="text" value={formData.student_work_detail} onChange={e => updateForm('student_work_detail', e.target.value)} placeholder="ระบุอาชีพ..." className="flex-1 border border-gray-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 whitespace-nowrap">รายได้ต่อวัน</span>
                        <input type="number" value={formData.student_work_income} onChange={e => updateForm('student_work_income', e.target.value)} placeholder="บาท/วัน" className="w-24 border border-gray-300 rounded-xl p-2 text-center focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-700">นักเรียนได้เงินมาโรงเรียนวันละ</span>
                  <input type="number" value={formData.daily_allowance} onChange={e => updateForm('daily_allowance', e.target.value)} className="w-24 border border-gray-300 rounded-xl p-2 text-center focus:ring-2 focus:ring-emerald-500 outline-none" />
                  <span className="text-sm text-gray-600">บาท</span>
                </div>
              </div>

              <CheckboxGroup
                label="3.6 สิ่งที่ผู้ปกครองต้องการให้โรงเรียนช่วยเหลือนักเรียน (เลือกได้มากกว่า 1 ข้อ)"
                options={['ด้านการเรียน', 'ด้านพฤติกรรม', 'ด้านเศรษฐกิจ (ทุนการศึกษา)']}
                selected={formData.school_help_needs}
                onChange={(val: any) => updateForm('school_help_needs', val)}
                otherLabel="อื่นๆ ระบุ"
                otherValue={formData.parent_concerns} // Reusing field for other
                onOtherChange={(val: string) => updateForm('parent_concerns', val)}
              />

              <CheckboxGroup
                label="3.7 ความช่วยเหลือที่เคยได้รับจากหน่วยงานหรือต้องการได้รับการช่วยเหลือ (เลือกได้มากกว่า 1 ข้อ)"
                options={['เบี้ยผู้สูงอายุ', 'เบี้ยพิการ']}
                selected={formData.help_received}
                onChange={(val: any) => updateForm('help_received', val)}
                otherLabel="อื่นๆ ระบุ"
                otherValue={formData.left_with_other}
                onOtherChange={(val: string) => updateForm('left_with_other', val)}
              />

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">3.8 ข้อห่วงใยของผู้ปกครองที่มีต่อนักเรียน</label>
                <textarea rows={3} value={formData.parent_concerns} onChange={e => updateForm('parent_concerns', e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="พิมพ์ข้อความที่นี่..." />
              </div>
            </div>
          </div>

          {/* Section 4: Behaviors & Risks */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-emerald-700 mb-6 border-b pb-3 flex items-center gap-2"><AlertTriangle /> 4. พฤติกรรมและความเสี่ยง (สุขภาพ/ความปลอดภัย)</h3>
            <div className="space-y-8">
              <CheckboxGroup
                label="4.1 สุขภาพ"
                options={['ร่างกายไม่แข็งแรง', 'มีโรคประจำตัวหรือเจ็บป่วยบ่อย', 'มีภาวะทุพโภชนาการ', 'ป่วยเป็นโรคร้ายแรง/เรื้อรัง', 'สมรรถภาพทางร่างกายต่ำ']}
                selected={formData.health_issues}
                onChange={(val: any) => updateForm('health_issues', val)}
              />

              <CheckboxGroup
                label="4.2 สวัสดิการหรือความปลอดภัย"
                options={[
                  'พ่อแม่แยกทางกัน หรือแต่งงานใหม่',
                  'ที่พักอาศัยอยู่ในชุมชนแออัดใกล้แหล่งมั่วสุม/สถานเริงรมย์',
                  'มีบุคลในครอบครัวเจ็บป่วยด้วยโรคร้ายแรง/เรื้อรัง/ติดต่อ',
                  'บุคคลในครอบครัวติดสารเสพติด',
                  'บุคคลในครอบครัวเล่นการพนัน',
                  'มีความขัดแย้ง/ทะเลาะกันในครอบครัว',
                  'ไม่มีผู้ดูแล',
                  'มีความขัดแย้งและมีการใช้ความรุนแรงในครอบครัว',
                  'ถูกทารุณ/ทำร้ายจากบุคคลในครอบครัว/เพื่อนบ้าน',
                  'ถูกล่วงละเมิดทางเพศ',
                  'เล่นการพนัน'
                ]}
                selected={formData.welfare_safety}
                onChange={(val: any) => updateForm('welfare_safety', val)}
              />
            </div>
          </div>
        </div>

        {/* Tab 2: Behaviors */}
        <div className={activeTab === 2 ? 'space-y-6 block' : 'hidden'}>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-emerald-700 mb-6 border-b pb-3 flex items-center gap-2"><AlertTriangle /> 4. พฤติกรรมและความเสี่ยง (ต่อ)</h3>

            <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
              <label className="block text-sm font-bold text-gray-700 mb-4">4.3 การเดินทาง (กรอกข้อมูลที่ผู้ปกครองแจ้ง)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">ระยะทาง ไป-กลับ</span>
                  <input type="number" value={formData.commute_distance_km} onChange={e => updateForm('commute_distance_km', e.target.value)} className="w-24 border border-gray-300 rounded-xl p-2 text-center focus:ring-2 focus:ring-emerald-500 outline-none" />
                  <span className="text-sm text-gray-600">กม.</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">เวลาที่ใช้เดินทาง</span>
                  <input type="text" value={formData.commute_time} onChange={e => updateForm('commute_time', e.target.value)} placeholder="เช่น 30 นาที" className="w-32 border border-gray-300 rounded-xl p-2 text-center focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <span className="text-sm font-medium text-gray-700 min-w-max">วิธีการเดินทาง</span>
                <select value={formData.commute_method} onChange={e => updateForm('commute_method', e.target.value)} className="flex-1 border border-gray-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="">-- เลือก --</option>
                  {['ผู้ปกครองมาส่ง', 'รถโดยสารประจำทาง', 'รถจักรยานยนต์', 'รถโรงเรียน', 'รถยนต์ส่วนตัว', 'รถจักรยาน', 'เดินเท้า'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
                {formData.commute_method === 'อื่นๆ' && (
                  <input type="text" value={formData.commute_method_other} onChange={e => updateForm('commute_method_other', e.target.value)} placeholder="ระบุวิธีเดินทาง..." className="flex-1 border border-gray-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
                )}
              </div>
            </div>

            <CheckboxGroup
              label="4.4 สภาพที่อยู่อาศัย"
              options={['สภาพบ้านทรุดโทรมหรือทำจากวัสดุพื้นบ้าน', 'ไม่มีห้องส้วมในที่อยู่อาศัยและบริเวณ']}
              selected={formData.housing_condition}
              onChange={(val: any) => updateForm('housing_condition', val)}
            />

            <CheckboxGroup
              label="4.5 ภาระงานที่รับผิดชอบ"
              options={['ช่วยงานบ้าน', 'ช่วยดูแลคนป่วย/พิการ', 'ช่วยค้าขายเล็กๆน้อยๆ', 'ทำงานแถวบ้าน', 'ช่วยงานในนา/ไร่']}
              selected={formData.responsibilities}
              onChange={(val: any) => updateForm('responsibilities', val)}
              otherLabel="อื่นๆ ระบุ"
              otherValue={formData.responsibilities_other}
              onOtherChange={(val: string) => updateForm('responsibilities_other', val)}
            />

            <CheckboxGroup
              label="4.6 กิจกรรมยามว่างหรืองานอดิเรก"
              options={['ดูทีวี/ฟังเพลง', 'ไปห้าง/ดูหนัง', 'อ่านหนังสือ', 'ไปหาเพื่อน', 'แว้น/สก๊อย', 'เล่นคอม/มือถือ', 'ไปสวนสาธารณะ', 'ไปร้านสนุกเกอร์']}
              selected={formData.hobbies}
              onChange={(val: any) => updateForm('hobbies', val)}
              otherLabel="อื่นๆ ระบุ"
              otherValue={formData.hobbies_other}
              onOtherChange={(val: string) => updateForm('hobbies_other', val)}
            />

            <CheckboxGroup
              label="4.7 พฤติกรรมการใช้สารเสพติด"
              options={['คบเพื่อนกลุ่มใช้สารเสพติด', 'สมาชิกในครอบครัวเกี่ยวข้องกับยาเสพติด', 'อยู่ในสภาพแวดล้อมที่ใช้สารเสพติด', 'ปัจจุบันเกี่ยวข้องกับสารเสพติด', 'เป็นผู้ติดบุหรี่/สุรา/สารเสพติดอื่นๆ']}
              selected={formData.substance_abuse}
              onChange={(val: any) => updateForm('substance_abuse', val)}
            />

            <CheckboxGroup
              label="4.8 พฤติกรรมการใช้ความรุนแรง"
              options={['มีการทะเลาะวิวาท', 'ก้าวร้าว เกเร', 'ทะเลาะวิวาทเป็นประจำ', 'ทำร้ายร่างกายผู้อื่น', 'ทำร้ายร่างกายตนเอง']}
              selected={formData.violence}
              onChange={(val: any) => updateForm('violence', val)}
            />

            <CheckboxGroup
              label="4.9 พฤติกรรมทางเพศ"
              options={['อยู่ในกลุ่มขายบริการ', 'ใช้เครื่องมือสื่อสารที่เกี่ยวข้องกับด้านเพศเป็นเวลานานและบ่อยครั้ง', 'ตั้งครรภ์', 'ขายบริการทางเพศ', 'หมกมุ่นในเครื่องมือสื่อสารเรื่องที่เกี่ยวข้องทางเพศ', 'มีการมั่วสุมทางเพศ']}
              selected={formData.sexual_behavior}
              onChange={(val: any) => updateForm('sexual_behavior', val)}
            />

            <CheckboxGroup
              label="4.10 การติดเกม"
              options={['เล่นเกมเกินวันละ 1 ชั่วโมง', 'ขาดจินตนาการและความคิดสร้างสรรค์', 'เก็บตัว แยกจากกลุ่มเพื่อน', 'ใช้จ่ายเงินผิดปกติ', 'อยู่ในกลุ่มเพื่อนเล่นเกม', 'ร้านเกมใกล้บ้านหรือโรงเรียน', 'ใช้เวลาเล่นเกมเกิน 2 ชั่วโมง', 'หมกมุ่น จริงจังกับการเล่นเกม', 'ใช้เงินสิ้นเปลือง โกหก ลักขโมยเงินเพื่อเล่นเกม']}
              selected={formData.gaming_addiction}
              onChange={(val: any) => updateForm('gaming_addiction', val)}
              otherLabel="อื่นๆ ระบุ"
              otherValue={formData.gaming_addiction_other}
              onOtherChange={(val: string) => updateForm('gaming_addiction_other', val)}
            />

            <RadioGroup
              label="4.11 การเข้าถึงสื่อคอมพิวเตอร์และอินเทอร์เน็ตที่บ้าน"
              name="internet_access"
              options={['สามารถเข้าถึง Internet ได้จากที่บ้าน', 'ไม่สามารถเข้าถึง Internet ได้จากที่บ้าน']}
              selected={formData.internet_access}
              onChange={(val: string) => updateForm('internet_access', val)}
            />

            <CheckboxGroup
              label="4.12 การใช้เครื่องมือสื่อสารอิเล็กทรอนิกส์"
              options={['เคยใช้โทรศัพท์ในระหว่างเรียน', 'ใช้ Line/Facebook/Chat (เกินวันละ 1 ชั่วโมง)', 'ใช้โทรศัพท์มือถือในระหว่างเรียน 2 – 3 /วัน', 'ใช้ Line/Facebook/Chat (เกินวันละ 2 ชั่วโมง)']}
              selected={formData.device_usage}
              onChange={(val: any) => updateForm('device_usage', val)}
            />

          </div>

          {/* Section 5: Informant & Assessment Summary */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-emerald-700 mb-6 border-b pb-3 flex items-center gap-2"><FileText /> 5. ข้อมูลผู้ให้ข้อมูล</h3>

            <div className="mb-6 bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-3">ผู้ให้ข้อมูลนักเรียน (ในการเยี่ยมบ้านครั้งนี้)</label>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <select value={formData.informant} onChange={e => updateForm('informant', e.target.value)} className="w-full md:w-1/3 border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="">-- เลือกความสัมพันธ์ --</option>
                  {['บิดา', 'มารดา', 'พี่ชาย', 'พี่สาว', 'น้า', 'อา', 'ลุง', 'ป้า', 'ปู่', 'ย่า', 'ตา', 'ยาย', 'ทวด', 'พ่อเลี้ยง', 'แม่เลี้ยง', 'นักเรียนให้ข้อมูลเอง'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
                {formData.informant === 'อื่นๆ' && (
                  <input type="text" value={formData.informant_other} onChange={e => updateForm('informant_other', e.target.value)} placeholder="ระบุผู้ให้ข้อมูล..." className="flex-1 border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none" />
                )}
              </div>
            </div>
            <div className="mb-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mt-6">
              <h4 className="text-md font-bold text-gray-800 mb-4 text-center">รับรองข้อมูลการเยี่ยมบ้าน</h4>
              <div className="max-w-md mx-auto">
                <SignaturePad onSignatureChange={setSignatureDataUrl} />

                <div className="text-center mt-4 text-gray-600">
                  <p className="font-bold text-sm">"ขอรับรองว่าข้อมูลดังกล่าวเป็นจริง"</p>
                  <div className="mt-3 text-sm flex items-center justify-center gap-2">
                    <span>(ลงชื่อ)</span>
                    <span className="border-b border-dotted border-gray-400 w-48 inline-block"></span>
                    <span>ผู้ให้ข้อมูล</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 font-medium">
                    ( {formData.no_parent ? '......................................................' : (formData.parent_name || '......................................................')} )
                  </div>
                </div>
              </div>
            </div>

            <hr className="my-6 border-gray-100" />

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">วันที่ลงบันทึกการเยี่ยมบ้าน</label>
              <div className="grid grid-cols-3 sm:flex gap-2 w-full">
                <select value={bDay} onChange={e => setBDay(e.target.value)} className="w-full sm:w-24 border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select value={bMonth} onChange={e => setBMonth(e.target.value)} className="w-full sm:flex-1 border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select value={bYear} onChange={e => setBYear(e.target.value)} className="w-full sm:w-28 border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + 543 - 5 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Tab 3: Photos */}
        <div className={activeTab === 3 ? 'space-y-6 block' : 'hidden'}>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-emerald-700 mb-6 border-b pb-3 flex items-center gap-2"><Camera /> ภาพถ่ายบ้านนักเรียนที่ได้รับการเยี่ยมบ้าน</h3>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3">ประเภทที่พักอาศัย</label>
              <div className="flex flex-col gap-3">
                {['บ้านที่อาศัยอยู่กับพ่อแม่ (เป็นเจ้าของ/เช่า)', 'บ้านของญาติ/ผู้ปกครองที่ไม่ใช่ญาติ', 'บ้านหรือที่พักประเภท วัด มูลนิธิ หอพัก โรงงาน อยู่กับนายจ้าง', 'ภาพนักเรียนและป้ายชื่อโรงเรียนเนื่องจากถ่ายภาพบ้านไม่ได้'].map(type => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="house_type" value={type} checked={formData.house_type === type} onChange={() => updateForm('house_type', type)} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><Camera className="text-emerald-500" /> รูปที่ 1 ภาพถ่ายสภาพบ้านนักเรียน (ภายนอก)</label>
                <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-emerald-200 border-dashed rounded-2xl cursor-pointer bg-emerald-50/30 hover:bg-emerald-50 transition-colors overflow-hidden relative">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {photoExteriorPreview ? (
                      <img src={photoExteriorPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <>
                        <UploadCloud className="w-10 h-10 text-emerald-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-500"><span className="font-bold text-emerald-600">คลิกเพื่ออัปโหลด</span> หรือลากไฟล์มาวาง</p>
                        <p className="text-xs text-gray-400">PNG, JPG, JPEG (แนะนำแนวนอน)</p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoChange(e, 'exterior')} />
                </label>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><Camera className="text-emerald-500" /> รูปที่ 2 ภาพถ่ายภายในบ้านนักเรียน</label>
                <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-emerald-200 border-dashed rounded-2xl cursor-pointer bg-emerald-50/30 hover:bg-emerald-50 transition-colors overflow-hidden relative">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {photoInteriorPreview ? (
                      <img src={photoInteriorPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <>
                        <UploadCloud className="w-10 h-10 text-emerald-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-500"><span className="font-bold text-emerald-600">คลิกเพื่ออัปโหลด</span> หรือลากไฟล์มาวาง</p>
                        <p className="text-xs text-gray-400">PNG, JPG, JPEG (แนะนำแนวนอน)</p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoChange(e, 'interior')} />
                </label>
              </div>
            </div>

            <div className="mb-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mt-8">
              <h4 className="text-md font-bold text-gray-800 mb-4 text-center">รับรองภาพถ่ายบ้านนักเรียน</h4>
              <div className="max-w-md mx-auto">
                <SignaturePad onSignatureChange={setTeacherSignatureDataUrl} />

                <div className="text-center mt-4 text-gray-600">
                  <p className="font-bold text-sm">"ขอรับรองว่าข้อมูล และภาพถ่ายบ้านของนักเรียนเป็นความจริง"</p>
                  <div className="mt-3 text-sm flex items-center justify-center gap-2">
                    <span>(ลงชื่อ)</span>
                    <span className="border-b border-dotted border-gray-400 w-48 inline-block"></span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 font-medium">
                    ({advisorFullName || currentUserFullName || '......................................................'})
                  </div>
                  <div className="mt-1 text-sm text-gray-600">ตำแหน่ง ครูที่ปรึกษา</div>
                  <div className="mt-2 text-sm text-gray-600">
                    วัน <span className="border-b border-dotted border-gray-400 w-8 inline-block text-center text-emerald-700 font-bold">{today.getDate()}</span>
                    เดือน <span className="border-b border-dotted border-gray-400 w-24 inline-block text-center text-emerald-700 font-bold">{today.toLocaleDateString('th-TH', { month: 'long' })}</span>
                    พ.ศ. <span className="border-b border-dotted border-gray-400 w-16 inline-block text-center text-emerald-700 font-bold">{today.getFullYear() + 543}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab 4: Map */}
        <div className={activeTab === 4 ? 'space-y-6 block' : 'hidden'}>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-emerald-700 mb-6 border-b pb-3 flex items-center gap-2"><MapPin /> แผนที่และการเดินทาง</h3>

            {latitude && longitude ? (
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-3">เส้นทางจากโรงเรียนถึงบ้านนักเรียน</label>
                <div className="rounded-2xl overflow-hidden border border-gray-200" ref={mapContainerRef}>
                  <VisitMap
                    visits={[{
                      id: 'preview_1',
                      latitude: latitude,
                      longitude: longitude,
                      student: student,
                      visit_date: new Date().toISOString()
                    } as any]}
                    externalRouteTargetId="preview_1"
                  />
                </div>
                {distanceToSchoolAuto && (
                  <p className="text-sm text-gray-500 mt-2 text-center bg-gray-50 py-2 rounded-xl">
                    ระยะทางโดยประมาณ: <strong className="text-indigo-600">{distanceToSchoolAuto}</strong> กม. (สามารถปรับแก้ไขเองได้ที่หน้า 1)
                  </p>
                )}

                <div className="mt-6 flex flex-col items-center gap-4 bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                  <p className="text-sm text-gray-600 text-center font-medium">
                    หากคุณจัดตำแหน่งและซูมแผนที่จนเห็นเส้นทางชัดเจนแล้ว<br />
                    กรุณากดปุ่มด้านล่างเพื่อ <span className="font-bold text-emerald-700">"แคปเจอร์ภาพแผนที่"</span> สำหรับนำไปใช้ในหน้ารายงาน
                  </p>
                  <button
                    type="button"
                    onClick={handleCaptureMap}
                    disabled={isCapturingMap}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-md disabled:bg-gray-400"
                  >
                    {isCapturingMap ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                    {isCapturingMap ? 'กำลังประมวลผลภาพ...' : 'บันทึกภาพแผนที่ปัจจุบัน'}
                  </button>

                  {mapPhotoPreview && (
                    <div className="mt-4 w-full">
                      <p className="text-sm font-bold text-gray-700 mb-2 text-center">ตัวอย่างภาพแผนที่ที่จะใช้พิมพ์ในรายงาน:</p>
                      <div className="border-4 border-white shadow-lg rounded-xl overflow-hidden max-w-lg mx-auto">
                        <img src={mapPhotoPreview} alt="Map Preview" className="w-full h-auto" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-8 p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-center">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-bold mb-1">ยังไม่มีข้อมูลพิกัด GPS</p>
                <p className="text-sm text-gray-400">กรุณากลับไปที่ <span className="font-bold text-emerald-600 cursor-pointer" onClick={() => { setActiveTab(1); window.scrollTo(0, 0); }}>หน้า 1</span> เพื่อดึงพิกัดปัจจุบันก่อน</p>
              </div>
            )}

            <div className="mt-8">
              <label className="block text-sm font-bold text-gray-700 mb-3">อธิบายการเดินทางจากโรงเรียนไปบ้านนักเรียน</label>
              <textarea
                value={formData.travel_description}
                onChange={e => updateForm('travel_description', e.target.value)}
                rows={6}
                placeholder="อธิบายเส้นทาง จุดสังเกต..."
                className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Tab 5: Preview Report */}
        <div className={activeTab === 5 ? 'space-y-6 block' : 'hidden'}>
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-emerald-800 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                <Printer size={20} /> ตรวจสอบความถูกต้องก่อนบันทึกและพิมพ์
              </h3>
              <p className="text-sm opacity-90">ตรวจสอบข้อมูลในรายงานให้ครบถ้วน หากมีส่วนใดไม่ถูกต้อง สามารถย้อนกลับไปแก้ไขในหน้า 1-4 ได้</p>
            </div>
            <button type="button" onClick={() => window.print()} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md whitespace-nowrap">
              <Printer size={18} /> พิมพ์รายงาน (PDF)
            </button>
          </div>

          <ReportPrintView
            visit={existingData?.visit || {
              id: existingVisitId || 'new_visit_preview',
              student_id: student?.id,
              visit_date: `${parseInt(bYear) - 543}-${bMonth.padStart(2, '0')}-${bDay.padStart(2, '0')}`,
              status: 'visited',
              latitude: latitude || undefined,
              longitude: longitude || undefined,
            } as any}
            student={student}
            assessment={existingData?.assessment || null}
            photos={existingData?.photos || []}
            liveFormData={formData}
            liveSignatures={{
              student: studentPhotoPreview || undefined,
              parent: signatureDataUrl || undefined,
              teacher: teacherSignatureDataUrl || undefined,
              map: mapPhotoPreview || undefined,
              exterior: photoExteriorPreview || undefined,
              interior: photoInteriorPreview || undefined
            }}
            isPreviewMode={true}
            teacherName={advisorFullName || currentUserFullName}
          />
        </div>

        <div className="fixed bottom-4 left-4 right-4 rounded-3xl z-50 bg-white/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-emerald-50/80 p-4 mt-0 flex flex-row justify-between items-center gap-3 sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:w-auto sm:max-w-none sm:rounded-none sm:border-0 sm:border-t sm:border-gray-200 sm:bg-transparent sm:backdrop-blur-none sm:shadow-none sm:pt-6 sm:mt-8 sm:p-0">
          <div className="flex flex-1 sm:flex-initial sm:w-auto gap-3">
            {activeTab > 1 && (
              <button type="button" onClick={() => { setActiveTab(activeTab - 1); window.scrollTo(0, 0); }} className="flex-1 sm:flex-none px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-colors">
                ย้อนกลับ
              </button>
            )}
            {activeTab < 5 && (
              <button type="button" onClick={() => { setActiveTab(activeTab + 1); window.scrollTo(0, 0); }} className="flex-1 sm:flex-none px-6 py-4 bg-emerald-100 text-emerald-700 font-bold rounded-2xl hover:bg-emerald-200 transition-colors">
                ถัดไป
              </button>
            )}
            {activeTab < 5 && (
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 sm:hidden px-4 py-4 rounded-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md flex justify-center items-center gap-2"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                บันทึก
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex-1 sm:flex-initial sm:w-auto px-6 sm:px-10 py-4 rounded-2xl font-black text-base sm:text-lg transition-all flex justify-center items-center gap-3 ${activeTab === 5 ? 'flex bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl hover:shadow-2xl hover:scale-[1.02]' : 'hidden sm:flex bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl hover:shadow-2xl hover:scale-[1.02]'}`}
          >
            {isLoading ? <><Loader2 className="animate-spin" /> กำลังบันทึก...</> : existingData ? <><Save size={24} /> บันทึกการแก้ไขข้อมูล</> : <><Save size={24} /> บันทึกข้อมูลการเยี่ยมบ้าน</>}
          </button>
        </div>

      </form>

      {/* Hidden Print Component via Portal to escape #root hidden rules */}
      {existingData && createPortal(
        <ReportPrintView
          visit={existingData.visit}
          student={student}
          assessment={existingData.assessment}
          photos={existingData.photos || []}
          liveFormData={formData}
          liveSignatures={{
            student: studentPhotoPreview || undefined,
            parent: signatureDataUrl || undefined,
            teacher: teacherSignatureDataUrl || undefined,
            map: mapPhotoPreview || undefined,
            exterior: photoExteriorPreview || undefined,
            interior: photoInteriorPreview || undefined
          }}
          teacherName={advisorFullName || currentUserFullName}
        />,
        document.body
      )}

      {/* Mobile Modal for Section 3.2 */}
      {activeMobileMember && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/30">
              <div>
                <h4 className="font-bold text-gray-900 text-lg">เลือกความสัมพันธ์</h4>
                <p className="text-xs text-emerald-600 font-bold mt-0.5">สมาชิก: {activeMobileMember}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveMobileMember(null)}
                className="text-gray-400 hover:text-gray-600 text-3xl font-light px-2 cursor-pointer transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Modal Body / Radio list */}
            <div className="p-6 space-y-3 overflow-y-auto">
              {['สนิทสนม', 'เฉยๆ', 'ห่างเหิน', 'ขัดแย้ง', 'ไม่มี'].map(level => {
                const isSelected = (formData.relation_with_members as any)?.[activeMobileMember] === level;

                // Active/Inactive Tailwind style classes
                const colors: Record<string, string> = {
                  'สนิทสนม': 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/20 text-gray-700',
                  'เฉยๆ': 'border-gray-200 hover:border-sky-200 hover:bg-sky-50/20 text-gray-700',
                  'ห่างเหิน': 'border-gray-200 hover:border-amber-200 hover:bg-amber-50/20 text-gray-700',
                  'ขัดแย้ง': 'border-gray-200 hover:border-rose-200 hover:bg-rose-50/20 text-gray-700',
                  'ไม่มี': 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 text-gray-600'
                };

                const activeColors: Record<string, string> = {
                  'สนิทสนม': 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20',
                  'เฉยๆ': 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-500/20',
                  'ห่างเหิน': 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20',
                  'ขัดแย้ง': 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20',
                  'ไม่มี': 'border-gray-500 bg-gray-100 text-gray-800 ring-2 ring-gray-500/20'
                };

                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      const currentRelations = (formData.relation_with_members as any) || {};
                      const newRelations = { ...currentRelations, [activeMobileMember]: level };
                      updateForm('relation_with_members', newRelations);
                      setActiveMobileMember(null); // Auto close
                    }}
                    className={`w-full text-left p-4.5 rounded-2xl border-2 transition-all flex items-center justify-between font-bold text-sm cursor-pointer ${isSelected ? activeColors[level] : colors[level]
                      }`}
                  >
                    <span>{level}</span>
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300'
                      }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-emerald-500 w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">บันทึกสำเร็จ!</h3>
            <p className="text-gray-500 mb-8">ข้อมูลการเยี่ยมบ้านถูกบันทึกลงในระบบเรียบร้อยแล้ว</p>
            <button
              onClick={() => navigate('/homevisit/students')}
              className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-emerald-700 transition-all"
            >
              ตกลงเพื่อกลับไปหน้าหลัก
            </button>
          </div>
        </div>
      )}

      {/* GPS Confirm Modal */}
      {showGpsConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="text-indigo-500 w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">ดึงพิกัดบ้านนักเรียน?</h3>
            <p className="text-gray-500 mb-2">ระบบจะใช้ตำแหน่ง GPS ปัจจุบันของคุณเป็นพิกัดบ้านของนักเรียน</p>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowGpsConfirmModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors">ยกเลิก</button>
              <button onClick={executeGetLocation} className="flex-1 bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-indigo-700 transition-colors">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modals */}
      {gpsErrorModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle className="text-red-500 w-10 h-10" /></div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-gray-500 mb-8">{gpsErrorModal.message}</p>
            <button onClick={() => setGpsErrorModal({ show: false, message: '' })} className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors">ปิดหน้าต่าง</button>
          </div>
        </div>
      )}
      {saveErrorModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle className="text-red-500 w-10 h-10" /></div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">บันทึกไม่สำเร็จ</h3>
            <p className="text-gray-500 mb-8">{saveErrorModal.message}</p>
            <button onClick={() => setSaveErrorModal({ show: false, message: '' })} className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-red-700 transition-colors">รับทราบ</button>
          </div>
        </div>
      )}
    </div>
  );
}
