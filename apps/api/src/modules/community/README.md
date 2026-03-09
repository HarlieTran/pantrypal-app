# Community Module

Social feed with posts, comments, likes, and topics.

## Features

- Public and personalized feeds
- Post creation with image upload
- Comments and nested likes
- Daily pinned topics
- Weekly topic rotation

## Routes

- `GET /community` - Get feed (auth optional)
- `GET /community/weekly-topics` - Get topics
- `POST /community/posts` - Create post
- `POST /community/posts/upload-url` - Get S3 upload URL
- `GET /community/posts/:id/comments` - Get comments
- `POST /community/posts/:id/comments` - Add comment
- `DELETE /community/posts/:id/comments/:commentId` - Delete comment
- `POST /community/posts/:id/like` - Toggle post like
- `POST /community/posts/:id/comments/:commentId/like` - Toggle comment like

## Services

- `post.service.ts` - Post CRUD, feed generation
- `comment.service.ts` - Comment management
- `like.service.ts` - Like/unlike logic
- `topic.service.ts` - Topic management
- `system.post.service.ts` - System-generated posts

## Types

- `community.types.ts` - Post, Comment, Like, Topic, Feed types
