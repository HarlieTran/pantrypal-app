# Community Module

## Responsibility
Public community feed — posts, topics, likes, comments.

## Public API
- `getPublicFeed` — paginated feed for guests
- `getPersonalizedFeed` — relevance-ranked feed for authenticated users
- `getOrCreateTodayPinnedTopic` — bridges daily special to community
- `getTopicById` — fetch a single topic

## Storage
- DynamoDB: posts, likes, comments, topics
- S3: post images (community-posts/{postId}/)

## Dependencies
- `common/db/dynamo`
- `common/storage/s3`