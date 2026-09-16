# Testing React Native apps

## Detect the setup

- `package.json` and `jest.config.*`: Jest with the `react-native` preset, or `jest-expo` in Expo projects; the `test` script.
- Libraries: `@testing-library/react-native` (React Native Testing Library), network mocking (MSW or mocked API modules), E2E with Detox or Maestro.
- Setup files (`jest.setup.*`) and existing mocks for native modules (`__mocks__/`, `jest.mock` calls).
- State and data libraries under test — TanStack Query, Redux Toolkit, Zustand — and their test helpers.

## Logic, hooks and stores

- Pure TypeScript modules are tested with plain Jest.
- Hooks: `renderHook` from React Native Testing Library, with the providers the hook needs as `wrapper`.
- TanStack Query: create a new `QueryClient` per test with `retry: false`, so failures surface immediately.
- Redux Toolkit: build a real store with the reducers under test instead of mocking `useSelector`.

## Component tests

```tsx
import { render, screen, userEvent } from '@testing-library/react-native';

jest.mock('../api/auth', () => ({ login: jest.fn() }));
const { login } = jest.requireMock('../api/auth');

test('shows the home greeting after a valid login', async () => {
  login.mockResolvedValue({ name: 'Ana' });
  const user = userEvent.setup();
  render(<LoginScreen />, { wrapper: AppProviders });

  await user.type(screen.getByLabelText('Email'), 'ana@example.com');
  await user.type(screen.getByLabelText('Password'), 'secret');
  await user.press(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByText('Hello, Ana')).toBeOnTheScreen();
});
```

- Query by role, label or text — what users and screen readers see. `testID` is the last resort.
- `findBy*` and `waitFor` for async results; no manual timeouts.
- `userEvent` simulates real interactions; `fireEvent` is the lower-level fallback.
- Avoid whole-screen snapshots as the main assertion: they break on harmless changes and get updated blindly.
- The names above are illustrative, and the matchers depend on the installed library version.

## Native modules and navigation

- Native modules have no implementation under Jest. Use the mocks libraries ship (many document a `jest` mock, including React Native Firebase modules and AsyncStorage), or `jest.mock` them in the setup file.
- Screens that use React Navigation hooks need a `NavigationContainer` in the wrapper, or test the screen's content component with props instead.
- Transform errors (`SyntaxError: Cannot use import statement outside a module`) come from untranspiled `node_modules` packages; add them to `transformIgnorePatterns` as the preset documents.

## End-to-end

- **Detox**: gray-box tests that sync with the app's idle state. It needs a build configuration per platform (`.detoxrc.js`), then `detox build` and `detox test` against a simulator or emulator.
- **Maestro**: black-box YAML flows (`appId`, `launchApp`, `tapOn`, `assertVisible`) run with `maestro test`, against a built app.
- Give elements stable accessibility labels or `testID`s for E2E selectors, and keep E2E suites to critical journeys.

## Commands

```bash
npm test                                   # or the project's package manager and script
npx jest src/features/login                # one folder or file
npx jest --coverage
```
