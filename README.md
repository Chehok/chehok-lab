# Chehok Lab

개인 웹 앱을 모아 두는 **Chehok Lab** 디렉터리입니다.  
배포 주소: [https://chehok.github.io/chehok-lab/](https://chehok.github.io/chehok-lab/)

## 로컬에서 실행

```bash
npm ci
npm run dev
```

브라우저에서 Vite가 안내하는 주소(기본 `http://localhost:5173/chehok-lab/`)로 접속합니다.

## 앱 추가·수정 방법

모든 앱 정보는 **한 파일**, [`data/apps.json`](data/apps.json)에만 있습니다. 화면은 이 파일을 순서대로 그려서 만들어지므로, 새 앱은 항목 하나를 추가하면 끝입니다. (검색·분류 필터는 없고 모든 앱이 목록으로 보입니다.)

| 필드 | 설명 |
|------|------|
| `id` | 영문 슬러그(고유, 가급적 바꾸지 않기) |
| `name` | 목록에 보이는 이름 |
| `description` | 설명 (길이 제한 없음, 화면 너비에 맞춰 자연스럽게 줄바꿈) |
| `url` | 배포된 앱의 전체 `https://` 주소 |
| `category` | 데스크톱 목록 오른쪽에 보이는 분류 라벨 |
| `icon` | `public/` 기준 상대 경로. 없으면 `null` |
| `badge` | (선택) `icon`이 `null`일 때 아이콘 자리에 쓰는 짧은 글자 |

### 아이콘

1. 그 앱 사이트에 이미 있는 **홈 화면 아이콘 원본**만 받아 `public/icons/<id>/`에 그대로 저장합니다. 다시 그리거나 가공하지 않습니다.
2. `icon`에 `"icons/<id>/icon-512.png"`처럼 적습니다.
3. 원본 아이콘이 없는 앱은 `icon: null`과 `badge`를 쓰면 글자 배지로 표시됩니다.

## 파비콘·공유 썸네일

- 허브 파비콘 원본: `public/favicon.svg`. 이를 바꾸거나 앱 목록(앞 5개 아이콘)이 바뀌면 `npm run brand`로 PNG/ICO 파비콘과 1200×630 공유 이미지(`public/og-chehok-lab-v1.png`)를 다시 만듭니다. (Playwright 크롬과 `scripts/og/fonts`의 Pretendard 글꼴 사용)
- 공유 이미지는 각 앱의 원본 아이콘을 그대로 배치합니다.
- 메타 태그(Open Graph/Twitter)는 `index.html`에 정적으로 들어 있습니다. 이미지를 바꿔 새 주소가 필요하면 `scripts/build-brand.mjs`의 `OG_FILE`과 `index.html`의 파일명(`-v1`)을 함께 올리세요. 이미 전송된 메신저 미리보기는 각 서비스의 캐시 정책에 따라 달라질 수 있습니다.

### 검증

```bash
npm run validate   # URL·아이콘 파일·금지 URL
npm test           # 데이터·메타데이터·파비콘 단위 테스트
npm run build      # GitHub Pages용 빌드 (base: /chehok-lab/)
npm run test:e2e   # 링크·경로·반응형(320~1440px) 점검과 스크린샷
```

## 배포

`main` 브랜치에 머지되면 [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)이 테스트·빌드 후 GitHub Pages에 올립니다.  
저장소 **Settings → Pages → Build and deployment → Source: GitHub Actions** 가 켜져 있어야 합니다.

Pull Request에서는 [`.github/workflows/ci.yml`](.github/workflows/ci.yml)만 실행되며, 배포는 하지 않습니다.

## 기술 스택

- Vite 정적 빌드 (`base: /chehok-lab/`)
- 바닐라 JS + CSS (모바일 우선, 정적 렌더링)
- Vitest · Playwright (CI 게이트)
