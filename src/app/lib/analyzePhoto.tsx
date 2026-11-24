// @ts-nocheck
// AI photo analysis (Lovable AI vision) by default; local pixel-color fallback only on failure/timeout.
import { analyzePhoto } from '@/app/ai/photo.functions'
import { analyzeLocally } from './imageTools'

const AI_TIMEOUT_MS = 20000

export async function analyzePhotoSmart(dataUrl, fileName = '') {
  try {
    const res = await Promise.race([
      analyzePhoto({ data: { dataUrl } }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), AI_TIMEOUT_MS)),
    ])
    if (!res?.ok) throw new Error('ai unavailable')
    const a = res.analysis
    return { ...a, color: a.color || (await analyzeLocally(dataUrl, fileName)).color, categoryConfidence: 'alta', marks: a.keywords, source: 'ai' }
  } catch {
    // Plan B: JS pixel analysis estimates color only; category stays open for manual selection.
    const local = await analyzeLocally(dataUrl, fileName)
    return { ...local, category: '', source: 'local' }
  }
}
