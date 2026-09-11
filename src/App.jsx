import { useState } from 'react'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Today from './pages/Today'
import Schedule from './pages/Schedule'
import Checkin from './pages/Checkin'
import Suggest from './pages/Suggest'
import Admin from './pages/Admin'
import Mine from './pages/Mine'
import { useAuth } from './hooks/useAuth'

const PAGES = {
  home: Home,
  today: Today,
  schedule: Schedule,
  checkin: Checkin,
  suggest: Suggest,
  admin: Admin,
  mine: Mine,
}

export default function App() {
  const [tab, setTab] = useState('home')
  const { isAdmin } = useAuth()

  // 管理员访问 admin 页；非管理员访问 admin 时回退到 home
  const safeTab = tab === 'admin' && !isAdmin ? 'home' : tab
  const CurrentPage = PAGES[safeTab] || Home

  return (
    // 外层：桌面端居中显示，模拟手机屏幕
    <div className="min-h-screen flex justify-center bg-gray-100">
      <div className="w-full max-w-md bg-[#f5f7fa] flex flex-col h-screen shadow-xl">
        {/* 顶部标题栏 */}
        <header className="shrink-0 bg-white px-4 py-3 border-b border-gray-100">
          <h1 className="text-base font-semibold text-gray-800 text-center">
            星北方旅游客运管理平台
          </h1>
        </header>

        {/* 内容区：可滚动。key 变化时重新挂载，触发页面切换动画 */}
        <main className="flex-1 overflow-y-auto">
          <div key={safeTab} className="animate-jelly-in">
            <CurrentPage onNavigate={setTab} />
          </div>
        </main>

        {/* 底部导航 */}
        <BottomNav active={safeTab} onChange={setTab} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
