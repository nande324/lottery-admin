import { defineStore } from "pinia";
import { ref } from "vue";
import type { LotteryMode } from "@/types";
import { lotteryModeApi } from "@/api";

export const useLotteryModeStore = defineStore("lotteryMode", () => {
  const modes = ref<LotteryMode[]>([]);
  const currentMode = ref<LotteryMode | null>(null);

  async function fetchModes() {
    try {
      const res = await lotteryModeApi.list();
      modes.value = res.data.data || [];
      if (!currentMode.value && modes.value.length > 0) {
        const ssq = modes.value.find((m) => m.code === "SSQ");
        currentMode.value = ssq || modes.value[0];
      }
    } catch (e) {
      console.error("获取彩票模式失败", e);
    }
  }

  function setCurrentMode(mode: LotteryMode) {
    currentMode.value = mode;
  }

  return { modes, currentMode, fetchModes, setCurrentMode };
});
