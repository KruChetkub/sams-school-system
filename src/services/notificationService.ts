import { supabase } from '../lib/supabase'

// 1. In-App Notification (บันทึกลงฐานข้อมูล)
export const createNotification = async (userId: string, title: string, message: string, type: string = 'INFO') => {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type
  })
  if (error) throw error
}

// 2. External Notification Webhooks (เตรียมโครงสร้างไว้สำหรับ LINE / Telegram)
export const sendExternalNotification = async (targetId: string, message: string, platform: 'LINE' | 'TELEGRAM' | 'AUTO' = 'AUTO') => {
  // โครงสร้างสำหรับเรียกใช้งาน API ภายนอกในอนาคต (เช่น ผ่าน Supabase Edge Functions)
  console.log(`[Notification Engine] เตรียมส่งข้อความไปยัง ${platform}: ${targetId}`)
  console.log(`Message: ${message}`)
  
  /* Example Implementation for future:
  await fetch('https://your-api.com/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId, message, platform })
  })
  */
  
  return true // Simulate success
}

// 3. Helper functions for specific events
export const notifyAbsence = async (studentId: string, date: string) => {
  console.log(`[Notification Engine] แจ้งเตือนการขาดเรียนของนักเรียน ID: ${studentId} สำหรับวันที่ ${date}`)
  // TODO: Query parent ID, external token (Line/Telegram) and call sendExternalNotification
}

export const notifyLeaveApproved = async (studentId: string, leaveType: string) => {
  console.log(`[Notification Engine] แจ้งเตือนอนุมัติใบลา ${leaveType} ของนักเรียน ID: ${studentId}`)
  // TODO: Query parent ID, external token (Line/Telegram) and call sendExternalNotification
}
