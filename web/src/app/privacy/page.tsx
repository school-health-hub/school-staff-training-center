import { getBasePath } from "@/lib/paths";

const APP_BASE_PATH = getBasePath();

const collectedItems = [
  "교직원 식별 및 본인 확인: 성명, 소속부서, 교직원ID",
  "교육 운영: 교육ID, 교육명, 교육대상 여부, 서명일시, 이수상태",
  "증빙 자료: 전자서명 이미지, 이수증 파일, 최종 서명부 파일 URL",
  "관리 설정: 학교명, 담당부서, 담당자 연락처, 학교별 Google Drive 폴더 ID"
];

const retentionItems = [
  "교직원 교육 증빙 자료: 학교 내부 증빙 보존 기준에 따르며, 학교 담당자가 Google Sheet와 Drive에서 관리합니다.",
  "전자서명 이미지와 이수증 파일: 학교 Google Drive의 지정 폴더에 저장하고, 보존기간 종료 또는 삭제 요청 처리 시 학교 담당자가 삭제합니다.",
  "GitHub Pages 정적 웹앱: 개인정보를 저장하지 않으며, 브라우저 화면 제공과 Apps Script 연결만 수행합니다."
];

export default function PrivacyPage() {
  return (
    <main className="page privacy-page">
      <div className="dashboard-shell">
        <div className="route-actions">
          <span className="page-toolbar-title">개인정보처리방침</span>
          <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
            홈으로
          </a>
        </div>

        <section className="today-card" aria-label="개인정보처리방침 개요">
          <div className="today-copy">
            <div className="section-kicker">
              <span>School Health Hub</span>
            </div>
            <h1>학교 교직원 교육센터 개인정보처리방침</h1>
            <p>
              학교 교직원 교육센터는 개인정보 보호법 제30조에 따라 정보주체의 개인정보를 보호하고 관련 고충을 처리하기 위해 다음과 같이
              개인정보처리방침을 공개합니다.
            </p>
          </div>
        </section>

        <section className="training-section" aria-label="총칙 및 데이터 처리 구조">
          <div className="section-head">
            <div>
              <h2>제1조 총칙 및 데이터 처리 구조</h2>
              <p>
                이 서비스는 학교별로 복사해 사용하는 교직원 교육 운영 템플릿입니다. GitHub Pages 또는 정적 호스팅은 화면만 제공하며,
                교직원 명단, 전자서명 기록, 이수증 파일 등 개인정보와 증빙자료는 학교별 Google Sheets와 Google Drive에 저장됩니다.
              </p>
            </div>
          </div>
        </section>

        <section className="training-section" aria-label="처리하는 개인정보 항목">
          <div className="section-head">
            <div>
              <h2>제2조 처리하는 개인정보 항목</h2>
              <p>서비스는 교직원 교육 운영과 증빙에 필요한 최소 항목만 처리합니다. 학생 개인정보와 학습 콘텐츠는 수집하지 않습니다.</p>
            </div>
          </div>
          <ul className="privacy-list">
            {collectedItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="training-section" aria-label="처리 목적">
          <div className="section-head">
            <div>
              <h2>제3조 개인정보의 처리 목적</h2>
              <p>
                수집한 정보는 교직원 교육 대상 확인, 현장 QR 기반 전자서명 출석, 이수증 제출 확인, 내 이수현황 조회, 최종 서명부 생성과
                학교 내부 연수 증빙 관리 목적으로만 사용합니다.
              </p>
            </div>
          </div>
        </section>

        <section className="training-section" aria-label="보유 기간">
          <div className="section-head">
            <div>
              <h2>제4조 처리 및 보유 기간</h2>
              <p>보유기간은 학교의 문서 보존 기준과 법정 의무교육 증빙 보관 기준에 따릅니다.</p>
            </div>
          </div>
          <ul className="privacy-list">
            {retentionItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="training-section" aria-label="제3자 제공">
          <div className="section-head">
            <div>
              <h2>제5조 개인정보의 제3자 제공</h2>
              <p>
                서비스는 정보주체의 개인정보를 제3자에게 제공하지 않습니다. 법령에 따른 요청이 있거나 정보주체의 별도 동의가 있는 경우에는
                해당 법령과 동의 범위 안에서만 처리합니다.
              </p>
            </div>
          </div>
        </section>

        <section className="training-section" aria-label="처리 위탁">
          <div className="section-head">
            <div>
              <h2>제6조 개인정보 처리의 위탁</h2>
              <p>
                학교는 서비스 운영을 위해 Google Workspace에 개인정보 처리를 위탁합니다. GitHub Pages 또는 정적 호스팅 제공자는 화면 파일을
                제공할 뿐 교직원 명단, 전자서명 이미지, 이수증 파일을 저장하지 않습니다. 이 서비스는 Supabase나 외부 AI API를 사용하지 않습니다.
              </p>
            </div>
          </div>
          <ul className="privacy-list">
            <li>
              <strong>Google Workspace</strong>: 학교별 Google Sheets와 Google Drive를 통한 교육 운영 데이터와 증빙자료 저장
            </li>
            <li>
              <strong>GitHub Pages 또는 정적 호스팅</strong>: 정적 화면 제공
            </li>
          </ul>
        </section>

        <section className="training-section" aria-label="정보주체 권리">
          <div className="section-head">
            <div>
              <h2>제7조 정보주체의 권리·의무 및 행사 방법</h2>
              <p>
                정보주체는 개인정보 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다. 요청은 학교별 담당부서 또는 관리자에게 제출하며, 학교는
                관련 법령에 따라 지체 없이 처리합니다.
              </p>
            </div>
          </div>
        </section>

        <section className="training-section" aria-label="아동 개인정보">
          <div className="section-head">
            <div>
              <h2>제8조 만 14세 미만 아동의 개인정보</h2>
              <p>
                이 서비스는 교직원 교육 운영 도구이며 학생 개인정보, 학생 학습 콘텐츠, 만 14세 미만 아동 개인정보를 수집하거나 외부로 전송하지
                않습니다.
              </p>
            </div>
          </div>
        </section>

        <section className="training-section" aria-label="안전성 확보조치">
          <div className="section-head">
            <div>
              <h2>제9조 개인정보의 안전성 확보 조치</h2>
              <p>
                학교별 Google 계정 권한 관리, Apps Script 관리자 코드 확인, HTTPS 기반 전송, 민감정보의 GitHub Pages 저장 금지, 공개 저장소 내
                실제 Apps Script URL과 Drive 폴더 ID 커밋 금지를 기본 안전조치로 적용합니다.
              </p>
            </div>
          </div>
        </section>

        <section className="training-section" aria-label="개인정보 보호책임자">
          <div className="section-head">
            <div>
              <h2>제10조 개인정보 보호책임자</h2>
              <p>
                개인정보 보호책임자는 학교별 운영 담당자가 지정합니다. 각 학교는 `00_학교설정`의 담당부서, 담당자명, 담당자 연락처를 최신
                상태로 관리해야 합니다. 개인정보 침해 상담은 개인정보침해신고센터 118 또는 개인정보분쟁조정위원회 1833-6972를 이용할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        <section className="training-section" aria-label="처리방침 변경">
          <div className="section-head">
            <div>
              <h2>제11조 처리방침의 변경</h2>
              <p>이 방침은 2026년 7월 9일부터 적용하며, 학교별 운영 환경에 따라 담당자가 내용을 보완해 공지할 수 있습니다.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
