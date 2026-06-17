import { Bouquet, WrappingPaperType, RibbonColor } from '../../types';
import { FLOWERS } from '../../constants/flowers';

interface BouquetPreviewProps {
  bouquet: Bouquet;
  size?: 'small' | 'medium' | 'large';
  clickable?: boolean;
  onClickHandler?: () => void;
}

// Wrapping paper color/style definitions
const WRAPPING_STYLES: Record<WrappingPaperType, { bg: string }> = {
  'kraft': { bg: '#c9a878' },
  'spring-floral': { bg: '#f5e6d3' },
  'pastel-stripe': { bg: '#f0e8f0' },
  'tissue': { bg: 'rgba(255, 240, 245, 0.8)' },
  'plain-white': { bg: '#f5f5f5' },
};

// Ribbon color definitions
const RIBBON_COLORS: Record<RibbonColor, string> = {
  'blush': '#e8b4c8',
  'sage': '#9eb5a6',
  'butter-yellow': '#f4d58d',
  'lavender': '#d4b5e8',
  'ivory': '#f5f0e8',
  'dusty-rose': '#c9927a',
};

export function BouquetPreview({
  bouquet,
  size = 'medium',
  clickable = false,
  onClickHandler,
}: BouquetPreviewProps) {
  const sizeMap = {
    small: { container: 70, flower: 24, ribbonThickness: 6 },
    medium: { container: 90, flower: 32, ribbonThickness: 8 },
    large: { container: 130, flower: 48, ribbonThickness: 12 },
  };

  const dimensions = sizeMap[size];
  const wrappingStyle = WRAPPING_STYLES[bouquet.wrappingPaper];
  const ribbonColor = RIBBON_COLORS[bouquet.ribbonColor];

  // Arrange flowers in a circular pattern around the center
  const getFlowerPosition = (index: number, total: number) => {
    if (total === 1) return { x: 0, y: 0, z: 1 };
    if (total === 2) return index === 0 ? { x: -6, y: -4, z: 2 } : { x: 6, y: 4, z: 1 };

    // Circular arrangement for 3-7 flowers
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2; // Start from top
    const radius = 10;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const z = total - index;

    return { x, y, z };
  };

  const sortedStems = [...bouquet.stems].sort((a, b) => a.order - b.order);

  return (
    <div
      onClick={clickable ? onClickHandler : undefined}
      style={{
        position: 'relative',
        width: dimensions.container,
        height: dimensions.container,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'transform 0.2s, filter 0.2s',
      }}
      onMouseEnter={(e) => {
        if (clickable) {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
          (e.currentTarget as HTMLElement).style.filter = 'drop-shadow(3px 3px 8px rgba(0,0,0,0.3))';
        }
      }}
      onMouseLeave={(e) => {
        if (clickable) {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLElement).style.filter = 'drop-shadow(2px 2px 4px rgba(0,0,0,0.15))';
        }
      }}
    >
      {/* Wrapping paper (outer circle) */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: dimensions.container - 4,
          height: dimensions.container - 4,
          borderRadius: '50%',
          background: wrappingStyle.bg,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        {/* Flowers container inside wrapping */}
        <div
          style={{
            position: 'relative',
            width: dimensions.container * 0.75,
            height: dimensions.container * 0.75,
          }}
        >
          {sortedStems.map((stem, index) => {
            const flower = FLOWERS[stem.flowerId];
            if (!flower) return null;

            const pos = getFlowerPosition(index, sortedStems.length);

            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                  zIndex: pos.z + 10,
                  width: dimensions.flower,
                  height: dimensions.flower,
                  backgroundImage: `url('${flower.spriteUrl}')`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.15))',
                }}
                title={flower.name}
              />
            );
          })}

          {/* Fallback if no stems */}
          {sortedStems.length === 0 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: dimensions.flower * 1.2,
                lineHeight: 1,
                opacity: 0.5,
              }}
            >
              💐
            </div>
          )}
        </div>
      </div>

      {/* Ribbon band across middle */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: dimensions.container + 8,
          height: dimensions.ribbonThickness,
          background: ribbonColor,
          zIndex: 5,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          borderRadius: dimensions.ribbonThickness / 2,
        }}
      />

      {/* Ribbon bow (decorative element on top) */}
      <div
        style={{
          position: 'absolute',
          top: '2px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: dimensions.ribbonThickness * 2.5,
          height: dimensions.ribbonThickness * 2,
          background: ribbonColor,
          borderRadius: '50% 50% 0 0',
          zIndex: 6,
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  );
}
