// 通用下载工具：创建 Blob URL 并触发浏览器下载
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  // 延迟释放，避免下载尚未开始时 URL 已被回收
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
