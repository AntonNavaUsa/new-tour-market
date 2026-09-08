type LocationNode = {
  id: string;
  parentId: string | null;
};

export type FlatLocationNode<T extends LocationNode> = {
  item: T;
  depth: number;
  hasChildren: boolean;
};

export function buildLocationTree<T extends LocationNode>(locations: T[]): FlatLocationNode<T>[] {
  const childrenByParent = new Map<string | null, T[]>();

  for (const location of locations) {
    const children = childrenByParent.get(location.parentId) ?? [];
    children.push(location);
    childrenByParent.set(location.parentId, children);
  }

  const sortByName = (items: T[]) =>
    [...items].sort((a, b) => {
      const aName = String((a as { city?: string | null }).city ?? '');
      const bName = String((b as { city?: string | null }).city ?? '');
      return aName.localeCompare(bName, 'ru');
    });

  const flatten = (parentId: string | null, depth: number): FlatLocationNode<T>[] => {
    const current = sortByName(childrenByParent.get(parentId) ?? []);

    return current.flatMap((item) => {
      const children = childrenByParent.get(item.id) ?? [];
      return [
        { item, depth, hasChildren: children.length > 0 },
        ...flatten(item.id, depth + 1),
      ];
    });
  };

  return flatten(null, 0);
}

export function getDescendantIds<T extends LocationNode>(
  locations: T[],
  parentId: string,
): string[] {
  const childrenByParent = new Map<string | null, T[]>();

  for (const location of locations) {
    const children = childrenByParent.get(location.parentId) ?? [];
    children.push(location);
    childrenByParent.set(location.parentId, children);
  }

  const collect = (currentParentId: string): string[] => {
    const directChildren = childrenByParent.get(currentParentId) ?? [];

    return directChildren.flatMap((child) => [child.id, ...collect(child.id)]);
  };

  return collect(parentId);
}