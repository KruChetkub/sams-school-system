import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getStudents } from '../../services/studentService';
import { createHomeVisit, updateHomeVisit, saveHomeVisitAssessment, uploadVisitPhoto, getHomeVisitByStudentAndTeacher } from '../../services/homevisit/visitService';
import { MapPin, Camera, Save, ArrowLeft, Loader2, Printer, CheckCircle, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ReportPrintView from '../../components/homevisit/ReportPrintView';

export default function VisitForm() {
  const { id: studentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  
  const { data: students } = useQuery({ queryKey: ['students'], queryFn: getStudents });
  const student = students?.find(s => s.id === studentId);

  const [isLoading, setIsLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [existingVisitId, setExistingVisitId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showGpsConfirmModal, setShowGpsConfirmModal] = useState(false);
  const [gpsErrorModal, setGpsErrorModal] = useState({ show: false, message: '' });
  const [saveErrorModal, setSaveErrorModal] = useState({ show: false, message: '' });
  const [distanceToSchool, setDistanceToSchool] = useState<number | null>(null);

  // Fetch existing visit if any
  const { data: existingData, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['home_visit', studentId, user?.id, role],
    queryFn: () => studentId && user?.id ? getHomeVisitByStudentAndTeacher(studentId, user.id, role) : null,
    enabled: !!studentId && !!user?.id
  });

  // Form State
  const today = new Date();
  const [bDay, setBDay] = useState(today.getDate().toString());
  const [bMonth, setBMonth] = useState((today.getMonth() + 1).toString());
  const [bYear, setBYear] = useState((today.getFullYear() + 543).toString());
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [livingCondition, setLivingCondition] = useState('');
  const [familyStatus, setFamilyStatus] = useState('');
  const [economicStatus, setEconomicStatus] = useState('');
  const [riskLevel, setRiskLevel] = useState<'NORMAL' | 'WATCH' | 'URGENT'>('NORMAL');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhotos, setExistingPhotos] = useState<any[]>([]);

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
      if (existingData.visit.distance_to_school) setDistanceToSchool(existingData.visit.distance_to_school);
      
      if (existingData.assessment) {
        setLivingCondition(existingData.assessment.living_condition || '');
        setFamilyStatus(existingData.assessment.family_status || '');
        setEconomicStatus(existingData.assessment.economic_status || '');
        setRiskLevel(existingData.assessment.risk_level || 'NORMAL');
        setNotes(existingData.assessment.notes || '');
      }

      if (existingData.photos && existingData.photos.length > 0) {
        setExistingPhotos(existingData.photos);
        setPhotoPreview(existingData.photos[0].photo_url); // show first photo preview
      }
    }
  }, [existingData]);

  const handlePrint = () => {
    window.print();
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
          setLatitude(lat);
          setLongitude(lng);

          // คำนวณระยะทางจากโรงเรียนทันที
          try {
            const SCHOOL_LAT = 20.2445000;
            const SCHOOL_LNG = 100.4125000;
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${SCHOOL_LNG},${SCHOOL_LAT};${lng},${lat}?overview=false`);
            const data = await res.json();
            if (data.routes && data.routes.length > 0) {
              const distanceKm = +(data.routes[0].distance / 1000).toFixed(2);
              setDistanceToSchool(distanceKm);
            }
          } catch (err) {
            console.error('Error calculating distance:', err);
          }

          setGpsLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setGpsErrorModal({
            show: true, 
            message: 'ไม่สามารถดึงพิกัดได้ กรุณาอนุญาตการเข้าถึงตำแหน่งที่ตั้ง (Location/GPS) บนอุปกรณ์หรือเบราว์เซอร์ของคุณก่อนครับ'
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !studentId) return;

    setIsLoading(true);
    try {
      let visitId = existingVisitId;
      
      // แปลง พ.ศ. กลับเป็น ค.ศ. (YYYY-MM-DD) สำหรับฐานข้อมูล
      const gregorianYear = parseInt(bYear) - 543;
      const formattedDate = `${gregorianYear}-${bMonth.padStart(2, '0')}-${bDay.padStart(2, '0')}`;
      
      // 1. Create or Update Visit Record
      if (!visitId) {
        const visit = await createHomeVisit({
          student_id: studentId,
          teacher_id: user.id,
          visit_date: formattedDate,
          status: 'COMPLETED',
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          distance_to_school: distanceToSchool || undefined,
        });
        visitId = visit.id;
      } else {
        await updateHomeVisit(visitId, {
          visit_date: formattedDate,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          distance_to_school: distanceToSchool || undefined,
        });
      }

      // 2. Create Assessment
      await saveHomeVisitAssessment({
        id: existingData?.assessment?.id, // if editing
        visit_id: visitId!,
        living_condition: livingCondition,
        family_status: familyStatus,
        economic_status: economicStatus,
        risk_level: riskLevel,
        notes: notes
      });

      // 3. Upload Photo if selected
      if (photoFile && visitId && student?.student_code) {
        await uploadVisitPhoto(visitId, student.student_code, photoFile, 'ภาพถ่ายสภาพบ้าน');
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

  if (!student || isLoadingExisting) return <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-semibold">
          <ArrowLeft size={20} /> กลับไปรายชื่อนักเรียน
        </button>
        {existingData && (
          <button onClick={handlePrint} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition shadow-sm">
            <Printer size={18} /> พิมพ์รายงาน (PDF)
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">บันทึกการเยี่ยมบ้าน</h2>
        <p className="text-gray-500">นักเรียน: {student.prefix}{student.first_name} {student.last_name} ({student.student_code})</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* พิกัด GPS */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="text-emerald-500"/> พิกัดที่อยู่อาศัย (GPS)</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <button 
              type="button" 
              onClick={handleGetLocation}
              disabled={gpsLoading}
              className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-100"
            >
              {gpsLoading ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />} 
              กดเพื่อดึงพิกัดปัจจุบัน
            </button>
            {latitude && longitude && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
                  Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
                </span>
                {distanceToSchool && (
                  <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 inline-block w-max">
                    ระยะทางถึงโรงเรียน: {distanceToSchool} กม.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* แบบประเมิน */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-3">แบบประเมินสภาพครอบครัว</h3>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">วันที่เยี่ยมบ้าน</label>
            <div className="flex gap-2">
              <select value={bDay} onChange={e => setBDay(e.target.value)} className="w-24 border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select value={bMonth} onChange={e => setBMonth(e.target.value)} className="flex-1 border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                {[
                  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
                ].map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
              <select value={bYear} onChange={e => setBYear(e.target.value)} className="w-28 border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + 543 - 5 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">สภาพความเป็นอยู่และที่พักอาศัย</label>
            <textarea rows={3} value={livingCondition} onChange={e => setLivingCondition(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="เช่น เป็นบ้านไม้สองชั้น สภาพทรุดโทรม..." />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">สถานภาพครอบครัว</label>
            <select value={familyStatus} onChange={e => setFamilyStatus(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="">-- เลือกสถานภาพ --</option>
              <option value="อยู่ร่วมกัน">อยู่ร่วมกัน</option>
              <option value="หย่าร้าง">หย่าร้าง</option>
              <option value="แยกกันอยู่">แยกกันอยู่</option>
              <option value="บิดา/มารดาเสียชีวิต">บิดา/มารดาเสียชีวิต</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ระดับความเสี่ยงที่ต้องเฝ้าระวัง</label>
            <div className="flex gap-4">
              {['NORMAL', 'WATCH', 'URGENT'].map(level => {
                const labels = { NORMAL: 'กลุ่มปกติ', WATCH: 'กลุ่มเฝ้าระวัง', URGENT: 'กลุ่มช่วยเหลือเร่งด่วน' };
                const colors = { NORMAL: 'peer-checked:bg-emerald-500', WATCH: 'peer-checked:bg-amber-500', URGENT: 'peer-checked:bg-red-500' };
                return (
                  <label key={level} className="flex-1 relative cursor-pointer">
                    <input type="radio" name="risk" value={level} checked={riskLevel === level} onChange={() => setRiskLevel(level as any)} className="peer sr-only" />
                    <div className={`text-center py-3 px-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 peer-checked:text-white ${colors[level as keyof typeof colors]} transition-colors`}>
                      {labels[level as keyof typeof labels]}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ข้อเสนอแนะเพิ่มเติม / บันทึกอื่นๆ</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="เช่น นักเรียนมีความประพฤติดี แต่ต้องการทุนการศึกษา..." />
          </div>
        </div>

        {/* รูปภาพ */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Camera className="text-emerald-500"/> รูปถ่ายสภาพบ้าน</h3>
          
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-emerald-200 border-dashed rounded-2xl cursor-pointer bg-emerald-50/30 hover:bg-emerald-50 transition-colors overflow-hidden relative">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Camera className="w-10 h-10 mb-3 text-emerald-400" />
                <p className="mb-2 text-sm text-gray-500 font-semibold"><span className="text-emerald-600">กดเพื่อถ่ายรูป</span> หรืออัปโหลดไฟล์</p>
                <p className="text-xs text-gray-400">ระบบจะทำการย่อรูปให้อัตโนมัติ (ไม่เกิน 1MB)</p>
              </div>
            )}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-emerald-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg hover:bg-emerald-700 hover:shadow-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {isLoading ? 'กำลังบันทึกข้อมูล และอัปโหลดรูป...' : existingData ? 'บันทึกการแก้ไขข้อมูล' : 'บันทึกข้อมูลการเยี่ยมบ้าน'}
        </button>

      </form>

      {/* Print View Component (Hidden by default, shown only when printing) */}
      {existingData && (
        <ReportPrintView 
          visit={existingData.visit} 
          student={student} 
          assessment={existingData.assessment} 
          photos={existingData.photos || []} 
        />
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
              className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all"
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
            <p className="text-amber-600 text-sm bg-amber-50 rounded-lg p-3 mb-8">
              *หากมีหน้าต่างเด้งขึ้นมาถาม กรุณากด "อนุญาต" (Allow) การเข้าถึงตำแหน่งที่ตั้งด้วยนะครับ
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowGpsConfirmModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={executeGetLocation}
                className="flex-1 bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-indigo-700 transition-colors"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GPS Error Modal */}
      {gpsErrorModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500 w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-gray-500 mb-8">{gpsErrorModal.message}</p>
            <button 
              onClick={() => setGpsErrorModal({ show: false, message: '' })}
              className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* Save Error Modal */}
      {saveErrorModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500 w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">บันทึกไม่สำเร็จ</h3>
            <p className="text-gray-500 mb-8">{saveErrorModal.message}</p>
            <button 
              onClick={() => setSaveErrorModal({ show: false, message: '' })}
              className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-red-700 transition-colors"
            >
              รับทราบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
