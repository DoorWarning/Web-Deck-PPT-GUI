// JSON Schema (draft-07) describing the deck format, for validating
// AI-generated decks and documenting the contract in AUTHORING.md.
export const deckSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Deck',
  type: 'object',
  required: ['version', 'id', 'title', 'theme', 'sections'],
  properties: {
    version: { const: 2 },
    id: { type: 'string' },
    title: { type: 'string' },
    theme: {
      type: 'object',
      required: ['fontFamily', 'accent', 'maxWidth'],
      properties: {
        fontFamily: { type: 'string' },
        headingFamily: { type: 'string' },
        accent: { type: 'string' },
        maxWidth: { type: 'number' },
      },
    },
    scripts: { type: 'array', items: { type: 'string' } },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'layout', 'background', 'transition', 'blocks'],
        properties: {
          id: { type: 'string' },
          layout: { enum: ['flow', 'center', 'split', 'grid', 'fixed'] },
          background: { type: 'string' },
          color: { type: 'string' },
          transition: { enum: ['none', 'fade', 'slide', 'zoom'] },
          notes: { type: 'string' },
          padding: { type: 'number' },
          blocks: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'type', 'props'],
              properties: {
                id: { type: 'string' },
                type: { enum: ['markdown', 'media', 'chart', 'poll', 'playground', 'embed', 'customCode'] },
                props: { type: 'object' },
                layout: {
                  type: 'object',
                  properties: {
                    width: { enum: ['auto', 'full', 'half', 'third', 'twothird'] },
                    widthPct: { type: 'number', description: '수동 너비 % (1..100), 설정 시 width 프리셋보다 우선' },
                    align: { enum: ['start', 'center', 'end'] },
                    col: { type: 'number' },
                    position: { enum: ['flow', 'absolute'], description: 'absolute면 xPct/yPct로 섹션 위 자유 배치' },
                    xPct: { type: 'number', description: '자유배치 좌측 위치 % (0..100)' },
                    yPct: { type: 'number', description: '자유배치 상단 위치 % (0..100)' },
                    z: { type: 'number' },
                  },
                },
                anim: {
                  type: 'object',
                  properties: {
                    reveal: { enum: ['fade', 'rise', 'zoom', 'none'] },
                    step: { type: 'number' },
                    on: { enum: ['load', 'scroll'] },
                  },
                },
                style: {
                  type: 'object',
                  description: '블록별 폰트/색 (미설정 시 테마 상속)',
                  properties: {
                    fontFamily: { type: 'string' },
                    color: { type: 'string' },
                    fontSize: { type: 'number' },
                    textAlign: { enum: ['left', 'center', 'right'] },
                  },
                },
                interactions: { type: 'array' },
              },
            },
          },
        },
      },
    },
  },
} as const;
