import { useState, type ChangeEvent } from 'react'
import { useStore } from '../store'

export function useResumeActions() {
  const importData = useStore((s) => s.importData)
  const [loading, setLoading] = useState<'pdf' | 'docx' | 'import' | null>(null)

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading('import')
    try {
      const { importWordFile } = await import('../utils/importWord')
      const parsed = await importWordFile(file)
      importData(parsed)
    } catch (err) {
      console.error('导入失败:', err)
      alert('导入失败，请检查文件格式')
    } finally {
      setLoading(null)
    }
    e.target.value = ''
  }

  const handleExportDocx = async () => {
    if (loading) return
    setLoading('docx')
    try {
      const state = useStore.getState()
      const { exportDocx } = await import('../utils/exportDocx')
      await exportDocx(state.data, state.template)
    } catch (err) {
      console.error('导出 Word 失败:', err)
      alert('导出 Word 失败，请重试')
    } finally {
      setLoading(null)
    }
  }

  const handleExportPdf = async () => {
    if (loading) return
    setLoading('pdf')
    try {
      const { exportPdf } = await import('../utils/exportPdf')
      await exportPdf()
    } catch (err) {
      console.error('导出 PDF 失败:', err)
      alert('导出 PDF 失败，请重试')
    } finally {
      setLoading(null)
    }
  }

  return { handleImport, handleExportDocx, handleExportPdf, loading }
}
