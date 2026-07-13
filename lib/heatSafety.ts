import { OutfitScene } from '@/types';

export type RunningHeatSafetyLevel = 'normal' | 'caution' | 'danger';

// 40°C is the product's danger threshold: it rounds the US National Weather
// Service "Danger" heat-index boundary of 103°F (39.4°C) to a clear value.
export function getRunningHeatSafetyLevel(
  scene: OutfitScene,
  feelsLike: number,
): RunningHeatSafetyLevel {
  if (scene !== 'running') return 'normal';
  if (feelsLike >= 40) return 'danger';
  if (feelsLike >= 35) return 'caution';
  return 'normal';
}
