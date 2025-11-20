# Python Wrapper: How It Will Work

1. We construct an API on the Python side that mirrors the JS API.
2. We convert the Python API to a JSON IR that is then translated to JS. This IR contains the
   standard library. We use Apache Arrow to marshal the dataset.
3. This IR is converted to JS GoFish library calls.

## Async/Await

- In the Python API, the function in `derive` is a Python function. This function is called in
  between other operators that are running in JS. Thus we need to make an RPC from JS to evaluate
  it.
- This requires us to introduce async on the JS side, which will color the whole program. We now
  need to async/await the whole program. This is fine even if I don't love it. Maybe we will revisit
  this decision later, but this seems like the easiest way to get things working.

## Runtime Environments and RPC

We need to pick our runtime environments for Python and JS. This will also affect how we do RPC. For
now I think it's easiest to assume a Jupyter Notebook or equivalent, similar to Altair's
JupyterChart(? double check).
