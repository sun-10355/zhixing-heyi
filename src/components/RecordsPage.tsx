import { useRef, useState, type ChangeEvent } from 'react'
import { mondayOf, keyOf, weekLabel, dayLabel, habitsSorted } from '../logic'
import type { AppData } from '../db'
import { importRaw, exportRaw } from '../db'
import { WeekSummary } from './WeekSummary'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => void) => void
}

export function RecordsPage({ data, update }: Props) {
  const [view, setView] = useState<'week' | 'year'>('week')
  const [offset, setOffset] = useState(0) // 0=本周，正数=往前翻的周数
  const [makeupOpen, setMakeupOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const mon = mondayOf(new Date())
  mon.setDate(mon.getDate() - offset * 7)
  const weekKey = keyOf(mon)

  let planDays = 0
  let lieDays = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    const c = data.days[keyOf(d)]?.choice
    if (c === 'plan') planDays++
    else if (c === 'lie') lieDays++
  }

  const isCurrentWeek = offset === 0
  const otherYear = mon.getFullYear() !== new Date().getFullYear()

  function setReview(v: string) {
    update(d => {
      d.reviews[weekKey] = v
    })
  }

  function download(name: string, content: string, type: string) {
    const blob = new Blob([content], { type })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function exportBackup() {
    download(`知行合一备份-${keyOf(new Date())}.json`, exportRaw(), 'application/json')
  }

  function exportCSV() {
    const habits = habitsSorted(data.habits)
    const head = ['日期', ...habits.map(h => `"${h.name.replace(/"/g, '""')}"`)].join(',')
    const lines = [head]
    for (const k of Object.keys(data.checkins).sort()) {
      const c = data.checkins[k]
      lines.push([k, ...habits.map(h => (c[h.id] ? '1' : ''))].join(','))
    }
    // BOM 让 Excel 正确识别中文
    download(`知行合一打卡-${keyOf(new Date())}.csv`, '﻿' + lines.join('\n'), 'text/csv')
  }

  function onImportFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!confirm('导入备份将覆盖当前全部数据，确定继续？')) return
    const reader = new FileReader()
    reader.onload = () => {
      if (importRaw(String(reader.result))) {
        location.reload()
      } else {
        alert('备份文件无效，未做任何改动')
      }
    }
    reader.readAsText(f)
  }

  return (
    <div>
      <header className="pt-8 pb-4">
        <h1 className="font-serif text-2xl font-bold text-ink">记录</h1>
        <p className="mt-1 text-sm text-mute">一年起的打卡档案</p>
      </header>

      <div className="flex rounded-xl border border-line bg-card p-1">
        <button
          onClick={() => setView('week')}
          className={`flex-1 rounded-lg py-2 text-sm ${view === 'week' ? 'bg-ink font-bold text-paper' : 'text-mute'}`}
        >
          周视图
        </button>
        <button
          onClick={() => setView('year')}
          className={`flex-1 rounded-lg py-2 text-sm ${view === 'year' ? 'bg-ink font-bold text-paper' : 'text-mute'}`}
        >
          年视图
        </button>
      </div>

      {view === 'week' ? (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setOffset(o => o + 1)}
              className="rounded-xl border border-line bg-card px-3.5 py-2 text-sm text-ink active:scale-95"
            >
              ‹ 上一周
            </button>
            <div className="text-center">
              <div className="text-sm font-bold text-ink">
                {weekLabel(mon)}
                {otherYear ? `（${mon.getFullYear()}年）` : ''}
              </div>
              {!isCurrentWeek && (
                <button onClick={() => setOffset(0)} className="mt-0.5 text-xs text-vermilion underline underline-offset-4">
                  回到本周
                </button>
              )}
            </div>
            <button
              onClick={() => setOffset(o => Math.max(0, o - 1))}
              disabled={isCurrentWeek}
              className="rounded-xl border border-line bg-card px-3.5 py-2 text-sm text-ink active:scale-95 disabled:opacity-30"
            >
              下一周 ›
            </button>
          </div>

          <div className="mt-4">
            <WeekSummary data={data} mon={mon} />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-mute">
              {planDays + lieDays > 0 ? `止损 ${planDays} 天 · 躺平 ${lieDays} 天` : '这一周没有止损记录'}
            </p>
            <button onClick={() => setMakeupOpen(true)} className="text-xs text-vermilion underline underline-offset-4">
              补卡（最近 7 天）
            </button>
          </div>

          <section className="mt-6">
            <h2 className="text-sm font-bold text-mute">本周回顾</h2>
            <textarea
              value={data.reviews[weekKey] ?? ''}
              onChange={e => setReview(e.target.value)}
              placeholder="这一周为什么完成 / 为什么没完成（一句就够）"
              rows={2}
              className="mt-2 w-full resize-none rounded-2xl border border-line bg-card p-4 text-[15px] text-ink outline-none focus:border-vermilion"
            />
          </section>
        </div>
      ) : (
        <div className="mt-4">
          <Heatmap data={data} />
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-bold text-mute">数据备份</h2>
        <p className="mt-1 text-xs text-mute">打卡存在本机。定期导出备份，换手机或误清缓存时可恢复。</p>
        <div className="mt-3 flex gap-2">
          <button onClick={exportBackup} className="flex-1 rounded-xl bg-moss py-3 text-sm font-bold text-paper">
            导出 JSON
          </button>
          <button onClick={exportCSV} className="flex-1 rounded-xl bg-moss/80 py-3 text-sm font-bold text-paper">
            导出 CSV
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex-1 rounded-xl border border-line py-3 text-sm text-ink">
            导入备份
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImportFile} />
        </div>
      </section>

      {makeupOpen && <MakeupModal data={data} update={update} onClose={() => setMakeupOpen(false)} />}
    </div>
  )
}

/* ---------------- 年视图热力图 ---------------- */

const LEVELS = ['#E8E3D7', '#C9D3BD', '#A3B88F', '#7C9462', '#5C6E4E']
const WD2 = ['日', '一', '二', '三', '四', '五', '六']

function Heatmap({ data }: { data: AppData }) {
  const habits = habitsSorted(data.habits)
  const year = new Date().getFullYear()
  const todayK = keyOf(new Date())
  const [sel, setSel] = useState<string | null>(null)

  const start = mondayOf(new Date(year, 0, 1))
  const weeks: Date[][] = []
  for (let w = 0; w < 53; w++) {
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + w * 7 + i)
      days.push(d)
    }
    if (days[0].getFullYear() > year) break
    weeks.push(days)
  }

  const months = weeks.map((days, i) => {
    const prev = i > 0 ? weeks[i - 1][0] : null
    return !prev || days[0].getMonth() !== prev.getMonth() ? `${days[0].getMonth() + 1}月` : null
  })

  let selInfo: string | null = null
  if (sel) {
    const c = data.checkins[sel]
    const n = c ? habits.filter(h => c[h.id]).length : 0
    const day = data.days[sel]
    const choice = day?.choice === 'plan' ? '止损日' : day?.choice === 'lie' ? '躺平日' : ''
    selInfo = `${sel} 周${WD2[new Date(sel + 'T00:00:00').getDay()]} · 打卡 ${n}/${habits.length}${choice ? ' · ' + choice : ''}`
  }

  return (
    <section className="rounded-2xl bg-card p-4 shadow-sm">
      <div className="flex gap-1.5">
        <div className="flex flex-col gap-[3px]">
          <div className="h-3" />
          {['一', '二', '三', '四', '五', '六', '日'].map(w => (
            <div key={w} className="flex h-3 w-3 items-center justify-center text-[8px] leading-none text-mute/50">
              {w}
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <div className="inline-block">
            <div className="flex gap-[3px]">
              {months.map((m, i) => (
                <div key={i} className="w-3 shrink-0 text-[9px] leading-3 text-mute/70">
                  {m ?? ''}
                </div>
              ))}
            </div>
            <div className="mt-[3px]">
              {[0, 1, 2, 3, 4, 5, 6].map(row => (
                <div key={row} className="flex gap-[3px]">
                  {weeks.map(days => {
                    const d = days[row]
                    const k = keyOf(d)
                    const future = k > todayK
                    const c = data.checkins[k]
                    const n = c ? habits.filter(h => c[h.id]).length : 0
                    const level = Math.min(4, n)
                    const choice = data.days[k]?.choice
                    return (
                      <button
                        key={k}
                        onClick={() => !future && setSel(k)}
                        className="h-3 w-3 shrink-0 rounded-[2px]"
                        style={{
                          backgroundColor: future ? 'rgba(232,227,215,0.35)' : LEVELS[level],
                          boxShadow: choice ? 'inset 0 0 0 1px rgba(179,64,42,0.55)' : undefined
                        }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-mute">{selInfo ?? '点色块看当天 · 朱红描边 = 止损 / 躺平日'}</p>
      <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-mute">
        少
        {LEVELS.map(c => (
          <span key={c} className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: c }} />
        ))}
        多
      </div>
    </section>
  )
}

/* ---------------- 补卡弹窗 ---------------- */

function MakeupModal({
  data,
  update,
  onClose
}: {
  data: AppData
  update: (fn: (d: AppData) => void) => void
  onClose: () => void
}) {
  const [day, setDay] = useState<string | null>(null)
  const habits = habitsSorted(data.habits)

  const days: { k: string; label: string; n: number }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const k = keyOf(d)
    const c = data.checkins[k]
    const n = c ? habits.filter(h => c[h.id]).length : 0
    days.push({ k, label: i === 0 ? '今天' : dayLabel(d), n })
  }

  function toggle(k: string, id: string) {
    update(d => {
      const c = (d.checkins[k] ??= {})
      c[id] = !c[id]
    })
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/60" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-paper p-6" onClick={e => e.stopPropagation()}>
        {!day ? (
          <>
            <h3 className="font-serif text-lg font-bold text-ink">补卡</h3>
            <p className="mt-1 text-sm text-mute">选一天，把漏掉的打卡补上（最近 7 天）</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {days.map(d => (
                <button
                  key={d.k}
                  onClick={() => setDay(d.k)}
                  className="rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm text-ink"
                >
                  {d.label}
                  <span className="ml-1.5 text-xs text-mute">
                    {d.n}/{habits.length}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <button onClick={() => setDay(null)} className="text-sm text-mute">
                ‹ 返回
              </button>
              <h3 className="font-serif text-lg font-bold text-ink">{day}</h3>
              <span className="w-10" />
            </div>
            <ul className="mt-4 divide-y divide-line rounded-2xl bg-card">
              {habits.map(h => {
                const on = !!data.checkins[day]?.[h.id]
                return (
                  <li key={h.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(day, h.id)}
                        className="h-5 w-5"
                        style={{ accentColor: h.color }}
                      />
                      <span className="text-lg">{h.icon}</span>
                      <span className={`flex-1 text-[15px] ${on ? 'text-mute line-through' : 'text-ink'}`}>{h.name}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </>
        )}
        <button onClick={onClose} className="mt-5 w-full rounded-xl border border-line py-3 text-sm text-mute">
          完成
        </button>
      </div>
    </div>
  )
}
