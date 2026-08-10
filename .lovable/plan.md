Fix the missing gear icon for Google Sheet config

1. SheetConfig.tsx exists in `src/components/` but is never mounted in `App.tsx`. The settings gear icon is therefore missing from the entire app.
2. Add the `<SheetConfig />` component to `App.tsx` inside the router/providers so it renders on every route.
3. Verify the fixed positioning does not collide with the mobile bottom navigation (`MobileBottomNav`) and adjust the button placement if needed (`bottom-20` on mobile already accounts for a bottom bar, but confirm it is visible on all viewports).
4. After the gear icon is visible, continue with the calendar URL fix for grade 6 (separate follow-up step: update the `CALENDAR_URL_GRADE_6` backend secret).
