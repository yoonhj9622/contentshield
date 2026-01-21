import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, Shield, AlertTriangle, CheckCircle, FileText, Plus, Edit, Trash2,
  Wand2, Copy, RotateCcw, Sparkles, UserX, Search, MessageSquare, 
  User, Activity, Bell, Lock, Save, Send, Lightbulb
} from 'lucide-react';

// --- [다크 모드 전용 UI 부품] ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-xl ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = "" }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = "" }) => <h3 className={`text-xl font-bold tracking-tight text-white ${className}`}>{children}</h3>;
const CardContent = ({ children, className = "" }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

const Button = ({ children, variant = "primary", className = "", ...props }) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20",
    outline: "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300",
    ghost: "hover:bg-slate-800 text-slate-400 hover:text-white",
    destructive: "bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/30"
  };
  return <button className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-95 ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Input = (props) => <input className="flex h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" {...props} />;
const Textarea = (props) => <textarea className="flex min-h-[80px] w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" {...props} />;

// --- [메인 컴포넌트] ---
export default function DashboardV2() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Shield },
    { id: 'analysis', label: 'AI Analysis', icon: Search },
    { id: 'management', label: 'Comments', icon: MessageSquare },
    { id: 'blacklist', label: 'Blacklist', icon: UserX },
    { id: 'writing', label: 'AI Assistant', icon: Wand2 },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'stats', label: 'Statistics', icon: Activity },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl hidden md:block">
        <div className="p-8">
          <h2 className="text-2xl font-black text-blue-500 flex items-center gap-2 tracking-tighter">
            <Shield className="fill-blue-500/20" /> GUARD AI
          </h2>
        </div>
        <nav className="px-4 space-y-2">
          {menuItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} /> 
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'analysis' && <CommentAnalysisView />}
          {activeTab === 'management' && <CommentManagementView />}
          {activeTab === 'blacklist' && <BlacklistView />}
          {activeTab === 'writing' && <WritingAssistantView />}
          {activeTab === 'templates' && <TemplateView />}
          {activeTab === 'stats' && <StatisticsView />}
          {activeTab === 'profile' && <ProfileView />}
        </div>
      </main>
    </div>
  );
}

// --- [1. Dashboard View] ---
function DashboardView() {
  const chartData = [
    { name: 'Mon', count: 40 }, { name: 'Tue', count: 30 }, { name: 'Wed', count: 60 },
    { name: 'Thu', count: 45 }, { name: 'Fri', count: 90 }, { name: 'Sat', count: 55 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-white">System Overview</h1>
        <p className="text-slate-500">실시간 보안 및 댓글 분석 현황입니다.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total" value="1,284" icon={Shield} color="text-blue-400" />
        <StatCard title="Malicious" value="92" icon={AlertTriangle} color="text-red-400" />
        <StatCard title="Clean" value="1,192" icon={CheckCircle} color="text-emerald-400" />
        <StatCard title="Detection" value="7.1%" icon={TrendingUp} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Weekly Activity</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  cursor={{fill: '#1e293b'}}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                <div>
                  <p className="text-sm font-medium">새로운 악성 댓글 감지</p>
                  <p className="text-xs text-slate-500">2분 전</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- [2. Blacklist View] ---
function BlacklistView() {
  const [list, setList] = useState([
    { id: '1', name: 'SpamUser123', identifier: 'UC123abc', count: 5, reason: 'Repeated spam', date: '2024-01-15' },
    { id: '2', name: 'TrollAccount', identifier: 'UC456def', count: 12, reason: 'Hate speech', date: '2024-01-10' }
  ]);
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Blacklist Management</h2>
          <p className="text-slate-500 text-sm">차단된 사용자 목록을 관리합니다.</p>
        </div>
        <Button className="gap-2"><Plus size={16}/> Add User</Button>
      </div>
      <Card><CardContent className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">User Info</th>
              <th className="p-4">Violations</th>
              <th className="p-4">Primary Reason</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {list.map(i => (
              <tr key={i.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="p-4">
                  <div className="font-bold text-slate-200">{i.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{i.identifier}</div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded bg-red-900/20 text-red-400 text-xs font-bold border border-red-900/30">{i.count} Hits</span>
                </td>
                <td className="p-4 text-slate-400 text-sm">{i.reason}</td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100"><Trash2 size={16} className="text-red-500"/></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}

// --- [3. AI Analysis View] ---
function CommentAnalysisView() {
  const [text, setText] = useState('');
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 text-blue-500 mb-2"><Search size={32} /></div>
        <h2 className="text-3xl font-black text-white">AI Content Analysis</h2>
        <p className="text-slate-500">문장의 맥락을 분석하여 유해성을 판별합니다.</p>
      </div>
      <Card className="border-blue-900/30 bg-slate-900/80 backdrop-blur">
        <CardContent className="p-8 space-y-6">
          <Textarea 
            placeholder="분석할 댓글이나 문장을 입력하세요..." 
            value={text} 
            onChange={(e)=>setText(e.target.value)} 
            className="h-48 bg-slate-950/50 border-slate-800 text-lg p-6" 
          />
          <Button className="w-full h-14 text-lg font-bold shadow-blue-600/20" variant="primary">
            <Sparkles className="mr-2" size={20} /> 실시간 분석하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// --- [4. Template View] ---
function TemplateView() {
  const templates = [
    { id: 1, name: 'Welcome Message', category: 'General', content: '방문해주셔서 감사합니다! 긍정적인 커뮤니티를 함께 만들어요.' },
    { id: 2, name: 'Support Reply', category: 'Help', content: '문의하신 내용은 확인 후 빠르게 답변 드리겠습니다.' },
  ];
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Reply Templates</h2><Button className="gap-2"><Plus size={16}/> New</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(t => (
          <Card key={t.id} className="hover:border-blue-600/50 transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/10 px-2 py-1 rounded">{t.category}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Edit size={14}/><Trash2 size={14} className="text-red-500"/></div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t.name}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{t.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- [공통 보조 컴포넌트] ---
function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Card className="border-slate-800/50 hover:bg-slate-800/50 transition-colors">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-black text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 ${color} shadow-inner`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
      </CardContent>
    </Card>
  );
}

// 나머지 뷰는 위와 동일한 다크 테마 컨셉으로 표시 (생략된 뷰들)
function WritingAssistantView() { return <div className="text-center p-20 text-slate-500">Writing Assistant Module Loading...</div>; }
function StatisticsView() { return <div className="text-center p-20 text-slate-500">Advanced Analytics Data Preparing...</div>; }
function CommentManagementView() { return <div className="text-center p-20 text-slate-500">Comment Feed Synchronizing...</div>; }
function ProfileView() { return <div className="text-center p-20 text-slate-500">Secure Profile Settings...</div>; }