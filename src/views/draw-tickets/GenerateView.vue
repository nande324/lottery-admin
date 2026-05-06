<template>
  <div class="page-container">
    <t-card :bordered="false" class="page-header-card">
      <div class="page-header">
        <div>
          <h3>号码生成</h3>
          <p>随机生成彩票号码并保存投注记录</p>
        </div>
      </div>
    </t-card>

    <t-row :gutter="16" style="margin-top: 12px">
      <!-- 左侧：生成控制 -->
      <t-col :span="8">
        <t-card title="生成设置" :bordered="false">
          <t-form label-align="right" label-width="80px">
            <t-form-item label="彩票模式">
              <t-select v-model="selectedModeId" @change="onModeChange">
                <t-option
                  v-for="m in drawModes"
                  :key="m.id"
                  :label="m.name"
                  :value="m.id"
                />
              </t-select>
            </t-form-item>
            <t-form-item label="生成注数">
              <t-input-number
                v-model="count"
                :min="1"
                :max="100"
                style="width: 100%"
              />
            </t-form-item>
            <t-form-item label="期号">
              <t-input v-model="issueNo" placeholder="期号（可选）" />
            </t-form-item>
            <t-form-item label="投注金额">
              <t-input-number
                v-model="betAmount"
                :min="0"
                :decimal-places="0"
                style="width: 100%"
              />
            </t-form-item>
          </t-form>
          <t-space direction="vertical" style="width: 100%; margin-top: 16px">
            <t-button
              theme="primary"
              block
              :loading="generating"
              @click="handleGenerate"
            >
              <template #icon><t-icon name="dice" /></template>
              随机生成 {{ count }} 注
            </t-button>
            <t-button
              block
              :disabled="!tickets.length"
              :loading="saving"
              @click="handleSave"
            >
              <template #icon><t-icon name="check" /></template>
              保存投注（{{ tickets.length }} 注）
            </t-button>
          </t-space>
        </t-card>
      </t-col>

      <!-- 右侧：号码列表 -->
      <t-col :span="16">
        <t-card title="生成结果" :bordered="false">
          <t-empty
            v-if="!tickets.length"
            description="点击左侧「随机生成」按钮生成号码"
          />
          <div v-else>
            <div
              v-for="(ticket, idx) in tickets"
              :key="idx"
              class="ticket-item"
            >
              <span class="ticket-index">{{ idx + 1 }}.</span>
              <div class="ticket-row">
                <span
                  v-for="n in ticket.red"
                  :key="`r${n}`"
                  class="number-ball number-ball--red"
                  >{{ String(n).padStart(2, "0") }}</span
                >
                <span v-if="ticket.blue.length" class="separator">|</span>
                <span
                  v-for="n in ticket.blue"
                  :key="`b${n}`"
                  class="number-ball number-ball--blue"
                  >{{ String(n).padStart(2, "0") }}</span
                >
              </div>
              <t-button
                variant="text"
                theme="danger"
                size="small"
                @click="tickets.splice(idx, 1)"
              >
                <template #icon><t-icon name="delete" /></template>
              </t-button>
            </div>
          </div>
        </t-card>
      </t-col>
    </t-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { MessagePlugin, DialogPlugin } from "tdesign-vue-next";
import { useLotteryModeStore } from "@/store/lotteryMode";
import { storeToRefs } from "pinia";
import { numbersApi, drawTicketApi } from "@/api";

const lotteryModeStore = useLotteryModeStore();
const { modes } = storeToRefs(lotteryModeStore);
const drawModes = computed(() => modes.value.filter((m) => m.type === "DRAW"));

const selectedModeId = ref<number | null>(null);
const count = ref(5);
const issueNo = ref("");
const betAmount = ref(2);
const generating = ref(false);
const saving = ref(false);
const tickets = ref<{ red: number[]; blue: number[] }[]>([]);

function onModeChange() {
  tickets.value = [];
}

async function handleGenerate() {
  if (!selectedModeId.value) {
    MessagePlugin.warning("请选择彩票模式");
    return;
  }
  generating.value = true;
  try {
    const res = await numbersApi.generateBatch({
      modeId: selectedModeId.value,
      count: count.value,
    });
    tickets.value = res.data.data || [];
  } catch {
    /* ignore */
  } finally {
    generating.value = false;
  }
}

async function handleSave() {
  if (!selectedModeId.value || !tickets.value.length) return;
  saving.value = true;
  try {
    const requests = tickets.value.map((t) => ({
      modeId: selectedModeId.value,
      issueNo: issueNo.value || undefined,
      redNumbers: t.red,
      blueNumbers: t.blue.length ? t.blue : undefined,
      betAmount: betAmount.value,
    }));
    const res = await drawTicketApi.createBatch(requests);
    const saved = (res.data.data || []) as Array<{
      winStatus: string;
      winLevel: number | null;
      winAmount: number | null;
      issueNo: string | null;
      redNumbers: number[];
      blueNumbers: number[];
    }>;

    // 统计中奖情况
    const winList = saved.filter((t) => t.winStatus === "WIN");

    if (winList.length > 0) {
      // 有中奖，弹出醒目提示
      const lines = winList.map((t) => {
        const red = (t.redNumbers || [])
          .map((n: number) => String(n).padStart(2, "0"))
          .join(" ");
        const blue = (t.blueNumbers || [])
          .map((n: number) => String(n).padStart(2, "0"))
          .join(" ");
        const numStr = blue ? `${red} | ${blue}` : red;
        const levelText = t.winLevel ? `${t.winLevel}等奖` : "中奖";
        const amountText =
          t.winAmount && Number(t.winAmount) > 0
            ? `  ¥${Number(t.winAmount).toFixed(0)}`
            : "";
        return `${numStr}  →  ${levelText}${amountText}`;
      });

      DialogPlugin.alert({
        header: `🎉 恭喜！${winList.length} 注中奖！`,
        body: lines.join("\n"),
        confirmBtn: "知道了",
      });
    } else if (
      issueNo.value &&
      saved.length > 0 &&
      saved[0].winStatus === "NO_WIN"
    ) {
      // 有期号且已核对，全部未中奖
      MessagePlugin.info(`期号 ${issueNo.value} 共 ${saved.length} 注，未中奖`);
    } else {
      MessagePlugin.success(`成功保存 ${tickets.value.length} 注`);
    }

    tickets.value = [];
  } catch {
    /* ignore */
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  if (!modes.value.length)
    lotteryModeStore.fetchModes().then(() => {
      selectedModeId.value = drawModes.value[0]?.id || null;
    });
  else selectedModeId.value = drawModes.value[0]?.id || null;
});
</script>

<style scoped lang="scss">
.page-header-card :deep(.t-card__body) {
  padding: 16px 20px;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  h3 {
    margin: 0 0 4px;
    font-size: 18px;
  }
  p {
    margin: 0;
    color: #8b949e;
    font-size: 13px;
  }
}
.ticket-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px dashed #e7e7e7;
  &:last-child {
    border-bottom: none;
  }
}
.ticket-index {
  color: #8b949e;
  min-width: 24px;
  font-size: 13px;
}
</style>
