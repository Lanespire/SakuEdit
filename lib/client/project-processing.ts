import { postJson } from '@/lib/client/http'

interface StartProjectProcessingOptions {
  reuseExistingSubtitles?: boolean
}

export async function startProjectProcessing(
  projectId: string,
  options: StartProjectProcessingOptions = {},
) {
  await postJson<
    Record<string, unknown>,
    {
      projectId: string
      options: {
        silenceThreshold: number
        silenceDuration: number
        subtitles: never[]
        quality: string
        format: string
        watermark: boolean
        reuseExistingSubtitles: boolean
      }
    }
  >('/api/process/start', {
    projectId,
    options: {
      silenceThreshold: -35,
      silenceDuration: 0.5,
      subtitles: [],
      quality: '720p',
      format: 'mp4',
      watermark: false,
      reuseExistingSubtitles: Boolean(options.reuseExistingSubtitles),
    },
  })
}
