import { Constraint, Layer, rect, text } from "../../../src/lib";

const fontFamily = "verdana, arial, helvetica, sans-serif";

export interface ElmTupleProps {
  tupleIndex: string;
  tupleData?: string;
}

export const elmTuple = ({ tupleIndex, tupleData }: ElmTupleProps) =>
  Layer([
    rect({ h: 60, w: 70, fill: "#ffffc6", stroke: "grey" }).name("box"),
    text({
      fontSize: 16,
      fontFamily,
      fill: "gray",
      text: tupleIndex,
    }).name("label"),
    typeof tupleData === "string"
      ? text({
          fontSize: 24,
          fontFamily,
          fill: "black",
          text: tupleData,
        }).name("val")
      : text({ fontSize: 24, fontFamily, fill: "none", text: "" }).name("val"),
  ]).constrain(({ box, label, val }) => [
    Constraint.align({ x: "middle", y: "middle" }, [val, box]),
    Constraint.align({ x: "start", y: "end" }, [label, box]),
  ]);
