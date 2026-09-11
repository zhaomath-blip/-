import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

// 状态 -> 颜色样式映射
const STATUS_STYLES = {
  空闲: 'bg-green-50 text-green-600',
  可用: 'bg-green-50 text-green-600',
  在岗: 'bg-green-50 text-green-600',
  出车中: 'bg-brand-50 text-brand-600',
  任务中: 'bg-brand-50 text-brand-600',
  维修中: 'bg-amber-50 text-amber-600',
  保养中: 'bg-amber-50 text-amber-600',
  休息: 'bg-gray-100 text-gray-400',
  停用: 'bg-gray-100 text-gray-400',
  离线: 'bg-gray-100 text-gray-400',
}

function getStatusStyle(status) {
  return STATUS_STYLES[status] || 'bg-gray-100 text-gray-500'
}

export default function Schedule() {
  const [tab, setTab] = useState('vehicles') // vehicles | drivers
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      setLoading(true)
      setError('')
      try {
        const [v, d] = await Promise.all([
          supabase
            .from('vehicles')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('drivers')
            .select('*')
            .order('created_at', { ascending: false }),
        ])

        if (v.error) throw v.error
        if (d.error) throw d.error

        if (!cancelled) {
          setVehicles(v.data || [])
          setDrivers(d.data || [])
        }
      } catch (e) {
        if (!cancelled) setError(e.message || '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAll()
    return () => {
      cancelled = true
    }
  }, [])

  const list = tab === 'vehicles' ? vehicles : drivers

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">日程</h1>
        <span className="text-xs text-gray-400">共 {list.length} 条</span>
      </div>

      {/* 切换 Tab */}
      <div className="bg-white rounded-2xl p-1 shadow-sm flex animate-jelly-in">
        {[
          { key: 'vehicles', label: '🚌 车辆' },
          { key: 'drivers', label: '👤 司机' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm rounded-xl transition-colors ${
              tab === t.key
                ? 'bg-brand-600 text-white font-medium'
                : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
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

      {/* 空数据 */}
      {!loading && !error && list.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center animate-jelly-in">
          <p className="text-3xl mb-2 animate-jelly-float">📭</p>
          <p className="text-sm text-gray-400">
            {tab === 'vehicles' ? '暂无车辆信息' : '暂无司机信息'}
          </p>
        </div>
      )}

      {/* 车辆卡片 */}
      {!loading &&
        !error &&
        tab === 'vehicles' &&
        vehicles.map((v, index) => (
          <div
            key={v.id}
            className="bg-white rounded-2xl p-4 shadow-sm space-y-3 jelly-card animate-jelly-in"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl animate-jelly-wobble">🚌</span>
                <h2 className="font-semibold text-gray-800">
                  {v.plate_number || '未填写车牌'}
                </h2>
              </div>
              <span
                className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${getStatusStyle(
                  v.status,
                )}`}
              >
                {v.status || '未知'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-400">车型</p>
                <p className="text-gray-700 mt-0.5">{v.model || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-400">座位数</p>
                <p className="text-gray-700 mt-0.5">
                  {v.capacity != null ? `${v.capacity} 座` : '—'}
                </p>
              </div>
            </div>
          </div>
        ))}

      {/* 司机卡片 */}
      {!loading &&
        !error &&
        tab === 'drivers' &&
        drivers.map((d, index) => (
          <div
            key={d.id}
            className="bg-white rounded-2xl p-4 shadow-sm space-y-3 jelly-card animate-jelly-in"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-sm font-medium animate-jelly-wobble">
                  {(d.name || '?').slice(0, 1)}
                </div>
                <h2 className="font-semibold text-gray-800">
                  {d.name || '未填写姓名'}
                </h2>
              </div>
              <span
                className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${getStatusStyle(
                  d.status,
                )}`}
              >
                {d.status || '未知'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
              <span>📞</span>
              <span>{d.phone || '未填写电话'}</span>
            </div>
          </div>
        ))}
    </div>
  )
}
