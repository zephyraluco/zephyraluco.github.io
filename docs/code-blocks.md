# Markdown code blocks

Adjacent fenced code blocks with the same `group` form a language switcher. `label` controls the tab text. Grouped examples use one toolbar with language tabs on the left and the active panel’s copy button on the right; filenames are not displayed. Standalone blocks still support `title` for filenames. Group names are local to each consecutive set of fences. A paragraph between fences starts a new example. Without JavaScript, all examples remain readable.

````markdown
```ts group="greeting" label="TypeScript"
console.log('Hello')
```

```python group="greeting" label="Python"
print('Hello')
```
````

Use the language's comment syntax for Shiki diff annotations:

````markdown
```ts
const value = 1 // [!code --]
const value = 2 // [!code ++]
```
````

Removed/added lines have red/green backgrounds and minus/plus markers. Copying includes the displayed program, without annotation comments or visual markers. Both removed and added lines remain in the copied diff example.

Blocks longer than 15 lines receive a Show all code / Collapse code footer. Language tabs support arrow keys, Home and End, and each panel keeps its own copy and collapse controls. Existing one-light / one-dark-pro syntax colors are retained.
