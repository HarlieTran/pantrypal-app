const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8788";

export type CommunityPostView = {
  postId: string;
  userId: string;
  authorDisplayName?: string;
  displayName?: string;
  avatarUrl: string | null;
  caption: string;
  imageUrl: string | null;
  tags: string[] | { ingredients?: string[]; dietTags?: string[]; cuisine?: string };
  ingredients: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  topicId?: string;
  isLikedByCurrentUser?: boolean;
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

export async function getUploadUrl(
  token: string,
  filename: string,
  contentType: string,
): Promise<{ uploadUrl: string; imageKey: string }> {
  const res = await fetch(`${API_BASE}/community/posts/upload-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ filename, contentType }),
  });

  if (!res.ok) throw new Error("Failed to get upload URL");
  const data = await res.json();
  return data as { uploadUrl: string; imageKey: string };
}

export async function createPost(
  token: string,
  payload: {
    caption: string;
    tags?: string[];
    topicId?: string;
    imageS3Key?: string;
  },
): Promise<CommunityPostView> {
  const res = await fetch(`${API_BASE}/community/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to create post");
  const data = await res.json();
  return data.post as CommunityPostView;
}

export async function togglePostLike(
  token: string,
  postId: string,
  postUserId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const res = await fetch(`${API_BASE}/community/posts/${postId}/like`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ postId, postUserId }),
  });

  if (!res.ok) throw new Error("Failed to toggle like");
  return res.json();
}