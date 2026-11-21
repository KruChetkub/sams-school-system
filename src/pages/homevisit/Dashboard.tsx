import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useAcademicYearStore } from '../../store/academicYearStore';
import { getHomeVisitsByTeacher, cloneHomeVisitsFromSemester } from '../../services/homevisit/visitService';
import { Home, CheckCircle, AlertTriangle, Map, Navigation, X, Copy } from 'lucide-react';
import VisitMap from '../../components/homevisit/VisitMap';
import { useState } from 'react';

export default function HomeVisitDashboard() {
  const { user, role } = useAuthStore();
  const { selectedYear, selectedSemester, setSelectedSemester } = useAcademicYearStore();
  const queryClient = useQueryClient();
  const [isCloning, setIsCloning] = useState(false);

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['home_visits', user?.id, role, selectedYear?.id, selectedSemester?.id],
    queryFn: () => getHomeVisitsByTeacher(user?.id || '', role, selectedYear?.id, selectedSemester?.id),
    enabled: !!user?.id
  });

  const semester1 = selectedYear?.semesters?.find(s => String(s.semester_number) === '1');
  const isNotSem1 = selectedSemester && semester1 && selectedSemester.id !== semester1.id;

  const handleCloneFromSemester1 = async () => {
    if (!semester1 || !selectedSemester) return;
    const confirmed = window.confirm(
      `ต้องการดึงข้อมูลการเยี่ยมบ้านทั้งหมดจาก "${semester1.label || 'ภาคเรียนที่ 1'}" มายัง "${selectedSemester.label || 'ภาคเรียนที่ 2'}" ใช่หรือไม่?\n\n(ระบบจะคัดลอกทั้งข้อมูลแบบฟอร์ม รูปถ่าย แผนที่ และลายเซ็นของนักเรียนที่ยังไม่มีข้อมูลในภาคเรียนนี้ให้อัตโนมัติ)`
    );
    if (!confirmed) return;

    setIsCloning(true);
    try {
      const count = await cloneHomeVisitsFromSemester({
        sourceSemesterId: semester1.id,
        targetSemesterId: selectedSemester.id,
        academicYearId: selectedYear?.id,
      });
      queryClient.invalidateQueries({ queryKey: ['home_visits'] });
      window.alert(`ดึงข้อมูลการเยี่ยมบ้านจากภาคเรียนที่ 1 สำเร็จ (${count} คน)`);
    } catch (err: any) {
      window.alert('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + (err?.message || err));
    } finally {
      setIsCloning(false);
    }
  };

  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [routeTargetId, setRouteTargetId] = useState<string | null>(null);

  const completedVisits = visits.filter(v => v.status === 'COMPLETED').length;

  if (isLoading) return <div className="p-8">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-bold mb-2">
            <span>ปีการศึกษา {selectedYear?.year || '-'}</span>
            <span>•</span>
            <span>{selectedSemester?.label || (selectedSemester ? `ภาคเรียนที่ ${selectedSemester.semester_number}` : 'ทุกภาคเรียน')}</span>
          </div>
          <h1 className="text-3xl font-black mb-1">สรุปการเยี่ยมบ้าน</h1>
          <p className="text-emerald-100 text-sm md:text-base">ติดตามสถานะและประวัติการลงพื้นที่แยกตามภาคเรียน</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {selectedYear?.semesters && selectedYear.semesters.length > 1 && (
            <div className="inline-flex bg-black/20 p-1 rounded-xl">
              {selectedYear.semesters.map((sem) => (
                <button
                  key={sem.id}
                  type="button"
                  onClick={() => {
                    setSelectedSemester(sem.id);
                    queryClient.invalidateQueries();
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                    selectedSemester?.id === sem.id
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  {sem.label || `ภาคเรียนที่ ${sem.semester_number}`}
                </button>
              ))}
            </div>
          )}

          {isNotSem1 && (
            <button
              type="button"
              disabled={isCloning}
              onClick={handleCloneFromSemester1}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Copy size={16} />
              <span>{isCloning ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลเยี่ยมบ้านจากภาคเรียนที่ 1'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500">เยี่ยมแล้ว</p>
            <h3 className="text-3xl font-black text-gray-900">{completedVisits} <span className="text-base font-medium text-gray-400">คน</span></h3>
          </div>
        </div>

        {/* Risk calculation */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500">ความเสี่ยงสูง</p>
            <h3 className="text-3xl font-black text-gray-900">
              {visits.filter(v => {
                const risk = (v as any).home_visit_assessments?.[0]?.risk_level;
                return risk === 'URGENT' || risk === 'WATCH';
              }).length}
              <span className="text-base font-medium text-gray-400"> คน</span>
            </h3>
          </div>
        </div>
      </div>

      <div id="map-section" className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-8 relative z-0">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Map className="text-emerald-500" /> แผนที่พิกัดเยี่ยมบ้าน
        </h2>
        <VisitMap
          visits={visits}
          externalRouteTargetId={routeTargetId}
          onRouteTargetHandled={() => setRouteTargetId(null)}
          onDistanceUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['home_visits'] });
          }}
        />
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">ประวัติการเยี่ยม</h2>
        {visits.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Home className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            ยังไม่มีประวัติการเยี่ยมบ้าน
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block max-h-[600px] overflow-y-auto pr-2 rounded-2xl border border-gray-100 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="py-4 px-4 font-bold text-gray-600 text-sm border-b border-gray-100 w-16 text-center">ลำดับที่</th>
                    <th className="py-4 px-4 font-bold text-gray-600 text-sm border-b border-gray-100">คำนำหน้า ชื่อ สกุล</th>
                    <th className="py-4 px-4 font-bold text-gray-600 text-sm border-b border-gray-100">วันที่เยี่ยมบ้าน</th>
                    <th className="py-4 px-4 font-bold text-gray-600 text-sm border-b border-gray-100 text-center">ระยะทางถึงโรงเรียน</th>
                    <th className="py-4 px-4 font-bold text-gray-600 text-sm border-b border-gray-100 text-center">ดูรายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {visits.map((v, index) => {
                    const date = new Date(v.visit_date);
                    const thaiDate = `${date.getDate()} ${date.toLocaleDateString('th-TH', { month: 'long' })} ${date.getFullYear() + 543}`;
                    
                    return (
                      <tr 
                        key={v.id} 
                        onClick={() => setSelectedVisit(v)}
                        className="hover:bg-emerald-50 cursor-pointer transition-colors group"
                      >
                        <td className="py-4 px-4 text-center font-bold text-gray-500">{index + 1}</td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-gray-900 group-hover:text-emerald-900">
                            {v.student?.prefix}{v.student?.first_name} {v.student?.last_name}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{thaiDate}</td>
                        <td className="py-4 px-4 text-center">
                          {v.distance_to_school ? (
                            <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm">
                              {v.distance_to_school} กม.
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button className="text-xs font-bold px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors">
                            เปิดดู
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {visits.map((v, index) => {
                const date = new Date(v.visit_date);
                const thaiDate = `${date.getDate()} ${date.toLocaleDateString('th-TH', { month: 'long' })} ${date.getFullYear() + 543}`;
                
                return (
                  <div 
                    key={v.id}
                    onClick={() => setSelectedVisit(v)}
                    className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm hover:border-emerald-200 active:bg-emerald-50/30 transition-all cursor-pointer flex flex-col gap-3 relative"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-gray-400">ลำดับที่ {index + 1}</span>
                      {v.distance_to_school ? (
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full text-xs">
                          🛣️ {v.distance_to_school} กม.
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">ไม่มีระยะทาง</span>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-gray-900 text-base leading-tight">
                        {v.student?.prefix}{v.student?.first_name} {v.student?.last_name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        📅 วันที่เยี่ยม: {thaiDate}
                      </p>
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-1">
                      <span className="text-xs font-semibold text-gray-400">รายละเอียดเพิ่มเติม</span>
                      <button className="text-xs font-bold px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors">
                        เปิดดู
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Visit Details Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedVisit(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">รายละเอียดการเยี่ยมบ้าน</h3>

            <div className="space-y-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">นักเรียน</p>
                <p className="font-bold text-lg text-gray-900">{selectedVisit.student?.prefix}{selectedVisit.student?.first_name} {selectedVisit.student?.last_name}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">วันที่เยี่ยมบ้าน</p>
                <p className="font-bold text-gray-900">
                  {new Date(selectedVisit.visit_date).getDate()} {new Date(selectedVisit.visit_date).toLocaleDateString('th-TH', { month: 'long' })} {new Date(selectedVisit.visit_date).getFullYear() + 543}
                </p>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-sm text-emerald-600 mb-1 font-bold">ผลประเมินเบื้องต้น (ความเสี่ยง)</p>
                <p className="font-bold text-emerald-900 text-lg">
                  {selectedVisit.home_visit_assessments?.[0]?.risk_level === 'URGENT' ? '🔴 ช่วยเหลือเร่งด่วน' :
                    selectedVisit.home_visit_assessments?.[0]?.risk_level === 'WATCH' ? '🟠 กลุ่มเฝ้าระวัง' : '🟢 กลุ่มปกติ'}
                </p>
              </div>

              {selectedVisit.distance_to_school && (
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                  <p className="text-sm text-indigo-600 mb-1 font-bold">ระยะทางถึงโรงเรียน (บันทึกไว้)</p>
                  <p className="font-bold text-indigo-900 text-lg">
                    🛣️ {selectedVisit.distance_to_school} กิโลเมตร
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRouteTargetId(selectedVisit.id);
                  setSelectedVisit(null);
                  document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex-1 bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Navigation size={18} /> ดูเส้นทางไปโรงเรียน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
