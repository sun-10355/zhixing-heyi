import { useCallback, useState } from 'react'
import { load, save, type AppData } from './db'

// 请求浏览器持久存储，降低一年期打卡记录被系统清缓存抹掉的风险
if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
  navigator.storage.persist().catch(() => {})
}

/** 全局唯一数据源：App 持有，向下传递 */
export function useData() {
  const [data, setData] = useState<AppData>(load)

  const update = useCallback((fn: (d: AppData) => void) => {
    setData(prev => {
      const next: AppData = structuredClone(prev)
      fn(next)
      save(next)
      return next
    })
  }, [])

  return [data, update] as const
}
