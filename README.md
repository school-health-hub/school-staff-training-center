# School Health Hub - 교직원 교육센터

> 학교에서 바로 사용할 수 있는 Google Workspace 기반 교직원 교육 관리 시스템

QR 출석부터 전자서명, 이수증 제출, 이수현황 조회까지 하나의 워크플로우로 관리할 수 있습니다.

이 저장소는 특정 학교 전용 앱이 아니라, 학교별로 복사해 사용할 수 있는 공개 템플릿입니다. 실제 운영 전에는 학교별 Google Sheet, Apps Script, `app-config.json` 설정이 필요합니다.

## 주요 기능

- 교육목록 관리
- 현장 QR 기반 전자서명 출석
- 교육 전자서명
- 외부 연수 이수증 제출
- 개인 이수현황 조회
- 관리자 교육 운영 및 최종 서명부 생성
- Google Sheets + Google Drive 기반 운영
- 개인정보는 학교 Google Workspace에서 관리

## 시스템 구성

```text
Google Sheets
→ Apps Script Web App
→ GitHub Pages
→ 교직원 교육센터
```

GitHub Pages는 정적 화면만 제공하고, 데이터 읽기·쓰기와 파일 저장은 학교별 Apps Script, Google Sheets, Google Drive가 담당합니다.

## 교육 진행 흐름

1. 관리자가 교육 등록
2. 교육 대상 지정
3. QR 생성 및 출력
4. 교직원이 QR 스캔
5. 성명·소속 확인
6. 전자서명
7. Google Sheets 저장
8. 이수 완료
9. 관리자 최종 서명부 생성

## 템플릿 사용 방법

1. Use this template로 저장소 생성
2. Google Sheet 템플릿 복사
3. Apps Script 복사 및 웹앱 배포
4. `app-config.json`에 Apps Script URL 입력
5. GitHub Pages 활성화
6. 학교별 교직원 교육센터 완성

공개 저장소에는 실제 학교 Apps Script URL, Drive 폴더 ID, 교직원 데이터, 관리자 코드를 커밋하지 마세요. 학교별 운영 정보는 복사한 학교 저장소와 학교 Google Workspace에서만 관리합니다.

## 기술 스택

- Next.js
- TypeScript
- GitHub Pages
- Google Apps Script
- Google Sheets
- Google Drive

## 특징

- 서버 구축 없이 운영 가능
- 학교별 독립 운영
- 개인정보는 학교 Google 계정 내 저장
- 공개 템플릿 기반으로 손쉽게 배포
- QR 출석 = 전자서명 = 이수 처리의 단일 워크플로우

## 운영 기준

- QR 출석 = 전자서명 출석입니다.
- 현장 QR 교육은 전자서명 출석으로 운영합니다.
- 교직원이 교육장 QR을 스캔하면 `/attendance?trainingId=...`로 진입합니다.
- 성명 + 소속부서로 본인 확인 후 바로 전자서명을 제출합니다.
- `05_전자서명기록`이 현장 교육의 출석 및 이수 기준입니다.
- `04_QR출석기록`은 레거시/보조 로그로만 취급하며 최종 이수 판정 기준으로 사용하지 않습니다.
- 일반 교직원 화면에서는 인증코드를 요구하지 않습니다.
- 관리자 화면은 `00_학교설정`의 `adminCode`로 보호합니다.

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

학교에서 실제 운영할 때만 `appsScriptUrl`에 학교별 Apps Script Web App URL을 입력합니다. 설정 예시는 `web/public/app-config.example.json`을 참고하세요.

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

## 데모

https://school-health-hub.github.io/school-staff-training-center/

## 제작

School Health Hub

- Instagram: https://www.instagram.com/ssuvibe_t/
- Blog: https://blog.naver.com/bogun_sh

자세한 설치 절차는 [docs/setup-guide.md](docs/setup-guide.md), 배포 절차는 [docs/deployment.md](docs/deployment.md)를 참고합니다.
