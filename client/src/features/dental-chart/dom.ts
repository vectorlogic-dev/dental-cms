export function qs<T extends Element>(root: ParentNode, sel: string): T {
  const element = root.querySelector(sel);
  if (!element) {
    throw new Error(`Expected element not found: ${sel}`);
  }
  return element as T;
}

export function qsa<T extends Element>(root: ParentNode, sel: string): T[] {
  return Array.from(root.querySelectorAll(sel)) as T[];
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  return element;
}
