import {
  createComponent,
  createName,
  Spread,
  text,
} from "../../../src/lib";
import { elmTuple } from "./elmTuple";

const fontFamily = "verdana, arial, helvetica, sans-serif";

export interface HeapObjectProps {
  objectType: string;
  objectValues: { type: string; value: string }[];
}

export const heapObject = createComponent(
  ({ objectType, objectValues }: HeapObjectProps) => {
    const elmTuplesTag = createName("elmTuples");
    return Spread(
      { direction: "y", alignment: "start", spacing: 10, reverse: true },
      [
        text({
          fontFamily,
          fontSize: 16,
          fill: "grey",
          text: objectType,
        }),
        Spread(
          { direction: "x", spacing: 0 },
          objectValues.map((elementData, index) =>
            elmTuple({
              tupleIndex: String(index),
              tupleData:
                elementData.type === "string" ? elementData.value : undefined,
            })
          )
        ).name(elmTuplesTag),
      ]
    );
  }
);
