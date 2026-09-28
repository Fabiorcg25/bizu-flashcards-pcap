'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DefinirSenhaPage() {
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    let cancelled = false

    async function prepareSession() {
      const supabase = createClient()

      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')

        // Suporta redirecionamento PKCE, caso o Supabase use ?code=...
        if (code) {
          const { error: codeError } = await supabase.auth.exchangeCodeForSession(code)
          if (codeError) throw codeError
        }

        // Suporta o fluxo padrão de convite com tokens no fragmento da URL.
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
        const accessToken = hash.get('access_token')
        const refreshToken = hash.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          if (sessionError) throw sessionError
        }

        const { data, error: getSessionError } = await supabase.auth.getSession()
        if (getSessionError) throw getSessionError

        if (!data?.session) {
          throw new Error('O link de acesso está inválido ou expirou.')
        }

        // Remove tokens/códigos da barra de endereço depois de criar a sessão.
        window.history.replaceState({}, '', '/definir-senha')

        if (!cancelled) setReady(true)
      } catch {
        if (!cancelled) {
          setError('O link de criação de senha está inválido ou expirou. Solicite um novo acesso.')
        }
      }
    }

    prepareSession()
    return () => { cancelled = true }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As duas senhas precisam ser iguais.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError('Não foi possível salvar a senha. Tente novamente.')
        setLoading(false)
        return
      }

      window.location.replace('/dashboard')
    } catch {
      setError('Não foi possível concluir seu cadastro.')
      setLoading(false)
    }
  }

  return (
    <main className="login-wrap">
      <section className="login-card">
        <div className="brand">
          <div className="bolt">⚡</div>
          <div>
            <h1 style={{ margin: 0 }}>BIZU FLASHCARDS</h1>
            <small>PC/AP 2026 • OFICIAL INVESTIGADOR</small>
          </div>
        </div>

        <div style={{ marginTop: 24 }} className="eyebrow">
          COMPRA APROVADA
        </div>

        <h1>Crie sua senha</h1>

        <p className="muted">
          Seu acesso já foi liberado. Defina uma senha para entrar no aplicativo.
        </p>

        {!ready && !error && (
          <div className="notice">Validando seu link de acesso...</div>
        )}

        {error && <div className="error">{error}</div>}

        {ready && (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="password">Nova senha</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 8 caracteres"
              />
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Confirmar senha</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
              />
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'SALVANDO...' : 'CRIAR SENHA E ENTRAR'}
            </button>
          </form>
        )}

        <p className="muted" style={{ fontSize: 12, marginTop: 18 }}>
          Depois de criar sua senha, você será direcionado automaticamente para o dashboard.
        </p>
      </section>
    </main>
  )
}
