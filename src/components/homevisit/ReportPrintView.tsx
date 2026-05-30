import React from 'react';
import type { HomeVisit, HomeVisitAssessment, HomeVisitPhoto } from '../../services/homevisit/visitService';

interface ReportPrintViewProps {
  visit: HomeVisit;
  student: any;
  assessment: HomeVisitAssessment | null;
  photos: HomeVisitPhoto[];
}

export default function ReportPrintView({ visit, student, assessment, photos }: ReportPrintViewProps) {
  if (!visit || !student) return null;

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  };

  const getRiskLabel = (level?: string) => {
    if (level === 'NORMAL') return 'กลุ่มปกติ';
    if (level === 'WATCH') return 'กลุ่มเฝ้าระวัง';
    if (level === 'URGENT') return 'กลุ่มช่วยเหลือเร่งด่วน';
    return '-';
  };

  return (
    <div className="print-only hidden font-sarabun bg-white text-black w-full min-h-screen absolute top-0 left-0 z-[9999] p-8">
      {/* Header */}
      <div className="flex flex-col items-center mb-8 text-center">
        {/* Placeholder for Garuda/School Logo */}
        <div className="w-20 h-20 border-2 border-dashed border-gray-400 flex items-center justify-center rounded-full mb-4">
          <span className="text-sm text-gray-400">ตราสัญลักษณ์</span>
        </div>
        <h1 className="text-2xl font-bold mb-1">แบบบันทึกการเยี่ยมบ้านนักเรียน</h1>
        <h2 className="text-xl">โรงเรียน.................................................................... ปีการศึกษา .....................</h2>
      </div>

      {/* Section 1: ข้อมูลนักเรียน */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-2 border-b border-black pb-1">ตอนที่ 1: ข้อมูลทั่วไป</h3>
        <div className="grid grid-cols-2 gap-4 text-base">
          <div><span className="font-bold">ชื่อ-สกุล:</span> {student.prefix}{student.first_name} {student.last_name}</div>
          <div><span className="font-bold">รหัสนักเรียน:</span> {student.student_code}</div>
          <div><span className="font-bold">ชั้นเรียน:</span> {student.classroom?.level}/{student.classroom?.room}</div>
          <div><span className="font-bold">วันที่เยี่ยมบ้าน:</span> {formatDate(visit.visit_date)}</div>
        </div>
      </div>

      {/* Section 2: ผลการเยี่ยมบ้าน */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-2 border-b border-black pb-1">ตอนที่ 2: ข้อมูลสภาพแวดล้อมครอบครัว</h3>
        <div className="space-y-3 text-base">
          <div>
            <span className="font-bold">สถานภาพครอบครัว:</span> {assessment?.family_status || '-'}
          </div>
          <div>
            <span className="font-bold">สภาพความเป็นอยู่และที่พักอาศัย:</span>
            <p className="mt-1 pl-4 whitespace-pre-wrap">{assessment?.living_condition || '-'}</p>
          </div>
        </div>
      </div>

      {/* Section 3: สรุปผลประเมิน */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-2 border-b border-black pb-1">ตอนที่ 3: สรุปผลการประเมิน</h3>
        <div className="space-y-3 text-base">
          <div>
            <span className="font-bold">ระดับความเสี่ยง:</span> {getRiskLabel(assessment?.risk_level)}
          </div>
          <div>
            <span className="font-bold">ข้อเสนอแนะเพิ่มเติม:</span>
            <p className="mt-1 pl-4 whitespace-pre-wrap">{assessment?.notes || '-'}</p>
          </div>
        </div>
      </div>

      {/* Section 4: ภาพถ่ายประกอบ */}
      {photos.length > 0 && (
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-4 border-b border-black pb-1">ตอนที่ 4: ภาพถ่ายสภาพบ้านนักเรียน</h3>
          <div className="grid grid-cols-2 gap-4">
            {photos.map((photo, idx) => (
              <div key={photo.id} className="text-center">
                <img src={photo.photo_url} alt={`บ้านนักเรียน ${idx + 1}`} className="w-full h-48 object-cover border border-gray-300 p-1 mb-2" />
                <p className="text-sm">{photo.description || `ภาพที่ ${idx + 1}`}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signatures */}
      <div className="mt-12 pt-8">
        <div className="grid grid-cols-3 gap-8 text-center text-base">
          <div>
            <div className="mb-8">ลงชื่อ.......................................................</div>
            <div>(.......................................................)</div>
            <div className="mt-1">ผู้ปกครองนักเรียน</div>
          </div>
          <div>
            <div className="mb-8">ลงชื่อ.......................................................</div>
            <div>(.......................................................)</div>
            <div className="mt-1">ครูที่ปรึกษา / ผู้เยี่ยมบ้าน</div>
          </div>
          <div>
            <div className="mb-8">ลงชื่อ.......................................................</div>
            <div>(.......................................................)</div>
            <div className="mt-1">ผู้อำนวยการโรงเรียน</div>
          </div>
        </div>
      </div>
    </div>
  );
}
