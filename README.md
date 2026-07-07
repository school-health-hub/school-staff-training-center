# 학교 교직원 교육센터

**School Staff Training Center**는 학교에서 반복 운영하는 교직원 연수, 법정의무교육, 안전교육, 전달연수의 전자서명 출석, 이수현황, 이수증 제출, 최종 서명부를 관리하기 위한 공용 템플릿입니다.

공용 배포 구조는 **GitHub Pages + Apps Script + Google Sheet + Google Drive**입니다.

- GitHub Pages: 정적 화면 제공
- Apps Script: 학교별 Google Sheet/Drive 읽기·쓰기 API
- Google Sheet: 학교설정, 교육목록, 교직원명단, 교육대상, 전자서명기록, 이수증업로드 기록 저장
- Google Drive: 전자서명 이미지, 이수증 파일, 최종 서명부 파일 저장

## 운영 기준

- QR 출석 = 전자서명 출석입니다.
- 현장 QR 교육은 `전자서명 불필요` 방식으로 운영하지 않습니다.
- 교직원이 교육장 QR을 스캔하면 `/attendance?trainingId=...`로 진입합니다.
- 성명 + 소속부서로 본인 확인 후 바로 전자서명을 제출합니다.
- `05_전자서명기록`이 현장 교육의 출석 및 이수 기준입니다.
- `04_QR출석기록`은 레거시/보조 로그로만 취급하며 최종 이수 판정 기준으로 사용하지 않습니다.
- 일반 교직원 화면에서는 인증코드를 요구하지 않습니다.
- 관리자 화면은 `00_학교설정`의 `adminCode`로 보호합니다.

## 주요 기능

- 학교설정 불러오기
- 교육목록 불러오기
- 성명 + 소속부서 기반 교직원 확인
- 현장 QR 전자서명 출석
- 여러 교육 일괄 전자서명
- 내 이수현황 확인
- 이수증 제출
- 관리자 QR 출력
- 관리자 서명/이수 현황
- 교육목록/교육대상/교직원 명단 관리
- 최종 서명부 생성 및 다운로드

## 프로젝트 구조

```text
.
├─ docs/               # 설치, 구조, 배포, 개인정보, 시트 구조 문서
├─ apps-script/        # 학교별 Google Sheet에 붙여 배포할 Apps Script API
├─ web/                # GitHub Pages 정적 웹앱
├─ template/           # 학교별 복사용 허브시트 템플릿
├─ .github/            # GitHub Pages 자동 배포 workflow
├─ README.md
├─ CODEX.md
├─ DESIGN.md
└─ NEXT.md
```

## 학교별 복사 배포 흐름

1. 이 GitHub 저장소를 학교 또는 담당자 계정으로 복사합니다.
2. `template/`의 허브시트 템플릿을 학교 Google Drive로 복사합니다.
3. 복사한 Google Sheet의 `00_학교설정`에 학교명, 담당부서, Drive 폴더 ID, `adminCode`를 입력합니다.
4. `apps-script/Code.gs`를 복사한 Sheet의 Apps Script 프로젝트에 붙여 넣고 Web App으로 배포합니다.
5. 배포된 Apps Script Web App URL을 확인합니다.
6. `web/public/app-config.example.json`을 참고해 `web/public/app-config.json`을 학교별로 준비합니다.
7. `appsScriptUrl`에 해당 학교의 Apps Script Web App URL을 입력합니다.
8. GitHub Actions의 GitHub Pages 배포를 실행합니다.
9. 관리자 화면에서 교육목록, 교직원 명단, 교육대상을 설정합니다.
10. 관리자 QR 출력 화면에서 교육별 QR을 인쇄해 교육장에 비치합니다.

## app-config.json

`web/public/app-config.json`은 학교별 런타임 연결 설정입니다. 공개 템플릿에는 실제 Apps Script URL을 커밋하지 않습니다.

```json
{
  "schoolName": "학교명 미설정",
  "centerName": "학교 교직원 교육센터",
  "schoolLogo": "",
  "theme": "default",
  "appsScriptUrl": ""
}
```

학교에서 실제 운영할 때만 `appsScriptUrl`에 학교별 Apps Script Web App URL을 입력합니다.

```json
{
  "schoolName": "예시고등학교",
  "centerName": "학교 교직원 교육센터",
  "schoolLogo": "",
  "theme": {
    "primaryColor": "#1F2A44",
    "secondaryColor": "#EEF4FF"
  },
  "appsScriptUrl": "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
}
```

## GitHub Pages basePath

GitHub Actions는 기본적으로 저장소 이름을 기준으로 `NEXT_PUBLIC_BASE_PATH=/${{ github.event.repository.name }}`를 사용합니다.

저장소명이 `school-staff-training-center`이면 배포 URL은 다음 형식입니다.

```text
https://OWNER.github.io/school-staff-training-center/
```

다른 저장소명으로 복사해도 GitHub Actions가 basePath를 자동으로 맞춥니다. 수동으로 빌드할 때는 아래처럼 지정합니다.

```bash
cd web
NEXT_PUBLIC_BASE_PATH=/YOUR_REPOSITORY_NAME npm run build
```

Windows PowerShell에서는 다음과 같이 실행합니다.

```powershell
cd web
$env:NEXT_PUBLIC_BASE_PATH="/YOUR_REPOSITORY_NAME"
npm run build
```

## 개발 명령

```bash
cd web
npm ci
npm run lint
npm run typecheck
npm run build
```

## 개인정보 원칙

- 교직원 명단은 학교별 Google Sheet에만 저장합니다.
- 전자서명 기록과 이수증 제출 기록은 학교별 Google Sheet에만 저장합니다.
- 전자서명 이미지와 이수증 파일은 학교별 Google Drive에만 저장합니다.
- GitHub Pages에는 교직원 명단, 인증코드, 서명 이미지, 이수증 파일을 저장하지 않습니다.
- `adminCode`는 Apps Script의 검증 함수에서만 사용하고 API 응답으로 반환하지 않습니다.
- 공개 저장소에는 실제 학교 Apps Script URL, Drive 폴더 ID, 교직원 데이터, 관리자 코드를 커밋하지 않습니다.

자세한 설치 절차는 [docs/setup-guide.md](docs/setup-guide.md), 배포 절차는 [docs/deployment.md](docs/deployment.md)를 참고합니다.
