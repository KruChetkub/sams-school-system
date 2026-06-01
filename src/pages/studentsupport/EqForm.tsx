import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, AlertCircle, ArrowRight, ArrowLeft, Activity, FileText, Smile, Home, ShieldAlert, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { studentSupportService } from '../../services/studentsupport/studentSupportService';

const EQ_QUESTIONS = [
  // 1-10
  "ฉันรู้สึกโกรธจนควบคุมตัวเองไม่ได้เมื่อถูกขัดใจ",
  "เมื่อเผชิญปัญหายากๆ ฉันมักท้อถอยและล้มเลิกได้ง่าย",
  "ฉันสามารถระงับอารมณ์โกรธของตนเองได้เมื่อพยายามทำใจให้สงบ",
  "ฉันรู้สึกกังวลและเครียดง่ายเมื่อสิ่งต่างๆ ไม่เป็นไปตามแผน",
  "ฉันกล้าที่จะยอมรับข้อผิดพลาดของตนเองและหาทางแก้ไขปรับปรุง",
  "ฉันรู้สึกสงสารและอยากเข้าไปช่วยเหลือเมื่อเห็นคนอื่นเดือดร้อน",
  "เมื่อทำผิด ฉันมักพยายามหาเหตุผลแก้ตัวมากกว่ายอมรับผิดตรงๆ",
  "ฉันรู้สึกอึดอัดใจเมื่อต้องรับฟังปัญหาของคนอื่น",
  "ฉันพยายามทำงานที่ได้รับมอบหมายให้สำเร็จตรงเวลาอย่างเต็มความสามารถ",
  "ฉันรู้สึกเบื่อหน่ายกับการต้องทำตามกติกาสังคมหรือกฎระเบียบของโรงเรียน",

  // 11-20
  "ฉันมีความหวังและเชื่อมั่นเสมอว่าชีวิตในอนาคตจะดีขึ้น",
  "เมื่อผลงานไม่ดีตามคาดหวัง ฉันหมดกำลังใจที่จะเริ่มทำใหม่",
  "ฉันรู้วิธีผ่อนคลายความเครียดของตนเองด้วยกิจกรรมที่สร้างสรรค์",
  "ฉันยอมรับและเคารพในความแตกต่างและความคิดเห็นที่หลากหลายของเพื่อนๆ",
  "ฉันมักแก้ปัญหาด้วยอารมณ์หรือใช้กำลังมากกว่าพูดคุยหาทางออก",
  "ฉันมีเป้าหมายชีวิตที่ชัดเจนและมุ่งมั่นที่จะทำให้สำเร็จ",
  "ฉันรู้สึกอิจฉาเมื่อเห็นเพื่อนคนอื่นได้ดีกว่าตนเอง",
  "ฉันคิดว่าการสร้างความสัมพันธ์กับคนแปลกหน้าเป็นเรื่องที่ทำได้ยาก",
  "ฉันมีเทคนิคการประสานงานและพูดคุยเจรจาที่ดีกับเพื่อนร่วมงาน",
  "เวลาทำงานกลุ่ม ฉันมักปล่อยให้คนอื่นทำและไม่ค่อยกระตือรือร้นช่วยเหลือ",

  // 21-30
  "ฉันชื่นชมและยินดีด้วยใจจริงเมื่อเห็นเพื่อนประสบความสำเร็จ",
  "ฉันมีสัมพันธภาพที่ดีกับครู เพื่อน และบุคคลอื่นๆ รอบข้าง",
  "ฉันมักจะระเบิดอารมณ์ออกมาทันทีหากมีเรื่องไม่พอใจเกิดขึ้น",
  "ฉันเชื่อมั่นว่าทุกคนสามารถปรับปรุงพัฒนาตนเองให้ดีขึ้นได้เสมอ",
  "ฉันมักรู้สึกท้อแท้และคิดว่าตนเองไม่มีความสามารถเหมือนคนอื่น",
  "ฉันรู้สึกว่าชีวิตของฉันเต็มไปด้วยอุปสรรคจนแทบไม่มีความสุข",
  "ฉันพอใจในรูปร่างหน้าตาและสิ่งดีๆ ที่ตนเองมีอยู่",
  "ฉันรู้สึกอ้างว้างโดดเดี่ยวบ่อยครั้ง แม้จะอยู่ท่ามกลางผู้คนมากมาย",
  "ฉันคิดว่าอุปสรรคต่างๆ ในชีวิตเป็นสิ่งยากเกินกว่าจะฝ่าฟันไปได้",
  "ฉันสามารถหาข้อคิดที่ดีหรือแง่มุมบวกๆ ได้จากเหตุการณ์ที่เลวร้าย",

  // 31-40
  "ฉันเป็นคนมองโลกในแง่ดีและพยายามสร้างรอยยิ้มให้คนรอบข้าง",
  "ฉันเป็นคนโกรธง่ายและมักสะสมความขุ่นเคืองใจไว้เป็นเวลานาน",
  "ฉันยินดีช่วยเหลือผู้อื่นโดยไม่หวังสิ่งตอบแทน",
  "ฉันไม่มีความมั่นใจในตัวเองเมื่อต้องออกไปพูดหรือทำกิจกรรมหน้าชั้นเรียน",
  "ฉันมีความภูมิใจในความรู้ความสามารถหรือพรสวรรค์บางประการที่ฉันมี",
  "ฉันรู้สึกกังวลเกี่ยวกับอนาคตของตนเองจนไม่เป็นอันทำอะไร",
  "ฉันสามารถแบ่งเวลาเรียน เวลาเล่น และเวลาพักผ่อนได้อย่างเหมาะสม",
  "ฉันชอบเรียนรู้สิ่งใหม่ๆ และทดลองทำอะไรที่ท้าทายตนเองอยู่เสมอ",
  "ฉันมักจะยอมแพ้ต่ออุปสรรคหรือความยากลำบากอย่างง่ายดาย",
  "ฉันปรับตัวเข้ากับสภาพแวดล้อมใหม่ๆ หรือโรงเรียนใหม่ได้อย่างรวดเร็ว",

  // 41-52
  "ฉันยอมรับฟังคำติชมของผู้อื่นเพื่อนำมาปรับปรุงพัฒนาตนเอง",
  "ฉันรู้สึกกระตือรือร้นและมีพลังในทุกเช้าที่ตื่นนอนไปโรงเรียน",
  "ฉันมักมองหาวิธีการแก้ปัญหาที่เป็นระบบและรอบคอบก่อนลงมือทำ",
  "ฉันรู้สึกยากที่จะให้อภัยคนที่เคยทำร้ายจิตใจหรือทำให้ฉันผิดหวัง",
  "ฉันสามารถสร้างกำลังใจและปลอบโยนตนเองได้ยามท้อแท้สิ้นหวัง",
  "เมื่อเจอสถานการณ์ที่น่ากดดัน ฉันมักแสดงอาการลนลานหรือควบคุมสติไม่ได้",
  "ฉันเข้าอกเข้าใจความต้องการและความรู้สึกของเพื่อนร่วมชั้นได้ดี",
  "ฉันรู้สึกรักและเคารพคุณพ่อคุณแม่ ครอบครัว รวมถึงคุณครูทุกคนด้วยความซื่อสัตย์",
  "ฉันมีความสุขและสนุกสนานกับกิจกรรมร่วมกับเพื่อนๆ ที่โรงเรียน",
  "ฉันคิดว่าตัวเองเป็นภาระและไม่มีประโยชน์ต่อครอบครัวหรือสังคม",
  "ฉันรู้สึกหม่นหมอง อารมณ์ไม่ดีเกือบตลอดทั้งวันโดยไม่มีสาเหตุชัดเจน",
  "ฉันพอใจและมีความสุขกับสิ่งที่เป็นอยู่ในชีวิตประจำวันปัจจุบัน"
];

// จำนวนข้อคำถามต่อ 1 หน้า (Pagination)
const QUESTIONS_PER_PAGE = 5;

export default function EqForm() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<any>(null);
  const [answers, setAnswers] = useState<number[]>(Array(52).fill(-1));
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(EQ_QUESTIONS.length / QUESTIONS_PER_PAGE);

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

  const handleAnswerSelect = (questionIndex: number, score: number) => {
    const updated = [...answers];
    updated[questionIndex] = score;
    setAnswers(updated);
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      // ตรวจสอบว่าหน้าปัจจุบันทำครบทุกข้อหรือยัง
      const startIndex = currentPage * QUESTIONS_PER_PAGE;
      const endIndex = Math.min(startIndex + QUESTIONS_PER_PAGE, EQ_QUESTIONS.length);
      const pageAnswers = answers.slice(startIndex, endIndex);
      
      if (pageAnswers.some(ans => ans === -1)) {
        setError("กรุณาตอบคำถามให้ครบทุกข้อในหน้านี้ก่อนถัดไป");
        return;
      }
      
      setError(null);
      setCurrentPage(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setError(null);
      setCurrentPage(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const isAllAnswered = answers.every(ans => ans !== -1);
  const answeredCount = answers.filter(a => a !== -1).length;
  const progressPercent = Math.round((answeredCount / 52) * 100);

  const handleSubmit = async () => {
    if (!studentId) return;
    if (!isAllAnswered) {
      setError("กรุณาตอบคำถามให้ครบถ้วนทั้ง 52 ข้อ");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await studentSupportService.saveEqAssessment({
        student_id: studentId,
        evaluator_id: user?.id || '',
        answers: answers
      });

      navigate('/studentsupport');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getQuestionIndex = (indexOnPage: number) => {
    return currentPage * QUESTIONS_PER_PAGE + indexOnPage;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-bold">กำลังโหลดรายละเอียดแบบประเมิน EQ...</p>
        </div>
      </div>
    );
  }

  const startIndex = currentPage * QUESTIONS_PER_PAGE;
  const endIndex = Math.min(startIndex + QUESTIONS_PER_PAGE, EQ_QUESTIONS.length);
  const currentQuestions = EQ_QUESTIONS.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 pb-24 md:pb-8 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* Decorative Glow elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Desktop Back Button — hidden on mobile (bottom nav handles it) */}
      <div className="hidden md:flex items-center gap-3 w-full max-w-2xl mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/25 font-bold text-sm transition-all"
        >
          <ChevronLeft size={16} />
          ย้อนกลับ
        </button>
        <span className="text-xs text-gray-500">EQ Assessment (52 ข้อ)</span>
      </div>

      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10">
        
        {/* Header Section */}
        <header className="mb-8 border-b border-white/10 pb-6">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            
            {/* Student Info Details */}
            <div className="flex flex-col items-center md:items-start space-y-1.5 md:space-y-0.5 w-full">
              <span className="px-3 py-1 bg-violet-500/20 text-violet-400 text-xxs font-bold uppercase tracking-widest rounded-full border border-violet-500/35 block w-fit">
                EQ Assessment (ความฉลาดทางอารมณ์ 52 ข้อ)
              </span>
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
          
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex-1 bg-white/10 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full transition-all duration-300 rounded-full" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-violet-400 whitespace-nowrap">{progressPercent}% ({answeredCount}/52 ข้อ)</span>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3 text-red-300 text-sm animate-pulse">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Questions list */}
        <div className="space-y-6 mb-8">
          {currentQuestions.map((question, indexOnPage) => {
            const questionIndex = getQuestionIndex(indexOnPage);
            const currentAnswer = answers[questionIndex];

            return (
              <div 
                key={questionIndex} 
                className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {questionIndex + 1}
                  </span>
                  <p className="text-base font-bold leading-relaxed text-gray-100">
                    {question}
                  </p>
                </div>

                {/* Rating scales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                  {[
                    { val: 1, label: 'ไม่จริง' },
                    { val: 2, label: 'จริงบางครั้ง' },
                    { val: 3, label: 'ค่อนข้างจริง' },
                    { val: 4, label: 'จริงมาก' }
                  ].map((option) => (
                    <button
                      key={option.val}
                      onClick={() => handleAnswerSelect(questionIndex, option.val)}
                      className={`py-2.5 px-2 rounded-xl text-xs md:text-sm font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                        currentAnswer === option.val
                          ? 'bg-violet-600/30 border-violet-500/50 text-violet-300 shadow-md font-extrabold'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {option.label}
                      {currentAnswer === option.val && <Check size={14} className="text-violet-400" />}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation / Footer buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-white/10">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ArrowLeft size={16} /> ย้อนกลับ
          </button>

          <span className="text-xs text-gray-400 font-bold">
            หน้า {currentPage + 1} จาก {totalPages}
          </span>

          {currentPage < totalPages - 1 ? (
            <button
              onClick={nextPage}
              className="flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white py-2 px-5 rounded-xl font-bold transition-all shadow-md transform hover:-translate-y-0.5"
            >
              ถัดไป <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !isAllAnswered}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 px-6 rounded-xl font-black transition-all shadow-md transform hover:-translate-y-0.5"
            >
              {submitting ? 'กำลังส่งข้อมูล...' : 'ส่งผลแบบประเมิน EQ'}
              <Check size={18} />
            </button>
          )}
        </div>
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
