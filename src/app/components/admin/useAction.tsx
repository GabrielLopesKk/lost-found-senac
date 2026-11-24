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
    try {
      const result = await fn()
      if (message) toast(message)
      await refresh()
      mutate((k) => Array.isArray(k) && k[0] === 'public')
      return result
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(null)
    }
  }
  return { busy, run }
}
