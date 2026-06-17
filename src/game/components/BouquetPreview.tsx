import { Bouquet } from '../../types';
import { FLOWERS } from '../../constants/flowers';

interface BouquetPreviewProps {
  bouquet: Bouquet;
  size?: 'small' | 'medium' | 'large';
  clickable?: boolean;
  onClickHandler?: () => void;
}

export function BouquetPreview({
  bouquet,
  size = 'medium',
  clickable = false,
  onClickHandler,
}: BouquetPreviewProps) {
  const sizeMap = {
    small: { container: 60, flower: 28, gap: 12 },
    medium: { container: 80, flower: 36, gap: 16 },
    large: { container: 120, flower: 52, gap: 24 },
  };

  const dimensions = sizeMap[size];

  // Arrange flowers in a circular pattern around the center
  const getFlowerPosition = (index: number, total: number) => {
    if (total === 1) return { x: 0, y: 0, z: 1 };
    if (total === 2) return index === 0 ? { x: -8, y: -4, z: 2 } : { x: 8, y: 4, z: 1 };

    // Circular arrangement for 3-7 flowers
    const angle = (index / total) * Math.PI * 2;
    const radius = 12;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const z = total - index; // Stagger z-order

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
          (e.currentTarget as HTMLElement).style.filter = 'drop-shadow(3px 3px 6px rgba(0,0,0,0.25))';
        }
      }}
      onMouseLeave={(e) => {
        if (clickable) {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLElement).style.filter = 'drop-shadow(2px 2px 4px rgba(0,0,0,0.15))';
        }
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
              zIndex: pos.z,
              width: dimensions.flower,
              height: dimensions.flower,
              backgroundImage: `url('${flower.spriteUrl}')`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.1))',
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
            fontSize: dimensions.flower,
            lineHeight: 1,
          }}
        >
          💐
        </div>
      )}
    </div>
  );
}
