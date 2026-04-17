# Architecture Overview

## High-Level Shape

Greencard is organized around feature modules with shared UI and utility layers.

- `app/`: Expo Router screens and route groups
- `features/`: business domains such as home, payments, verification, cards, support
- `components/ui/`: shared reusable primitives
- `services/`: business logic and data shaping helpers
- `lib/`: environment, storage, auth, and low-level helpers
- `types/`: shared models used across features

## Data Flow

The app generally follows this flow:

1. route or screen component renders from `app/`
2. feature screen composes reusable UI and hooks from `features/`
3. providers/hooks coordinate state and actions
4. services and lib helpers shape data, format values, and enforce business rules

## State Management

The current codebase uses:

- feature providers for app state
- hooks for screen/dashboard composition
- React Query where server-backed snapshot access exists

Guidelines:

- keep transient UI state local to the screen/component
- move reusable state transitions into providers or dedicated helpers
- keep domain rules in services/helpers, not duplicated across screens

## Adding a New Screen

1. Add the route in `app/` if it is navigable.
2. Create the screen implementation inside the relevant `features/<domain>/components/`.
3. Reuse `AppScreen`, cards, buttons, chips, and shared tokens.
4. Add tests for any new business rules or helper logic.
5. Update docs if the new screen introduces a new pattern or domain.

## Adding a New Service

Create a service when:

- a business rule is reused in multiple places
- data needs shaping/mapping before rendering
- a feature has state transitions that should not live inside UI components

Keep services:

- framework-light
- testable
- side-effect aware
- free from rendering concerns

## Adding a New State Model

When introducing a new model:

1. define the shared type in `types/`
2. centralize status enums and related helper functions
3. keep creation/mutation logic in one provider/service layer
4. add tests for status transitions, access control, and formatting

## Architecture Boundaries

- UI components should not contain repeated business logic.
- Services should not import screen components.
- Shared primitives should stay domain-neutral.
- Feature modules should own their domain-specific composition.
