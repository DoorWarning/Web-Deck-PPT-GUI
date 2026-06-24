import { nanoid } from 'nanoid';
import type { Deck, Section, Block, BlockType } from './types';

export function newSection(layout: Section['layout'] = 'free'): Section {
  return {
    id: nanoid(8),
    layout,
    background: '#0f1220',
    color: '#f5f6fa',
    transition: 'fade',
    blocks: [],
    notes: '',
    padding: 64,
  };
}

// Default props per block type. Kept here so the store, editor, and AI schema
// share one source of truth.
export function defaultBlockProps(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'markdown':
      return { md: '# 제목\n\n내용을 입력하세요. **마크다운**을 지원합니다.' };
    case 'media':
      return { kind: 'image', src: '', alt: '', caption: '' };
    case 'chart':
      return {
        chartType: 'bar',
        labels: ['A', 'B', 'C', 'D'],
        data: [12, 19, 7, 15],
        label: '데이터셋',
        controllable: true, // show sliders so viewers tweak data live
        min: 0,
        max: 30,
      };
    case 'poll':
      return {
        question: '가장 좋아하는 것은?',
        options: ['옵션 1', '옵션 2', '옵션 3'],
        correct: -1, // -1 = poll (no correct answer); >=0 = quiz
        persist: false,
      };
    case 'playground':
      return {
        html: '<h2>Hello</h2>\n<button onclick="alert(\'clicked\')">Click</button>',
        css: 'h2 { color: tomato; font-family: sans-serif; }',
        js: "console.log('ready');",
        showEditor: true,
      };
    case 'embed':
      return { url: 'https://www.youtube.com/embed/88GkYKvnvvI?si=mmN5-95FtyLdFC_v', ratio: '16/9' };
    case 'customCode':
      return {
        html: '<div class="card">커스텀 HTML/CSS/JS</div>',
        css: '.card{padding:24px;border-radius:16px;background:#222;color:#fff;font-family:sans-serif}',
        js: '',
      };
  }
}

export function newBlock(type: BlockType): Block {
  return {
    id: nanoid(8),
    type,
    props: defaultBlockProps(type),
    // Free placement (absolute) is the default — drag blocks anywhere.
    layout: { width: 'auto', align: 'center', position: 'absolute', xPct: 15, yPct: 18, widthPct: 70 },
    anim: { reveal: 'fade', step: 0, on: 'load' },
    interactions: [],
  };
}

export function defaultDeck(): Deck {
  const cover = newSection('free');
  cover.background = 'linear-gradient(135deg, #1b1f3a 0%, #2d1b4e 100%)';
  const title = newBlock('markdown');
  title.props = { md: '# 인터랙티브 발표\n\n### 웹페이지처럼, 실시간으로 조작되는 발표 자료' };
  title.layout = { position: 'absolute', xPct: 12, yPct: 34, widthPct: 76, align: 'center' };
  title.style = { textAlign: 'center' };
  title.anim = { reveal: 'rise', step: 0, on: 'load' };
  cover.blocks = [title];

  const demo = newSection('free');
  demo.background = '#0f1220';
  const intro = newBlock('markdown');
  intro.props = { md: '## 차트를 직접 움직여 보세요\n\n슬라이더를 드래그하면 즉시 반영됩니다.' };
  intro.layout = { position: 'absolute', xPct: 8, yPct: 8, widthPct: 84, align: 'start' };
  const chart = newBlock('chart');
  chart.layout = { position: 'absolute', xPct: 12, yPct: 34, widthPct: 76, align: 'center' };
  demo.blocks = [intro, chart];

  const quizSection = newSection('free');
  quizSection.background = 'linear-gradient(135deg,#10231c,#0f1220)';
  const poll = newBlock('poll');
  poll.props = { question: 'HTML 발표의 장점은?', options: ['높은 자유도', '인터랙션', '쉬운 배포', '전부 다'], correct: 3, persist: false };
  poll.layout = { position: 'absolute', xPct: 22, yPct: 22, widthPct: 56, align: 'center' };
  quizSection.blocks = [poll];

  return {
    version: 2,
    id: nanoid(8),
    title: '제목 없는 발표',
    theme: {
      fontFamily: '"Pretendard", system-ui, "Segoe UI", "Malgun Gothic", sans-serif',
      headingFamily: '"Pretendard", system-ui, sans-serif',
      accent: '#7c5cff',
      maxWidth: 980,
    },
    canvas: { w: 1280, h: 720 },
    sections: [cover, demo, quizSection],
    scripts: [],
  };
}
