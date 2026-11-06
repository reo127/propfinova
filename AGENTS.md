# Repository Guidelines

## Project Structure & Module Organization
This is a Next.js App Router project. Route pages, layouts, and API handlers live in `src/app`; for example, UI pages use `page.jsx` or `page.js`, and API endpoints use `src/app/api/**/route.js`. Shared UI is split between `src/components` and `src/app/components`; prefer reusing existing components before adding another variant. Database connection helpers are in `src/lib`, Mongoose schemas are in `src/models`, and small shared helpers are in `src/utils`. Static assets and web app metadata live in `public`. One-off maintenance scripts belong in `scripts`.

## Build, Test, and Development Commands
- `npm run dev`: start the local Next.js development server, usually at `http://localhost:3000`.
- `npm run build`: create a production build and catch route, rendering, and bundling errors.
- `npm run start`: serve the built app after `npm run build`.
- `npm run lint`: run the configured Next.js ESLint checks.

Use `npm install` after dependency changes so `package-lock.json` stays current.

## Coding Style & Naming Conventions
Use JavaScript and JSX with 2-space indentation, semicolons where already present, and ES module imports. Components should be PascalCase, such as `PropertyCard.jsx`; utilities should be camelCase, such as `formatPrice.js` and `slugify.js`. Keep route handlers named `route.js` and colocate page-specific components only when they are not broadly reusable. Follow the existing Tailwind/CSS style in `src/app/globals.css`, and run `npm run lint` before handing off changes.

## Testing Guidelines
No test framework is currently committed. For now, validate changes with `npm run lint` and `npm run build`, then manually exercise the affected route or API endpoint. When adding tests, colocate them near the changed code with names like `PropertyCard.test.jsx` or create a dedicated `src/__tests__` area, and add the test command to `package.json`.

## Commit & Pull Request Guidelines
Recent commits use short, informal summaries such as `minor`, `ui improved`, and `lead page error fixed`. Prefer clearer imperative messages going forward, for example `Fix lead detail error state` or `Improve property search filters`. Pull requests should include a brief description, touched routes or APIs, required environment variables, screenshots for UI changes, and the commands run for verification.

## Security & Configuration Tips
Do not commit `.env.local` or secrets. Expected environment values include `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `GOOGLE_GEMINI_API_KEY`, Cloudinary upload settings, and public site URL values such as `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_BASE_URL`. Keep debug and migration API routes restricted or remove them before production deployment.
