// 建议页面（空架子，后续填充内容）
export default function Suggest() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">建议</h1>

      <div className="bg-white rounded-2xl p-4 shadow-sm animate-jelly-in">
        <p className="text-sm text-gray-500">智能建议</p>
        <p className="mt-2 text-gray-400 text-sm">暂无数据</p>
      </div>

      <div
        className="bg-white rounded-2xl p-8 shadow-sm text-center animate-jelly-in"
        style={{ animationDelay: '90ms' }}
      >
        <p className="text-3xl mb-2 animate-jelly-float">💡</p>
        <p className="text-sm text-gray-400">暂无建议内容</p>
      </div>
    </div>
  )
}
