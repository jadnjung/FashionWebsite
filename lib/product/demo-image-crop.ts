/** Presentation-only crops of the same licensed demonstration photograph. */
export function getDemoImageCrop(url: string): { scale: number; origin: string } | null {
  if (url === '/preview-demo/product-3.jpg?view=detail') return { scale: 1.8, origin: '50% 30%' };
  if (url === '/preview-demo/product-3.jpg?view=fit') return { scale: 1.25, origin: '50% 0%' };
  return null;
}
