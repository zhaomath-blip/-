import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Calendar from '../components/Calendar'

// 状态 -> 颜色
const STATUS_STYLES = {
  待处理: 'bg-amber-50 text-amber-600',
  进行中: 'bg-brand-50 text-brand-600',
  已完成: 'bg-green-50 text-green-600',
  已取消: 'bg-gray-100 text-gray-400',
}

function getStatusStyle(status) {
  return STATUS_STYLES[status] || 'bg-gray-100 text-gray-500'
}

// 时间戳 -> YYYY-MM-DD
function toDateStr(value) {
  if (!value) return ''
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 时间戳 -> YYYY-MM-DD HH:MM
function formatDateTime(value) {
  if (!value) return '未设置'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

// 时间戳 -> HH:MM
function formatTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 日历颜色映射
const COLOR_MAP = {
  due: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-600' },
  created: { dot: 'bg-brand-500', bg: 'bg-brand-50', text: 'text-brand-600' },
  both: { dot: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-600' },
}

export default function TaskDetail({ taskId, onBack }) {
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchTask() {
      setLoading(true)
      setError('')
      try {
        const { data, error: err } = await supabase
          .from('schedules')
          .select('*')
          .eq('id', taskId)
          .maybeSingle()

        if (err) throw err
        if (!cancelled) setTask(data)
      } catch (e) {
        if (!cancelled) setError(e.message || '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (taskId) fetchTask()
    return () => {
      cancelled = true
    }
  }, [taskId])

  // 计算日历标记
  const dueKey = toDateStr(task?.due_date) || toDateStr(task?.due_time)
  const createdKey = toDateStr(task?.created_at)

  const markedDates = {}
  if (dueKey) markedDates[dueKey] = 'due'
  if (createdKey) {
    markedDates[createdKey] = markedDates[createdKey] === 'due' ? 'both' : 'created'
  }

  return (
    <div className="p-4 space-y-4">
      {/* 顶部返回栏 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 jelly-card"
        >
          ‹
        </button>
        <h1 className="text-lg font-bold text-gray-800">任务详情</h1>
      </div>

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

      {!loading && !error && !task && (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm text-gray-400">未找到该任务</p>
        </div>
      )}

      {!loading && !error && task && (
        <>
          {/* 任务标题卡片 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3 jelly-card animate-jelly-in">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-800 leading-snug">
                {task.title || '未命名任务'}
              </h2>
              <span
                className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${getStatusStyle(
                  task.status,
                )}`}
              >
                {task.status || '待处理'}
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              {task.description || '暂无描述'}
            </p>
          </div>

          {/* 日期信息 */}
          <div
            className="bg-white rounded-2xl p-4 shadow-sm space-y-3 jelly-card animate-jelly-in"
            style={{ animationDelay: '90ms' }}
          >
            <p className="text-sm font-medium text-gray-700">时间信息</p>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                📤
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">发布日期</p>
                <p className="text-sm text-gray-800">
                  {formatDateTime(task.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                ⏰
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">截止日期</p>
                <p className="text-sm text-gray-800">
                  {toDateStr(task.due_date) || toDateStr(task.due_time) || '未设置'}
                  {formatTime(task.due_time) && ` ${formatTime(task.due_time)}`}
                </p>
              </div>
            </div>
          </div>

          {/* 日历 */}
          <div
            className="space-y-2 animate-jelly-in"
            style={{ animationDelay: '180ms' }}
          >
            <p className="text-sm font-medium text-gray-700 px-1">日历</p>
            <Calendar
              markedDates={markedDates}
              colorMap={COLOR_MAP}
              selected={selectedDate}
              onSelect={setSelectedDate}
            />

            {/* 图例 */}
            <div className="flex items-center gap-4 px-1 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-xs text-gray-500">截止日期</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                <span className="text-xs text-gray-500">发布日期</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-xs text-gray-500">同一天</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
