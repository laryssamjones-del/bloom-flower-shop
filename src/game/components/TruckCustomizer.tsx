import { useState, useRef, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';

// Mobile ratio constraints (9:16)
const MOBILE_RATIO = 9 / 16; // 0.5625
const MOBILE_SAFE_AREA_WIDTH = MOBILE_RATIO * 100; // ~56.25% of viewport width
const MOBILE_MIN_RIGHT = (100 - MOBILE_SAFE_AREA_WIDTH) / 2; // ~21.875%
const MOBILE_MAX_RIGHT = MOBILE_MIN_RIGHT + MOBILE_SAFE_AREA_WIDTH; // ~78.125%

export interface TruckCustomizationConfig {
  width: number; // px
  topOffset: number; // px from top
  rightOffset: number; // % from right
}

const DEFAULT_CONFIG: TruckCustomizationConfig = {
  width: 80,
  topOffset: 0,
  rightOffset: 10, // 10% from right
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

function saveToLocalStorage(config: TruckCustomizationConfig) {
  try {
    const json = JSON.stringify(config);
    localStorage.setItem(STORAGE_KEY, json);
    console.log('✓ Truck config saved to localStorage:', json);
  } catch (err) {
    console.error('✗ Failed to save Truck config to localStorage:', err);
  }
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
  const storedConfig = useGameStore((s) => s.truckCustomizationConfig);
  const [config, setConfig] = useState<TruckCustomizationConfig>(() =>
    storedConfig || loadTruckCustomizationConfig()
  );
  const [draggingTruck, setDraggingTruck] = useState(false);
  const [draggingPanel, setDraggingPanel] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const truckDragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const panelDragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const saveTruckCustomizationConfig = useGameStore((s) => s.saveTruckCustomizationConfig);

  const handleTruckDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    truckDragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: config.rightOffset,
      offsetY: config.topOffset,
    };
    setDraggingTruck(true);
  };

  const handlePanelDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    panelDragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: panelPosition.x,
      posY: panelPosition.y,
    };
    setDraggingPanel(true);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (draggingPanel) {
        const dx = e.clientX - panelDragStartRef.current.x;
        const dy = e.clientY - panelDragStartRef.current.y;
        setPanelPosition({
          x: panelDragStartRef.current.posX + dx,
          y: panelDragStartRef.current.posY + dy,
        });
      } else if (draggingTruck) {
        const dx = e.clientX - truckDragStartRef.current.x;
        const dy = e.clientY - truckDragStartRef.current.y;

        // Use viewport width for percentage calculation to match delivery overlay positioning
        const viewportWidth = window.innerWidth;
        const percentageChange = (dx / viewportWidth) * 100;
        const newRightOffset = Math.max(
          MOBILE_MIN_RIGHT,
          Math.min(MOBILE_MAX_RIGHT, truckDragStartRef.current.offsetX - percentageChange)
        );
        const newTopOffset = Math.max(0, truckDragStartRef.current.offsetY + dy);

        setConfig((prev) => ({
          ...prev,
          rightOffset: newRightOffset,
          topOffset: newTopOffset,
        }));
      }
    },
    [draggingTruck, draggingPanel],
  );

  const handlePointerUp = useCallback(() => {
    setDraggingTruck(false);
    setDraggingPanel(false);
  }, []);

  const handleSave = () => {
    // Save to both localStorage (for quick loading) and game store (for persistence)
    saveToLocalStorage(config);
    saveTruckCustomizationConfig({
      width: config.width,
      topOffset: config.topOffset,
      rightOffset: config.rightOffset,
    });
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
          right: `${config.rightOffset}%`,
          transform: 'translateX(50%)',
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
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${panelPosition.x}px), calc(-50% + ${panelPosition.y}px))`,
          background: 'rgba(255,255,255,0.97)',
          borderRadius: '14px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          minWidth: '280px',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#333',
            cursor: draggingPanel ? 'grabbing' : 'grab',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'background 0.2s',
            userSelect: 'none',
          }}
          onPointerDown={handlePanelDragStart}
        >
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

        {/* Right offset control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <button
            onClick={() =>
              setConfig((p) => ({ ...p, rightOffset: Math.max(MOBILE_MIN_RIGHT, p.rightOffset - 2) }))
            }
            style={btnBase}
          >
            −
          </button>
          <span style={{ fontSize: '12px', flex: 1, textAlign: 'center' }}>
            Right Gap: {Math.round(config.rightOffset)}%
          </span>
          <button
            onClick={() =>
              setConfig((p) => ({ ...p, rightOffset: Math.min(MOBILE_MAX_RIGHT, p.rightOffset + 2) }))
            }
            style={btnBase}
          >
            +
          </button>
        </div>

        {/* Position info */}
        <div style={{ fontSize: '10px', color: '#999', textAlign: 'center', lineHeight: 1.4 }}>
          <div>Position: {Math.round(config.rightOffset)}% from right</div>
          <div style={{ fontSize: '9px', color: '#BBB', marginTop: '4px' }}>
            Mobile safe area: {Math.round(MOBILE_MIN_RIGHT)}% — {Math.round(MOBILE_MAX_RIGHT)}%
          </div>
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
