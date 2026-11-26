// @ts-nocheck
import { useState } from 'react'
import { useSWRConfig } from 'swr'
import { useToast } from '../ui'

export function useAction(refresh) {
  const toast = useToast()
  const { mutate } = useSWRConfig()
  const [busy, setBusy] = useState(null)

  async function run(key, fn, message) {
    setBusy(key)
    let result
    try {
      result = await fn()
    } catch (err) {
      toast(err.message, 'error')
      setBusy(null)
      return undefined
    }
    if (message) toast(message)
    try {
      await Promise.all([refresh(), mutate((k) => Array.isArray(k) && k[0] === 'public')])
    } catch {
      toast('Ação salva, mas não foi possível atualizar a lista agora. Recarregue para conferir.', 'error')
    } finally {
      setBusy(null)
    }
    return result
  }
  return { busy, run }
}
