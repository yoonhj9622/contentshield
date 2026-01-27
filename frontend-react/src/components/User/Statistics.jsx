// ==================== src/components/User/Statistics.jsx ====================
import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Shield, AlertTriangle, UserX, CheckCircle, Activity, PieChart as PieChartIcon } from 'lucide-react';
import dashboardService from '../../services/dashboardService';

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center p-20 text-slate-500 animate-pulse">통계 데이터를 불러오는 중...</div>;
  }

  if (!stats) {
    return <div className="text-center p-20 text-red-400">데이터를 불러오지 못했습니다.</div>;
  }

  // --- Data Mapping ---
  const statsCards = [
    { title: 'Total Comments', value: stats.total?.toLocaleString() || '0', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-900/50' },
    { title: 'Malicious Comments', value: stats.malicious?.toLocaleString() || '0', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-900/50' },
    { title: 'Safe Comments', value: stats.clean?.toLocaleString() || '0', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-900/50' },
    { title: 'Blacklisted Users', value: stats.blacklistCount?.toLocaleString() || '0', icon: UserX, color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-700' },
  ];

  // Category Colors
  const COLORS = {
    'profanity': '#0ea5e9', // Sky Blue (changed from Orange to be distinct from Yellow)
    'hate_speech': '#ef4444', // Red
    'sexual_content': '#ec4899', // Pink
    'violence': '#8b5cf6', // Violet
    'threat': '#d946ef', // Fuchsia
    'highly_toxic': '#b91c1c', // Dark Red
    'moderately_toxic': '#eab308', // Yellow (cleaned up)
    'spam': '#6366f1', // Indigo
    'UNKNOWN': '#94a3b8', // Slate
    'safe': '#10b981' // Emerald
  };

  const typeData = stats.typeBreakdown
    ? Object.entries(stats.typeBreakdown).map(([key, value]) => ({
      name: key,
      value: value,
      color: COLORS[key] || '#94a3b8'
    }))
    : [{ name: 'No Data', value: 1, color: '#334155' }];

  const weeklyData = stats.weeklyMaliciousActivity || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Statistics Overview</h2>
        <p className="text-slate-500">전체 댓글 분석 및 사용자 활동 통계입니다. (Real-time DB Data)</p>
      </div>

      {/* 1. Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className={`p-6 rounded-xl border ${stat.border} ${stat.bg} shadow-lg transition-transform hover:scale-105`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-3xl font-black text-white mt-1">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-lg bg-slate-950/50 ${stat.color}`}>
                <stat.icon size={28} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pie Chart: Type Analysis */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <PieChartIcon size={20} className="text-blue-500" /> 유형별 분석 현황
            </h3>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Weekly Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity size={20} className="text-red-500" /> 악성 댓글 주간 분석 추이
            </h3>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  cursor={{ fill: '#1e293b' }}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;