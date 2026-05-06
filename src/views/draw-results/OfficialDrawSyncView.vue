<template>
  <div class="official-draw-sync">
    <!-- 同步操作卡片 -->
    <t-card title="官方历史开奖数据同步" class="sync-card">
      <template #subtitle>
        数据来源：中彩网双色球历史开奖记录（2022年至今）
      </template>

      <t-space direction="vertical" style="width: 100%">
        <!-- 全量同步 -->
        <t-alert
          theme="info"
          message="首次使用请点击「同步全量数据」，将自动拉取2022年至今所有期次的开奖号码。已存在的记录会自动跳过，可重复执行。"
        />

        <t-space>
          <t-button
            theme="primary"
            :loading="syncingAll"
            @click="handleSyncAll"
          >
            <template #icon><t-icon name="refresh" /></template>
            同步全量数据（2022至今）
          </t-button>

          <t-button
            variant="outline"
            :loading="syncingRange"
            @click="showRangeDialog = true"
          >
            <template #icon><t-icon name="setting" /></template>
            同步指定期号范围
          </t-button>
        </t-space>

        <!-- 同步结果 -->
        <t-alert
          v-if="syncResult"
          :theme="syncResult.failed > 0 ? 'warning' : 'success'"
          :message="syncResult.message"
        >
          <template #operation>
            <t-button variant="text" size="small" @click="syncResult = null">
              关闭
            </t-button>
          </template>
        </t-alert>
      </t-space>
    </t-card>

    <!-- 历史数据列表 -->
    <t-card title="历史开奖记录" class="list-card" style="margin-top: 16px">
      <template #actions>
        <t-space>
          <t-input
            v-model="searchIssueNo"
            placeholder="按期号搜索"
            clearable
            style="width: 160px"
            @enter="handleSearch"
            @clear="handleSearch"
          >
            <template #suffix-icon>
              <t-icon
                name="search"
                @click="handleSearch"
                style="cursor: pointer"
              />
            </template>
          </t-input>
          <t-button variant="outline" @click="handleSearch">
            <template #icon><t-icon name="search" /></template>
            查询
          </t-button>
        </t-space>
      </template>

      <t-table
        :data="tableData"
        :columns="columns"
        :loading="tableLoading"
        row-key="id"
        stripe
        hover
        size="small"
      />

      <div class="pagination-wrap">
        <t-pagination
          v-model="pagination.current"
          v-model:pageSize="pagination.pageSize"
          :total="pagination.total"
          show-jumper
          @change="handlePageChange"
        />
      </div>
    </t-card>

    <!-- 指定期号范围弹窗 -->
    <t-dialog
      v-model:visible="showRangeDialog"
      header="同步指定期号范围"
      :on-confirm="handleSyncRange"
      :confirm-btn="{ loading: syncingRange, content: '开始同步' }"
    >
      <t-form :data="rangeForm" label-width="100px">
        <t-form-item label="起始期号" name="startIssue">
          <t-input v-model="rangeForm.startIssue" placeholder="如 2022001" />
        </t-form-item>
        <t-form-item label="结束期号" name="endIssue">
          <t-input v-model="rangeForm.endIssue" placeholder="如 2026044" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { MessagePlugin } from "tdesign-vue-next";
import { officialDrawApi } from "@/api/index";

// ── 同步状态 ──────────────────────────────────────────────
const syncingAll = ref(false);
const syncingRange = ref(false);
const showRangeDialog = ref(false);
const syncResult = ref<{
  inserted: number;
  skipped: number;
  failed: number;
  message: string;
} | null>(null);

const rangeForm = ref({ startIssue: "2022001", endIssue: "" });

async function handleSyncAll() {
  syncingAll.value = true;
  syncResult.value = null;
  try {
    const res = await officialDrawApi.syncHistory();
    syncResult.value = res.data.data;
    MessagePlugin.success("同步完成");
    await loadData();
  } catch (e: unknown) {
    const err = e as { message?: string };
    MessagePlugin.error("同步失败：" + (err.message || "未知错误"));
  } finally {
    syncingAll.value = false;
  }
}

async function handleSyncRange() {
  if (!rangeForm.value.startIssue || !rangeForm.value.endIssue) {
    MessagePlugin.warning("请填写起始和结束期号");
    return;
  }
  syncingRange.value = true;
  syncResult.value = null;
  try {
    const res = await officialDrawApi.syncRange(
      rangeForm.value.startIssue,
      rangeForm.value.endIssue,
    );
    syncResult.value = res.data.data;
    showRangeDialog.value = false;
    MessagePlugin.success("同步完成");
    await loadData();
  } catch (e: unknown) {
    const err = e as { message?: string };
    MessagePlugin.error("同步失败：" + (err.message || "未知错误"));
  } finally {
    syncingRange.value = false;
  }
}

// ── 列表查询 ──────────────────────────────────────────────
const tableLoading = ref(false);
const tableData = ref<Record<string, unknown>[]>([]);
const searchIssueNo = ref("");
const pagination = ref({ current: 1, pageSize: 20, total: 0 });

const columns = [
  { colKey: "issueNo", title: "期号", width: 100 },
  { colKey: "drawDate", title: "开奖日期", width: 120 },
  {
    colKey: "redNumbers",
    title: "红球号码",
    width: 260,
    cell: (_: unknown, { row }: { row: Record<string, unknown> }) => {
      const nums = row.redNumbers as number[];
      return h(
        "div",
        { class: "ticket-row" },
        nums.map((n: number) =>
          h(
            "span",
            { class: "number-ball number-ball--red" },
            String(n).padStart(2, "0"),
          ),
        ),
      );
    },
  },
  {
    colKey: "blueNumbers",
    title: "蓝球号码",
    width: 80,
    cell: (_: unknown, { row }: { row: Record<string, unknown> }) => {
      const nums = row.blueNumbers as number[];
      if (!nums || nums.length === 0) return h("span", "-");
      return h(
        "div",
        { class: "ticket-row" },
        nums.map((n: number) =>
          h(
            "span",
            { class: "number-ball number-ball--blue" },
            String(n).padStart(2, "0"),
          ),
        ),
      );
    },
  },
];

async function loadData() {
  tableLoading.value = true;
  try {
    const res = await officialDrawApi.list({
      issueNo: searchIssueNo.value || undefined,
      pageNum: pagination.value.current,
      pageSize: pagination.value.pageSize,
    });
    const page = res.data.data;
    tableData.value = page.records;
    pagination.value.total = page.total;
  } catch {
    MessagePlugin.error("加载数据失败");
  } finally {
    tableLoading.value = false;
  }
}

function handleSearch() {
  pagination.value.current = 1;
  loadData();
}

function handlePageChange({
  current,
  pageSize,
}: {
  current: number;
  pageSize: number;
}) {
  pagination.value.current = current;
  pagination.value.pageSize = pageSize;
  loadData();
}

onMounted(loadData);
</script>

<style scoped lang="scss">
.official-draw-sync {
  .sync-card,
  .list-card {
    :deep(.t-card__body) {
      padding: 16px;
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
