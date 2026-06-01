import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Users, ShieldAlert, AlertTriangle, CheckCircle2, Activity,
  Search, Eye, Filter, Download, ArrowLeft, GraduationCap, School
} from 'lucide-react';
import { studentSupportService } from '../../services/studentsupport/studentSupportService';

// สีตามแบรนด์
const COLORS = {
  NORMAL: '#10b981',  // เขียว
  MONITOR: '#f59e0b', // เหลือง
  RISK: '#f97316',    // ส้ม
  URGENT: '#f43f5e'    // แดง
};

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const data = await studentSupportService.getAllStudentsForExecutive();
        setStudents(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // คำนวณสถิติ
  const totalStudents = students.length;
  
  const getRiskStats = () => {
    let normal = 0, monitor = 0, risk = 0, urgent = 0;
    
    students.forEach(s => {
      const lvl = s.student_support_risk_analysis?.[0]?.risk_level || 'NORMAL';
      if (lvl === 'URGENT') urgent++;
      else if (lvl === 'RISK') risk++;
      else if (lvl === 'MONITOR') monitor++;
      else normal++;
    });

    return { normal, monitor, risk, urgent };
  };

  const { normal, monitor, risk, urgent } = getRiskStats();

  const pieData = [
    { name: 'ปกติ (เขียว)', value: normal, color: COLORS.NORMAL },
    { name: 'เฝ้าระวัง (เหลือง)', value: monitor, color: COLORS.MONITOR },
    { name: 'กลุ่มเสี่ยง (ส้ม)', value: risk, color: COLORS.RISK },
    { name: 'ช่วยเหลือด่วน (แดง)', value: urgent, color: COLORS.URGENT }
  ].filter(d => d.value > 0);

  // สถิติแยกตามระดับชั้นเรียน
  const getGradeChartData = () => {
    const grades: { [key: string]: { name: string; normal: number; monitor: number; risk: number; urgent: number } } = {};

    students.forEach(s => {
      const level = s.classroom?.level || 'ไม่ระบุ';
      const lvlName = `ม.${level}`;
      const riskLvl = s.student_support_risk_analysis?.[0]?.risk_level || 'NORMAL';

      if (!grades[level]) {
        grades[level] = { name: lvlName, normal: 0, monitor: 0, risk: 0, urgent: 0 };
      }

      if (riskLvl === 'URGENT') grades[level].urgent++;
      else if (riskLvl === 'RISK') grades[level].risk++;
      else if (riskLvl === 'MONITOR') grades[level].monitor++;
      else grades[level].normal++;
    });

    // เรียงตามระดับ ม.1 -> ม.6
    return Object.keys(grades)
      .sort((a, b) => a.localeCompare(b))
      .map(k => grades[k]);
  };

  const gradeChartData = getGradeChartData();

  // กรองรายชื่อนักเรียนที่มีความเสี่ยงสูงเพื่อแสดงให้ผู้บริหารติดตาม
  const filteredHighRiskStudents = students.filter(s => {
    const riskLvl = s.student_support_risk_analysis?.[0]?.risk_level || 'NORMAL';
    const level = s.classroom?.level || '';
    const fullName = `${s.prefix || ''}${s.first_name} ${s.last_name}`.toLowerCase();
    const code = (s.student_code || '').toLowerCase();

    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || code.includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'ALL' || level === selectedGrade;
    const matchesRisk = selectedRisk === 'ALL' || riskLvl === selectedRisk;

    return matchesSearch && matchesGrade && matchesRisk;
  });

  const getRiskText = (level: string) => {
    switch (level) {
      case 'URGENT': return 'ช่วยเหลือด่วน';
      case 'RISK': return 'กลุ่มเสี่ยง';
      case 'MONITOR': return 'เฝ้าระวัง';
      default: return 'ปกติ';
    }
  };

  const getRiskColorClass = (level: string) => {
    switch (level) {
      case 'URGENT': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'RISK': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'MONITOR': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-bold">กำลังประมวลผลสถิติและแบบจำลองความเสี่ยง...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 relative overflow-hidden font-sans">
      
      {/* Decorative Glow elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/studentsupport')}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="space-y-1">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xxs font-bold uppercase tracking-widest rounded-full border border-indigo-500/35 flex items-center gap-1 w-fit">
                <School size={12} /> Executive Monitoring Hub
              </span>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                ระบบรายงานดูแลช่วยเหลือระดับโรงเรียน
              </h1>
              <p className="text-xs md:text-sm text-gray-400">
                สถิติรวมประชากรนักเรียนคัดกรอง SDQ, EQ และการเยี่ยมบ้าน
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/portal')}
              className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-white/10 hover:border-indigo-500/35 font-bold text-sm transition-all duration-300 flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              กลับหน้าพอร์ทัล
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Download size={16} />
              พิมพ์รายงาน PDF
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3 text-red-300 text-sm">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-3 right-3 p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Users size={20} />
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">นักเรียนประเมินแล้ว</p>
            <h3 className="text-3xl font-black mt-2 text-white">{totalStudents} <span className="text-sm text-gray-500">คน</span></h3>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-lg relative overflow-hidden hover:border-emerald-500/30 transition-all">
            <div className="absolute top-3 right-3 p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">กลุ่มปกติ</p>
            <h3 className="text-3xl font-black mt-2 text-emerald-400">{normal} <span className="text-xs text-gray-500">({totalStudents ? Math.round((normal/totalStudents)*100) : 0}%)</span></h3>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-lg relative overflow-hidden hover:border-yellow-500/30 transition-all">
            <div className="absolute top-3 right-3 p-2 bg-yellow-500/10 rounded-xl text-yellow-400">
              <Activity size={20} />
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">กลุ่มเฝ้าระวัง</p>
            <h3 className="text-3xl font-black mt-2 text-yellow-400">{monitor} <span className="text-xs text-gray-500">({totalStudents ? Math.round((monitor/totalStudents)*100) : 0}%)</span></h3>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-lg relative overflow-hidden hover:border-amber-500/30 transition-all">
            <div className="absolute top-3 right-3 p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <AlertTriangle size={20} />
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">กลุ่มเสี่ยง</p>
            <h3 className="text-3xl font-black mt-2 text-amber-400">{risk} <span className="text-xs text-gray-500">({totalStudents ? Math.round((risk/totalStudents)*100) : 0}%)</span></h3>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-white/5 border border-white/10 rounded-3xl p-5 shadow-lg relative overflow-hidden hover:border-rose-500/30 transition-all">
            <div className="absolute top-3 right-3 p-2 bg-rose-500/10 rounded-xl text-rose-400">
              <ShieldAlert size={20} />
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">กลุ่มช่วยเหลือด่วน</p>
            <h3 className="text-3xl font-black mt-2 text-rose-400">{urgent} <span className="text-xs text-gray-500">({totalStudents ? Math.round((urgent/totalStudents)*100) : 0}%)</span></h3>
          </div>
        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Pie Chart: Risk distribution */}
          <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-1 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-400" />
                สัดส่วนระดับความเสี่ยงภาพรวม
              </h3>
              <p className="text-xxs text-gray-400">ข้อมูลคัดกรองปัญญาประดิษฐ์บูรณาการทุกมิติ</p>
            </div>
            
            <div className="h-[240px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Total label center of doughnut */}
              <div className="absolute text-center">
                <span className="text-2xl font-black text-white">{totalStudents}</span>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">คนทั้งหมด</p>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xxs font-bold">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-gray-300 truncate">{d.name}</span>
                  <span className="text-white ml-auto">{d.value} คน</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart: Grade Distribution */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-1 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap size={18} className="text-emerald-400" />
                เปรียบเทียบระดับความเสี่ยงแยกตามชั้นปี
              </h3>
              <p className="text-xxs text-gray-400">ระดับชั้น ม.1 - ม.6 ในปีการศึกษาปัจจุบัน</p>
            </div>

            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Bar dataKey="normal" name="ปกติ" fill={COLORS.NORMAL} stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="monitor" name="เฝ้าระวัง" fill={COLORS.MONITOR} stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="risk" name="กลุ่มเสี่ยง" fill={COLORS.RISK} stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="urgent" name="ช่วยเหลือด่วน" fill={COLORS.URGENT} stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </section>

        {/* High Risk Cases Drilldown List */}
        <section className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">รายชื่อนักเรียนกลุ่มเสี่ยง (School-wide Support Directory)</h3>
              <p className="text-xs text-gray-400">ค้นหา คัดกรองความเสี่ยง และเข้าถึงประวัติ Profile 360°</p>
            </div>

            {/* Filters bar */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search input */}
              <div className="relative shrink-0 w-full md:w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500"
                />
              </div>

              {/* Grade selector */}
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-500 text-gray-300"
              >
                <option value="ALL">ระดับชั้นปี: ทั้งหมด</option>
                <option value="1">มัธยมศึกษาปีที่ 1</option>
                <option value="2">มัธยมศึกษาปีที่ 2</option>
                <option value="3">มัธยมศึกษาปีที่ 3</option>
                <option value="4">มัธยมศึกษาปีที่ 4</option>
                <option value="5">มัธยมศึกษาปีที่ 5</option>
                <option value="6">มัธยมศึกษาปีที่ 6</option>
              </select>

              {/* Risk selector */}
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-500 text-gray-300"
              >
                <option value="ALL">ความเสี่ยง: ทั้งหมด</option>
                <option value="URGENT">ช่วยเหลือด่วน (แดง)</option>
                <option value="RISK">กลุ่มเสี่ยง (ส้ม)</option>
                <option value="MONITOR">เฝ้าระวัง (เหลือง)</option>
                <option value="NORMAL">ปกติ (เขียว)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">รหัสนักเรียน</th>
                  <th className="py-3 px-4">ชื่อ-สกุล</th>
                  <th className="py-3 px-4">ชั้นปี</th>
                  <th className="py-3 px-4 text-center">ระดับความเสี่ยง</th>
                  <th className="py-3 px-4">ผล SDQ ล่าสุด</th>
                  <th className="py-3 px-4">ผล EQ ล่าสุด</th>
                  <th className="py-3 px-4 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredHighRiskStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500 font-bold">
                      ไม่พบคัดสรรนักเรียนตามเงื่อนไขดังกล่าว
                    </td>
                  </tr>
                ) : (
                  filteredHighRiskStudents.slice(0, 50).map(s => {
                    const rLvl = s.student_support_risk_analysis?.[0]?.risk_level || 'NORMAL';
                    const sdqLatest = s.student_support_sdq?.[0];
                    const eqLatest = s.student_support_eq?.[0];

                    return (
                      <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3 px-4 font-mono font-semibold text-gray-400">{s.student_code}</td>
                        <td className="py-3 px-4 font-bold text-white group-hover:text-indigo-400 transition-colors">
                          {s.prefix || ''}{s.first_name} {s.last_name}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          ม.{s.classroom?.level}/{s.classroom?.room}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black border ${getRiskColorClass(rLvl)}`}>
                            {getRiskText(rLvl)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {sdqLatest ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sdqLatest.result_difficulties === 'PROBLEM' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                              sdqLatest.result_difficulties === 'RISK' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {sdqLatest.result_difficulties === 'PROBLEM' ? 'มีปัญหา' :
                               sdqLatest.result_difficulties === 'RISK' ? 'เสี่ยง' : 'ปกติ'}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-[10px]">ไม่มีข้อมูล</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {eqLatest ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              eqLatest.eq_level === 'LOWER_THAN_NORMAL' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                              eqLatest.eq_level === 'NORMAL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                            }`}>
                              {eqLatest.eq_level === 'LOWER_THAN_NORMAL' ? 'ต่ำกว่าเกณฑ์' :
                               eqLatest.eq_level === 'NORMAL' ? 'ปกติ' : 'สูงกว่าเกณฑ์'}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-[10px]">ไม่มีข้อมูล</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => navigate(`/studentsupport/profile/${s.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-bold transition-all"
                          >
                            <Eye size={12} />
                            เรียกดู 360°
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
