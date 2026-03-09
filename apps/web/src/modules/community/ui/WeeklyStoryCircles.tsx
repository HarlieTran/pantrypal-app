import type { WeeklyTopic } from "../model/community.types";

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
    <div className="weekly-circles">
      {topics.map((topic) => {
        const today = isToday(topic.date);
        const selected = selectedDate === topic.date;
        const hasImage = Boolean(topic.imageUrl);
        const label = getDayLabel(topic.date);

        return (
          <article
            key={topic.date}
            className="weekly-circle-item"
            onClick={() => onSelect(selected ? null : topic.date)}
          >
            {/* Ring */}
            <div className={`weekly-circle-ring ${today || selected ? 'is-today' : ''}`}>
              <div className="weekly-circle-inner">
                {hasImage ? (
                  <img
                    src={topic.imageUrl!}
                    alt={topic.title ?? label}
                    className="weekly-circle-image"
                  />
                ) : (
                  <span className="weekly-circle-emoji">🍽️</span>
                )}
              </div>
            </div>

            {/* Label */}
            <span className={`weekly-circle-label ${today ? 'is-today' : ''}`}>
              {today ? "Today" : label}
            </span>
          </article>
        );
      })}
    </div>
  );
}