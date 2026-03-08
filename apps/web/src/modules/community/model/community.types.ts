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

export type CommunityComment = {
  postId: string;
  sk: string;
  commentId: string;
  userId: string;
  displayName: string;
  avatarLabel: string;
  content: string;
  likeCount: number;
  likedBy: string[];
  createdAt: string;
};

export type WeeklyTopic = {
  topicId: string;
  title: string;
  imageUrl: string | null;
  createdAt: string;
  date: string;
};
