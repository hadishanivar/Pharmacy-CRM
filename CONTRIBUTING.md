# Contributing

Thanks for considering a contribution.

## Development workflow

1. Create a branch for one focused change.
2. Install dependencies with `npm install` and configure a local PostgreSQL database using `.env.example`.
3. Keep business logic, data access, and UI presentation separated where practical.
4. Add or update tests when behavior changes.
5. Run the following checks before submitting a change:

   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```

## Pull request checklist

- [ ] The change has a clear purpose and does not remove unrelated functionality.
- [ ] No credentials, environment files, real customer data, or production exports are included.
- [ ] Validation and error states are handled where relevant.
- [ ] Manual verification steps are documented.
- [ ] Any database/schema changes are described.
