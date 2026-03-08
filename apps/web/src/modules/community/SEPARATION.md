# Community Module - Separation of Concerns

## Structure

```
community/
├── model/           # Data types and domain models
├── infra/           # External API integration
├── application/     # Business logic hooks
├── ui/              # Pure presentation components
└── index.ts         # Public exports
```

## Layer Responsibilities

### model/ - Domain Types
**Purpose**: Define data structures and domain models

**Files**:
- `community.types.ts` - All community-related types
  - `CommunityPostView`
  - `CommunityTopic`
  - `CommunityFeedResponse`
  - `CommunityComment`
  - `WeeklyTopic`

**Rules**:
- No dependencies on other layers
- Pure TypeScript types/interfaces
- Single source of truth for data structures

### infra/ - API Integration
**Purpose**: Handle HTTP communication with backend

**Files**:
- `community.api.ts` - API client functions
  - `fetchCommunityFeed()`
  - `fetchWeeklyTopics()`
  - `getUploadUrl()`
  - `createPost()`
  - `togglePostLike()`
  - `getComments()`
  - `addComment()`
  - `deleteComment()`
  - `toggleCommentLike()`

**Dependencies**:
- Imports types from `model/`
- Uses shared `lib/api` client
- Re-exports types for backward compatibility

**Rules**:
- No business logic
- No state management
- Pure API calls with error propagation

### application/ - Business Logic
**Purpose**: Manage state and orchestrate business operations

**Files**:
- `useCommunityFeed.ts` - Feed loading with pagination and auth-aware refresh
- `useCreatePost.ts` - Post creation with image upload orchestration
- `usePostInteractions.ts` - Post like/unlike with optimistic updates
- `useComments.ts` - Comment CRUD with optimistic updates
- `useWeeklyTopics.ts` - Weekly topics loading

**Dependencies**:
- Imports types from `model/`
- Calls functions from `infra/`
- React hooks (useState, useEffect, useCallback)

**Rules**:
- All business logic lives here
- Manages loading/error states
- Implements optimistic updates
- No direct DOM/JSX

### ui/ - Presentation
**Purpose**: Render UI based on props and callbacks

**Files**:
- `CommunityFeed.tsx` - Feed display with thread grouping
- `PostComposer.tsx` - Post creation form
- `CommentSection.tsx` - Comment list and input
- `WeeklyStoryCircles.tsx` - Weekly topic carousel

**Dependencies**:
- Imports types from `model/`
- Uses hooks from `application/`
- No direct API calls

**Rules**:
- Pure presentation components
- All data via props
- All actions via callbacks
- No business logic
- No API calls

## Key Patterns

### Type Flow
```
model/community.types.ts (source of truth)
    ↓
infra/community.api.ts (re-exports for compatibility)
    ↓
application/use*.ts (imports from model)
    ↓
ui/*.tsx (imports from model)
```

### Data Flow
```
UI Component
    ↓ (user action)
Application Hook
    ↓ (API call)
Infra API Client
    ↓ (HTTP request)
Backend
```

### State Management
- All state in application layer hooks
- UI components are stateless (except local UI state like expanded/collapsed)
- Optimistic updates handled in application layer
- Error recovery in application layer

## Example: Post Like Flow

1. **UI** (`CommunityFeed.tsx`):
   ```tsx
   const { liked, likeCount, handleLike } = usePostInteractions(...);
   <button onClick={handleLike}>{liked ? "♥" : "♡"} {likeCount}</button>
   ```

2. **Application** (`usePostInteractions.ts`):
   ```ts
   async function handleLike() {
     // Optimistic update
     setLiked(!wasLiked);
     setLikeCount(c => c + (wasLiked ? -1 : 1));
     
     try {
       const result = await togglePostLike(token, postId, postUserId);
       setLiked(result.liked);
       setLikeCount(result.likeCount);
     } catch {
       // Revert on failure
       setLiked(wasLiked);
       setLikeCount(c => c + (wasLiked ? 1 : -1));
     }
   }
   ```

3. **Infra** (`community.api.ts`):
   ```ts
   export async function togglePostLike(token: string, postId: string, postUserId: string) {
     return apiPost(`/community/posts/${postId}/like`, { postId, postUserId }, token);
   }
   ```

## Benefits

✅ **Testability**: Each layer can be tested independently
✅ **Maintainability**: Clear responsibilities, easy to locate code
✅ **Reusability**: Hooks can be used by multiple UI components
✅ **Type Safety**: Single source of truth for types
✅ **Separation**: UI is pure presentation, business logic isolated
