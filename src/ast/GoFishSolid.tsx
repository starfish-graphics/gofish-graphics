import { Component, onMount, onCleanup, type JSX } from "solid-js";
import { render as solidRender } from "solid-js/web";
import { gofish } from "./gofish";
import { type GoFishNode } from "./_node";

interface GoFishComponentProps {
  w: number;
  h: number;
  x?: number;
  y?: number;
  transform?: { x?: number; y?: number };
  debug?: boolean;
  defs?: JSX.Element[];
  children: GoFishNode;
  axes?: boolean;
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
          w: props.w,
          h: props.h,
          x: props.x,
          y: props.y,
          transform: props.transform,
          debug: props.debug,
          defs: props.defs,
          axes: props.axes,
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
