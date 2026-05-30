

import fs from 'fs';

const LOCAL_FILE = 'geoBoundaries-THA-ADM2.geojson';
const DEST_FINAL = 'exports/geojson/chiang_khong_district.geojson';

async function run() {
  console.log('⏳ กำลังตรวจสอบไฟล์แผนที่...');
  
  try {
    if (!fs.existsSync(LOCAL_FILE)) {
      console.log(`❌ ไม่พบไฟล์ "${LOCAL_FILE}" ในโฟลเดอร์ frontend`);
      console.log('กรุณาดาวน์โหลดไฟล์มาไว้ในโฟลเดอร์ frontend ก่อนครับ');
      return;
    }

    console.log('✅ พบไฟล์แล้ว กำลังคัดแยกเฉพาะ "อำเภอเชียงของ"...');
    
    const data = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
    
    const chiangKhong = data.features.find(f => 
      (f.properties.shapeName && f.properties.shapeName.toLowerCase().includes('chiang khong')) ||
      (f.properties.shapeName_th && f.properties.shapeName_th.includes('เชียงของ'))
    );
    
    if (chiangKhong) {
      fs.writeFileSync(DEST_FINAL, JSON.stringify({ type: 'FeatureCollection', features: [chiangKhong] }));
      console.log('🎉 เสร็จสมบูรณ์! บันทึกไฟล์ทับลงใน ' + DEST_FINAL + ' เรียบร้อยแล้ว');
      console.log('💡 คุณครูสามารถ Refresh หน้าเว็บเพื่อดูแผนที่ใหม่ได้เลยครับ (และสามารถลบไฟล์ geoBoundaries-THA-ADM2.geojson ทิ้งได้เลยเพื่อประหยัดพื้นที่)');
    } else {
      console.log('❌ ไม่พบข้อมูลอำเภอเชียงของในไฟล์นี้');
    }
  } catch (err) {
    console.error('เกิดข้อผิดพลาด:', err);
  }
}

run();
