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
