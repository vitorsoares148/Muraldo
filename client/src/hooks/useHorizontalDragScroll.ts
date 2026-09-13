import { useState, type RefObject } from "react";

export function useHorizontalDragScroll(
  scrollRef: RefObject<HTMLDivElement | null>,
) {
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  function handleMouseDown(event: React.MouseEvent) {
    if (!scrollRef.current) return;

    setIsDown(true);
    setStartX(event.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }

  function handleMouseLeaveOrUp() {
    setIsDown(false);
  }

  function handleMouseMove(event: React.MouseEvent) {
    if (!isDown || !scrollRef.current) return;

    event.preventDefault();

    const x = event.pageX - scrollRef.current.offsetLeft;
    const walk = x - startX;

    scrollRef.current.scrollLeft = scrollLeft - walk;
  }

  return {
    handleMouseDown,
    handleMouseLeaveOrUp,
    handleMouseMove,
  };
}
