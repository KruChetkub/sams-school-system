/**
 * SAMS Version 12 - เครื่องมือกู้คืนฐานข้อมูล (Data Restoration Script)
 * 
 * วิธีการใช้งาน:
 * 1. เปิด Terminal ในห้อง d:/sams-school-system-main/frontend/google-apps-script
 * 2. ลงทะเบียน Module จำเป็น (หากรันครั้งแรก): npm install @supabase/supabase-js dotenv
 * 3. คัดลอกไฟล์สำรองข้อมูล JSON (เช่น db_backup_20260531.json) มาวางในโฟลเดอร์นี้
 * 4. รันคำสั่งกู้คืน: node restore.js db_backup_20260531.json
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// โหลด Env จากโฟลเดอร์ frontend หลักเพื่อเชื่อมต่อ Supabase
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// ในการกู้คืน ข้อมูลจำเป็นต้องเขียนทับ RLS แนะนำให้กรอก SUPABASE_SERVICE_ROLE_KEY ในไฟล์ .env ของคุณ
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error("❌ ไม่พบตัวแปรแวดล้อม VITE_SUPABASE_URL ในไฟล์ .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const backupFileName = process.argv[2];
if (!backupFileName) {
  console.error("❌ กรุณาระบุไฟล์แบ็คอัพที่ต้องการกู้คืน เช่น: node restore.js db_backup_20260531.json");
  process.exit(1);
}

const backupPath = path.resolve(__dirname, backupFileName);
if (!fs.existsSync(backupPath)) {
  console.error(`❌ ไม่พบไฟล์สำรองข้อมูลที่: ${backupPath}`);
  process.exit(1);
}

async function runRestoration() {
  console.log(`================================================`);
  console.log(`🚀 เริ่มทำการกู้คืนระบบ SAMS ฐานข้อมูลจากไฟล์: ${backupFileName}`);
  console.log(`================================================`);
  
  try {
    const fileContent = fs.readFileSync(backupPath, 'utf8');
    const backupData = JSON.parse(fileContent);
    
    console.log(`📅 วันที่สำรองข้อมูล: ${backupData.backup_date}`);
    
    // เรียงลำดับจากพ่อแม่ไปหาตารางลูกเพื่อหลีกเลี่ยงปัญหา Foreign Key Constraints
    const tablesInOrder = [
      "users",
      "teachers",
      "subjects",
      "classrooms",
      "students",
      "parents",
      "schedules",
      "attendance_sessions",
      "attendance",
      "leave_requests",
      "notifications",
      "home_visits",
      "home_visit_assessments",
      "home_visit_photos"
    ];

    for (const tableName of tablesInOrder) {
      const rows = backupData.tables[tableName];
      if (!rows || rows.length === 0) {
        console.log(`⚠️ ข้ามตาราง ${tableName}: ไม่มีข้อมูลสำหรับกู้คืนในไฟล์สำรอง`);
        continue;
      }

      console.log(`⏳ กำลังนำเข้าข้อมูลตาราง: ${tableName} (จำนวน ${rows.length} รายการ)...`);
      
      // ใช้คำสั่ง upsert เพื่อเขียนทับกรณีที่มีข้อมูลอยู่แล้ว หรือแทรกใหม่หากยังไม่มี
      const { error } = await supabase
        .from(tableName)
        .upsert(rows);

      if (error) {
        throw new Error(`เกิดข้อผิดพลาดในการกู้คืนตาราง ${tableName}: ${error.message}`);
      }
      console.log(`✅ กู้คืนตาราง ${tableName} สำเร็จ`);
    }

    console.log(`\n================================================`);
    console.log(`🎉 สำเร็จ! กู้คืนฐานข้อมูลระบบ SAMS เป็นเวสชั่น 12 เรียบร้อยแล้ว`);
    console.log(`================================================`);

  } catch (err) {
    console.error(`\n❌ การกู้คืนข้อมูลล้มเหลวเนื่องจาก: ${err.message}`);
  }
}

runRestoration();
