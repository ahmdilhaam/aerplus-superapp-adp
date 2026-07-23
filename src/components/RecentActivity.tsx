import { MoreVertical } from 'lucide-react'
import { Badge } from './Badge'

interface ActivityItem {
  id: number
  name: string
  action: string
  status: 'success' | 'warning' | 'error' | 'info'
  timestamp: string
}

interface RecentActivityProps {
  items?: ActivityItem[]
}

const defaultItems: ActivityItem[] = [
  {
    id: 1,
    name: 'John Doe',
    action: 'Created new user account',
    status: 'success',
    timestamp: '2 hours ago',
  },
  {
    id: 2,
    name: 'Jane Smith',
    action: 'Updated system configuration',
    status: 'success',
    timestamp: '4 hours ago',
  },
  {
    id: 3,
    name: 'Mike Johnson',
    action: 'Failed login attempt',
    status: 'error',
    timestamp: '6 hours ago',
  },
  {
    id: 4,
    name: 'Sarah Williams',
    action: 'Changed settings',
    status: 'warning',
    timestamp: '8 hours ago',
  },
  {
    id: 5,
    name: 'Tom Brown',
    action: 'Viewed reports',
    status: 'info',
    timestamp: '10 hours ago',
  },
]

const statusLabels = {
  success: 'Completed',
  warning: 'Pending',
  error: 'Failed',
  info: 'Viewed',
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ items = defaultItems }) => {
  return (
    <div className="bg-white rounded-[2rem] border border-secondary-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-secondary-200/50">
      <div className="p-8 border-b border-secondary-50 flex items-center justify-between bg-gradient-to-r from-white to-secondary-50/50">
        <div>
          <h3 className="text-xl font-extrabold text-secondary-900 tracking-tight">Recent Activity</h3>
          <p className="text-xs text-secondary-500 font-medium mt-1">Latest system events and logs</p>
        </div>
        <button className="px-4 py-2 text-xs font-bold text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-300 uppercase tracking-widest border border-primary-100">View All</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-secondary-50 bg-secondary-50/30">
              <th className="px-8 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">User / Activity</th>
              <th className="px-8 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] hidden md:table-cell">Action Details</th>
              <th className="px-8 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Timestamp</th>
              <th className="px-8 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] text-center">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-50">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-secondary-50/40 transition-all duration-300 group">
                <td className="px-8 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-gradient-to-br from-secondary-50 to-secondary-100 text-secondary-600 rounded-2xl flex items-center justify-center text-sm font-bold border border-secondary-100 group-hover:from-primary-600 group-hover:to-primary-700 group-hover:text-white group-hover:border-primary-500 transition-all duration-500 shadow-sm">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-secondary-900 group-hover:text-primary-600 transition-colors">{item.name}</p>
                      <p className="text-[10px] text-secondary-500 md:hidden font-medium mt-0.5">{item.action}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-4 hidden md:table-cell">
                  <span className="text-sm text-secondary-600 font-semibold">{item.action}</span>
                </td>
                <td className="px-8 py-4">
                  <Badge variant={item.status} label={statusLabels[item.status]} />
                </td>
                <td className="px-8 py-4 whitespace-nowrap">
                  <span className="text-xs font-bold text-secondary-500 tabular-nums uppercase">{item.timestamp}</span>
                </td>
                <td className="px-8 py-4 text-center">
                  <button className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-300">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
