import { nanoid } from 'nanoid';
import { useStore, useCurrentSection } from '../store/store';
import { getBlockDef } from '../blocks/registry';
import type { Block, Interaction, InteractionAction, Section } from '../model/types';

export function BlockInspector() {
  const section = useCurrentSection();
  const selectedId = useStore((s) => s.selectedBlockId);
  const block = section.blocks.find((b) => b.id === selectedId) ?? null;
  return (
    <div className="inspector">
      {block ? <BlockProps block={block} /> : <SectionDeckProps />}
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="insp-section"><h4>{title}</h4><div className="insp-body">{children}</div></div>;
}

function hexOf(v: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) return '#' + v.slice(1).split('').map((c) => c + c).join('');
  return '#000000';
}

// Color picker + optional text field (for gradients / named colors).
function ColorField({ label, value, onChange, allowText, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; allowText?: boolean; placeholder?: string;
}) {
  return (
    <label className="field"><span>{label}</span>
      <span className="color-cell">
        <input type="color" value={hexOf(value)} onChange={(e) => onChange(e.target.value)} />
        {allowText && <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />}
      </span>
    </label>
  );
}

function BlockProps({ block }: { block: Block }) {
  const def = getBlockDef(block.type);
  const updateBlockProps = useStore((s) => s.updateBlockProps);
  const updateBlock = useStore((s) => s.updateBlock);
  const del = useStore((s) => s.deleteBlock);
  const dup = useStore((s) => s.duplicateBlock);
  const move = useStore((s) => s.moveBlock);

  const update = (patch: Record<string, unknown>) => updateBlockProps(block.id, patch);

  return (
    <>
      <Sec title={`${def.icon} ${def.label}`}>
        <div className="btn-row">
          <button onClick={() => move(block.id, -1)}>↑ 위로</button>
          <button onClick={() => move(block.id, 1)}>↓ 아래로</button>
          <button onClick={() => dup(block.id)}>복제</button>
          <button onClick={() => del(block.id)}>삭제</button>
        </div>
      </Sec>

      <Sec title="내용"><def.Edit block={block} update={update} /></Sec>

      <LayoutControls block={block} setLayout={(patch) => updateBlock(block.id, { layout: { ...block.layout, ...patch } })} />

      <StyleControls block={block} setStyle={(patch) => updateBlock(block.id, { style: { ...block.style, ...patch } })} />


      <Sec title="등장 효과">
        <label className="field"><span>효과</span>
          <select value={block.anim.reveal ?? 'fade'} onChange={(e) => updateBlock(block.id, { anim: { ...block.anim, reveal: e.target.value as Block['anim']['reveal'] } })}>
            <option value="none">없음</option>
            <option value="fade">페이드</option>
            <option value="rise">아래서 위로</option>
            <option value="zoom">확대</option>
          </select>
        </label>
        <label className="field"><span>단계(fragment)</span>
          <input type="number" min={0} value={block.anim.step ?? 0} onChange={(e) => updateBlock(block.id, { anim: { ...block.anim, step: Number(e.target.value) } })} />
        </label>
        <label className="field"><span>트리거</span>
          <select value={block.anim.on ?? 'load'} onChange={(e) => updateBlock(block.id, { anim: { ...block.anim, on: e.target.value as Block['anim']['on'] } })}>
            <option value="load">진입 시</option>
            <option value="scroll">스크롤 시</option>
          </select>
        </label>
      </Sec>

      <InteractionEditor block={block} />
    </>
  );
}

const clampPct = (v: string) => Math.max(0, Math.min(100, Number(v) || 0));

// Align an absolute block to the section edges/center using its measured size.
function alignAbsolute(block: Block, h: 'left' | 'center' | 'right' | null, v: 'top' | 'middle' | 'bottom' | null): Partial<Block['layout']> {
  // Scope to the editor Stage — the left-panel thumbnails share the same
  // data-block-id, and querying globally would measure the tiny thumbnail.
  const el = document.querySelector<HTMLElement>(`.stage [data-block-id="${CSS.escape(block.id)}"]`);
  const section = el?.closest('.section') as HTMLElement | null;
  if (!el || !section) return {};
  const er = el.getBoundingClientRect();
  const sr = section.getBoundingClientRect();
  const bw = (er.width / sr.width) * 100;
  const bh = (er.height / sr.height) * 100;
  const patch: Partial<Block['layout']> = {};
  if (h === 'left') patch.xPct = 0;
  if (h === 'center') patch.xPct = Math.round(((100 - bw) / 2) * 10) / 10;
  if (h === 'right') patch.xPct = Math.round((100 - bw) * 10) / 10;
  if (v === 'top') patch.yPct = 0;
  if (v === 'middle') patch.yPct = Math.round(((100 - bh) / 2) * 10) / 10;
  if (v === 'bottom') patch.yPct = Math.round((100 - bh) * 10) / 10;
  return patch;
}

function LayoutControls({ block, setLayout }: { block: Block; setLayout: (patch: Partial<Block['layout']>) => void }) {
  const L = block.layout;
  const isAbs = L.position === 'absolute';
  const align = (h: 'left' | 'center' | 'right' | null, v: 'top' | 'middle' | 'bottom' | null) => setLayout(alignAbsolute(block, h, v));
  return (
    <Sec title="레이아웃 / 위치">
      <label className="field"><span>배치</span>
        <select
          value={L.position ?? 'flow'}
          onChange={(e) => {
            const pos = e.target.value as 'flow' | 'absolute';
            if (pos === 'absolute') setLayout({ position: 'absolute', xPct: L.xPct ?? 20, yPct: L.yPct ?? 20, widthPct: L.widthPct ?? 40 });
            else setLayout({ position: 'flow' });
          }}
        >
          <option value="flow">흐름(자동 정렬)</option>
          <option value="absolute">자유 배치(드래그)</option>
        </select>
      </label>

      {isAbs && (
        <>
          <div className="grid2">
            <label className="field"><span>X %</span><input type="number" min={0} max={100} value={Math.round(L.xPct ?? 0)} onChange={(e) => setLayout({ xPct: clampPct(e.target.value) })} /></label>
            <label className="field"><span>Y %</span><input type="number" min={0} max={100} value={Math.round(L.yPct ?? 0)} onChange={(e) => setLayout({ yPct: clampPct(e.target.value) })} /></label>
          </div>
          <div className="field col"><span>정렬</span>
            <div className="align-grid">
              <button title="왼쪽" onClick={() => align('left', null)}>⬅</button>
              <button title="가로 가운데" onClick={() => align('center', null)}>↔</button>
              <button title="오른쪽" onClick={() => align('right', null)}>➡</button>
              <button title="위" onClick={() => align(null, 'top')}>⬆</button>
              <button title="세로 가운데" onClick={() => align(null, 'middle')}>↕</button>
              <button title="아래" onClick={() => align(null, 'bottom')}>⬇</button>
              <button className="align-center-both" title="정중앙" onClick={() => align('center', 'middle')}>＋ 정중앙</button>
            </div>
          </div>
        </>
      )}

      <label className="field col">
        <span>너비: {L.widthPct != null ? `${L.widthPct}%` : isAbs ? '40%' : '자동'}</span>
        <input type="range" min={5} max={100} value={L.widthPct ?? (isAbs ? 40 : 100)} onChange={(e) => setLayout({ widthPct: Number(e.target.value) })} />
      </label>
      <div className="btn-row">
        {!isAbs && <button onClick={() => setLayout({ widthPct: undefined, width: 'auto' })}>자동</button>}
        <button onClick={() => setLayout({ widthPct: 100 })}>100%</button>
        <button onClick={() => setLayout({ widthPct: 66 })}>66%</button>
        <button onClick={() => setLayout({ widthPct: 50 })}>50%</button>
        <button onClick={() => setLayout({ widthPct: 33 })}>33%</button>
      </div>

      {!isAbs && (
        <label className="field"><span>정렬</span>
          <select value={L.align ?? 'center'} onChange={(e) => setLayout({ align: e.target.value as Block['layout']['align'] })}>
            <option value="start">왼쪽</option>
            <option value="center">가운데</option>
            <option value="end">오른쪽</option>
          </select>
        </label>
      )}
      {isAbs && <p className="hint">미리보기에서 블록을 드래그해 위치를 옮길 수 있어요.</p>}
    </Sec>
  );
}

const FONT_PRESETS: { label: string; value: string }[] = [
  { label: '테마 기본 (상속)', value: '' },
  { label: 'Pretendard / 산세리프', value: '"Pretendard", system-ui, "Malgun Gothic", sans-serif' },
  { label: 'Noto Sans KR', value: '"Noto Sans KR", system-ui, sans-serif' },
  { label: '시스템 산세리프', value: 'system-ui, "Segoe UI", sans-serif' },
  { label: '명조 / 세리프', value: 'Georgia, "Nanum Myeongjo", serif' },
  { label: '고정폭 / 코드', value: 'ui-monospace, "Cascadia Code", monospace' },
];

function StyleControls({ block, setStyle }: { block: Block; setStyle: (patch: Partial<NonNullable<Block['style']>>) => void }) {
  const s = block.style ?? {};
  const isPreset = FONT_PRESETS.some((f) => f.value === (s.fontFamily ?? ''));
  const ta = s.textAlign ?? '';
  return (
    <Sec title="폰트 / 스타일">
      <div className="field col"><span>텍스트 정렬</span>
        <div className="align-grid three">
          <button className={ta === 'left' ? 'on' : ''} title="왼쪽" onClick={() => setStyle({ textAlign: 'left' })}>⬅</button>
          <button className={ta === 'center' ? 'on' : ''} title="가운데" onClick={() => setStyle({ textAlign: 'center' })}>↔</button>
          <button className={ta === 'right' ? 'on' : ''} title="오른쪽" onClick={() => setStyle({ textAlign: 'right' })}>➡</button>
        </div>
      </div>
      <label className="field col"><span>글꼴</span>
        <select value={isPreset ? (s.fontFamily ?? '') : '__custom'} onChange={(e) => { if (e.target.value !== '__custom') setStyle({ fontFamily: e.target.value || undefined }); }}>
          {FONT_PRESETS.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
          <option value="__custom">직접 입력…</option>
        </select>
      </label>
      <label className="field col"><span>글꼴 직접 입력 (CSS font-family)</span>
        <input value={s.fontFamily ?? ''} onChange={(e) => setStyle({ fontFamily: e.target.value || undefined })} placeholder='예: "Gowun Dodum", sans-serif' />
      </label>
      <div className="grid2">
        <label className="field"><span>색</span>
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(s.color ?? '') ? s.color : '#ffffff'} onChange={(e) => setStyle({ color: e.target.value })} />
        </label>
        <label className="field"><span>크기(px)</span>
          <input type="number" min={8} value={s.fontSize ?? ''} placeholder="자동" onChange={(e) => setStyle({ fontSize: e.target.value ? Number(e.target.value) : undefined })} />
        </label>
      </div>
      <p className="hint">글꼴·색은 블록 전체에 적용됩니다. 크기는 본문 텍스트 기준(마크다운 제목은 자동 크기 우선).</p>
    </Sec>
  );
}

const ACTIONS: { value: InteractionAction; label: string }[] = [
  { value: 'goto', label: '특정 섹션으로' },
  { value: 'next', label: '다음 섹션' },
  { value: 'prev', label: '이전 섹션' },
  { value: 'toggleBlock', label: '블록 표시/숨김' },
  { value: 'openUrl', label: 'URL 열기' },
  { value: 'setVar', label: '변수 설정' },
  { value: 'runScript', label: '스크립트 실행' },
];

function InteractionEditor({ block }: { block: Block }) {
  const updateBlock = useStore((s) => s.updateBlock);
  const section = useCurrentSection();
  const setI = (interactions: Interaction[]) => updateBlock(block.id, { interactions });
  const add = () => setI([...block.interactions, { id: nanoid(6), on: 'click', action: 'next', params: {} }]);
  const patch = (id: string, p: Partial<Interaction>) => setI(block.interactions.map((it) => (it.id === id ? { ...it, ...p } : it)));
  const remove = (id: string) => setI(block.interactions.filter((it) => it.id !== id));
  const others = section.blocks.filter((b) => b.id !== block.id);

  return (
    <Sec title="인터랙션">
      {block.interactions.map((it) => (
        <div key={it.id} className="interaction-row">
          <select value={it.on} onChange={(e) => patch(it.id, { on: e.target.value as Interaction['on'] })}>
            <option value="click">클릭 시</option>
            <option value="scroll">보일 때</option>
            <option value="step">단계 진입 시</option>
          </select>
          <select value={it.action} onChange={(e) => patch(it.id, { action: e.target.value as InteractionAction, params: {} })}>
            {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          {it.action === 'goto' && <input type="number" min={1} placeholder="섹션 번호" value={(it.params.section as number) ?? ''} onChange={(e) => patch(it.id, { params: { section: parseInt(e.target.value) || 1 } })} />}
          {it.action === 'toggleBlock' && (
            <select value={(it.params.targetId as string) ?? ''} onChange={(e) => patch(it.id, { params: { targetId: e.target.value } })}>
              <option value="">대상 블록</option>
              {others.map((o) => <option key={o.id} value={o.id}>{o.type} ({o.id})</option>)}
            </select>
          )}
          {it.action === 'openUrl' && <input placeholder="https://..." value={(it.params.url as string) ?? ''} onChange={(e) => patch(it.id, { params: { url: e.target.value } })} />}
          {it.action === 'setVar' && (
            <>
              <input placeholder="이름" value={(it.params.name as string) ?? ''} onChange={(e) => patch(it.id, { params: { ...it.params, name: e.target.value } })} />
              <input placeholder="값" value={(it.params.value as string) ?? ''} onChange={(e) => patch(it.id, { params: { ...it.params, value: e.target.value } })} />
            </>
          )}
          {it.action === 'runScript' && <textarea placeholder="Deck.next() 등" value={(it.params.code as string) ?? ''} onChange={(e) => patch(it.id, { params: { code: e.target.value } })} />}
          <button className="icon-del" onClick={() => remove(it.id)}>✕</button>
        </div>
      ))}
      <button className="full" onClick={add}>+ 인터랙션 추가</button>
    </Sec>
  );
}

function SectionDeckProps() {
  const section = useCurrentSection();
  const idx = useStore((s) => s.currentSection);
  const updateSection = useStore((s) => s.updateSection);
  const setSectionLayout = useStore((s) => s.setSectionLayout);
  const theme = useStore((s) => s.deck.theme);
  const setTheme = useStore((s) => s.setTheme);
  const canvas = useStore((s) => s.deck.canvas);
  const setCanvas = useStore((s) => s.setCanvas);
  const scripts = useStore((s) => s.deck.scripts);
  const setScripts = useStore((s) => s.setScripts);

  return (
    <>
      <Sec title="섹션">
        <label className="field"><span>레이아웃</span>
          <select value={section.layout} onChange={(e) => setSectionLayout(idx, e.target.value as Section['layout'])}>
            <option value="free">자유 배치(드래그)</option>
            <option value="center">가운데 정렬</option>
            <option value="flow">흐름(스택)</option>
            <option value="split">2단 분할</option>
            <option value="grid">그리드</option>
            <option value="fixed">고정(스케일)</option>
          </select>
        </label>
        <ColorField label="배경" value={section.background} onChange={(v) => updateSection(idx, { background: v })} allowText placeholder="#0f1220 또는 gradient" />
        <ColorField label="글자색" value={section.color ?? '#ffffff'} onChange={(v) => updateSection(idx, { color: v })} />
        <label className="field"><span>전환</span>
          <select value={section.transition} onChange={(e) => updateSection(idx, { transition: e.target.value as Section['transition'] })}>
            <option value="none">없음</option>
            <option value="fade">페이드</option>
            <option value="slide">슬라이드</option>
            <option value="zoom">확대</option>
          </select>
        </label>
        <label className="field col"><span>발표자 노트</span>
          <textarea value={section.notes} onChange={(e) => updateSection(idx, { notes: e.target.value })} />
        </label>
      </Sec>

      <Sec title="캔버스 (해상도)">
        <div className="grid2">
          <label className="field"><span>가로</span>
            <input type="number" min={320} value={canvas.w} onChange={(e) => setCanvas({ w: Math.max(320, Number(e.target.value) || 0) })} />
          </label>
          <label className="field"><span>세로</span>
            <input type="number" min={240} value={canvas.h} onChange={(e) => setCanvas({ h: Math.max(240, Number(e.target.value) || 0) })} />
          </label>
        </div>
        <div className="btn-row">
          <button onClick={() => setCanvas({ w: 1280, h: 720 })}>16:9</button>
          <button onClick={() => setCanvas({ w: 1280, h: 800 })}>16:10</button>
          <button onClick={() => setCanvas({ w: 1024, h: 768 })}>4:3</button>
          <button onClick={() => setCanvas({ w: 1080, h: 1920 })}>세로(9:16)</button>
        </div>
        <p className="hint">발표 화면의 해상도/비율입니다. 블록은 % 좌표라 비율을 바꿔도 함께 맞춰집니다.</p>
      </Sec>

      <Sec title="테마">
        <label className="field col"><span>본문 폰트</span>
          <input value={theme.fontFamily} onChange={(e) => setTheme({ fontFamily: e.target.value })} />
        </label>
        <label className="field"><span>강조색</span>
          <input type="color" value={theme.accent} onChange={(e) => setTheme({ accent: e.target.value })} />
        </label>
        <label className="field"><span>본문 칼럼 폭(흐름)</span>
          <input type="number" value={theme.maxWidth} onChange={(e) => setTheme({ maxWidth: Number(e.target.value) })} />
        </label>
      </Sec>

      <Sec title="커스텀 스크립트 (발표 모드)">
        <p className="hint">발표 시 실행. <code>Deck.goto(n)</code>, <code>Deck.next()</code>, <code>Deck.toggleBlock(id)</code>, <code>Deck.on('sectionchange', fn)</code>. ⚠ 신뢰하는 코드만.</p>
        <textarea className="script-area" value={scripts[0] ?? ''} onChange={(e) => setScripts(e.target.value ? [e.target.value] : [])} placeholder={"Deck.on('sectionchange', n => console.log(n));"} />
      </Sec>
    </>
  );
}
