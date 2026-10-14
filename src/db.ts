export type Bucket = 'trip' | 'weekend' | 'workday'

export interface WeekPlan {
  focus: string
  study: string
  work: string
}

export interface Habit {
  id: string
  name: string
  icon: string
  color: string
  /** 每周目标天数 1-7，7=每天 */
  freq: number
  order: number
}

/** 默认习惯沿用旧 id，保证历史打卡记录无缝迁移 */
export const DEFAULT_HABITS: Habit[] = [
  { id: 'readEn', name: '晨读 英文 25min', icon: '📖', color: '#5C6E4E', freq: 7, order: 0 },
  { id: 'readScript', name: '晨读 脚本 25min', icon: '🎙️', color: '#8A7A55', freq: 7, order: 1 },
  { id: 'meditate', name: '冥想 15min', icon: '🧘', color: '#8A5CA5', freq: 7, order: 2 },
  { id: 'nap', name: '午睡 ≤25min', icon: '😴', color: '#4A6FA5', freq: 7, order: 3 },
  { id: 'diet', name: '晚饭七分饱', icon: '🥗', color: '#3C8A85', freq: 7, order: 4 },
  { id: 'sport', name: '运动', icon: '🏃', color: '#B3402A', freq: 5, order: 5 }
]

export const HABIT_COLORS = ['#B3402A', '#5C6E4E', '#8A7A55', '#4A6FA5', '#8A5CA5', '#C2853C', '#3C8A85', '#23201C']

export const HABIT_ICONS = [
  '📖', '🏃', '🧘', '😴', '🥗', '📝', '💪', '🚶', '🏊', '🚴', '🎯', '🌅',
  '☀️', '🍎', '💧', '🧹', '📚', '✍️', '🎧', '🧠', '❤️', '🌙', '⭐', '🛌'
]

export const genId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10))

export interface DayState {
  /** 二选一的结果：plan=走止损计划，lie=确定躺平 */
  choice: 'plan' | 'lie' | null
  bucket: Bucket
  /** 已完成的任务文本 */
  done: string[]
  /** 保底卡：欧路 5min×25 词 */
  wordDone: boolean
}

export interface AppData {
  /** date(YYYY-MM-DD) -> habitId -> done */
  checkins: Record<string, Record<string, boolean>>
  /** 已武装止损模式的日期 */
  armed: string[]
  /** 周日规划预标记的酒局风险日 */
  risk: string[]
  /** 周一日期 -> 周计划 */
  plans: Record<string, WeekPlan>
  days: Record<string, DayState>
  tasks: Record<Bucket, string[]>
  habits: Habit[]
  /** 周一日期 -> 一周回顾 */
  reviews: Record<string, string>
}

const KEY = 'zhixing_data_v1'

export const DEFAULT_TASKS: Record<Bucket, string[]> = {
  trip: ['去工厂看加工进度', '看料 / 买料', '路上听纳瓦尔访谈'],
  weekend: ['陪儿子户外运动'],
  workday: ['扫地拖地洗衣', '跑腿办事', '处理抖音收藏夹（祝酒词 / 社交话题）', '听英文播客或电影']
}

export function emptyData(): AppData {
  return {
    checkins: {},
    armed: [],
    risk: [],
    plans: {},
    days: {},
    tasks: { ...DEFAULT_TASKS },
    habits: DEFAULT_HABITS.map(h => ({ ...h })),
    reviews: {}
  }
}

const pad = (n: number) => String(n).padStart(2, '0')
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyData()
    const d: AppData = { ...emptyData(), ...JSON.parse(raw) }
    d.tasks = { ...DEFAULT_TASKS, ...d.tasks }
    // 旧版本数据没有 habits/reviews 字段 → 用默认值补齐
    if (!Array.isArray(d.habits) || d.habits.length === 0) {
      d.habits = DEFAULT_HABITS.map(h => ({ ...h }))
    }
    if (!d.reviews || typeof d.reviews !== 'object') d.reviews = {}
    // 清理过期的武装/风险日
    const today = keyOf(new Date())
    d.armed = d.armed.filter(x => x >= today)
    d.risk = d.risk.filter(x => x >= today)
    return d
  } catch {
    return emptyData()
  }
}

export function save(d: AppData) {
  localStorage.setItem(KEY, JSON.stringify(d))
}

/** 导出全部数据为 JSON 文本（备份用） */
export function exportRaw(): string {
  return localStorage.getItem(KEY) ?? JSON.stringify(emptyData())
}

/** 校验并写入备份数据，成功返回 true */
export function importRaw(json: string): boolean {
  try {
    const d = JSON.parse(json)
    if (!d || typeof d !== 'object') return false
    if (typeof d.checkins !== 'object' || d.checkins === null) return false
    if (typeof d.days !== 'object' || d.days === null) return false
    localStorage.setItem(KEY, json)
    return true
  } catch {
    return false
  }
}
