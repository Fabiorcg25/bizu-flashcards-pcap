import Link from 'next/link'
import { login } from './actions'

export default async function LoginPage({ searchParams }) {
  const params = await searchParams
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

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

        <h1>Área do aluno</h1>
        <p className="muted">Entre com o e-mail usado para liberar seu acesso.</p>

        {!configured && (
          <div className="notice">
            O Supabase ainda não foi conectado. Você pode visualizar o{' '}
            <Link href="/demo"><b>modo demonstração</b></Link>.
          </div>
        )}

        {params?.erro && <div className="error">{params.erro}</div>}

        <form action={login}>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="seuemail@exemplo.com"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={!configured}
          >
            ENTRAR
          </button>
        </form>

        <Link
          href="/recuperar-senha"
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: 12 }}
        >
          PRIMEIRO ACESSO / ESQUECI MINHA SENHA
        </Link>

        <p className="muted" style={{ fontSize: 12, marginTop: 18 }}>
          O cadastro público fica desativado: o acesso é liberado após a compra.
        </p>
      </section>
    </main>
  )
}
