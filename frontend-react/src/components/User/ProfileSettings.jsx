// ==================== src/components/User/ProfileSettings.jsx (다크 테마 적용) ====================
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '../../services/userService'
import { 
  User, Lock, Bell, Save, Camera, AlertCircle, 
  CheckCircle, Loader2, Mail, Phone, MapPin, Briefcase,
  Shield, Clock, TrendingUp, Smartphone
} from 'lucide-react'

export default function ProfileSettings() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [toast, setToast] = useState(null)

  // 사용자 정보 조회
  const { data: userInfo, isLoading: userLoading } = useQuery({
    queryKey: ['userInfo'],
    queryFn: userService.getUserInfo,
  })

  // 프로필 정보 조회
  const { data: profile, isLoading: profileLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: userService.getProfile,
  })

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  if (userLoading || profileLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <p className="text-red-400">프로필을 불러오는데 실패했습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">설정</h1>
        <p className="text-slate-400 mt-2">계정 정보 및 환경설정을 관리합니다</p>
      </div>

      {/* User Info Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-xl p-6 mb-6 text-white">
        <div className="flex items-center">
          <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {userInfo?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="ml-4">
            <h2 className="text-2xl font-bold">{userInfo?.username || 'Unknown'}</h2>
            <p className="text-blue-100">{userInfo?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
              {userInfo?.role === 'ADMIN' ? '관리자' : '일반 사용자'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
        <div className="border-b border-slate-800">
          <nav className="flex space-x-8 px-6">
            <TabButton
              active={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
              icon={User}
            >
              프로필
            </TabButton>
            <TabButton
              active={activeTab === 'password'}
              onClick={() => setActiveTab('password')}
              icon={Lock}
            >
              비밀번호
            </TabButton>
            <TabButton
              active={activeTab === 'notifications'}
              onClick={() => setActiveTab('notifications')}
              icon={Bell}
            >
              알림 설정
            </TabButton>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <ProfileTab profile={profile} showToast={showToast} />
          )}
          {activeTab === 'password' && (
            <PasswordTab showToast={showToast} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsTab profile={profile} showToast={showToast} />
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Tab Button Component
// ============================================
function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
        active
          ? 'border-blue-500 text-blue-400'
          : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'
      }`}
    >
      <Icon className="h-5 w-5 mr-2" />
      {children}
    </button>
  )
}

// ============================================
// Profile Tab
// ============================================
function ProfileTab({ profile, showToast }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    bio: '',
    companyName: '',
    location: '',
  })
  const [previewImage, setPreviewImage] = useState(null)

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        companyName: profile.companyName || '',
        location: profile.location || '',
        profileImageUrl: profile.profileImageUrl || '', // ⭐ 이미지 URL 포함
      })
      setPreviewImage(profile.profileImageUrl)
    }
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: (data) => userService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile'])
      showToast('프로필이 성공적으로 업데이트되었습니다', 'success')
    },
    onError: (error) => {
      showToast(error.response?.data?.error || '프로필 업데이트에 실패했습니다', 'error')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('이미지 크기는 5MB를 초과할 수 없습니다', 'error')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const imageData = reader.result
        setPreviewImage(imageData)
        // ⭐ 함수형 업데이트로 안전하게 추가
        setFormData(prev => ({ ...prev, profileImageUrl: imageData }))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
      {/* Profile Image */}
      <div className="flex items-center space-x-6">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-700">
            {previewImage ? (
              <img src={previewImage} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <User className="h-12 w-12 text-slate-600" />
            )}
          </div>
          <label
            htmlFor="image-upload"
            className="absolute bottom-0 right-0 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Camera className="h-4 w-4 text-white" />
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">프로필 사진</h3>
          <p className="text-sm text-slate-500">JPG, PNG 파일 (최대 5MB)</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="이름"
          icon={User}
          value={formData.fullName}
          onChange={(value) => setFormData({ ...formData, fullName: value })}
          placeholder="홍길동"
        />
        
        <FormField
          label="전화번호"
          icon={Phone}
          value={formData.phone}
          onChange={(value) => setFormData({ ...formData, phone: value })}
          placeholder="010-1234-5678"
        />

        <FormField
          label="회사"
          icon={Briefcase}
          value={formData.companyName}
          onChange={(value) => setFormData({ ...formData, companyName: value })}
          placeholder="회사명"
        />

        <FormField
          label="지역"
          icon={MapPin}
          value={formData.location}
          onChange={(value) => setFormData({ ...formData, location: value })}
          placeholder="서울, 대한민국"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          소개
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={4}
          maxLength={500}
          className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none placeholder:text-slate-600"
          placeholder="자기소개를 입력하세요..."
        />
        <p className="text-xs text-slate-500 mt-1">
          {formData.bio.length} / 500 자
        </p>
      </div>

      {/* Submit Button - 항상 보이도록 고정 */}
      <div className="sticky bottom-0 bg-slate-900 pt-4 pb-2 border-t border-slate-800 -mx-2 px-2 flex justify-end">
        <button
          type="submit"
          disabled={updateMutation.isLoading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors shadow-lg shadow-blue-600/20"
        >
          {updateMutation.isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              변경사항 저장
            </>
          )}
        </button>
      </div>
    </form>
  )
}

// ============================================
// Password Tab
// ============================================
function PasswordTab({ showToast }) {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [errors, setErrors] = useState({})

  const changeMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      userService.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      showToast('비밀번호가 성공적으로 변경되었습니다', 'success')
      setPasswords({ current: '', new: '', confirm: '' })
      setErrors({})
    },
    onError: (error) => {
      showToast(error.response?.data?.error || '비밀번호 변경에 실패했습니다', 'error')
    },
  })

  const validatePassword = (password) => {
    if (password.length < 8) {
      return '비밀번호는 최소 8자 이상이어야 합니다'
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return '대문자, 소문자, 숫자를 포함해야 합니다'
    }
    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const newErrors = {}
    
    if (!passwords.current) {
      newErrors.current = '현재 비밀번호를 입력하세요'
    }
    
    const passwordError = validatePassword(passwords.new)
    if (passwordError) {
      newErrors.new = passwordError
    }
    
    if (passwords.new !== passwords.confirm) {
      newErrors.confirm = '비밀번호가 일치하지 않습니다'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    changeMutation.mutate({
      currentPassword: passwords.current,
      newPassword: passwords.new,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>비밀번호 요구사항:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>최소 8자 이상</li>
            <li>대문자, 소문자, 숫자 포함</li>
          </ul>
        </p>
      </div>

      <PasswordField
        label="현재 비밀번호"
        value={passwords.current}
        onChange={(value) => {
          setPasswords({ ...passwords, current: value })
          setErrors({ ...errors, current: null })
        }}
        error={errors.current}
      />

      <PasswordField
        label="새 비밀번호"
        value={passwords.new}
        onChange={(value) => {
          setPasswords({ ...passwords, new: value })
          setErrors({ ...errors, new: null })
        }}
        error={errors.new}
      />

      <PasswordField
        label="새 비밀번호 확인"
        value={passwords.confirm}
        onChange={(value) => {
          setPasswords({ ...passwords, confirm: value })
          setErrors({ ...errors, confirm: null })
        }}
        error={errors.confirm}
      />

      <button
        type="submit"
        disabled={changeMutation.isLoading}
        className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-lg shadow-blue-600/20"
      >
        {changeMutation.isLoading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            변경 중...
          </>
        ) : (
          <>
            <Lock className="h-5 w-5 mr-2" />
            비밀번호 변경
          </>
        )}
      </button>
    </form>
  )
}

// ============================================
// Notifications Tab (간단 버전)
// ============================================
function NotificationsTab({ profile, showToast}) {
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
  })

  useEffect(() => {
    if (profile) {
      setSettings({
        emailNotifications: profile.emailNotifications ?? true,
        smsNotifications: profile.smsNotifications ?? false,
        marketingEmails: profile.marketingEmails ?? false,
      })
    }
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: (data) => userService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile'])
      showToast('알림 설정이 저장되었습니다', 'success')
    },
    onError: (error) => {
      showToast(error.response?.data?.error || '설정 저장에 실패했습니다', 'error')
    },
  })

  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    setSettings(newSettings)
    updateMutation.mutate(newSettings)
  }

  const notificationOptions = [
    {
      key: 'emailNotifications',
      title: '이메일 알림',
      description: '중요한 업데이트와 활동을 이메일로 받습니다',
      icon: Mail,
    },
    {
      key: 'smsNotifications',
      title: 'SMS 알림',
      description: '긴급 알림을 SMS로 받습니다',
      icon: Smartphone,
    },
    {
      key: 'marketingEmails',
      title: '마케팅 이메일',
      description: '프로모션 및 뉴스레터를 받습니다',
      icon: Bell,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
        <p className="text-sm text-yellow-300">
          알림 설정은 즉시 저장됩니다.
        </p>
      </div>

      <div className="space-y-4">
        {notificationOptions.map((option) => (
          <NotificationToggle
            key={option.key}
            {...option}
            checked={settings[option.key]}
            onChange={() => handleToggle(option.key)}
            loading={updateMutation.isLoading}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================
// Helper Components
// ============================================
function FormField({ label, icon: Icon, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder:text-slate-600"
        />
      </div>
    </div>
  )
}

function PasswordField({ label, value, onChange, error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-2 bg-slate-950 border rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent ${
          error ? 'border-red-500/50' : 'border-slate-800'
        }`}
        required
      />
      {error && (
        <p className="text-sm text-red-400 mt-1 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  )
}

function NotificationToggle({ title, description, icon: Icon, checked, onChange, loading }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-800 hover:bg-slate-950 transition-colors">
      <div className="flex items-start">
        <Icon className="h-5 w-5 text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <p className="font-medium text-white">{title}</p>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onChange}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 flex-shrink-0 ${
          checked ? 'bg-blue-600' : 'bg-slate-700'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

function Toast({ message, type, onClose }) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
  }
  const colors = {
    success: 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100',
    error: 'bg-red-900/90 border-red-500/50 text-red-100',
  }
  
  const Icon = icons[type]
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`flex items-center p-4 rounded-lg border shadow-xl backdrop-blur-sm ${colors[type]}`}>
        <Icon className="h-5 w-5 mr-3" />
        <p className="font-medium">{message}</p>
        <button onClick={onClose} className="ml-4 text-white/70 hover:text-white">
          ×
        </button>
      </div>
    </div>
  )
}
