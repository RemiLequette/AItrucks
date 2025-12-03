# Testing Guide for AItrucks Frontend

This document explains how to write and run tests for the AItrucks application.

## Table of Contents

- [Overview](#overview)
- [Unit & Integration Tests (Vitest)](#unit--integration-tests-vitest)
- [End-to-End Tests (Playwright)](#end-to-end-tests-playwright)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

## Overview

The project uses two testing frameworks:

- **Vitest + React Testing Library**: Unit and integration tests for components, utilities, and logic
- **Playwright**: End-to-end tests for complete user workflows

## Unit & Integration Tests (Vitest)

### Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once
npm run test -- --run

# Run with UI dashboard
npm run test:ui

# Run with coverage report
npm run test:coverage
```

### Test Structure

Tests are located next to the files they test with `.test.ts` or `.test.tsx` extension:

```
src/
├── components/
│   └── Table/
│       ├── Table.tsx
│       ├── Table.test.tsx          # ← Tests for Table component
│       ├── columnHelpers.tsx
│       └── columnHelpers.test.tsx  # ← Tests for column helpers
└── test/
    ├── setupTests.ts               # Global test configuration
    └── test-utils.tsx              # Custom render utilities
```

### Example Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent name="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const { user } = render(<MyComponent onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Custom Test Utilities

Use the custom `render` function from `test-utils.tsx` which provides:
- Automatic wrapping with `AuthProvider` and `BrowserRouter`
- Custom rendering options
- User event utilities

```typescript
import { render, screen } from '../../test/test-utils';

render(<MyComponent />, {
  initialRoute: '/deliveries',
  mockUser: { id: '1', role: 'admin' },
});
```

### Mocking Supabase

Example of mocking Supabase API calls:

```typescript
import { vi } from 'vitest';
import * as api from '../services/api';

// Mock the entire API module
vi.mock('../services/api', () => ({
  getDeliveries: vi.fn(() => Promise.resolve({ deliveries: [] })),
  createDelivery: vi.fn(),
}));

// In your test
it('should fetch deliveries', async () => {
  const mockDeliveries = [{ id: '1', customer_name: 'Test' }];
  vi.mocked(api.getDeliveries).mockResolvedValue({ deliveries: mockDeliveries });
  
  render(<Deliveries />);
  
  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## End-to-End Tests (Playwright)

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npm run test:e2e -- auth.spec.ts

# Run in specific browser
npm run test:e2e -- --project=chromium
```

### Test Structure

E2E tests are in the `e2e/` directory:

```
e2e/
├── auth.spec.ts       # Authentication flows
├── trips.spec.ts      # Trip management workflows
└── deliveries.spec.ts # Delivery CRUD operations
```

### Example E2E Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Delivery Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should create a new delivery', async ({ page }) => {
    await page.goto('/deliveries');
    
    await page.click('button:has-text("New Delivery")');
    await page.fill('input[name="customer_name"]', 'John Doe');
    await page.fill('input[name="delivery_address"]', '123 Main St');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText('John Doe')).toBeVisible();
  });
});
```

### Authentication in E2E Tests

For tests requiring authentication, you have two options:

**Option 1: Login in beforeEach** (shown above)

**Option 2: Use storage state** (faster, recommended for many tests)

```typescript
// Create auth-setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
  await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
  
  // Save authenticated state
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});

// In playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

## Writing Tests

### What to Test

**Unit Tests:**
- Pure functions and utilities
- Component rendering with different props
- User interactions (clicks, typing, etc.)
- Conditional rendering logic
- Error states

**Integration Tests:**
- Component interactions
- Form submissions
- Data fetching and display
- Navigation flows

**E2E Tests:**
- Critical user journeys
- Authentication flows
- Multi-step processes (create trip → assign deliveries → reorder)
- Cross-page workflows

### What NOT to Test

- Implementation details (how something works internally)
- Third-party libraries (Supabase, React Router, etc.)
- Styling and CSS (unless critical to functionality)
- Overly simple components (just JSX with no logic)

## Best Practices

### 1. Test User Behavior, Not Implementation

❌ Bad:
```typescript
expect(component.state.count).toBe(5);
```

✅ Good:
```typescript
expect(screen.getByText('Count: 5')).toBeInTheDocument();
```

### 2. Use Accessible Queries

Prefer queries that mirror how users interact:

```typescript
// Priority order:
screen.getByRole('button', { name: /submit/i })  // Best
screen.getByLabelText('Email')                    // Good
screen.getByPlaceholderText('Enter email')        // OK
screen.getByTestId('submit-button')               // Last resort
```

### 3. Avoid Testing Implementation Details

❌ Bad:
```typescript
expect(wrapper.find('Button').props().onClick).toBeDefined();
```

✅ Good:
```typescript
await user.click(screen.getByRole('button'));
expect(handleClick).toHaveBeenCalled();
```

### 4. Keep Tests Independent

Each test should be able to run alone:

```typescript
// ❌ Tests depend on each other
test('create user', () => { /* creates user with ID 1 */ });
test('update user', () => { /* assumes user 1 exists */ });

// ✅ Each test is independent
test('create user', () => { /* creates and cleans up */ });
test('update user', () => { /* creates user, updates, cleans up */ });
```

### 5. Use Descriptive Test Names

```typescript
// ❌ Vague
test('it works', () => {});

// ✅ Specific
test('should display error message when email is invalid', () => {});
```

### 6. Mock External Dependencies

```typescript
// Mock Supabase
vi.mock('../config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));
```

### 7. Test Edge Cases

```typescript
describe('DeliveryForm', () => {
  it('should handle valid input');
  it('should show error for empty fields');
  it('should show error for invalid email');
  it('should disable submit while loading');
  it('should handle API errors gracefully');
});
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test -- --run
      - run: npm run test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Coverage Reports

After running `npm run test:coverage`, open `coverage/index.html` in your browser to see detailed coverage reports.

**Coverage Goals:**
- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

## Debugging Tests

### Vitest

```bash
# Run specific test file
npm test -- Table.test.tsx

# Run tests matching pattern
npm test -- --grep="should render"

# Debug in VS Code
# Add breakpoint, then run "Debug: JavaScript Debug Terminal"
npm test
```

### Playwright

```bash
# Run with browser visible
npm run test:e2e:headed

# Interactive UI mode
npm run test:e2e:ui

# Debug mode (pauses on failure)
npm run test:e2e -- --debug

# VS Code debugging
# Use Playwright extension or debug configuration
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Questions or Issues?** Check the test examples in `src/components/Table/` or ask the team!
