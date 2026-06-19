import { useGameStore } from '../../stores/gameStore';
import { FLOWERS } from '../../constants/flowers';

export function InventoryDrawer() {
  const inventory = useGameStore((s) => s.inventory);
  const inventoryCapacity = useGameStore((s) => s.inventoryCapacity);
  const totalStems = useGameStore((s) => s.getTotalStemsInInventory());

  if (inventory.length === 0) {
    return (
      <div
        style={{
          fontSize: '12px',
          color: '#999',
          padding: '8px',
          textAlign: 'center',
        }}
      >
        Empty - buy flowers from the Nursery!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
      {inventory.map((item) => {
        const flower = FLOWERS[item.flowerId];
        if (!flower) return null;

        return (
          <div
            key={item.flowerId}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              minWidth: '60px',
            }}
          >
            <img
              src={flower.spriteUrl}
              alt={flower.name}
              style={{
                width: '48px',
                height: '48px',
                objectFit: 'contain',
              }}
            />
            <div
              style={{
                fontSize: '11px',
                fontWeight: 'bold',
                textAlign: 'center',
                color: '#666',
              }}
            >
              ×{item.quantity}
            </div>
            <div
              style={{
                fontSize: '9px',
                color: '#999',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
              }}
            >
              {flower.name}
            </div>
          </div>
        );
      })}

      <div
        style={{
          fontSize: '10px',
          color: '#999',
          padding: '4px 8px',
          alignSelf: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {totalStems}/{inventoryCapacity}
      </div>
    </div>
  );
}
