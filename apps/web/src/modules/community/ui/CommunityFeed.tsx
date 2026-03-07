import type { CommunityPostView, CommunityTopic } from "../infra/community.api";
import { togglePostLike } from "../infra/community.api";
import { useEffect, useState } from "react";
import { CommentSection } from "./CommentSection";

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
  const [liked, setLiked] = useState(post.isLikedByCurrentUser ?? false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const [liking, setLiking] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    setCommentCount(post.commentCount ?? 0);
  }, [post.postId, post.commentCount]);

  async function handleLike() {
    if (!token || !isLoggedIn || liking) return;
    setLiking(true);

    // Optimistic update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));

    try {
      const result = await togglePostLike(token, post.postId, post.userId);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      // Revert on failure
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    } finally {
      setLiking(false);
    }
  }

  const isSystem = (post as any).isSystemPost === true || post.userId === "pantrypal-system";

  return (
    <article style={{
      padding: "16px 0",
      borderBottom: "1px solid #efefef",
      display: "flex",
      gap: "12px",
    }}>
      {/* Left — avatar column */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: isSystem
            ? "linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)"
            : "#efefef",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isSystem ? "#fff" : "#262626",
          fontSize: "13px",
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {isSystem ? "✦" : avatarInitials(post.authorDisplayName ?? post.displayName)}
        </div>
        {/* Thread line */}
        {showThreadLine && (
          <div style={{ width: "2px", flex: 1, background: "#efefef", borderRadius: "1px", minHeight: "20px" }} />
        )}
      </div>

      {/* Right — content column */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: "8px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#262626" }}>
            {post.authorDisplayName ?? post.displayName}
          </span>
          {isSystem && (
            <span style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "#dc2743",
              background: "#fff0f3",
              padding: "1px 6px",
              borderRadius: "999px",
              border: "1px solid #ffc2cc",
            }}>
              official
            </span>
          )}
          {post.topicId && (
            <span style={{ fontSize: "13px", color: "#a8a8a8" }}>
              › <span style={{ color: "#dc2743", fontWeight: 600 }}>today's topic</span>
            </span>
          )}
          <span style={{ fontSize: "12px", color: "#a8a8a8", marginLeft: "auto" }}>
            {timeAgo(post.createdAt)}
          </span>
          <button style={{ color: "#a8a8a8", fontSize: "16px", padding: "0 4px", background: "none", border: "none", cursor: "pointer" }}>
            ···
          </button>
        </div>

        {/* Caption */}
        <p style={{ margin: "0 0 10px", fontSize: "14px", color: "#262626", lineHeight: 1.5 }}>
          {post.caption}
        </p>

        {/* Image */}
        {post.imageUrl && (
          <div style={{ borderRadius: "12px", overflow: "hidden", marginBottom: "10px" }}>
            <img
              src={post.imageUrl}
              alt="post"
              style={{ width: "100%", display: "block", maxHeight: "400px", objectFit: "cover" }}
            />
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
              {flatTags.map((tag) => (
                <span key={tag} style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#0095f6",
                }}>
                  #{tag}
                </span>
              ))}
            </div>
          ) : null;
        })()}

        {/* Footer — likes + comments */}
        <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
          <button
            onClick={handleLike}
            disabled={!isLoggedIn || liking}
            style={{
              fontSize: "13px",
              color: liked ? "#e53935" : "#737373",
              background: "none",
              border: "none",
              cursor: isLoggedIn ? "pointer" : "default",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "color 0.15s",
            }}
          >
            {liked ? "♥" : "♡"} <span>{likeCount}</span>
          </button>
          <button
            onClick={() => setCommentsOpen((prev) => !prev)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: commentsOpen ? "#0095f6" : "#555",
            }}
          >
            💬
            {commentCount > 0 && (
              <span style={{ fontSize: 13, color: "#999" }}>{commentCount}</span>
            )}
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
    <div style={{ borderBottom: "1px solid #efefef", paddingBottom: "8px" }}>
      {/* Root post — clickable to expand */}
      <div onClick={() => setExpanded((v) => !v)} style={{ cursor: "pointer" }}>
        <PostCard 
          post={group.root} 
          showThreadLine={group.replies.length > 0} 
          token={token} 
          isLoggedIn={isLoggedIn} />
      </div>

      {/* Replies */}
      {visibleReplies.map((reply, i) => (
        <div key={reply.postId} style={{ paddingLeft: "52px" }}>
          <PostCard
            post={reply}
            showThreadLine={i < visibleReplies.length - 1}
            token={token} 
            isLoggedIn={isLoggedIn}
          />
        </div>
      ))}

      {/* View all / collapse toggle */}
      {group.replies.length > 2 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            marginLeft: "52px",
            marginTop: "6px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#0095f6",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {expanded
            ? "Collapse replies"
            : `View all ${group.replies.length} replies`}
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
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#737373", fontSize: "14px" }}>
        Loading community...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "18px", border: "1px solid #f2c6cb", background: "#fce4ec", borderRadius: "12px", color: "#b71c1c", fontSize: "13px" }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>

      {/* Create post trigger — authenticated only */}
      {isLoggedIn && onCreatePost && (
        <button
          onClick={onCreatePost}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: "1px solid #f0f0f0",
            borderRadius: "12px",
            background: "#fafafa",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
            marginBottom: "8px",
          }}
        >
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#e8e8e8",
            flexShrink: 0,
          }} />
          <span style={{ fontSize: "14px", color: "#aaa", textAlign: "left" }}>
            Share something from your kitchen...
          </span>
        </button>
      )}

      {/* Guest CTA */}
      {!isLoggedIn && (
        <div style={{
          padding: "12px 0",
          borderBottom: "1px solid #efefef",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#737373" }}>
            Log in to get a personalized feed based on your taste profile.
          </p>
          <button className="btn-primary" onClick={onLoginNavigate}>
            Log in
          </button>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#737373", fontSize: "14px" }}>
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
          className="btn-primary"
          onClick={onLoadMore}
          disabled={loadingMore}
          style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: "8px" }}
        >
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
