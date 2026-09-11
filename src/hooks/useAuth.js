import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

// 手机号登录用的占位域名（与 Mine.jsx 保持一致）
const PHONE_DOMAIN = 'phone.local'

// 内部邮箱 -> 显示用的手机号
export function emailToPhone(email) {
  if (!email) return ''
  if (email.endsWith(`@${PHONE_DOMAIN}`)) {
    return email.slice(0, -`@${PHONE_DOMAIN}`.length)
  }
  return email
}

// 取显示名
export function getDisplayName(user, profile) {
  if (profile?.full_name) return profile.full_name
  if (!user) return ''
  const meta = user.user_metadata || {}
  if (meta.name) return meta.name
  if (user.email) {
    if (user.email.endsWith(`@${PHONE_DOMAIN}`)) return emailToPhone(user.email)
    return user.email.split('@')[0]
  }
  return '用户'
}

/**
 * 全局登录状态 Hook
 * 返回：{ user, profile, role, isAdmin, loading, refreshProfile }
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // 读取 profile（角色）
  async function loadProfile(uid) {
    if (!uid) {
      setProfile(null)
      return
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle()
      if (error) throw error
      setProfile(data || null)
    } catch {
      setProfile(null)
    }
  }

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      const u = data.session?.user ?? null
      setUser(u)
      await loadProfile(u?.id)
      if (active) setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      await loadProfile(u?.id)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const role = profile?.role || 'driver'

  return {
    user,
    profile,
    role,
    isAdmin: role === 'admin',
    loading,
    refreshProfile: () => loadProfile(user?.id),
  }
}
