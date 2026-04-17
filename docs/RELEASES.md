# Build and Release Hygiene

## Local Development

- `npm run start` for normal Expo development
- `npm run android` and `npm run ios` for device or simulator workflows
- `npm run web` for browser validation

## Quality Gate Before Release

Run:

```bash
npm run check
```

before merging or preparing a release branch/tag.

## Build Validation

For a production-style bundle sanity check:

```bash
npm run build:web
```

This is useful for CI and for catching bundling regressions early.

## Versioning

- use semantic versioning (`MAJOR.MINOR.PATCH`)
- tag releases as `vX.Y.Z`
- keep release notes focused on user-visible changes, operational changes, and migration notes

## Release Notes Checklist

Include:

- major product changes
- risky engineering changes
- environment/config changes
- rollout caveats
- follow-up work or known gaps
