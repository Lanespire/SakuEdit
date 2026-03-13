/**
 * サムネイルテンプレート定義
 * AI生成時のベースプロンプトを含む8種のテンプレート
 */

export interface ThumbnailTemplate {
  id: string
  name: string
  category: 'gaming' | 'vlog' | 'education' | 'business' | 'entertainment'
  previewUrl: string
  description: string
  promptHint: string
}

export const THUMBNAIL_TEMPLATES: ThumbnailTemplate[] = [
  // ゲーム実況
  {
    id: 'gaming-battle',
    name: 'バトル系',
    category: 'gaming',
    previewUrl: '/templates/gaming-battle.png',
    description: '迫力のあるゲーム実況サムネイル',
    promptHint:
      'Create a dynamic gaming thumbnail with the person on the left side, large bold impact text on the right, red gradient background with energy effects, dramatic lighting, intense atmosphere. Use thick outlined Japanese text with a 3D shadow effect.',
  },
  {
    id: 'gaming-guide',
    name: '攻略系',
    category: 'gaming',
    previewUrl: '/templates/gaming-guide.png',
    description: 'わかりやすいゲーム攻略サムネイル',
    promptHint:
      'Create a clean gaming guide thumbnail with centered bold text inside a decorative frame or banner, blue-themed color scheme, organized layout with clear visual hierarchy. Use numbered or highlighted key points if applicable.',
  },
  // Vlog
  {
    id: 'vlog-stylish',
    name: 'おしゃれ系',
    category: 'vlog',
    previewUrl: '/templates/vlog-stylish.png',
    description: 'おしゃれで洗練されたVlogサムネイル',
    promptHint:
      'Create a stylish minimalist vlog thumbnail with a full-bleed photo background, subtle text overlay at the bottom with soft pastel tones, light and airy atmosphere, modern clean aesthetic with gentle shadows.',
  },
  {
    id: 'vlog-travel',
    name: '旅行系',
    category: 'vlog',
    previewUrl: '/templates/vlog-travel.png',
    description: '鮮やかな旅行Vlogサムネイル',
    promptHint:
      'Create a vibrant travel vlog thumbnail with a scenic landscape background, bold white knockout text with warm color accents, vivid and saturated colors, adventurous and exciting mood.',
  },
  // 教育
  {
    id: 'education-explainer',
    name: '解説系',
    category: 'education',
    previewUrl: '/templates/education-explainer.png',
    description: 'わかりやすい解説動画サムネイル',
    promptHint:
      'Create a clean educational thumbnail with an icon or illustration on the left side, key points as bold text on the right, clean white or light gray background, professional and trustworthy appearance with clear typography.',
  },
  {
    id: 'education-ranking',
    name: 'ランキング系',
    category: 'education',
    previewUrl: '/templates/education-ranking.png',
    description: 'インパクトのあるランキング動画サムネイル',
    promptHint:
      'Create a ranking-style thumbnail with large bold numbers, list-style layout, yellow or gold accent colors for emphasis, dynamic angled text, energetic and curiosity-inducing design.',
  },
  // ビジネス
  {
    id: 'business-presentation',
    name: 'プレゼン風',
    category: 'business',
    previewUrl: '/templates/business-presentation.png',
    description: '信頼感のあるビジネスプレゼンサムネイル',
    promptHint:
      'Create a professional business presentation thumbnail with centered text alignment, blue-to-white gradient background, clean sans-serif typography, corporate and trustworthy aesthetic with subtle geometric accents.',
  },
  // エンタメ
  {
    id: 'entertainment-surprise',
    name: 'ドッキリ/驚き',
    category: 'entertainment',
    previewUrl: '/templates/entertainment-surprise.png',
    description: '派手で目を引くエンタメサムネイル',
    promptHint:
      'Create a flashy entertainment thumbnail with tilted/angled bold text, surprise effects like starburst or explosion graphics, highly saturated vibrant colors, exaggerated and eye-catching design with dramatic impact.',
  },
]

export function getTemplateById(id: string): ThumbnailTemplate | undefined {
  return THUMBNAIL_TEMPLATES.find((t) => t.id === id)
}

export function getTemplatesByCategory(
  category: ThumbnailTemplate['category']
): ThumbnailTemplate[] {
  return THUMBNAIL_TEMPLATES.filter((t) => t.category === category)
}
