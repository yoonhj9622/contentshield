// ==================== src/components/User/ProfileSettings.jsx ====================
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '../../services/userService'
import { User, Lock, Bell, Save } from 'lucide-react'

export default function ProfileSettings() {
  const queryClient = useQueryClient()
  const { data: profile } = useQuery('profile', userService.getProfile)
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <TabButton
              active={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
              icon={User}
            >
              Profile
            </TabButton>
            <TabButton
              active={activeTab === 'password'}
              onClick={() => setActiveTab('password')}
              icon={Lock}
            >
              Password
            </TabButton>
            <TabButton
              active={activeTab === 'notifications'}
              onClick={() => setActiveTab('notifications')}
              icon={Bell}
            >
              Notifications
            </TabButton>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && <ProfileTab profile={profile} />}
          {activeTab === 'password' && <PasswordTab />}
          {activeTab === 'notifications' && <NotificationsTab profile={profile} />}
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
        active
          ? 'border-primary-600 text-primary-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      <Icon className="h-5 w-5 mr-2" />
      {children}
    </button>
  )
}

function ProfileTab({ profile }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
    companyName: profile?.companyName || '',
    location: profile?.location || '',
  })

  const updateMutation = useMutation(
    (data) => userService.updateProfile(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('profile')
        alert('Profile updated successfully')
      },
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Bio</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({...formData, bio: e.target.value})}
          rows={3}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center"
        >
          <Save className="h-5 w-5 mr-2" />
          Save Changes
        </button>
      </div>
    </form>
  )
}

function PasswordTab() {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  const changeMutation = useMutation(
    ({ current, newPassword }) => userService.changePassword(current, newPassword),
    {
      onSuccess: () => {
        alert('Password changed successfully')
        setPasswords({ current: '', new: '', confirm: '' })
      },
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      alert('Passwords do not match')
      return
    }
    changeMutation.mutate({ current: passwords.current, newPassword: passwords.new })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div>
        <label className="block text-sm font-medium mb-1">Current Password</label>
        <input
          type="password"
          required
          value={passwords.current}
          onChange={(e) => setPasswords({...passwords, current: e.target.value})}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">New Password</label>
        <input
          type="password"
          required
          value={passwords.new}
          onChange={(e) => setPasswords({...passwords, new: e.target.value})}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Confirm New Password</label>
        <input
          type="password"
          required
          value={passwords.confirm}
          onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
      >
        Change Password
      </button>
    </form>
  )
}

function NotificationsTab({ profile }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Email Notifications</p>
          <p className="text-sm text-gray-500">Receive email updates</p>
        </div>
        <input type="checkbox" defaultChecked={profile?.emailNotifications} className="h-4 w-4" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">SMS Notifications</p>
          <p className="text-sm text-gray-500">Receive SMS alerts</p>
        </div>
        <input type="checkbox" defaultChecked={profile?.smsNotifications} className="h-4 w-4" />
      </div>
    </div>
  )
}
