import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { getHomeVisitsByTeacher } from '../../services/homevisit/visitService';
import { Home, CheckCircle, AlertTriangle, Map, Navigation, X, Camera } from 'lucide-react';
import VisitMap from '../../components/homevisit/VisitMap';
import { useState } from 'react';

export default function HomeVisitDashboard() {
  const { user, role } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['home_visits', user?.id, role],
    queryFn: () => getHomeVisitsByTeacher(user?.id || '', role),
    enabled: !!user?.id
  });

  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [routeTargetId, setRouteTargetId] = useState<string | null>(null);

  const completedVisits = visits.filter(v => v.status === 'COMPLETED').length;

  if (isLoading) return <div className="p-8">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-black mb-2">สรุปการเยี่ยมบ้าน</h1>
        <p className="text-emerald-100 text-lg">ติดตามสถานะและประวัติการลงพื้นที่ของคุณ</p>
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
          <div className="max-h-[600px] overflow-y-auto pr-2 rounded-2xl border border-gray-100 shadow-sm">
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
