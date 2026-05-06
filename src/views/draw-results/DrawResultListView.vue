<template>
  <div class="page-container">
    <t-card :bordered="false" class="page-header-card">
      <div class="page-header">
        <div>
          <h3>开奖记录</h3>
          <p>管理开奖结果并核对中奖情况</p>
        </div>
        <t-button theme="primary" @click="openAddDialog">
          <template #icon><t-icon name="add" /></template>
          录入开奖结果
        </t-button>
      </div>
    </t-card>

    <!-- 搜索 -->
    <t-card :bordered="false" style="margin-top: 12px">
      <t-form :data="filterForm" layout="inline">
        <t-form-item label="彩票模式">
          <t-select
            v-model="filterForm.modeId"
            placeholder="全部模式"
            clearable
            style="width: 140px"
          >
            <t-option
              v-for="m in drawModes"
              :key="m.id"
              :label="m.name"
              :value="m.id"
            />
          </t-select>
        </t-form-item>
        <t-form-item label="期号">
          <t-input
            v-model="filterForm.issueNo"
            placeholder="期号"
            clearable
            style="width: 140px"
          />
        </t-form-item>
        <t-form-item>
          <t-button theme="primary" @click="handleSearch">搜索</t-button>
          <t-button @click="handleReset" style="margin-left: 8px"
            >重置</t-button
          >
        </t-form-item>
      </t-form>
    </t-card>

    <!-- 表格 -->
    <t-card :bordered="false" style="margin-top: 12px">
      <t-table
        :data="results"
        :columns="columns"
        :loading="loading"
        row-key="id"
        stripe
        hover
        :pagination="pagination"
        @page-change="handlePageChange"
      >
        <template #modeName="{ row }">
          <t-tag theme="primary" variant="light">{{
            getModeName(row.modeId)
          }}</t-tag>
        </template>
        <template #numbers="{ row }">
          <div class="ticket-row">
            <span
              v-for="n in parseNumbers(row.redNumbers)"
              :key="`r${n}`"
              class="number-ball number-ball--red"
              >{{ String(n).padStart(2, "0") }}</span
            >
            <span v-if="parseNumbers(row.blueNumbers).length" class="separator"
              >|</span
            >
            <span
              v-for="n in parseNumbers(row.blueNumbers)"
              :key="`b${n}`"
              class="number-ball number-ball--blue"
              >{{ String(n).padStart(2, "0") }}</span
            >
          </div>
        </template>
        <template #op="{ row }">
          <t-space>
            <t-link theme="primary" @click="openEditDialog(row)">编辑</t-link>
            <t-link theme="success" @click="handleWinCheck(row)"
              >核对中奖</t-link
            >
          </t-space>
        </template>
      </t-table>
    </t-card>

    <!-- 新增/编辑弹窗 -->
    <t-dialog
      v-model:visible="formDialogVisible"
      :header="isEditing ? '编辑开奖结果' : '录入开奖结果'"
      width="520px"
      :confirm-btn="{ content: '保存', loading: submitting }"
      @confirm="handleFormSubmit"
    >
      <t-form
        ref="formRef"
        :data="form"
        :rules="formRules"
        label-align="right"
        label-width="90px"
      >
        <t-form-item label="彩票模式" name="modeId">
          <t-select v-model="form.modeId" placeholder="请选择彩票模式">
            <t-option
              v-for="m in drawModes"
              :key="m.id"
              :label="m.name"
              :value="m.id"
            />
          </t-select>
        </t-form-item>
        <t-form-item label="期号" name="issueNo">
          <t-input v-model="form.issueNo" placeholder="请输入期号" />
        </t-form-item>
        <t-form-item label="开奖号码" name="redNumbersInput">
          <t-input
            v-model="form.redNumbersInput"
            placeholder="红球，逗号分隔，如：1,7,12,18,25,33"
          />
        </t-form-item>
        <t-form-item v-if="currentModeHasBlue" label="蓝球号码">
          <t-input
            v-model="form.blueNumbersInput"
            placeholder="蓝球，逗号分隔，如：8"
          />
        </t-form-item>
        <t-form-item label="开奖日期" name="drawDate">
          <t-date-picker v-model="form.drawDate" style="width: 100%" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 核对结果弹窗 -->
    <t-dialog
      v-model:visible="winCheckDialogVisible"
      header="中奖核对结果"
      width="440px"
      :footer="false"
    >
      <div v-if="winCheckLoading" style="text-align: center; padding: 32px">
        <t-loading size="large" text="正在核对中奖..." />
      </div>
      <div v-else-if="winCheckResult">
        <t-descriptions :items="winCheckItems" layout="horizontal" bordered />
      </div>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { MessagePlugin } from "tdesign-vue-next";
import { useLotteryModeStore } from "@/store/lotteryMode";
import { storeToRefs } from "pinia";
import { drawResultApi } from "@/api";
import type { DrawResult } from "@/types";

const lotteryModeStore = useLotteryModeStore();
const { modes } = storeToRefs(lotteryModeStore);
const drawModes = computed(() => modes.value.filter((m) => m.type === "DRAW"));

const loading = ref(false);
const results = ref<DrawResult[]>([]);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });
const filterForm = reactive({ modeId: null as number | null, issueNo: "" });

const columns = [
  { colKey: "issueNo", title: "期号", width: 120 },
  { colKey: "modeName", title: "彩票模式", width: 110 },
  { colKey: "numbers", title: "开奖号码" },
  { colKey: "drawDate", title: "开奖日期", width: 120 },
  { colKey: "op", title: "操作", width: 160, fixed: "right" },
];

function getModeName(modeId: number) {
  return modes.value.find((m) => m.id === modeId)?.name || `模式${modeId}`;
}

function parseNumbers(val: unknown): number[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as number[];
  if (typeof val === "string")
    return val
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  return [];
}

const currentModeHasBlue = computed(() => {
  const m = modes.value.find((m) => m.id === form.modeId);
  return !!(m && m.blueCount && m.blueCount > 0);
});

async function fetchResults() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (filterForm.modeId) params.modeId = filterForm.modeId;
    if (filterForm.issueNo) params.issueNo = filterForm.issueNo;
    const res = await drawResultApi.list(params);
    const data = res.data.data;
    results.value = data.records || [];
    pagination.total = data.total || 0;
  } catch {
    /* ignore */
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchResults();
}
function handleReset() {
  filterForm.modeId = null;
  filterForm.issueNo = "";
  pagination.current = 1;
  fetchResults();
}
function handlePageChange({
  current,
  pageSize,
}: {
  current: number;
  pageSize: number;
}) {
  pagination.current = current;
  pagination.pageSize = pageSize;
  fetchResults();
}

const formDialogVisible = ref(false);
const isEditing = ref(false);
const currentId = ref<number | null>(null);
const formRef = ref();
const submitting = ref(false);
const form = reactive({
  modeId: null as number | null,
  issueNo: "",
  redNumbersInput: "",
  blueNumbersInput: "",
  drawDate: "",
});
const formRules = {
  modeId: [{ required: true, message: "请选择彩票模式" }],
  issueNo: [{ required: true, message: "请输入期号" }],
  redNumbersInput: [{ required: true, message: "请输入开奖号码" }],
  drawDate: [{ required: true, message: "请选择开奖日期" }],
};

function openAddDialog() {
  isEditing.value = false;
  currentId.value = null;
  Object.assign(form, {
    modeId: drawModes.value[0]?.id || null,
    issueNo: "",
    redNumbersInput: "",
    blueNumbersInput: "",
    drawDate: "",
  });
  formDialogVisible.value = true;
}

function openEditDialog(row: DrawResult) {
  isEditing.value = true;
  currentId.value = row.id;
  Object.assign(form, {
    modeId: row.modeId,
    issueNo: row.issueNo,
    redNumbersInput: parseNumbers(row.redNumbers).join(","),
    blueNumbersInput: parseNumbers(row.blueNumbers).join(","),
    drawDate: row.drawDate,
  });
  formDialogVisible.value = true;
}

async function handleFormSubmit() {
  const valid = await formRef.value?.validate();
  if (valid !== true) return;
  const redNumbers = form.redNumbersInput
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
  const blueNumbers = currentModeHasBlue.value
    ? form.blueNumbersInput
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n))
    : [];
  submitting.value = true;
  try {
    const payload = {
      modeId: form.modeId,
      issueNo: form.issueNo,
      redNumbers,
      blueNumbers: blueNumbers.length ? blueNumbers : undefined,
      drawDate: form.drawDate,
    };
    if (isEditing.value && currentId.value) {
      await drawResultApi.update(currentId.value, payload);
      MessagePlugin.success("更新成功");
    } else {
      await drawResultApi.create(payload);
      MessagePlugin.success("录入成功");
    }
    formDialogVisible.value = false;
    fetchResults();
  } catch {
    /* ignore */
  } finally {
    submitting.value = false;
  }
}

// 核对中奖
const winCheckDialogVisible = ref(false);
const winCheckLoading = ref(false);
const winCheckResult = ref<Record<string, unknown> | null>(null);
const winCheckItems = computed(() => {
  if (!winCheckResult.value) return [];
  return [
    {
      label: "总注数",
      content: String(winCheckResult.value.totalTickets || 0),
    },
    {
      label: "中奖注数",
      content: String(winCheckResult.value.winTickets || 0),
    },
  ];
});

async function handleWinCheck(row: DrawResult) {
  winCheckResult.value = null;
  winCheckLoading.value = true;
  winCheckDialogVisible.value = true;
  try {
    const res = await drawResultApi.winCheck(row.id);
    winCheckResult.value = res.data.data;
    fetchResults();
  } catch {
    winCheckDialogVisible.value = false;
  } finally {
    winCheckLoading.value = false;
  }
}

onMounted(() => {
  if (!modes.value.length) lotteryModeStore.fetchModes();
  fetchResults();
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
</style>
