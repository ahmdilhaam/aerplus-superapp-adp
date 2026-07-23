import { useEffect, useState } from 'react'
import { CheckCircle, HelpCircle } from 'lucide-react'
import type { ChecklistQuestion } from '../types'
import { getChecklistQuestions } from '../services/api'

export const VisitChecklistQuestionsTab: React.FC = () => {
  const [questions, setQuestions] = useState<ChecklistQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getChecklistQuestions()
        setQuestions(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions')
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [])

  const getQuestionTypeLabel = (type: ChecklistQuestion['questionType']): string => {
    const typeMap = {
      text: 'Text Answer',
      multiple_choice: 'Multiple Choice',
      yes_no: 'Yes/No',
      rating: 'Rating',
    }
    return typeMap[type]
  }

  const groupedByCategory = questions.reduce(
    (acc, question) => {
      if (!acc[question.category]) {
        acc[question.category] = []
      }
      acc[question.category].push(question)
      return acc
    },
    {} as Record<string, ChecklistQuestion[]>
  )

  if (loading) {
    return (
      <div className="text-center py-20 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
        <p className="text-secondary-400 font-black uppercase tracking-[0.2em] text-[10px]">Compiling Audit Log...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-rose-50/50 rounded-[2rem] border border-rose-100">
        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-4">
          <HelpCircle size={32} strokeWidth={2.5} />
        </div>
        <p className="text-rose-900 font-black uppercase tracking-tight">Audit Interrupted</p>
        <p className="text-rose-500 text-xs font-bold mt-1">{error}</p>
      </div>
    )
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-20 bg-secondary-50/50 rounded-[2rem] border border-secondary-100">
        <div className="w-16 h-16 bg-secondary-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-secondary-300">
          <HelpCircle size={32} strokeWidth={1} />
        </div>
        <p className="text-secondary-900 font-black uppercase tracking-tight">No Quality Gates</p>
        <p className="text-secondary-400 text-xs font-bold mt-1">Checklist items will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {Object.entries(groupedByCategory).map(([category, categoryQuestions]) => (
        <div key={category} className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-xl font-black text-secondary-900 tracking-tight">
              {category}
            </h3>
            <div className="h-[2px] flex-1 bg-secondary-100 rounded-full"></div>
            <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">{categoryQuestions.length} Items</span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {categoryQuestions.map((question) => (
              <div
                key={question.id}
                className="bg-white rounded-[2rem] border border-secondary-100 p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-secondary-200/50 group"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                  <div className="flex-1">
                    <div className="flex items-start gap-5 mb-6">
                      <div className="w-10 h-10 bg-secondary-50 rounded-xl flex items-center justify-center text-secondary-400 shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-500">
                        <HelpCircle size={20} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-secondary-900 leading-snug tracking-tight">
                          {question.question}
                        </h4>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 ml-0 md:ml-15">
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${question.isMandatory
                          ? 'bg-rose-50 text-rose-600 border-rose-100'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                        {question.isMandatory ? 'Mandatory Field' : 'Optional Check'}
                      </div>
                      <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-secondary-50 text-secondary-400 border border-secondary-100">
                        {getQuestionTypeLabel(question.questionType)}
                      </div>
                    </div>

                    {question.options && question.options.length > 0 && (
                      <div className="mt-8 ml-0 md:ml-15">
                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] mb-4">Response Mapping:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {question.options.map((option, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-secondary-50/50 border border-secondary-50 rounded-xl hover:bg-white hover:border-primary-100 transition-all cursor-default">
                              <div className="w-5 h-5 rounded-md border-2 border-secondary-200 flex items-center justify-center bg-white">
                                <CheckCircle className="w-3 h-3 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
                              </div>
                              <span className="text-sm font-bold text-secondary-600">{option}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
