import { Constraint, Layer, rect, Spread, text } from "../../../src/lib";

const fontFamily = "verdana, arial, helvetica, sans-serif";

export interface StackSlotProps {
  variable: string;
  value?: string;
}

export const stackSlot = ({ variable, value }: StackSlotProps) =>
  Spread({ direction: "x", alignment: "middle", spacing: 5 }, [
    text({
      fontSize: 24,
      fontFamily,
      text: variable,
    }).name("variable"),
    Layer([
      rect({ h: 40, w: 40, fill: "#e2ebf6" }).name("box"),
      rect({ h: 2, w: 40, fill: "#a6b3b6" }).name("boxBorderBottom"),
      rect({ h: 40, w: 2, fill: "#a6b3b6" }).name("boxBorderLeft"),
      typeof value === "string"
        ? text({
            fontSize: 24,
            fontFamily,
            text: value,
          }).name("value")
        : text({ fontSize: 24, fontFamily, fill: "none", text: "" }).name(
            "value"
          ),
    ]).constrain(({ box, boxBorderBottom, boxBorderLeft, value }) => [
      Constraint.align({ x: "middle", y: "middle" }, [box, value]),
      Constraint.align({ x: "middle", y: "start" }, [box, boxBorderBottom]),
      Constraint.align({ x: "start", y: "middle" }, [box, boxBorderLeft]),
    ]),
  ]);
