import React, { useState } from 'react'

export interface TabItem {
  id: string
  label: string
  content: React.ReactNode
}

interface TabsProps {
  tabs: TabItem[]
  defaultTabId?: string
  onTabChange?: (tabId: string) => void
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTabId, onTabChange }) => {
  const [activeTabId, setActiveTabId] = useState(defaultTabId || tabs[0]?.id || '')

  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId)
    onTabChange?.(tabId)
  }

  const activeTab = tabs.find((tab) => tab.id === activeTabId)

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-secondary-100 -mx-8 px-8 overflow-x-auto scrollbar-hide">
        <div className="flex space-x-10 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-1 py-5 font-black text-xs uppercase tracking-[0.2em] border-b-[3px] transition-all duration-300 whitespace-nowrap relative ${activeTabId === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-secondary-400 hover:text-secondary-600 hover:border-secondary-100'
                }`}
            >
              {tab.label}
              {activeTabId === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 blur-[4px] opacity-50"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">{activeTab?.content}</div>
    </div>
  )
}
