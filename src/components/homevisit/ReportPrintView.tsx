import React from 'react';
import type { HomeVisit, HomeVisitAssessment, HomeVisitPhoto } from '../../services/homevisit/visitService';
import VisitMap from './VisitMap';

interface ReportPrintViewProps {
  visit: HomeVisit;
  student: any;
  assessment: HomeVisitAssessment | null;
  photos: HomeVisitPhoto[];
  liveFormData?: any;
  liveSignatures?: {
    student?: string;
    parent?: string;
    teacher?: string;
    map?: string;
    exterior?: string;
    interior?: string;
  };
  isPreviewMode?: boolean;
  teacherName?: string;
}

export default function ReportPrintView({ visit, student, assessment, photos, liveFormData, liveSignatures, isPreviewMode, teacherName }: ReportPrintViewProps) {
  if (!visit || !student) return null;

  const fd = liveFormData || assessment?.form_data || {};

  const formatDate = (dateString: string) => {
    if (!dateString) return '.............................';
    const d = new Date(dateString);
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  };

  const getPhoto = (desc: string) => photos.find(p => p.description === desc)?.photo_url;
  const photoStudent = liveSignatures?.student || getPhoto('รูปถ่ายนักเรียน');
  const signatureParent = liveSignatures?.parent || getPhoto('ลายเซ็นผู้ให้ข้อมูล');
  const signatureTeacher = liveSignatures?.teacher || getPhoto('ลายเซ็นครูที่ปรึกษา');
  const photoExterior = liveSignatures?.exterior || getPhoto('ภาพถ่ายสภาพบ้านภายนอก');
  const photoInterior = liveSignatures?.interior || getPhoto('ภาพถ่ายภายในบ้าน');
  const mapPhoto = liveSignatures?.map || getPhoto('แผนที่การเดินทาง');

  const wrapperClass = isPreviewMode
    ? "w-full font-sarabun text-black overflow-y-auto max-h-[85vh] bg-slate-200 p-4 sm:p-8 rounded-2xl flex flex-col gap-6 items-center shadow-inner"
    : "print:block hidden font-sarabun bg-white text-black w-full min-h-screen absolute top-0 left-0 z-[9999]";

  return (
    <div className={wrapperClass}>
      <style type="text/css" media="print, screen">
        {`
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap');
          .sarabun { font-family: 'Sarabun', 'TH Sarabun New', sans-serif; color: black; }
          
          /* Page size layout */
          .page { 
            width: 210mm; 
            min-height: 297mm; 
            background: #fff; 
            margin: 10px auto; 
            padding: 12mm 20mm 12mm 20mm; 
            box-sizing: border-box; 
            page-break-after: always; 
            position: relative;
            box-shadow: ${isPreviewMode ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : 'none'};
            border: ${isPreviewMode ? '1px solid #e2e8f0' : 'none'};
            font-size: 13.5px;
            line-height: 1.35;
          }
          
          @media print {
            body { background: white !important; margin: 0 !important; }
            .page { 
              margin: 0 !important; 
              border: none !important; 
              box-shadow: none !important; 
              page-break-after: always !important; 
              width: 210mm !important;
              height: 297mm !important;
              padding: 12mm 20mm 12mm 20mm !important;
            }
          }

          .header { text-align: center; position: relative; }
          .header h1 { margin: 0; font-size: 21px; font-weight: bold; }
          .header h2 { margin: 3px 0 8px 0; font-size: 16px; font-weight: normal; }
          
          .doc-code { position: absolute; right: 20mm; top: 12mm; width: 28mm; height: 14mm; border: 1px solid #000; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 15px; }
          .photo-box { position: absolute; right: 20mm; top: 30mm; width: 26mm; height: 32mm; border: 1px solid #000; display: flex; justify-content: center; align-items: center; text-align: center; font-size: 11px; overflow: hidden; }
          
          .line { display: flex; align-items: flex-end; margin-bottom: 4px; }
          .dotted { flex: 1; border-bottom: 1px dotted #000; min-height: 18px; margin: 0 4px; padding-left: 8px; font-weight: 500; font-size: 13.5px; color: #1e293b; }
          .short { width: 100px; flex: none; }
          .medium { width: 200px; flex: none; }
          
          .cb, .rb { display: inline-flex; justify-content: center; align-items: center; width: 14px; height: 14px; border: 1px solid #000; margin-right: 5px; font-size: 10px; font-weight: bold; font-family: sans-serif; shrink-0: 1; vertical-align: middle; line-height: 1; }
          .rb { border-radius: 50%; }
          
          table { width: 100%; border-collapse: collapse; margin: 6px 0; }
          table th, table td { border: 1px solid #000; padding: 3px 4px; text-align: center; font-size: 12.5px; height: 20px; }
          table td:first-child { text-align: left; font-weight: 500; }
          
          .section { margin-top: 8px; }
          .sub-section { padding-left: 4.5mm; }
          .section-title { font-weight: bold; font-size: 14.5px; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; pb: 2px; }
          .row { display: flex; flex-wrap: wrap; gap: 12px; margin: 4px 0; }
          .column-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 15px; }
          .column-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 12px; }
          
          .multiline { height: 20px; border-bottom: 1px dotted #000; margin-bottom: 6px; }
          .footer-sign { text-align: right; margin-top: 20px; line-height: 1.5; }
          .page-number { position: absolute; right: 15mm; top: 8mm; font-size: 11px; color: #64748b; }
          
          .photo-container { border: 1px solid #000; height: 260px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; background-color: #f8fafc; }
          .map-container { border: 1px solid #000; height: 480px; position: relative; overflow: hidden; }
        `}
      </style>

      {/* ===================== PAGE 1 ===================== */}
      <div className="page sarabun">
        <div className="page-number">หน้า 1/4</div>
        <div className="doc-code">ด.ล 01</div>
        <div className="photo-box">
          {photoStudent ? (
            <img src={photoStudent} alt="รูปถ่ายนักเรียน" className="w-full h-full object-cover" />
          ) : (
            <span>รูปถ่าย<br />นักเรียน</span>
          )}
        </div>

        <div className="header" style={{ marginRight: '5mm' }}>
          <h1>บันทึกการเยี่ยมบ้าน</h1>
          <h2>โรงเรียนเชียงของวิทยาคม อำเภอเชียงของ จังหวัดเชียงราย</h2>
        </div>

        <div className="section" style={{ marginTop: '18px' }}>
          <b>คำชี้แจงการตอบแบบสอบถาม</b>
          <ul style={{ margin: '5px 0 15px', paddingLeft: '20px', fontSize: '13px', color: '#475569' }}>
            <li>หากเป็นตัวเลือก ○ หมายถึง ให้ตอบเพียงข้อเดียว</li>
            <li>หากเป็นตัวเลือก □ หมายถึง ให้ตอบได้มากกว่า 1 ข้อ</li>
          </ul>
        </div>

        <div className="section">
          <div className="section-title">1. ข้อมูลเบื้องต้นของนักเรียน</div>
          <div className="line">
            ชื่อ - นามสกุล <span className="dotted">{student?.prefix || ''}{student?.first_name || ''} {student?.last_name || ''}</span>
          </div>
          <div className="line">
            ชั้น ม. <span className="dotted short">{student?.classroom?.level?.replace('ม.', '') || ''}/{student?.classroom?.room || ''}</span>
            เลขที่ <span className="dotted short">{student?.student_number || student?.student_code || ''}</span>
            เลขประจำตัวประชาชน <span className="dotted">{student?.national_id || fd.national_id || ''}</span>
          </div>
        </div>

        <div className="section">
          <div className="section-title">2. ข้อมูลผู้ปกครองนักเรียน</div>
          <div className="line">
            ชื่อ - นามสกุล <span className="dotted">{fd.no_parent ? 'ไม่มีผู้ปกครอง' : (fd.parent_name || '......................................................')}</span>
            โทรศัพท์ <span className="dotted short">{fd.parent_phone || ''}</span>
          </div>
          <div className="line" style={{ flexWrap: 'wrap' }}>
            ความสัมพันธ์เป็น
            <span className="dotted">
              <span className="rb">{fd.parent_relation === 'บิดา' ? '✓' : ''}</span> บิดา &nbsp;
              <span className="rb">{fd.parent_relation === 'มารดา' ? '✓' : ''}</span> มารดา &nbsp;
              <span className="rb">{['ปู่', 'ย่า', 'ตา', 'ยาย'].includes(fd.parent_relation || '') ? '✓' : ''}</span> ปู่/ย่า/ตา/ยาย &nbsp;
              <span className="rb">{!['บิดา', 'มารดา', 'ปู่', 'ย่า', 'ตา', 'ยาย', ''].includes(fd.parent_relation || '') ? '✓' : ''}</span> อื่นๆ ({!['บิดา', 'มารดา', 'ปู่', 'ย่า', 'ตา', 'ยาย', ''].includes(fd.parent_relation || '') ? (fd.parent_relation === 'อื่นๆ' ? fd.parent_relation_other : fd.parent_relation) : ''})
            </span>
          </div>
          <div className="line">
            อาชีพผู้ปกครอง <span className="dotted">{fd.parent_occupation || '......................................................'}</span>
            วุฒิการศึกษา <span className="dotted short">{fd.parent_education || ''}</span>
          </div>
          <div className="line">
            เลขประจำตัวประชาชนผู้ปกครอง <span className="dotted">{fd.parent_national_id || '......................................................'}</span>
            บัตรสวัสดิการแห่งรัฐ <span className="dotted short">{fd.state_welfare || 'ไม่มี'}</span>
          </div>
        </div>

        <div className="section">
          <div className="section-title">3. ความสัมพันธ์ในครอบครัว</div>
          <div className="sub-section">
            <div className="line">
            3.1 สมาชิกในครอบครัวมีเวลาอยู่ร่วมกันเฉลี่ยวันละ <span className="dotted short" style={{ textAlign: 'center' }}>{fd.time_together_hours || '...'}</span> ชั่วโมง / วัน
          </div>

          <table>
            <thead>
              <tr>
                <th>สมาชิกในครอบครัว</th>
                <th>สนิทสนม</th>
                <th>เฉยๆ</th>
                <th>ห่างเหิน</th>
                <th>ขัดแย้ง</th>
                <th>ไม่มี</th>
              </tr>
            </thead>
            <tbody>
              {['บิดา', 'มารดา', 'พี่ชาย/น้องชาย', 'พี่สาว/น้องสาว', 'ปู่/ย่า/ตา/ยาย', 'ญาติ', 'อื่นๆ'].map(member => {
                const val = (fd.relation_with_members || {})[member] || '';
                return (
                  <tr key={member}>
                    <td>{member}</td>
                    <td>{val === 'สนิทสนม' ? '✔' : ''}</td>
                    <td>{val === 'เฉยๆ' || val === 'เฉย ๆ' ? '✔' : ''}</td>
                    <td>{val === 'ห่างเหิน' ? '✔' : ''}</td>
                    <td>{val === 'ขัดแย้ง' ? '✔' : ''}</td>
                    <td>{val === 'ไม่มี' || val === '' ? '✔' : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        <div className="section sub-section" style={{ marginTop: '12px' }}>
          <b>3.3 กรณีผู้ปกครองไม่อยู่บ้านฝากนักเรียนอาศัยอยู่กับใคร (ตอบเพียง 1 ข้อ)</b>
          <div className="row" style={{ marginTop: '4px' }}>
            <div><span className="rb">{fd.left_with === 'ญาติ' ? '✓' : ''}</span> ญาติ</div>
            <div><span className="rb">{fd.left_with === 'เพื่อนบ้าน' ? '✓' : ''}</span> เพื่อนบ้าน</div>
            <div><span className="rb">{fd.left_with === 'นักเรียนอยู่บ้านด้วยตนเอง' || fd.left_with === 'นักเรียนอาศัยอยู่คนเดียว' ? '✓' : ''}</span> นักเรียนอยู่บ้านด้วยตนเอง</div>
            <div><span className="rb">{!['ญาติ', 'เพื่อนบ้าน', 'นักเรียนอยู่บ้านด้วยตนเอง', 'นักเรียนอาศัยอยู่คนเดียว', ''].includes(fd.left_with || '') && fd.left_with ? '✓' : ''}</span> อื่นๆ ({!['ญาติ', 'เพื่อนบ้าน', 'นักเรียนอยู่บ้านด้วยตนเอง', 'นักเรียนอาศัยอยู่คนเดียว', ''].includes(fd.left_with || '') ? (fd.left_with === 'อื่นๆ' ? fd.left_with_other : fd.left_with) : ''})</div>
          </div>
        </div>

        <div className="section sub-section" style={{ marginTop: '12px' }}>
          <div className="line">
            <b>3.4 รายได้ครัวเรือนเฉลี่ยต่อคน(รวมรายได้ครัวเรือน หารด้วยจำนวนสมาชิกทั้งหมด)</b>
            <span className="dotted">{fd.household_income_per_person || '......................................................'}</span> บาท / เดือน
          </div>
          <div className="line" style={{ marginTop: '8px' }}>
            <b>3.5 นักเรียนได้รับค่าใช้จ่ายจาก</b>
            <span className="dotted">{fd.expense_from || '......................................................'}</span>
          </div>
        </div>

        <div className="section sub-section" style={{ marginTop: '12px' }}>
          <b>3.6 สิ่งที่ผู้ปกครองต้องการให้โรงเรียนช่วยเหลือนักเรียน (เลือกได้มากกว่า 1 ข้อ)</b>
          <div className="row" style={{ marginTop: '4px' }}>
            <div><span className="cb">{fd.school_help_needs?.includes('ด้านการเรียน') ? '✓' : ''}</span> ด้านการเรียน</div>
            <div><span className="cb">{fd.school_help_needs?.includes('ด้านพฤติกรรม') ? '✓' : ''}</span> ด้านพฤติกรรม</div>
            <div><span className="cb">{fd.school_help_needs?.includes('ด้านเศรษฐกิจ (ทุนการศึกษา)') ? '✓' : ''}</span> ด้านเศรษฐกิจ (ทุนการศึกษา)</div>
            <div><span className="cb">{fd.school_help_needs?.includes('อื่นๆ') ? '✓' : ''}</span> อื่นๆ</div>
          </div>
        </div>

        <div className="section sub-section" style={{ marginTop: '12px' }}>
          <b>3.7 ความช่วยเหลือที่เคยได้รับจากหน่วยงานหรือต้องการได้รับการช่วยเหลือ (เลือกได้มากกว่า 1 ข้อ)</b>
          <div className="row" style={{ marginTop: '4px' }}>
            <div><span className="cb">{fd.help_received?.includes('เบี้ยผู้สูงอายุ') ? '✓' : ''}</span> เบี้ยผู้สูงอายุ</div>
            <div><span className="cb">{fd.help_received?.includes('เบี้ยพิการ') ? '✓' : ''}</span> เบี้ยพิการ</div>
            <div><span className="cb">{fd.help_received?.includes('อื่นๆ') ? '✓' : ''}</span> อื่นๆ</div>
          </div>
        </div>

        <div className="section sub-section">
          <b>3.8 ข้อห่วงใยของผู้ปกครองที่มีต่อนักเรียน</b>
          <div style={{ marginTop: '5px' }}>
            <div className="multiline" style={{ paddingLeft: '8px', color: '#1e293b' }}>{fd.parent_concerns?.substring(0, 100) || ''}</div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">4. พฤติกรรมและความเสี่ยง</div>
          <div className="sub-section">
            <b>4.1 ด้านสุขภาพ</b>
            <div className="row">
              <div><span className="cb">{fd.health_issues?.includes('ร่างกายไม่แข็งแรง') ? '✓' : ''}</span> ร่างกายไม่แข็งแรง</div>
              <div><span className="cb">{fd.health_issues?.includes('มีโรคประจำตัว') || fd.health_issues?.includes('มีโรคประจำตัวหรือเจ็บป่วยบ่อย') ? '✓' : ''}</span> มีโรคประจำตัว</div>
              <div><span className="cb">{fd.health_issues?.includes('มีภาวะทุพโภชนาการ') ? '✓' : ''}</span> มีภาวะทุพโภชนาการ</div>
            </div>
          </div>
        </div>

        <div className="section sub-section" style={{ marginTop: '8px' }}>
          <b>4.2 สวัสดิการหรือความปลอดภัย</b>
          <div className="column-2" style={{ marginTop: '4px', fontSize: '12.5px' }}>
            <div><span className="cb">{fd.welfare_safety?.includes('พ่อแม่แยกทางกัน หรือแต่งงานใหม่') ? '✓' : ''}</span> พ่อแม่แยกทาง/แต่งงานใหม่</div>
            <div><span className="cb">{fd.welfare_safety?.includes('ที่พักอาศัยอยู่ในชุมชนแออัดใกล้แหล่งมั่วสุม/สถานเริงรมย์') ? '✓' : ''}</span> พักใกล้แหล่งมั่วสุม/สถานเริงรมย์</div>
            <div><span className="cb">{fd.welfare_safety?.includes('มีบุคลในครอบครัวเจ็บป่วยด้วยโรคร้ายแรง/เรื้อรัง/ติดต่อ') ? '✓' : ''}</span> มีคนในครอบครัวป่วยร้ายแรง</div>
            <div><span className="cb">{fd.welfare_safety?.includes('บุคคลในครอบครัวติดสารเสพติด') ? '✓' : ''}</span> คนในครอบครัวติดยาเสพติด</div>
            <div><span className="cb">{fd.welfare_safety?.includes('บุคคลในครอบครัวเล่นการพนัน') || fd.welfare_safety?.includes('เล่นการพนัน') ? '✓' : ''}</span> คนในครอบครัวเล่นการพนัน</div>
            <div><span className="cb">{fd.welfare_safety?.includes('มีความขันแย้ง/ทะเลาะกันในครอบครัว') || fd.welfare_safety?.includes('มีความขัดแย้ง/ทะเลาะกันในครอบครัว') ? '✓' : ''}</span> ทะเลาะกันในครอบครัว</div>
            <div><span className="cb">{fd.welfare_safety?.includes('ไม่มีผู้ดูแล') ? '✓' : ''}</span> ไม่มีผู้ดูแล</div>
            <div><span className="cb">{fd.welfare_safety?.includes('มีความขัดแย้งและมีการใช้ความรุนแรงในครอบครัว') ? '✓' : ''}</span> ใช้ความรุนแรงในครอบครัว</div>
            <div><span className="cb">{fd.welfare_safety?.includes('ถูกทารุณ/ทำร้ายจากบุคคลในครอบครัว/เพื่อนบ้าน') ? '✓' : ''}</span> ถูกทารุณ/ทำร้ายจากครอบครัว</div>
            <div><span className="cb">{fd.welfare_safety?.includes('ถูกล่วงละเมิดทางเพศ') ? '✓' : ''}</span> ถูกล่วงละเมิดทางเพศ</div>
          </div>
        </div>
      </div>

      {/* ===================== PAGE 2 ===================== */}
      <div className="page sarabun">
        <div className="page-number">หน้า 2/4</div>
        <div className="header">
          <h1>บันทึกการเยี่ยมบ้าน</h1>
          <hr style={{ margin: '8px 0 15px' }} />
        </div>

        <div className="section sub-section">
          <b>4.3 ระยะทางระหว่างบ้านไปโรงเรียนและการเดินทาง</b>
          <div className="line" style={{ marginTop: '5px' }}>
            ระยะทางประมาณ <span className="dotted short" style={{ textAlign: 'center' }}>{fd.commute_distance_km || ''}</span> กิโลเมตร
            ใช้เวลาเดินทางประมาณ <span className="dotted short" style={{ textAlign: 'center' }}>{fd.commute_time || ''}</span>
          </div>
          <div className="column-3" style={{ marginTop: '8px' }}>
            <div><span className="rb">{fd.commute_method === 'ผู้ปกครองมาส่ง' ? '✓' : ''}</span> ผู้ปกครองมาส่ง</div>
            <div><span className="rb">{fd.commute_method === 'รถโดยสารประจำทาง' ? '✓' : ''}</span> รถโดยสารประจำทาง</div>
            <div><span className="rb">{fd.commute_method === 'รถจักรยานยนต์' ? '✓' : ''}</span> รถจักรยานยนต์</div>
            <div><span className="rb">{fd.commute_method === 'รถยนต์ส่วนตัว' || fd.commute_method === 'รถยนต์' ? '✓' : ''}</span> รถยนต์ส่วนตัว</div>
            <div><span className="rb">{fd.commute_method === 'รถจักรยาน' || fd.commute_method === 'จักรยาน' ? '✓' : ''}</span> รถจักรยาน</div>
            <div><span className="rb">{fd.commute_method === 'รถโรงเรียน' ? '✓' : ''}</span> รถโรงเรียน</div>
            <div><span className="rb">{fd.commute_method === 'เดินเท้า' || fd.commute_method === 'เดิน' ? '✓' : ''}</span> เดินเท้า</div>
            <div><span className="rb">{fd.commute_method === 'อื่นๆ' ? '✓' : ''}</span> อื่นๆ ({fd.commute_method === 'อื่นๆ' ? fd.commute_method_other : ''})</div>
          </div>
        </div>

        <div className="section sub-section">
          <b>4.4 สภาพที่อยู่อาศัย</b>
          <div className="column-2" style={{ marginTop: '5px' }}>
            <div><span className="cb">{fd.housing_condition?.includes('สภาพบ้านทรุดโทรมหรือทำจากวัสดุพื้นบ้าน') || fd.housing_condition?.includes('สภาพบ้านชำรุดทรุดโทรม') ? '✓' : ''}</span> สภาพบ้านทรุดโทรมชำรุด</div>
            <div><span className="cb">{fd.housing_condition?.includes('ไม่มีห้องส้วมในที่อยู่อาศัยและบริเวณ') || fd.housing_condition?.includes('ไม่มีห้องส่วนตัว') ? '✓' : ''}</span> ไม่มีห้องส้วม/ห้องส่วนตัว</div>
          </div>
        </div>

        <div className="section sub-section">
          <b>4.5 ภาระงานความรับผิดชอบของนักเรียน</b>
          <div className="column-2" style={{ marginTop: '5px' }}>
            <div><span className="cb">{fd.responsibilities?.includes('ช่วยงานบ้าน') ? '✓' : ''}</span> ช่วยงานบ้าน</div>
            <div><span className="cb">{fd.responsibilities?.includes('ช่วยดูแลคนป่วย/พิการ') || fd.responsibilities?.includes('ช่วยดูแลคนเจ็บป่วย') ? '✓' : ''}</span> ช่วยดูแลคนเจ็บป่วย/พิการ</div>
            <div><span className="cb">{fd.responsibilities?.includes('ช่วยค้าขายเล็กๆน้อยๆ') || fd.responsibilities?.includes('ช่วยค้าขาย') ? '✓' : ''}</span> ช่วยค้าขายเล็กน้อย</div>
            <div><span className="cb">{fd.responsibilities?.includes('ทำงานนอกบ้าน') || fd.responsibilities?.includes('ทำงานแถวบ้าน') ? '✓' : ''}</span> ทำงานนอกบ้าน/รับจ้าง</div>
            <div><span className="cb">{fd.responsibilities?.includes('ช่วยงานในนา/ไร่') || fd.responsibilities?.includes('ช่วยงานในนาไร่') ? '✓' : ''}</span> ช่วยงานในนา/ไร่</div>
            <div><span className="cb">{fd.responsibilities?.includes('อื่นๆ') ? '✓' : ''}</span> อื่นๆ ({fd.responsibilities_other || ''})</div>
          </div>
        </div>

        <div className="section sub-section">
          <b>4.6 กิจกรรมยามว่างหรืองานอดิเรก</b>
          <div className="column-3" style={{ marginTop: '5px' }}>
            <div><span className="cb">{fd.hobbies?.includes('ดูทีวี/ฟังเพลง') || fd.hobbies?.includes('ดูทีวี / ฟังเพลง') ? '✓' : ''}</span> ดูทีวี/ฟังเพลง</div>
            <div><span className="cb">{fd.hobbies?.includes('ไปห้าง/ดูหนัง') || fd.hobbies?.includes('ไปเที่ยวห้าง') ? '✓' : ''}</span> ไปเที่ยวห้าง/ดูหนัง</div>
            <div><span className="cb">{fd.hobbies?.includes('อ่านหนังสือ') ? '✓' : ''}</span> อ่านหนังสือ</div>
            <div><span className="cb">{fd.hobbies?.includes('ไปหาเพื่อน') ? '✓' : ''}</span> ไปหาเพื่อน</div>
            <div><span className="cb">{fd.hobbies?.includes('เล่นกีฬา') ? '✓' : ''}</span> เล่นกีฬา</div>
            <div><span className="cb">{fd.hobbies?.includes('เล่นคอม/มือถือ') || fd.hobbies?.includes('เล่นเกม') ? '✓' : ''}</span> เล่นคอม/เล่นเกม</div>
            <div><span className="cb">{fd.hobbies?.includes('ไปสวนสาธารณะ') ? '✓' : ''}</span> ไปสวนสาธารณะ</div>
            <div><span className="cb">{fd.hobbies?.includes('ไปร้านสนุกเกอร์') ? '✓' : ''}</span> ไปร้านสนุกเกอร์</div>
          </div>
        </div>

        <div className="section sub-section">
          <b>4.7 พฤติกรรมการใช้สารเสพติด</b>
          <div className="column-2" style={{ marginTop: '5px' }}>
            <div><span className="cb">{fd.substance_abuse?.includes('คบเพื่อนกลุ่มใช้สารเสพติด') || fd.substance_abuse?.includes('คบเพื่อนใช้สารเสพติด') ? '✓' : ''}</span> คบเพื่อนกลุ่มใช้สารเสพติด</div>
            <div><span className="cb">{fd.substance_abuse?.includes('สมาชิกในครอบครัวเกี่ยวข้องกับยาเสพติด') || fd.substance_abuse?.includes('สมาชิกครอบครัวใช้สารเสพติด') ? '✓' : ''}</span> สมาชิกครอบครัวใช้สารเสพติด</div>
            <div><span className="cb">{fd.substance_abuse?.includes('เป็นผู้ติดบุหรี่/สุรา/สารเสพติดอื่นๆ') || fd.substance_abuse?.includes('เป็นผู้ติดบุหรี่') ? '✓' : ''}</span> เป็นผู้ติดบุหรี่/สุรา/สารเสพติด</div>
            <div><span className="cb">{fd.substance_abuse?.includes('อยู่ในสภาพแวดล้อมที่ใช้สารเสพติด') || fd.substance_abuse?.includes('อยู่ในสภาพแวดล้อมเสี่ยง') ? '✓' : ''}</span> อยู่ในสภาพแวดล้อมที่ใช้สารเสพติด</div>
            <div><span className="cb">{fd.substance_abuse?.includes('ปัจจุบันเกี่ยวข้องกับสารเสพติด') || fd.substance_abuse?.includes('ปัจจุบันเกี่ยวข้องยาเสพติด') ? '✓' : ''}</span> ปัจจุบันเกี่ยวข้องกับสารเสพติด</div>
          </div>
        </div>

        <div className="section sub-section">
          <b>4.8 พฤติกรรมการใช้ความรุนแรง</b>
          <div className="column-3" style={{ marginTop: '5px' }}>
            <div><span className="cb">{fd.violence?.includes('มีการทะเลาะวิวาท') ? '✓' : ''}</span> ทะเลาะวิวาท</div>
            <div><span className="cb">{fd.violence?.includes('ก้าวร้าว เกเร') || fd.violence?.includes('ก้าวร้าว') ? '✓' : ''}</span> ก้าวร้าวเกเร</div>
            <div><span className="cb">{fd.violence?.includes('ทะเลาะวิวาทเป็นประจำ') || fd.violence?.includes('ทะเลาะวิวาทประจำ') ? '✓' : ''}</span> ทะเลาะวิวาทประจำ</div>
            <div><span className="cb">{fd.violence?.includes('ทำร้ายร่างกายผู้อื่น') ? '✓' : ''}</span> ทำร้ายร่างกายผู้อื่น</div>
            <div><span className="cb">{fd.violence?.includes('ทำร้ายร่างกายตนเอง') || fd.violence?.includes('ทำร้ายตนเอง') ? '✓' : ''}</span> ทำร้ายร่างกายตนเอง</div>
          </div>
        </div>

        <div className="section sub-section">
          <b>4.9 พฤติกรรมทางเพศ</b>
          <div className="column-3" style={{ marginTop: '5px' }}>
            <div><span className="cb">{fd.sexual_behavior?.includes('อยู่ในกลุ่มขายบริการ') ? '✓' : ''}</span> กลุ่มขายบริการ</div>
            <div><span className="cb">{fd.sexual_behavior?.includes('ใช้เครื่องมือสื่อสารที่เกี่ยวข้องกับด้านเพศเป็นเวลานานและบ่อยครั้ง') || fd.sexual_behavior?.includes('ใช้สื่อทางเพศบ่อย') ? '✓' : ''}</span> ใช้สื่อทางเพศบ่อย</div>
            <div><span className="cb">{fd.sexual_behavior?.includes('ตั้งครรภ์') ? '✓' : ''}</span> ตั้งครรภ์</div>
            <div><span className="cb">{fd.sexual_behavior?.includes('ขายบริการทางเพศ') ? '✓' : ''}</span> ขายบริการทางเพศ</div>
            <div><span className="cb">{fd.sexual_behavior?.includes('หมกมุ่นในเครื่องมือสื่อสารเรื่องที่เกี่ยวข้องทางเพศ') || fd.sexual_behavior?.includes('หมกมุ่นเรื่องเพศ') ? '✓' : ''}</span> หมกมุ่นเรื่องทางเพศ</div>
            <div><span className="cb">{fd.sexual_behavior?.includes('มีการมั่วสุมทางเพศ') ? '✓' : ''}</span> มีการมั่วสุมทางเพศ</div>
          </div>
        </div>

        <div className="section sub-section">
          <b>4.10 การติดเกมส์</b>
          <div className="column-3" style={{ marginTop: '5px' }}>
            <div><span className="cb">{fd.gaming_addiction?.includes('เล่นเกมเกินวันละ 1 ชั่วโมง') ? '✓' : ''}</span> เล่นเกมเกิน 1 ชม/วัน</div>
            <div><span className="cb">{fd.gaming_addiction?.includes('ขาดจินตนาการและความคิดสร้างสรรค์') || fd.gaming_addiction?.includes('ขาดจินตนาการ') ? '✓' : ''}</span> ขาดจินตนาการสร้างสรรค์</div>
            <div><span className="cb">{fd.gaming_addiction?.includes('เก็บตัว แยกจากกลุ่มเพื่อน') || fd.gaming_addiction?.includes('เก็บตัว') ? '✓' : ''}</span> เก็บตัวจากกลุ่มเพื่อน</div>
            <div><span className="cb">{fd.gaming_addiction?.includes('ใช้จ่ายเงินผิดปกติ') ? '✓' : ''}</span> ใช้จ่ายเงินผิดปกติ</div>
            <div><span className="cb">{fd.gaming_addiction?.includes('อยู่ในกลุ่มเพื่อนเล่นเกม') ? '✓' : ''}</span> อยู่กลุ่มเพื่อนเล่นเกม</div>
            <div><span className="cb">{fd.gaming_addiction?.includes('ร้านเกมใกล้บ้านหรือโรงเรียน') || fd.gaming_addiction?.includes('ร้านเกมใกล้บ้าน') ? '✓' : ''}</span> ร้านเกมใกล้บ้าน</div>
          </div>
        </div>

        <div className="section sub-section">
          <b>4.11 การเข้าถึงสื่อคอมพิวเตอร์และอินเทอร์เน็ตที่บ้าน</b>
          <div className="row" style={{ marginTop: '5px' }}>
            <div><span className="cb">{fd.internet_access === 'สามารถเข้า Internet ได้จากที่บ้าน' || fd.internet_access === 'สามารถเข้าถึง Internet ได้จากที่บ้าน' || fd.internet_access === 'สามารถเข้าถึงได้' ? '✓' : ''}</span> สามารถเข้า Internet ได้จากที่บ้าน</div>
            <div><span className="cb">{fd.internet_access === 'ไม่สามารถเข้า Internet ได้จากที่บ้าน' || fd.internet_access === 'ไม่สามารถเข้าถึง Internet ได้จากที่บ้าน' || fd.internet_access === 'ไม่สามารถเข้าถึงได้' ? '✓' : ''}</span> ไม่สามารถเข้า Internet ได้จากที่บ้าน</div>
          </div>
        </div>

        <div className="section sub-section">
          <b>4.12 การใช้เครื่องมือสื่อสารอิเล็กทรอนิกส์</b>
          <div className="column-2" style={{ marginTop: '5px' }}>
            <div><span className="cb">{fd.device_usage?.includes('เคยใช้โทรศัพท์ในระหว่างเรียน') || fd.device_usage?.includes('เคยใช้โทรศัพท์มือถือระหว่างเรียน') ? '✓' : ''}</span> เคยใช้โทรศัพท์ในระหว่างเรียน</div>
            <div><span className="cb">{fd.device_usage?.includes('ใช้ Line/Facebook/Chat (เกินวันละ 1 ชั่วโมง)') || fd.device_usage?.includes('ใช้ Line / Facebook / Twitter เกินวันละ 1 ชั่วโมง') ? '✓' : ''}</span> ใช้ Social Media &gt; 1 ชม./วัน</div>
            <div><span className="cb">{fd.device_usage?.includes('ใช้โทรศัพท์มือถือในระหว่างเรียน 2 – 3 /วัน') || fd.device_usage?.includes('ใช้โทรศัพท์มือถือระหว่างเรียน 2-3 วัน') ? '✓' : ''}</span> ใช้โทรศัพท์ในระหว่างเรียน 2-3 ครั้ง/วัน</div>
            <div><span className="cb">{fd.device_usage?.includes('ใช้ Line/Facebook/Chat (เกินวันละ 2 ชั่วโมง)') || fd.device_usage?.includes('ใช้ Line / Facebook / Twitter เกินวันละ 2 ชั่วโมง') ? '✓' : ''}</span> ใช้ Social Media &gt; 2 ชม./วัน</div>
          </div>
        </div>

        <div className="section">
          <b>5. ความสัมพันธ์และผู้ให้ข้อมูลในการเยี่ยมบ้าน</b>
          <div className="line" style={{ marginTop: '5px' }}>
            ผู้ให้ข้อมูลหลักคือ
            <span className="dotted">
              {['บิดา', 'มารดา', 'พี่ชาย', 'พี่สาว', 'ปู่', 'ย่า', 'ตา', 'ยาย', 'ลุง', 'ป้า', 'น้า', 'อา'].map(m => (
                <React.Fragment key={m}>
                  <span className="rb">{fd.informant === m ? '✓' : ''}</span> {m} &nbsp;
                </React.Fragment>
              ))}
              <span className="rb">{!['บิดา', 'มารดา', 'พี่ชาย', 'พี่สาว', 'ปู่', 'ย่า', 'ตา', 'ยาย', 'ลุง', 'ป้า', 'น้า', 'อา', ''].includes(fd.informant || '') ? '✓' : ''}</span> อื่นๆ ({!['บิดา', 'มารดา', 'พี่ชาย', 'พี่สาว', 'ปู่', 'ย่า', 'ตา', 'ยาย', 'ลุง', 'ป้า', 'น้า', 'อา', ''].includes(fd.informant || '') ? (fd.informant === 'อื่นๆ' ? fd.informant_other : fd.informant) : ''})
            </span>
          </div>
        </div>

        <div className="footer-sign">
          ขอรับรองว่าข้อมูลการเยี่ยมบ้านทั้งหมดข้างต้นเป็นความจริงทุกประการ<br /><br />
          ลงชื่อผู้ปกครอง/ผู้แทนนักเรียน <div style={{ display: 'inline-block', width: '180px', borderBottom: '1px solid #000', margin: '0 8px', position: 'relative', height: '22px' }}>
            {signatureParent && <img src={signatureParent} alt="ลายเซ็นผู้ปกครอง" style={{ position: 'absolute', bottom: '-4px', height: '35px', left: '50%', transform: 'translateX(-50%)' }} />}
          </div><br />
          ( <span style={{ display: 'inline-block', minWidth: '160px', textAlign: 'center' }}>{fd.no_parent ? '......................................................' : (fd.parent_name || '......................................................')}</span> )<br />
          วันที่ <span style={{ display: 'inline-block', minWidth: '120px', textAlign: 'center' }}>{formatDate(visit.visit_date)}</span>
        </div>
      </div>

      {/* ===================== PAGE 3 ===================== */}
      <div className="page sarabun">
        <div className="page-number">หน้า 3/4</div>
        <div className="header">
          <h1>บันทึกการเยี่ยมบ้าน</h1>
          <h2>ภาพถ่ายบ้านนักเรียนที่ได้รับการเยี่ยมบ้าน</h2>
          <hr style={{ margin: '8px 0 15px' }} />
        </div>

        <p style={{ marginTop: '20px' }}>
          ชื่อ-นามสกุลนักเรียน <span className="line" style={{ display: 'inline-block', width: '380px', borderBottom: '1px dotted #000', paddingLeft: '8px', fontWeight: 'bold' }}>{student?.prefix || ''}{student?.first_name || ''} {student?.last_name || ''}</span>
        </p>
        <div className="row" style={{ margin: '15px 0' }}>
          <div><span className="cb">{fd.house_type?.includes('บ้านที่อาศัยอยู่กับพ่อแม่') ? '✓' : ''}</span> บ้านที่อาศัยอยู่กับพ่อแม่ (เป็นเจ้าของ/เช่า)</div>
          <div><span className="cb">{!fd.house_type?.includes('บ้านที่อาศัยอยู่กับพ่อแม่') && fd.house_type ? '✓' : ''}</span> บ้านของญาติ/ที่พักอื่นๆ ({fd.house_type === 'อื่นๆ' ? fd.house_type_other : fd.house_type})</div>
        </div>

        <div className="section" style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 6px 0', textAlign: 'left' }}>รูปที่ 1 ภาพถ่ายสภาพบ้านนักเรียน (ภายนอก)</h3>
          <div className="photo-container">
            {photoExterior ? (
              <img src={photoExterior} className="w-full h-full object-contain" alt="ภาพถ่ายสภาพบ้านภายนอก" />
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>[ รูปที่ 1 ยังไม่ได้อัปโหลดภาพถ่ายสภาพบ้านภายนอก ]</span>
            )}
          </div>
        </div>

        <div className="section" style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 6px 0', textAlign: 'left' }}>รูปที่ 2 ภาพถ่ายภายในบ้านนักเรียน (บริเวณที่อ่านหนังสือ/นอน)</h3>
          <div className="photo-container">
            {photoInterior ? (
              <img src={photoInterior} className="w-full h-full object-contain" alt="ภาพถ่ายภายในบ้าน" />
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>[ รูปที่ 2 ยังไม่ได้อัปโหลดภาพถ่ายภายในบ้าน ]</span>
            )}
          </div>
        </div>

        <div className="sign" style={{ position: 'relative', border: '1px solid #000', padding: '20px', marginTop: '25px', borderRadius: '4px', fontSize: '15px', lineHeight: '1.8' }}>
          ขอรับรองว่าข้อมูล และภาพถ่ายบ้านของนักเรียนเป็นความจริง<br /><br />
          <div style={{ maxWidth: '450px', marginLeft: 'auto', marginRight: '0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '8px' }}>
              ลงชื่อ <div style={{ flex: 1, borderBottom: '1px solid #000', margin: '0 8px', position: 'relative', height: '24px' }}>
                {signatureTeacher && <img src={signatureTeacher} alt="ลายเซ็นครูที่ปรึกษา" style={{ position: 'absolute', bottom: '-4px', height: '40px', left: '50%', transform: 'translateX(-50%)' }} />}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '8px' }}>
              ( <div style={{ flex: 1, borderBottom: '1px dotted #000', margin: '0 8px', textAlign: 'center', fontWeight: 'bold' }}>{teacherName || '............................................................'}</div> )
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '8px' }}>
              ตำแหน่ง <div style={{ flex: 1, borderBottom: '1px dotted #000', margin: '0 8px', textAlign: 'center' }}>ครูที่ปรึกษา</div> (ครูหรือผู้อำนวยการโรงเรียน)
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              วันที่ลงบันทึกการเยี่ยมบ้าน <div style={{ flex: 1, borderBottom: '1px dotted #000', margin: '0 8px', textAlign: 'center', fontWeight: 'bold' }}>{formatDate(visit.visit_date)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== PAGE 4 ===================== */}
      <div className="page sarabun" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="page-number">หน้า 4/4</div>
        <div className="header">
          <h1>แผนที่การเดินทางจากโรงเรียนไปบ้านนักเรียน</h1>
          <hr style={{ margin: '8px 0 15px' }} />
        </div>

        <div className="map-container" style={{ flex: 1, minHeight: '500px', marginTop: '10px' }}>
          {mapPhoto ? (
            <img src={mapPhoto} alt="แผนที่การเดินทาง" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : visit.latitude && visit.longitude ? (
            <div className="w-full h-full relative z-0">
              <VisitMap
                visits={[{
                  id: 'preview_print',
                  latitude: visit.latitude,
                  longitude: visit.longitude,
                  student: student,
                  visit_date: visit.visit_date,
                  status: visit.status,
                  teacher: visit.teacher
                }]}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
              [ ยังไม่มีข้อมูลรูปถ่ายแผนที่ปัจจุบันหรือพิกัดแผนที่บนระบบ ]
            </div>
          )}
        </div>

        <div className="section" style={{ marginTop: '20px' }}>
          <h3 style={{ textAlign: 'left', fontSize: '16px', fontWeight: 'bold', margin: '0 0 6px 0' }}>คำอธิบายเส้นทางและการเดินทาง</h3>
          <div style={{ minHeight: '110px', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', fontSize: '14px', backgroundColor: '#f8fafc', lineHeight: '1.6' }}>
            {fd.travel_description ? (
              <p style={{ margin: 0, color: '#1e293b' }}>{fd.travel_description}</p>
            ) : (
              <span style={{ color: '#94a3b8' }}>[ ไม่ได้ระบุคำอธิบายเส้นทางเพิ่มเติม ]</span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
