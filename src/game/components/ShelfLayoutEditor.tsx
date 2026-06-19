import { useState, useRef, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';

export interface ShelfSlotConfig {
  x: number; // 0–100, horizontal center as % of container
  y: number; // 0–100, bottom of bouquets as % of container
}

export interface ShelfLayoutConfig {
  shelves: ShelfSlotConfig[];
  gap: number; // px between bouquets within a row
  bouquetWidth: number; // px
  bouquetHeight: number; // px
}

const DEFAULT_CONFIG: ShelfLayoutConfig = {
  shelves: [
    { x: 50, y: 35 },
    { x: 50, y: 55 },
    { x: 50, y: 65 },
  ],
  gap: 4,
  bouquetWidth: 70,
  bouquetHeight: 90,
};

const STORAGE_KEY = 'bloommy_shelf_layout_v2';
export const BOUQUETS_PER_SHELF = 4;

export function loadShelfLayoutConfig(): ShelfLayoutConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ShelfLayoutConfig;
      if (parsed?.shelves?.length === 3) return parsed;
    }
  } catch {}
  return DEFAULT_CONFIG;
}

function saveShelfLayoutConfig(config: ShelfLayoutConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

interface Props {
  onClose: () => void;
}

const SHELF_COLORS = ['#4A90D9', '#D97A4A', '#6A4AD9'];

const btnBase: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '7px',
  border: '1px solid #DDD',
  background: '#F5F5F5',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 'bold',
  lineHeight: '1',
};

export function ShelfLayoutEditor({ onClose }: Props) {
  const [config, setConfig] = useState<ShelfLayoutConfig>(() => loadShelfLayoutConfig());
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Show actual shelf bouquets in the preview if available
  const shelfBouquets = useGameStore((s) => s.shelfBouquets);

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingIdx(idx);
  };

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (draggingIdx === null || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
      setConfig((prev) => ({
        ...prev,
        shelves: prev.shelves.map((s, i) => (i === draggingIdx ? { x, y } : s)),
      }));
    },
    [draggingIdx],
  );

  const onPointerUp = useCallback(() => setDraggingIdx(null), []);

  const handleSave = () => {
    saveShelfLayoutConfig(config);
    onClose();
  };

  const adjustGap = (delta: number) =>
    setConfig((p) => ({ ...p, gap: Math.max(0, Math.min(50, p.gap + delta)) }));
  const adjustSize = (delta: number) =>
    setConfig((p) => ({
      ...p,
      bouquetWidth: Math.max(30, Math.min(160, p.bouquetWidth + delta)),
      bouquetHeight: Math.max(40, Math.min(200, p.bouquetHeight + delta)),
    }));

  return (
    <div
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
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

      {/* ── Draggable shelf anchors ── */}
      {config.shelves.map((shelf, idx) => {
        const color = SHELF_COLORS[idx] ?? '#888';
        // Show real bouquets for this shelf row if they exist, else use placeholders
        const rowBouquets = shelfBouquets.slice(
          idx * BOUQUETS_PER_SHELF,
          (idx + 1) * BOUQUETS_PER_SHELF,
        );
        const placeholders = Array.from({ length: BOUQUETS_PER_SHELF });

        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: `${shelf.x}%`,
              top: `${shelf.y}%`,
              transform: 'translate(-50%, -100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              pointerEvents: 'none',
            }}
          >
            {/* Preview bouquet row */}
            <div style={{ display: 'flex', gap: `${config.gap}px`, alignItems: 'flex-end' }}>
              {placeholders.map((_, i) => {
                const bouquet = rowBouquets[i];
                return bouquet ? (
                  <div
                    key={i}
                    style={{
                      width: config.bouquetWidth,
                      height: config.bouquetHeight,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={bouquet.thumbnailUrl || '/bouquets/sunshine-bunch.png'}
                      alt="Bouquet"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))',
                      }}
                    />
                  </div>
                ) : (
                  <div
                    key={i}
                    style={{
                      width: config.bouquetWidth,
                      height: config.bouquetHeight,
                      background: `${color}33`,
                      border: `2px dashed ${color}88`,
                      borderRadius: '8px 8px 4px 4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                    }}
                  >
                    🌸
                  </div>
                );
              })}
            </div>

            {/* Drag handle */}
            <div
              onPointerDown={(e) => onHandlePointerDown(e, idx)}
              style={{
                pointerEvents: 'all',
                background: color,
                color: '#FFF',
                borderRadius: '8px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: draggingIdx === idx ? 'grabbing' : 'grab',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              ✥ Shelf {idx + 1} — X:{Math.round(shelf.x)}% Y:{Math.round(shelf.y)}%
            </div>
          </div>
        );
      })}

      {/* ── Control panel ── */}
      <div
        style={{
          position: 'absolute',
          bottom: '65px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.97)',
          borderRadius: '14px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '9px',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          minWidth: '250px',
          zIndex: 10,
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>
          Shelf Layout Editor
        </div>
        <div style={{ fontSize: '10px', color: '#777', textAlign: 'center' }}>
          Drag each shelf handle · bottom of preview = Y position
        </div>

        {/* Gap */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => adjustGap(-2)} style={btnBase}>
            −
          </button>
          <span style={{ fontSize: '12px', minWidth: '72px', textAlign: 'center' }}>
            Gap: {config.gap}px
          </span>
          <button onClick={() => adjustGap(2)} style={btnBase}>
            +
          </button>
        </div>

        {/* Size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => adjustSize(-5)} style={btnBase}>
            −
          </button>
          <span style={{ fontSize: '12px', minWidth: '72px', textAlign: 'center' }}>
            Size: {config.bouquetWidth}px
          </span>
          <button onClick={() => adjustSize(5)} style={btnBase}>
            +
          </button>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
          <button
            onClick={() => setConfig(DEFAULT_CONFIG)}
            style={{ ...btnBase, fontSize: '12px' }}
          >
            Reset
          </button>
          <button onClick={onClose} style={{ ...btnBase, fontSize: '12px' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              ...btnBase,
              fontSize: '12px',
              background: '#4CAF50',
              color: '#FFF',
              border: 'none',
              padding: '6px 18px',
            }}
          >
            Save Layout
          </button>
        </div>
      </div>
    </div>
  );
}
