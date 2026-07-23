import type { TabItem } from '../components/Tabs'
import { Tabs } from '../components/Tabs'
import { VisitOverviewTab } from '../components/VisitOverviewTab'
import { VisitScheduleTab } from '../components/VisitScheduleTab'
import { VisitHistoryTab } from '../components/VisitHistoryTab'
import { VisitChecklistQuestionsTab } from '../components/VisitChecklistQuestionsTab'

export const Visits: React.FC = () => {
  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: <VisitOverviewTab />,
    },
    {
      id: 'schedule',
      label: 'Schedule',
      content: <VisitScheduleTab />,
    },
    {
      id: 'history',
      label: 'History',
      content: <VisitHistoryTab />,
    },
    {
      id: 'checklist',
      label: 'Checklist Questions',
      content: <VisitChecklistQuestionsTab />,
    },
  ]

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary-900 tracking-tight">Visits</h1>
          <p className="text-secondary-500 font-medium mt-2">Manage and track all visit activities</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Add action buttons here if needed */}
        </div>
      </div>

      {/* Tabs Container */}
      <div className="bg-white rounded-[2.5rem] border border-secondary-100 p-2 md:p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-secondary-200/50">
        <Tabs tabs={tabs} defaultTabId="overview" />
      </div>
    </div>
  )
}
