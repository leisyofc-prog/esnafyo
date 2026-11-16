export function creditCycle(periodKurus: number, remainingKurus: number) {
  const period = periodKurus > 0 ? periodKurus : remainingKurus;
  const minimum = remainingKurus <= 0 ? 0 : Math.min(remainingKurus, Math.max(1, Math.round((period * 20) / 100)));
  const months = minimum <= 0 ? 0 : Math.min(144, Math.ceil(remainingKurus / minimum));
  return { period, minimum, months };
}
