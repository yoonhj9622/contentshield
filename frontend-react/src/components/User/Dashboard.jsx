// ==================== src/components/User/Dashboard.jsx ====================
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analysisService } from '../../services/analysisService'
import { channelService } from '../../services/channelService'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Shield, AlertTriangle, CheckCircle } from 'lucide-react'

export default function Dashboard() {
  const { data: stats } = useQuery('analysisStats', analysisService.getStats)
  const { data: channels } = useQuery('channels', channelService.getChannels)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Analyzed"
          value={stats?.totalAnalyzed || 0}
          icon={Shield}
          color="blue"
        />
        <StatCard
          title="Malicious Detected"
          value={stats?.maliciousCount || 0}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Safe Comments"
          value={(stats?.totalAnalyzed || 0) - (stats?.maliciousCount || 0)}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Detection Rate"
          value={`${(stats?.maliciousRate || 0).toFixed(1)}%`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Channels */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Connected Channels</h2>
        <div className="space-y-3">
          {channels?.length > 0 ? (
            channels.map((channel) => (
              <div
                key={channel.channelId}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{channel.channelName}</p>
                  <p className="text-sm text-gray-500">{channel.platform}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {channel.analyzedComments} analyzed
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      channel.verificationStatus === 'VERIFIED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {channel.verificationStatus}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">
              No channels connected. Add your first channel to get started.
            </p>
          )}
        </div>
      </div>

      {/* Recent Activity Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Analysis Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={generateMockData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="analyzed" fill="#3b82f6" />
            <Bar dataKey="malicious" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

function generateMockData() {
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    analyzed: Math.floor(Math.random() * 100) + 50,
    malicious: Math.floor(Math.random() * 30) + 10,
  }))
}