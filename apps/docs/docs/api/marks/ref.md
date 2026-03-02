# ref

References another node by name or by direct `GoFishNode`. Used to build overlays or connectors.

## Signature

```ts
ref(nodeOrName: string | GoFishNode | { __ref: GoFishNode })
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `nodeOrName` | `string \| GoFishNode \| { __ref: GoFishNode }` | The node to reference — either a string key, a node directly, or a wrapped reference |

## Examples

```ts
// Reference a named node by string key
ref("myNode")

// Reference a node directly
ref(someNode)
```
