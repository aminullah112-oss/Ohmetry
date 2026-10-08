/** Power unit conversion. Mechanical (imperial) horsepower = 745.699872 W; metric horsepower (PS, CV) = 735.49875 W. */
export type HpKind = 'mechanical' | 'metric';
const WATTS_PER_HP: Record<HpKind, number> = { mechanical: 745.699872, metric: 735.49875 };

export function kwToHp(kw: number, kind: HpKind): number {
  if (!(kw > 0)) throw new Error('kW must be positive');
  return (kw * 1000) / WATTS_PER_HP[kind];
}

export function hpToKw(hp: number, kind: HpKind): number {
  if (!(hp > 0)) throw new Error('Horsepower must be positive');
  return (hp * WATTS_PER_HP[kind]) / 1000;
}

/** Electrical input kW needed to deliver a shaft output, at a given efficiency (0-1]. */
export function inputKw(shaftKw: number, efficiency: number): number {
  if (!(shaftKw > 0)) throw new Error('Shaft power must be positive');
  if (!(efficiency > 0 && efficiency <= 1)) throw new Error('Efficiency must be in (0, 1]');
  return shaftKw / efficiency;
}
