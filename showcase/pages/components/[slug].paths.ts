import { loadCatalog } from '../../site/catalog';
import { componentPageContent } from '../../site/componentPage';
import { slugFor } from '../../site/pages';

export default {
  async paths() {
    const { components } = await loadCatalog();
    return components.map((component) => ({
      // Params reach the page's data, so they stay small and serialisable.
      params: { slug: slugFor(component.name), name: component.name },
      content: componentPageContent(component),
    }));
  },
};
