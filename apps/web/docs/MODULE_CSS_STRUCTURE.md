# Module-Specific CSS Structure

## Overview
Styles are now organized following the Modular Monolith architecture. Each module owns its styles, making the codebase more maintainable and portable.

## Structure

```
apps/web/src/
├── styles.css                          # Global primitives only
└── modules/
    ├── community/
    │   └── styles/
    │       └── community.css           # Feed, composer, comments, weekly circles
    ├── profile/
    │   └── styles/
    │       └── profile.css             # Profile header, sections, tags, confidence bars
    ├── pantry/
    │   └── styles/
    │       └── pantry.css              # Modals, upload, review components
    ├── recipes/
    │   └── styles/
    │       └── recipes.css             # Recipe grid, cards, chips, modal
    ├── onboarding/
    │   └── styles/
    │       └── onboarding.css          # Questionnaire, recipe picker
    └── home/
        └── styles/
            └── home.css                # Hero, special panel, stories, home layout
```

## Global vs Module Styles

### Global (`src/styles.css`)
Contains only shared primitives:
- CSS variables (colors, spacing, shadows)
- Reset styles
- Base element styles (button, input, textarea)
- Shared button classes (.btn-primary, .btn-secondary)
- Layout primitives (page-shell, ig-navbar, ig-left-rail)
- Shared page system classes (ig-screen, ig-page-shell, ig-toolbar)
- Animations

### Module Styles
Each module's CSS file contains:
- Component-specific styles for that module only
- No cross-module dependencies
- BEM-style naming with module prefix

## Import Pattern

Each module's main UI component imports its styles:

```typescript
// apps/web/src/modules/community/ui/CommunityFeed.tsx
import "../styles/community.css";

// apps/web/src/modules/profile/ui/pages/ProfilePage.tsx
import "../../styles/profile.css";

// apps/web/src/modules/pantry/ui/pages/PantryPage.tsx
import "../../styles/pantry.css";

// apps/web/src/modules/recipes/ui/pages/RecipesPage.tsx
import "../../styles/recipes.css";

// apps/web/src/modules/onboarding/ui/components/OnboardingQuestionnaire.tsx
import "../../styles/onboarding.css";

// apps/web/src/modules/home/ui/pages/HomePage.tsx
import "../../styles/home.css";
```

## Module CSS Contents

### community.css
- `.community-post-*` - Post card styles
- `.post-composer-*` - Post creation form
- `.comment-*` - Comment section and items
- `.weekly-circle-*` - Story circles

### profile.css
- `.profile-header` - Profile identity section
- `.profile-section-*` - Section cards
- `.profile-confidence-*` - Confidence bars
- `.profile-tag-*` - Tag pills and groups
- `.profile-cta-*` - Call-to-action banners

### pantry.css
- `.ig-modal-*` - Modal system
- `.ig-upload-*` - Upload components
- `.ig-form-*` - Form elements
- `.ig-row-*` - Review row components

### recipes.css
- `.ig-recipes-grid` - Recipe grid layout
- `.ig-recipe-card-*` - Recipe card components
- `.ig-chip-*` - Ingredient chips
- `.ig-recipe-modal-*` - Recipe detail modal

### onboarding.css
- `.ig-onboard-*` - Questionnaire components
- `.ig-recipe-pick-*` - Recipe preference picker
- `.ig-picker-*` - Picker actions

### home.css
- `.hero-*` - Hero section
- `.special-*` - Daily special panel
- `.ig-home` - Home layout grid
- `.ig-stories` - Story circles
- `.ig-post-*` - Post cards
- `.ig-right-col` - Right sidebar

## Benefits

1. **Encapsulation**: Each module's styles live with its code
2. **Maintainability**: Easy to find/modify styles for a specific module
3. **Portability**: Module can be extracted with all dependencies
4. **Clarity**: No giant global CSS file mixing concerns
5. **Performance**: Vite bundles and optimizes CSS automatically
6. **Scalability**: New modules follow the same pattern

## Migration Complete

All inline styles have been extracted to CSS classes. The refactoring guide (`INLINE_STYLES_REFACTOR.md`) shows how to replace inline styles with CSS classes if needed in the future.

Build verified: ✅ `npm run build` passes successfully
