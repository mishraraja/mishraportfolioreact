import { ArrayView } from "./views/ArrayView";
import { GridView } from "./views/GridView";
import { TreeView } from "./views/TreeView";
import { ListView } from "./views/ListView";
import { GraphView } from "./views/GraphView";
import { IntervalView } from "./views/IntervalView";
import { MapView, StackView, TextView, BitsView } from "./views/SmallViews";
import "./Stage.css";

const VIEWS = {
  array: ArrayView,
  grid: GridView,
  tree: TreeView,
  list: ListView,
  graph: GraphView,
  intervals: IntervalView,
  map: MapView,
  stack: StackView,
  text: TextView,
  bits: BitsView,
};

/**
 * Draws one frame. Panels keep the same React identity from frame to frame
 * (type + label + slot), so cells, pointers and nodes animate between states
 * instead of being torn down and redrawn.
 */
export function Stage({ panels }) {
  return (
    <div className="stage">
      {panels.map((panel, i) => {
        const View = VIEWS[panel.type];
        if (!View) return null;
        return (
          <section key={panel.type + ":" + panel.label + ":" + i} className={"stage__panel stage__panel--" + panel.type}>
            <h4 className="stage__label">{panel.label}</h4>
            <View panel={panel} />
          </section>
        );
      })}
    </div>
  );
}
