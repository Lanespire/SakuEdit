import {
  whoosh,
  whip,
  pageTurn,
  uiSwitch,
  mouseClick,
  shutterModern,
  shutterOld,
  ding,
  bruh,
  vineBoom,
  windowsXpError,
} from '@remotion/sfx'

export interface BuiltinSfx {
  id: string
  name: string
  nameJa: string
  url: string
}

const BUILTIN_SFX: BuiltinSfx[] = [
  { id: 'whoosh', name: 'Whoosh', nameJa: 'シュッ', url: whoosh },
  { id: 'whip', name: 'Whip', nameJa: 'ビュッ', url: whip },
  { id: 'pageTurn', name: 'Page Turn', nameJa: 'ページめくり', url: pageTurn },
  { id: 'uiSwitch', name: 'UI Switch', nameJa: 'スイッチ', url: uiSwitch },
  {
    id: 'mouseClick',
    name: 'Mouse Click',
    nameJa: 'クリック',
    url: mouseClick,
  },
  {
    id: 'shutterModern',
    name: 'Shutter Modern',
    nameJa: 'シャッター（現代）',
    url: shutterModern,
  },
  {
    id: 'shutterOld',
    name: 'Shutter Old',
    nameJa: 'シャッター（古い）',
    url: shutterOld,
  },
  { id: 'ding', name: 'Ding', nameJa: 'チーン', url: ding },
  { id: 'bruh', name: 'Bruh', nameJa: 'ブラー', url: bruh },
  { id: 'vineBoom', name: 'Vine Boom', nameJa: 'ドーン', url: vineBoom },
  {
    id: 'windowsXpError',
    name: 'Windows XP Error',
    nameJa: 'エラー音',
    url: windowsXpError,
  },
]

export function getBuiltinSfxList(): BuiltinSfx[] {
  return BUILTIN_SFX
}

export function getSfxUrl(sfxId: string): string | undefined {
  return BUILTIN_SFX.find((sfx) => sfx.id === sfxId)?.url
}
