import { Component, onMount, onCleanup, type JSX } from "solid-js";
import { render as solidRender } from "solid-js/web";
import { gofish } from "./gofish";
import { type GoFishNode } from "./_node";

interface GoFishComponentProps {
  width: number;
  height: number;
  transform?: { x?: number; y?: number };
  debug?: boolean;
  defs?: JSX.Element[];
  children: GoFishNode;
}

export const GoFishSolid: Component<GoFishComponentProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;

  onMount(() => {
    if (containerRef) {
      // Clear the container first
      containerRef.innerHTML = "";

      // Call the gofish function with the container
      gofish(
        containerRef,
        {
          width: props.width,
          height: props.height,
          transform: props.transform,
          debug: props.debug,
          defs: props.defs,
        },
        props.children
      );
    }
  });

  onCleanup(() => {
    // Clean up any SolidJS renders when component unmounts
    if (containerRef) {
      containerRef.innerHTML = "";
    }
  });

  return <div ref={containerRef} />;
};
