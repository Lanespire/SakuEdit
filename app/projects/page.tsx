import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getBillingSnapshot } from '@/lib/billing'
import ProjectsDashboardClient, {
  type ProjectsBillingSummary,
} from '@/components/projects/ProjectsDashboardClient'

function formatPeriodEndLabel(value: Date) {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
  }).format(value)
}

export default async function ProjectsPage() {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({
    headers: requestHeaders,
  })

  let billingSummary: ProjectsBillingSummary | null = null

  if (session?.user?.id) {
    const billing = await getBillingSnapshot(session.user.id)
    const usedMinutes = Math.ceil(billing.usedSeconds / 60)
    const totalMinutes = billing.plan.monthlyProcessingMinutes

    billingSummary = {
      planDisplayName: billing.plan.displayName,
      usedMinutes,
      totalMinutes,
      remainingMinutes: Math.max(0, totalMinutes - usedMinutes),
      usagePercentage:
        totalMinutes > 0
          ? Math.min(
              100,
              Math.round((billing.usedSeconds / (totalMinutes * 60)) * 100),
            )
          : 0,
      resetDateLabel: formatPeriodEndLabel(billing.billedWindowEnd),
    }
  }

  return <ProjectsDashboardClient billingSummary={billingSummary} />
}
