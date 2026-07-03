# 학교 교직원 교육센터

**School Staff Training Center**는 학교에서 반복 운영하는 교직원 연수, 법정의무교육, 안전교육, 전달연수의 출석, 전자서명, 이수현황, 최종 서명부를 한곳에서 관리하기 위한 공용 웹앱입니다.

공용 배포 구조는 **GitHub Pages + Apps Script + Google Sheet + Google Drive**입니다.

- GitHub Pages: 정적 화면 제공
- Apps Script: 학교별 Sheet/Drive 읽기·쓰기 API
- Google Sheet: 학교설정, 교육목록, 교직원명단, 출석기록 저장
- Google Drive: 전자서명 이미지, 이수증 파일, 최종 서명부 저장

## GitHub Pages 설정 방식

학교별 설정은 `.env.local`이 아니라 런타임 설정 파일인 `app-config.json`으로 관리합니다.

앱은 시작할 때 GitHub Pages에 배포된 `app-config.json`을 먼저 `fetch`합니다. 파일이 없거나 `appsScriptUrl`이 비어 있으면 Apps Script API를 호출하지 않고, 사용자에게 설정 파일을 준비하라는 안내 배너를 표시합니다.

예시는 [web/public/app-config.example.json](web/public/app-config.example.json)에 있습니다.

```json
{
  "schoolName": "학교명 미설정",
  "centerName": "학교 교직원 교육센터",
  "schoolLogo": "",
  "theme": "default",
  "appsScriptUrl": "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
}
```

필드 설명:

- `schoolName`: 화면에 표시할 학교명
- `centerName`: 화면 상단에 표시할 센터명
- `schoolLogo`: 학교 로고 이미지 경로 또는 URL
- `theme`: 기본 테마는 `"default"`를 사용합니다. 필요하면 `{ "primaryColor": "#1F2A44", "secondaryColor": "#EEF4FF" }` 형식도 사용할 수 있습니다.
- `appsScriptUrl`: 학교별 Apps Script Web App URL

실제 학교 설정은 `web/public/app-config.json`에서 관리합니다. `web/public/app-config.example.json`은 새 학교 설정을 만들 때 참고하는 예시 파일로 유지합니다.

## 주요 기능

- 학교설정 불러오기
- 교육목록 불러오기
- 교직원 인증
- QR 출석
- 전자서명 저장
- 나의 이수현황 확인
- 관리자 QR 출력
- 최종 서명부 다운로드
- 기존 이수증 제출 기능 유지 및 2차 개선

## 프로젝트 구조

```text
.
├─ docs/               # 설치, 구조, 배포, 개인정보, 시트 구조 문서
├─ apps-script/        # 학교별 Apps Script API 코드
├─ web/                # GitHub Pages 정적 웹앱
├─ template/           # 학교별 복사용 허브시트 템플릿
├─ .github/            # GitHub Pages/Actions 설정
├─ README.md           # 프로젝트 소개
├─ CODEX.md            # 개발 작업 원칙
├─ DESIGN.md           # School Health Hub 디자인 원칙
└─ NEXT.md             # 다음 작업 목록
```

## 배포 흐름

1. `template/`의 허브시트 템플릿을 학교 Google Drive로 복사합니다.
2. 복사한 Google Sheet의 학교설정 탭에 학교명, 로고, 색상, 담당자 정보, Drive 폴더 ID를 입력합니다.
3. 학교별 Apps Script Web App을 배포합니다.
4. `web/public/app-config.example.json`을 참고해 `web/public/app-config.json`을 준비합니다.
5. `appsScriptUrl`에 학교별 Apps Script Web App URL을 입력합니다.
6. `npm run build`를 실행하면 `web/public/app-config.json`이 `web/out/app-config.json`으로 복사됩니다.
7. GitHub Pages에 `web/out` 정적 산출물을 배포합니다.
8. 교직원은 GitHub Pages URL에서 QR 출석, 전자서명, 이수현황 확인을 진행합니다.

## 개발 명령

```bash
cd web
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

Next.js는 `output: "export"`로 정적 파일을 생성합니다. 배포 결과는 `web/out`에 만들어지며, `web/public/app-config.json`도 빌드 시 그대로 복사됩니다. 학교별 설정을 바꾼 뒤에는 `web/public/app-config.json`을 수정하고 다시 빌드해 GitHub Pages에 반영합니다.

## 보안 원칙

- 교직원 명단, 인증코드, 출석기록은 학교별 Google Sheet에만 저장합니다.
- 전자서명 이미지와 이수증 파일은 학교별 Google Drive 폴더에만 저장합니다.
- GitHub Pages에는 민감정보를 저장하지 않습니다.
- 실제 Apps Script URL은 `web/public/app-config.json`에서 관리하고, GitHub Pages에는 빌드 산출물로 복사된 `app-config.json`이 배포됩니다.

자세한 배포 절차는 [docs/deployment.md](docs/deployment.md)를 참고합니다.
