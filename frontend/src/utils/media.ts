import { BASE_URL } from '../api/client'

export function mediaUrl(path: string | null | undefined) {
  if (!path) {
    return null
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

export function isVideoUrl(path: string | null | undefined) {
  if (!path) {
    return false
  }

  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(path)
}
