# Development Guidelines

## TDD — Test-Driven Development

This project follows **strict TDD principles**. All development must adhere to the Red-Green-Refactor cycle:

1. **Red** — Write a failing test first that defines the desired behavior
2. **Green** — Write the minimum code necessary to make the test pass
3. **Refactor** — Clean up the code while keeping all tests green

### Rules

- **No production code without a failing test.** Every function, feature, or bug fix starts with a test.
- **Write the simplest test that fails.** Don't over-engineer tests — one behavior per test.
- **Write the simplest code that passes.** Don't add code "just in case" — let the tests drive the design.
- **Refactor only when tests are green.** Never refactor and add new behavior at the same time.
- **Tests must run in CI.** All tests must pass in the GitHub Actions pipeline before merging.

### Test Structure

- Unit tests for the Set logic engine live in `test/`
- Tests run via `npm test`
- Test files are named `*.test.js`

### Running Tests

```bash
npm test
```
