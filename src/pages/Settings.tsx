import { useState } from 'react'
import { Button } from '../components/Button'
import { User, Lock, Bell, Palette, Languages, Check, ShieldCheck, Eye, EyeOff } from 'lucide-react'

interface ProfileFormData {
  name: string
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface PreferencesFormData {
  theme: 'light' | 'dark' | 'auto'
  language: 'en' | 'id' | 'es'
  emailNotifications: boolean
  smsNotifications: boolean
}

export const Settings: React.FC = () => {
  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: 'John Doe',
    email: 'john@example.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [preferencesData, setPreferencesData] = useState<PreferencesFormData>({
    theme: 'light',
    language: 'en',
    emailNotifications: true,
    smsNotifications: false,
  })

  const [saveMessage, setSaveMessage] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePreferenceChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value, type } = e.target
    const isCheckbox = type === 'checkbox' && (e.target instanceof HTMLInputElement)
    const newValue = isCheckbox ? (e.target as HTMLInputElement).checked : value

    setPreferencesData((prev) => ({
      ...prev,
      [name]: newValue,
    }))
  }

  const handleSaveProfile = () => {
    if (profileData.newPassword !== profileData.confirmPassword) {
      alert("New passwords don't match!")
      return
    }
    setSaveMessage('✓ Profile updated successfully!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleSavePreferences = () => {
    setSaveMessage('✓ Preferences updated successfully!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  return (
    <div className="max-w-4xl space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary-900 tracking-tight">Settings</h1>
          <p className="text-secondary-500 font-medium mt-2">Manage your account and system preferences</p>
        </div>
      </div>

      {saveMessage && (
        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl text-emerald-800 font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm shadow-emerald-100">
          <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <Check size={20} strokeWidth={3} />
          </div>
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-6 py-4 rounded-[1.5rem] bg-primary-600 text-white shadow-lg shadow-primary-200 transition-all">
            <User size={20} strokeWidth={2.5} />
            <span className="font-bold text-sm">Account Profile</span>
          </button>
          <button className="w-full flex items-center gap-3 px-6 py-4 rounded-[1.5rem] bg-white text-secondary-400 hover:bg-secondary-50 transition-all border border-transparent">
            <Palette size={20} strokeWidth={2.5} />
            <span className="font-bold text-sm">Visual & Theme</span>
          </button>
          <button className="w-full flex items-center gap-3 px-6 py-4 rounded-[1.5rem] bg-white text-secondary-400 hover:bg-secondary-50 transition-all border border-transparent">
            <Bell size={20} strokeWidth={2.5} />
            <span className="font-bold text-sm">Notifications</span>
          </button>
          <button className="w-full flex items-center gap-3 px-6 py-4 rounded-[1.5rem] bg-white text-secondary-400 hover:bg-secondary-50 transition-all border border-transparent">
            <ShieldCheck size={20} strokeWidth={2.5} />
            <span className="font-bold text-sm">Security & Privacy</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-10">
          {/* Profile Settings */}
          <div className="bg-white rounded-[2.5rem] border border-secondary-100 p-10 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-secondary-200/50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                <User size={24} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black text-secondary-900 tracking-tight">Public Profile</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-3 ml-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="w-full px-6 py-4 bg-secondary-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold text-secondary-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-3 ml-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="w-full px-6 py-4 bg-secondary-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold text-secondary-900"
                />
              </div>

              <div className="border-t border-secondary-100 pt-8 mt-8">
                <div className="flex items-center gap-3 mb-6">
                  <Lock size={18} className="text-secondary-400" />
                  <h3 className="font-black text-secondary-900 uppercase tracking-widest text-xs">Security Refresh</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-3 ml-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={profileData.newPassword}
                        onChange={handleProfileChange}
                        className="w-full pl-6 pr-14 py-4 bg-secondary-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold text-secondary-900 placeholder:text-secondary-300"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        title={showNewPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                        className="absolute inset-y-0 right-0 pr-6 flex items-center text-secondary-400 hover:text-primary-500 transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-3 ml-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={profileData.confirmPassword}
                        onChange={handleProfileChange}
                        className="w-full pl-6 pr-14 py-4 bg-secondary-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold text-secondary-900 placeholder:text-secondary-300"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        title={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                        className="absolute inset-y-0 right-0 pr-6 flex items-center text-secondary-400 hover:text-primary-500 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <Button onClick={handleSaveProfile} variant="primary" className="px-10 h-14">
                  Save Account Changes
                </Button>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-[2.5rem] border border-secondary-100 p-10 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-secondary-200/50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-secondary-50 rounded-2xl flex items-center justify-center text-secondary-600">
                <Palette size={24} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black text-secondary-900 tracking-tight">System Experience</h2>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-3 ml-1">Interface Language</label>
                  <div className="relative">
                    <select
                      name="language"
                      value={preferencesData.language}
                      onChange={handlePreferenceChange}
                      className="w-full px-6 py-4 bg-secondary-50 border-2 border-transparent rounded-[1.5rem] appearance-none focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold text-secondary-900"
                    >
                      <option value="en">English (US)</option>
                      <option value="id">Bahasa Indonesia</option>
                      <option value="es">Español</option>
                    </select>
                    <Languages className="absolute right-6 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={18} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-3 ml-1">Visual Theme</label>
                  <select
                    name="theme"
                    value={preferencesData.theme}
                    onChange={handlePreferenceChange}
                    className="w-full px-6 py-4 bg-secondary-50 border-2 border-transparent rounded-[1.5rem] appearance-none focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold text-secondary-900"
                  >
                    <option value="light">Solar Light</option>
                    <option value="dark">Midnight Dark</option>
                    <option value="auto">System Default</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <label className="flex items-center gap-4 p-4 bg-secondary-50/50 rounded-2xl cursor-pointer hover:bg-secondary-50 transition-colors">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={preferencesData.emailNotifications}
                    onChange={handlePreferenceChange}
                    className="w-5 h-5 rounded-lg border-2 border-secondary-200 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="block font-bold text-secondary-900 text-sm">Email Reports</span>
                    <span className="block text-[10px] text-secondary-500 uppercase tracking-widest font-bold">Weekly activity summary</span>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 bg-secondary-50/50 rounded-2xl cursor-pointer hover:bg-secondary-50 transition-colors">
                  <input
                    type="checkbox"
                    name="smsNotifications"
                    checked={preferencesData.smsNotifications}
                    onChange={handlePreferenceChange}
                    className="w-5 h-5 rounded-lg border-2 border-secondary-200 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="block font-bold text-secondary-900 text-sm">Push Alerts</span>
                    <span className="block text-[10px] text-secondary-500 uppercase tracking-widest font-bold">Immediate mobile notifications</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-6">
                <Button onClick={handleSavePreferences} variant="primary" className="px-10 h-14">
                  Update Preferences
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
