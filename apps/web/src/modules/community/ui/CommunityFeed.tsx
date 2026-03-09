import type { CommunityPostView, CommunityTopic } from "../model/community.types";
import { useState } from "react";
import { CommentSection } from "./CommentSection";
import { usePostInteractions } from "../application/usePostInteractions";
import "../styles/community.css";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function avatarInitials(name: string | undefined): string {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// ─── Thread Grouping ──────────────────────────────────────────────────────────

type ThreadGroup = {
  root: CommunityPostView;
  replies: CommunityPostView[];
  latestActivity: string; // ISO — used for feed sorting
};

type FeedItem =
  | { kind: "thread"; group: ThreadGroup }
  | { kind: "standalone"; post: CommunityPostView };

function groupPostsIntoFeed(posts: CommunityPostView[]): FeedItem[] {
  // Separate posts with a topicId from standalone posts
  const withTopic = posts.filter((p) => p.topicId);
  const standalone = posts.filter((p) => !p.topicId);

  // Group by topicId
  const topicMap = new Map<string, CommunityPostView[]>();
  for (const post of withTopic) {
    const key = post.topicId!;
    if (!topicMap.has(key)) topicMap.set(key, []);
    topicMap.get(key)!.push(post);
  }

  // Build thread groups
  const threads: FeedItem[] = [];
  for (const [, members] of topicMap) {
    // Sort by createdAt ascending — earliest is the root
    const sorted = [...members].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const root = sorted[0];
    const replies = sorted
      .slice(1)
      .sort((a, b) => b.likeCount - a.likeCount); // replies by likeCount desc

    // Latest activity = most recent createdAt across all members
    const latestActivity = members.reduce((latest, p) =>
      p.createdAt > latest ? p.createdAt : latest,
      root.createdAt,
    );

    threads.push({ kind: "thread", group: { root, replies, latestActivity } });
  }

  // Build standalone items
  const standalones: FeedItem[] = standalone.map((post) => ({
    kind: "standalone",
    post,
  }));

  // Mix threads and standalones, sort by latest activity newest first
  const all: FeedItem[] = [...threads, ...standalones];
  all.sort((a, b) => {
    const timeA = a.kind === "thread" ? a.group.latestActivity : a.post.createdAt;
    const timeB = b.kind === "thread" ? b.group.latestActivity : b.post.createdAt;
    return timeB.localeCompare(timeA);
  });

  return all;
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, showThreadLine = true, token, isLoggedIn, currentUserId }: {
  post: CommunityPostView;
  showThreadLine?: boolean;
  token?: string;
  isLoggedIn?: boolean;
  currentUserId?: string;
}) {
  const { liked, likeCount, liking, handleLike } = usePostInteractions(
    post.postId,
    post.userId,
    post.isLikedByCurrentUser ?? false,
    post.likeCount,
    token,
  );
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const isSystem = (post as any).isSystemPost === true || post.userId === "pantrypal-system";

  return (
    <article className="community-post">
      {/* Left — avatar column */}
      <div className="community-post-avatar-col">
        <div className={`community-post-avatar ${isSystem ? 'is-system' : ''}`}>
          {isSystem ? "✦" : avatarInitials(post.authorDisplayName ?? post.displayName)}
        </div>
        {/* Thread line */}
        {showThreadLine && <div className="community-post-thread-line" />}
      </div>

      {/* Right — content column */}
      <div className="community-post-content">
        {/* Header */}
        <div className="community-post-header">
          <span className="community-post-author">
            {post.authorDisplayName ?? post.displayName}
          </span>
          {isSystem && <span className="community-post-badge">official</span>}
          {post.topicId && (
            <span className="community-post-topic-label">
              › <span>today's topic</span>
            </span>
          )}
          <span className="community-post-time">{timeAgo(post.createdAt)}</span>
          <button className="community-post-menu">···</button>
        </div>

        {/* Caption */}
        <p className="community-post-caption">{post.caption}</p>

        {/* Image */}
        {post.imageUrl && (
          <div className="community-post-image-wrap">
            <img src={post.imageUrl} alt="post" className="community-post-image" />
          </div>
        )}

        {/* Tags */}
        {(() => {
          const flatTags = Array.isArray(post.tags)
            ? post.tags
            : [
                ...((post.tags as any)?.ingredients ?? []),
                ...((post.tags as any)?.dietTags ?? []),
                (post.tags as any)?.cuisine,
              ].filter(Boolean) as string[];

          return flatTags.length > 0 ? (
            <div className="community-post-tags">
              {flatTags.map((tag) => (
                <span key={tag} className="community-post-tag">#{tag}</span>
              ))}
            </div>
          ) : null;
        })()}

        {/* Footer — likes + comments */}
        <div className="community-post-actions">
          <button
            onClick={handleLike}
            disabled={!isLoggedIn || liking}
            className={`community-post-action-btn ${liked ? 'is-liked' : ''}`}
          >
            {liked ? "♥" : "♡"} <span>{likeCount}</span>
          </button>
          <button
            onClick={() => setCommentsOpen((prev) => !prev)}
            className={`community-post-comment-btn ${commentsOpen ? 'is-active' : ''}`}
          >
            💬
            {commentCount > 0 && <span className="community-post-comment-count">{commentCount}</span>}
          </button>
        </div>
        
        {/* Comments */}
        <CommentSection
          postId={post.postId}
          postUserId={post.userId}
          token={token}
          currentUserId={currentUserId}
          isOpen={commentsOpen}
          onToggle={() => setCommentsOpen((prev) => !prev)}
          onCountChange={setCommentCount}
        />
      </div>
    </article>
  );
}

// ─── Thread Group ─────────────────────────────────────────────────────────────

function ThreadGroupCard({ group, token, isLoggedIn, currentUserId }: {
  group: ThreadGroup;
  token?: string;
  isLoggedIn?: boolean;
  currentUserId?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleReplies = expanded ? group.replies : group.replies.slice(0, 2);

  return (
    <div className="community-thread-group">
      {/* Root post — clickable to expand */}
      <div onClick={() => setExpanded((v) => !v)} className="community-thread-root">
        <PostCard 
          post={group.root} 
          showThreadLine={group.replies.length >= 0} 
          token={token} 
          isLoggedIn={isLoggedIn}
          currentUserId={currentUserId} />
      </div>

      {/* Replies */}
      {visibleReplies.map((reply, i) => (
        <div key={reply.postId} className="community-thread-reply">
          <PostCard
            post={reply}
            showThreadLine={i < visibleReplies.length - 1}
            token={token} 
            isLoggedIn={isLoggedIn}
            currentUserId={currentUserId}
          />
        </div>
      ))}

      {/* View all / collapse toggle */}
      {group.replies.length > 2 && (
        <button onClick={() => setExpanded((v) => !v)} className="community-thread-toggle">
          {expanded ? "Collapse replies" : `View all ${group.replies.length} replies`}
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type CommunityFeedProps = {
  posts: CommunityPostView[];
  pinnedTopic?: CommunityTopic;
  loading: boolean;
  loadingMore: boolean;
  error: string;
  nextCursor: string | null;
  isLoggedIn: boolean;
  token?: string;
  currentUserId?: string;
  onLoadMore: () => void;
  onLoginNavigate: () => void;
  onCreatePost?: () => void;
};

export function CommunityFeed({
  posts,
  pinnedTopic,
  loading,
  loadingMore,
  error,
  nextCursor,
  isLoggedIn,
  token,
  currentUserId,
  onLoadMore,
  onLoginNavigate,
  onCreatePost,
}: CommunityFeedProps) {
  if (loading) {
    return <div className="community-feed-loading">Loading community...</div>;
  }

  if (error) {
    return <div className="community-feed-error">{error}</div>;
  }

  return (
    <div className="community-feed-container">
      {/* Create post trigger — authenticated only */}
      {isLoggedIn && onCreatePost && (
        <button onClick={onCreatePost} className="community-feed-create-post">
          <div className="community-feed-create-avatar" />
          <span className="community-feed-create-placeholder">
            Share something from your kitchen...
          </span>
        </button>
      )}

      {/* Guest CTA */}
      {!isLoggedIn && (
        <div className="community-feed-guest-cta">
          <p className="community-feed-guest-text">
            Log in to get a personalized feed based on your taste profile.
          </p>
          <button className="btn-primary" onClick={onLoginNavigate}>
            Log in
          </button>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="community-feed-empty">
          No posts yet. Be the first to share something!
        </div>
      ) : (
        groupPostsIntoFeed(posts).map((item) =>
          item.kind === "thread" ? (
            <ThreadGroupCard 
              key={item.group.root.postId} 
              group={item.group}
              token={token}
              isLoggedIn={isLoggedIn} 
              currentUserId={currentUserId} />
          ) : (
            <PostCard 
              key={item.post.postId} 
              post={item.post} 
              token={token} 
              isLoggedIn={isLoggedIn} 
              currentUserId={currentUserId} />
          )
        )
      )}

      {/* Load more */}
      {nextCursor && (
        <button
          className="btn-primary community-feed-load-more"
          onClick={onLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
