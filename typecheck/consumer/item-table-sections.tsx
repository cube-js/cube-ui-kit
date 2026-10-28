import { ItemTable } from '@cube-dev/ui-kit';

import type { CubeItemTableSection } from '@cube-dev/ui-kit';

const sections: readonly CubeItemTableSection[] = [
  { key: 'favorite', title: 'Favorites' },
  { key: 0, title: 'Other items' },
];

export function SectionedRecords() {
  return (
    <ItemTable
      data={[{ id: 'a', name: 'Analytics', favorite: true }]}
      columns={[{ key: 'name', title: 'Name', isRowHeader: true }]}
      sections={sections}
      getSectionKey={(row) => (row.favorite ? 'favorite' : 0)}
      styles={{ SectionCell: { color: '#purple-text' } }}
    />
  );
}
