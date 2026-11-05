import { useRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useDialogFocus } from "./useDialogFocus";

function Dialog() {
  const ref = useRef(null);
  const [open, setOpen] = useState(true);
  const [count, setCount] = useState(0);
  useDialogFocus(open, ref, () => setOpen(false));
  return open && <div ref={ref} role="dialog"><button onKeyDown={(event) => { if (event.key === "ArrowRight") setCount((value) => value + 1); }}>Board square</button><button>Last control</button><output aria-label="Arrow count">{count}</output></div>;
}

test("dialog containment permits React keyboard handlers while blocking global shortcuts", () => {
  const globalKey = jest.fn();
  window.addEventListener("keydown", globalKey);
  try {
    render(<Dialog />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Board square" }), { key: "ArrowRight" });
    expect(screen.getByLabelText("Arrow count")).toHaveTextContent("1");
    expect(globalKey).not.toHaveBeenCalled();
  } finally { window.removeEventListener("keydown", globalKey); }
});

test("focus wraps in the window and Escape closes it", () => {
  render(<Dialog />);
  const first = screen.getByRole("button", { name: "Board square" }), last = screen.getByRole("button", { name: "Last control" });
  last.focus(); fireEvent.keyDown(last, { key: "Tab" }); expect(first).toHaveFocus();
  fireEvent.keyDown(first, { key: "Tab", shiftKey: true }); expect(last).toHaveFocus();
  fireEvent.keyDown(last, { key: "Escape" }); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
