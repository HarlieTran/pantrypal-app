export type PostType = "free" | "topic_reply" | "system_reply";

export type CommunityTopic = {
  topicId: string;
  sk: string;                          // always "METADATA"
  type: "system" | "recipe" | "user_created";
  title: string;
  dailySpecialId?: string;
  recipeId?: number;
  isPinned: string;                    // "true" | "false" — string for GSI
  imageUrl?: string;
  description?: string;
  postCount: number;
  createdAt: string;                   // ISO string
};

export type CommunityPost = {
  userId: string;                      // PK
  sk: string;                          // createdAt#postId
  postId: string;
  gsi1pk: string;                      // always "ALL" — for global feed GSI
  gsi1sk: string;                      // createdAt#postId — for global feed sort
  gsi2pk?: string;                     // topicId — for topic feed GSI
  gsi2sk?: string;                     // createdAt — for topic feed sort
  topicId?: string;
  postType: PostType;
  imageS3Key?: string;
  imageUrl?: string;
  caption?: string;
  dishName?: string;
  recipeId?: number;
  tags: {
    cuisine?: string;
    ingredients?: string[];
    dietTags?: string[];
  };
  likeCount: number;
  commentCount: number;
  authorDisplayName: string;
  authorAvatarLabel: string;
  createdAt: string;                   // ISO string
  updatedAt: string;                   // ISO string
};

export type CommunityComment = {
  postId: string;                      // PK
  sk: string;                          // createdAt#commentId
  commentId: string;
  userId: string;
  displayName: string;
  avatarLabel: string;
  content: string;
  createdAt: string;
};

export type CommunityLike = {
  postId: string;                      // PK
  userId: string;                      // SK
  createdAt: string;
};

// What the API returns to the frontend
export type CommunityPostView = Omit<CommunityPost, "gsi1pk" | "gsi1sk" | "sk"> & {
  isLikedByCurrentUser?: boolean;
};

export type CommunityFeedResponse = {
  posts: CommunityPostView[];
  nextCursor?: string;                 // for pagination
  pinnedTopic?: CommunityTopic;
};