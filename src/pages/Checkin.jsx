import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth, getDisplayName } from '../hooks/useAuth'

// 本地日期 YYYY-MM-DD
function getTodayStr() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 时间戳 -> HH:MM
function formatTime(value) {
  if (!value) return '--:--'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '--:--'
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
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

export default function Checkin() {
  const { user, loading: authLoading } = useAuth()

  const [records, setRecords] = useState([])
  const [todaySchedules, setTodaySchedules] = useState([])
  const [selectedSchedule, setSelectedSchedule] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(true)

  const today = getTodayStr()

  // 加载我的打卡记录 + 今日任务
  async function loadData() {
    if (!user) return
    setLoading(true)
    try {
      const [checkinRes, schedRes] = await Promise.all([
        supabase
          .from('checkins')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('schedules')
          .select('*')
          .gte('due_date', today)
          .order('due_time', { ascending: true }),
      ])

      setRecords(checkinRes.data || [])
      setTodaySchedules(schedRes.data || [])
    } catch {
      // 忽略
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadData()
  }, [user])

  // 打卡
  async function handleCheckin(type) {
    setMessage('')
    setIsError(false)

    if (!user) {
      setIsError(true)
      setMessage('请先登录')
      return
    }

    setSubmitting(true)
    try {
      // 尝试获取定位（失败不阻塞打卡）
      let latitude = null
      let longitude = null
      try {
        const pos = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) return reject(new Error('no geo'))
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
          })
        })
        latitude = pos.coords.latitude
        longitude = pos.coords.longitude
      } catch {
        // 定位失败，忽略
      }

      const payload = {
        user_id: user.id,
        schedule_id: selectedSchedule || null,
        type,
        note: note.trim() || null,
        latitude,
        longitude,
      }

      const { error } = await supabase.from('checkins').insert(payload)
      if (error) throw error

      setMessage(type === 'clock_out' ? '下班打卡成功' : '上班打卡成功')
      setIsError(false)
      setNote('')
      setSelectedSchedule('')
      await loadData()
    } catch (err) {
      setIsError(true)
      setMessage(`打卡失败：${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // 未登录
  if (!authLoading && !user) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-gray-800">打卡</h1>
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <p className="text-3xl mb-2">🔒</p>
          <p className="text-sm text-gray-400">请先到「我的」页面登录</p>
        </div>
      </div>
    )
  }

  // 今日打卡统计
  const todayRecords = records.filter(
    (r) => toDateStr(r.created_at) === today,
  )
  const hasClockIn = todayRecords.some((r) => r.type === 'clock_in')
  const hasClockOut = todayRecords.some((r) => r.type === 'clock_out')

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">打卡</h1>
        <span className="text-xs text-gray-400">
          {getDisplayName(user)} · {today}
        </span>
      </div>

      {/* 今日打卡状态 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm animate-jelly-in">
        <p className="text-sm font-medium text-gray-700 mb-3">今日打卡</p>
        <div className="grid grid-cols-2 gap-3">
          <div
            className={`rounded-xl p-3 text-center jelly-card ${
              hasClockIn ? 'bg-green-50' : 'bg-gray-50'
            }`}
          >
            <p className="text-xs text-gray-400">上班</p>
            <p
              className={`mt-1 text-lg font-semibold ${
                hasClockIn ? 'text-green-600 animate-jelly-pop' : 'text-gray-300'
              }`}
            >
              {hasClockIn
                ? formatTime(
                    todayRecords.find((r) => r.type === 'clock_in')?.created_at,
                  )
                : '未打卡'}
            </p>
          </div>
          <div
            className={`rounded-xl p-3 text-center jelly-card ${
              hasClockOut ? 'bg-green-50' : 'bg-gray-50'
            }`}
          >
            <p className="text-xs text-gray-400">下班</p>
            <p
              className={`mt-1 text-lg font-semibold ${
                hasClockOut ? 'text-green-600 animate-jelly-pop' : 'text-gray-300'
              }`}
            >
              {hasClockOut
                ? formatTime(
                    todayRecords.find((r) => r.type === 'clock_out')?.created_at,
                  )
                : '未打卡'}
            </p>
          </div>
        </div>
      </div>

      {/* 打卡表单 */}
      <div
        className="bg-white rounded-2xl p-4 shadow-sm space-y-3 animate-jelly-in"
        style={{ animationDelay: '90ms' }}
      >
        <p className="text-sm font-medium text-gray-700">打卡操作</p>

        <div className="space-y-1">
          <label className="text-xs text-gray-400">关联任务（可选）</label>
          <select
            value={selectedSchedule}
            onChange={(e) => setSelectedSchedule(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="">不关联任务</option>
            {todaySchedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-400">备注（可选）</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例如：车辆已检查完毕"
            className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleCheckin('clock_in')}
            disabled={submitting}
            className="py-3 rounded-2xl bg-brand-600 text-white text-sm font-medium disabled:opacity-50 jelly-card"
          >
            {submitting ? '打卡中...' : '上班打卡'}
          </button>
          <button
            type="button"
            onClick={() => handleCheckin('clock_out')}
            disabled={submitting}
            className="py-3 rounded-2xl bg-gray-700 text-white text-sm font-medium disabled:opacity-50 jelly-card"
          >
            {submitting ? '打卡中...' : '下班打卡'}
          </button>
        </div>

        {message && (
          <p
            className={`text-xs text-center ${
              isError ? 'text-red-500' : 'text-green-600'
            }`}
          >
            {message}
          </p>
        )}
      </div>

      {/* 我的打卡记录 */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700 px-1">
          我的打卡记录（{records.length}）
        </p>

        {loading && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-400">加载中...</p>
          </div>
        )}

        {!loading && records.length === 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center animate-jelly-in">
            <p className="text-3xl mb-2 animate-jelly-float">📍</p>
            <p className="text-sm text-gray-400">还没有打卡记录</p>
          </div>
        )}

        {!loading &&
          records.map((row, index) => (
            <div
              key={row.id}
              className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between jelly-card animate-jelly-in"
              style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
            >
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {row.type === 'clock_out' ? '下班打卡' : '上班打卡'}
                </p>
                {row.note && (
                  <p className="text-xs text-gray-400 mt-0.5">{row.note}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {formatTime(row.created_at)}
                </p>
                <p className="text-xs text-gray-300">
                  {toDateStr(row.created_at)}
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
