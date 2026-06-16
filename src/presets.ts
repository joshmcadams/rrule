import { RRule } from 'rrule'
import { DEFAULT_STATE, type BuilderState } from './rrule/types'

/** Example rules that exercise different corners of the RRULE spec. */
export interface Preset {
  name: string
  description: string
  build: () => BuilderState
}

const base = (overrides: Partial<BuilderState>): BuilderState => ({
  ...DEFAULT_STATE,
  ...overrides,
})

export const PRESETS: Preset[] = [
  {
    name: 'Every other Friday',
    description: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=FR',
    build: () =>
      base({
        freq: RRule.WEEKLY,
        interval: 2,
        byweekday: [{ weekday: 4, nth: null }],
      }),
  },
  {
    name: 'Weekdays only',
    description: 'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR',
    build: () =>
      base({
        freq: RRule.DAILY,
        byweekday: [0, 1, 2, 3, 4].map((weekday) => ({ weekday, nth: null })),
      }),
  },
  {
    name: 'Last weekday of month',
    description: 'FREQ=MONTHLY;BYDAY=MO..FR;BYSETPOS=-1',
    build: () =>
      base({
        freq: RRule.MONTHLY,
        byweekday: [0, 1, 2, 3, 4].map((weekday) => ({ weekday, nth: null })),
        bysetpos: [-1],
      }),
  },
  {
    name: 'Thanksgiving (US)',
    description: '4th Thursday of November — FREQ=YEARLY;BYMONTH=11;BYDAY=4TH',
    build: () =>
      base({
        freq: RRule.YEARLY,
        bymonth: [11],
        byweekday: [{ weekday: 3, nth: 4 }],
      }),
  },
  {
    name: 'Quarterly on the 1st ×10',
    description: 'FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=1;COUNT=10',
    build: () =>
      base({
        freq: RRule.MONTHLY,
        interval: 3,
        bymonthday: [1],
        endMode: 'count',
        count: 10,
      }),
  },
  {
    name: 'Twice daily until EOY',
    description: 'FREQ=DAILY;BYHOUR=9,17;BYMINUTE=0;UNTIL=2026-12-31',
    build: () =>
      base({
        freq: RRule.DAILY,
        byhour: [9, 17],
        byminute: [0],
        endMode: 'until',
        until: '2026-12-31',
      }),
  },
  {
    name: 'First & last of month',
    description: 'FREQ=MONTHLY;BYMONTHDAY=1,-1',
    build: () =>
      base({
        freq: RRule.MONTHLY,
        bymonthday: [1, -1],
      }),
  },
]
