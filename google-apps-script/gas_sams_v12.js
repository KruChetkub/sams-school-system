/**
 * Google Apps Script: SAMS Version 12 - ระบบโยกย้าย Log และสำรองข้อมูลอัตโนมัติ (Daily Backup & Log Offloader)
 * 
 * วิธีการติดตั้งใช้งาน:
 * 1. ไปที่ https://script.google.com ด้วยบัญชี Google ส่วนบุคคลของคุณครู
 * 2. สร้างโครงการใหม่ (New Project) ตั้งชื่อว่า "SAMS_Backup_And_Logs"
 * 3. คัดลอกโค้ดทั้งหมดด้านล่างนี้ไปวางแทนที่โค้ดเดิมในไฟล์ Code.gs
 * 4. แก้ไขข้อมูลในส่วน CONFIGURATION ด้านล่างให้ตรงกับระบบของโรงเรียน
 * 5. กดบันทึก (Save)
 * 6. สร้าง Trigger (ไอคอนนาฬิกาแถบซ้ายมือ) เพื่อตั้งเวลาทำงานอัตโนมัติรายวัน:
 *    - ฟังก์ชัน `runDailyLogOffload` -> ทำงานทุกวัน ในช่วงเวลา 01:00 - 02:00 น.
 *    - ฟังก์ชัน `runDailyDatabaseBackup` -> ทำงานทุกวัน ในช่วงเวลา 02:00 - 03:00 น.
 */

// ==========================================
// CONFIGURATION (ส่วนการตั้งค่าสำหรับระบบของคุณ)
// ==========================================
const CONFIG = {
  // 1. ตั้งค่าการเชื่อมต่อ Supabase
  SUPABASE_URL: "https://<your-project-id>.supabase.co", // ลิงก์ Supabase Project URL ของคุณครู
  SUPABASE_KEY: "<your-service-role-or-anon-key>",      // แนะนำให้ใช้ Service Role Key เพื่อให้อ่าน/ลบข้อมูลได้สมบูรณ์

  // 2. ตั้งค่าปลายทางการเก็บข้อมูล (ถ้าว่างไว้ ระบบจะสร้างโฟลเดอร์ให้ใน Google Drive อัตโนมัติ)
  DRIVE_BACKUP_ROOT_FOLDER_NAME: "SAMS_Backup_Root", // ชื่อโฟลเดอร์หลักบน Google Drive
  DRIVE_LOG_FOLDER_NAME: "SAMS_Audit_Logs",          // ชื่อโฟลเดอร์สำหรับพัก Text Log

  // 3. ตั้งค่า Google Sheets สำหรับพัก Log (หากเว้นว่างไว้ ระบบจะสร้างสเปรดชีตใหม่ให้โดยอัตโนมัติและแจ้งทางอีเมล)
  GOOGLE_SHEET_ID: "", 

  // 4. อีเมลปลายทางสำหรับส่งแจ้งเตือนกรณีระบบขัดข้องหรือแจ้งผลลัพธ์
  NOTIFICATION_EMAIL: "your-email@gmail.com" 
};

// ==========================================
// MAIN FUNCTION 1: ระบบโยกย้าย Log รายวัน (Phase 3)
// ==========================================
function runDailyLogOffload() {
  Logger.log("=== เริ่มต้นระบบโยกย้าย Log (Log Offloading) ===");
  try {
    const now = new Date();
    const past24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const isoString = past24Hours.toISOString(); // ใช้สำหรับฟิลเตอร์เฉพาะ Log 24 ชม. ที่ผ่านมา

    // 1. ดึง Log จาก Supabase
    const supabaseUrl = `${CONFIG.SUPABASE_URL}/rest/v1/audit_logs?created_at=gte.${isoString}&order=created_at.asc`;
    const options = {
      method: "GET",
      headers: {
        "apikey": CONFIG.SUPABASE_KEY,
        "Authorization": `Bearer ${CONFIG.SUPABASE_KEY}`
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(supabaseUrl, options);
    if (response.getResponseCode() !== 200) {
      throw new Error(`ไม่สามารถดึงข้อมูล Log จาก Supabase ได้ (โค้ดตอบกลับ: ${response.getResponseCode()})`);
    }

    const logs = JSON.parse(response.getContentText());
    Logger.log(`ตรวจพบ Log ใหม่จำนวน: ${logs.length} รายการ`);

    if (logs.length === 0) {
      Logger.log("ไม่มี Log ใหม่ที่ต้องโยกย้ายในวันนี้");
      return;
    }

    // 2. เขียน Log ลง Google Sheets (ฐานข้อมูลพัก Log)
    const sheet = getOrCreateLogSheet();
    const rows = logs.map(log => [
      log.created_at,
      log.user_email || log.user_id || "SYSTEM",
      log.action,
      log.table_name || "-",
      log.record_id || "-",
      log.old_values ? JSON.stringify(log.old_values) : "-",
      log.new_values ? JSON.stringify(log.new_values) : "-",
      log.ip_address || "Unknown",
      log.user_agent || "Unknown"
    ]);

    // เขียนต่อท้าย Sheet (Append)
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);
    Logger.log("บันทึกข้อมูล Log ลง Google Sheets สำเร็จ");

    // 3. เขียน Log ลงไฟล์สถิติประจำวันใน Google Drive (.txt)
    const logFolder = getOrCreateFolder(DriveApp.getRootFolder(), CONFIG.DRIVE_LOG_FOLDER_NAME);
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy_MM_dd");
    const fileName = `sams_log_${dateStr}.txt`;
    
    // แปลง JSON logs ทั้งหมดเป็น String
    const fileContent = JSON.stringify(logs, null, 2);
    logFolder.createFile(fileName, fileContent, MimeType.PLAIN_TEXT);
    Logger.log(`สร้างไฟล์สถิติ Log ใน Drive สำเร็จ: ${fileName}`);

    // 4. ล้างข้อมูลเก่าบน Supabase คืนพื้นที่ 500 MB (ลบเฉพาะแถวที่เก่ากว่า 24 ชม.)
    const deleteUrl = `${CONFIG.SUPABASE_URL}/rest/v1/audit_logs?created_at=lte.${isoString}`;
    const deleteOptions = {
      method: "DELETE",
      headers: {
        "apikey": CONFIG.SUPABASE_KEY,
        "Authorization": `Bearer ${CONFIG.SUPABASE_KEY}`
      },
      muteHttpExceptions: true
    };
    const deleteResponse = UrlFetchApp.fetch(deleteUrl, deleteOptions);
    if (deleteResponse.getResponseCode() >= 300) {
      throw new Error(`ไม่สามารถล้างข้อมูลเก่าบน Supabase ได้ (โค้ดตอบกลับ: ${deleteResponse.getResponseCode()})`);
    }
    Logger.log("ทำการล้างพื้นที่ Log เก่าบนฐานข้อมูล Supabase เรียบร้อยแล้ว (คืนพื้นที่ 500 MB)");

  } catch (error) {
    Logger.log(`เกิดข้อผิดพลาดในการ Offload Log: ${error.toString()}`);
    sendFailureEmail("ระบบ Log Offload ล้มเหลว", error.toString());
  }
}

// ==========================================
// MAIN FUNCTION 2: ระบบสำรองข้อมูลฐานข้อมูลและรูปภาพ (Phase 4)
// ==========================================
function runDailyDatabaseBackup() {
  Logger.log("=== เริ่มต้นระบบสำรองข้อมูลระบบ (Daily Backup System) ===");
  try {
    const now = new Date();
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyyMMdd");
    const yearStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy");

    // 1. ตระเตรียมโฟลเดอร์หลักและโฟลเดอร์ย่อยใน Google Drive
    const rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), CONFIG.DRIVE_BACKUP_ROOT_FOLDER_NAME);
    const dbFolder = getOrCreateFolder(rootFolder, "01_Database_JSON");
    const assetsFolder = getOrCreateFolder(rootFolder, "02_Storage_Assets");
    
    // สร้างโฟลเดอร์ย่อยแยกตามปี เพื่อจัดระเบียบข้อมูลถาวรตามการปรับปรุงแผน
    const yearlyDbFolder = getOrCreateFolder(dbFolder, yearStr);

    // 2. ดึงข้อมูลทีละตารางจาก Supabase (เรียงตามลำดับความสัมพันธ์ของ ForeignKey)
    const tablesToBackup = [
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

    const backupData = {
      backup_date: now.toISOString(),
      tables: {}
    };

    for (const tableName of tablesToBackup) {
      Logger.log(`กำลังดึงข้อมูลจากตาราง: ${tableName}`);
      const tableUrl = `${CONFIG.SUPABASE_URL}/rest/v1/${tableName}?select=*`;
      const options = {
        method: "GET",
        headers: {
          "apikey": CONFIG.SUPABASE_KEY,
          "Authorization": `Bearer ${CONFIG.SUPABASE_KEY}`
        },
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(tableUrl, options);
      if (response.getResponseCode() === 200) {
        backupData.tables[tableName] = JSON.parse(response.getContentText());
      } else {
        Logger.log(`[แจ้งเตือน] ไม่สามารถดึงตาราง ${tableName} ได้ (โค้ด: ${response.getResponseCode()})`);
        backupData.tables[tableName] = []; // ใส่ Array ว่างหากไม่มีตาราง
      }
    }

    // 3. เซฟไฟล์ JSON ลง Drive (เก็บถาวร)
    const backupFileName = `db_backup_${dateStr}.json`;
    const jsonString = JSON.stringify(backupData, null, 2);
    yearlyDbFolder.createFile(backupFileName, jsonString, MimeType.PLAIN_TEXT);
    Logger.log(`บันทึกไฟล์สำรองข้อมูลสำเร็จ: ${backupFileName} (เก็บถาวรในโฟลเดอร์ปี ${yearStr})`);

    // 4. สำรองรูปภาพเยี่ยมบ้านแบบ Incremental (เฉพาะภาพใหม่ในวันนี้)
    runIncrementalImageBackup(assetsFolder, now);

  } catch (error) {
    Logger.log(`เกิดข้อผิดพลาดในการสำรองข้อมูลระบบ: ${error.toString()}`);
    sendFailureEmail("ระบบสำรองข้อมูลระบบล้มเหลว", error.toString());
  }
}

/**
 * ฟังก์ชันย่อย: ดึงภาพเยี่ยมบ้านที่มีในตารางมาบันทึกเก็บไว้แบบ Incremental
 */
function runIncrementalImageBackup(assetsFolder, now) {
  Logger.log("กำลังตรวจเช็ครูปภาพการเยี่ยมบ้านเพื่อทำ Incremental Backup...");
  try {
    // ป้องกันข้อผิดพลาดกรณีคุณครูกดคลิกเรียกใช้งานฟังก์ชันย่อยนี้โดยตรงจากหน้า Dashboard
    if (!now) {
      now = new Date();
    }
    if (!assetsFolder) {
      const rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), CONFIG.DRIVE_BACKUP_ROOT_FOLDER_NAME);
      assetsFolder = getOrCreateFolder(rootFolder, "02_Storage_Assets");
    }

    // ย้อนหลัง 48 ชั่วโมงเพื่อให้ครอบคลุมความต่างของเขตเวลา (Timezone Gap - UTC+7 ของไทย)
    // รูปภาพที่ถ่ายตอนดึก/เช้าตรู่ในไทย จะถูกบันทึกเป็นวันก่อนหน้าในเวลา UTC ทำให้การดึงข้อมูลระบุวันตรงๆ คลาดเคลื่อน
    const past48Hours = new Date(now.getTime() - (48 * 60 * 60 * 1000));
    const isoString48h = past48Hours.toISOString();
    const monthFolderStr = "Assets_" + Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy_MM");
    
    // คิวรีรูปที่มีการลงบันทึกในช่วง 48 ชั่วโมงที่ผ่านมา
    const queryUrl = `${CONFIG.SUPABASE_URL}/rest/v1/home_visit_photos?created_at=gte.${isoString48h}&select=*`;
    const options = {
      method: "GET",
      headers: {
        "apikey": CONFIG.SUPABASE_KEY,
        "Authorization": `Bearer ${CONFIG.SUPABASE_KEY}`
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(queryUrl, options);
    if (response.getResponseCode() !== 200) {
      Logger.log(`ไม่มีตารางรูปภาพหรือเกิดข้อผิดพลาดในการคิวรีรูปภาพ (โค้ดตอบกลับ: ${response.getResponseCode()})`);
      return;
    }

    const photos = JSON.parse(response.getContentText());
    Logger.log(`พบรูปภาพที่อัปโหลดในวันนี้จำนวน: ${photos.length} รูป`);

    if (photos.length === 0) {
      Logger.log("ไม่มีรูปภาพใหม่ที่ต้องสำรองข้อมูลเพิ่มเติมในวันนี้");
      return;
    }

    // สร้างโฟลเดอร์แยกตามรายเดือนเพื่อความเป็นระเบียบ
    const monthlyFolder = getOrCreateFolder(assetsFolder, monthFolderStr);

    for (const photo of photos) {
      // url_path มักเป็นลิงก์เข้าถึงรูปภาพในระบบ Supabase Storage
      const photoUrl = photo.photo_url || photo.url_path;
      if (!photoUrl) continue;

      Logger.log(`กำลังดาวน์โหลดรูปภาพจาก URL: ${photoUrl}`);
      try {
        const fileResponse = UrlFetchApp.fetch(photoUrl);
        if (fileResponse.getResponseCode() === 200) {
          const blob = fileResponse.getBlob();
          // หาชื่อไฟล์จาก URL (แกะชื่อไฟล์จริงที่บันทึกไว้ใน Supabase Storage เช่น homevisit_10101_17154245642.jpg)
          const urlParts = photoUrl.split('/');
          const fileName = urlParts[urlParts.length - 1] || `visit_${photo.id || Date.now()}.jpg`;
          
          // สร้างโฟลเดอร์แยกของนักเรียนคนนั้นๆ ตามรหัสนักเรียน (เช่น "0088") ป้องกันไม่ให้ภาพกองรวมกัน ตามคุณครูแนะนำ
          let studentFolder = monthlyFolder;
          let studentCode = "unknown";
          if (urlParts.length >= 2) {
            studentCode = urlParts[urlParts.length - 2];
            studentFolder = getOrCreateFolder(monthlyFolder, studentCode);
          }
          
          // ตรวจสอบว่ามีไฟล์เดิมชื่อนี้ในโฟลเดอร์นักเรียนแล้วหรือไม่ เพื่อไม่ให้สร้างซ้ำซ้อน
          const existingFiles = studentFolder.getFilesByName(fileName);
          if (!existingFiles.hasNext()) {
            studentFolder.createFile(blob.setName(fileName));
            Logger.log(`สำรองข้อมูลรูปภาพสำเร็จ: โฟลเดอร์ ${studentCode} -> ${fileName}`);
          } else {
            Logger.log(`ข้ามรูปภาพ ${fileName} เนื่องจากมีไฟล์ชื่อนี้สำรองในโฟลเดอร์ ${studentCode} แล้ว`);
          }
        }
      } catch (imgErr) {
        Logger.log(`[ข้อผิดพลาด] ไม่สามารถดาวน์โหลดรูปภาพได้: ${imgErr.toString()}`);
      }
    }
  } catch (err) {
    Logger.log(`เกิดความล้มเหลวในฟังก์ชัน Incremental Image Backup: ${err.toString()}`);
  }
}

// ==========================================
// HELPER FUNCTIONS (ฟังก์ชันสนับสนุนการทำงาน)
// ==========================================

/**
 * ดึงข้อมูลหรือสร้าง Google Sheets สำหรับจดบันทึก Log
 */
function getOrCreateLogSheet() {
  let spreadsheet;
  
  if (CONFIG.GOOGLE_SHEET_ID && CONFIG.GOOGLE_SHEET_ID.trim() !== "") {
    try {
      spreadsheet = SpreadsheetApp.openById(CONFIG.GOOGLE_SHEET_ID);
    } catch (e) {
      Logger.log("ไม่พบ Sheet ID ที่ระบุ กำลังดำเนินการสร้างสเปรดชีตใหม่...");
    }
  }

  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create("SAMS_Audit_Logs_Sheet");
    Logger.log(`สร้างสเปรดชีตจัดเก็บ Log สำเร็จ ID: ${spreadsheet.getId()}`);
    
    // แจ้งเตือนผู้พัฒนาให้ทราบ Sheet ID ใหม่ทางอีเมล
    sendFailureEmail(
      "แจ้งเตือนระบบ: สเปรดชีตเก็บ Log ใหม่ถูกสร้างขึ้นโดยอัตโนมัติ", 
      `ระบบได้ทำการสร้างสเปรดชีตเก็บ Log ใหม่ให้คุณเนื่องจากไม่ได้ระบุ Sheet ID ไว้อย่างถูกต้อง\nกรุณานำ ID นี้ไปใส่ในตัวแปร CONFIG.GOOGLE_SHEET_ID ในโค้ดสคริปต์ของคุณ:\n\nSHEET ID: ${spreadsheet.getId()}`
    );
  }

  const sheet = spreadsheet.getSheets()[0];
  
  // ตรวจเช็คว่ามี Header หรือยัง หากยังไม่มีให้สร้าง Header ตารางบันทึก Log
  if (sheet.getLastRow() === 0) {
    const headers = [
      "created_at (UTC)", 
      "user_email / user_id", 
      "action", 
      "table_name", 
      "record_id", 
      "old_values (JSON)", 
      "new_values (JSON)", 
      "ip_address", 
      "user_agent"
    ];
    sheet.appendRow(headers);
    // ตกแต่งหัวตารางให้สวยงามและอ่านง่าย
    sheet.getRange(1, 1, 1, headers.length)
         .setBackground("#2a1360")
         .setFontColor("#ffffff")
         .setFontWeight("bold")
         .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * ดึงข้อมูลโฟลเดอร์ หากไม่พบจะทำการสร้างใหม่ภายใต้โฟลเดอร์พ่อแม่ที่ระบุ
 */
function getOrCreateFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  Logger.log(`สร้างโฟลเดอร์ใหม่: ${folderName}`);
  return parentFolder.createFolder(folderName);
}

/**
 * ส่งอีเมลแจ้งเตือนความผิดพลาดเข้าระบบอีเมลส่วนบุคคลของคุณครู
 */
function sendFailureEmail(subject, errorMessage) {
  if (!CONFIG.NOTIFICATION_EMAIL || CONFIG.NOTIFICATION_EMAIL.includes("your-email")) {
    Logger.log("ไม่ได้ตั้งค่าอีเมลแจ้งเตือนข้ามขั้นตอนการส่งอีเมล");
    return;
  }
  try {
    MailApp.sendEmail({
      to: CONFIG.NOTIFICATION_EMAIL,
      subject: `⚠️ SAMS V12: ${subject}`,
      body: `เรียน ผู้พัฒนา/ผู้ดูแลระบบ CKW,\n\nระบบบำรุงรักษา SAMS Version 12 ตรวจพบข้อผิดพลาดระหว่างปฏิบัติการ:\n\nรายละเอียดความผิดพลาด:\n${errorMessage}\n\nวันเวลาที่เกิดเหตุ: ${new Date().toString()}\n\nกรุณาลงทะเบียนตรวจสอบในหน้าระบบ Google Apps Script เพื่อแก้ไขปัญหาต่อไป.`
    });
    Logger.log("ส่งอีเมลแจ้งเตือนความผิดพลาดสำเร็จ");
  } catch (err) {
    Logger.log(`ไม่สามารถส่งอีเมลแจ้งเตือนได้: ${err.toString()}`);
  }
}
