# Apps Script 설계

Apps Script는 학교별 Google Sheet에 붙어서 동작하는 API입니다. GitHub Pages는 화면만 제공하고 개인정보를 저장하지 않습니다.

## 주요 원칙

- 개인정보는 학교별 Google Sheet와 Drive에만 저장합니다.
- API 응답은 화면에 필요한 최소 정보만 반환합니다.
- 교육ID와 교직원ID를 기준으로 데이터를 연결합니다.
- 교육목록과 교직원명단은 직접 연결하지 않고 `03_교육대상`을 통해 연결합니다.
- QR 출석 = 전자서명 출석입니다.
- 현장 QR 교육의 이수 기준은 `05_전자서명기록`입니다.
- `04_QR출석기록`은 레거시/보조 로그입니다.

## 주요 함수

```text
getSchoolConfig()
updateSchoolConfig()
validateSetup()
getTrainingList()
getTrainingDetail()
createTraining()
updateTraining()
updateTrainingStatus()
getStaffByNameDept()
getStaffList()
createStaff()
updateStaff()
deactivateStaff()
verifyAdminCode()
getTrainingTargets()
updateTrainingTargets()
checkTrainingTarget()
checkSignatureExists()
saveSignature()
saveBulkSignature()
getSignatureRequiredTrainings()
getMyTrainingStatusByNameDept()
getCertificateRequiredTrainings()
saveCertificateSubmission()
getTrainingAttendanceStatus()
getFinalAttendancePreview()
generateFinalAttendanceSheet()
getRequiredTrainings()
getSchemaStatus()
previewSchemaMigration()
runSchemaMigration()
```

`saveQrAttendance()`와 `checkDuplicateAttendance()`는 호환을 위해 남아 있을 수 있으나 주요 운영 흐름에서는 사용하지 않습니다.

## 현장 QR 전자서명 흐름

1. `/attendance?trainingId=...`로 진입합니다.
2. `getTrainingDetail()`로 교육 정보를 확인합니다.
3. `getStaffByNameDept()`로 성명 + 소속부서 기반 본인 확인을 합니다.
4. `checkTrainingTarget()`으로 교육대상 여부를 확인합니다.
5. `checkSignatureExists()`로 기존 서명 기록을 확인합니다.
6. `saveBulkSignature()`로 서명 이미지를 Drive에 저장하고 교육별 기록을 `05_전자서명기록`에 남깁니다.
7. `05_전자서명기록`의 저장완료 기록을 이수완료로 봅니다.

## 내 이수현황

`getMyTrainingStatusByNameDept()`는 성명 + 소속부서로 교직원을 찾고 다음 기준으로 상태를 계산합니다.

- 현장 QR 서명 교육: `05_전자서명기록`
- 이수증 업로드 교육: `06_이수증업로드`

## 관리자 서명/이수 현황

`getTrainingAttendanceStatus()`는 `03_교육대상` 대상자 명단과 `05_전자서명기록`을 조합해 대상자 수, 서명 완료, 미서명, 이수율을 계산합니다.

## 최종 서명부

`generateFinalAttendanceSheet()`는 교육별 대상자 명단에 서명여부, 서명일시, 서명파일URL을 붙여 `08_최종서명부`에 기록합니다. Drive 폴더가 설정되어 있으면 최종 서명부 파일을 생성하고 `01_교육목록`의 `서명부파일ID`, `서명부파일URL`에 반영합니다.

## 이수증 제출

`saveCertificateSubmission()`은 이수증 파일을 지정 Drive 폴더에 저장하고 `06_이수증업로드`에 제출 기록을 남깁니다.

## 필수연수 안내

`getRequiredTrainings()`는 `00_학교설정`, `01_교육목록`, `12_필수연수기준`을 읽어 학교 전체 기준의 필수연수 등록 현황을 반환합니다. 개인별 대상자나 개인별 미이수 여부는 v1.1.0 범위에 포함하지 않습니다.

필터 기준:

- 적용연도: 학교 설정의 운영 연도를 우선 사용합니다.
- 지역: 학교 설정과 같거나 기준표 값이 `전체`이면 포함합니다.
- 학교급: `고등학교`는 `고등학교`, `중등`, `초·중등`, `전체` 기준과 호환됩니다.
- 설립유형: 학교 설정과 같거나 기준표 값이 `전체`이면 포함합니다.
- 사용여부: `미사용`은 제외합니다.

교육목록 대조는 필수연수 기준의 `연수명`과 `01_교육목록`의 `교육명`을 비교합니다. 정확히 정규화 일치하면 `registered`, 보수적으로 유사하지만 확정하기 어려우면 `needs_review`, 매칭이 없으면 `missing`으로 반환합니다.

## schemaVersion과 migration

최신 스키마 버전은 `1.1.0`입니다. `00_학교설정`에 `schemaVersion`이 없으면 `1.0.0`으로 간주합니다.

관리자 시스템 업데이트 action:

```text
getSchemaStatus()
previewSchemaMigration()
runSchemaMigration()
```

`runSchemaMigration()`은 버전별 migration 함수를 순차 실행합니다. v1.1.0에서는 없는 설정 key와 없는 헤더, 없는 `12_필수연수기준` 시트만 추가합니다.

additive migration 원칙:

- 기존 시트, 행, 값은 삭제하거나 덮어쓰지 않습니다.
- 일부 설정 key가 이미 있으면 기존 값을 보존합니다.
- `12_필수연수기준`에 사용자 데이터가 있으면 기본 데이터를 삽입하지 않습니다.
- 현재 저장소에는 검증된 21개 필수연수 기준 행 원본이 포함되어 있지 않으므로 migration은 기본적으로 시트와 헤더만 준비합니다.
- 모든 단계가 성공한 뒤에만 `schemaVersion`과 `schemaUpdatedAt`을 갱신합니다.
