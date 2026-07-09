# GitHub Pages 배포 가이드

이 프로젝트의 기본 배포 방식은 **GitHub Pages 정적 웹앱 + 학교별 Apps Script Web App**입니다.

## 배포 구조

- GitHub Pages: 화면만 제공합니다.
- Apps Script: 학교별 Google Sheet/Drive API를 담당합니다.
- Google Sheet: 학교설정, 교육목록, 교직원명단, 교육대상, 전자서명기록, 이수증업로드 기록을 저장합니다.
- Google Drive: 전자서명 이미지, 이수증 파일, 최종 서명부 파일을 저장합니다.

## 저장소 복사

1. GitHub에서 이 저장소를 학교 계정 또는 담당자 계정으로 복사합니다.
2. 복사한 저장소의 Settings > Pages에서 Source를 **GitHub Actions**로 설정합니다.
3. `.github/workflows/deploy-pages.yml`은 저장소 이름을 기준으로 `NEXT_PUBLIC_BASE_PATH`를 자동 지정합니다.

저장소명이 `my-school-training-center`라면 Pages 경로는 보통 다음과 같습니다.

```text
https://OWNER.github.io/my-school-training-center/
```

## app-config.json 설정

`web/public/app-config.json`은 학교별 연결 설정입니다.

공개 템플릿에는 실제 Apps Script URL을 커밋하지 않습니다. 학교별 운영 저장소에서만 아래 값을 입력합니다.

```json
{
  "schoolName": "예시고등학교",
  "centerName": "학교 교직원 교육센터",
  "schoolLogo": "",
  "theme": "default",
  "appsScriptUrl": "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
}
```

`web/public/app-config.example.json`은 예시 파일입니다.

## Apps Script 배포

1. 학교 Google Drive에서 허브시트 템플릿을 복사합니다.
2. 복사한 Google Sheet에서 확장 프로그램 > Apps Script를 엽니다.
3. `apps-script/Code.gs` 내용을 붙여 넣습니다.
4. Web App으로 배포합니다.
5. 실행 권한은 학교 운영 방식에 맞게 설정합니다.
6. 배포 URL을 `web/public/app-config.json`의 `appsScriptUrl`에 입력합니다.

## GitHub Actions 배포

main 브랜치에 push하면 workflow가 실행됩니다.

1. `web` 폴더에서 `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`
5. `web/out`을 GitHub Pages artifact로 업로드
6. GitHub Pages에 배포

## 도름스 보안 점검용 배포

GitHub Pages는 정적 파일 배포에는 적합하지만, 저장소 파일만으로 CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy 같은 보안 응답 헤더를 직접 설정할 수 없습니다.

도름스 보안 체크 인증마크까지 목표로 할 때는 다음 중 하나의 방식으로 배포합니다.

1. Cloudflare Pages 또는 Netlify에 `web/out` 폴더를 배포합니다.
2. `web/public/_headers` 파일이 최종 산출물인 `web/out/_headers`에 포함되는지 확인합니다.
3. 새 배포 URL을 기준으로 `dorms-check.config.json`의 `app.url`을 변경합니다.
4. 새 배포 URL로 `npx -y github:shinnanchanguk/dorms-check scan --url "<배포 URL>"`을 다시 실행합니다.

GitHub Pages를 계속 사용할 경우에는 Cloudflare 프록시나 별도 정적 호스팅 계층에서 보안 헤더와 HTTP to HTTPS 리다이렉트를 설정해야 합니다. 도름스 보안 점검은 실제 배포 URL의 응답 헤더를 검사하므로, GitHub Pages 원본 URL만으로는 보안 헤더 항목이 통과되지 않을 수 있습니다.

## QR URL 기준

관리자 QR 출력 화면은 현재 접속한 사이트의 `window.location.origin`과 basePath를 조합해 QR URL을 만듭니다.

```text
현재 배포 도메인 + basePath + /attendance?trainingId=...
```

따라서 저장소 owner나 repo가 바뀌어도 QR은 복사한 학교 사이트를 가리킵니다.

## 보안 주의

- 공개 저장소에 실제 Apps Script URL, Drive 폴더 ID, 관리자 코드, 교직원 데이터를 커밋하지 않습니다.
- GitHub Pages에는 민감정보를 저장하지 않습니다.
- 개인정보는 학교별 Google Sheet와 Drive에만 저장합니다.
- `05_전자서명기록`이 현장 QR 교육의 출석/이수 기준입니다.
- `04_QR출석기록`은 레거시/보조 로그이며 최종 이수 판정 기준이 아닙니다.
