// MySandbox.tsx
import { defineComponent } from "vue";
import { Sandbox, sandboxProps } from "vitepress-plugin-sandpack";

/**
 * extends from Sandbox.
 * Compared to VUE single file, it is simple and straightforward.
 */
export const StarfishLive = defineComponent({
  name: "StarfishLive",
  props: sandboxProps,
  setup(props, { slots }) {
    return () => (
      <Sandbox
        {...props}
        options={{
          showLineNumbers: true,
        }}
        customSetup={{
          deps: {
            "gofish-graphics": "latest",
          },
        }}
      >
        {slots?.default ? slots.default() : null}
      </Sandbox>
    );
  },
});
