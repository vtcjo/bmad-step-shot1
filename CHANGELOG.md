# Changelog

All notable changes and fixes to the StepShot Testing Application.

## Summary

This changelog documents critical bug fixes and improvements made to the StepShot MVP testing application. Key achievements include resolving Next.js bundling issues with Selenium WebDriver, implementing proper error handling for test runs, ensuring data persistence during development hot-reloads, and successfully integrating real Chrome browser automation with screenshot capture capabilities.

---

## [Unreleased] - 2026-02-20

### Fixed

#### Critical: Module Bundling Error (fs/promises)
- **Issue**: `Module not found: Can't resolve 'fs/promises'` error when importing selenium-webdriver in client-side code
- **Root Cause**: selenium-webdriver was being imported in `lib/store.ts`, which is used by client-side pages, causing Next.js to attempt bundling Node.js-only modules for the browser
- **Solution**: 
  - Created separate `lib/runner.ts` file for server-side only WebDriver logic
  - Moved all Selenium WebDriver imports and runner functions to `lib/runner.ts`
  - Updated `lib/store.ts` to only handle data management (client-safe)
  - Modified `pages/api/run.ts` to import runner from the server-side only module
- **Files Changed**: `lib/store.ts`, `lib/runner.ts` (new), `pages/api/run.ts`

#### Critical: Run Details 404 Errors
- **Issue**: Frontend attempting to fetch run data resulted in 404 errors and "Cannot read properties of undefined (reading 'map')" crashes
- **Root Cause**: API returning error objects without `steps` property, causing undefined access in component
- **Solution**:
  - Added proper HTTP response status checking in `useEffect`
  - Implemented validation for `run.steps` existence before rendering
  - Created user-friendly error UI with "Run not found" message and back button
  - Added early return for 404 responses to prevent crash
- **Files Changed**: `pages/run/[runId].tsx`

#### Critical: Hot Module Reload Data Loss
- **Issue**: In-memory store (scripts and runs) being wiped on every Fast Refresh during development, causing 404 errors for newly created runs
- **Root Cause**: Next.js Hot Module Reload (HMR) reinitializing the module scope, clearing the Map instances
- **Solution**:
  - Attached stores to Node.js `global` object in development mode
  - Added TypeScript global declaration for type safety
  - Implemented conditional preservation: only in development, not production
  - Store now survives all hot reloads during active development
- **Files Changed**: `lib/store.ts`

#### Critical: WebDriver Initialization Hanging
- **Issue**: Runner stuck at "Attempting to initialize WebDriver" without progressing or falling back to simulation
- **Root Cause**: Missing `new` keyword when calling `webdriver.Builder()` constructor, causing synchronous error
- **Solution**:
  - Added `new` keyword before `webdriver.Builder()` calls for both Chrome and Firefox
  - Wrapped driver initialization in dedicated try-catch block
  - Made `driver.build()` properly awaitable
  - Added immediate fallback check: if selenium-webdriver module not found, skip to simulation
  - Configured ChromeDriver path from installed npm package
- **Files Changed**: `lib/runner.ts`

### Improved

#### Enhanced Error Handling and Debugging
- **Runner Module**:
  - Added comprehensive console logging throughout execution flow
  - Log messages include: run start, WebDriver initialization attempts, step execution progress, completion status
  - Better error messages showing exact failure points (e.g., "Failed to build WebDriver: [reason]")
  - Async error handling with `.catch()` wrapper in API route
- **Store Module**:
  - Added debug logging for `createRun()` showing run ID and store size
  - Added debug logging for `getRun()` showing whether run was found and current store size
  - Helpful for troubleshooting data persistence and retrieval issues
- **Files Changed**: `lib/runner.ts`, `lib/store.ts`, `pages/api/run.ts`

#### Better Chrome Browser Integration
- **ChromeDriver Path Configuration**:
  - Automatically detects and uses ChromeDriver from installed npm package
  - Falls back gracefully to system PATH if package not found
  - Eliminates manual PATH configuration for developers
- **Chrome Launch Arguments**:
  - Added `--no-sandbox` for running in restricted environments
  - Added `--disable-dev-shm-usage` to prevent /dev/shm memory issues
  - Added `--disable-gpu` for better headless compatibility
  - Improves stability across different development environments
- **Files Changed**: `lib/runner.ts`

#### Improved Simulation Fallback
- **Visible Placeholder Screenshots**:
  - Replaced invisible 1x1 pixel PNG with 320x180 SVG images
  - SVG displays "Simulated Screenshot" text with step number and action name
  - Provides visual feedback in UI even when real browser automation is unavailable
  - Uses base64-encoded SVG for inline embedding
- **Better Fallback Flow**:
  - Early detection if selenium-webdriver is not installed
  - Immediate fallback to simulation without waiting
  - Clear console logging indicating fallback reason
- **Files Changed**: `lib/runner.ts`

### Added

#### New Utility Functions
- **`updateRunState(run: Run): void`** in `lib/store.ts`:
  - Exported helper for runner to update run state
  - Provides clean API for persisting run changes during execution
  - Used by both real and simulated runners
- **`generatePlaceholderScreenshot(stepNum: number, action: string): string`** in `lib/runner.ts`:
  - Generates visible SVG placeholder screenshots
  - Shows step information in the image
  - Returns base64-encoded data URI for direct embedding

### Technical Details

#### Architecture Changes
- **Separation of Concerns**: Client-safe store operations now completely separated from server-only WebDriver operations
- **Enhanced Resilience**: Application gracefully handles missing dependencies and falls back to simulation
- **Developer Experience**: Hot reload data persistence eliminates need for constant re-creation of test data

#### Dependencies Verified
- `selenium-webdriver`: 4.40.0
- `chromedriver`: 145.0.3
- `geckodriver`: 6.1.0

All dependencies properly installed and integrated.

---

## Notes

### Development Mode vs Production
- Store persistence via `global` object only active in development (`process.env.NODE_ENV !== 'production'`)
- Production builds will use standard in-memory storage (consider database integration for production)

### Browser Support
- Chrome/Chromium: Fully supported with automatic driver detection
- Firefox: Supported with geckodriver package
- Headless mode: Configurable via script settings

### Future Considerations
- Consider persistent storage (database) for production use
- Add support for additional browsers (Safari, Edge)
- Implement run cleanup/archival for long-running instances
- Add retry logic for flaky tests
