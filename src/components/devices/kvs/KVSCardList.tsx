import { Stack } from '@mantine/core';
import type { KVSKey } from '../../../types/shelly';
import { KVSCard } from './KVSCard';

interface Props {
  items: KVSKey[];
  onEdit: (item: KVSKey) => void;
  onDelete: (key: string) => void;
}

export function KVSCardList({ items, onEdit, onDelete }: Props) {
  return (
    <Stack gap="sm">
      {items.map((item) => (
        <KVSCard key={item.key} item={item} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </Stack>
  );
}
