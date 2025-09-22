import { useBusSimulator } from "@/context/BusSimulatorContext";
import { useState, useRef, useEffect, useCallback } from "react";

interface BottomDrawerProps {
  children: React.ReactNode;
  minHeight?: number;
  maxHeight?: number;
}

const BottomDrawer = ({
  children,
  minHeight = 190,
  maxHeight: propMaxHeight,
}: BottomDrawerProps) => {
  const { trackingBusStop } = useBusSimulator()

  useEffect(() => {
		const body = document.body;
		body.style.overflow = "hidden";

		return () => {
			body.style.overflow = "auto";
		};
	}, []);
  const [drawerHeight, setDrawerHeight] = useState(minHeight);
  const [maxHeight, setMaxHeight] = useState(minHeight);
  const [isDragging, setIsDragging] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const startY = useRef(0);
  const startHeight = useRef(minHeight);

  useEffect(() => {
    if (trackingBusStop.active) {
      setDrawerHeight(minHeight)
    }
  },[trackingBusStop])

  useEffect(() => {
    const calculated = propMaxHeight ?? window.innerHeight - 100;
    setMaxHeight(calculated);
    setDrawerHeight(minHeight);
  }, [propMaxHeight, minHeight]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    startHeight.current = drawerHeight;

    drawerRef.current?.style.setProperty("transition", "none");
  }, [drawerHeight]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    const deltaY = startY.current - e.touches[0].clientY;
    const newH = Math.min(
      maxHeight,
      Math.max(minHeight, startHeight.current + deltaY)
    );
    setDrawerHeight(newH);

    e.preventDefault();
  }, [isDragging, maxHeight, minHeight]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    drawerRef.current?.style.setProperty("transition", "height 0.2s ease-out");

    const threshold = window.innerHeight / 1.5;
    if (drawerHeight >= threshold) {
      setDrawerHeight(maxHeight);
    } else {
      setDrawerHeight(minHeight);
    }
  }, [drawerHeight, maxHeight, minHeight]);


  useEffect(() => {
    const h = handleRef.current;
    if (!h) return;

    h.addEventListener("touchstart", handleTouchStart, { passive: false });
    h.addEventListener("touchmove", handleTouchMove, { passive: false });
    h.addEventListener("touchend", handleTouchEnd);

    return () => {
      h.removeEventListener("touchstart", handleTouchStart);
      h.removeEventListener("touchmove", handleTouchMove);
      h.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={drawerRef}
      style={{ height: `${drawerHeight}px` }}
      className="hidden max-md:block fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg overflow-hidden transition-[height] duration-200 ease-out z-20"
    >

      <div
        ref={handleRef}
        className="w-full flex justify-center py-5 touch-none"
        style={{ touchAction: "none" }}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>


      <div
        className="flex-1 h-[calc(100%-40px)] overflow-y-auto"
        style={{

          overflowY: drawerHeight === maxHeight ? "auto" : "hidden",
          touchAction: "pan-y",
          overscrollBehavior: "contain",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default BottomDrawer;