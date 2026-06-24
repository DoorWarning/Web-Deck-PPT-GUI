# AUTHORING GUIDE — AI로 발표 덱 만들기

이 문서는 사람이 읽기 위한 것이자, **AI 에이전트(Claude 등)가 발표 덱을 생성·수정할 때
읽는 가이드**입니다. 덱은 `Deck` JSON 하나로 표현되며, 앱은 이 JSON을 `<script
id="deck-data">` 블록에서 읽어 렌더링합니다. (스키마: `src/model/schema.ts`)

## 핵심 규칙 (꼭 지킬 것)

1. **폰트를 직접 지정**한다. AI는 한글 폰트를 잘 모르므로 `theme.fontFamily`에
   `"Pretendard", system-ui, "Malgun Gothic", sans-serif`처럼 명시한다.
2. **글씨를 충분히 크게.** 본문 마크다운은 제목 `#`/`##`을 적극 사용. 발표는 멀리서 본다.
3. **다크/라이트는 의도적으로.** `section.background`와 `section.color`를 항상 함께 지정해
   대비를 확보한다. 무지성 다크모드 금지.
4. **섹션 = 발표의 한 장면.** 한 섹션에 너무 많이 넣지 말고 쪼갠다.
5. **인터랙션을 적극 활용.** 정적 텍스트만 나열하지 말고 chart/poll/playground/애니메이션을
   섞어 "웹페이지처럼" 만든다. 그게 이 도구의 존재 이유다.

## 덱 구조

```
Deck { version:2, id, title, canvas{w,h}, theme{fontFamily, accent, maxWidth}, sections[], scripts[] }
Section { id, layout, background, color, transition, blocks[], notes }
Block { id, type, props, layout, anim{reveal,step,on}, style, interactions[] }
```

- `canvas`: 발표 해상도/비율 (예: `{ "w":1280, "h":720 }`. 세로형은 `1080×1920`). 블록 좌표가 %라
  비율을 바꿔도 함께 맞춰진다.
- `layout`(섹션): **`free`(자유 배치, 기본/권장)** — 블록을 좌표로 자유 배치. 그 외 `center`(가운데),
  `flow`(세로 스택), `split`·`grid`(2단), `fixed`는 블록을 자동 정렬(이때 블록은 흐름 배치가 됨).
- 블록 배치(`layout`):
  - 기본 `position:"absolute"` + `xPct`,`yPct`(0~100, 좌상단 위치) + `widthPct`(박스 너비 %).
  - `heightPct`: 박스 높이 %(생략 시 내용 높이). `scale`: 내용 균일 확대 배율(기본 1).
  - `flow` 레이아웃 섹션에서는 `position:"flow"`로 두고 `widthPct`/`align`(`start|center|end`) 사용.
- `anim.step`: 0이면 항상 표시. 1,2,3…은 발표 중 → 키로 단계별 등장(reveal.js fragment).
- `anim.on`: `load`(진입 시) | `scroll`(스크롤로 보일 때). `anim.reveal`: `fade|rise|zoom|none`.
- 블록 폰트/색: `style.fontFamily`(CSS font-family), `style.color`, `style.fontSize`(px),
  `style.textAlign`(`left|center|right`). 미설정 시 테마 상속.
- `theme.maxWidth`는 `flow` 계열 레이아웃의 본문 칼럼 폭(자유 배치에는 영향 없음).

## 블록 타입과 props

| type | props |
|------|-------|
| `markdown` | `{ md: string }` — 마크다운. LaTeX 수식 지원: 인라인 `$x^2$`, 블록 `$$E=mc^2$$` |
| `media` | `{ kind:'image'|'video', src, alt, caption }` |
| `chart` | `{ chartType:'bar'|'line'|'pie'|'doughnut', labels:[], data:[], label, controllable:bool, min, max }` |
| `poll` | `{ question, options:[], correct:number(-1=폴, >=0=퀴즈 정답 인덱스), persist:bool }` |
| `playground` | `{ html, css, js, showEditor:bool }` — 뷰어가 코드 수정·실행 |
| `embed` | `{ url, ratio:'16/9' }` — iframe |
| `customCode` | `{ html, css, js }` — 원시 코드 주입(sandbox iframe). **차트는 Chart.js, 3D는 Three.js를 CDN으로 직접 불러와 자유 구현 가능** |

## 인터랙션

`interactions: [{ id, on:'click'|'scroll'|'step', action, params }]`
- `goto {section:n}`, `next`, `prev`, `toggleBlock {targetId}`, `openUrl {url}`,
  `setVar {name,value}`, `runScript {code}`.
- 커스텀 스크립트(`scripts[]`, runScript)는 `Deck` API 사용:
  `Deck.goto(n)`, `Deck.next()`, `Deck.prev()`, `Deck.toggleBlock(id)`,
  `Deck.setVar/getVar`, `Deck.current()`, `Deck.on('sectionchange', fn)`, `Deck.el(id)`.

## 최소 예시

```json
{
  "version": 2,
  "id": "demo",
  "title": "내 발표",
  "canvas": { "w": 1280, "h": 720 },
  "theme": { "fontFamily": "\"Pretendard\", system-ui, sans-serif", "accent": "#7c5cff", "maxWidth": 980 },
  "scripts": [],
  "sections": [
    {
      "id": "s1", "layout": "free",
      "background": "linear-gradient(135deg,#1b1f3a,#2d1b4e)", "color": "#fff",
      "transition": "fade", "notes": "",
      "blocks": [
        { "id": "b1", "type": "markdown",
          "props": { "md": "# 제목\n\n### 부제" },
          "layout": { "position": "absolute", "xPct": 12, "yPct": 34, "widthPct": 76 },
          "style": { "textAlign": "center" },
          "anim": { "reveal": "rise", "step": 0, "on": "load" },
          "interactions": [] }
      ]
    }
  ]
}
```

## AI 작업 절차 권장

1. 이 문서 + `src/model/schema.ts`를 읽는다.
2. 발표 주제를 섹션으로 나눈다(표지 → 본문 N → 정리/Q&A).
3. 섹션은 기본 `free` 레이아웃, 블록은 `position:"absolute"` + `xPct/yPct/widthPct`로 배치하고
   **인터랙션을 최소 1~2개** 넣는다.
4. 결과 JSON을 앱에서 "불러오기"로 검증하거나, `index.html`의 `deck-data`에 주입한다.
5. 토큰 절약을 위해, 큰 덱은 섹션 단위로 나눠 수정한다.

## 발표 모드 (reveal.js)

←/→/Space 이동(단계 포함) · Esc 또는 O 오버뷰 · F 전체화면 · S 발표자 뷰 · Q 편집 복귀.
