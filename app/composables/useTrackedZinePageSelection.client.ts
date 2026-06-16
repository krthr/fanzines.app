import type { PageId } from "~/types/zine";
import { useZineAnalytics } from "~/composables/useZineAnalytics.client";
import { useZineStore } from "~/composables/useZineStore";

type PageSelectionProperty = string | number | boolean | null | undefined;
type PageSelectionProperties = Record<string, PageSelectionProperty>;

export function useTrackedZinePageSelection() {
  const { state, elementCount, selectPage } = useZineStore();
  const { trackZineEvent } = useZineAnalytics();

  function selectTrackedPage(
    pageId: PageId,
    properties: PageSelectionProperties = {},
  ) {
    const previousPageId = state.value.selectedPageId;
    const changedPage = pageId !== previousPageId;

    selectPage(pageId);

    if (!changedPage) return;

    trackZineEvent("zine_page_selected", {
      page_id: pageId,
      from_page_id: previousPageId,
      page_element_count: state.value.pageElementIds[pageId].length,
      element_count: elementCount.value,
      ...properties,
    });
  }

  return {
    selectTrackedPage,
  };
}
