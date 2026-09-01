# Architecture

학교 교직원 교육센터는 **GitHub Pages + Apps Script + Google Sheet + Google Drive** 구조입니다.

## 역할 분리

- GitHub Pages
  - 정적 화면 제공
  - 학교설정, 교육목록, 출석/서명 화면, 관리자 화면 렌더링
  - 개인정보 저장 금지
- Apps Script
  - 학교별 Google Sheet와 Drive에 붙는 API
  - 교직원 확인, 교육대상 확인, 전자서명 저장, 이수증 저장, 최종 서명부 생성
  - 필요한 최소 응답만 반환
- Google Sheet
  - `00_학교설정`
  - `01_교육목록`
  - `02_교직원명단`
  - `03_교육대상`
  - `05_전자서명기록`
  - `06_이수증업로드`
  - `08_최종서명부`
  - `12_필수연수기준`
- Google Drive
  - 전자서명 이미지
  - 이수증 파일
  - 최종 서명부 파일

## 현장 QR 교육 흐름

```text
관리자 교육 등록
→ 교육대상 지정
→ 관리자 QR 출력
→ 교직원이 QR 스캔
→ /attendance?trainingId=... 진입
→ 성명 + 소속부서 확인
→ 교육대상 확인
→ 전자서명 제출
→ 05_전자서명기록 저장
→ 이수완료 처리
```

이 시스템에서 QR 출석은 전자서명 출석입니다. 별도 QR 출석 저장 단계는 주요 흐름에 없습니다.

## 이수 판정 기준

- 현장 QR 서명 교육: `05_전자서명기록`의 저장완료 기록
- 이수증 업로드 교육: `06_이수증업로드`의 제출/승인 기록
- 관리자 확인 교육: 담당자 확인 후 별도 운영 기준 적용

`04_QR출석기록`은 레거시/보조 로그로만 남겨둘 수 있으며 최종 이수 판정 기준으로 사용하지 않습니다.

## 필수연수 기준 안내

v1.1.0의 필수연수 기능은 학교 전체 기준의 **필수연수 기준표와 교육목록 등록 여부 대조**만 수행합니다. 개인별 교직원 이수 여부나 직종별 자동 대상 판정은 아직 수행하지 않습니다.

- 기준 시트: `12_필수연수기준`
- 학교 필터: `schoolLevel`, `schoolType`, `region`, 운영 연도
- 대조 대상: `01_교육목록`의 교육명
- 상태: `registered`, `missing`, `needs_review`

교육명 비교는 정규화된 exact match를 먼저 사용하고, 보수적 fuzzy match는 `needs_review`로만 표시합니다. `교육`, `연수` 같은 공통어를 무조건 제거해 다른 과정을 같은 교육으로 판단하지 않습니다.

## 관리자 보호

관리자 화면은 `00_학교설정`의 `adminCode` 값으로 보호합니다. Apps Script는 코드 일치 여부만 반환하고 `adminCode` 원문을 응답하지 않습니다.

## Apps Script API 계약

현재 GitHub Pages 웹앱이 기준으로 삼는 Apps Script action은 아래 목록입니다.

### 현재 UI 사용

- `getSchoolConfig`
- `getTrainingList`
- `getTrainingDetail`
- `createTraining`
- `updateTraining`
- `updateTrainingStatus`
- `getStaffByNameDept`
- `getStaffList`
- `createStaff`
- `updateStaff`
- `deactivateStaff`
- `verifyAdminCode`
- `getTrainingTargets`
- `updateTrainingTargets`
- `checkTrainingTarget`
- `checkSignatureExists`
- `saveSignature`
- `saveBulkSignature`
- `getMyTrainingStatusByNameDept`
- `getCertificateRequiredTrainings`
- `saveCertificateSubmission`
- `getTrainingAttendanceStatus`
- `getFinalAttendancePreview`
- `generateFinalAttendanceSheet`
- `getRequiredTrainings`
- `getSchemaStatus`
- `previewSchemaMigration`
- `runSchemaMigration`
- `validateSetup`
- `updateSchoolConfig`

### 현장 QR 전자서명 핵심 action

- `checkSignatureExists`: 교육ID + 교직원ID 기준으로 이미 저장완료된 전자서명이 있는지 확인합니다.
- `saveBulkSignature`: 단일 교육 또는 여러 교육의 전자서명을 `05_전자서명기록`에 저장합니다. 현장 QR 교육도 이 action을 통해 출석 및 이수 증빙을 남깁니다.

### 레거시/호환 action

- `checkDuplicateAttendance`
- `saveQrAttendance`

두 action은 `04_QR출석기록` 기반 과거 흐름 또는 보조 로그 호환을 위해 유지합니다. 현재 QR 출석 = 전자서명 출석 구조에서는 이 데이터를 최종 이수 판정, 필수연수 판정, 최종 서명부 생성의 기준으로 사용하지 않습니다.

### 현재 프론트 미사용 action

- `getAdminDashboardData`

Apps Script에는 남아 있지만 현재 GitHub Pages 관리자 화면의 주요 흐름에서 직접 사용하지 않습니다. 향후 대시보드 KPI를 다시 도입할 때 실제 필요 여부를 재검토합니다.

## 필수연수 확장 지점

v1.1.0은 학교 전체 기준의 필수연수 목록과 교육목록 등록 여부만 점검합니다. 다음 단계의 개인별 필수이수 판정과 관리자 자동 업데이트는 아래 위치를 확장합니다.

- Apps Script `SHEETS` 상수: 향후 `12_필수연수기준` 외 migration 이력 시트 추가 가능
- Apps Script header alias 유틸: 직종, 권한, 학교급 세부값, 지역별 기준 버전 alias 확장
- TypeScript 타입: 개인별 적용 대상, 필수연수 이수 결과, migration 실행 이력 타입 추가
- API adapter: 개인별 필수연수 판정, 기준표 업로드/검증 action 추가
- 관리자 route: `/admin/required-trainings`에 점검 결과 생성/다운로드 기능 확장
- 학교설정: `schoolLevel`, `schoolType`, `region`, `schemaVersion` 외 `requiredTrainingYear` 같은 별도 운영연도 설정 추가 가능

실제 사용자 Google Sheet의 구조 변경은 관리자 시스템 업데이트 화면에서 preview를 확인한 뒤 additive migration으로만 수행합니다.

## schemaVersion과 migration

최신 스키마 버전은 `1.1.0`입니다. `00_학교설정`에 `schemaVersion`이 없으면 `1.0.0`으로 간주합니다.

관리자 시스템 업데이트 흐름:

```text
getSchemaStatus
→ previewSchemaMigration
→ runSchemaMigration
```

모든 migration은 additive 방식입니다.

- 없는 설정 key 추가
- 없는 시트 생성
- 없는 헤더 추가
- 비어 있는 신규 기준표에만 검증된 기본 데이터 삽입
- 모든 단계 성공 후 `schemaVersion`, `schemaUpdatedAt` 갱신

금지 작업:

- 기존 시트 삭제
- 기존 행 삭제
- 기존 값 덮어쓰기
- 기존 사용자가 수정한 기준표 초기화
- 기존 교육, 교직원, 서명, 이수증 데이터 재작성

## 공개 템플릿 원칙

- 공개 저장소에는 실제 학교 URL, Drive 폴더 ID, 관리자 코드, 교직원 데이터를 커밋하지 않습니다.
- `web/public/app-config.json`은 학교별 운영 저장소에서만 실제 `appsScriptUrl`을 입력합니다.
- 템플릿 배포물은 화면과 연결 구조만 제공합니다.
