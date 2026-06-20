import { useState, useRef, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';

export interface NPCCustomizationConfig {
  height: number; // px
  bottomOffset: number; // px from bottom
  rightOffset: number; // px from right
}

const DEFAULT_CONFIG: NPCCustomizationConfig = {
  height: 420,
  bottomOffset: 70,
  rightOffset: 0,
};

const STORAGE_KEY = 'bloommy_npc_customization';

export function loadNPCCustomizationConfig(): NPCCustomizationConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as NPCCustomizationConfig;
      return parsed;
    }
  } catch {}
  return DEFAULT_CONFIG;
}

function saveToLocalStorage(config: NPCCustomizationConfig) {
  try {
    const json = JSON.stringify(config);
    localStorage.setItem(STORAGE_KEY, json);
    console.log('✓ NPC config saved to localStorage:', json);
  } catch (err) {
    console.error('✗ Failed to save NPC config to localStorage:', err);
  }
}

interface Props {
  onClose: () => void;
}

export function NPCCustomizer({ onClose }: Props) {
  const storedConfig = useGameStore((s) => s.npcCustomizationConfig);
  const [config, setConfig] = useState<NPCCustomizationConfig>(() =>
    storedConfig || loadNPCCustomizationConfig()
  );
  const [draggingNPC, setDraggingNPC] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const npcDragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const saveNPCCustomizationConfig = useGameStore((s) => s.saveNPCCustomizationConfig);

  const handleNPCDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    npcDragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: config.rightOffset,
      offsetY: config.bottomOffset,
    };
    setDraggingNPC(true);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingNPC || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = e.clientX - npcDragStartRef.current.x;
      const dy = e.clientY - npcDragStartRef.current.y;

      const newRightOffset = Math.max(
        0,
        Math.min(rect.width - 150, npcDragStartRef.current.offsetX - dx),
      );
      const newBottomOffset = Math.max(0, npcDragStartRef.current.offsetY - dy);

      setConfig((prev) => ({
        ...prev,
        rightOffset: newRightOffset,
        bottomOffset: newBottomOffset,
      }));
    },
    [draggingNPC],
  );

  const handlePointerUp = useCallback(() => {
    setDraggingNPC(false);
  }, []);

  const handleSave = () => {
    // Save to both localStorage (for quick loading) and game store (for persistence)
    saveToLocalStorage(config);
    saveNPCCustomizationConfig({
      height: config.height,
      bottomOffset: config.bottomOffset,
      rightOffset: config.rightOffset,
    });
    onClose();
  };

  const exampleNPCImage = './npcs/npc-young-woman-01.png';

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

      {/* ── Draggable NPC Preview ── */}
      <div
        style={{
          position: 'absolute',
          bottom: config.bottomOffset,
          right: config.rightOffset,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          cursor: draggingNPC ? 'grabbing' : 'grab',
          pointerEvents: 'all',
        }}
        onPointerDown={handleNPCDragStart}
      >
        <img
          src={exampleNPCImage}
          alt="NPC Preview"
          style={{
            height: config.height,
            width: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(-4px 0 8px rgba(0,0,0,0.25))',
            imageRendering: 'crisp-edges',
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
          NPC Customizer
        </div>
        <div style={{ fontSize: '10px', color: '#777', textAlign: 'center' }}>
          Drag the NPC character to reposition · use controls to resize
        </div>

        {/* Height control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <button
            onClick={() => setConfig((p) => ({ ...p, height: Math.max(100, p.height - 20) }))}
            style={btnBase}
          >
            −
          </button>
          <span style={{ fontSize: '12px', flex: 1, textAlign: 'center' }}>
            Height: {config.height}px
          </span>
          <button
            onClick={() => setConfig((p) => ({ ...p, height: Math.min(600, p.height + 20) }))}
            style={btnBase}
          >
            +
          </button>
        </div>

        {/* Bottom offset control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <button
            onClick={() =>
              setConfig((p) => ({ ...p, bottomOffset: Math.max(0, p.bottomOffset - 10) }))
            }
            style={btnBase}
          >
            −
          </button>
          <span style={{ fontSize: '12px', flex: 1, textAlign: 'center' }}>
            Bottom Gap: {config.bottomOffset}px
          </span>
          <button
            onClick={() =>
              setConfig((p) => ({ ...p, bottomOffset: Math.min(200, p.bottomOffset + 10) }))
            }
            style={btnBase}
          >
            +
          </button>
        </div>

        {/* Right offset control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <button
            onClick={() => setConfig((p) => ({ ...p, rightOffset: Math.max(0, p.rightOffset - 10) }))}
            style={btnBase}
          >
            −
          </button>
          <span style={{ fontSize: '12px', flex: 1, textAlign: 'center' }}>
            Right Gap: {config.rightOffset}px
          </span>
          <button
            onClick={() =>
              setConfig((p) => ({ ...p, rightOffset: Math.min(200, p.rightOffset + 10) }))
            }
            style={btnBase}
          >
            +
          </button>
        </div>

        {/* Info */}
        <div style={{ fontSize: '10px', color: '#999', textAlign: 'center', marginTop: '4px' }}>
          Position: {config.bottomOffset}px from bottom, {config.rightOffset}px from right
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', width: '100%' }}>
          <button
            onClick={() => setConfig(DEFAULT_CONFIG)}
            style={{ ...btnBase, flex: 1, fontSize: '12px' }}
          >
            Reset
          </button>
          <button
            onClick={onClose}
            style={{ ...btnBase, flex: 1, fontSize: '12px' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              ...btnBase,
              flex: 1,
              fontSize: '12px',
              background: '#4CAF50',
              color: '#FFF',
              border: 'none',
              padding: '7px 14px',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

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
