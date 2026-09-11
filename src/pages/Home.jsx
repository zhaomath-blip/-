import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth, getDisplayName } from '../hooks/useAuth'
import Calendar from '../components/Calendar'
import TaskDetail from './TaskDetail'

// 状态 -> 颜色样式映射
const STATUS_STYLES = {
  待处理: 'bg-amber-50 text-amber-600',
  进行中: 'bg-brand-50 text-brand-600',
  已完成: 'bg-green-50 text-green-600',
  已取消: 'bg-gray-100 text-gray-400',
}

// 状态 -> 图标
const STATUS_ICONS = {
  待处理: '🕐',
  进行中: '🚀',
  已完成: '✅',
  已取消: '⛔',
}

function getStatusStyle(status) {
  return STATUS_STYLES[status] || 'bg-gray-100 text-gray-500'
}

function getStatusIcon(status) {
  return STATUS_ICONS[status] || '📌'
}

// 本地日期 YYYY-MM-DD
function toKey(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getTodayStr() {
  return toKey(new Date())
}

// 把任意时间值统一成 YYYY-MM-DD
function toDateStr(value) {
  if (!value) return ''
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  return toKey(d)
}

// 时间戳 -> HH:MM
function formatTime(value) {
  if (!value) return '未设置'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 中文星期
function getWeekdayLabel(dateStr) {
  const names = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const d = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date()
  return names[d.getDay()]
}

// 日历标记颜色映射
const CALENDAR_COLORS = {
  pending: { dot: 'bg-amber-400', bg: 'bg-amber-50', text: 'text-amber-600' },
  doing: { dot: 'bg-brand-500', bg: 'bg-brand-50', text: 'text-brand-600' },
  done: { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-600' },
}

/**
 * 首页
 * props: onNavigate(key) —— 切换到指定底部 Tab
 */
export default function Home({ onNavigate }) {
  const { user, profile, isAdmin } = useAuth()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState(getTodayStr())
  const [activeTaskId, setActiveTaskId] = useState(null)

  const today = getTodayStr()

  // 加载最近的任务（用于统计 + 日历标记 + 速览）
  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError('')
      try {
        const { data, error: err } = await supabase
          .from('schedules')
          .select('*')
          .order('due_date', { ascending: true })
          .limit(200)

        if (err) throw err
        if (!cancelled) setItems(data || [])
      } catch (e) {
        if (!cancelled) setError(e.message || '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [])

  // 进入任务详情二级页面
  if (activeTaskId) {
    return (
      <TaskDetail taskId={activeTaskId} onBack={() => setActiveTaskId(null)} />
    )
  }

  // 今日任务
  const todayItems = items.filter((row) => toDateStr(row.due_date) === today)

  // 今日各状态统计
  const counts = todayItems.reduce((acc, row) => {
    const s = row.status || '待处理'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  // 日历标记：按日期聚合状态
  const markedDates = {}
  items.forEach((row) => {
    const key = toDateStr(row.due_date)
    if (!key) return
    const s = row.status || '待处理'
    // 优先级：进行中 > 待处理 > 已完成
    const colorKey =
      s === '进行中' ? 'doing' : s === '待处理' ? 'pending' : 'done'
    if (!markedDates[key] || colorKey === 'doing') {
      markedDates[key] = colorKey
    }
  })

  // 选中日期的任务
  const selectedItems = items.filter(
    (row) => toDateStr(row.due_date) === selectedDate,
  )

  // 功能标签
  const features = [
    { key: 'today', label: '今日任务', icon: '📅', color: 'bg-brand-50 text-brand-600' },
    { key: 'schedule', label: '日程安排', icon: '🗓️', color: 'bg-indigo-50 text-indigo-600' },
    { key: 'checkin', label: '打卡签到', icon: '📍', color: 'bg-green-50 text-green-600' },
    { key: 'suggest', label: '意见反馈', icon: '💡', color: 'bg-amber-50 text-amber-600' },
    { key: 'mine', label: '个人中心', icon: '👤', color: 'bg-purple-50 text-purple-600' },
  ]
  if (isAdmin) {
    features.push({
      key: 'admin',
      label: '管理后台',
      icon: '🛠️',
      color: 'bg-rose-50 text-rose-600',
    })
  }

  return (
    <div className="p-4 space-y-4">
      {/* 欢迎区 */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-4 text-white shadow-sm animate-jelly-in">
        <p className="text-xs opacity-80">
          {today} · {getWeekdayLabel(today)}
        </p>
        <h1 className="text-lg font-bold mt-1">
          你好，{getDisplayName(user, profile) || '师傅'} 👋
        </h1>
        <p className="text-xs opacity-80 mt-1">
          今日共 {todayItems.length} 个任务，加油！
        </p>
      </div>

      {/* 待办统计卡片（可点击跳转） */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onNavigate?.('today')}
          className="bg-white rounded-2xl p-3 shadow-sm text-center jelly-card animate-jelly-in"
          style={{ animationDelay: '0ms' }}
        >
          <p className="text-lg font-bold text-amber-500 animate-jelly-pop">
            {counts['待处理'] || 0}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">待处理 ›</p>
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.('today')}
          className="bg-white rounded-2xl p-3 shadow-sm text-center jelly-card animate-jelly-in"
          style={{ animationDelay: '60ms' }}
        >
          <p className="text-lg font-bold text-brand-600 animate-jelly-pop">
            {counts['进行中'] || 0}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">进行中 ›</p>
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.('today')}
          className="bg-white rounded-2xl p-3 shadow-sm text-center jelly-card animate-jelly-in"
          style={{ animationDelay: '120ms' }}
        >
          <p className="text-lg font-bold text-green-600 animate-jelly-pop">
            {counts['已完成'] || 0}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">已完成 ›</p>
        </button>
      </div>

      {/* 功能标签网格 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm animate-jelly-in">
        <p className="text-sm font-medium text-gray-700 mb-3">常用功能</p>
        <div className="grid grid-cols-3 gap-3">
          {features.map((f, index) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onNavigate?.(f.key)}
              className="flex flex-col items-center gap-1.5 py-2 rounded-xl jelly-card animate-jelly-in"
              style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
            >
              <span
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${f.color}`}
              >
                {f.icon}
              </span>
              <span className="text-xs text-gray-600">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 日历 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm animate-jelly-in">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">任务日历</p>
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              待处理
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              进行中
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              已完成
            </span>
          </div>
        </div>
        <Calendar
          markedDates={markedDates}
          colorMap={CALENDAR_COLORS}
          selected={selectedDate}
          onSelect={setSelectedDate}
        />
      </div>

      {/* 选中日期的任务 */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 px-1">
          {selectedDate === today ? '今日任务' : `${selectedDate} 任务`}（
          {selectedItems.length}）
        </p>

        {loading && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-400">加载中...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-red-500">加载失败：{error}</p>
          </div>
        )}

        {!loading && !error && selectedItems.length === 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center animate-jelly-in">
            <p className="text-2xl mb-1 animate-jelly-float">📭</p>
            <p className="text-sm text-gray-400">这一天暂无任务</p>
          </div>
        )}

        {!loading &&
          !error &&
          selectedItems.map((row, index) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setActiveTaskId(row.id)}
              className="w-full text-left bg-white rounded-2xl p-3 shadow-sm jelly-card animate-jelly-in"
              style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base ${getStatusStyle(
                    row.status,
                  )}`}
                >
                  {getStatusIcon(row.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {row.title || '未命名任务'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatTime(row.due_time)} · {row.status || '待处理'}
                  </p>
                </div>
                <span className="text-xs text-brand-500 shrink-0">›</span>
              </div>
            </button>
          ))}
      </div>
    </div>
  )
}
