import { useState } from 'react'

// 星期表头
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

// 本地日期 -> YYYY-MM-DD
function toKey(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 把任意时间值统一成 YYYY-MM-DD
function normalize(value) {
  if (!value) return ''
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  return toKey(d)
}

/**
 * 日历组件
 * props:
 *   - markedDates: { 'YYYY-MM-DD': 'colorKey' }  需要标记的日期
 *   - colorMap:    { colorKey: { dot, bg, text } } 颜色映射
 *   - selected:    'YYYY-MM-DD' 当前选中日期
 *   - onSelect:    (dateStr) => void
 */
export default function Calendar({
  markedDates = {},
  colorMap = {},
  selected = '',
  onSelect,
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const todayKey = toKey(today)

  // 当月第一天是星期几、当月天数
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  // 生成格子：前面补空，后面补空
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm animate-jelly-in">
      {/* 月份切换 */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 jelly-card"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-gray-800">
          {viewYear} 年 {viewMonth + 1} 月
        </p>
        <button
          type="button"
          onClick={nextMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 jelly-card"
        >
          ›
        </button>
      </div>

      {/* 星期表头 */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-center text-xs text-gray-400 py-1"
          >
            {w}
          </div>
        ))}
      </div>

      {/* 日期格子 */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />

          const dateKey = toKey(new Date(viewYear, viewMonth, day))
          const colorKey = markedDates[dateKey]
          const colors = colorKey ? colorMap[colorKey] : null
          const isToday = dateKey === todayKey
          const isSelected = dateKey === selected

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelect && onSelect(dateKey)}
              className={`relative mx-auto w-9 h-9 rounded-full flex items-center justify-center text-sm jelly-card ${
                isSelected
                  ? 'bg-brand-600 text-white font-semibold'
                  : colors
                    ? `${colors.bg} ${colors.text} font-medium`
                    : isToday
                      ? 'text-brand-600 font-semibold'
                      : 'text-gray-700'
              }`}
            >
              {day}
              {/* 标记小圆点 */}
              {colors && !isSelected && (
                <span
                  className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${colors.dot}`}
                />
              )}
              {/* 今天的外圈 */}
              {isToday && !isSelected && !colors && (
                <span className="absolute inset-0 rounded-full border border-brand-300" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
