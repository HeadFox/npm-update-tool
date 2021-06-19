# WIP (Not production ready)

The documentation will be updated and tests added

# npm-update-tool (npmut)

npm-update-tool was build to solve dependencies update problem in @meilleursagents workflow.
It use [ncu](https://github.com/raineorshine/npm-check-updates 'ncu') to check dependencies update and supercharge it with a bunch of useful feature to keep you free from any manual action when upgrading your dependencies.

## Workflow

1. Run lint/test/types check(ts)/build
2. Check outdated dependencies
3. Update dependency (loop on all dependency)
   a. Run quality tests (depending on the dependency category)
   b. If pass -> Commit changes
   c. If fail -> Revert changes + save log under npm-update-tool folder
4. Generate a `update.md` file to use in your PR comment

## How to use it ?

Go in your repo folder and run:

```bash
npx npm-update-tool
```

## Config file

You can create a `.npmutrc.js` at the same level of your `package.json` file to override default commands + options.

If true, this option will run tsc check after every update.

```typescript
typescript: boolean; // Default: true
```

---

These commands are run after updating a dependency. You can specify anything you want

```typescript
commands: {
  lint: string; // Default: 'npm run lint:fix'
  test: string; // Default: 'npm run test'
  build: string; // Default: 'npm run build'
}
```

---

These filters will be used to run the specify command if your dependency name contain one of the word in the array

```typescript
  commandsFilter: {
    lint: Array<string>; // Default: ['prettier', 'eslint', 'stylelint'];
    build: Array<string>; //Default: ['typescript', 'react-scripts', 'next', 'rollup'];
  };
```

---

Categories option is used to group updates in the generated `update.md` file.

```typescript
categories: Array<string>; // Default: ['babel', 'eslint','testing-library', '@types'];
```

## Future options

Define in an array dependencies you want to exclude from update check

```typescript
excludes?: Array<string>; // Default: undefined
```

Define in an array dependencies you want to exclude for quality test

```typescript
qualityExcludes?: Array<string>; //Default: undefined
```

The MIT License (MIT)

Copyright (c) [2021] [npm-update-tool]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
