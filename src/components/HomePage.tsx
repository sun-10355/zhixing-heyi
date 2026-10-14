import { useState } from 'react'
import { dayLabel, weekCount, streak, rate30, armTargetInfo, BUCKET_NAMES, habitsSorted, keyOf } from '../logic'
import type { AppData, Bucket, DayState, Habit } from '../db'
import type { View } from '../App'
import { HabitEditor } from './HabitEditor'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => void) => void
  today: string
  armed: boolean
  day?: DayState
  morning: boolean
  onNav: (v: View) => void
  debugOn: boolean
  onToggleDebug: () => void
}

export function HomePage({ data, update, today, armed, day, morning, onNav, debugOn, onToggleDebug }: Props) {
  const [armOpen, setArmOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [bucket, setBucket] = useState<Bucket>(armTargetInfo().bucket)
  const [popId, setPopId] = useState<string | null>(null)
  const target = armTargetInfo()
  const habits = habitsSorted(data.habits)

  const st = streak(data.checkins)
  const rate = rate30(data.checkins, habits)

  // 昨天断了、今天还没补 → Never miss twice 提示
  const y = new Date()
  y.setDate(y.getDate() - 1)
  const yC = data.checkins[keyOf(y)]
  const yesterdayMiss = !yC || !Object.values(yC).some(Boolean)
  const todayMiss = !data.checkins[today] || !Object.values(data.checkins[today]).some(Boolean)
  const showRecover = st === 0 && yesterdayMiss && todayMiss && rate !== null

  const status = !armed ? '正常日' : day?.choice === 'plan' ? '止损日' : day?.choice === 'lie' ? '躺平日' : '已武装'

  function toggle(h: Habit) {
    update(d => {
      const c = (d.checkins[today] ??= {})
      c[h.id] = !c[h.id]
    })
    navigator.vibrate?.(15)
    setPopId(h.id)
    setTimeout(() => setPopId(null), 350)
  }

  function confirmArm() {
    update(d => {
      if (!d.armed.includes(target.date)) d.armed.push(target.date)
      const dd = (d.days[target.date] ??= { choice: null, bucket, done: [], wordDone: false })
      dd.bucket = bucket
    })
    setArmOpen(false)
  }

  return (
    <div>
      <header className="flex items-end justify-between pt-8 pb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">知行合一</h1>
          <p className="mt-1 text-sm text-mute">{dayLabel(new Date())}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs ${
            status === '正常日' ? 'bg-moss/10 text-moss' : 'bg-vermilion/10 text-vermilion'
          }`}
        >
          {status}
        </span>
      </header>

      {rate !== null && (
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-mute">
              🔥 连续 <span className="font-bold text-ink">{st}</span> 天
            </span>
            <span className="text-sm text-mute">
              近30天完成率 <span className="font-bold text-ink">{rate}%</span>
            </span>
          </div>
          {showRecover && (
            <p className="mt-2 text-xs text-vermilion">
              昨天断了。别连续错过两次——今天随便打卡一项，节奏就还在。
            </p>
          )}
        </div>
      )}

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-mute">每日必做</h2>
          <button onClick={() => setEditOpen(true)} className="text-xs text-mute underline underline-offset-4">
            管理习惯
          </button>
        </div>
        <ul className="mt-3 divide-y divide-line rounded-2xl bg-card shadow-sm">
          {habits.map(h => {
            const done = !!data.checkins[today]?.[h.id]
            const count = weekCount(data.checkins, h.id)
            const name = h.freq < 7 ? `${h.name}（本周 ${count}/${h.freq}）` : h.name
            return (
              <li key={h.id} className={popId === h.id ? 'check-pop' : ''}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => toggle(h)}
                    className="h-5 w-5"
                    style={{ accentColor: h.color }}
                  />
                  <span className="text-lg">{h.icon}</span>
                  <span className={`flex-1 text-[15px] ${done ? 'text-mute line-through' : 'text-ink'}`}>{name}</span>
                </label>
              </li>
            )
          })}
        </ul>
      </section>

      {armed && !morning && (
        <div className="mt-4 rounded-2xl border border-vermilion/30 bg-vermilion/5 p-4 text-sm text-ink">
          已武装止损 · <span className="font-bold text-vermilion">8 点后回来做二选一</span>（回笼觉上限 10:30）
        </div>
      )}
      {day?.choice === 'plan' && (
        <button onClick={() => onNav('plan')} className="mt-4 w-full rounded-2xl bg-ink p-4 text-left text-sm text-paper">
          今日止损计划进行中 <span className="text-paper/70">→ 回笼觉 + 任务清单</span>
        </button>
      )}
      {day?.choice === 'lie' && (
        <p className="mt-4 rounded-2xl bg-card p-4 text-sm text-mute">知而不行，只是未知。躺平的一天已记录——明天再战。</p>
      )}

      <button
        onClick={() => {
          setBucket(armTargetInfo().bucket)
          setArmOpen(true)
        }}
        className="mt-6 w-full rounded-2xl bg-vermilion py-4 font-bold text-paper shadow-md active:scale-[0.99]"
      >
        今晚要喝 → 武装止损
      </button>
      <p className="mt-2 text-center text-xs text-mute">武装后，明早 8 点二选一（周日规划可预标记酒局日）</p>

      <div className="mt-8 border-t border-line pt-4 text-center">
        <button onClick={onToggleDebug} className="text-xs text-mute underline underline-offset-4">
          {debugOn ? '调试：关闭模拟明早 8 点' : '调试：模拟明早 8 点'}
        </button>
        <span className="mx-2 text-mute/40">|</span>
        <button
          onClick={() => {
            if (confirm('确定清空所有数据？')) {
              localStorage.clear()
              location.reload()
            }
          }}
          className="text-xs text-mute underline underline-offset-4"
        >
          清空测试数据
        </button>
      </div>

      {armOpen && (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-ink/60" onClick={() => setArmOpen(false)}>
          <div className="w-full max-w-md rounded-t-3xl bg-paper p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-ink">今晚要喝？</h3>
            <p className="mt-1 text-sm text-mute">武装 {target.label} 的止损模式</p>

            <div className="mt-4 flex gap-2">
              {(Object.keys(BUCKET_NAMES) as Bucket[]).map(b => (
                <button
                  key={b}
                  onClick={() => setBucket(b)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm ${
                    bucket === b ? 'border-vermilion bg-vermilion/5 font-bold text-vermilion' : 'border-line text-mute'
                  }`}
                >
                  {BUCKET_NAMES[b]}
                </button>
              ))}
            </div>

            <p className="mt-4 rounded-xl bg-card p-3 text-sm text-ink">
              承诺：<span className="font-bold text-vermilion">明早 8 点，先开知行合一，再碰抖音</span>
            </p>
            <p className="mt-2 text-xs text-mute">到家若还有一丝清醒，打开 app 看一眼这句话。</p>

            <div className="mt-5 flex gap-3">
              <button onClick={() => setArmOpen(false)} className="flex-1 rounded-xl border border-line py-3 text-sm text-mute">
                再想想
              </button>
              <button onClick={confirmArm} className="flex-1 rounded-xl bg-vermilion py-3 text-sm font-bold text-paper">
                武装明早止损
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <HabitEditor
          habits={data.habits}
          onSave={hs => update(d => void (d.habits = hs))}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  )
}
