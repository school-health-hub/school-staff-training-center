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

## 향후 필수연수 확장 지점

필수연수 기능은 아직 구현하지 않습니다. 다음 작업에서 아래 위치를 확장합니다.

- Apps Script `SHEETS` 상수: `12_필수연수기준` 추가
- Apps Script header alias 유틸: 학교급, 지역, 설립유형, 교육구분, 주기, 필수여부 컬럼 추가
- TypeScript 타입: 필수연수 기준표, 필터 조건, 점검 결과 타입 추가
- API adapter: 필수연수 조회, 교육목록 대조, migration 관련 action 추가
- 관리자 route: `/admin/required-trainings`, `/admin/system-update` 등 기존 route와 분리
- 학교설정: `schoolLevel`, `schoolType`, `region`, `schemaVersion` 확장

실제 Google Sheet 생성, 컬럼 추가, migration 실행은 별도 작업에서 관리자 동의와 검증 절차를 거친 뒤 진행합니다.

## 공개 템플릿 원칙

- 공개 저장소에는 실제 학교 URL, Drive 폴더 ID, 관리자 코드, 교직원 데이터를 커밋하지 않습니다.
- `web/public/app-config.json`은 학교별 운영 저장소에서만 실제 `appsScriptUrl`을 입력합니다.
- 템플릿 배포물은 화면과 연결 구조만 제공합니다.
