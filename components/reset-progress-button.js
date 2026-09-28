'use client'

import { useState } from 'react'
import { resetStudyProgress } from '@/app/perfil/actions'

export default function ResetProgressButton() {
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState('')

  async function handleReset() {
    const confirmed = window.confirm(
      'Zerar toda a contagem de estudos?\n\nIsso vai apagar o histórico de revisões e zerar progresso, dominados, erros, revisões pendentes e sequência. Favoritos e acesso serão mantidos.'
    )
    if (!confirmed) return

    setLoading(true)
    setError('')
    try {
      const result = await resetStudyProgress()
      if (!result?.ok) {
        setError(result?.error || 'Não foi possível zerar a contagem.')
        setLoading(false)
        return
      }
      window.location.href = '/perfil?zerado=1'
    } catch {
      setError('Não foi possível zerar a contagem.')
      setLoading(false)
    }
  }

  return <>
    <button className="btn btn-danger reset-progress-btn" type="button" onClick={handleReset} disabled={loading}>
      {loading ? 'ZERANDO...' : 'ZERAR CONTAGEM'}
    </button>
    {error && <div className="reset-error">{error}</div>}
  </>
}
