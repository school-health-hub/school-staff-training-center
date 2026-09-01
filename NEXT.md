# 다음 작업

현재 공용 배포 기준은 **GitHub Pages 정적 웹앱 + 학교별 Apps Script API + Google Sheet/Drive**입니다. Vercel은 기본 배포 방식이 아니라 추후 고급형 또는 실험형 배포로만 검토합니다.

## 현재 구현된 주요 기능

- 학교설정과 교육목록 불러오기
- 현장 QR 기반 전자서명 출석
- `/attendance?trainingId=...` 단일 교육 서명 흐름
- `/signature` 여러 교육 일괄 전자서명
- 성명 + 소속부서 기준 교직원 조회
- 교육대상 확인
- 중복 전자서명 방지
- 서명 제외 대상 처리
- 전자서명 PNG Google Drive 저장 계약
- 외부 연수 이수증 제출
- 내 이수현황 조회
- 관리자 인증
- 관리자 QR 출력
- 관리자 서명/이수 현황
- 최종 서명부 미리보기와 생성
- 교육목록, 교육대상, 교직원 명단, 학교 설정 관리

## 다음 기능 후보

이번 정비 이후 새 기능은 아래 순서로 진행합니다.

1. 필수연수 기준표 설계
2. `12_필수연수기준` 시트 계약 정의
3. 학교급, 지역, 설립유형 설정값 정리
4. 필수연수 기준표 필터링 로직 설계
5. 교육목록과 필수연수 자동 대조
6. `/required-trainings` 일반/관리자 조회 화면
7. 관리자 필수연수 점검 화면
8. `schemaVersion` 도입
9. Google Sheet migration 설계
10. 관리자 시스템 업데이트 화면
11. 서명 가능 시간 제한

## 확장 지점

- Apps Script의 `SHEETS` 상수에 `12_필수연수기준`을 추가합니다.
- header alias 유틸에 필수연수 기준표의 학교급, 지역, 설립유형, 교육구분, 주기, 필수여부 컬럼을 추가합니다.
- `web/src/lib/types.ts`에 필수연수 기준표와 점검 결과 타입을 추가합니다.
- `web/src/lib/apps-script.ts`에 필수연수 조회, 대조, migration 관련 action을 추가합니다.
- 관리자 route는 기존 `/admin/trainings`, `/admin/settings` 구조와 충돌하지 않게 `/admin/required-trainings` 또는 `/admin/system-update`로 분리합니다.

## 운영 기준

- QR 출석 = 전자서명 출석입니다.
- 현장 교육 이수 판정 기준은 `05_전자서명기록`입니다.
- `04_QR출석기록`은 레거시/보조 로그이며 필수연수 또는 이수 판정의 기준 데이터로 사용하지 않습니다.
- PWA는 아직 구현되어 있지 않습니다. manifest, service worker, 설치 프롬프트는 향후 필요할 때 별도 작업으로 진행합니다.

## 검증 기준

다음 작업 전후에는 `web` 폴더에서 아래 명령을 순차 실행합니다.

```bash
npm run lint
npm run typecheck
npm run build
```
