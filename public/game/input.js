const keys = new Set();
const justPressed = new Set();
const justReleased = new Set();

window.addEventListener("keydown", (e) => {
  if (!keys.has(e.code)) justPressed.add(e.code);
  keys.add(e.code);
  // prevent arrow key page scroll
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) {
    e.preventDefault();
  }
});

window.addEventListener("keyup", (e) => {
  keys.delete(e.code);
  justReleased.add(e.code);
});

export const Input = {
  isDown(code) { return keys.has(code); },
  wasPressed(code) { return justPressed.has(code); },
  wasReleased(code) { return justReleased.has(code); },
  // Call once per frame at end of update
  flush() {
    justPressed.clear();
    justReleased.clear();
  },
  // Directional helpers
  get left()  { return keys.has("ArrowLeft")  || keys.has("KeyA"); },
  get right() { return keys.has("ArrowRight") || keys.has("KeyD"); },
  get up()    { return keys.has("ArrowUp")    || keys.has("KeyW"); },
  get down()  { return keys.has("ArrowDown")  || keys.has("KeyS"); },
  // Action
  get confirm() { return justPressed.has("Enter") || justPressed.has("Space"); },
  get cancel()  { return justPressed.has("Escape"); },
  get num1()    { return justPressed.has("Digit1"); },
  get num2()    { return justPressed.has("Digit2"); },
  get num3()    { return justPressed.has("Digit3"); },
  get num4()    { return justPressed.has("Digit4"); },
};
