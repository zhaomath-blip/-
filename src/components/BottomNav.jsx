// 底部导航栏：今日 / 日程 / 打卡 / 建议 / 我的
// 管理员额外多一个「管理」入口
const BASE_TABS = [
  { key: 'today', label: '今日', icon: '📅' },
  { key: 'schedule', label: '日程', icon: '🗓️' },
  { key: 'checkin', label: '打卡', icon: '📍' },
  { key: 'suggest', label: '建议', icon: '💡' },
  { key: 'mine', label: '我的', icon: '👤' },
]

export default function BottomNav({ active, onChange, isAdmin }) {
  // 管理员：把「建议」替换为「管理」，保持 5 个不拥挤
  const tabs = isAdmin
    ? [
        { key: 'today', label: '今日', icon: '📅' },
        { key: 'schedule', label: '日程', icon: '🗓️' },
        { key: 'checkin', label: '打卡', icon: '📍' },
        { key: 'admin', label: '管理', icon: '🛠️' },
        { key: 'mine', label: '我的', icon: '👤' },
      ]
    : BASE_TABS

  return (
    <nav className="shrink-0 bg-white border-t border-gray-100 flex">
      {tabs.map((tab) => {
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-colors ${
              isActive ? 'text-brand-600' : 'text-gray-400'
            }`}
          >
            <span
              className={`text-lg leading-none transition-transform ${
                isActive ? 'animate-jelly-wobble' : ''
              }`}
            >
              {tab.icon}
            </span>
            <span className="text-xs">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
