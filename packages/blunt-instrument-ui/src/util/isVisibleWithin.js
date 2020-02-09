/**
 * Determines whether an element is currently visible within a scrollable ancestor.
 * @param {*} target the element you want to be visible
 * @param {*} container the scrollable ancestor element
 * @param {*} min the minimum number of pixels of target that need to be visible
 * @returns {boolean} true if the minimum number of pixels is visible
 */
export default function isVisibleWithin(target, container, min = 5) {
  const tr = target.getBoundingClientRect();
  const cr = container.getBoundingClientRect();
  return !(
    cr.bottom - min < tr.top
    || cr.top + min > tr.bottom
    || cr.right - min < tr.left
    || cr.left + min > tr.right
  );
}
