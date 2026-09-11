import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'

// 手机号登录用的占位域名
// 原理：Supabase 的 signInWithPassword 只认邮箱，
// 所以把「手机号」拼成「手机号@phone.local」当邮箱用。
const PHONE_DOMAIN = 'phone.local'

// 手机号 -> 内部邮箱
function phoneToEmail(phone) {
  return `${String(phone).trim()}@${PHONE_DOMAIN}`
}

// 内部邮箱 -> 显示用的手机号
function emailToPhone(email) {
  if (!email) return ''
  if (email.endsWith(`@${PHONE_DOMAIN}`)) {
    return email.slice(0, -`@${PHONE_DOMAIN}`.length)
  }
  return email
}

// 校验手机号：中国大陆 11 位，1 开头
function isValidPhone(phone) {
  return /^1\d{10}$/.test(String(phone).trim())
}

// 取显示名：优先 user_metadata.name，否则手机号/邮箱前缀
function getDisplayName(user) {
  if (!user) return ''
  const meta = user.user_metadata || {}
  if (meta.name) return meta.name
  if (meta.username) return meta.username
  if (user.email) {
    if (user.email.endsWith(`@${PHONE_DOMAIN}`)) {
      return emailToPhone(user.email)
    }
    return user.email.split('@')[0]
  }
  return '用户'
}

export default function Mine() {
  const { profile, isAdmin } = useAuth()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 表单模式：'login' 登录 / 'register' 注册
  const [mode, setMode] = useState('login')

  // 登录/注册表单
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  // 切换登录/注册，清空表单和提示
  function switchMode(next) {
    setMode(next)
    setMessage('')
    setIsError(false)
    setPassword('')
    setConfirmPassword('')
  }

  // 初始化：读取当前会话，并监听登录状态变化
  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  // 登录
  async function handleLogin(e) {
    e.preventDefault()
    setMessage('')
    setIsError(false)

    if (!phone || !password) {
      setIsError(true)
      setMessage('请填写手机号和密码')
      return
    }

    if (!isValidPhone(phone)) {
      setIsError(true)
      setMessage('请输入正确的 11 位手机号')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: phoneToEmail(phone),
        password,
      })

      if (error) throw error

      setUser(data.user)
      setMessage('登录成功')
      setIsError(false)
      setPhone('')
      setPassword('')
    } catch (err) {
      setIsError(true)
      const msg = String(err?.message || '')
      if (msg.includes('Invalid login credentials')) {
        setMessage('登录失败：手机号或密码错误，或账号还没注册')
      } else if (msg.includes('Email not confirmed')) {
        setMessage('登录失败：账号未确认，请到 Supabase 后台确认该用户')
      } else {
        setMessage(`登录失败：${msg}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // 注册
  async function handleRegister(e) {
    e.preventDefault()
    setMessage('')
    setIsError(false)

    if (!phone || !password || !confirmPassword) {
      setIsError(true)
      setMessage('请填写手机号、密码和确认密码')
      return
    }

    if (!isValidPhone(phone)) {
      setIsError(true)
      setMessage('请输入正确的 11 位手机号')
      return
    }

    if (password.length < 6) {
      setIsError(true)
      setMessage('密码至少 6 位')
      return
    }

    if (password !== confirmPassword) {
      setIsError(true)
      setMessage('两次输入的密码不一致')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: phoneToEmail(phone),
        password,
        options: {
          data: { name: phone },
        },
      })

      if (error) throw error

      // 如果项目开启了「邮箱确认」，signUp 后不会直接返回 session
      if (data.session) {
        setUser(data.user)
        setMessage('注册成功，已自动登录')
        setIsError(false)
        setPhone('')
        setPassword('')
        setConfirmPassword('')
      } else {
        setMessage('注册成功，请直接登录')
        setIsError(false)
        setMode('login')
        setPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      setIsError(true)
      const msg = String(err?.message || '')
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setMessage('注册失败：该手机号已注册，请直接登录')
      } else if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
        setMessage('注册失败：邮件发送太频繁，请稍后再试（或关闭邮箱确认）')
      } else if (msg.includes('invalid')) {
        setMessage('注册失败：邮箱格式被拒绝，请检查 Supabase 的邮箱确认设置')
      } else {
        setMessage(`注册失败：${msg}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // 退出登录
  async function handleLogout() {
    setMessage('')
    setIsError(false)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setMessage('已退出登录')
      setIsError(false)
    } catch (err) {
      setIsError(true)
      setMessage(`退出失败：${err.message}`)
    }
  }

  // 加载中
  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-gray-800">我的</h1>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">我的</h1>

      {/* 已登录：显示用户信息 */}
      {user ? (
        <>
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 animate-jelly-in">
            <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-medium animate-jelly-wobble">
              {getDisplayName(user).slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-800 truncate">
                  {getDisplayName(user)}
                </p>
                <span
                  className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                    isAdmin
                      ? 'bg-brand-50 text-brand-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {isAdmin ? '管理员' : '司机'}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate">
                {emailToPhone(user.email)}
              </p>
            </div>
          </div>

          <div
            className="bg-white rounded-2xl p-4 shadow-sm space-y-2 animate-jelly-in"
            style={{ animationDelay: '80ms' }}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">用户 ID</span>
              <span className="text-gray-700 font-mono text-xs truncate max-w-[60%]">
                {user.id}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">注册时间</span>
              <span className="text-gray-700 text-xs">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString('zh-CN')
                  : '—'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-2xl bg-white text-red-500 text-sm font-medium shadow-sm jelly-card animate-jelly-in"
            style={{ animationDelay: '160ms' }}
          >
            退出登录
          </button>
        </>
      ) : (
        /* 未登录：显示登录 / 注册表单 */
        <form
          onSubmit={mode === 'login' ? handleLogin : handleRegister}
          className="bg-white rounded-2xl p-4 shadow-sm space-y-3 animate-jelly-in"
        >
          {/* 登录 / 注册 切换 */}
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'login'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'register'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              注册
            </button>
          </div>

          <p className="text-sm font-medium text-gray-700">
            {mode === 'login' ? '手机号登录' : '注册新账号'}
          </p>

          <div className="space-y-1">
            <label className="text-xs text-gray-400">手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="请输入 11 位手机号"
              maxLength={11}
              autoComplete="tel"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? '请设置密码（至少 6 位）' : '请输入密码'}
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs text-gray-400">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                autoComplete="new-password"
                className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl bg-brand-600 text-white text-sm font-medium disabled:opacity-50 jelly-card"
          >
            {submitting
              ? mode === 'login'
                ? '登录中...'
                : '注册中...'
              : mode === 'login'
                ? '登录'
                : '注册'}
          </button>
        </form>
      )}

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

      {/* 设置区块 */}
      <div
        className="bg-white rounded-2xl p-4 shadow-sm animate-jelly-in"
        style={{ animationDelay: '220ms' }}
      >
        <p className="text-sm text-gray-500">设置</p>
        <p className="mt-2 text-gray-400 text-sm">暂无数据</p>
      </div>
    </div>
  )
}
