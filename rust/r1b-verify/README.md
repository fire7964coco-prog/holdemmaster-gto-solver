# R1b 엔진 검증 도구

이 도구는 서버 업로드 묶음에 들어가지 않는다. `prepare.py`가 현재 생산 엔진을 측정 폴더에 복사하고, Git `2845be3`의 `expected_values_detail` 본문을 이름만 바꿔 추가한다. 생산 엔진의 기존 메서드와 R1 메서드 본문이 다르면 준비 단계에서 실패한다. 같은 풀이의 같은 노드에서 두 메서드의 반환 `f32` 바이트를 비교하므로 별도 풀이의 편차를 섞지 않는다.

프로젝트 루트의 PowerShell에서:

```powershell
python solver/rust/r1b-verify/prepare.py
$env:CARGO_TARGET_DIR='C:\Temp\wpf-target'
cargo build --release --offline --manifest-path solver/rust/r1b-verify/Cargo.toml
$env:RAYON_NUM_THREADS='12'
& 'C:\Temp\wpf-target\release\r1b-verify.exe' Ah7d2c '참고자료/측정_R1b_2026-09-29/btn-v2'
& 'C:\Temp\wpf-target\release\r1b-verify.exe' Ad7c2c '참고자료/측정_R1b_2026-09-29/btn-v2'
& 'C:\Temp\wpf-target\release\r1b-verify.exe' Ac7c2c '참고자료/측정_R1b_2026-09-29/btn-v2'
```

로그와 native 종료 코드를 함께 남길 때는 각 실행을 `python solver/rust/r1b-verify/run.py Ah7d2c`처럼 실행한다. PowerShell 5의 `2>&1`은 진행 상황용 stderr를 `NativeCommandError`로 바꾸므로 shell 종료 코드만으로 native 프로세스 상태를 판단하지 않는다. 이번 최초 Ah7d2c/Ad7c2c 실행은 그 shell 코드가 1이며 native 종료 코드는 별도 기록하지 않았다. 두 JSON의 모든 검증 조건이 충족되고 로그에 panic이 없지만 native 코드 0을 측정했다고 주장하지 않는다. Ac7c2c부터 Python runner가 native 종료 코드를 기록한다.

`precompute3`의 상황 표, 트리 생성, 순회, 파일 writer를 `include!`로 그대로 사용한다. BTN 세 플랍을 목표 오차 1%, 최대 1,000회, 비압축으로 푼다. `.bin`은 실제 v2 파일이며 `.json`은 검증 결과, `.legacy.bin`과 `.baseline.bin`은 비교한 반환 바이트다. 반복 실행 시 이 전용 측정 출력만 덮어쓴다.

## 독립 EV 평가의 범위

`reevaluate`는 `cfvalues*`, `expected_values*`, `normalized_weights`를 읽지 않는다. 양쪽의 확정된 평균 전략을 직접 정규화하여 전체 행동 트리를 다시 순회한다. 상대 도달 비중과 합계는 f64로 계산한다. 자기 노드에서는 모든 액션의 가치를 계산하고 자기 정책으로 합산하며, 상대 노드에서는 상대 정책을 도달 비중에 곱한다. 플랍 모든 결정 노드의 모든 액션을 기록한 뒤 상대 호환 비중을 직접 핸드 쌍 전수 합산하여 EV를 만든다. Fold를 제외한 own-zero 액션을 전수 비교하고, own-positive 액션도 같은 방법으로 비교하여 방법의 수치 오차를 함께 보고한다.

정책 자체는 엔진이 사용한 f32 정규화 결과를 재현하고, 값과 도달 누적만 f64로 수행한다. terminal payoff `Game::evaluate`와 suit isomorphism 메타데이터는 엔진과 공유한다. 따라서 **terminal 족보 평가와 suit isomorphism 구현 자체의 독립적인 재증명은 하지 않는다.** production 규모 검증은 비압축 BTN 플랍 세 개이며, 모든 보드·상황·압축 경로를 증명하지 않는다. bunching과 node locking은 이 evaluator의 지원 대상이 아니다. R1b API도 bunching에서 명시적으로 실패한다.

독립 오차 허용 기준은 0.01칩이다(저장 단위 0.1칩의 1/10). 결과에는 전체 표본 수, 최대/중앙 오차, 최대 위치, i16 차이 수를 남긴다. 저장 반올림 경계에서는 아주 작은 수치 차이로 i16 하나가 달라질 수 있으므로 독립 i16 차이는 오차 수치와 함께 해석한다. 기존/신규 API가 모두 정의된 own-positive 구간은 엄격하게 동일하며 i16 차이 0을 assert한다.

API 비용은 동일 풀이의 모든 플랍 결정 노드에서 기존/신규 API 호출 순서를 번갈아 20회 반복해 측정한다. 이는 solve loop와 분리한 추출 비용이다. producer의 `seconds`에는 finalize와 EV 추출이 포함되지 않는다.

## 정의 불가·진짜 0·완성된 보드의 독립 산술 검사

```powershell
$env:CARGO_TARGET_DIR='C:\Temp\wpf-target'
$env:CARGO_PROFILE_RELEASE_LTO='fat'
$env:CARGO_PROFILE_RELEASE_CODEGEN_UNITS='1'
cargo test --release --offline --no-default-features --features rayon --manifest-path solver/rust/postflop-solver/Cargo.toml --test counterfactual_ev
```

현재 Windows GNU 환경에서는 기본 test release profile의 linker가 한글 rustup 경로를 읽지 못했다. 생산 도구와 같은 fat LTO 설정으로 링크와 테스트가 통과한다. 네 테스트는 own-zero의 알려진 리버 산술 EV 30(압축/비압축), 상대 도달 전량 0, 카드 제거로 상대 호환 비중 0, 새로 깔린 턴 카드와 핸드 중복을 확인한다. 합법적인 Fold EV 0은 finite이고 정의 불가의 모든 액션은 NaN임을 확인한다.
