# Home Module

Daily special generation with AI and image sourcing.

## Features

- AI-generated daily dish recommendations
- Unsplash image integration
- S3 storage for generated content
- Prewarm endpoint for scheduled generation

## Routes

- `GET /home` - Get today's special + navigation
- `POST /internal/home/prewarm` - Worker endpoint (auth required)

## Services

- `home.service.ts` - Daily special generation, caching, image handling
