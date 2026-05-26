import axios from 'axios'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function detailToMessage(detail: unknown): string | null {
  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (isRecord(item) && typeof item.msg === 'string') {
          return item.msg
        }

        return null
      })
      .filter((message): message is string => Boolean(message))

    return messages.length > 0 ? messages.join(' ') : null
  }

  return null
}

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data

    if (isRecord(data)) {
      const detailMessage = detailToMessage(data.detail)

      if (detailMessage) {
        return detailMessage
      }
    }

    if (error.message) {
      return error.message
    }
  }

  return 'Не удалось выполнить запрос. Попробуйте ещё раз.'
}
