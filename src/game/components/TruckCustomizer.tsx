import { useState, useRef, useCallback } from 'react';

export interface TruckCustomizationConfig {
  width: number; // px
  topOffset: number; // px from top
  leftOffset: number; // px from left (center relative)
}

const DEFAULT_CONFIG: TruckCustomizationConfig = {
  width: 80,
  topOffset: 0,
  leftOffset: 50, // center
};

const STORAGE_KEY = 'bloomy_truck_customization';

export function loadTruckCustomizationConfig(): TruckCustomizationConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TruckCustomizationConfig;
      return parsed;
    }
  } catch {}
  return DEFAULT_CONFIG;
}

export function saveTruckCustomizationConfig(config: TruckCustomizationConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

interface Props {
  onClose: () => void;
}

const btnBase = {
  padding: '6px 10px',
  background: '#E8A87C',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#FFF',
};

export function TruckCustomizer({ onClose }: Props) {
  const [config, setConfig] = useState<TruckCustomizationConfig>(() => loadTruckCustomizationConfig());
  const [draggingTruck, setDraggingTruck] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const truckDragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  const handleTruckDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    truckDragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: config.leftOffset,
      offsetY: config.topOffset,
    };
    setDraggingTruck(true);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingTruck || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = e.clientX - truckDragStartRef.current.x;
      const dy = e.clientY - truckDragStartRef.current.y;

      const newLeftOffset = Math.max(0, Math.min(100, truckDragStartRef.current.offsetX + (dx / rect.width) * 100));
      const newTopOffset = Math.max(0, truckDragStartRef.current.offsetY + dy);

      setConfig((prev) => ({
        ...prev,
        leftOffset: newLeftOffset,
        topOffset: newTopOffset,
      }));
    },
    [draggingTruck],
  );

  const handlePointerUp = useCallback(() => {
    setDraggingTruck(false);
  }, []);

  const handleSave = () => {
    saveTruckCustomizationConfig(config);
    onClose();
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/bloomy_shop_background.png)',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center top',
        zIndex: 300,
        touchAction: 'none',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* ── Grid overlay ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {Array.from({ length: 21 }, (_, i) => i * 5).map((pos) => (
          <div key={`g${pos}`}>
            <div
              style={{
                position: 'absolute',
                left: `${pos}%`,
                top: 0,
                bottom: 0,
                width: '1px',
                background: 'rgba(255,0,0,0.18)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: `${pos}%`,
                left: 0,
                right: 0,
                height: '1px',
                background: 'rgba(255,0,0,0.18)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '3px',
                left: `${pos}%`,
                transform: 'translateX(-50%)',
                fontSize: '8px',
                color: '#FF0000',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
              }}
            >
              X{pos}
            </div>
            <div
              style={{
                position: 'absolute',
                left: '3px',
                top: `${pos}%`,
                transform: 'translateY(-50%)',
                fontSize: '8px',
                color: '#FF0000',
                fontWeight: 'bold',
              }}
            >
              Y{pos}
            </div>
          </div>
        ))}
      </div>

      {/* ── Draggable Truck Preview ── */}
      <div
        style={{
          position: 'absolute',
          top: config.topOffset,
          left: `${config.leftOffset}%`,
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: draggingTruck ? 'grabbing' : 'grab',
          pointerEvents: 'all',
        }}
        onPointerDown={handleTruckDragStart}
      >
        <img
          src="/delivery-truck.png"
          alt="Truck Preview"
          style={{
            width: config.width,
            height: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
            userSelect: 'none',
          }}
        />
      </div>

      {/* ── Control panel ── */}
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.97)',
          borderRadius: '14px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          minWidth: '280px',
          zIndex: 10,
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>
          🚚 Truck Customizer
        </div>
        <div style={{ fontSize: '10px', color: '#777', textAlign: 'center' }}>
          Drag the truck to reposition · use controls to resize
        </div>

        {/* Width control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <button
            onClick={() => setConfig((p) => ({ ...p, width: Math.max(40, p.width - 10) }))}
            style={btnBase}
          >
            −
          </button>
          <span style={{ fontSize: '12px', flex: 1, textAlign: 'center' }}>
            Size: {config.width}px
          </span>
          <button
            onClick={() => setConfig((p) => ({ ...p, width: Math.min(200, p.width + 10) }))}
            style={btnBase}
          >
            +
          </button>
        </div>

        {/* Top offset control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <button
            onClick={() =>
              setConfig((p) => ({ ...p, topOffset: Math.max(0, p.topOffset - 10) }))
            }
            style={btnBase}
          >
            −
          </button>
          <span style={{ fontSize: '12px', flex: 1, textAlign: 'center' }}>
            Top Gap: {config.topOffset}px
          </span>
          <button
            onClick={() =>
              setConfig((p) => ({ ...p, topOffset: Math.min(300, p.topOffset + 10) }))
            }
            style={btnBase}
          >
            +
          </button>
        </div>

        {/* Position info */}
        <div style={{ fontSize: '10px', color: '#999', textAlign: 'center' }}>
          Position: {Math.round(config.leftOffset)}% from left
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '8px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: '#999',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#FFF',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: '#6A9A50',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#FFF',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
