// ข้อมูลอ้างอิงจากไฟล์ Excel ทั้ง 4 ไฟล์:
// 1. 23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet: ม.3 ห้อง 3/1 - 3/5 รวม 153 คน)
// 2. ใบเช็คชื่อ ม4-7 วิชา การจัดดอกไม้.xlsx (ชั้น ม.4/7 รายวิชา ง31202 รวม 15 คน)
// 3. ใบเช็คชื่อ ม5-7 อาหารพื้นบ้าน.xlsx (ชั้น ม.5/7 รายวิชา ง32202 รวม 16 คน)
// 4. ใบเช็คชื่อ ม6-7 เบเกอรี่เบื้องต้น.xlsx (ชั้น ม.6/7 รายวิชา ง33203 รวม 16 คน)

export interface OfficialRosterEntry {
  level: string
  room: string
  no: number
  class_no: number
  student_code: string
  alt_student_code?: string
  prefix: string
  first_name: string
  last_name: string
  source_file: string
}

export const ALL_OFFICIAL_ROSTER: OfficialRosterEntry[] = [
  {
    "level": "ม.3",
    "room": "1",
    "no": 1,
    "class_no": 1,
    "student_code": "16862",
    "alt_student_code": "16862",
    "prefix": "นาย",
    "first_name": "กรณ์ภวิษย์",
    "last_name": "วงศ์ชัย",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 2,
    "class_no": 2,
    "student_code": "16863",
    "alt_student_code": "16863",
    "prefix": "นาย",
    "first_name": "กวิน",
    "last_name": "อ้ายด้วง",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 3,
    "class_no": 3,
    "student_code": "16864",
    "alt_student_code": "16864",
    "prefix": "เด็กชาย",
    "first_name": "ไกรสิทธิ",
    "last_name": "สักวรรณ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 4,
    "class_no": 4,
    "student_code": "16865",
    "alt_student_code": "16865",
    "prefix": "นาย",
    "first_name": "ธนสิทธิ์",
    "last_name": "ปัญญาชัย",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 5,
    "class_no": 5,
    "student_code": "16866",
    "alt_student_code": "16866",
    "prefix": "เด็กชาย",
    "first_name": "ธีร์ธรรศ",
    "last_name": "วงค์ธรรม",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 6,
    "class_no": 6,
    "student_code": "16867",
    "alt_student_code": "16867",
    "prefix": "นาย",
    "first_name": "ปัญญากรณ์",
    "last_name": "จันต๊ะคาด",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 7,
    "class_no": 7,
    "student_code": "16868",
    "alt_student_code": "16868",
    "prefix": "นาย",
    "first_name": "พิชญุตม์",
    "last_name": "สืบแก้ว",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 8,
    "class_no": 8,
    "student_code": "16870",
    "alt_student_code": "16870",
    "prefix": "เด็กชาย",
    "first_name": "ศตคุณ",
    "last_name": "อินตา",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 9,
    "class_no": 9,
    "student_code": "16871",
    "alt_student_code": "16871",
    "prefix": "เด็กชาย",
    "first_name": "ศิวนาถ",
    "last_name": "คำเรือง",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 10,
    "class_no": 10,
    "student_code": "16872",
    "alt_student_code": "16872",
    "prefix": "เด็กชาย",
    "first_name": "หฤษฏ์",
    "last_name": "วงค์จันสุ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 11,
    "class_no": 11,
    "student_code": "16873",
    "alt_student_code": "16873",
    "prefix": "นาย",
    "first_name": "หิรัณยเศรษฐ์",
    "last_name": "ศรีน้อย",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 12,
    "class_no": 12,
    "student_code": "16874",
    "alt_student_code": "16874",
    "prefix": "นาย",
    "first_name": "อนุสรณ์",
    "last_name": "เซอแลน",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 13,
    "class_no": 13,
    "student_code": "16875",
    "alt_student_code": "16875",
    "prefix": "เด็กชาย",
    "first_name": "อัศม์เดช",
    "last_name": "ศรีโยทัย",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 14,
    "class_no": 14,
    "student_code": "16876",
    "alt_student_code": "16876",
    "prefix": "นางสาว",
    "first_name": "กิตติกา",
    "last_name": "จันทร์ดี",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 15,
    "class_no": 15,
    "student_code": "16877",
    "alt_student_code": "16877",
    "prefix": "นางสาว",
    "first_name": "ณัชชา",
    "last_name": "อำมาตย์มณี",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 16,
    "class_no": 16,
    "student_code": "16878",
    "alt_student_code": "16878",
    "prefix": "นางสาว",
    "first_name": "ณัฐณิชา",
    "last_name": "อินต๊ะสาร",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 17,
    "class_no": 17,
    "student_code": "16879",
    "alt_student_code": "16879",
    "prefix": "เด็กหญิง",
    "first_name": "ธัญพิชชา",
    "last_name": "ศรีสุข",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 18,
    "class_no": 18,
    "student_code": "16880",
    "alt_student_code": "16880",
    "prefix": "นางสาว",
    "first_name": "นงลักษณ์",
    "last_name": "ศรีสวัสดิ์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 19,
    "class_no": 19,
    "student_code": "16881",
    "alt_student_code": "16881",
    "prefix": "นางสาว",
    "first_name": "เนตรวฤนท์",
    "last_name": "เทพกิจ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 20,
    "class_no": 20,
    "student_code": "16882",
    "alt_student_code": "16882",
    "prefix": "เด็กหญิง",
    "first_name": "ปนัดดา",
    "last_name": "ประทุมมา",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 21,
    "class_no": 21,
    "student_code": "16883",
    "alt_student_code": "16883",
    "prefix": "นางสาว",
    "first_name": "ปิยธิดา",
    "last_name": "ศรีทอง",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 22,
    "class_no": 22,
    "student_code": "16884",
    "alt_student_code": "16884",
    "prefix": "นางสาว",
    "first_name": "เปรมมิกา",
    "last_name": "สถานเดิม",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 23,
    "class_no": 23,
    "student_code": "16885",
    "alt_student_code": "16885",
    "prefix": "เด็กหญิง",
    "first_name": "พิมพ์ญาดา",
    "last_name": "เฉียบแหลม",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 24,
    "class_no": 24,
    "student_code": "16886",
    "alt_student_code": "16886",
    "prefix": "เด็กหญิง",
    "first_name": "พีรยา",
    "last_name": "กำเนิด",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 25,
    "class_no": 25,
    "student_code": "16887",
    "alt_student_code": "16887",
    "prefix": "นางสาว",
    "first_name": "ภูษณภา",
    "last_name": "อาษายศ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 26,
    "class_no": 26,
    "student_code": "16888",
    "alt_student_code": "16888",
    "prefix": "นางสาว",
    "first_name": "ยิ่งลักษณ์",
    "last_name": "มาสุข",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 27,
    "class_no": 27,
    "student_code": "16889",
    "alt_student_code": "16889",
    "prefix": "นางสาว",
    "first_name": "รัตกานต์",
    "last_name": "ยะอิ่นแก้ว",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 28,
    "class_no": 28,
    "student_code": "16890",
    "alt_student_code": "16890",
    "prefix": "เด็กหญิง",
    "first_name": "วรินทร์ยุพา",
    "last_name": "อินทรสิทธิ์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "1",
    "no": 29,
    "class_no": 29,
    "student_code": "16891",
    "alt_student_code": "16891",
    "prefix": "เด็กหญิง",
    "first_name": "วริศรา",
    "last_name": "แก้วคำ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 1,
    "class_no": 1,
    "student_code": "16893",
    "alt_student_code": "16893",
    "prefix": "นาย",
    "first_name": "ฐิติกร",
    "last_name": "ใจมั่น",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 2,
    "class_no": 2,
    "student_code": "16894",
    "alt_student_code": "16894",
    "prefix": "เด็กชาย",
    "first_name": "ตรัยรัตน์",
    "last_name": "มณีใหม่",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 3,
    "class_no": 3,
    "student_code": "16896",
    "alt_student_code": "16896",
    "prefix": "เด็กชาย",
    "first_name": "ธัญพิสิษฐ์",
    "last_name": "ดาอินวงค์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 4,
    "class_no": 4,
    "student_code": "16898",
    "alt_student_code": "16898",
    "prefix": "เด็กชาย",
    "first_name": "ปรเมศร์",
    "last_name": "เทพจา",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 5,
    "class_no": 5,
    "student_code": "16899",
    "alt_student_code": "16899",
    "prefix": "เด็กชาย",
    "first_name": "พิชัย",
    "last_name": "กิลัย",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 6,
    "class_no": 6,
    "student_code": "16900",
    "alt_student_code": "16900",
    "prefix": "นาย",
    "first_name": "ภาณุพงศ์",
    "last_name": "เทพมูล",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 7,
    "class_no": 7,
    "student_code": "16901",
    "alt_student_code": "16901",
    "prefix": "เด็กชาย",
    "first_name": "ยอดศึก",
    "last_name": "กมลาสน์กมุท",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 8,
    "class_no": 8,
    "student_code": "16902",
    "alt_student_code": "16902",
    "prefix": "นาย",
    "first_name": "วรโชติ",
    "last_name": "ใจทนง",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 9,
    "class_no": 9,
    "student_code": "16904",
    "alt_student_code": "16904",
    "prefix": "เด็กชาย",
    "first_name": "ศิลา",
    "last_name": "ขวัญธนเกียรติ์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 10,
    "class_no": 10,
    "student_code": "16906",
    "alt_student_code": "16906",
    "prefix": "นาย",
    "first_name": "อภิวัฒน์",
    "last_name": "อุยแม",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 11,
    "class_no": 11,
    "student_code": "17495",
    "alt_student_code": "17495",
    "prefix": "นาย",
    "first_name": "วุฒิชัย",
    "last_name": "ราชหุ่น",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 12,
    "class_no": 12,
    "student_code": "17525",
    "alt_student_code": "17525",
    "prefix": "นาย",
    "first_name": "ศุภกิจ",
    "last_name": "เนืองนิตย์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 13,
    "class_no": 13,
    "student_code": "16908",
    "alt_student_code": "16908",
    "prefix": "เด็กหญิง",
    "first_name": "กนกรดา",
    "last_name": "จันต๊ะคาด",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 14,
    "class_no": 14,
    "student_code": "16909",
    "alt_student_code": "16909",
    "prefix": "เด็กหญิง",
    "first_name": "กฤติญา",
    "last_name": "กฤตชัยพงศ์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 15,
    "class_no": 15,
    "student_code": "16910",
    "alt_student_code": "16910",
    "prefix": "เด็กหญิง",
    "first_name": "กัญญาณัฐ",
    "last_name": "เกตุแก้ว",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 16,
    "class_no": 16,
    "student_code": "16911",
    "alt_student_code": "16911",
    "prefix": "เด็กหญิง",
    "first_name": "กัญญานัฐ",
    "last_name": "ยอดมณีบรรพต",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 17,
    "class_no": 17,
    "student_code": "16912",
    "alt_student_code": "16912",
    "prefix": "นางสาว",
    "first_name": "จั๊ว",
    "last_name": "แซ่เท้า",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 18,
    "class_no": 18,
    "student_code": "16913",
    "alt_student_code": "16913",
    "prefix": "เด็กหญิง",
    "first_name": "จิราภรณ์",
    "last_name": "พงศ์พระคุณ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 19,
    "class_no": 19,
    "student_code": "16914",
    "alt_student_code": "16914",
    "prefix": "นางสาว",
    "first_name": "จิราวรรณ",
    "last_name": "อุ่นอุดมวนา",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 20,
    "class_no": 20,
    "student_code": "16916",
    "alt_student_code": "16916",
    "prefix": "เด็กหญิง",
    "first_name": "ณัฐฤดี",
    "last_name": "ป่องเป้า",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 21,
    "class_no": 21,
    "student_code": "16918",
    "alt_student_code": "16918",
    "prefix": "นางสาว",
    "first_name": "ธิดา",
    "last_name": "วงศ์ชัย",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 22,
    "class_no": 22,
    "student_code": "16919",
    "alt_student_code": "16919",
    "prefix": "เด็กหญิง",
    "first_name": "ธิดาวัลณ์",
    "last_name": "เล่าวิริยะธนชัย",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 23,
    "class_no": 23,
    "student_code": "16920",
    "alt_student_code": "16920",
    "prefix": "เด็กหญิง",
    "first_name": "ธีรตา",
    "last_name": "ยอดสุวรรณ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 24,
    "class_no": 24,
    "student_code": "16922",
    "alt_student_code": "16922",
    "prefix": "นางสาว",
    "first_name": "ปวิตรา",
    "last_name": "แซ่ลี",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 25,
    "class_no": 25,
    "student_code": "16924",
    "alt_student_code": "16924",
    "prefix": "นางสาว",
    "first_name": "พิมนภา",
    "last_name": "ณ นคร",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 26,
    "class_no": 26,
    "student_code": "16925",
    "alt_student_code": "16925",
    "prefix": "เด็กหญิง",
    "first_name": "ภูริชญา",
    "last_name": "แซ่ซ่ง",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 27,
    "class_no": 27,
    "student_code": "16926",
    "alt_student_code": "16926",
    "prefix": "เด็กหญิง",
    "first_name": "ลัลล์นารา",
    "last_name": "เกิดทองสุก",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 28,
    "class_no": 28,
    "student_code": "16927",
    "alt_student_code": "16927",
    "prefix": "เด็กหญิง",
    "first_name": "วริศรา",
    "last_name": "ยาละ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 29,
    "class_no": 29,
    "student_code": "16928",
    "alt_student_code": "16928",
    "prefix": "เด็กหญิง",
    "first_name": "ศศิธร",
    "last_name": "ชั่งใจ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 30,
    "class_no": 30,
    "student_code": "16929",
    "alt_student_code": "16929",
    "prefix": "นางสาว",
    "first_name": "ศิรินภา",
    "last_name": "พิชยศ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 31,
    "class_no": 31,
    "student_code": "16930",
    "alt_student_code": "16930",
    "prefix": "นางสาว",
    "first_name": "สายพิมพ์",
    "last_name": "แซ่ย่าง",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 32,
    "class_no": 32,
    "student_code": "16931",
    "alt_student_code": "16931",
    "prefix": "นางสาว",
    "first_name": "สุกัญญา",
    "last_name": "ศรีประเสริฐ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 33,
    "class_no": 33,
    "student_code": "17001",
    "alt_student_code": "17001",
    "prefix": "นางสาว",
    "first_name": "ศิริวรรณ",
    "last_name": "สาเตาะ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 34,
    "class_no": 34,
    "student_code": "17488",
    "alt_student_code": "17488",
    "prefix": "เด็กหญิง",
    "first_name": "กันยาณัฐ",
    "last_name": "ราชเดิม",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 35,
    "class_no": 35,
    "student_code": "17503",
    "alt_student_code": "17503",
    "prefix": "นางสาว",
    "first_name": "ณิชาดา",
    "last_name": "ศูนย์นอก",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "2",
    "no": 36,
    "class_no": 36,
    "student_code": "17851",
    "alt_student_code": "17851",
    "prefix": "เด็กหญิง",
    "first_name": "กัญญาณัฐ",
    "last_name": "โนขัติ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 1,
    "class_no": 1,
    "student_code": "16933",
    "alt_student_code": "16933",
    "prefix": "เด็กชาย",
    "first_name": "กิตติพศ",
    "last_name": "ชัญญาศิริกุล",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 2,
    "class_no": 2,
    "student_code": "16934",
    "alt_student_code": "16934",
    "prefix": "เด็กชาย",
    "first_name": "เกษมสันต์",
    "last_name": "ปัญญาลัย",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 3,
    "class_no": 3,
    "student_code": "16937",
    "alt_student_code": "16937",
    "prefix": "เด็กชาย",
    "first_name": "ชนาเมธ",
    "last_name": "ผูกพันธ์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 4,
    "class_no": 4,
    "student_code": "16940",
    "alt_student_code": "16940",
    "prefix": "เด็กชาย",
    "first_name": "ณัฐวุฒิ",
    "last_name": "แซ่หลอ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 5,
    "class_no": 5,
    "student_code": "16941",
    "alt_student_code": "16941",
    "prefix": "นาย",
    "first_name": "เตชินท์",
    "last_name": "นารีรักษ์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 6,
    "class_no": 6,
    "student_code": "16942",
    "alt_student_code": "16942",
    "prefix": "เด็กชาย",
    "first_name": "ทนงค์",
    "last_name": "แซ่ซ่ง",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 7,
    "class_no": 7,
    "student_code": "16943",
    "alt_student_code": "16943",
    "prefix": "เด็กชาย",
    "first_name": "ธนโชค",
    "last_name": "ใจกล้า",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 8,
    "class_no": 8,
    "student_code": "16944",
    "alt_student_code": "16944",
    "prefix": "เด็กชาย",
    "first_name": "ปรีชา",
    "last_name": "กังวานไกล",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 9,
    "class_no": 9,
    "student_code": "16945",
    "alt_student_code": "16945",
    "prefix": "เด็กชาย",
    "first_name": "ปุณณวิชญ์",
    "last_name": "ปานกลาง",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 10,
    "class_no": 10,
    "student_code": "16946",
    "alt_student_code": "16946",
    "prefix": "เด็กชาย",
    "first_name": "พงศกร",
    "last_name": "ชัยวงศ์วัฒนกุล",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 11,
    "class_no": 11,
    "student_code": "16947",
    "alt_student_code": "16947",
    "prefix": "เด็กชาย",
    "first_name": "พรหมพิริยะ",
    "last_name": "วงษ์ตาขี",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 12,
    "class_no": 12,
    "student_code": "16948",
    "alt_student_code": "16948",
    "prefix": "เด็กชาย",
    "first_name": "เพชรรัตน์",
    "last_name": "เลาหตีรานนท์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 13,
    "class_no": 13,
    "student_code": "16950",
    "alt_student_code": "16950",
    "prefix": "เด็กชาย",
    "first_name": "วัชรกร",
    "last_name": "ลำพูน",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 14,
    "class_no": 14,
    "student_code": "16951",
    "alt_student_code": "16951",
    "prefix": "นาย",
    "first_name": "ศุภโชค",
    "last_name": "ราชยศ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 15,
    "class_no": 15,
    "student_code": "16952",
    "alt_student_code": "16952",
    "prefix": "เด็กหญิง",
    "first_name": "กมลภัทร",
    "last_name": "เดชะนันท์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 16,
    "class_no": 16,
    "student_code": "16953",
    "alt_student_code": "16953",
    "prefix": "เด็กหญิง",
    "first_name": "กัญญาณัฐ",
    "last_name": "ปาโท้",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 17,
    "class_no": 17,
    "student_code": "16954",
    "alt_student_code": "16954",
    "prefix": "เด็กหญิง",
    "first_name": "ขวัญหทัย",
    "last_name": "แซ่ย้าง",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 18,
    "class_no": 18,
    "student_code": "16955",
    "alt_student_code": "16955",
    "prefix": "เด็กหญิง",
    "first_name": "ข้าวทิพย์",
    "last_name": "รินทะไชย",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 19,
    "class_no": 19,
    "student_code": "16956",
    "alt_student_code": "16956",
    "prefix": "นางสาว",
    "first_name": "คำผ่อง",
    "last_name": "แสงอุ่ง",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 20,
    "class_no": 20,
    "student_code": "16957",
    "alt_student_code": "16957",
    "prefix": "เด็กหญิง",
    "first_name": "ชลธิชา",
    "last_name": "แซ่ว่าง",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 21,
    "class_no": 21,
    "student_code": "16958",
    "alt_student_code": "16958",
    "prefix": "เด็กหญิง",
    "first_name": "ญาตาณี",
    "last_name": "แซ่เจียง",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 22,
    "class_no": 22,
    "student_code": "16959",
    "alt_student_code": "16959",
    "prefix": "เด็กหญิง",
    "first_name": "ณัฐธิดา",
    "last_name": "โกสุมภ์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 23,
    "class_no": 23,
    "student_code": "16960",
    "alt_student_code": "16960",
    "prefix": "เด็กหญิง",
    "first_name": "ธิชานันทน์",
    "last_name": "สุภาพ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 24,
    "class_no": 24,
    "student_code": "16961",
    "alt_student_code": "16961",
    "prefix": "เด็กหญิง",
    "first_name": "นภัทรสร",
    "last_name": "แซ่เจียง",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 25,
    "class_no": 25,
    "student_code": "16962",
    "alt_student_code": "16962",
    "prefix": "เด็กหญิง",
    "first_name": "มาลีนนท์",
    "last_name": "แซ่เห้อ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 26,
    "class_no": 26,
    "student_code": "16963",
    "alt_student_code": "16963",
    "prefix": "เด็กหญิง",
    "first_name": "มุกอันดา",
    "last_name": "บุญหนัก",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 27,
    "class_no": 27,
    "student_code": "16964",
    "alt_student_code": "16964",
    "prefix": "เด็กหญิง",
    "first_name": "รมิดา",
    "last_name": "ทุ่งเก้า",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 28,
    "class_no": 28,
    "student_code": "16965",
    "alt_student_code": "16965",
    "prefix": "เด็กหญิง",
    "first_name": "รุ่งฟ้า",
    "last_name": "แซ่ลี",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 29,
    "class_no": 29,
    "student_code": "16966",
    "alt_student_code": "16966",
    "prefix": "เด็กหญิง",
    "first_name": "วริทธิ์นันท์",
    "last_name": "ไชยทน",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 30,
    "class_no": 30,
    "student_code": "16967",
    "alt_student_code": "16967",
    "prefix": "เด็กหญิง",
    "first_name": "สุพิชชา",
    "last_name": "เกษมศุภวรรณ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 31,
    "class_no": 31,
    "student_code": "16970",
    "alt_student_code": "16970",
    "prefix": "เด็กหญิง",
    "first_name": "อาริศะ",
    "last_name": "ยามาโมะโตะ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 32,
    "class_no": 32,
    "student_code": "16993",
    "alt_student_code": "16993",
    "prefix": "เด็กหญิง",
    "first_name": "จุฑาลักษณ์",
    "last_name": "มุกดาสวรรค์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "3",
    "no": 33,
    "class_no": 33,
    "student_code": "17500",
    "alt_student_code": "17500",
    "prefix": "เด็กหญิง",
    "first_name": "ยามิละห์",
    "last_name": "มั่นยืน",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 1,
    "class_no": 1,
    "student_code": "16973",
    "alt_student_code": "16973",
    "prefix": "เด็กชาย",
    "first_name": "จิรายุ",
    "last_name": "วินัยวงศ์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 2,
    "class_no": 2,
    "student_code": "16974",
    "alt_student_code": "16974",
    "prefix": "เด็กชาย",
    "first_name": "ชวนนท์",
    "last_name": "แซ่ลี",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 3,
    "class_no": 3,
    "student_code": "16976",
    "alt_student_code": "16976",
    "prefix": "เด็กชาย",
    "first_name": "ณัฐกิตติ์",
    "last_name": "แซ่วะ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 4,
    "class_no": 4,
    "student_code": "16977",
    "alt_student_code": "16977",
    "prefix": "เด็กชาย",
    "first_name": "ธนนนท์",
    "last_name": "ชิตุภา",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 5,
    "class_no": 5,
    "student_code": "16978",
    "alt_student_code": "16978",
    "prefix": "เด็กชาย",
    "first_name": "ธวัชชัย",
    "last_name": "ขันคำ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 6,
    "class_no": 6,
    "student_code": "16979",
    "alt_student_code": "16979",
    "prefix": "เด็กชาย",
    "first_name": "นพกิจ",
    "last_name": "อะโนมา",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 7,
    "class_no": 7,
    "student_code": "16980",
    "alt_student_code": "16980",
    "prefix": "เด็กชาย",
    "first_name": "นฤชัย",
    "last_name": "ลาปาย",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 8,
    "class_no": 8,
    "student_code": "16981",
    "alt_student_code": "16981",
    "prefix": "เด็กชาย",
    "first_name": "นิพิฐพนธ์",
    "last_name": "แก้วมุกดา",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 9,
    "class_no": 9,
    "student_code": "16982",
    "alt_student_code": "16982",
    "prefix": "เด็กชาย",
    "first_name": "ปิยรัตน์",
    "last_name": "ใจแก้ว",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 10,
    "class_no": 10,
    "student_code": "16984",
    "alt_student_code": "16984",
    "prefix": "เด็กชาย",
    "first_name": "พิชญุตฆ์",
    "last_name": "พยัคฆ์จตุรชัย",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 11,
    "class_no": 11,
    "student_code": "16985",
    "alt_student_code": "16985",
    "prefix": "เด็กชาย",
    "first_name": "ภูวดล",
    "last_name": "ดีแก้ว",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 12,
    "class_no": 12,
    "student_code": "16990",
    "alt_student_code": "16990",
    "prefix": "เด็กชาย",
    "first_name": "สุภเวช",
    "last_name": "กันญาเดช",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 13,
    "class_no": 13,
    "student_code": "16991",
    "alt_student_code": "16991",
    "prefix": "เด็กชาย",
    "first_name": "อนุพงษ์",
    "last_name": "มุกดาสวรรค์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 14,
    "class_no": 14,
    "student_code": "16992",
    "alt_student_code": "16992",
    "prefix": "เด็กชาย",
    "first_name": "อิทธิพล",
    "last_name": "สมปานวัง",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 15,
    "class_no": 15,
    "student_code": "17836",
    "alt_student_code": "17836",
    "prefix": "เด็กชาย",
    "first_name": "รัชภูวินทร์",
    "last_name": "ศุภธนันท์พงศ์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 16,
    "class_no": 16,
    "student_code": "17839",
    "alt_student_code": "17839",
    "prefix": "นาย",
    "first_name": "ชัยชนะ",
    "last_name": "จางยอดมณีสยาม",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 17,
    "class_no": 17,
    "student_code": "17861",
    "alt_student_code": "17861",
    "prefix": "นาย",
    "first_name": "ถิรวุฒิ",
    "last_name": "ไมตรี",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 18,
    "class_no": 18,
    "student_code": "17864",
    "alt_student_code": "17864",
    "prefix": "เด็กชาย",
    "first_name": "ธนวัฒน์",
    "last_name": "บริบูรณ์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 19,
    "class_no": 19,
    "student_code": "17867",
    "alt_student_code": "17867",
    "prefix": "เด็กชาย",
    "first_name": "ธนภัทร",
    "last_name": "ดวงเดช",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 20,
    "class_no": 20,
    "student_code": "16994",
    "alt_student_code": "16994",
    "prefix": "เด็กหญิง",
    "first_name": "ชุติกาญจน์",
    "last_name": "วงศ์ชัย",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 21,
    "class_no": 21,
    "student_code": "16995",
    "alt_student_code": "16995",
    "prefix": "เด็กหญิง",
    "first_name": "ณัฐธิดา",
    "last_name": "บุญหนัก",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 22,
    "class_no": 22,
    "student_code": "16996",
    "alt_student_code": "16996",
    "prefix": "เด็กหญิง",
    "first_name": "ณัฐธิดา",
    "last_name": "ไชยลังการ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 23,
    "class_no": 23,
    "student_code": "16997",
    "alt_student_code": "16997",
    "prefix": "เด็กหญิง",
    "first_name": "ธิดาวัน",
    "last_name": "ปูหมื่อ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 24,
    "class_no": 24,
    "student_code": "16998",
    "alt_student_code": "16998",
    "prefix": "เด็กหญิง",
    "first_name": "บุญนารี",
    "last_name": "บุตรดี",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 25,
    "class_no": 25,
    "student_code": "16999",
    "alt_student_code": "16999",
    "prefix": "เด็กหญิง",
    "first_name": "ลลิตา",
    "last_name": "อินตะนัย",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 26,
    "class_no": 26,
    "student_code": "17000",
    "alt_student_code": "17000",
    "prefix": "เด็กหญิง",
    "first_name": "วิชญาดา",
    "last_name": "คำหล้า",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 27,
    "class_no": 27,
    "student_code": "17002",
    "alt_student_code": "17002",
    "prefix": "เด็กหญิง",
    "first_name": "อนุธิดา",
    "last_name": "ทับสระน้อย",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 28,
    "class_no": 28,
    "student_code": "17502",
    "alt_student_code": "17502",
    "prefix": "เด็กหญิง",
    "first_name": "ดารา",
    "last_name": "ยอดตระกูลลี",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 29,
    "class_no": 29,
    "student_code": "17526",
    "alt_student_code": "17526",
    "prefix": "เด็กหญิง",
    "first_name": "จันทวรรณ",
    "last_name": "วิวัฒน์วิทยา",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 30,
    "class_no": 30,
    "student_code": "17835",
    "alt_student_code": "17835",
    "prefix": "เด็กหญิง",
    "first_name": "ชนิดา",
    "last_name": "เมืองใจ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 31,
    "class_no": 31,
    "student_code": "17837",
    "alt_student_code": "17837",
    "prefix": "เด็กหญิง",
    "first_name": "ญานิศา",
    "last_name": "วิงวอน",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 32,
    "class_no": 32,
    "student_code": "17838",
    "alt_student_code": "17838",
    "prefix": "เด็กหญิง",
    "first_name": "รุ้งรดา",
    "last_name": "ภูชะธง",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 33,
    "class_no": 33,
    "student_code": "17842",
    "alt_student_code": "17842",
    "prefix": "เด็กหญิง",
    "first_name": "ชยุดา",
    "last_name": "รุ่งวานิช",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "4",
    "no": 34,
    "class_no": 34,
    "student_code": "17854",
    "alt_student_code": "17854",
    "prefix": "เด็กหญิง",
    "first_name": "จารุณี",
    "last_name": "ชัยศิริราษฎร์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 1,
    "class_no": 1,
    "student_code": "16621",
    "alt_student_code": "16621",
    "prefix": "นาย",
    "first_name": "ธนภัทร",
    "last_name": "จันทรา",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 2,
    "class_no": 2,
    "student_code": "17003",
    "alt_student_code": "17003",
    "prefix": "เด็กชาย",
    "first_name": "ณัฐพล",
    "last_name": "คำตั๋น",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 3,
    "class_no": 3,
    "student_code": "17007",
    "alt_student_code": "17007",
    "prefix": "เด็กชาย",
    "first_name": "บรรชา",
    "last_name": "แซ่ย้าง",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 4,
    "class_no": 4,
    "student_code": "17009",
    "alt_student_code": "17009",
    "prefix": "เด็กชาย",
    "first_name": "ภูริวัฒน์",
    "last_name": "ไข่แก้ว",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 5,
    "class_no": 5,
    "student_code": "17010",
    "alt_student_code": "17010",
    "prefix": "เด็กชาย",
    "first_name": "ยุทธภูมิ",
    "last_name": "สมทวีชัยเลิศ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 6,
    "class_no": 6,
    "student_code": "17011",
    "alt_student_code": "17011",
    "prefix": "เด็กชาย",
    "first_name": "สมชาติ",
    "last_name": "แซ่เท่า",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 7,
    "class_no": 7,
    "student_code": "17141",
    "alt_student_code": "17141",
    "prefix": "นาย",
    "first_name": "พงศ์พิเชษฐ์",
    "last_name": "พารุ่งตระกูล",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 8,
    "class_no": 8,
    "student_code": "17142",
    "alt_student_code": "17142",
    "prefix": "นาย",
    "first_name": "กิตติคุณ",
    "last_name": "กอละ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 9,
    "class_no": 9,
    "student_code": "17498",
    "alt_student_code": "17498",
    "prefix": "เด็กชาย",
    "first_name": "นฤเบศวร์",
    "last_name": "วิเศษ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 10,
    "class_no": 10,
    "student_code": "17012",
    "alt_student_code": "17012",
    "prefix": "นางสาว",
    "first_name": "กรรณิการ์",
    "last_name": "กาเหว่า",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 11,
    "class_no": 11,
    "student_code": "17013",
    "alt_student_code": "17013",
    "prefix": "นางสาว",
    "first_name": "กัญณิษา",
    "last_name": "บุญทวี",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 12,
    "class_no": 12,
    "student_code": "17014",
    "alt_student_code": "17014",
    "prefix": "เด็กหญิง",
    "first_name": "ณัทธภัทร",
    "last_name": "ชยาภัทรเจริญ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 13,
    "class_no": 13,
    "student_code": "17015",
    "alt_student_code": "17015",
    "prefix": "เด็กหญิง",
    "first_name": "นันทร์นภัส",
    "last_name": "กันทานันท์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 14,
    "class_no": 14,
    "student_code": "17016",
    "alt_student_code": "17016",
    "prefix": "นางสาว",
    "first_name": "รัญธิดา",
    "last_name": "วงศ์งาม",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 15,
    "class_no": 15,
    "student_code": "17017",
    "alt_student_code": "17017",
    "prefix": "นางสาว",
    "first_name": "รุ่งนภา",
    "last_name": "บุญทา",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 16,
    "class_no": 16,
    "student_code": "17018",
    "alt_student_code": "17018",
    "prefix": "เด็กหญิง",
    "first_name": "ลภัสรดา",
    "last_name": "ไชยราช",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 17,
    "class_no": 17,
    "student_code": "17021",
    "alt_student_code": "17021",
    "prefix": "เด็กหญิง",
    "first_name": "อินธิวา",
    "last_name": "แซ่เจียง",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 18,
    "class_no": 18,
    "student_code": "17147",
    "alt_student_code": "17147",
    "prefix": "เด็กหญิง",
    "first_name": "ศุภิสรา",
    "last_name": "ทรงศักดิ์ลือชัย",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 19,
    "class_no": 19,
    "student_code": "17152",
    "alt_student_code": "17152",
    "prefix": "นางสาว",
    "first_name": "ชรัณยา",
    "last_name": "พรหมหาญ",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 20,
    "class_no": 20,
    "student_code": "17157",
    "alt_student_code": "17157",
    "prefix": "เด็กหญิง",
    "first_name": "พุทธิพิชชรณ์",
    "last_name": "ติ๊บศรีบุตร",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.3",
    "room": "5",
    "no": 21,
    "class_no": 21,
    "student_code": "17506",
    "alt_student_code": "17506",
    "prefix": "นางสาว",
    "first_name": "ศุภรดา",
    "last_name": "สกลศรีศักดิ์",
    "source_file": "23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx (Sheet ม.3)"
  },
  {
    "level": "ม.4",
    "room": "7",
    "no": 1,
    "class_no": 13,
    "student_code": "16596",
    "alt_student_code": "17453",
    "prefix": "นาย",
    "first_name": "พิษณุ",
    "last_name": "สาลี",
    "source_file": "ใบเช็คชื่อ ม4-7 วิชา การจัดดอกไม้.xlsx (ง31202)"
  },
  {
    "level": "ม.4",
    "room": "7",
    "no": 2,
    "class_no": 14,
    "student_code": "16623",
    "alt_student_code": "17462",
    "prefix": "นาย",
    "first_name": "ปัญญา",
    "last_name": "ขวัญไกรคีรี",
    "source_file": "ใบเช็คชื่อ ม4-7 วิชา การจัดดอกไม้.xlsx (ง31202)"
  },
  {
    "level": "ม.4",
    "room": "7",
    "no": 3,
    "class_no": 15,
    "student_code": "17821",
    "alt_student_code": "17465",
    "prefix": "นาย",
    "first_name": "ชยกร",
    "last_name": "แน่งน้อย",
    "source_file": "ใบเช็คชื่อ ม4-7 วิชา การจัดดอกไม้.xlsx (ง31202)"
  },
  {
    "level": "ม.4",
    "room": "7",
    "no": 4,
    "class_no": 16,
    "student_code": "17822",
    "alt_student_code": "17466",
    "prefix": "นาย",
    "first_name": "ฐิติพงษ์",
    "last_name": "วงศ์ชัย",
    "source_file": "ใบเช็คชื่อ ม4-7 วิชา การจัดดอกไม้.xlsx (ง31202)"
  },
  {
    "level": "ม.4",
    "room": "7",
    "no": 5,
    "class_no": 17,
    "student_code": "17823",
    "alt_student_code": "16384",
    "prefix": "นาย",
    "first_name": "ธนภูมิ",
    "last_name": "ช่างตี",
    "source_file": "ใบเช็คชื่อ ม4-7 วิชา การจัดดอกไม้.xlsx (ง31202)"
  },
  {
    "level": "ม.4",
    "room": "7",
    "no": 6,
    "class_no": 18,
    "student_code": "17830",
    "alt_student_code": "16431",
    "prefix": "นาย",
    "first_name": "กฤษฎา",
    "last_name": "ทรัพย์เมธาสกุล",
    "source_file": "ใบเช็คชื่อ ม4-7 วิชา การจัดดอกไม้.xlsx (ง31202)"
  },
  {
    "level": "ม.4",
    "room": "7",
    "no": 7,
    "class_no": 19,
    "student_code": "17845",
    "alt_student_code": "16436",
    "prefix": "นาย",
    "first_name": "สุเมธ",
    "last_name": "แซ่ย่าง",
    "source_file": "ใบเช็คชื่อ ม4-7 วิชา การจัดดอกไม้.xlsx (ง31202)"
  },
  {
    "level": "ม.4",
    "room": "7",
    "no": 8,
    "class_no": 20,
    "student_code": "16630",
    "alt_student_code": "16439",
    "prefix": "นางสาว",
    "first_name": "กรรณิกา",
    "last_name": "ไชยทน",
    "source_file": "ใบเช็คชื่อ ม4-7 วิชา การจัดดอกไม้.xlsx (ง31202)"
  },
  {
    "level": "ม.4",
    "room": "7",
    "no": 9,
    "class_no": 23,
    "student_code": "17824",
    "alt_student_code": "16467",
    "prefix": "นางสาว",
    "first_name": "เกตุสุดา",
    "last_name": "แทนสมบัติ",
    "source_file": "ใบเช็คชื่อ ม4-7 วิชา การจัดดอกไม้.xlsx (ง31202)"
  },
  {
    "level": "ม.4",
    "room": "7",
    "no": 10,
    "class_no": 24,
    "student_code": "17825",
    "alt_student_code": "16835",
    "prefix": "เด็กหญิง",
    "first_name": "ขวัญชนก",
    "last_name": "สุขบัวบาน",
    "source_file": "ใบเช็คชื่อ ม4-7 วิชา การจัดดอกไม้.xlsx (ง31202)"
  },
  {
    "level": "ม.4",
    "room": "7",
    "no": 11,
    "class_no": 25,
    "student_code": "17826",
    "alt_student_code": "17467",
    "prefix": "นางสาว",
    "first_name": "ณิชยา",
    "last_name": "แซ่ย่าง",
    "source_file": "ใบเช็คชื่อ ม4-7 วิชา การจัดดอกไม้.xlsx (ง31202)"
  },
  {
    "level": "ม.4",
    "room": "7",
    "no": 12,
    "class_no": 26,
    "student_code": "17827",
    "alt_student_code": "17468",
    "prefix": "นางสาว",
    "first_name": "ปภาวรินทร์",
    "last_name": "อิ่นแก้ว",
    "source_file": "ใบเช็คชื่อ ม4-7 วิชา การจัดดอกไม้.xlsx (ง31202)"
  },
  {
    "level": "ม.4",
    "room": "7",
    "no": 13,
    "class_no": 27,
    "student_code": "17828",
    "alt_student_code": "17469",
    "prefix": "นางสาว",
    "first_name": "ปานตะวัน",
    "last_name": "สุริยกระจ่าง",
    "source_file": "ใบเช็คชื่อ ม4-7 วิชา การจัดดอกไม้.xlsx (ง31202)"
  },
  {
    "level": "ม.4",
    "room": "7",
    "no": 14,
    "class_no": 28,
    "student_code": "17829",
    "alt_student_code": "17470",
    "prefix": "นางสาว",
    "first_name": "พรนัชชา",
    "last_name": "ปันติ",
    "source_file": "ใบเช็คชื่อ ม4-7 วิชา การจัดดอกไม้.xlsx (ง31202)"
  },
  {
    "level": "ม.4",
    "room": "7",
    "no": 15,
    "class_no": 29,
    "student_code": "17865",
    "alt_student_code": "17471",
    "prefix": "นางสาว",
    "first_name": "ดวงกมล",
    "last_name": "แซ่ฟุ้ง",
    "source_file": "ใบเช็คชื่อ ม4-7 วิชา การจัดดอกไม้.xlsx (ง31202)"
  },
  {
    "level": "ม.5",
    "room": "7",
    "no": 1,
    "class_no": 23,
    "student_code": "17453",
    "alt_student_code": "17453",
    "prefix": "นาย",
    "first_name": "ธนาวิรากร",
    "last_name": "พิชัยยา",
    "source_file": "ใบเช็คชื่อ ม5-7 อาหารพื้นบ้าน.xlsx (ง32202)"
  },
  {
    "level": "ม.5",
    "room": "7",
    "no": 2,
    "class_no": 24,
    "student_code": "17462",
    "alt_student_code": "17462",
    "prefix": "นาย",
    "first_name": "ชนะกิจ",
    "last_name": "แดงประดับ",
    "source_file": "ใบเช็คชื่อ ม5-7 อาหารพื้นบ้าน.xlsx (ง32202)"
  },
  {
    "level": "ม.5",
    "room": "7",
    "no": 3,
    "class_no": 25,
    "student_code": "17465",
    "alt_student_code": "17465",
    "prefix": "นาย",
    "first_name": "รัชเดช",
    "last_name": "ศิริเทพ",
    "source_file": "ใบเช็คชื่อ ม5-7 อาหารพื้นบ้าน.xlsx (ง32202)"
  },
  {
    "level": "ม.5",
    "room": "7",
    "no": 4,
    "class_no": 26,
    "student_code": "17466",
    "alt_student_code": "17466",
    "prefix": "นาย",
    "first_name": "สิทธิศักดิ์",
    "last_name": "ศรีสวัสดิ์",
    "source_file": "ใบเช็คชื่อ ม5-7 อาหารพื้นบ้าน.xlsx (ง32202)"
  },
  {
    "level": "ม.5",
    "room": "7",
    "no": 5,
    "class_no": 27,
    "student_code": "16384",
    "alt_student_code": "16384",
    "prefix": "นางสาว",
    "first_name": "กัลยา",
    "last_name": "เพ็งอ่อนตา",
    "source_file": "ใบเช็คชื่อ ม5-7 อาหารพื้นบ้าน.xlsx (ง32202)"
  },
  {
    "level": "ม.5",
    "room": "7",
    "no": 6,
    "class_no": 28,
    "student_code": "16431",
    "alt_student_code": "16431",
    "prefix": "นางสาว",
    "first_name": "ปริยากร",
    "last_name": "ศรีสุระ",
    "source_file": "ใบเช็คชื่อ ม5-7 อาหารพื้นบ้าน.xlsx (ง32202)"
  },
  {
    "level": "ม.5",
    "room": "7",
    "no": 7,
    "class_no": 29,
    "student_code": "16436",
    "alt_student_code": "16436",
    "prefix": "นางสาว",
    "first_name": "รัตติกาล",
    "last_name": "เชอร์แลน",
    "source_file": "ใบเช็คชื่อ ม5-7 อาหารพื้นบ้าน.xlsx (ง32202)"
  },
  {
    "level": "ม.5",
    "room": "7",
    "no": 8,
    "class_no": 30,
    "student_code": "16439",
    "alt_student_code": "16439",
    "prefix": "นางสาว",
    "first_name": "ศศินิภา",
    "last_name": "สันทรักษ์",
    "source_file": "ใบเช็คชื่อ ม5-7 อาหารพื้นบ้าน.xlsx (ง32202)"
  },
  {
    "level": "ม.5",
    "room": "7",
    "no": 9,
    "class_no": 31,
    "student_code": "16467",
    "alt_student_code": "16467",
    "prefix": "นางสาว",
    "first_name": "นาดี",
    "last_name": "บาหลา",
    "source_file": "ใบเช็คชื่อ ม5-7 อาหารพื้นบ้าน.xlsx (ง32202)"
  },
  {
    "level": "ม.5",
    "room": "7",
    "no": 10,
    "class_no": 32,
    "student_code": "17467",
    "alt_student_code": "17467",
    "prefix": "นางสาว",
    "first_name": "คันธนีรา",
    "last_name": "ลือเลิศ",
    "source_file": "ใบเช็คชื่อ ม5-7 อาหารพื้นบ้าน.xlsx (ง32202)"
  },
  {
    "level": "ม.5",
    "room": "7",
    "no": 11,
    "class_no": 33,
    "student_code": "17468",
    "alt_student_code": "17468",
    "prefix": "นางสาว",
    "first_name": "จันทิมา",
    "last_name": "กุเลา",
    "source_file": "ใบเช็คชื่อ ม5-7 อาหารพื้นบ้าน.xlsx (ง32202)"
  },
  {
    "level": "ม.5",
    "room": "7",
    "no": 12,
    "class_no": 34,
    "student_code": "17469",
    "alt_student_code": "17469",
    "prefix": "นางสาว",
    "first_name": "พัชราพร",
    "last_name": "ปงลังกา",
    "source_file": "ใบเช็คชื่อ ม5-7 อาหารพื้นบ้าน.xlsx (ง32202)"
  },
  {
    "level": "ม.5",
    "room": "7",
    "no": 13,
    "class_no": 35,
    "student_code": "17470",
    "alt_student_code": "17470",
    "prefix": "นางสาว",
    "first_name": "วิรากานต์",
    "last_name": "วงค์ผา",
    "source_file": "ใบเช็คชื่อ ม5-7 อาหารพื้นบ้าน.xlsx (ง32202)"
  },
  {
    "level": "ม.5",
    "room": "7",
    "no": 14,
    "class_no": 36,
    "student_code": "17471",
    "alt_student_code": "17471",
    "prefix": "นางสาว",
    "first_name": "ศิริรัตน์",
    "last_name": "ศักดิ์สิทธิ์",
    "source_file": "ใบเช็คชื่อ ม5-7 อาหารพื้นบ้าน.xlsx (ง32202)"
  },
  {
    "level": "ม.5",
    "room": "7",
    "no": 15,
    "class_no": 37,
    "student_code": "17472",
    "alt_student_code": "17472",
    "prefix": "นางสาว",
    "first_name": "สรียา",
    "last_name": "บาลาง",
    "source_file": "ใบเช็คชื่อ ม5-7 อาหารพื้นบ้าน.xlsx (ง32202)"
  },
  {
    "level": "ม.5",
    "room": "7",
    "no": 16,
    "class_no": 38,
    "student_code": "17473",
    "alt_student_code": "17473",
    "prefix": "นางสาว",
    "first_name": "อภิญญา",
    "last_name": "ผูกพันธ์",
    "source_file": "ใบเช็คชื่อ ม5-7 อาหารพื้นบ้าน.xlsx (ง32202)"
  },
  {
    "level": "ม.6",
    "room": "7",
    "no": 1,
    "class_no": 24,
    "student_code": "16064",
    "alt_student_code": "16064",
    "prefix": "นาย",
    "first_name": "ธฤตญาณ",
    "last_name": "แซ่เฒ่า",
    "source_file": "ใบเช็คชื่อ ม6-7 เบเกอรี่เบื้องต้น.xlsx (ง33203)"
  },
  {
    "level": "ม.6",
    "room": "7",
    "no": 2,
    "class_no": 25,
    "student_code": "16067",
    "alt_student_code": "16067",
    "prefix": "นาย",
    "first_name": "ปิติรัฐ",
    "last_name": "แซ่ย่าง",
    "source_file": "ใบเช็คชื่อ ม6-7 เบเกอรี่เบื้องต้น.xlsx (ง33203)"
  },
  {
    "level": "ม.6",
    "room": "7",
    "no": 3,
    "class_no": 26,
    "student_code": "16074",
    "alt_student_code": "16074",
    "prefix": "นาย",
    "first_name": "ศุภกร",
    "last_name": "ใจผ่อง",
    "source_file": "ใบเช็คชื่อ ม6-7 เบเกอรี่เบื้องต้น.xlsx (ง33203)"
  },
  {
    "level": "ม.6",
    "room": "7",
    "no": 4,
    "class_no": 27,
    "student_code": "16075",
    "alt_student_code": "16075",
    "prefix": "นาย",
    "first_name": "สิทธิชัย",
    "last_name": "แซ่เจียง",
    "source_file": "ใบเช็คชื่อ ม6-7 เบเกอรี่เบื้องต้น.xlsx (ง33203)"
  },
  {
    "level": "ม.6",
    "room": "7",
    "no": 5,
    "class_no": 28,
    "student_code": "16215",
    "alt_student_code": "16215",
    "prefix": "นาย",
    "first_name": "ภาสกร",
    "last_name": "ชำนาญการ",
    "source_file": "ใบเช็คชื่อ ม6-7 เบเกอรี่เบื้องต้น.xlsx (ง33203)"
  },
  {
    "level": "ม.6",
    "room": "7",
    "no": 6,
    "class_no": 29,
    "student_code": "16787",
    "alt_student_code": "16787",
    "prefix": "นาย",
    "first_name": "โกวิท",
    "last_name": "แซ่ซ้ง",
    "source_file": "ใบเช็คชื่อ ม6-7 เบเกอรี่เบื้องต้น.xlsx (ง33203)"
  },
  {
    "level": "ม.6",
    "room": "7",
    "no": 7,
    "class_no": 30,
    "student_code": "17130",
    "alt_student_code": "17130",
    "prefix": "นาย",
    "first_name": "กิตติธัช",
    "last_name": "ศิริเทพ",
    "source_file": "ใบเช็คชื่อ ม6-7 เบเกอรี่เบื้องต้น.xlsx (ง33203)"
  },
  {
    "level": "ม.6",
    "room": "7",
    "no": 8,
    "class_no": 31,
    "student_code": "17131",
    "alt_student_code": "17131",
    "prefix": "นาย",
    "first_name": "ปรุฬห์",
    "last_name": "จูฑะสกุล",
    "source_file": "ใบเช็คชื่อ ม6-7 เบเกอรี่เบื้องต้น.xlsx (ง33203)"
  },
  {
    "level": "ม.6",
    "room": "7",
    "no": 9,
    "class_no": 32,
    "student_code": "17132",
    "alt_student_code": "17132",
    "prefix": "นาย",
    "first_name": "พงศกร",
    "last_name": "พุทธิมา",
    "source_file": "ใบเช็คชื่อ ม6-7 เบเกอรี่เบื้องต้น.xlsx (ง33203)"
  },
  {
    "level": "ม.6",
    "room": "7",
    "no": 10,
    "class_no": 33,
    "student_code": "17134",
    "alt_student_code": "17134",
    "prefix": "นาย",
    "first_name": "อนุสิทธิ์",
    "last_name": "แซ่ลี",
    "source_file": "ใบเช็คชื่อ ม6-7 เบเกอรี่เบื้องต้น.xlsx (ง33203)"
  },
  {
    "level": "ม.6",
    "room": "7",
    "no": 11,
    "class_no": 34,
    "student_code": "17513",
    "alt_student_code": "17513",
    "prefix": "นาย",
    "first_name": "ธนกฤต",
    "last_name": "แก้วหลวง",
    "source_file": "ใบเช็คชื่อ ม6-7 เบเกอรี่เบื้องต้น.xlsx (ง33203)"
  },
  {
    "level": "ม.6",
    "room": "7",
    "no": 12,
    "class_no": 35,
    "student_code": "16078",
    "alt_student_code": "16078",
    "prefix": "นางสาว",
    "first_name": "กชกร",
    "last_name": "ทรงสิทธิเจริญ",
    "source_file": "ใบเช็คชื่อ ม6-7 เบเกอรี่เบื้องต้น.xlsx (ง33203)"
  },
  {
    "level": "ม.6",
    "room": "7",
    "no": 13,
    "class_no": 36,
    "student_code": "16086",
    "alt_student_code": "16086",
    "prefix": "นางสาว",
    "first_name": "ธิดารัตน์",
    "last_name": "แซ่ท่อ",
    "source_file": "ใบเช็คชื่อ ม6-7 เบเกอรี่เบื้องต้น.xlsx (ง33203)"
  },
  {
    "level": "ม.6",
    "room": "7",
    "no": 14,
    "class_no": 37,
    "student_code": "16089",
    "alt_student_code": "16089",
    "prefix": "นางสาว",
    "first_name": "ประกายกานต์",
    "last_name": "จางวงศ์เจริญ",
    "source_file": "ใบเช็คชื่อ ม6-7 เบเกอรี่เบื้องต้น.xlsx (ง33203)"
  },
  {
    "level": "ม.6",
    "room": "7",
    "no": 15,
    "class_no": 38,
    "student_code": "16505",
    "alt_student_code": "16505",
    "prefix": "นางสาว",
    "first_name": "ประภาพร",
    "last_name": "พวีนนท์",
    "source_file": "ใบเช็คชื่อ ม6-7 เบเกอรี่เบื้องต้น.xlsx (ง33203)"
  },
  {
    "level": "ม.6",
    "room": "7",
    "no": 16,
    "class_no": 39,
    "student_code": "17135",
    "alt_student_code": "17135",
    "prefix": "นางสาว",
    "first_name": "สุกัญญา",
    "last_name": "บึงอ้อ",
    "source_file": "ใบเช็คชื่อ ม6-7 เบเกอรี่เบื้องต้น.xlsx (ง33203)"
  }
]

export const M3_OFFICIAL_ROSTER: OfficialRosterEntry[] = ALL_OFFICIAL_ROSTER.filter((r) => r.level === 'ม.3')

export const normalizeLevel = (level?: string | null): string => {
  if (!level) return ''
  const clean = level.trim().replace(/\s+/g, '')
  if (clean === '3' || clean === 'ม.3' || clean === 'มัธยมศึกษาปีที่3') return 'ม.3'
  if (clean === '4' || clean === 'ม.4' || clean === 'มัธยมศึกษาปีที่4') return 'ม.4'
  if (clean === '5' || clean === 'ม.5' || clean === 'มัธยมศึกษาปีที่5') return 'ม.5'
  if (clean === '6' || clean === 'ม.6' || clean === 'มัธยมศึกษาปีที่6') return 'ม.6'
  return clean
}

export const normalizeNameKey = (first?: string | null, last?: string | null): string => {
  return `${String(first || '').trim().replace(/\s+/g, '')}_${String(last || '').trim().replace(/\s+/g, '')}`
}

// เช็คว่าห้องเรียนนี้เป็นห้องที่มีไฟล์ Excel อ้างอิงแล้วหรือไม่ (ม.3/1-5, ม.4/7, ม.5/7, ม.6/7)
export const isTrackedOfficialClassroom = (level?: string | null, room?: string | null): boolean => {
  const normLvl = normalizeLevel(level)
  const normRoom = String(room || '').trim()
  if (normLvl === 'ม.3') return !normRoom || ['1', '2', '3', '4', '5'].includes(normRoom)
  if ((normLvl === 'ม.4' || normLvl === 'ม.5' || normLvl === 'ม.6') && normRoom === '7') return true
  return false
}

// backward-compatible alias
export const isM3Level = (level?: string | null, room?: string | null): boolean => {
  return isTrackedOfficialClassroom(level, room)
}

export const findOfficialRosterEntry = (
  student: {
    student_code?: string | null
    first_name?: string | null
    last_name?: string | null
    classroom?: { level?: string | null; room?: string | null } | null
  },
  contextLevel?: string | null,
  contextRoom?: string | null
): OfficialRosterEntry | null => {
  const code = String(student.student_code || '').trim()
  const nameKey = normalizeNameKey(student.first_name, student.last_name)
  const targetLvl = normalizeLevel(contextLevel || student.classroom?.level)
  const targetRoom = String(contextRoom || student.classroom?.room || '').trim()

  // 1. ค้นหาในห้องเป้าหมายก่อน (เทียบทั้งรหัสประจำตัว และ ชื่อ-สกุล เพื่อรองรับกรณีรหัสในใบเช็คชื่อ ม.4/7 ซ้ำกับ ม.5/7)
  if (targetLvl && targetRoom) {
    const inTargetRoom = ALL_OFFICIAL_ROSTER.find(
      (r) =>
        r.level === targetLvl &&
        r.room === targetRoom &&
        (r.student_code === code || r.alt_student_code === code || (nameKey !== '_' && normalizeNameKey(r.first_name, r.last_name) === nameKey))
    )
    if (inTargetRoom) return inTargetRoom
  }

  // 2. ค้นหาตามชื่อ-สกุลตรงกัน 100%
  if (nameKey !== '_') {
    const byName = ALL_OFFICIAL_ROSTER.find((r) => normalizeNameKey(r.first_name, r.last_name) === nameKey)
    if (byName) return byName
  }

  // 3. ค้นหาตามรหัสประจำตัวจริง
  if (code) {
    const byCode = ALL_OFFICIAL_ROSTER.find((r) => r.student_code === code)
    if (byCode) return byCode
  }

  return null
}

export const M3_ROSTER_BY_CODE = new Map<string, OfficialRosterEntry>(
  ALL_OFFICIAL_ROSTER.map((entry) => [entry.student_code, entry])
)

export const getOfficialRosterListForClassroom = (level?: string | null, room?: string | null): OfficialRosterEntry[] => {
  const normLvl = normalizeLevel(level)
  const normRoom = String(room || '').trim()
  return ALL_OFFICIAL_ROSTER.filter((r) => r.level === normLvl && r.room === normRoom).sort((a, b) => a.no - b.no)
}

export const getM3RosterStatus = (
  student: {
    student_code?: string | null
    first_name?: string | null
    last_name?: string | null
    classroom?: { level?: string | null; room?: string | null } | null
  },
  currentRoomFilter?: string | null,
  currentLevelFilter?: string | null
) => {
  const studentLevel = normalizeLevel(currentLevelFilter || student.classroom?.level)
  const studentRoom = String(currentRoomFilter || student.classroom?.room || '').trim()
  const entry = findOfficialRosterEntry(student, studentLevel, studentRoom)

  if (!entry) {
    return {
      inExcel: false,
      inCorrectRoom: false,
      excelNo: null as number | null,
      excelClassNo: null as number | null,
      excelLevel: null as string | null,
      excelRoom: null as string | null,
      sourceFile: null as string | null,
      entry: null as OfficialRosterEntry | null,
    }
  }

  const inCorrectRoom = (!studentLevel || entry.level === studentLevel) && (!studentRoom || entry.room === studentRoom)
  return {
    inExcel: true,
    inCorrectRoom,
    excelNo: entry.no,
    excelClassNo: entry.class_no,
    excelLevel: entry.level,
    excelRoom: entry.room,
    sourceFile: entry.source_file,
    entry,
  }
}
