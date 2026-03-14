import type { WeeklyTopic } from "../model/community.types";
import { useState } from "react";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00"); // noon to avoid timezone shift
  return DAY_LABELS[d.getDay()];
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split("T")[0];
}

function CircleImage({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (broken || !src) return <span className="weekly-circle-emoji">🍽️</span>;
  return (
    <img
      src={src}
      alt={alt}
      className="weekly-circle-image"
      onError={() => setBroken(true)}
    />
  );
}

type Props = {
  topics: WeeklyTopic[];
  selectedTopicId: string | null;
  onSelect: (topicId: string | null) => void;
};

export function WeeklyStoryCircles({ topics, selectedTopicId, onSelect }: Props) {
  return (
    <div className="weekly-circles">
      {topics.map((topic) => {
        const today = isToday(topic.date);
        const selected = selectedTopicId === topic.topicId;
        const label = getDayLabel(topic.date);

        return (
          <article
            key={topic.date}
            className="weekly-circle-item"
            onClick={() => onSelect(selected ? null : topic.topicId)}
          >
            <div className={`weekly-circle-ring ${today || selected ? 'is-today' : ''}`}>
              <div className="weekly-circle-inner">
                <CircleImage src={topic.imageUrl ?? ""} alt={topic.title ?? label} />
              </div>
            </div>
            <span className={`weekly-circle-label ${today ? 'is-today' : ''}`}>
              {today ? "Today" : label}
            </span>
          </article>
        );
      })}
    </div>
  );
}