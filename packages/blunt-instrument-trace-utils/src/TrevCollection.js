export default class TrevCollection {
  constructor(trevs, astb) {
    this.trevs = trevs;
    this.astb = astb;

    const trevsById = new Map();
    trevs.forEach((trev) => {
      trevsById.set(trev.id, trev);
    });
    this.trevsById = trevsById;
  }

  getTrev(id) {
    return this.trevsById.get(id);
  }

  withDenormalizedInfo() {
    const newTrevs = [];
    const ancestorsForParent = [];
    const getAncestors = (parentId) => {
      if (!parentId) {
        return [];
      }

      const existing = ancestorsForParent[parentId];
      if (existing) {
        return existing;
      }

      const parent = this.getTrev(parentId);
      if (!parent) {
        throw new Error(`Trev has invalid parentId [${parentId}]`);
      }

      const ancestors = [...getAncestors(parent.parentId), parentId];
      ancestorsForParent[parentId] = ancestors;
      return ancestors;
    };

    this.trevs.forEach((trev) => {
      const node = this.astb.getNode(trev.astId, trev.nodeId);
      if (!node) {
        throw new Error(`Trev id [${trev.id}] has unknown node id [${trev.nodeId}] for AST id [${trev.astId}]`);
      }

      const denormalized = {
        ancestorIds: getAncestors(trev.parentId),
        node,
      };
      newTrevs.push({ ...trev, denormalized });
    });

    return new TrevCollection(newTrevs, this.astb);
  }

  withoutDenormalizedInfo() {
    const newTrevs = this.trevs.map((trev) => {
      const { denormalized, ...rest } = trev;
      return rest;
    });
    return new TrevCollection(newTrevs, this.astb);
  }

  filter(fn) {
    const filtered = this.trevs.filter(fn);
    return new TrevCollection(filtered, this.astb);
  }

  getFacets() {
    const facets = {
      nodes: new Map(),
      nodeTypes: new Map(),
      types: new Map(),
    };

    this.trevs.forEach((trev) => {
      const node = this.astb.getNode(trev.astId, trev.nodeId);
      if (!node) {
        return;
      }

      facets.nodes.set(node, (facets.nodes.get(node) || 0) + 1);
      facets.nodeTypes.set(node.type, (facets.nodeTypes.get(node.type) || 0) + 1);
      facets.types.set(trev.type, (facets.types.get(trev.type) || 0) + 1);
    });

    return facets;
  }
}
