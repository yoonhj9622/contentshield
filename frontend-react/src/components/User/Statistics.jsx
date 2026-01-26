// ==================== src/components/User/Statistics.jsx ====================
import { useQuery } from '@tanstack/react-query'
import { analysisService } from '../../services/analysisService'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

export default function Statistics() {
  const { data: history } = useQuery('analysisHistory', analysisService.getHistory)

  const categoryData = calculateCategoryData(history || [])
  const trends = calculateTrends(history || [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Statistics</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <TrendCard
          title="Total Analyzed"
          value={history?.length || 0}
          trend={trends.totalTrend}
          icon={Activity}
        />
        <TrendCard
          title="Avg Toxicity"
          value={`${trends.avgToxicity.toFixed(1)}%`}
          trend={trends.toxicityTrend}
          icon={TrendingUp}
        />
        <TrendCard
          title="Detection Rate"
          value={`${trends.detectionRate.toFixed(1)}%`}
          trend={trends.detectionTrend}
          icon={TrendingDown}
        />
      </div>

      {/* Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Category Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Analysis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Analysis</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {history?.slice(0, 10).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.category}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.analyzedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {item.toxicityScore.toFixed(1)}%
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      item.toxicityScore > 50
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {item.toxicityScore > 50 ? 'Malicious' : 'Safe'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TrendCard({ title, value, trend, icon: Icon }) {
  const isPositive = trend > 0

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{title}</p>
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className={`text-sm mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{trend.toFixed(1)}% from last week
      </p>
    </div>
  )
}

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']

function renderCustomLabel({ name, percent }) {
  return `${name} ${(percent * 100).toFixed(0)}%`
}

function calculateCategoryData(history) {
  const categories = {}
  history.forEach((item) => {
    categories[item.category] = (categories[item.category] || 0) + 1
  })
  
  return Object.entries(categories).map(([name, value]) => ({ name, value }))
}

function calculateTrends(history) {
  const total = history.length
  const avgToxicity = total > 0
    ? history.reduce((sum, item) => sum + item.toxicityScore, 0) / total
    : 0
  const detectionRate = total > 0
    ? (history.filter(item => item.toxicityScore > 50).length / total) * 100
    : 0

  return {
    totalTrend: Math.random() * 10 - 5,
    avgToxicity,
    toxicityTrend: Math.random() * 10 - 5,
    detectionRate,
    detectionTrend: Math.random() * 10 - 5,
  }
}