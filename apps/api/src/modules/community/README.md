# Community Module

## Responsibility
Powers the community feed — a social space where users share food posts,
respond to daily special topics, like and comment on posts, and discover
content personalized to their dietary preferences. Bridges the daily special
from the home module into a community discussion topic each day.

## Public API
- `getPublicFeed(cursor?)` — returns a scored, paginated feed for guests;
  ranked by recency and popularity
- `getPersonalizedFeed(userId, preferences, cursor?)` — returns a scored,
  paginated feed for authenticated users; ranked by preference overlap,
  recency, and popularity, with `isLikedByCurrentUser` set on each post
- `createPost(input)` — creates a new community post
- `toggleLike(userId, postId, postUserId)` — toggles a like on a post,
  returns updated liked state and count
- `getComments(postId)` — returns all comments for a post sorted by likes
  then recency
- `addComment(input)` — adds a comment to a post and increments the post's
  comment count
- `deleteComment(input)` — deletes a comment if the requesting user owns it,
  decrements the post's comment count
- `toggleCommentLike(input)` — toggles a like on a comment, returns updated
  liked state and count
- `getOrCreateTodayPinnedTopic(input)` — returns today's pinned topic,
  creating it from the daily special if it doesn't exist yet
- `getTopicById(topicId)` — returns a single topic by ID
- `getWeeklyTopics()` — returns the pinned topic for each of the past 7 days
- `createPantryPalSystemPost(input)` — creates the daily system post that
  anchors each day's topic discussion
- `handleCommunityRoute(method, path, authHeader, rawBody)` — module router

## Routes
| Method | Path                                          | Auth     | Description                          |
|--------|-----------------------------------------------|----------|--------------------------------------|
| GET    | `/community`                                  | Optional | Returns feed and today's pinned topic |
| GET    | `/community/weekly-topics`                    | None     | Returns pinned topics for past 7 days |
| POST   | `/community/posts`                            | Required | Creates a new post                   |
| POST   | `/community/posts/upload-url`                 | Required | Returns presigned S3 upload URL      |
| GET    | `/community/posts/:postId/comments`           | None     | Returns comments for a post          |
| POST   | `/community/posts/:postId/comments`           | Required | Adds a comment to a post             |
| DELETE | `/community/posts/:postId/comments/:commentId`| Required | Deletes own comment                  |
| POST   | `/community/posts/:postId/comments/:commentId/like` | Required | Toggles like on a comment      |
| POST   | `/community/posts/:postId/like`               | Required | Toggles like on a post               |

The `GET /community` feed route accepts auth optionally — guests receive the
public feed, authenticated users receive the personalized feed.

## DynamoDB Tables
| Table                          | PK         | SK                  | Purpose                  |
|--------------------------------|------------|---------------------|--------------------------|
| `pantrypal-community-posts`    | `userId`   | `createdAt#postId`  | Post storage             |
| `pantrypal-community-likes`    | `postId`   | `userId`            | Post like records        |
| `pantrypal-community-comments` | `postId`   | `createdAt#commentId` | Comment storage        |
| `pantrypal-community-topics`   | `topicId`  | `"METADATA"`        | Topic storage            |

## GSI Indexes
| Index                | Table    | PK       | SK                  | Purpose                    |
|----------------------|----------|----------|---------------------|----------------------------|
| `gsi1-global-feed`   | posts    | `gsi1pk` ("ALL") | `gsi1sk` (createdAt#postId) | Global feed query |
| `gsi2-topic-feed`    | posts    | `gsi2pk` (topicId) | `gsi2sk` (createdAt) | Posts by topic   |
| `gsi1-pinned-topics` | topics   | `isPinned` ("true") | `createdAt`        | Today's/weekly topics      |

## Feed Scoring
**Guest feed** ranks posts by a weighted combination of recency and popularity:
```
score = (recencyScore × 0.6) + (popularityScore × 0.4)
recencyScore = max(0, 1 - ageHours / 48)
popularityScore = (likeCount × 0.4) + (commentCount × 0.2)
```

**Personalized feed** additionally factors in preference overlap:
```
score = (recencyScore × 0.3)
      + (likeOverlap × 0.4)
      - (dislikeOverlap × 0.2)
      - (allergyOverlap × 0.5)
      + (likeCount × 0.1)
```

Like status for authenticated feed requests is resolved in a single
`BatchGetItem` call against the likes table rather than one `GetItem` per post.

## Daily Topic Flow
Each day a pinned topic is created from the daily special and anchors
community discussion:

1. `home.service.ts` generates the daily special
2. `getOrCreateTodayPinnedTopic` creates a topic record in DynamoDB
3. `createPantryPalSystemPost` creates a system post tied to the topic
4. The topic and system post appear at the top of the community feed
5. Users can reply to the topic by creating posts with the topic's `topicId`

Race conditions during topic creation are handled via DynamoDB
`ConditionExpression: "attribute_not_exists(topicId)"` with a retry on
`ConditionalCheckFailedException`.

## Post Image Flow
1. Frontend requests a presigned URL via `POST /community/posts/upload-url`
2. Frontend uploads the image directly to S3 under `community-posts/{userId}/{uuid}.ext`
3. Frontend creates the post via `POST /community/posts` with the returned `imageS3Key`
4. Feed responses resolve signed read URLs from the `imageS3Key` at serve time

## Environment Variables
| Variable                    | Purpose                                      |
|-----------------------------|----------------------------------------------|
| `S3_BUCKET_COMMUNITY_POSTS` | S3 bucket for community post images          |
| `S3_BUCKET_DAILY_SPECIALS`  | Fallback bucket if community bucket unset    |

## Dependencies
- `common/db/dynamo` — all community data storage
- `common/storage/s3` — post image upload and signed URL generation
- `common/routing/helpers` — response helpers and error handling
- `auth` — JWT verification via `withAuth` and `requireAuth`
- `users` — display name and feed preference lookups
- `home` — daily special data for topic bootstrapping