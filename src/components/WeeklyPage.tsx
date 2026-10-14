import { keyOf, mondayOf, weekLabel, nextDays, dayLabel } from '../logic'
import type { AppData, WeekPlan } from '../db'
import { WeekSummary } from './WeekSummary'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => void) => void
}

const FIELDS: [keyof WeekPlan, string][] = [
  ['focus', '下周重点'],
  ['study', '学习'],
  ['work', '工作']
]

export function WeeklyPage({ data, update }: Props) {
  const weekKey = keyOf(mondayOf(new Date()))
  const plan: WeekPlan = data.plans[weekKey] ?? { focus: '', study: '', work: '' }

  function setField(field: keyof WeekPlan, value: string) {
    update(d => {
      const p = (d.plans[weekKey] ??= { focus: '', study: '', work: '' })
      p[field] = value
    })
  }

  function toggleRisk(date: string) {
    update(d => {
      d.risk = d.risk.includes(date) ? d.risk.filter(x => x !== date) : [...d.risk, date]
    })
  }

  return (
    <div>
      <header className="pt-8 pb-6">
        <h1 className="font-serif text-2xl font-bold text-ink">周日规划</h1>
        <p className="mt-1 text-sm text-mute">{weekLabel(new Date())}</p>
      </header>

      <WeekSummary data={data} />

      <section className="mt-6 space-y-4">
        {FIELDS.map(([field, label]) => (
          <label key={field} className="block">
            <span className="text-sm font-bold text-mute">{label}</span>
            <textarea
              value={plan[field]}
              onChange={e => setField(field, e.target.value)}
              placeholder="写下一两句话就够"
              rows={2}
              className="mt-2 w-full resize-none rounded-2xl border border-line bg-card p-4 text-[15px] text-ink outline-none focus:border-vermilion"
            />
          </label>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-bold text-mute">可能有酒局的日子（点选，自动武装止损）</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {nextDays(7).map(d => {
            const k = keyOf(d)
            const on = data.risk.includes(k)
            return (
              <button
                key={k}
                onClick={() => toggleRisk(k)}
                className={`rounded-full border px-3.5 py-2 text-sm ${
                  on ? 'border-vermilion bg-vermilion font-bold text-paper' : 'border-line bg-card text-ink'
                }`}
              >
                {dayLabel(d)}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
