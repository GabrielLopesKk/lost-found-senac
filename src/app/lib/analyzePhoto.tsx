// @ts-nocheck
// AI photo analysis with local fallback (dominant color + file-name hints).
import { analyzePhoto } from '@/app/ai/photo.functions'
import { analyzeLocally } from './imageTools'

export async function analyzePhotoSmart(dataUrl, fileName = '') {
  try {
    const res = await analyzePhoto({ data: { dataUrl } })
    if (res?.ok) {
      const a = res.analysis
      return { ...a, color: a.color || (await analyzeLocally(dataUrl, fileName)).color, categoryConfidence: 'alta', marks: a.keywords }
    }
  } catch { /* fallback below */ }
  return analyzeLocally(dataUrl, fileName)
}
