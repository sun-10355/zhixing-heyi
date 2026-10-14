import { keyOf, mondayOf, weekCount, habitsSorted } from '../logic'
import type { AppData } from '../db'

const WD = ['一', '二', '三', '四', '五', '六', '日']

interface Props {
  data: AppData
  /** 周锚点（默认本周一） */
  mon?: Date
}

export function WeekSummary({ data, mon: monProp }: Props) {
  const mon = monProp ?? mondayOf(new Date())
  const todayK = keyOf(new Date())
  const habits = habitsSorted(data.habits)

  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    days.push(d)
  }

  let total = 0
  let done = 0
  for (const d of days) {
    const k = keyOf(d)
    if (k > todayK) continue // 未来天数不计入统计
    const c = data.checkins[k]
    if (!c) continue
    for (const h of habits) {
      total++
      if (c[h.id]) done++
    }
  }

  const freqHabits = habits.filter(h => h.freq < 7)

  return (
    <section className="rounded-2xl bg-card p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-bold text-mute">本周打卡</h2>
        <span className="text-xs text-mute">
          已打卡 <span className="font-bold text-ink">{done}</span> 次
        </span>
      </div>

      {freqHabits.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {freqHabits.map(h => (
            <span key={h.id} className="rounded-full border border-line bg-paper px-2 py-0.5 text-xs text-mute">
              {h.icon} {h.name} <span className="font-bold text-ink">{weekCount(data.checkins, h.id, mon)}/{h.freq}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-3">
        <table className="w-full border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-12" />
              {days.map((d, i) => {
                const k = keyOf(d)
                const isToday = k === todayK
                const future = k > todayK
                return (
                  <th key={k} className={`text-center text-[10px] font-normal ${isToday ? 'text-vermilion' : 'text-mute/70'}`}>
                    <div>周{WD[i]}</div>
                    <div className={future ? 'opacity-40' : ''}>
                      {d.getMonth() + 1}/{d.getDate()}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {habits.map(h => (
              <tr key={h.id}>
                <td className="text-[11px] text-mute">
                  <span className="mr-1">{h.icon}</span>
                  {h.name.length > 6 ? h.name.slice(0, 6) + '…' : h.name}
                </td>
                {days.map(d => {
                  const k = keyOf(d)
                  const future = k > todayK
                  const on = !!data.checkins[k]?.[h.id]
                  return (
                    <td key={k} className="text-center">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${future ? 'bg-line/40' : 'bg-line'}`}
                        style={on && !future ? { backgroundColor: h.color } : undefined}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
