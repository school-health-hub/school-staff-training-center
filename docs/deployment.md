# GitHub Pages 배포 절차

학교 교직원 교육센터의 공용 배포형은 GitHub Pages 정적 웹앱과 학교별 Apps Script Web App을 연결하는 방식입니다.

## 배포 전 준비

1. 학교별 Google Sheet 허브시트 템플릿을 복사합니다.
2. 학교설정 탭에 학교명, 로고, 색상, 담당자 정보, Drive 폴더 ID를 입력합니다.
3. Apps Script 프로젝트를 학교별 Sheet에 연결합니다.
4. Apps Script를 Web App으로 배포합니다.
5. 배포된 Apps Script Web App URL을 확인합니다.

## app-config.json 설정

학교별 설정은 `.env.local`이 아니라 GitHub Pages에 함께 배포되는 `app-config.json`으로 관리합니다.

```json
{
  "schoolName": "학교명 미설정",
  "centerName": "학교 교직원 교육센터",
  "schoolLogo": "",
  "theme": "default",
  "appsScriptUrl": "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
}
```

`web/public/app-config.example.json`은 예시 파일로 유지합니다. 실제 운영 설정은 `web/public/app-config.json`에 입력합니다.

앱은 시작 시 `app-config.json`을 먼저 불러옵니다. 파일이 없거나 `appsScriptUrl`이 비어 있으면 Apps Script API를 호출하지 않고 안내 배너를 표시합니다.

## 정적 빌드

`web` 폴더에서 정적 파일을 생성합니다.

```bash
cd web
npm ci
npm run lint
npm run typecheck
npm run build
```

Next.js 설정은 `output: "export"`를 사용하므로 빌드 결과는 `web/out`에 생성됩니다. 이 저장소의 GitHub Pages 프로젝트 경로는 `/school-staff-training-center`로 설정되어 있으며, 별도 환경변수 없이 빌드됩니다.

`web/out`은 배포 산출물이므로 직접 수정하지 않습니다. 학교별 설정을 바꿀 때는 `web/public/app-config.json`을 수정한 뒤 다시 빌드합니다. 빌드 과정에서 `web/public/app-config.json`이 `web/out/app-config.json`으로 복사됩니다.

## GitHub Actions 방식

1. GitHub Actions에서 `web` 폴더 기준으로 의존성을 설치합니다.
2. `npm run lint`와 `npm run typecheck`를 실행합니다.
3. `npm run build`로 정적 파일을 생성합니다.
4. `web/public/app-config.json`이 포함된 `web/out`을 GitHub Pages artifact로 업로드합니다.
5. Pages 배포 환경에 게시합니다.

## 보안 원칙

- GitHub Pages에는 민감정보를 저장하지 않습니다.
- Apps Script URL 외에 교직원 명단, 인증코드, 출석기록, 서명 이미지를 정적 파일에 포함하지 않습니다.
- 전자서명 이미지는 학교별 Google Drive 지정 폴더에 저장합니다.
- 출석기록은 학교별 Google Sheet에 저장합니다.
- Apps Script 응답에는 화면 표시와 다음 처리에 필요한 최소 정보만 포함합니다.

## 배포 후 확인

- GitHub Pages URL에서 첫 화면이 열리는지 확인합니다.
- `app-config.json`이 없을 때 친절한 안내 배너가 보이는지 확인합니다.
- 학교명, 로고, 테마 색상이 `app-config.json` 값으로 반영되는지 확인합니다.
- 교육목록이 Apps Script Web App URL을 통해 표시되는지 확인합니다.
- 모바일 화면에서 카드와 버튼이 가로로 넘치지 않는지 확인합니다.
