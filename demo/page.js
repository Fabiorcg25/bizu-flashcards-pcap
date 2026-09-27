import DashboardShell from '@/components/dashboard-shell'
import FlashcardPlayer from '@/components/flashcard-player'
import { subjects, demoCards } from '@/lib/demo-data'

export default async function Demo({ searchParams }) {
  const params = await searchParams
  if (params?.estudar) return <main className="flash-wrap"><div className="brand" style={{marginBottom:20}}><div className="bolt">⚡</div><div><h1>BIZU FLASHCARDS</h1><small>DEMONSTRAÇÃO DA EXPERIÊNCIA</small></div></div><FlashcardPlayer cards={demoCards} demo /></main>
  return <DashboardShell subjects={subjects} demo />
}
