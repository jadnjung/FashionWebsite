---
title: React 19 API Changes
impact: MEDIUM
impactDescription: cleaner component definitions and context usage
tags: react19, refs, context, hooks
---

## React 19 API Changes

> **⚠️ React 19+ only.** Skip this if you're on React 18 or earlier.

React 19 supports `ref` as a prop on function components. Existing `forwardRef` components remain supported. Context can be read with `useContext()` or `use()`.

**Existing forwardRef pattern:**

```tsx
const ComposerInput = forwardRef<TextInput, Props>((props, ref) => {
  return <TextInput ref={ref} {...props} />
})
```

**Correct (ref as a regular prop):**

```tsx
function ComposerInput({ ref, ...props }: Props & { ref?: React.Ref<TextInput> }) {
  return <TextInput ref={ref} {...props} />
}
```

**Supported top-level context read:**

```tsx
const value = useContext(MyContext)
```

**Alternative context read with use:**

```tsx
const value = use(MyContext)
```

`use()` supports conditional context reads. Keep `useContext()` calls at the top level of a component or custom Hook. Choose the API that fits the component and established project patterns. [React context documentation](https://react.dev/reference/react/useContext)
