# Chehok Lab

개인 웹 앱을 모아 두는 **Chehok Lab** 디렉터리입니다.  
배포 주소: [https://chehok.github.io/chehok-lab/](https://chehok.github.io/chehok-lab/)

## 로컬에서 실행

```bash
npm ci
npm run dev
```

브라우저에서 Vite가 안내하는 주소(기본 `http://localhost:5173/chehok-lab/`)로 접속합니다.

## 앱 목록 추가·수정 방법

모든 앱 정보는 **한 파일**에만 있습니다: [`data/apps.json`](data/apps.json)

각 항목 필드:

| 필드 | 설명 |
|------|------|
| `id` | 영문 슬러그(고유, 변경 최소화) |
| `name` | 카드에 보이는 이름 |
| `description` | 한 줄 설명 |
| `url` | 배포된 앱의 전체 URL (`https://` …) |
| `category` | 필터 칩에 쓰는 분류(한글 가능) |
| `tags` | 검색용 키워드 배열 |
| `icon` | `public/` 기준 상대 경로. 아이콘이 없으면 `null`(텍스트 배지) |

### 아이콘을 쓸 때

1. 해당 앱 사이트에 이미 있는 **홈 화면용 아이콘 원본**만 사용합니다(디자인·가공 금지).
2. 파일을 `public/icons/<id>/` 아래에 저장합니다.
3. `apps.json`의 `icon`을 예: `"icons/guitar-mate/icon-512.png"` 처럼 적습니다.

아이콘이 HTML/manifest에 없는 앱(예: 맞춤법 검사기)은 `icon: null`로 두면 UI가 **글자 배지**를 표시합니다. 임의 PNG를 만들지 마세요.

### 검증

```bash
npm run validate   # URL·아이콘 파일·금지 URL 등
npm test           # 데이터 단위 테스트
npm run build      # GitHub Pages용 빌드 (base: /chehok-lab/)
npm run test:e2e   # 검색/필터/링크·반응형 스크린샷
```

## 배포

`main` 브랜치에 머지되면 [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)이 테스트·빌드 후 GitHub Pages에 올립니다.  
저장소 **Settings → Pages → Build and deployment → Source: GitHub Actions** 가 켜져 있어야 합니다.

Pull Request에서는 [`.github/workflows/ci.yml`](.github/workflows/ci.yml)만 실행되며, 배포는 하지 않습니다.

## 기술 스택

- Vite 정적 빌드 (`base: /chehok-lab/`)
- 바닐라 JS + CSS (모바일 우선)
- Vitest · Playwright (CI 게이트)
