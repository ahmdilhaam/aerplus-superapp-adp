import { Users, TrendingUp, ShoppingCart, Activity } from 'lucide-react'
import { StatCard } from '../components/StatCard'
import { RecentActivity } from '../components/RecentActivity'

export const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'Total Users',
      value: '2.543',
      icon: Users,
      change: 12,
      changeLabel: 'vs last month',
    },
    {
      title: 'Active Outlets',
      value: '128',
      icon: ShoppingCart,
      change: 8,
      changeLabel: 'vs last month',
    },
    {
      title: 'Total Visits',
      value: '1.234',
      icon: Activity,
      change: -2,
      changeLabel: 'vs last month',
    },
    {
      title: 'System Uptime',
      value: '99.9%',
      icon: TrendingUp,
      change: 0.1,
      changeLabel: 'vs last month',
    },
  ]

  return (
    <div className="space-y-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary-900 tracking-tight">
            Dashboard overview
          </h1>
          <p className="text-secondary-500 font-medium mt-2 flex items-center gap-2">
            Welcome back, <span className="text-primary-600 font-bold">Admin</span>. Here's what's happening today.
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold uppercase tracking-wider animate-pulse">Live</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 bg-white border border-secondary-200 text-secondary-700 rounded-2xl text-sm font-bold hover:bg-secondary-50 transition-all duration-300 shadow-sm flex items-center gap-2">
            <Activity size={18} />
            Export Data
          </button>
          <button className="px-5 py-2.5 bg-primary-600 text-white rounded-2xl text-sm font-bold hover:bg-primary-700 transition-all duration-300 shadow-lg shadow-primary-600/25 flex items-center gap-2">
            <Users size={18} />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
            changeLabel={stat.changeLabel}
          />
        ))}
      </div>

      {/* Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side - Status Cards */}
        <div className="lg:col-span-1 space-y-8">
          {/* Performance Chart Card */}
          <div className="bg-white rounded-[2rem] border border-secondary-100 p-8 shadow-sm hover:shadow-xl hover:shadow-secondary-200/50 transition-all duration-500 group">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-extrabold text-secondary-900 tracking-tight">Performance</h3>
              <div className="p-2 bg-secondary-50 rounded-xl text-secondary-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-secondary-50/50 to-white rounded-[2rem] border-2 border-dashed border-secondary-100 relative group-hover:border-primary-200 transition-colors">
              <div className="text-center p-4 relative z-10">
                <div className="text-6xl font-black text-primary-600 mb-3 drop-shadow-sm group-hover:scale-110 transition-transform duration-500">88%</div>
                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] leading-relaxed">Overall Efficiency</p>
              </div>
              <div className="absolute inset-0 bg-primary-500/5 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary-50 rounded-2xl">
                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1">Weekly</p>
                <p className="text-lg font-extrabold text-secondary-900">+12%</p>
              </div>
              <div className="p-4 bg-secondary-50 rounded-2xl">
                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1">Monthly</p>
                <p className="text-lg font-extrabold text-secondary-900">+5.4%</p>
              </div>
            </div>
          </div>

          {/* System Status Banner */}
          <div className="bg-gradient-to-br from-secondary-900 via-secondary-950 to-black rounded-[2rem] shadow-2xl shadow-secondary-900/20 p-8 text-white overflow-hidden relative group border border-white/5">
            <div className="absolute top-0 right-0 -m-8 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 -m-8 w-32 h-32 bg-accent-500/10 rounded-full blur-3xl"></div>

            <h3 className="text-[10px] font-black mb-4 opacity-50 uppercase tracking-[0.3em] relative z-10">Network Security</h3>
            <div className="flex items-baseline gap-3 relative z-10">
              <span className="text-4xl font-black tracking-tighter">SECURE</span>
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
            </div>

            <div className="mt-8 space-y-4 relative z-10">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-primary-500 rounded-full"></div>
              </div>
              <p className="text-xs text-white/60 font-medium flex items-center gap-2">
                <Activity size={12} className="text-emerald-400" />
                All nodes are currently stable
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Activity Feed */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}
