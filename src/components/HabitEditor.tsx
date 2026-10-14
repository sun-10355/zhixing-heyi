import { useState } from 'react'
import { HABIT_COLORS, HABIT_ICONS, genId, type Habit } from '../db'
import { habitsSorted } from '../logic'

interface Props {
  habits: Habit[]
  onSave: (habits: Habit[]) => void
  onClose: () => void
}

export function HabitEditor({ habits: initial, onSave, onClose }: Props) {
  const [habits, setHabits] = useState<Habit[]>(initial.map(h => ({ ...h })))
  const [openId, setOpenId] = useState<string | null>(null)
  const sorted = habitsSorted(habits)

  function patch(id: string, p: Partial<Habit>) {
    setHabits(hs => hs.map(h => (h.id === id ? { ...h, ...p } : h)))
  }

  function move(id: string, dir: -1 | 1) {
    const i = sorted.findIndex(h => h.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= sorted.length) return
    const next = [...sorted]
    ;[next[i], next[j]] = [next[j], next[i]]
    setHabits(next.map((h, idx) => ({ ...h, order: idx })))
  }

  function remove(id: string) {
    if (!confirm('删除这个习惯？历史打卡记录会保留，但不再显示和统计。')) return
    setHabits(hs => hs.filter(h => h.id !== id).map((h, i) => ({ ...h, order: i })))
    if (openId === id) setOpenId(null)
  }

  function add() {
    const h: Habit = { id: genId(), name: '新习惯', icon: '⭐', color: HABIT_COLORS[0], freq: 7, order: sorted.length }
    setHabits(hs => [...hs, h])
    setOpenId(h.id)
  }

  function save() {
    onSave(sorted.filter(h => h.name.trim()).map((h, i) => ({ ...h, order: i })))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/60" onClick={onClose}>
      <div className="flex max-h-[88vh] w-full max-w-md flex-col rounded-t-3xl bg-paper" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6">
          <h3 className="font-serif text-lg font-bold text-ink">管理习惯</h3>
          <button onClick={onClose} className="text-mute">✕</button>
        </div>
        <p className="px-6 mt-1 text-xs text-mute">顺序 = 你一天的行动节奏；频率低于每天的习惯按周计算完成率</p>

        <div className="mt-4 flex-1 space-y-2 overflow-y-auto px-6 pb-4">
          {sorted.map(h => {
            const open = openId === h.id
            return (
              <div key={h.id} className="rounded-2xl border border-line bg-card">
                <div className="flex items-center gap-2 px-3 py-3" onClick={() => setOpenId(open ? null : h.id)}>
                  <span className="text-lg">{h.icon}</span>
                  <span className="flex-1 truncate text-[15px] text-ink">{h.name}</span>
                  <span className="text-xs text-mute">{h.freq === 7 ? '每天' : `每周 ${h.freq} 天`}</span>
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: h.color }}
                  />
                  <span className="text-xs text-mute">{open ? '▴' : '▾'}</span>
                </div>

                {open && (
                  <div className="border-t border-line px-3 pb-3 pt-2" onClick={e => e.stopPropagation()}>
                    <input
                      value={h.name}
                      onChange={e => patch(h.id, { name: e.target.value })}
                      placeholder="习惯名称"
                      className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-[15px] text-ink outline-none focus:border-vermilion"
                    />

                    <p className="mt-3 text-xs font-bold text-mute">图标</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {HABIT_ICONS.map(ic => (
                        <button
                          key={ic}
                          onClick={() => patch(h.id, { icon: ic })}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${
                            h.icon === ic ? 'bg-vermilion/10 ring-1 ring-vermilion' : 'bg-paper'
                          }`}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>

                    <p className="mt-3 text-xs font-bold text-mute">颜色</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {HABIT_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => patch(h.id, { color: c })}
                          className={`h-7 w-7 rounded-full ${h.color === c ? 'ring-2 ring-ink ring-offset-2 ring-offset-card' : ''}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>

                    <p className="mt-3 text-xs font-bold text-mute">频率</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <button
                          key={n}
                          onClick={() => patch(h.id, { freq: n })}
                          className={`rounded-full border px-3 py-1.5 text-xs ${
                            h.freq === n ? 'border-vermilion bg-vermilion font-bold text-paper' : 'border-line text-mute'
                          }`}
                        >
                          {n}天/周
                        </button>
                      ))}
                      <button
                        onClick={() => patch(h.id, { freq: 7 })}
                        className={`rounded-full border px-3 py-1.5 text-xs ${
                          h.freq === 7 ? 'border-vermilion bg-vermilion font-bold text-paper' : 'border-line text-mute'
                        }`}
                      >
                        每天
                      </button>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button onClick={() => move(h.id, -1)} className="flex-1 rounded-xl border border-line py-2 text-xs text-mute">
                        ↑ 上移
                      </button>
                      <button onClick={() => move(h.id, 1)} className="flex-1 rounded-xl border border-line py-2 text-xs text-mute">
                        ↓ 下移
                      </button>
                      <button onClick={() => remove(h.id)} className="rounded-xl border border-vermilion/40 px-3 py-2 text-xs text-vermilion">
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          <button onClick={add} className="w-full rounded-2xl border border-dashed border-line py-3 text-sm text-mute">
            ＋ 添加习惯
          </button>
        </div>

        <div className="border-t border-line p-4">
          <button onClick={save} className="w-full rounded-xl bg-vermilion py-3.5 text-sm font-bold text-paper">
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
