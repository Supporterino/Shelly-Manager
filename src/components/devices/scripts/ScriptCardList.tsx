import { Stack } from '@mantine/core';
import type { ScriptEntry } from '../../../types/shelly';
import { ScriptCard } from './ScriptCard';

interface Props {
  scripts: ScriptEntry[];
  onStart: (id: number) => void;
  onStop: (id: number) => void;
  onViewCode: (id: number) => void;
  onEval: (id: number) => void;
  onDelete: (id: number) => void;
  isUpdating: boolean;
}

export function ScriptCardList({
  scripts,
  onStart,
  onStop,
  onViewCode,
  onEval,
  onDelete,
  isUpdating,
}: Props) {
  return (
    <Stack gap="sm">
      {scripts.map((script) => (
        <ScriptCard
          key={script.id}
          script={script}
          onStart={onStart}
          onStop={onStop}
          onViewCode={onViewCode}
          onEval={onEval}
          onDelete={onDelete}
          isUpdating={isUpdating}
        />
      ))}
    </Stack>
  );
}
