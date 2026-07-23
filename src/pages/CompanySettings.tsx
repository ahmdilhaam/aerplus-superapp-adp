import { useState, useEffect } from 'react'
import { AlertCircle, Check, Building2 } from 'lucide-react'
import type { Company } from '../types'
import { getCompanyMe, updateCompanyMe } from '../services/api'
import { Button } from '../components/Button'

export const CompanySettings: React.FC = () => {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [nameInput, setNameInput] = useState('')
  const [priceInput, setPriceInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true)
        const data = await getCompanyMe()
        setCompany(data)
        setNameInput(data.name)
        setPriceInput(String(data.defaultGallonPrice))
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch company settings')
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
  }, [])

  const parsedPrice = parseInt(priceInput, 10)
  const isValidPrice = !isNaN(parsedPrice) && parsedPrice >= 0
  const isValidName = nameInput.trim().length > 0
  const canSave = isValidPrice && isValidName

  const handleSave = async () => {
    if (!canSave) return

    try {
      setIsSaving(true)
      setSaveError(null)
      setSaveSuccess(false)

      const updated = await updateCompanyMe({ name: nameInput.trim(), defaultGallonPrice: parsedPrice })
      setCompany(updated)
      setNameInput(updated.name)
      setPriceInput(String(updated.defaultGallonPrice))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save company settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary-900 tracking-tight">Company Settings</h1>
          <p className="text-secondary-500 font-medium mt-2">Manage company-wide configuration</p>
        </div>
      </div>

      {/* Success message */}
      {saveSuccess && (
        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl text-emerald-800 font-bold flex items-center gap-3 shadow-sm shadow-emerald-100">
          <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <Check size={20} strokeWidth={3} />
          </div>
          Company settings saved successfully!
        </div>
      )}

      {/* Load error */}
      {error && (
        <div className="text-center py-24 bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-rose-50/30 opacity-50"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-lg shadow-rose-200">
              <AlertCircle size={32} strokeWidth={2.5} />
            </div>
            <h4 className="text-xl font-black text-secondary-900 tracking-tight mb-2">Failed to Load Settings</h4>
            <p className="text-rose-500 font-bold uppercase tracking-widest text-[10px] bg-rose-50 px-4 py-1.5 rounded-full inline-block mb-4">{error}</p>
            <p className="text-secondary-400 text-[11px] font-semibold italic max-w-xs mx-auto">Please refresh the page to try again.</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-32 bg-white rounded-2xl border border-secondary-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-primary-50 rounded-full blur-3xl opacity-50 animate-pulse"></div>
          <div className="text-center relative z-10">
            <div className="relative mb-6 mx-auto w-20 h-20">
              <div className="absolute inset-0 border-4 border-primary-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-secondary-900 font-black uppercase tracking-[0.2em] text-xs">Loading company settings...</p>
            <p className="text-secondary-400 text-[10px] font-bold mt-2 italic">Please wait a moment</p>
          </div>
        </div>
      ) : !error && company ? (
        <div className="bg-white rounded-[2.5rem] border border-secondary-100 p-10 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-secondary-200/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
              <Building2 size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-secondary-900 tracking-tight">{company.name}</h2>
              <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest mt-0.5">{company.slug}</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Company Name field */}
            <div>
              <label className="block text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-3 ml-1">
                Company Name
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value)
                  setSaveError(null)
                  setSaveSuccess(false)
                }}
                placeholder="Company name"
                className="w-full px-6 py-4 bg-secondary-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold text-secondary-900 placeholder:text-secondary-300"
              />
              {nameInput.trim() === '' && (
                <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">
                  Company name is required.
                </p>
              )}
            </div>

            {/* Default Gallon Price field */}
            <div>
              <label className="block text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-3 ml-1">
                Default Gallon Price
              </label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary-400 font-black text-sm select-none">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={priceInput}
                  onChange={(e) => {
                    setPriceInput(e.target.value)
                    setSaveError(null)
                    setSaveSuccess(false)
                  }}
                  placeholder="0"
                  className="w-full pl-14 pr-6 py-4 bg-secondary-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold text-secondary-900 placeholder:text-secondary-300"
                />
              </div>
              <p className="text-[10px] text-secondary-400 font-semibold mt-2 ml-1">
                Price per gallon in Rupiah (IDR). Must be a non-negative whole number.
              </p>
              {priceInput !== '' && !isValidPrice && (
                <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">
                  Please enter a valid non-negative integer.
                </p>
              )}
            </div>

            {/* Save error */}
            {saveError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="text-red-800 font-bold text-sm">Save Failed</p>
                  <p className="text-red-600 text-xs mt-1">{saveError}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving || !canSave}
                className="px-10 h-14"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
