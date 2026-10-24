import { computed, reactive } from 'vue';
import { defineStore } from 'pinia';
import type { SiteFacing } from '../services/houseRender';

const FACINGS: readonly SiteFacing[] = ['front', 'back', 'left', 'right'];

function emptyResults(): Record<SiteFacing, string> {
  return {
    front: '',
    back: '',
    left: '',
    right: ''
  };
}

/** Session-only memory for the latest generated image from each house view. */
export const useHouseRenderStore = defineStore('house-render', () => {
  const latest = reactive(emptyResults());
  const readyFacings = computed(() => FACINGS.filter((side) => Boolean(latest[side])));

  function remember(side: SiteFacing, image: string) {
    latest[side] = image;
  }

  return { latest, readyFacings, remember };
});
