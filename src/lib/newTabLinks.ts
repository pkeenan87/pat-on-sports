import { defineHastPlugin } from "satteri";

export const newTabLinks = defineHastPlugin({
  name: "new-tab-links",
  element: {
    filter: ["a"],
    visit(node, ctx) {
      ctx.setProperty(node, "target", "_blank");
      ctx.setProperty(node, "rel", "noopener noreferrer");
    },
  },
});
