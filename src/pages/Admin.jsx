import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth, getDisplayName } from '../hooks/useAuth'

// 状态选项
const STATUS_OPTIONS = ['待处理', '进行中', '已完成', '已取消']

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

// 本地日期 YYYY-MM-DD
function getTodayStr() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 时间戳 -> HH:MM
function formatTime(value) {
  if (!value) return '未设置'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
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

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth()

  // 顶部 Tab：publish 发布任务 / checkin 打卡记录
  const [tab, setTab] = useState('publish')

  // ---------- 发布任务表单 ----------
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(getTodayStr())
  const [dueTime, setDueTime] = useState('08:00')
  const [status, setStatus] = useState('待处理')
  const [assigneeId, setAssigneeId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  // ---------- 数据列表 ----------
  const [schedules, setSchedules] = useState([])
  const [drivers, setDrivers] = useState([])
  const [checkins, setCheckins] = useState([])
  const [listLoading, setListLoading] = useState(true)

  // 加载：任务列表、司机列表、打卡记录
  async function loadData() {
    setListLoading(true)
    try {
      const [schedRes, driverRes, checkinRes] = await Promise.all([
        supabase
          .from('schedules')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.from('drivers').select('*').order('created_at', { ascending: false }),
        supabase
          .from('checkins')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
      ])

      setSchedules(schedRes.data || [])
      setDrivers(driverRes.data || [])
      setCheckins(checkinRes.data || [])
    } catch {
      // 忽略单表错误
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) loadData()
  }, [isAdmin])

  // 发布任务
  async function handlePublish(e) {
    e.preventDefault()
    setMessage('')
    setIsError(false)

    if (!title.trim()) {
      setIsError(true)
      setMessage('请填写任务标题')
      return
    }

    setSubmitting(true)
    try {
      // 把日期 + 时间拼成带时区的时间戳
      const dueTimeIso = dueTime
        ? new Date(`${dueDate}T${dueTime}:00`).toISOString()
        : null

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        due_time: dueTimeIso,
        status,
        assignee_id: assigneeId || null,
        created_by: user?.id || null,
      }

      const { error } = await supabase.from('schedules').insert(payload)
      if (error) throw error

      setMessage('任务发布成功')
      setIsError(false)
      setTitle('')
      setDescription('')
      setAssigneeId('')
      setStatus('待处理')
      await loadData()
    } catch (err) {
      setIsError(true)
      setMessage(`发布失败：${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // 更新任务状态
  async function handleUpdateStatus(id, nextStatus) {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ status: nextStatus })
        .eq('id', id)
      if (error) throw error
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: nextStatus } : s)),
      )
    } catch (err) {
      setMessage(`更新失败：${err.message}`)
      setIsError(true)
    }
  }

  // 删除任务
  async function handleDelete(id) {
    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id)
      if (error) throw error
      setSchedules((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      setMessage(`删除失败：${err.message}`)
      setIsError(true)
    }
  }

  // 未登录
  if (!authLoading && !user) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-gray-800">管理</h1>
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center animate-jelly-in">
          <p className="text-3xl mb-2 animate-jelly-float">🔒</p>
          <p className="text-sm text-gray-400">请先到「我的」页面登录</p>
        </div>
      </div>
    )
  }

  // 非管理员
  if (!authLoading && user && !isAdmin) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-gray-800">管理</h1>
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center animate-jelly-in">
          <p className="text-3xl mb-2 animate-jelly-float">⛔</p>
          <p className="text-sm text-gray-400">当前账号不是管理员</p>
          <p className="mt-1 text-xs text-gray-300">
            请联系管理员开通权限
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">管理</h1>
        <span className="text-xs text-gray-400">
          {getDisplayName(user)} · 管理员
        </span>
      </div>

      {/* Tab 切换 */}
      <div className="flex rounded-xl bg-gray-100 p-1 animate-jelly-in">
        <button
          type="button"
          onClick={() => setTab('publish')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'publish'
              ? 'bg-white text-brand-600 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          发布任务
        </button>
        <button
          type="button"
          onClick={() => setTab('checkin')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'checkin'
              ? 'bg-white text-brand-600 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          打卡记录
        </button>
      </div>

      {/* 提示信息 */}
      {message && (
        <p
          className={`text-xs text-center ${
            isError ? 'text-red-500' : 'text-green-600'
          }`}
        >
          {message}
        </p>
      )}

      {/* ============ 发布任务 ============ */}
      {tab === 'publish' && (
        <>
          <form
            onSubmit={handlePublish}
            className="bg-white rounded-2xl p-4 shadow-sm space-y-3 animate-jelly-in"
            style={{ animationDelay: '60ms' }}
          >
            <p className="text-sm font-medium text-gray-700">发布新任务</p>

            <div className="space-y-1">
              <label className="text-xs text-gray-400">任务标题 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：早班车发车检查"
                className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400">任务描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="填写任务详情、注意事项等"
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-brand-200 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">日期</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">时间</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">状态</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-brand-200"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">指派司机</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-brand-200"
                >
                  <option value="">不指派</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-brand-600 text-white text-sm font-medium disabled:opacity-50 jelly-card"
            >
              {submitting ? '发布中...' : '发布任务'}
            </button>
          </form>

          {/* 任务列表 */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 px-1">
              最近任务（{schedules.length}）
            </p>

            {listLoading && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-sm text-gray-400">加载中...</p>
              </div>
            )}

            {!listLoading && schedules.length === 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                <p className="text-sm text-gray-400">暂无任务</p>
              </div>
            )}

            {!listLoading &&
              schedules.map((row, index) => (
                <div
                  key={row.id}
                  className="bg-white rounded-2xl p-4 shadow-sm space-y-2 jelly-card animate-jelly-in"
                  style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-gray-800 leading-snug">
                      {row.title || '未命名任务'}
                    </h3>
                    <span
                      className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${getStatusStyle(
                        row.status,
                      )}`}
                    >
                      {row.status || '待处理'}
                    </span>
                  </div>

                  {row.description && (
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {row.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>🕒</span>
                    <span>
                      {toDateStr(row.due_date) || '未设置'}{' '}
                      {formatTime(row.due_time)}
                    </span>
                  </div>

                  {/* 状态快捷切换 */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleUpdateStatus(row.id, s)}
                        disabled={row.status === s}
                        className={`text-xs px-2 py-1 rounded-lg jelly-card ${
                          row.status === s
                            ? 'bg-brand-600 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      className="ml-auto text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 jelly-card"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {/* ============ 打卡记录 ============ */}
      {tab === 'checkin' && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 px-1">
            打卡记录（{checkins.length}）
          </p>

          {listLoading && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-sm text-gray-400">加载中...</p>
            </div>
          )}

          {!listLoading && checkins.length === 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center animate-jelly-in">
              <p className="text-3xl mb-2 animate-jelly-float">📍</p>
              <p className="text-sm text-gray-400">暂无打卡记录</p>
            </div>
          )}

          {!listLoading &&
            checkins.map((row, index) => (
              <div
                key={row.id}
                className="bg-white rounded-2xl p-4 shadow-sm space-y-1 jelly-card animate-jelly-in"
                style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">
                    {row.type === 'clock_out' ? '下班打卡' : '上班打卡'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(row.created_at).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {row.note && (
                  <p className="text-xs text-gray-500">{row.note}</p>
                )}
                <p className="text-xs text-gray-300 font-mono truncate">
                  {row.user_id}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
