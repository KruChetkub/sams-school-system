import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, AlertCircle, ArrowRight, ArrowLeft, Activity, FileText, Smile, Home, ShieldAlert, Calendar, GraduationCap, User, Users, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { studentSupportService } from '../../services/studentsupport/studentSupportService';

const getSdqQuestions = (evaluatorType: 'STUDENT' | 'TEACHER' | 'PARENT') => {
  if (evaluatorType === 'STUDENT') {
    return [
      "ฉันพยายามจะทำตัวดีกับคนอื่น ฉันใส่ใจในความรู้สึกของคนอื่น",
      "ฉันอยู่ไม่นิ่ง ฉันนั่งนานๆ ไม่ได้",
      "ฉันปวดศีรษะ ปวดท้อง หรือไม่สบายบ่อยๆ",
      "ฉันเต็มใจแบ่งปันสิ่งของให้คนอื่น (ของกิน เกม ปากกา เป็นต้น)",
      "ฉันโกรธแรง และมักอารมณ์เสีย",
      "ฉันชอบอยู่กับตัวเอง ฉันชอบเล่นคนเดียว หรืออยู่ตามลำพัง",
      "ฉันมักทำตามที่คนอื่นบอก",
      "ฉันขี้กังวล",
      "ใครๆ ก็พึ่งฉันได้ถ้าเขาเสียใจ อารมณ์ไม่ดีหรือไม่สบายใจ",
      "ฉันอยู่ไม่สุข วุ่นวาย",
      "ฉันมีเพื่อนสนิท",
      "ฉันมีเรื่องทะเลาะวิวาทบ่อย ฉันทำให้คนอื่นทำอย่างที่ฉันต้องการได้",
      "ฉันไม่มีความสุข ท้อแท้ ร้องไห้บ่อย",
      "เพื่อนๆส่วนมากชอบฉัน",
      "ฉันวอกแวกง่าย ฉันรู้สึกว่าไม่มีสมาธิ",
      "ฉันกังวลเวลาอยู่ในสถานการณ์ที่ไม่คุ้น และเสียความเชื่อมั่นในตนเองง่าย",
      "ฉันใจดีกับเด็กที่เล็กกว่า",
      "มีคนว่าฉันโกหก หรือขี้โกงบ่อยๆ",
      "เด็กๆ คนอื่น ล้อเลียนหรือรังแกฉัน",
      "ฉันมักจะอาสาช่วยเหลือคนอื่น (พ่อแม่, ครู, เด็กคนอื่น)",
      "ฉันคิดก่อนทำ",
      "ฉันเอาของคนอื่นในบ้าน ที่โรงเรียน หรือที่อื่นๆ",
      "ฉันเข้ากับผู้ใหญ่ได้ดีกว่าเด็กวัยเดียวกัน",
      "ฉันขี้กลัว รู้สึกหวาดกลัวได้ง่าย",
      "ฉันทำงานได้จนสำเร็จ ความตั้งใจในการทำงานของฉันดี"
    ];
  } else if (evaluatorType === 'PARENT') {
    return [
      "ห่วงใยความรู้สึกของคนอื่น",
      "อยู่ไม่นิ่ง นั่งนิ่งๆ ไม่ได้",
      "มักจะบ่นว่าปวดศีรษะ ปวดท้อง หรือไม่สบายบ่อยๆ",
      "เต็มใจแบ่งปันสิ่งของให้คนอื่น (ของกิน ดินสอ ของเล่น เป็นต้น)",
      "มักจะอาละวาด หรือโมโหร้าย",
      "ค่อนข้างแยกตัว ชอบเล่นคนเดียวหรืออยู่ตามลำพัง",
      "เชื่อฟัง มักจะทำตามที่ผู้ใหญ่ต้องการ",
      "กังวลใจหลายเรื่อง ดูกังวลใจเสมอ",
      "เป็นที่พึ่งได้เวลาคนอื่นเสียใจ อารมณ์ไม่ดี หรือไม่สบายใจ",
      "อยู่ไม่สุข วุ่นวายอย่างมาก",
      "มีเพื่อนสนิทอย่างน้อย 1 คน",
      "มักมีเรื่องทะเลาะวิวาทกับเด็กอื่น หรือรังแกเด็กอื่น",
      "ดูไม่มีความสุข ท้อแท้ หรือร้องไห้บ่อย",
      "เป็นที่ชื่นชอบของเพื่อนๆ รุ่นเดียวกัน",
      "วอกแวกง่าย สมาธิสั้น",
      "เครียดไม่ยอมห่างเวลาอยู่ในสถานการณ์ที่ไม่คุ้น และขาดความเชื่อมั่นในตนเอง",
      "ใจดีกับเด็กที่เล็กกว่า",
      "ชอบโกหก หรือขี้โกง",
      "ถูกเด็กคนอื่นล้อเลียน หรือรังแก",
      "ชอบอาสาช่วยเหลือผู้อื่น (พ่อแม่, ครู, เด็กคนอื่น)",
      "คิดก่อนทำ",
      "ขโมยของที่บ้าน ที่โรงเรียน หรือที่อื่น",
      "เข้ากับผู้ใหญ่ได้ดีกว่ากับเด็กในวัยเดียวกัน",
      "ขี้กลัว รู้สึกหวาดกลัวได้ง่าย",
      "ทำงานได้จนเสร็จ มีความตั้งอกตั้งใจในการทำงาน"
    ];
  } else {
    // TEACHER
    return [
      "ห่วงใยความรู้สึกของเด็กคนอื่น",
      "อยู่ไม่นิ่ง นั่งนิ่งๆ นานไม่ได้",
      "มักจะบ่นว่าปวดศีรษะ ปวดท้อง หรือไม่สบาย",
      "เต็มใจแบ่งปันสิ่งของให้เด็กคนอื่น (ของกิน ดินสอ ของเล่น เป็นต้น)",
      "มักจะอาละวาด หรือโมโหเกรี้ยวกราด",
      "ค่อนข้างแยกตัว ชอบเล่นคนเดียวหรืออยู่ตามลำพัง",
      "เชื่อฟัง มักจะทำตามที่ครูต้องการ",
      "กังวลใจหลายเรื่อง ดูกังวลใจเสมอ",
      "เป็นที่พึ่งได้เวลาเด็กคนอื่นเสียใจ อารมณ์ไม่ดี หรือไม่สบายใจ",
      "อยู่ไม่สุข วุ่นวายอย่างมาก",
      "มีเพื่อนสนิทอย่างน้อย 1 คน",
      "มักมีเรื่องทะเลาะวิวาทกับเด็กอื่น หรือรังแกเด็กอื่น",
      "ดูไม่มีความสุข ท้อแท้ หรือร้องไห้บ่อย",
      "เป็นที่ชื่นชอบของเพื่อนๆ รุ่นเดียวกัน",
      "วอกแวกง่าย สมาธิสั้น",
      "เครียดไม่ยอมห่างเวลาอยู่ในสถานการณ์ที่ไม่คุ้น และขาดความเชื่อมั่นในตนเอง",
      "ใจดีกับเด็กที่เล็กกว่า",
      "ชอบโกหก หรือขี้โกง",
      "ถูกเด็กคนอื่นล้อเลียน หรือรังแก",
      "ชอบอาสาช่วยเหลือผู้อื่น (ครู, เพื่อนนักเรียน, เด็กคนอื่น)",
      "คิดก่อนทำ",
      "ขโมยของของเพื่อน ของโรงเรียน หรือที่อื่น",
      "เข้ากับผู้ใหญ่ได้ดีกว่ากับเด็กในวัยเดียวกัน",
      "ขี้กลัว รู้สึกหวาดกลัวได้ง่าย",
      "ทำงานได้จนเสร็จ มีความตั้งอกตั้งใจในการทำงาน"
    ];
  }
};

export default function SdqForm() {
  const { studentId } = useParams<{ studentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // ดึง evaluator_type จาก query param, default เป็น 'TEACHER' สำหรับครูประจำชั้น
  const [evaluatorTypeState, setEvaluatorTypeState] = useState<'STUDENT' | 'TEACHER' | 'PARENT'>('TEACHER');

  useEffect(() => {
    const type = searchParams.get('type') as 'STUDENT' | 'TEACHER' | 'PARENT';
    if (type && ['STUDENT', 'TEACHER', 'PARENT'].includes(type)) {
      setEvaluatorTypeState(type);
    }
  }, [searchParams]);
  
  const [student, setStudent] = useState<any>(null);
  const [answers, setAnswers] = useState<number[]>(Array(25).fill(-1));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ส่วนประเมินด้านหลัง (Impact Assessment)
  const [hasProblems, setHasProblems] = useState<string | null>(null); // 'NO' | 'LITTLE' | 'CLEAR' | 'SEVERE'
  const [impactAnswers, setImpactAnswers] = useState({
    distress: -1,  // Q3
    home: -1,      // Q4_home
    friends: -1,   // Q4_friends
    classroom: -1, // Q4_classroom
    leisure: -1,   // Q4_leisure
  });
  const [step, setStep] = useState(1); // 1 = SDQ 25 ข้อ, 2 = คำถามด้านหลัง (Impact)

  const questions = getSdqQuestions(evaluatorTypeState);

  const handleEvaluatorChange = (type: 'STUDENT' | 'TEACHER' | 'PARENT') => {
    // อัปเดต query param ใน URL เพื่อรักษา State
    setSearchParams({ type });
    setEvaluatorTypeState(type);
    // รีเซ็ตคำตอบเมื่อสลับประเภทผู้ประเมินเพื่อความปลอดภัยของคะแนน
    setAnswers(Array(25).fill(-1));
    setCurrentIdx(0);
    setStep(1);
    setHasProblems(null);
    setImpactAnswers({
      distress: -1,
      home: -1,
      friends: -1,
      classroom: -1,
      leisure: -1,
    });
  };

  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('students')
          .select('first_name, last_name, student_code, classroom:classroom_id(level, room)')
          .eq('id', studentId)
          .single();
        if (error) throw error;
        setStudent(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [studentId]);

  const handleAnswerSelect = (score: number) => {
    const updated = [...answers];
    updated[currentIdx] = score;
    setAnswers(updated);
    
    // Auto-advance to next question if not at the end
    if (currentIdx < 24) {
      setTimeout(() => {
        setCurrentIdx(prev => prev + 1);
      }, 250);
    }
  };

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const isAllAnswered = answers.every(ans => ans !== -1);
  const progressPercent = Math.round((answers.filter(a => a !== -1).length / 25) * 100);

  const handleSubmit = async () => {
    if (!studentId) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const payload: any = {
        student_id: studentId,
        evaluator_type: evaluatorTypeState,
        evaluator_id: user?.id || null,
        answers: answers
      };

      // บันทึกคำตอบด้านผลกระทบด้านหลัง (ถ้าผู้เรียนระบุว่า มีปัญหา)
      if (hasProblems && hasProblems !== 'NO' && step === 2) {
        payload.impact_answers = {
          distress: impactAnswers.distress,
          home: impactAnswers.home,
          friends: impactAnswers.friends,
          classroom: impactAnswers.classroom,
          leisure: impactAnswers.leisure
        };
      }

      await studentSupportService.saveSdqAssessment(payload);
      
      if (evaluatorTypeState === 'TEACHER') {
        setSuccessMessage('บันทึกประเมินฉบับ "ครูประเมินนักเรียน" สำเร็จ! กำลังเปลี่ยนไปยังฉบับ "นักเรียนประเมินตนเอง"...');
        setTimeout(() => {
          setSuccessMessage(null);
          handleEvaluatorChange('STUDENT');
        }, 2200);
      } else if (evaluatorTypeState === 'STUDENT') {
        setSuccessMessage('บันทึกประเมินฉบับ "นักเรียนประเมินตนเอง" สำเร็จ! กำลังเปลี่ยนไปยังฉบับ "ผู้ปกครองประเมิน"...');
        setTimeout(() => {
          setSuccessMessage(null);
          handleEvaluatorChange('PARENT');
        }, 2200);
      } else {
        setSuccessMessage('บันทึกแบบประเมิน SDQ ครบถ้วนเสร็จสมบูรณ์! กำลังนำคุณกลับไปดูผลลัพธ์...');
        setTimeout(() => {
          setSuccessMessage(null);
          navigate(`/studentsupport/profile/${studentId}`, { state: { activeTab: 'SDQ_EQ' } });
        }, 2200);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-bold">กำลังโหลดรายละเอียดแบบประเมิน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 pb-24 md:pb-8 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* Premium Glassmorphic Success Toast */}
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-in fade-in slide-in-from-top-6 duration-300">
          <div className="bg-[#0f172a]/95 backdrop-blur-2xl border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl shadow-emerald-500/15 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle2 size={20} className="animate-bounce" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-black">สำเร็จ!</p>
              <p className="text-[10px] text-gray-300 font-medium mt-0.5">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Decorative Glow elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10">
        
        {/* Header Section */}
        <header className="mb-8 border-b border-white/10 pb-6">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            
            {/* Student Info & Badge */}
            <div className="flex flex-col items-center md:items-start space-y-1.5 md:space-y-0.5 w-full">
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xxs font-bold uppercase tracking-widest rounded-full border border-emerald-500/35 block w-fit">
                  SDQ Assessment (แบบประเมินพฤติกรรมเด็ก)
                </span>
                <span className={`px-3 py-1 text-xxs font-bold rounded-full border block w-fit ${
                  evaluatorTypeState === 'STUDENT' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' :
                  evaluatorTypeState === 'PARENT' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-sky-500/20 text-sky-400 border-sky-500/30'
                }`}>
                  {evaluatorTypeState === 'STUDENT' ? 'นักเรียนประเมินตนเอง' :
                   evaluatorTypeState === 'PARENT' ? 'ผู้ปกครองประเมิน' : 'ครูประเมินนักเรียน'}
                </span>
              </div>
              <h2 className="text-xl md:text-3xl font-black text-white leading-tight">
                {student ? `${student.prefix || ''}${student.first_name} ${student.last_name}` : 'โหลดข้อมูล...'}
              </h2>
              {student?.classroom && (
                <p className="text-xs text-gray-400">
                  ชั้น {student.classroom.level}/{student.classroom.room} • รหัสประจำตัว: {student.student_code}
                </p>
              )}
            </div>
          </div>

          {/* Evaluator Selector Tabs (Visible only in Step 1 before completing form) */}
          {step === 1 && (
            <div className="mt-5 p-1 bg-white/5 border border-white/10 rounded-2xl flex gap-1 w-full shadow-inner">
              {[
                { 
                  key: 'TEACHER', 
                  labelDesktop: 'ครูประเมินนักเรียน', 
                  labelMobile: 'ครู', 
                  color: 'bg-sky-600 text-white border-sky-500/30',
                  icon: GraduationCap
                },
                { 
                  key: 'STUDENT', 
                  labelDesktop: 'นักเรียนประเมินตนเอง', 
                  labelMobile: 'นักเรียน', 
                  color: 'bg-indigo-600 text-white border-indigo-500/30',
                  icon: User
                },
                { 
                  key: 'PARENT', 
                  labelDesktop: 'ผู้ปกครองประเมิน', 
                  labelMobile: 'ผู้ปกครอง', 
                  color: 'bg-amber-600 text-white border-amber-500/30',
                  icon: Users
                },
              ].map(item => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleEvaluatorChange(item.key as any)}
                    className={`flex-1 py-2.5 px-1.5 font-bold rounded-xl transition-all border flex items-center justify-center gap-1.5 ${
                      evaluatorTypeState === item.key
                        ? `${item.color} shadow-md scale-[1.01]`
                        : 'bg-transparent text-gray-400 border-transparent hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <IconComponent size={14} className="shrink-0" />
                    
                    {/* Desktop View Label */}
                    <span className="hidden md:inline text-[11px] whitespace-nowrap">
                      {item.labelDesktop}
                    </span>
                    
                    {/* Mobile View Label */}
                    <span className="md:hidden text-[10px] whitespace-nowrap">
                      {item.labelMobile}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex-1 bg-white/10 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-300 rounded-full" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-400 whitespace-nowrap">{progressPercent}% ({answers.filter(a => a !== -1).length}/25 ข้อ)</span>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3 text-red-300 text-sm">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: SDQ 25 questions */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
            {/* Card Content containing the active question */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-center shadow-lg relative min-h-[140px] flex flex-col justify-center items-center">
              <span className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm text-gray-300">
                {currentIdx + 1}
              </span>
              <p className="text-lg md:text-xl font-bold leading-relaxed max-w-md mx-auto text-gray-100 mt-4">
                "{questions[currentIdx]}"
              </p>
            </div>

            {/* Selection Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleAnswerSelect(0)}
                className={`py-4 px-6 rounded-2xl font-bold text-base md:text-lg border transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${
                  answers[currentIdx] === 0
                    ? 'bg-slate-700 border-slate-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                }`}
              >
                ไม่จริง
                {answers[currentIdx] === 0 && <Check size={18} className="text-emerald-400" />}
              </button>

              <button
                onClick={() => handleAnswerSelect(1)}
                className={`py-4 px-6 rounded-2xl font-bold text-base md:text-lg border transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${
                  answers[currentIdx] === 1
                    ? 'bg-amber-600/30 border-amber-500/50 text-amber-300 shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                }`}
              >
                ค่อนข้างจริง
                {answers[currentIdx] === 1 && <Check size={18} className="text-amber-400" />}
              </button>

              <button
                onClick={() => handleAnswerSelect(2)}
                className={`py-4 px-6 rounded-2xl font-bold text-base md:text-lg border transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${
                  answers[currentIdx] === 2
                    ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300 shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                }`}
              >
                จริง
                {answers[currentIdx] === 2 && <Check size={18} className="text-emerald-400" />}
              </button>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-white/10">
              <button
                onClick={handleBack}
                disabled={currentIdx === 0}
                className="flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <ArrowLeft size={16} /> ย้อนกลับ
              </button>

              {/* Interactive Dots on desktop/tablet */}
              <div className="hidden sm:flex flex-wrap justify-center gap-1.5 max-w-[50%]">
                {answers.map((ans, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${
                      idx === currentIdx 
                        ? 'bg-emerald-400 scale-125' 
                        : ans !== -1 
                          ? 'bg-emerald-800' 
                          : 'bg-white/10'
                    }`} 
                  />
                ))}
              </div>

              {/* Textual progress counter on mobile to prevent overflow */}
              <div className="sm:hidden text-xs font-black text-emerald-400 select-none">
                ข้อที่ {currentIdx + 1} / 25
              </div>

              {currentIdx === 24 && isAllAnswered ? (
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-2 px-5 rounded-xl font-bold transition-all shadow-md transform hover:-translate-y-0.5"
                >
                  ถัดไป <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => currentIdx < 24 && setCurrentIdx(prev => prev + 1)}
                  disabled={answers[currentIdx] === -1}
                  className="flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  ถัดไป <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Conditional Back Page Impact assessment */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
            <h3 className="text-lg font-black border-b border-white/10 pb-2 mb-4 text-emerald-400">
              ส่วนประเมินผลกระทบด้านหลัง (SDQ Impact Assessment)
            </h3>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <p className="text-sm text-gray-300 font-bold leading-relaxed">
                โดยรวมคุณครู/นักเรียนคิดว่าตนเองมีปัญหาในด้านใดด้านหนึ่งต่อไปนี้หรือไม่ (ด้านอารมณ์ ด้านสมาธิ ด้านพฤติกรรม หรือความสามารถเข้ากับผู้อื่น)
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'NO', label: 'ไม่' },
                  { key: 'LITTLE', label: 'ใช่ มีเล็กน้อย' },
                  { key: 'CLEAR', label: 'ใช่ มีชัดเจน' },
                  { key: 'SEVERE', label: 'ใช่ มีอย่างมาก' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setHasProblems(item.key)}
                    className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all text-center ${
                      hasProblems === item.key
                        ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {hasProblems && hasProblems !== 'NO' && (
              <div className="space-y-5 bg-white/5 border border-white/10 rounded-2xl p-5 animate-in fade-in slide-in-from-top duration-300">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">ตอบคำถามผลกระทบเพิ่มเติม</p>

                {/* Distress */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">1. ปัญหานี้สร้างความเดือดร้อนรำคาญใจให้แก่นักเรียนหรือไม่?</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['ไม่เลย', 'เล็กน้อย', 'ค่อนข้างมาก', 'มาก'].map((label, val) => (
                      <button
                        key={val}
                        onClick={() => setImpactAnswers(prev => ({ ...prev, distress: val }))}
                        className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all text-center ${
                          impactAnswers.distress === val
                            ? 'bg-amber-600/30 border-amber-500/50 text-amber-300'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Domain Impacts */}
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <label className="text-sm font-semibold text-gray-300">2. ปัญหานี้รบกวนชีวิตประจำวันในด้านต่างๆ ต่อไปนี้หรือไม่?</label>
                  
                  {/* Home */}
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400 font-medium">• ความเป็นอยู่ที่บ้าน (ครอบครัว)</span>
                    <div className="grid grid-cols-4 gap-2">
                      {['ไม่เลย', 'เล็กน้อย', 'ค่อนข้างมาก', 'มาก'].map((label, val) => (
                        <button
                          key={val}
                          onClick={() => setImpactAnswers(prev => ({ ...prev, home: val }))}
                          className={`py-1.5 px-1 rounded-lg text-[11px] font-bold border transition-all text-center ${
                            impactAnswers.home === val
                              ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Friends */}
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400 font-medium">• การคบเพื่อนสนิท</span>
                    <div className="grid grid-cols-4 gap-2">
                      {['ไม่เลย', 'เล็กน้อย', 'ค่อนข้างมาก', 'มาก'].map((label, val) => (
                        <button
                          key={val}
                          onClick={() => setImpactAnswers(prev => ({ ...prev, friends: val }))}
                          className={`py-1.5 px-1 rounded-lg text-[11px] font-bold border transition-all text-center ${
                            impactAnswers.friends === val
                              ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Classroom */}
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400 font-medium">• การเรียนในชั้นเรียน</span>
                    <div className="grid grid-cols-4 gap-2">
                      {['ไม่เลย', 'เล็กน้อย', 'ค่อนข้างมาก', 'มาก'].map((label, val) => (
                        <button
                          key={val}
                          onClick={() => setImpactAnswers(prev => ({ ...prev, classroom: val }))}
                          className={`py-1.5 px-1 rounded-lg text-[11px] font-bold border transition-all text-center ${
                            impactAnswers.classroom === val
                              ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Leisure */}
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400 font-medium">• กิจกรรมยามว่าง/สันทนาการ</span>
                    <div className="grid grid-cols-4 gap-2">
                      {['ไม่เลย', 'เล็กน้อย', 'ค่อนข้างมาก', 'มาก'].map((label, val) => (
                        <button
                          key={val}
                          onClick={() => setImpactAnswers(prev => ({ ...prev, leisure: val }))}
                          className={`py-1.5 px-1 rounded-lg text-[11px] font-bold border transition-all text-center ${
                            impactAnswers.leisure === val
                              ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6 border-t border-white/10">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-white transition-all"
              >
                <ArrowLeft size={16} /> กลับไปหน้าแบบสอบถาม
              </button>

              <button
                onClick={handleSubmit}
                disabled={
                  submitting || 
                  !hasProblems || 
                  (hasProblems !== 'NO' && 
                    (impactAnswers.distress === -1 || 
                     impactAnswers.home === -1 || 
                     impactAnswers.friends === -1 || 
                     impactAnswers.classroom === -1 || 
                     impactAnswers.leisure === -1))
                }
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 px-8 rounded-xl font-black transition-all shadow-md transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
              >
                {submitting ? 'กำลังส่งข้อมูล...' : 'ส่งผลแบบประเมิน SDQ'}
                <Check size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar for Mobile (Line style with quick actions) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-2xl border-t border-white/10 py-3 px-2 flex justify-around items-center z-50 shadow-2xl safe-bottom">
        {/* 0. ย้อนกลับ */}
        <button
          onClick={() => navigate('/studentsupport')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-all hover:scale-105"
          title="กลับหน้าควบคุมที่ปรึกษา"
        >
          <ChevronLeft size={20} className="text-gray-400" />
          <span className="text-[10px] font-black text-gray-400">ย้อนกลับ</span>
        </button>

        {/* 1. ดู 360° */}
        <button
          onClick={() => navigate(`/studentsupport/profile/${studentId}`)}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-all hover:scale-105"
        >
          <Activity size={20} />
          <span className="text-[10px] font-black">ดู 360°</span>
        </button>

        {/* 2. SDQ/EQ */}
        <button
          onClick={() => navigate(`/studentsupport/profile/${studentId}`, { state: { activeTab: 'SDQ_EQ' } })}
          className="flex flex-col items-center gap-1 text-violet-400 scale-105 transition-all font-black"
        >
          <Smile size={20} />
          <span className="text-[10px] font-black">ผล SDQ/EQ</span>
        </button>

        {/* 3. เวลาเรียน */}
        <button
          onClick={() => navigate(`/studentsupport/profile/${studentId}`, { state: { activeTab: 'ATTENDANCE' } })}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-all hover:scale-105"
        >
          <Calendar size={20} />
          <span className="text-[10px] font-black">เวลาเรียน</span>
        </button>

        {/* 4. จัดการเคส */}
        <button
          onClick={() => navigate(`/studentsupport/profile/${studentId}`, { state: { activeTab: 'CASES' } })}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-all hover:scale-105"
        >
          <ShieldAlert size={20} />
          <span className="text-[10px] font-black">จัดการเคส</span>
        </button>
      </div>
    </div>
  );
}
