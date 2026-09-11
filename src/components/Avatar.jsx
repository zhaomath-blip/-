// 通用头像组件
// 支持三种显示：
//   1) 上传的图片 URL（http/https 开头）
//   2) 预设 emoji（例如 "🚌"）
//   3) 兜底：昵称首字
//
// props:
//   avatar   —— profiles.avatar_url 的值（emoji 或 URL）
//   name     —— 昵称，用于兜底首字
//   size     —— 尺寸类名，默认 'w-12 h-12'
//   textSize —— 文字大小类名，默认 'text-lg'
//   className—— 额外类名

function isImageUrl(value) {
  if (!value) return false
  return /^https?:\/\//i.test(String(value))
}

export default function Avatar({
  avatar,
  name,
  size = 'w-12 h-12',
  textSize = 'text-lg',
  className = '',
}) {
  const base = `${size} rounded-full overflow-hidden shrink-0 flex items-center justify-center ${className}`

  // 1) 图片头像
  if (isImageUrl(avatar)) {
    return (
      <div className={`${base} bg-gray-100`}>
        <img
          src={avatar}
          alt={name || '头像'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // 图片加载失败时隐藏，露出兜底背景
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
    )
  }

  // 2) emoji 头像
  if (avatar) {
    return (
      <div className={`${base} bg-brand-50 ${textSize}`}>
        <span className="leading-none">{avatar}</span>
      </div>
    )
  }

  // 3) 兜底：昵称首字
  const initial = (name || '用').trim().slice(0, 1)
  return (
    <div className={`${base} bg-brand-100 text-brand-600 font-medium ${textSize}`}>
      {initial}
    </div>
  )
}
