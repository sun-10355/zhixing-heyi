import { useState } from 'react'
import { BUCKET_NAMES } from '../logic'
import type { Bucket } from '../db'

interface Props {
  bucket: Bucket
  firstTask: string
  onResolve: (choice: 'plan' | 'lie') => void
}

export function ChoicePage({ bucket, firstTask, onResolve }: Props) {
  const [confirmLie, setConfirmLie] = useState(false)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-10">
      <div className="w-full max-w-sm">
        <p className="text-sm text-mute">昨晚的你说</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-ink">今天走哪条路？</h1>

        <button
          onClick={() => onResolve('plan')}
          className="mt-10 block w-full rounded-2xl bg-vermilion p-6 text-left text-paper shadow-lg active:scale-[0.98]"
        >
          <div className="text-xl font-bold">走止损计划</div>
          <div className="mt-3 text-sm opacity-90">回笼觉到 10:30</div>
          <div className="mt-1 text-sm opacity-90">
            {BUCKET_NAMES[bucket]} · {firstTask}
          </div>
        </button>

        <div className="mt-8 text-center">
          <button onClick={() => setConfirmLie(true)} className="text-xs text-mute underline underline-offset-4">
            算了，今天躺平
          </button>
        </div>
      </div>

      {confirmLie && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-ink/60 px-6" onClick={() => setConfirmLie(false)}>
          <div className="w-full max-w-xs rounded-2xl bg-paper p-6" onClick={e => e.stopPropagation()}>
            <p className="font-serif text-lg font-bold text-ink">知而不行，只是未知</p>
            <p className="mt-2 text-sm text-mute">确定今天躺平？</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmLie(false)} className="flex-1 rounded-xl border border-line py-2.5 text-sm font-medium text-ink">
                再想想
              </button>
              <button onClick={() => onResolve('lie')} className="flex-1 rounded-xl bg-ink py-2.5 text-sm font-medium text-paper">
                确定躺平
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
