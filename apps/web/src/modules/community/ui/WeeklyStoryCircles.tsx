import type { WeeklyTopic } from "../infra/community.api";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00"); // noon to avoid timezone shift
  return DAY_LABELS[d.getDay()];
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split("T")[0];
}

type Props = {
  topics: WeeklyTopic[];
  selectedDate: string | null; // "YYYY-MM-DD" or null = show all
  onSelect: (date: string | null) => void;
};

export function WeeklyStoryCircles({ topics, selectedDate, onSelect }: Props) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "16px",
      padding: "14px 12px",
      background: "#fff",
      borderBottom: "1px solid #efefef",
      overflowX: "auto",
    }}>
      {topics.map((topic) => {
        const today = isToday(topic.date);
        const selected = selectedDate === topic.date;
        const hasImage = Boolean(topic.imageUrl);
        const label = getDayLabel(topic.date);

        return (
          <article
            key={topic.date}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", flexShrink: 0 }}
            onClick={() => onSelect(selected ? null : topic.date)}
          >
            {/* Ring */}
            <div style={{
              width: "62px",
              height: "62px",
              borderRadius: "50%",
              padding: "2px",
              background: today || selected
                ? "linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)"
                : "#dbdbdb",
              transition: "background 0.2s",
            }}>
              <div style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                border: "2px solid #fff",
                overflow: "hidden",
                background: "#f5f5f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {hasImage ? (
                  <img
                    src={topic.imageUrl!}
                    alt={topic.title ?? label}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: "22px" }}>🍽️</span>
                )}
              </div>
            </div>

            {/* Label */}
            <span style={{
              fontSize: "12px",
              fontWeight: today ? 700 : 400,
              color: today ? "#262626" : "#737373",
            }}>
              {today ? "Today" : label}
            </span>
          </article>
        );
      })}
    </div>
  );
}