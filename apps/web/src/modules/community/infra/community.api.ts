import { apiGet, apiPost, apiDelete } from '../../../lib/api';
import type {
  CommunityPostView,
  CommunityTopic,
  CommunityFeedResponse,
  CommunityComment,
  WeeklyTopic,
} from '../model/community.types';

export type {
  CommunityPostView,
  CommunityTopic,
  CommunityFeedResponse,
  CommunityComment,
  WeeklyTopic,
};

// API Functions
export async function fetchCommunityFeed(
  token?: string,
  cursor?: string,
): Promise<CommunityFeedResponse> {
  const endpoint = cursor ? `/community?cursor=${encodeURIComponent(cursor)}` : '/community';
  return apiGet<CommunityFeedResponse>(endpoint, token);
}

export async function fetchWeeklyTopics(): Promise<WeeklyTopic[]> {
  const data = await apiGet<{ topics: WeeklyTopic[] }>('/community/weekly-topics');
  return data.topics;
}

export async function getUploadUrl(
  token: string,
  filename: string,
  contentType: string,
): Promise<{ uploadUrl: string; imageKey: string }> {
  return apiPost<{ uploadUrl: string; imageKey: string }>(
    '/community/posts/upload-url',
    { filename, contentType },
    token
  );
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
  const data = await apiPost<{ post: CommunityPostView }>('/community/posts', payload, token);
  return data.post;
}

export async function togglePostLike(
  token: string,
  postId: string,
  postUserId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  return apiPost<{ liked: boolean; likeCount: number }>(
    `/community/posts/${postId}/like`,
    { postId, postUserId },
    token
  );
}

export async function getComments(postId: string, token?: string) {
  return apiGet<{ comments: CommunityComment[] }>(
    `/community/posts/${postId}/comments`,
    token
  );
}

export async function addComment(
  postId: string,
  postUserId: string,
  content: string,
  token: string,
) {
  return apiPost<{ comment: CommunityComment }>(
    `/community/posts/${postId}/comments`,
    { content, postUserId },
    token
  );
}

export async function deleteComment(
  postId: string,
  commentId: string,
  postUserId: string,
  token: string,
) {
  return apiDelete<{ success: boolean }>(
    `/community/posts/${postId}/comments/${commentId}`,
    token,
    { postUserId }
  );
}

export async function toggleCommentLike(
  postId: string,
  commentId: string,
  token: string,
) {
  return apiPost<{ liked: boolean; likeCount: number }>(
    `/community/posts/${postId}/comments/${commentId}/like`,
    {},
    token
  );
}
