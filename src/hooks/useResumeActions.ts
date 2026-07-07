import type { ChangeEvent } from 'react'
import { useStore } from '../store'

export function useResumeActions() {
  const importData = useStore((s) => s.importData)

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { importWordFile } = await import('../utils/importWord')
      const parsed = await importWordFile(file)
      importData(parsed)
    } catch (err) {
      console.error('导入失败:', err)
      alert('导入失败，请检查文件格式')
    }
    e.target.value = ''
  }

  const handleExportDocx = async () => {
    const { exportDocx } = await import('../utils/exportDocx')
    exportDocx(useStore.getState().data)
  }

  const handleExportPdf = async () => {
    const { exportPdf } = await import('../utils/exportPdf')
    exportPdf()
  }

  return { handleImport, handleExportDocx, handleExportPdf }
}
