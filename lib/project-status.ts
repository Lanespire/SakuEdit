const PROCESSING_STATUSES = new Set([
  'PROCESSING',
  'QUEUED',
  'UPLOADING',
  'ANALYZING',
])

type ProjectStatusSnapshot = {
  status?: string | null
  progress?: number | null
  lastError?: string | null
}

export function isProjectProcessingStatus(status: string | null | undefined) {
  if (!status) {
    return false
  }

  return PROCESSING_STATUSES.has(status)
}

export function isProjectErrorStatus(status: string | null | undefined) {
  return status === 'ERROR'
}

export function getProjectDisplayStatus({
  status,
  progress,
  lastError,
}: ProjectStatusSnapshot) {
  if (isProjectErrorStatus(status)) {
    return 'ERROR'
  }

  if (status === 'DRAFT' && lastError && (progress ?? 0) > 0) {
    return 'ERROR'
  }

  if (isProjectProcessingStatus(status)) {
    return 'PROCESSING'
  }

  if (status === 'DRAFT' && (progress ?? 0) > 0) {
    return 'PROCESSING'
  }

  return status ?? 'DRAFT'
}
