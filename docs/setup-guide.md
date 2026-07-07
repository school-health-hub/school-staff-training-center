# 설치 가이드

이 문서는 학교별로 교직원 교육센터를 복사해 사용하는 절차입니다.

## 1. 저장소 복사

1. GitHub에서 저장소를 학교 계정 또는 담당자 계정으로 복사합니다.
2. Settings > Pages에서 Source를 **GitHub Actions**로 설정합니다.
3. 저장소 이름이 바뀌어도 workflow가 `NEXT_PUBLIC_BASE_PATH=/${{ github.event.repository.name }}`를 자동 적용합니다.

## 2. 허브시트 복사

1. `template/` 폴더의 허브시트 템플릿을 학교 Google Drive로 복사합니다.
2. `00_학교설정` 탭에 학교명, 교육센터명, 담당부서, 담당자, Drive 폴더 ID, `adminCode`를 입력합니다.
3. `02_교직원명단`에 교직원 정보를 입력합니다.
4. `01_교육목록`과 `03_교육대상`은 관리자 화면에서도 관리할 수 있습니다.

## 3. Drive 폴더 준비

학교 Google Drive에 다음 폴더를 만들고 `00_학교설정`에 ID를 입력합니다.

- 전자서명 저장 폴더 ID
- 이수증 저장 폴더 ID
- 최종 서명부 저장 폴더 ID

## 4. Apps Script 배포

1. 복사한 허브시트에서 Apps Script를 엽니다.
2. `apps-script/Code.gs` 내용을 붙여 넣습니다.
3. Web App으로 배포합니다.
4. 배포 URL을 복사합니다.

## 5. app-config.json 설정

`web/public/app-config.example.json`을 참고해 `web/public/app-config.json`을 준비합니다.

```json
{
  "schoolName": "예시고등학교",
  "centerName": "학교 교직원 교육센터",
  "schoolLogo": "",
  "theme": "default",
  "appsScriptUrl": "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
}
```

공개 템플릿에는 실제 URL을 커밋하지 않습니다. 학교 운영 저장소에서만 입력합니다.

## 6. 운영 테스트

1. 홈에서 학교명과 교육목록이 표시되는지 확인합니다.
2. 관리자 코드로 관리자 화면에 들어갑니다.
3. 교육목록에서 이수방식을 `현장 QR 서명`으로 등록합니다.
4. 교육대상 관리에서 대상자를 지정합니다.
5. QR 출력 화면에서 QR을 생성합니다.
6. QR을 스캔해 `/attendance?trainingId=...`로 진입합니다.
7. 성명 + 소속부서 확인 후 전자서명을 제출합니다.
8. `05_전자서명기록`에 기록이 생기는지 확인합니다.
9. 내 이수현황과 관리자 서명/이수 현황에 이수완료가 반영되는지 확인합니다.

## 핵심 기준

- QR 출석 = 전자서명 출석
- `05_전자서명기록`이 현장 QR 교육의 출석/이수 기준
- `04_QR출석기록`은 레거시/보조 로그
- 일반 교직원은 인증코드 없이 성명 + 소속부서로 확인
- 관리자 화면은 `adminCode`로 보호
