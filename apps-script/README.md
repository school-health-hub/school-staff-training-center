# Apps Script

이 폴더의 `Code.gs`는 학교별 Google Sheet에 붙여 배포하는 Apps Script API입니다.

## 역할

- 학교설정 읽기/수정
- 교육목록 관리
- 교직원 명단 관리
- 교육대상 관리
- 성명 + 소속부서 기반 교직원 확인
- 현장 QR 전자서명 저장
- 이수증 파일 저장
- 내 이수현황 계산
- 관리자 서명/이수 현황 계산
- 최종 서명부 생성

## 운영 기준

- QR 출석 = 전자서명 출석입니다.
- 현장 QR 교육은 `/attendance?trainingId=...`에서 본인 확인 후 전자서명을 제출합니다.
- `05_전자서명기록`이 현장 QR 교육의 출석 및 이수 기준입니다.
- `04_QR출석기록`은 레거시/보조 로그이며 최종 이수 판정 기준이 아닙니다.
- 일반 교직원은 인증코드를 사용하지 않고 성명 + 소속부서로 확인합니다.
- 관리자 화면은 `00_학교설정`의 `adminCode`로 보호합니다.

## 주요 함수

```text
doGet(e)
doPost(e)
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
```

`saveQrAttendance()`와 `checkDuplicateAttendance()`는 과거 호환 또는 보조 로그 용도로 남아 있을 수 있습니다. 현재 GitHub Pages UI의 현장 QR 출석 흐름은 `saveBulkSignature()`를 사용해 `05_전자서명기록`에 저장합니다.

## 배포 방법

1. 학교별 허브시트 템플릿을 Google Drive에 복사합니다.
2. 복사한 Sheet에서 확장 프로그램 > Apps Script를 엽니다.
3. `Code.gs` 내용을 붙여 넣습니다.
4. Web App으로 배포합니다.
5. Web App URL을 `web/public/app-config.json`의 `appsScriptUrl`에 입력합니다.

## 개인정보 원칙

- 교직원 명단은 학교별 Google Sheet에만 저장합니다.
- 전자서명 이미지는 학교별 Google Drive 폴더에만 저장합니다.
- 이수증 파일은 학교별 Google Drive 폴더에만 저장합니다.
- Apps Script 응답에는 관리자 코드 원문을 반환하지 않습니다.
- GitHub Pages에는 민감정보를 저장하지 않습니다.
