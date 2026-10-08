/** Apparent, real and reactive power. kW = kVA*PF, kVA = kW/PF, kvar = sqrt(kVA^2 - kW^2). */
function checkPf(pf: number) {
  if (!(pf > 0 && pf <= 1)) throw new Error('Power factor must be in (0, 1]');
}

export interface PowerTriangle { kva: number; kw: number; kvar: number }

export function kvaToKw(kva: number, powerFactor: number): PowerTriangle {
  if (!(kva > 0)) throw new Error('kVA must be positive');
  checkPf(powerFactor);
  const kw = kva * powerFactor;
  return { kva, kw, kvar: Math.sqrt(Math.max(kva * kva - kw * kw, 0)) };
}

export function kwToKva(kw: number, powerFactor: number): PowerTriangle {
  if (!(kw > 0)) throw new Error('kW must be positive');
  checkPf(powerFactor);
  const kva = kw / powerFactor;
  return { kva, kw, kvar: Math.sqrt(Math.max(kva * kva - kw * kw, 0)) };
}
