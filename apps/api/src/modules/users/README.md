# Users Module

Manages user profiles, authentication bootstrap, and user preferences.

## Features

- Bootstrap user profile from Cognito claims
- Get/update user profile
- Manage display name, diet preferences, allergies
- Feed preference extraction for personalized content

## Routes

- `POST /me/bootstrap` - Create/update profile from JWT
- `GET /me` - Get current user
- `GET /me/profile` - Get full profile with preferences
- `PATCH /me/profile` - Update profile fields

## Services

- `profile.service.ts` - User CRUD, preference management
