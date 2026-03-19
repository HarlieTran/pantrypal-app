type Props = {
  title: string;
  icon: string;
  children: React.ReactNode;
};

export function SummarySection({ title, icon, children }: Props) {
  return (
    <div className="profile-section-card">
      <div className="profile-section-header">
        <span className="profile-section-icon">{icon}</span>
        <h3 className="profile-section-title">{title}</h3>
      </div>
      <div className="profile-section-body">{children}</div>
    </div>
  );
}