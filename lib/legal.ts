import { PLAN_DEFINITIONS, PUBLIC_PLAN_IDS } from '@/lib/plans'

export const LEGAL_LAST_UPDATED = '2026年3月12日'

export const LEGAL_ENTITY = {
  operatorName: '株式会社Lanespire',
  serviceName: 'SakuEdit',
  representative: '高橋 元希',
  postalCode: '104-0061',
  address: '東京都中央区銀座1丁目12番4号 N&E BLD. 6F',
  contactUrl: 'https://lanespire.com/#contact',
  websiteUrl: 'https://lanespire.com',
} as const

export const LEGAL_CONTACT_NOTE =
  'お問い合わせは上記フォームから受け付けています。電話番号は、特定商取引法第11条に基づき、請求があった場合に遅滞なく開示します。'

export const LEGAL_SERVICE_ENVIRONMENT = [
  '最新の Google Chrome、Safari、Microsoft Edge、または Firefox の各最新版',
  'JavaScript と Cookie を有効にしたブラウザ環境',
  '動画アップロードおよび書き出しデータのダウンロードが可能な安定したインターネット接続',
] as const

export const LEGAL_BILLING_SUMMARY = PUBLIC_PLAN_IDS.map((planId) => {
  const plan = PLAN_DEFINITIONS[planId]

  return {
    id: plan.id,
    name: plan.displayName,
    priceLabel: plan.monthlyPriceYen === null ? '個別見積もり' : `${plan.priceLabel}${plan.periodLabel}`,
    description: plan.description,
  }
})
