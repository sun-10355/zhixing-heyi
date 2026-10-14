import { useEffect, useState } from 'react'
import { BUCKET_NAMES, hangoverTarget, dayLabel } from '../logic'
import type { AppData, Bucket, DayState } from '../db'

interface Props {
  today: string
  day: DayState
  tasks: Record<Bucket, string[]>
  update: (fn: (d: AppData) => void) => void
}

export function PlanPage({ today, day, tasks, update }: Props) {
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const remain = Math.max(0, hangoverTarget().getTime() - nowMs)
  const mm = String(Math.floor(remain / 60000)).padStart(2, '0')
  const ss = String(Math.floor((remain % 60000) / 1000)).padStart(2, '0')

  function setBucket(b: Bucket) {
    update(d => {
      d.days[today].bucket = b
    })
  }

  function toggleTask(task: string) {
    update(d => {
      const dd = d.days[today]
      dd.done = dd.done.includes(task) ? dd.done.filter(x => x !== task) : [...dd.done, task]
    })
  }

  function addTask() {
    const t = newTask.trim()
    if (!t) return
    update(d => {
      d.tasks[day.bucket].push(t)
    })
    setNewTask('')
  }

  function removeTask(task: string) {
    update(d => {
      d.tasks[day.bucket] = d.tasks[day.bucket].filter(x => x !== task)
      d.days[today].done = d.days[today].done.filter(x => x !== task)
    })
  }

  return (
    <div>
      <header className="pt-8 pb-6">
        <h1 className="font-serif text-2xl font-bold text-ink">止损日</h1>
        <p className="mt-1 text-sm text-mute">{dayLabel(new Date())}</p>
      </header>

      <section className="rounded-2xl bg-card p-4 shadow-sm">
        <div className="text-sm text-mute">回笼觉上限 10:30</div>
        <div className="mt-1 font-serif text-3xl font-bold text-ink">
          {remain > 0 ? `剩余 ${mm}:${ss}` : '时间到，该动了'}
        </div>
      </section>

      <section className="mt-6">
        <div className="flex gap-2">
          {(Object.keys(BUCKET_NAMES) as Bucket[]).map(b => (
            <button
              key={b}
              onClick={() => setBucket(b)}
              className={`flex-1 rounded-xl border py-2 text-sm ${
                day.bucket === b ? 'border-vermilion bg-vermilion/5 font-bold text-vermilion' : 'border-line text-mute'
              }`}
            >
              {BUCKET_NAMES[b]}
            </button>
          ))}
        </div>

        <ul className="mt-3 divide-y divide-line rounded-2xl bg-card shadow-sm">
          {tasks[day.bucket].map(task => {
            const done = day.done.includes(task)
            return (
              <li key={task} className="flex items-center gap-3 px-4 py-3.5">
                <input type="checkbox" checked={done} onChange={() => toggleTask(task)} className="h-5 w-5 accent-moss" />
                <span className={`flex-1 text-[15px] ${done ? 'text-mute line-through' : 'text-ink'}`}>{task}</span>
                <button onClick={() => removeTask(task)} className="text-xs text-mute/60">
                  ✕
                </button>
              </li>
            )
          })}
          <li className="flex items-center gap-3 px-4 py-3.5">
            <input
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addTask()
              }}
              placeholder="加一条行动型任务"
              className="flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-mute/50"
            />
            <button onClick={addTask} className="text-sm font-bold text-vermilion">
              添加
            </button>
          </li>
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border-2 border-vermilion bg-vermilion/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-bold text-vermilion">保底：欧路 5min × 25 词</div>
            <div className="mt-1 text-xs text-mute">其他全没做成，这一项也算赢</div>
          </div>
          <input
            type="checkbox"
            checked={day.wordDone}
            onChange={() =>
              update(d => {
                d.days[today].wordDone = !d.days[today].wordDone
              })
            }
            className="h-7 w-7 accent-vermilion"
          />
        </div>
      </section>

      <p className="mt-6 text-center text-xs text-mute">耳朵用起来，脑子歇着——边做事边听英文</p>
    </div>
  )
}
