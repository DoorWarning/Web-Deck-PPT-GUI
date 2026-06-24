import { useEffect, useState } from 'react';
import authoringMd from '../../AUTHORING.md?raw';
import { deckSchema } from '../model/schema';

function download(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// AI prompt template the user can copy and paste to Claude/another agent.
const AI_PROMPT = `너는 "WebDeck" 인터랙티브 발표 덱을 만드는 도우미야.
아래 규칙에 맞춰 **Deck JSON(version 2) 하나만** 출력해줘. 설명·코드펜스 없이 JSON만.

[구조]
Deck { version:2, id, title, canvas:{w,h}, theme:{fontFamily, accent, maxWidth}, sections:[], scripts:[] }
Section { id, layout:"free", background, color, transition:"none|fade|slide|zoom", blocks:[], notes }
Block { id, type, props, layout, anim, style, interactions:[] }

[블록 type 과 props]
- markdown   { md }   // 마크다운. LaTeX 수식: 인라인 $x^2$, 블록 $$E=mc^2$$
- media      { kind:"image|video", src, alt, caption }
- chart      { chartType:"bar|line|pie|doughnut", labels:[], data:[], label, controllable:true, min, max }
- poll       { question, options:[], correct:-1, persist:false }   // correct>=0 이면 퀴즈
- playground { html, css, js, showEditor:true }       // 뷰어가 코드 수정·실행
- embed      { url, ratio:"16/9" }
- customCode { html, css, js }                         // Chart.js/Three.js CDN 자유

[배치/스타일]
- canvas: 기본 {w:1280,h:720}. 세로형이면 {w:1080,h:1920}.
- 섹션은 layout:"free", 블록은 layout:{ position:"absolute", xPct, yPct, widthPct } (모두 0~100 %, 좌상단 기준)
- 선택: layout.heightPct(박스 높이), layout.scale(내용 배율)
- anim:{ reveal:"fade|rise|zoom|none", step(0=항상, 1·2…=단계 등장), on:"load|scroll" }
- style:{ fontFamily, color, fontSize, textAlign:"left|center|right" }

[규칙]
1) theme.fontFamily 를 반드시 명시: "\\"Pretendard\\", system-ui, sans-serif"
2) 글씨는 크게(제목 #/##), 배경(background)과 글자색(color)을 함께 지정해 대비 확보.
3) 블록은 겹치지 않게 xPct/yPct/widthPct로 배치(표지 제목은 가운데 정렬 권장).
4) 정적 나열 금지 — chart/poll/playground/애니메이션 같은 인터랙션을 최소 1~2개 넣어라.
5) 표지 → 본문 N개 → 정리/Q&A 흐름으로 섹션을 나눠라.
6) 모든 id 는 짧은 영숫자 문자열.

[발표 주제]
<<< 여기에 발표 주제와 분량(섹션 수)을 적어주세요 >>>`;

export function HelpModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copyPrompt = async () => {
    try { await navigator.clipboard.writeText(AI_PROMPT); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { /* clipboard blocked */ }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>도움말 — WebDeck 사용법</h2>
          <button className="modal-x" onClick={onClose} title="닫기 (Esc)">✕</button>
        </div>

        <div className="modal-body">
          <section>
            <h3>1. 기본 사용법</h3>
            <ul>
              <li><b>왼쪽</b>: 위에서 <b>섹션</b>(발표의 한 장면)을 추가·드래그로 순서 변경. 아래 <b>블록 팔레트</b>로 블록 추가.</li>
              <li><b>가운데</b>: 라이브 미리보기. 블록을 클릭하면 선택됩니다. <b>반응형</b>이라 창을 줄이면 모바일 레이아웃을 확인할 수 있어요.</li>
              <li><b>오른쪽 인스펙터</b>: 선택한 블록의 <b>내용 / 레이아웃·위치 / 폰트·스타일 / 등장 효과 / 인터랙션</b>을 설정. 빈 곳을 클릭하면 <b>섹션·테마·스크립트</b> 설정이 보입니다.</li>
            </ul>
          </section>

          <section>
            <h3>2. 블록 배치 · 크기 · 정렬</h3>
            <ul>
              <li><b>드래그 이동</b>: 블록을 아무 데나 잡아 끌어 옮깁니다. 가운데/가장자리에 <b>스냅 + 가이드 선</b>이 뜨고, 인스펙터 <code>정렬</code> 버튼으로 정확히 맞춥니다.</li>
              <li><b>크기 조절</b>: 선택하면 8개 핸들이 보입니다. <b>코너(대각선)</b> = 내용까지 비율 유지하며 확대/축소, <b>좌/우 변</b> = 폭만(텍스트 줄바꿈), <b>상/하 변</b> = 높이만. 중심 기준으로 조절됩니다.</li>
              <li><b>텍스트 정렬</b>: 폰트/스타일의 <code>텍스트 정렬</code>로 블록 <b>안의 텍스트</b>를 좌/중앙/우 정렬.</li>
              <li><b>폰트·수식</b>: 블록마다 글꼴·색·크기를 지정. 마크다운에서 <code>$x^2$</code>·<code>$$…$$</code> LaTeX 수식 사용 가능.</li>
              <li><b>레이아웃</b>: 섹션은 기본 <b>자유 배치</b>. <code>가운데/흐름/2단</code> 등으로 바꾸면 기존 블록도 자동 정렬됩니다.</li>
            </ul>
          </section>

          <section>
            <h3>3. 인터랙션 & 발표 (reveal.js)</h3>
            <ul>
              <li>블록에 <b>인터랙션</b>(클릭 시 → 섹션 이동·블록 토글·URL·스크립트)을 달 수 있어요.</li>
              <li><b>등장 효과</b>의 <code>단계(fragment)</code>로 한 섹션 안에서 단계별로 나타나게 할 수 있습니다.</li>
              <li><b>▶ 발표</b>: <kbd>→</kbd>/<kbd>Space</kbd> 다음, <kbd>←</kbd> 이전, <kbd>Esc</kbd>/<kbd>O</kbd> 오버뷰, <kbd>F</kbd> 전체화면, <kbd>S</kbd> 발표자 뷰, <kbd>Q</kbd> 편집 복귀.</li>
              <li><b>차트 슬라이더·폴/퀴즈·플레이그라운드</b>는 발표 중 보는 사람이 직접 조작할 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h3>4. 캔버스 · 저장 · 배포</h3>
            <ul>
              <li><b>캔버스(해상도)</b>: 빈 곳을 클릭하면 인스펙터에서 발표 화면 비율(가로×세로)을 바꿀 수 있어요(16:9, 4:3, 세로형 등).</li>
              <li><b>JSON 저장 / 불러오기</b>: 덱을 파일로 주고받기.</li>
              <li><b>💾 HTML</b>: 에디터가 내장된 <b>편집 가능한 단일 HTML</b> 다운로드(받은 사람이 다시 열어 편집).</li>
              <li>빌드한 <code>dist/index.html</code>을 그대로 호스팅하면 배포 완료. 링크에 <code>?present</code>를 붙이면 발표 모드로 바로 시작.</li>
            </ul>
          </section>

          <section>
            <h3>5. AI로 발표 만들기 ✨</h3>
            <p className="modal-note">아래 프롬프트를 복사해 Claude 등 AI에게 주고, 마지막 줄에 <b>발표 주제</b>를 적으세요. AI가 만든 <b>Deck JSON</b>을 받아 툴바의 <b>불러오기</b>로 적용하면 됩니다.</p>
            <div className="prompt-box">
              <button className="prompt-copy" onClick={copyPrompt}>{copied ? '복사됨 ✓' : '프롬프트 복사'}</button>
              <pre>{AI_PROMPT}</pre>
            </div>
            <p className="modal-note">프로젝트의 <code>AUTHORING.md</code> 와 <code>src/model/schema.ts</code>(JSON Schema)를 함께 주면 더 정확합니다. 아래 버튼으로 내려받아 AI에게 첨부하세요.</p>
            <div className="modal-downloads">
              <button onClick={() => download('AUTHORING.md', authoringMd, 'text/markdown')}>⬇ AUTHORING.md</button>
              <button onClick={() => download('deck.schema.json', JSON.stringify(deckSchema, null, 2), 'application/json')}>⬇ JSON Schema</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
