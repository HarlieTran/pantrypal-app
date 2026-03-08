# Home Module - Separation of Concerns

## Structure

```
home/
├── model/           # Data types
├── infra/           # (empty - no external APIs)
├── application/     # (empty - no business logic)
├── ui/              # Presentation components
│   ├── components/  # Reusable UI components
│   └── pages/       # Page-level components
└── index.ts         # Public exports
```

## Analysis

The home module is **already properly separated** and follows a different pattern than other modules because it serves as a **composition/orchestration layer** rather than a feature module.

### model/ - Domain Types ✅
**Purpose**: Define data structures

**Files**:
- `home.types.ts`
  - `HomeSpecial` - Daily special dish data
  - `CommunityPost` - Community post preview
  - `PreferenceProfile` - User preference data

**Status**: ✅ Complete - Types are properly defined

### infra/ - API Integration ✅
**Status**: ✅ Empty (intentional) - Home module doesn't make direct API calls

**Reason**: Home module composes other modules (community, pantry, recipes, profile) which handle their own API calls

### application/ - Business Logic ✅
**Status**: ✅ Empty (intentional) - No business logic needed

**Reason**: Home module is a presentation orchestrator. Business logic lives in the composed modules:
- Community feed logic → `community/application/useCommunityFeed.ts`
- Pantry logic → `pantry/application/*`
- Recipe logic → `recipes/application/*`
- Profile logic → `profile/application/*`

### ui/ - Presentation ✅
**Purpose**: Render layout and compose other modules

**Files**:
- `pages/HomePage.tsx` - Main page wrapper (pure props passthrough)
- `components/HomeHero.tsx` - Main layout orchestrator
  - Composes: CommunityFeed, PantryPage, RecipesPage, ProfilePage
  - Uses hooks from other modules: `useCommunityFeed`, `useWeeklyTopics`
  - Manages local UI state: `openRow`, `showComposer`, `selectedDate`

**Status**: ✅ Properly structured

## Key Characteristics

### 1. Orchestration Pattern
Home module follows an **orchestration pattern** where it:
- Composes multiple feature modules
- Manages navigation between views
- Handles layout and visual structure
- Delegates business logic to feature modules

### 2. Proper Delegation
```tsx
// Home doesn't implement community logic - it uses the community module
import { CommunityFeed, useCommunityFeed, useWeeklyTopics } from "../../../community";

const { posts, pinnedTopic, loading, loadMore } = useCommunityFeed({ token, enabled: true });

<CommunityFeed
  posts={posts}
  pinnedTopic={pinnedTopic}
  loading={loading}
  onLoadMore={loadMore}
  ...
/>
```

### 3. Local UI State Only
HomeHero manages only presentation-level state:
- `openRow` - Which accordion row is expanded
- `showComposer` - Whether post composer modal is visible
- `selectedDate` - Which date filter is active

This is appropriate for a presentation component.

### 4. Props Passthrough
HomePage is a thin wrapper that passes props to HomeHero - this is a common pattern for page-level components.

## Comparison with Feature Modules

| Aspect | Feature Module (e.g., community) | Orchestration Module (home) |
|--------|----------------------------------|----------------------------|
| **API Calls** | Yes - in infra/ | No - delegates to features |
| **Business Logic** | Yes - in application/ | No - delegates to features |
| **State Management** | Yes - domain state | Only UI state |
| **Purpose** | Implement feature | Compose features |

## Conclusion

✅ **Home module is correctly structured**

The home module doesn't need infra/ or application/ layers because:
1. It's an orchestration layer, not a feature layer
2. It composes other modules that have their own logic
3. It only manages presentation and navigation
4. All business logic is properly delegated to feature modules

This is a **valid architectural pattern** and demonstrates proper separation of concerns at the application level.

## No Changes Needed

The home module is already following best practices:
- ✅ Types in model layer
- ✅ Pure presentation in UI layer
- ✅ Proper delegation to feature modules
- ✅ Clean public API via index.ts
- ✅ No business logic in UI components
