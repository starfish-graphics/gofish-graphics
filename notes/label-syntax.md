```ts
({
  label: align("x-middle", "y-middle"),
});
//
({
  label: style({ x: "middle", y: "middle", color: "red" }),
})(
  //
  {
    label: align.middle("x") + align.middle("y"),
  }
)(
  //
  {
    label: align.middle("x") + align.middle("y"),
  }
)(
  //
  {
    label: "x-middle + y-middle",
  }
)(
  //
  {
    label: "count",
  }
)(
  //
  {
    label: "count" + align("x-middle y-middle"),
  }
)(
  //
  {
    label: "count" + style("x-middle y-middle red"),
  }
);

label: ((d) => count + " (g)") + align("x-middle y-middle");
label: "count (align x-middle y-middle)";

label: label("count") + align("x-middle y-middle");

label: "count";

h: norm("count");
h: col("sales_q1") + col("sales_q2");
h: "count";
h: v(myRandomFunction(oiaenrtoeiarsotein)) + "";

label: "$key";
labelStyle: "x-middle y-middle red";
stroke: "2pt + red";
stroke: "2pt red";
```

```ts
layer([
  ...,
  chart(select("bars").when((d) => d < 10)).mark(label("count", {align: {x: "middle", y: "middle"}}))
]
)
```
