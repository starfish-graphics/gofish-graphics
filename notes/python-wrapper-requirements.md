# Requirements

- must support `derive` lambdas that can execute in Python
- lambdas must be run in the flow (they cannot be batched at the beginning), because
  earlier operators do data transforms before the data is received by `derive`
- Must do client side rendering to support interactivity
- No dynamic package loading so it can run offline

## Implementation Suggestions

- Use Apache Arrow to serialize data between Python and JS
- Python-JS interop introduces async calls. To mitigate the effect of this so the whole program
  doesn't become wrapped in async/await everywhere, we can use some of solidjs's primitives
  - Specifically, use createResource to wrap the async call to Python and use Suspense in gofish.tsx
    to handle the async part.
