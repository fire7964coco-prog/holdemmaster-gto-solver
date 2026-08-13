# 홀덤마스터 GTO 솔버 (Holdemmaster GTO Solver)

**▶ 바로 사용하기: https://solver.holdemmaster.com**
**📖 소개·사용법·전략 가이드: https://www.holdemmaster.com/solver**

[홀덤마스터](https://www.holdemmaster.com) 커뮤니티가 제공하는 **무료 브라우저 GTO 솔버**입니다.
설치 없이 웹 브라우저에서 텍사스 홀덤 포스트플랍 전략을 계산합니다. 모바일도 지원합니다.

이 프로젝트는 [WASM Postflop](https://github.com/b-inary/wasm-postflop) (Copyright © Wataru Inariba, AGPL-3.0)의 포크이며,
동일하게 **AGPL-3.0-or-later** 라이선스로 공개됩니다. 전체 라이선스 전문은 [LICENSE](LICENSE)를 참조하세요.

## 원본 대비 수정 사항
- UI 전체 한국어화 (포커 용어는 한국 홀덤 커뮤니티 음차 관행 적용)
- 다크 테마 및 결과 화면 재구성 (핸드/드로우 분류 패널, 액션 빈도 타일)
- 교육 프리셋 13종 + 사전 계산 결과 미리보기 (원클릭 열람)
- GTO 트레이너: 후속 결정 노드 퀴즈, 혼합 빈도·액션 EV·EV 손실 피드백,
  핸드 메이드/드로우 분류 표시, 연속 정답·상황별 약점 분석,
  기기 내 학습 기록/복습(로그인·서버 불필요)
- 교육 프리셋의 팟·스택·벳·EV를 bb 단위로 일관되게 표시
- 모바일 반응형 UI, 사용법 가이드 페이지
- 엔진(postflop-solver) 버그 수정: 16비트 정수 모드의 float→int 변환 트랩으로
  워커가 전멸해 계산이 멈추던 문제 (`rust/postflop-solver/src/utility.rs`, vendored)
- 빌드 도구 현행화: webpack 5.109, wasm-bindgen 0.2.126 (최신 Rust nightly 호환)
- Vercel 배포 설정(`vercel.json`) 추가 (COOP/COEP 헤더 — SharedArrayBuffer/멀티스레드용)

## 빌드 방법 (Windows)
필요: Node.js, Rust nightly (`rustup`, wasm32 타겟 + rust-src), wasm-pack

```powershell
# 한글 사용자 경로 환경에서는 ASCII 경로 환경변수가 필수
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
$env:CARGO_TARGET_DIR = "C:\Temp\wpf-target"
$env:WASM_PACK_CACHE = "C:\Temp\wasm-pack-cache"

npm install
npm run wasm    # Rust → WebAssembly (4개 모듈)
npm run build   # webpack → dist/
npm run serve   # http://localhost:8080 (COOP/COEP 헤더 포함)
```

배포는 `dist/`를 정적 호스팅(Vercel/Cloudflare Pages)에 올리면 됩니다.
멀티스레드가 동작하려면 응답 헤더에 `Cross-Origin-Opener-Policy: same-origin`과
`Cross-Origin-Embedder-Policy: require-corp`가 반드시 포함되어야 합니다
(Cloudflare Pages는 `public/_headers`, Vercel은 `vercel.json`이 처리).

## 크레딧
- 원저작자: [Wataru Inariba (b-inary)](https://github.com/b-inary) — 솔버 엔진([postflop-solver](https://github.com/b-inary/postflop-solver)) 및 원본 UI
- 한국어화·수정: 홀덤마스터 커뮤니티

이 프로그램은 무료 소프트웨어이며, 어떠한 보증도 없이 제공됩니다.
