import { useState } from 'react'
import { useData } from './store'
import { todayKey, defaultBucket } from './logic'
import { HomePage } from './components/HomePage'
import { WeeklyPage } from './components/WeeklyPage'
import { RecordsPage } from './components/RecordsPage'
import { ChoicePage } from './components/ChoicePage'
import { PlanPage } from './components/PlanPage'

export type View = 'home' | 'weekly' | 'records' | 'plan'

export default function App() {
  const [data, update] = useData()
  const [view, setView] = useState<View>('home')
  // 调试开关：模拟"武装日 + 已过 8 点"，用来测试二选一流程
  const [debugMorning, setDebugMorning] = useState(false)

  const today = todayKey()
  const armed = debugMorning || data.armed.includes(today) || data.risk.includes(today)
  const day = data.days[today]
  const morning = debugMorning || new Date().getHours() >= 8
  const needChoice = armed && morning && !day?.choice

  const resolve = (choice: 'plan' | 'lie') => {
    update(d => {
      const dd = (d.days[today] ??= { choice: null, bucket: defaultBucket(), done: [], wordDone: false })
      dd.choice = choice
    })
    setView(choice === 'plan' ? 'plan' : 'home')
  }

  // 武装日 8 点后未做选择 → 强制二选一
  if (needChoice) {
    const bucket = day?.bucket ?? defaultBucket()
    const firstTask = data.tasks[bucket][0] ?? ''
    return <ChoicePage bucket={bucket} firstTask={firstTask} onResolve={resolve} />
  }

  const showPlanTab = day?.choice === 'plan' || armed

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-md px-5 pb-24">
        {view === 'home' && (
          <HomePage
            data={data}
            update={update}
            today={today}
            armed={armed}
            day={day}
            morning={morning}
            onNav={setView}
            debugOn={debugMorning}
            onToggleDebug={() => setDebugMorning(v => !v)}
          />
        )}
        {view === 'weekly' && <WeeklyPage data={data} update={update} />}
        {view === 'records' && <RecordsPage data={data} update={update} />}
        {view === 'plan' && day && <PlanPage today={today} day={day} tasks={data.tasks} update={update} />}
      </div>
      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-card">
        <div className="mx-auto flex max-w-md">
          <NavTab label="今日" active={view === 'home'} onClick={() => setView('home')} />
          <NavTab label="记录" active={view === 'records'} onClick={() => setView('records')} />
          <NavTab label="周日规划" active={view === 'weekly'} onClick={() => setView('weekly')} />
          {showPlanTab && <NavTab label="止损计划" active={view === 'plan'} onClick={() => setView('plan')} />}
        </div>
      </nav>
    </div>
  )
}

function NavTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex-1 py-3 text-sm font-medium ${active ? 'text-vermilion' : 'text-mute'}`}>
      {label}
    </button>
  )
}
