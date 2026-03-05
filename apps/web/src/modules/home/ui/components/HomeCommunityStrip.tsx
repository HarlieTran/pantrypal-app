import type { CommunityPost } from "../types";

type HomeCommunityStripProps = {
  posts: CommunityPost[];
};

export function HomeCommunityStrip({ posts }: HomeCommunityStripProps) {
  return (
    <section className="community-strip">
      <h2>What&apos;s Happening in the Community</h2>
      <div className="community-grid">
        {posts.map((post) => (
          <article key={post.id} className="community-card">
            <h3>{post.title}</h3>
            <p>by {post.author}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

