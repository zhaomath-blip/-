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

// 状态 -> 主题色（用于顶部标题区）
const STATUS_THEME = {
  待处理: {
    text: 'text-amber-500',
    bg: 'bg-amber-50',
    ring: 'ring-amber-100',
    desc: '等待开始的任务',
  },
  进行中: {
    text: 'text-brand-600',
    bg: 'bg-brand-50',
    ring: 'ring-brand-100',
    desc: '正在执行的任务',
  },
  已完成: {
    text: 'text-green-600',
    bg: 'bg-green-50',
    ring: 'ring-green-100',
    desc: '已经完成的任务',
  },
  已取消: {
    text: 'text-gray-400',
    bg: 'bg-gray-100',
    ring: 'ring-gray-100',
    desc: '已取消的任务',
  },
}

function getStatusStyle(status) {
  return STATUS_STYLES[status] || 'bg-gray-100 text-gray-500'
}

function getStatusIcon(status) {
  return STATUS_ICONS[status] || '📌'
}

function getStatusTheme(status) {
  return (
    STATUS_THEME[status] || {
      text: 'text-gray-500',
      bg: 'bg-gray-100',
      ring: 'ring-gray-100',
      desc: '任务列表',
    }
  )
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

/**
 * 状态列表二级页面
 * @param {string} status   要筛选的状态（待处理 / 进行中 / 已完成 / 已取消）
 * @param {function} onBack 返回上一页
 */
export default function StatusList({ status, onBack }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTaskId, setActiveTaskId] = useState(null)

  const today = getTodayStr()
  const tomorrow = getTomorrowStr()
  const theme = getStatusTheme(status)

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

  // 进入任务详情三级页面
  if (activeTaskId) {
    return (
      <TaskDetail taskId={activeTaskId} onBack={() => setActiveTaskId(null)} />
    )
  }

  // 按状态筛选
  const filtered = items.filter((row) => (row.status || '待处理') === status)

  return (
    <div className="p-4 space-y-4">
      {/* 顶部返回栏 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 jelly-card"
          aria-label="返回"
        >
          ‹
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-1.5">
            <span>{getStatusIcon(status)}</span>
            <span>{status}</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{theme.desc}</p>
        </div>
        <span
          className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${theme.bg} ${theme.text}`}
        >
          共 {filtered.length} 条
        </span>
      </div>

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

      {/* 该状态下暂无任务 */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center animate-jelly-in">
          <p className="text-3xl mb-2 animate-jelly-float">{getStatusIcon(status)}</p>
          <p className="text-sm text-gray-400">暂无「{status}」的任务</p>
        </div>
      )}

      {/* 任务卡片列表（可点击进入详情） */}
      {!loading &&
        !error &&
        filtered.map((row, index) => (
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
