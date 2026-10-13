# Design System: Heart Pick (Minimal Mobile Web App)

## 1. Color Palette

디자이너 분께서 요청해주신 **크림 베이지 배경 + 웜그레이 카드 + 레드 포인트**를 베이스로 설계된 세련되고 절제된 컬러 팔레트입니다.

| Token Name | Hex Code | Usage | Preview / Description |
| :--- | :--- | :--- | :--- |
| `--color-bg-base` | `#F9F6F0` | 화면 전체 배경 | 부드럽고 따뜻한 소프트 크림 베이지 |
| `--color-bg-surface` | `#FFFFFF` | 모달, 팝업, 카드 선택기 컨테이너 | 깔끔한 서피스 화이트 |
| `--color-card-base` | `#D8D2C9` | 기본 카드 배경 | 차분하고 부드러운 웜그레이 |
| `--color-card-hover` | `#CEBFB5` | 카드 호버/액티브 터치 | 웜그레이 틴트 (살짝 짙어지는 피드백) |
| `--color-accent-heart` | `#FF4B55` | 하트 아이콘, 주요 승리 효과 | 감각적이고 선명한 비비드 레드 |
| `--color-text-main` | `#2D2A26` | 메인 헤드라인, 핵심 텍스트 | 다크 웜 챠콜 (완전한 블랙보다 부드러움) |
| `--color-text-sub` | `#827C75` | 턴 표시, 서브 텍스트, 비활성 텍스트 | 뮤티드 웜그레이 |
| `--color-border-subtle` | `#EBE5DC` | 미세한 디바이더, 테두리 | 은은한 베이지 그레이 라인 |

---

## 2. Typography

모바일 웹앱 환경에서 가독성이 좋고 깔끔한 네오 그로테스크 / 고딕 폰트 스택을 사용합니다.
- **Font Family**: `-apple-system, BlinkMacSystemFont, "Pretendard", "SUIT", "Noto Sans KR", sans-serif`

| Scale Token | Font Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `display` | `28px` (`1.75rem`) | `1.3` | `700` (Bold) | 홈 메인 타이틀, 승리 팝업 헤더 |
| `headline` | `20px` (`1.25rem`) | `1.4` | `600` (SemiBold) | 턴 인디케이터 (`Player 1's Turn`), 모달 제목 |
| `body` | `15px` (`0.9375rem`) | `1.5` | `500` (Medium) | 모드 선택 버튼, 설명 텍스트, 안내문 |
| `caption` | `13px` (`0.8125rem`) | `1.4` | `400` (Regular) | 보조 설명, 하단 저작권/버전 |

---

## 3. Shapes & Radius (라운드값)

모바일에서 손가락 터치 시 부드럽고 친근한 인상을 주는 곡률 시스템입니다.

- `--radius-card`: `14px` (5x5 및 4x4 정사각형 카드의 둥근 모서리)
- `--radius-card-sm`: `10px` (좁은 모바일 화면의 5x5 그리드 카드용)
- `--radius-btn`: `16px` (CTA 버튼, 모드 선택 pill 버튼)
- `--radius-modal`: `24px` (하트 당첨 결과 모달 창)

---

## 4. Spacing & Grid System

- **Base Unit**: `4px`
- **모바일 뷰포트 기준**: 최대 가로폭 `420px` (아이폰/갤럭시 기본 모바일 너비에 최적화된 Centered Container)
- **카드 그리드 레이아웃**:
  - `4x4 Mode`: 그리드 갭 `10px`, 카드 크기 유동적 정사각형(`aspect-ratio: 1 / 1`)
  - `5x5 Mode`: 그리드 갭 `8px`, 카드 크기 유동적 정사각형(`aspect-ratio: 1 / 1`)
- **컨테이너 패딩**: 좌우 `24px`, 상하 세이프존 고려 (`env(safe-area-inset-*)`)

---

## 5. Shadows & Elevation

플랫하면서도 살짝 떠 있는 듯한 고급스러운 깊이감:
- `--shadow-card`: `0 3px 8px rgba(92, 85, 78, 0.08)` (카드 평상시)
- `--shadow-card-active`: `0 1px 3px rgba(92, 85, 78, 0.12)` (터치 시 살짝 가라앉음)
- `--shadow-modal`: `0 16px 40px rgba(70, 60, 50, 0.14)` (결과 팝업)

---

## 6. Motion & Interaction Tokens

- **카드 소멸 (Fade-out & Scale-down)**:
  - `transition: transform 0.28s cubic-bezier(0.2, 0, 0, 1), opacity 0.28s ease-out;`
  - `transform: scale(0.75); opacity: 0; pointer-events: none;`
- **하트 등장 (Pop & Pulse)**:
  - `animation: heartPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;`
  - 살짝 1.15배 튀어올랐다가 제자리로 오며 잔잔한 바운스
- **턴 전환 (Turn Indicator)**:
  - 부드러운 텍스트 크로스페이드 (`0.2s ease`)
