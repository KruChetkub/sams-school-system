# พิมพ์เขียวมาตรฐานการพัฒนาระบบดูแลช่วยเหลือนักเรียน (Student Support System) - SAMS Version 15

เอกสารฉบับนี้สรุป **สถานะการพัฒนาที่เสร็จสิ้นแล้วใน V14 และกำหนดทิศทางการพัฒนาต่อในเวอร์ชัน 15** เพื่อเป็นแนวทางอ้างอิงสำหรับทีมพัฒนา โดยครอบคลุมระบบคัดกรองพฤติกรรม (SDQ), ความฉลาดทางอารมณ์ (EQ), รายงานสามเส้า (Triangulation), แดชบอร์ดห้องเรียน (Advisor Dashboard) และฟีเจอร์ใหม่ที่วางแผนสำหรับ V15

---

## สรุปสถานะการพัฒนา V14 (Completed ✅)

### Phase 1 — Core Logic & Service Layer (studentSupportService.ts)

**ไฟล์หลัก**: `src/services/studentsupport/studentSupportService.ts`

#### ✅ 1.1 EqAssessment Interface — V14 Dimension Fields
เพิ่ม field คะแนนรายมิติ EQ ตามมาตรฐานกรมสุขภาพจิต:

```typescript
export interface EqAssessment {
  // ... existing fields ...
  goodness_score?: number;    // ด้านดี (20 ข้อ, เต็ม 80): ปกติ 48–59
  competence_score?: number;  // ด้านเก่ง (18 ข้อ, เต็ม 72): ปกติ 43–52
  happiness_score?: number;   // ด้านสุข (14 ข้อ, เต็ม 56): ปกติ 48–57
  goodness_level?: 'NORMAL' | 'LOWER_THAN_NORMAL' | 'HIGHER_THAN_NORMAL';
  competence_level?: 'NORMAL' | 'LOWER_THAN_NORMAL' | 'HIGHER_THAN_NORMAL';
  happiness_level?: 'NORMAL' | 'LOWER_THAN_NORMAL' | 'HIGHER_THAN_NORMAL';
}
```

#### ✅ 1.2 calculateEqScore() — เกณฑ์ V14 (139–168)
ฟังก์ชันคำนวณคะแนน EQ ทั้งรวมและรายมิติ:
- เกณฑ์รวม: `< 139` = ต่ำกว่าปกติ | `139–168` = ปกติ | `> 168` = สูงกว่าปกติ
- จัดกลุ่มข้อ: ด้านดี (ข้อ 1–20), ด้านเก่ง (ข้อ 21–38), ด้านสุข (ข้อ 39–52)

#### ✅ 1.3 recalculateAllEqScores()
ฟังก์ชัน Backfill สำหรับ record เก่าที่ยังไม่มี dimension scores — ดึงทุก record จาก `student_support_eq` แล้วคำนวณใหม่และ update

#### ✅ 1.4 getClassroomSdqDashboard()
Query รวม SDQ ระดับห้องเรียนพร้อม `result_difficulties`, dimension scores และ student info

#### ✅ 1.5 getClassroomScreeningProgress()
นับ screened vs unscreened แยกตาม evaluator_type สำหรับ Center Donut Label

---

### Phase 2 — Student360.tsx: SDQ/EQ Donut Charts + Triangulation

**ไฟล์หลัก**: `src/pages/studentsupport/Student360.tsx`

#### ✅ 2.1 Helper Functions (Module-level — ไม่อยู่ใน Component)

```typescript
// คำนวณระดับรายมิติ SDQ แยกตามประเภทผู้ประเมิน
const getSdqDimLevel = (score, dim, evalType): 'NORMAL'|'RISK'|'PROBLEM'

// แปลงระดับเป็นรหัสสี
const getLvColor = (lv): string  // #10b981 | #f59e0b | #ef4444

// แปลงระดับ EQ เป็นรหัสสี
const getEqLvColor = (lv): string  // #ef4444 | #8b5cf6 | #10b981

// สร้างรายการ Intervention Points
const generateSdqWeaknesses = (sdq, evalType): { dim, icon, text }[]
```

**เกณฑ์ SDQ รายมิติ (ฝังใน getSdqDimLevel)**:
| ผู้ประเมิน | อารมณ์ | เกเร | สมาธิ | เพื่อน |
|:---|:---:|:---:|:---:|:---:|
| STUDENT | Risk≥6, Prob≥7 | Risk≥5, Prob≥6 | Risk≥6, Prob≥7 | Risk≥4, Prob≥5 |
| TEACHER | Risk≥4, Prob≥5 | Risk≥4, Prob≥5 | Risk≥6, Prob≥7 | Risk≥6, Prob≥7 |
| PARENT | Risk≥4, Prob≥5 | Risk≥4, Prob≥5 | Risk≥6, Prob≥7 | Risk≥6, Prob≥7 |

#### ✅ 2.2 ตัวแปรใน Component (หลัง profile destructuring)

```typescript
// แยก SDQ ตามผู้ประเมิน
const teacherSdq = sdq?.find(s => s.evaluator_type === 'TEACHER') ?? null;
const studentSdq = sdq?.find(s => s.evaluator_type === 'STUDENT') ?? null;
const parentSdq  = sdq?.find(s => s.evaluator_type === 'PARENT')  ?? null;
const primarySdq = teacherSdq ?? studentSdq ?? parentSdq ?? null;
const primaryEvalType: 'STUDENT'|'TEACHER'|'PARENT' = ...;

// Donut Data
const sdqDonutData = [...5 slices with actualScore + color...]
const eqDonutData  = [...3 or 1 slice depending on goodness_score != null...]
const triWeaknesses = generateSdqWeaknesses(primarySdq, primaryEvalType);
```

#### ✅ 2.3 SDQ_EQ Tab — 4 Sections

**Section 1: Assessment Status Cards (3 ชุดผู้ประเมิน)**
- Card สำหรับ TEACHER 👨‍🏫 / STUDENT 🎒 / PARENT 👨‍👩‍👧
- กรณีประเมินแล้ว: แสดง badge ผล + วันที่
- กรณียังไม่ประเมิน: ปุ่ม `navigate('/studentsupport/sdq/{id}?type=TYPE')`

**Section 2: SDQ Donut Chart (Recharts PieChart)**
- `innerRadius=80, outerRadius=120, paddingAngle=3`
- 5 Slices: อารมณ์/เกเร/สมาธิ/เพื่อน/สัมพันธภาพ (color by level)
- Center overlay: คะแนนรวม + level badge
- Custom Tooltip: `payload[0].payload.actualScore` (ป้องกัน 0-value ใช้ Math.max(score, 0.5))
- ด้านขวา: Progress bars รายมิติ + level badge

**Section 3: EQ Donut Chart**
- 3 Slices (ด้านดี/เก่ง/สุข) ถ้า `goodness_score != null`
- 1 Slice (EQ รวม) ถ้า goodness_score = null (ยังไม่ recalculate)
- Center overlay: total_score/208 + level
- ด้านขวา: Progress bars รายมิติ + normal range reference

**Section 4: Triangulation Report**
- จุดแข็ง: ข้อความจาก prosocial_score >= 4
- Intervention Points: loop ผ่าน `triWeaknesses` array
- กรณีไม่มีปัญหา: แสดง "✅ ไม่พบพฤติกรรมที่ต้องการการช่วยเหลือพิเศษ"

---

### Phase 3 — AdvisorDashboard.tsx: Classroom Charts

**ไฟล์หลัก**: `src/pages/studentsupport/AdvisorDashboard.tsx`

#### ✅ 3.1 State เพิ่มเติม

```typescript
const [riskFilter, setRiskFilter] = useState<string | null>(null);
```

#### ✅ 3.2 Computed Variables (จาก students state ที่มีอยู่แล้ว)

```typescript
// Risk Donut (กรองเฉพาะที่ value > 0)
const riskDonutData = [
  { name: 'ปกติ',        value: normalStudents.length,  key: 'NORMAL',  color: '#10b981' },
  { name: 'เฝ้าระวัง',   value: monitorStudents.length, key: 'MONITOR', color: '#eab308' },
  { name: 'กลุ่มเสี่ยง', value: riskStudents.length,    key: 'RISK',    color: '#f97316' },
  { name: 'ช่วยเหลือด่วน',value: urgentStudents.length, key: 'URGENT',  color: '#ef4444' },
].filter(d => d.value > 0);

// SDQ Stacked Bar (คำนวณจาก students.student_support_sdq[])
const sdqStackedData = sdqDimLabels.map(({ key, th }) => {
  // นับ normal/risk/problem พร้อม name arrays สำหรับ Tooltip
  return { dim: th, ปกติ: n, เสี่ยง: r, 'มีปัญหา': p, normalNames, riskNames, problemNames };
});
```

#### ✅ 3.3 V14 Charts Row (5-column grid)

```
┌─────────────────────────┬──────────────────────────────────────┐
│   Risk Donut (2/5)      │   SDQ 5-Dim Stacked Bar (3/5)        │
│ • Clickable slices      │ • Horizontal BarChart (Recharts)     │
│ • Center: X/Y คัดกรอง  │ • Custom Tooltip: ชื่อนักเรียน      │
│ • Legend: toggle filter │ • Legend: ปกติ/เสี่ยง/มีปัญหา        │
└─────────────────────────┴──────────────────────────────────────┘
```

#### ✅ 3.4 Drill-down Interaction
- คลิก Donut slice หรือ Legend → `setRiskFilter(key)`
- Column cards แสดงขอบสีตาม active filter
- Section header แสดง badge "กรอง: ปกติ/เสี่ยง/..."
- ปุ่ม "ล้างตัวกรอง" (X) ทั้งใน Donut card และ section header

---

## SQL Migration ที่ต้องรันบน Supabase

เพื่อรองรับ EQ dimension scores ใน V14 ให้รัน SQL ต่อไปนี้บน Supabase Dashboard:

```sql
-- เพิ่ม EQ dimension columns (ถ้ายังไม่มี)
ALTER TABLE student_support_eq
  ADD COLUMN IF NOT EXISTS goodness_score    INTEGER,
  ADD COLUMN IF NOT EXISTS competence_score  INTEGER,
  ADD COLUMN IF NOT EXISTS happiness_score   INTEGER,
  ADD COLUMN IF NOT EXISTS goodness_level    TEXT CHECK (goodness_level IN ('NORMAL','LOWER_THAN_NORMAL','HIGHER_THAN_NORMAL')),
  ADD COLUMN IF NOT EXISTS competence_level  TEXT CHECK (competence_level IN ('NORMAL','LOWER_THAN_NORMAL','HIGHER_THAN_NORMAL')),
  ADD COLUMN IF NOT EXISTS happiness_level   TEXT CHECK (happiness_level IN ('NORMAL','LOWER_THAN_NORMAL','HIGHER_THAN_NORMAL'));

-- Backfill: เรียก recalculateAllEqScores() ผ่าน browser console หรือ admin route
```

---

## โครงสร้างไฟล์ที่แก้ไขใน V14

```
frontend/src/
├── services/studentsupport/
│   └── studentSupportService.ts    ← Phase 1: EQ interface + calculateEqScore + helpers
├── pages/studentsupport/
│   ├── Student360.tsx              ← Phase 2: Donut Charts + Triangulation
│   └── AdvisorDashboard.tsx        ← Phase 3: Classroom Risk Donut + SDQ Stacked Bar
└── components/studentsupport/
    └── StudentSupportLayout.tsx    ← Minor: whitespace cleanup + text-xs fix
```

**Dependencies เพิ่ม**:
```bash
npm install recharts@3.8.1
```

---

## แผนพัฒนา V15 — ฟีเจอร์ที่ยังขาด

### 🔴 Priority 1 — ฟีเจอร์ที่จำเป็นเร่งด่วน

#### V15.1 SDQ Form — Auto-Sequential Flow (SdqForm.tsx)
ตาม V14 Section 2.2 ยังไม่ได้ implement sequential navigation:

```
ครูประเมิน → [บันทึก] → สลับ ?type=STUDENT อัตโนมัติใน 2.2 วินาที
                 ↓
นักเรียนประเมิน → [บันทึก] → สลับ ?type=PARENT
                 ↓
ผู้ปกครองประเมิน → [บันทึก] → navigate('/profile/{id}', { state: { activeTab: 'SDQ_EQ' } })
```

**งานที่ต้องทำ**:
- `SdqForm.tsx`: หลัง `saveSuccess` ตรวจ `evaluator_type` แล้ว `navigate` ไปชุดถัดไป
- เพิ่ม progress indicator (Step 1/3 → 2/3 → 3/3) ใน SdqForm header

#### V15.2 AdvisorDashboard — SDQ Screening Progress Widget
แสดงว่านักเรียนรายใดยังไม่ได้รับการประเมิน SDQ ครบ 3 ชุด:

```
┌────────────────────────────────────────┐
│ ความคืบหน้าการคัดกรอง                  │
│ ครบ 3 ชุด: 28/44 คน [████████░░] 64%  │
│ เฉพาะครู:  40/44 คน [██████████] 91%  │
│ นักเรียน:  32/44 คน [████████░░] 73%  │
│ ผู้ปกครอง: 28/44 คน [███████░░░] 64%  │
└────────────────────────────────────────┘
```

**งานที่ต้องทำ**:
- Query `student_support_sdq` GROUP BY evaluator_type ใน `getAdvisorStudents()`
- เพิ่ม progress bar widget ใน AdvisorDashboard ก่อน Risk Donut section

#### V15.3 Student360 — SDQ History Timeline
แสดงประวัติการเปลี่ยนแปลงคะแนน SDQ ตามเวลา (สำหรับนักเรียนที่ประเมินซ้ำ):

```
ม.ค. 2568  ███ Total: 12 (ปกติ)
มี.ค. 2568  █████ Total: 18 (เสี่ยง)
มิ.ย. 2568  ████████ Total: 24 (มีปัญหา)
```

**งานที่ต้องทำ**:
- Query `student_support_sdq` ORDER BY created_at สำหรับ student_id
- เพิ่ม `LineChart` (Recharts) ใน SDQ_EQ tab ด้านล่าง Donut chart

---

### 🟡 Priority 2 — ฟีเจอร์เพิ่มมูลค่า

#### V15.4 EQ Recalculate Button (Admin/Teacher UI)
ปุ่มสำหรับ recalculate EQ dimension scores ของนักเรียนเก่าโดยไม่ต้องผ่าน console:

- เพิ่มปุ่ม "คำนวณคะแนน EQ ใหม่" ใน Student360 SDQ_EQ tab (เฉพาะ admin/teacher role)
- เรียก `studentSupportService.recalculateAllEqScores()` พร้อม loading state

#### V15.5 Executive Dashboard — School-wide Overview
หน้าแดชบอร์ดสำหรับผู้บริหารระดับโรงเรียน (userRole === 'EXECUTIVE' | 'ADMIN'):

```
┌──────────────────────────────────────────────────────┐
│ ภาพรวมนักเรียนทั้งโรงเรียน                            │
│ ม.1/1  [████████░░] 80% ปกติ  [░] 12% เสี่ยง          │
│ ม.1/2  [██████████] 95% ปกติ  [ ] 5% เสี่ยง           │
│ ม.2/1  [███████░░░] 70% ปกติ  [░░] 20% เสี่ยง [▒] 10% │
└──────────────────────────────────────────────────────┘
```

**งานที่ต้องทำ**:
- เพิ่ม route `/studentsupport/executive` ใน StudentSupportLayout.tsx
- Query ข้อมูลระดับโรงเรียน (JOIN classrooms + risk_analysis)
- Stacked Bar Chart แสดงทุกห้อง

#### V15.6 Case Management — Auto-suggest จาก SDQ Result
เมื่อนักเรียนมีผล SDQ ระดับ PROBLEM หรือ URGENT ระบบแจ้งเตือนครูและแนะนำเปิด Case:

- Toast notification ใน Student360 หลังบันทึก SDQ ผลเป็น PROBLEM
- ปุ่ม "เปิดเคสดูแลช่วยเหลือ" shortcut ที่ Triangulation Report

#### V15.7 PDF Export — รายงาน Triangulation
ส่งออกรายงาน Triangulation ของนักเรียนรายคนเป็น PDF สำหรับส่งผู้บริหาร/ผู้ปกครอง:

- ใช้ `react-to-pdf` หรือ `@react-pdf/renderer`
- เนื้อหา: ข้อมูลนักเรียน, SDQ Donut (screenshot), EQ Donut (screenshot), ข้อความ Triangulation

---

