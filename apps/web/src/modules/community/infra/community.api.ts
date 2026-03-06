const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8788";

export type CommunityPostView = {
  postId: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  caption: string;
  imageUrl: string | null;
  tags: string[];
  ingredients: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  topicId?: string;
};

export type CommunityTopic = {
  topicId: string;
  title: string;
  imageUrl: string | null;
  description: string | null;
  dailySpecialId: string;
  createdAt: string;
};

export type CommunityFeedResponse = {
  posts: CommunityPostView[];
  pinnedTopic?: CommunityTopic;
  nextCursor?: string | null;
};

export async function fetchCommunityFeed(
  token?: string,
  cursor?: string,
): Promise<CommunityFeedResponse> {
  const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";

  const res = await fetch(`${API_BASE}/community${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) throw new Error(`Failed to load community feed (${res.status})`);

  return res.json();
}

export type WeeklyTopic = {
  topicId: string;
  title: string;
  imageUrl: string | null;
  createdAt: string;
  date: string; // "YYYY-MM-DD"
};

export async function fetchWeeklyTopics(): Promise<WeeklyTopic[]> {
  const res = await fetch(`${API_BASE}/community/weekly-topics`);
  if (!res.ok) throw new Error(`Failed to load weekly topics (${res.status})`);
  const data = await res.json();
  return data.topics;
}