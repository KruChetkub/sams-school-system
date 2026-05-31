Development Plan: School Attendance Management System (SAMS) - Version 12
แผนการพัฒนาระบบบันทึก Log และระบบสำรองข้อมูลอัตโนมัติ (Deep Dive Implementation)
เอกสารฉบับนี้จัดทำขึ้นเพื่อเป็นพิมพ์เขียว (Blueprint) ในการพัฒนาโครงสร้างพื้นฐานด้านความปลอดภัยและความเสถียรของข้อมูลใน Version 12 โดยเน้นการบริหารจัดการทรัพยากรบน Supabase Free Plan ให้เกิดประสิทธิภาพสูงสุด และถูกต้องตามหลักกฎหมาย พ.ร.บ. คอมพิวเตอร์ฯ และ PDPA ของไทย

1. ระบบบันทึก Log และข้อมูลจราจรคอมพิวเตอร์ (Audit Log Module)
1.1 นโยบายการบันทึกข้อมูล (Logging Policy)
เนื่องจากระบบอยู่บน Supabase Free Plan ซึ่งมีพื้นที่จำกัดเพียง 500 MB เราจะไม่บันทึกการกระทำย่อยๆ เช่น การกดดูหน้าเว็บ (Read-only actions) แต่จะมุ่งเน้นบันทึกเฉพาะ "เหตุการณ์สำคัญที่มีผลต่อการเปลี่ยนแปลงข้อมูลและการเข้าถึงระบบ" (Data Mutation & Authentication) เพื่อประหยัดพื้นที่ฐานข้อมูล

1.2 โครงสร้างตารางฐานข้อมูล (audit_logs)
ตรวจสอบและสถาปนา Schema ใน Supabase ให้รองรับโครงสร้างดังต่อไปนี
create table public.audit_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete set null,
    user_email text,                  -- เก็บอีเมลสำรองเผื่อบัญชีผู้ใช้ถูกลบ
    action text not null,             -- 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'INSERT', 'UPDATE', 'DELETE'
    table_name text,                  -- ชื่อตารางที่เกิดการเปลี่ยนแปลง (เช่น 'attendance', 'home_visits')
    record_id text,                   -- ID ของแถวข้อมูลที่ถูกกระทำ
    old_values jsonb,                 -- ข้อมูลเดิมก่อนแก้ไข (สำหรับ UPDATE/DELETE) เพื่อใช้ทำ Data Rollback
    new_values jsonb,                 -- ข้อมูลใหม่หลังแก้ไข (สำหรับ INSERT/UPDATE)
    ip_address text,                  -- ไอพีแอดเดรสของผู้ใช้งาน
    user_agent text,                  -- ข้อมูล Browser/Device ของผู้ใช้
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- สร้าง Index เพื่อความรวดเร็วในการ Query และทำ Offloading รายวัน
create index idx_audit_logs_created_at on public.audit_logs (created_at);
1.3 ระบบดักจับเหตุการณ์ (Event Capturing Implementation)
ก) ฝั่ง Authentication (ดักจับที่ Frontend / App Level)
โค้ดที่ต้องเพิ่ม: ใน AuthContext.tsx หรือจุดที่จัดการสิทธิ์ ให้ดักจับผลลัพธ์จาก supabase.auth.onAuthStateChange

เงื่อนไข:

เมื่อ SIGNED_IN สำเร็จ -> ยิงฟังก์ชันบันทึก Log ค่า action: 'LOGIN_SUCCESS'

ดักจับเหตุการณ์กรอกรหัสผ่านผิดจากฟอร์ม Login -> ยิงฟังก์ชันบันทึก Log ค่า action: 'LOGIN_FAILED' พร้อมเก็บอีเมลที่พยายามเข้าใช้

ข) ฝั่ง Data Mutation (ดักจับด้วย Database Triggers - แนะนำที่สุด)
เพื่อไม่ให้เป็นภาระของ Frontend และป้องกันการแก้ไขข้อมูลผ่านช่องทางอื่น ให้เขียน PostgreSQL Function และ Trigger ดักจับที่หลังบ้านของ Supabase โดยตรง
-- 1. สร้างฟังก์ชันกลางสำหรับเขียน Log อัตโนมัติ
create or replace function public.process_audit_log()
returns trigger as $$
declare
    current_user_id uuid;
    current_user_email text;
begin
    -- ดึง ID และ Email ของผู้ใช้ปัจจุบันที่ล็อกอินผ่าน Supabase Auth API
    current_user_id := auth.uid();
    current_user_email := auth.email();

    if (TG_OP = 'INSERT') then
        insert into public.audit_logs (user_id, user_email, action, table_name, record_id, new_values)
        values (current_user_id, current_user_email, 'INSERT', TG_TABLE_NAME, cast(NEW.id as text), to_jsonb(NEW));
        return NEW;
    elsif (TG_OP = 'UPDATE') then
        insert into public.audit_logs (user_id, user_email, action, table_name, record_id, old_values, new_values)
        values (current_user_id, current_user_email, 'UPDATE', TG_TABLE_NAME, cast(NEW.id as text), to_jsonb(OLD), to_jsonb(NEW));
        return NEW;
    elsif (TG_OP = 'DELETE') then
        insert into public.audit_logs (user_id, user_email, action, table_name, record_id, old_values)
        values (current_user_id, current_user_email, 'DELETE', TG_TABLE_NAME, cast(OLD.id as text), to_jsonb(OLD));
        return OLD;
    end if;
    return null;
end;
$$ language plpgsql security definer;

-- 2. ผูก Trigger เข้ากับตารางสำคัญ (ทำทีละตาราง)
create trigger audit_attendance_trigger
after insert or update or delete on public.attendance
for each row execute function public.process_audit_log();

create trigger audit_home_visits_trigger
after insert or update or delete on public.home_visits
for each row execute function public.process_audit_log();
1.4 ระบบโยกย้าย Log รายวัน (Log Offloading Automation)
แก้ปัญหาความจุ 500 MB และข้อจำกัดการดู Log ย้อนหลัง โดยการดึงออกมาเก็บไว้ที่อื่นแบบอัตโนมัติ

สร้าง Google Apps Script (GAS) Web App:

เขียนฟังก์ชัน doPost(e) รับค่าพารามิเตอร์เพื่อรับคำสั่งย้ายข้อมูล

สคริปต์จะทำการคิวรีข้อมูลจากตาราง audit_logs ของ Supabase ที่เกิดขึ้นในรอบ 24 ชั่วโมงที่ผ่านมา

นำข้อมูลมาเขียนต่อท้าย (Append) ลงใน Google Sheets ที่ทำหน้าที่เป็น "ฐานข้อมูลพัก Log"

ตั้งเวลาส่งออกเป็นไฟล์สถิต (Log Archiving):

ตั้งเวลา (Time-driven Trigger) ใน GAS ให้ทำงานทุกวันเวลา 01:00 น.

กวาดข้อมูลจาก Google Sheets แปลงเป็นข้อความรูปแบบมาตรฐาน syslog หรือ JSON string

สร้างไฟล์ใหม่ใน Google Drive โฟลเดอร์ SAMS_Audit_Logs/ ตั้งชื่อไฟล์ตามวันที่ เช่น sams_log_2026_05_31.txt

เมื่อบันทึกไฟล์ลง Drive สำเร็จ ให้สั่งเคลียร์แถวข้อมูลในตาราง audit_logs บน Supabase (Truncate/Delete เฉพาะแถวเก่า) เพื่อคืนพื้นที่ 500 MB ให้ระบบพร้อมใช้งานในวันรุ่งขึ้น

2. ระบบสำรองข้อมูลระบบและฐานข้อมูลอัตโนมัติ (Daily System Backup)
2.1 ขอบเขตการสำรองข้อมูล (Backup Scope)
การสำรองข้อมูลจะถูกแบ่งออกเป็น 2 ส่วนหลัก เพื่อให้สามารถกู้คืนระบบ (Disaster Recovery) ได้ทันทีหากเกิดเหตุฉุกเฉิน:

Structured Data (ตารางในฐานข้อมูล): ข้อมูลนักเรียน, ครู, ตารางเรียน, ประวัติการเข้าแถว, และผลสรุปการเยี่ยมบ้าน

Unstructured Data (ไฟล์สื่อ/รูปภาพ): รูปภาพสภาพบ้านนักเรียนที่ครูอัปโหลดผ่านระบบเยี่ยมบ้าน และไฟล์เอกสารการลา

2.2 สถาปัตยกรรมการทำงาน (Automation Pipeline via GAS)
เราจะใช้ Google Apps Script เป็นตัวขับเคลื่อนหลัก (Orchestrator) เนื่องจากฟรี เสถียร และมีโควตารันเบื้องหลังได้นานถึง 6 นาทีต่อรอบ
[ Supabase Database ] ----(REST API / JSON)----> [ Google Apps Script ]
                                                          |
                                                    (Write Files)
                                                          v
                                              [ Google Drive Storage ]
                                             (โฟลเดอร์แยกตามวัน/เดือน)
                            2.3 ขั้นตอนการพัฒนาสคริปต์ Backup รายละเอียดทีละส่วน
ขั้นตอนที่ 1: เตรียมโครงสร้างโฟลเดอร์ปลายทางบน Google Drive
สร้างโครงสร้างโฟลเดอร์ใน Google Drive ของคุณ มนต์สปิน เพื่อแยกประเภทไฟล์ให้เป็นระเบียบ:

SAMS_Backup_Root/

01_Database_JSON/ (เก็บไฟล์สำรองตารางข้อมูล)

02_Storage_Assets/ (เก็บไฟล์รูปภาพและเอกสาร)

ขั้นตอนที่ 2: เขียนสคริปต์คิวรีข้อมูลตาราง (Database Dump Script)
ใช้สคริปต์ส่งคำขอแบบ UrlFetchApp.fetch ไปยัง Supabase REST API เพื่อดึงข้อมูลตารางหลักออกมาตรงๆ ในรูปแบบ JSON

ตารางที่ต้องดึงเรียงตามความสำคัญ: users -> teachers -> students -> classrooms -> student_classrooms -> attendance -> home_visits -> home_visit_assessments

รวบรวม JSON ของทุกตารางให้อยู่ในโครงสร้างแบบ Object ชุดเดียวกัน:
{
  "backup_date": "2026-05-31T00:00:00Z",
  "tables": {
    "students": [...],
    "attendance": [...],
    "home_visits": [...]
  }
}
สั่งให้สคริปต์บันทึกข้อความ JSON นี้ลงเป็นไฟล์ .json ในโฟลเดอร์ 01_Database_JSON/ ตั้งชื่อไฟล์ตามรูปแบบ: db_backup_yyyyMMdd.json

ขั้นตอนที่ 3: เขียนสคริปต์สำรองไฟล์รูปถ่าย (Storage Assets Sync Script)
เนื่องจากรูปถ่ายบ้านนักเรียนมีขนาดใหญ่และเพิ่มขึ้นเรื่อยๆ เราจะไม่ดาวน์โหลดรูปเก่าซ้ำทุกวัน แต่จะใช้หลักการ Incremental Backup (สำรองเฉพาะไฟล์ใหม่):

สคริปต์คิวรีตาราง home_visit_photos เพื่อหา URL ของรูปภาพที่มีฟิลด์ created_at ตรงกับวันที่ปัจจุบัน

วนลูป (Loop) ดาวน์โหลดรูปภาพผ่าน URL เหล่านั้นเข้ามาในสคริปต์ด้วย UrlFetchApp.fetch(url).getBlob()

เซฟไฟล์ภาพลงในโฟลเดอร์ 02_Storage_Assets/ โดยตั้งชื่อโฟลเดอร์ย่อยแยกตามเดือน เช่น Assets_2026_05/ เพื่อไม่ให้มีจำนวนไฟล์ในโฟลเดอร์เดียวหนาแน่นเกินไป

ขั้นตอนที่ 4: ตั้งระบบทำความสะอาดข้อมูลเก่า (Retention Management)
เพื่อป้องกันไม่ให้ Google Drive พื้นที่เต็มในระยะยาว (เนื้อที่ฟรี 15 GB):

เขียนฟังก์ชัน clearOldBackups() ตรวจสอบอายุของไฟล์สำรองในโฟลเดอร์ 01_Database_JSON/

หากไฟล์ใดมีอายุ เกินกว่า 30 วัน ให้สคริปต์สั่งลบไฟล์นั้นทิ้งโดยอัตโนมัติ (หรือย้ายลงถังขยะ) เพื่อรักษาพื้นที่ให้พอดีตลอดปีการศึกษา

3. รายการตรวจสอบก่อนเปิดใช้งาน (Pre-deployment Checklist สำหรับ V12)
[ ] บล็อกพอร์ตและ URL การเข้าถึงตาราง audit_logs จากภายนอกผ่านนโยบาย RLS (ให้สิทธิ์เฉพาะ Service Role ของระบบและสคริปต์หลังบ้านเท่านั้น)

[ ] ทดสอบความถูกต้องของสคริปต์ดึงข้อความภาษาไทยใน Google Apps Script ว่าเมื่อแปลงเป็นไฟล์ JSON/Text แล้ว วรรณยุกต์และสระภาษาไทยไม่เพี้ยนหรือกลายเป็นอักษรต่างดาว

[ ] ตั้งค่าเปิดการแจ้งเตือนอีเมล (Failure Notification) ในหน้า Google Apps Script Trigger เพื่อให้ระบบส่งอีเมลเตือนคุณ มนต์สปิน ทันทีหากคืนไหนระบบ Backup หรือ Offload Log ทำงานล้มเหลว

[ ] ทำคู่มือกู้คืนข้อมูล (Data Recovery Manual) สั้นๆ ไว้สำหรับเปิดอ่านและรันสคริปต์ย้อนกลับ (Import JSON กลับเข้า Supabase) กรณีฐานข้อมูลหลักเกิดความเสียหายในอนาคต

แผนงานเวอร์ชัน 12 นี้เน้นความรัดกุม ปลอดภัย และเสถียรภาพ เพื่อเปลี่ยนผ่านระบบ SAMS และ Home Visit ให้เป็นระบบระดับมืออาชีพอย่างเต็มตัว