# grid-core

The files in this directory are a vendored and trimmed copy of the framework-agnostic core of **react-grid-layout** (v2).

- Upstream project: https://github.com/react-grid-layout/react-grid-layout
- Upstream version: 2.2.3
- Copied from: `src/core/*`

Only the pure layout algorithms are vendored (layout manipulation, collision detection, compaction, grid<->pixel calculation, constraints, resize direction math). The React bindings (`react-draggable` / `react-resizable` based) are NOT copied; the UI Kit provides its own React layer built on `@tenphi/tasty` and React Aria.

Local modifications:

- Removed `.js` import extensions (project uses `moduleResolution: bundler`).
- Trimmed unused type exports (React-specific event/config/responsive/position strategy types) that the UI Kit layer does not use.

## License

react-grid-layout is distributed under the MIT License.

```
The MIT License (MIT)

Copyright (c) 2016 Samuel Reed

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
```
