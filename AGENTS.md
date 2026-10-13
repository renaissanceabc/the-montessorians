# Working in this repo

The Montessorians is an open name authority for Montessori alumni and contributors: a Next.js app in `apps/app`, a YAML dataset in `data/`, and shared packages in `packages/` (`@montessorians/*`). Use bun.

## Verify your work before calling it done

Every change that affects what the site renders gets checked in a real browser with agent-browser, not just by tests.

1. **Static checks**: `bun run check` (Ultracite), `bunx turbo run typecheck test`, and `bun run validate` when `data/` changed.
2. **Run the app** if it isn't already: `cd apps/app && bun run dev:port` (http://localhost:3010).
3. **Smoke test**: `bun run verify:ui` opens the key pages at desktop (1280px) and phone (375px) widths and fails on 404s, page or console errors, and sideways scrolling. Focus it with `bun run verify:ui -- http://localhost:3010 /contribute /maria-montessori`. Screenshots land in `.verify/`; look at the ones for pages you changed.
4. **Exercise the change itself** with agent-browser. Run `agent-browser skills get core` first, use your own session (`export AGENT_BROWSER_SESSION=...`), then `open`, `snapshot -i`, interact, check `errors` and `console`, and screenshot at both widths. For forms, try the empty, invalid, and valid paths.
5. **Report** what you verified and how, and anything you couldn't check.

## Useful skills here

- `agent-browser`: browser verification (above).
- `vercel-react-best-practices`, `vercel-composition-patterns`: React and Next.js code.
- `web-design-guidelines`, `emil-design-eng`, `mobile-native`, `break-ui`: UI review, polish, phone behavior, and worst-case data.
- `animate`, `review-animations`, `animation-performance`: motion.
- `writing-guidelines`: site copy and docs.
- `vercel-optimize`: cost and performance of the deployed site, from real Vercel metrics.
- `ultracite`: lint and format.

## Ground rules

- Never put a personal email address (the user's or anyone's) in requests to external services, in User-Agent strings or `mailto` parameters, or in scripts.
- Data changes follow `docs/editorial-policy.md`: real, verifiable sources only; never guess identifiers, dates, DOIs, or ISBNs.
- Tags come from `data/authority/tags.yaml`; add a tag there before using it.

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `bunx ultracite fix`
- **Check for issues**: `bunx ultracite check`
- **Diagnose setup**: `bunx ultracite doctor`

Oxlint + Oxfmt (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Oxlint + Oxfmt Can't Help

Oxlint + Oxfmt will catch most mechanical issues automatically. Focus your attention on:

1. **Business logic correctness** - Oxlint + Oxfmt can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Oxlint + Oxfmt. Run `bunx ultracite fix` before committing to ensure compliance.
