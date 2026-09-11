import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
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

// 取本地日期字符串，格式 YYYY-MM-DD
function getTodayStr() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 取明天的日期字符串，用于范围查询的上界
function getTomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 格式化时间：2026-09-11T08:30:00 -> 08:30
function formatTime(value) {
  if (!value) return '未设置'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 把 due_date 统一成 YYYY-MM-DD 再比较
function toDateStr(value) {
  if (!value) return ''
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 中文星期
function getWeekdayLabel() {
  const names = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return names[new Date().getDay()]
}

export default function Today() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTaskId, setActiveTaskId] = useState(null)

  const today = getTodayStr()
  const tomorrow = getTomorrowStr()

  useEffect(() => {
    let cancelled = false

    async function fetchSchedules() {
      setLoading(true)
      setError('')
      try {
        // 只查今天的任务：due_date 在 [今天, 明天) 区间内
        const { data, error: err } = await supabase
          .from('schedules')
          .select('*')
          .gte('due_date', today)
          .lt('due_date', tomorrow)
          .order('due_time', { ascending: true })

        if (err) throw err
        if (!cancelled) setItems(data || [])
      } catch (e) {
        if (!cancelled) setError(e.message || '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSchedules()
    return () => {
      cancelled = true
    }
  }, [today, tomorrow])

  // 进入二级页面
  if (activeTaskId) {
    return (
      <TaskDetail taskId={activeTaskId} onBack={() => setActiveTaskId(null)} />
    )
  }

  // 统计各状态数量
  const counts = items.reduce((acc, row) => {
    const s = row.status || '待处理'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-4 space-y-4">
      {/* 顶部标题 + 日期 */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">今日任务</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {today} · {getWeekdayLabel()}
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-brand-50 text-brand-600 font-medium">
          共 {items.length} 条
        </span>
      </div>

      {/* 状态统计小卡片 */}
      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div
            className="bg-white rounded-2xl p-3 shadow-sm text-center jelly-card animate-jelly-in"
            style={{ animationDelay: '0ms' }}
          >
            <p className="text-lg font-bold text-amber-500 animate-jelly-pop">
              {counts['待处理'] || 0}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">待处理</p>
          </div>
          <div
            className="bg-white rounded-2xl p-3 shadow-sm text-center jelly-card animate-jelly-in"
            style={{ animationDelay: '80ms' }}
          >
            <p className="text-lg font-bold text-brand-600 animate-jelly-pop">
              {counts['进行中'] || 0}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">进行中</p>
          </div>
          <div
            className="bg-white rounded-2xl p-3 shadow-sm text-center jelly-card animate-jelly-in"
            style={{ animationDelay: '160ms' }}
          >
            <p className="text-lg font-bold text-green-600 animate-jelly-pop">
              {counts['已完成'] || 0}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">已完成</p>
          </div>
        </div>
      )}

      {/* 加载中 */}
      {loading && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-gray-400">加载中...</p>
        </div>
      )}

      {/* 出错 */}
      {!loading && error && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-red-500">加载失败：{error}</p>
        </div>
      )}

      {/* 暂无数据 */}
      {!loading && !error && items.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center animate-jelly-in">
          <p className="text-3xl mb-2 animate-jelly-float">📭</p>
          <p className="text-sm text-gray-400">今日暂无任务</p>
        </div>
      )}

      {/* 卡片列表（可点击进入详情） */}
      {!loading &&
        !error &&
        items.map((row, index) => (
          <button
            key={row.id}
            type="button"
            onClick={() => setActiveTaskId(row.id)}
            className="w-full text-left bg-white rounded-2xl p-4 shadow-sm space-y-2 jelly-card animate-jelly-in"
            style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
          >
            <div className="flex items-start gap-3">
              {/* 状态图标 */}
              <div
                className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${getStatusStyle(
                  row.status,
                )}`}
              >
                {getStatusIcon(row.status)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-800 leading-snug">
                    {row.title || '未命名任务'}
                  </h2>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${getStatusStyle(
                      row.status,
                    )}`}
                  >
                    {row.status || '待处理'}
                  </span>
                </div>

                <p className="text-sm text-gray-500 leading-relaxed mt-1 line-clamp-2">
                  {row.description || '暂无描述'}
                </p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>🕒</span>
                    <span>
                      {toDateStr(row.due_date) || '未设置'}{' '}
                      {formatTime(row.due_time)}
                    </span>
                  </div>
                  <span className="text-xs text-brand-500 font-medium">
                    查看详情 ›
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
    </div>
  )
}
