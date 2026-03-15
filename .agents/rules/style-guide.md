# ContractSense Style Guide

## Stack Conventions

- Frontend uses Vite, React Router v6, React functional components, and TypeScript strict mode.
- Backend uses Express with TypeScript, service-oriented controllers, and Mongoose for persistence.
- AI workloads live only in the FastAPI service.

## Routing Rules

- The frontend must never call the AI service directly.
- All AI-related requests go from the frontend to Backend 1, then through `ai.proxy.routes.ts` and `aiClient.service.ts`.
- Keep REST endpoints under `/api/*` on Backend 1 and internal AI service routes under `/ai/*` on Backend 2.

## Naming Rules

- Risk flag values must be exactly `red`, `yellow`, or `green`.
- Component names use PascalCase. Hooks use `useX` naming. Route/controller/service files use dot-suffixed feature names.
- Shared DTO and view-model types should live in `frontend/src/types/index.ts` or backend-local interfaces near usage.

## UI Composition

- Keep clause rendering DRY. `ClauseCard` is the canonical renderer for clause text, simplification, explanation, and risk state.
- `RiskFlag` is the single visual mapping layer for risk colors and labels.
- Reuse layout primitives before adding new wrappers inside page components.

## API and Data Rules

- Validate request bodies at service boundaries.
- Persist canonical contract/report state in MongoDB; treat AI responses as derived data that can be recomputed.
- Use explicit response objects rather than leaking raw provider payloads into controllers.

