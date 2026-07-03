import type { ReactNode } from "react";

const APP_BASE_PATH = "/school-staff-training-center";

type SimpleRoutePageProps = {
  title: string;
  description: string;
  icon?: ReactNode;
};

export function SimpleRoutePage({ title, description, icon }: SimpleRoutePageProps) {
  return (
    <main className="page">
      <div className="dashboard-shell">
        <section className="today-card" aria-label={title}>
          <div className="today-copy">
            <div className="section-kicker">
              {icon}
              <span>{title}</span>
            </div>
            <h1>{title}</h1>
            <p>{description}</p>
            <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
              홈으로 돌아가기
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
