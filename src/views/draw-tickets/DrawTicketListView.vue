<template>
  <div class="page-container">
    <!-- 页面标题栏 -->
    <t-card :bordered="false" class="page-header-card">
      <div class="page-header">
        <div>
          <h3>摇奖票管理</h3>
          <p>管理您的彩票投注记录</p>
        </div>
        <div class="header-actions">
          <t-button theme="primary" @click="openAddDialog">
            <template #icon><t-icon name="add" /></template>
            新增摇奖票票
          </t-button>
          <t-button @click="$router.push('/draw-tickets/generate')">
            🎲 随机生成
          </t-button>
          <t-button
            theme="warning"
            :loading="backfilling"
            @click="handleBackfill"
          >
            🔄 同步中奖号码
          </t-button>
        </div>
      </div>
    </t-card>

    <!-- 历史最佳展示区 -->
    <t-card :bordered="false" style="margin-top: 12px" class="top-wins-card">
      <template #header>
        <div class="top-wins-header">
          <span class="top-wins-title">🏆 历史最佳</span>
          <div class="top-wins-controls">
            <t-radio-group
              v-model="topWinSortBy"
              variant="default-filled"
              size="small"
              @change="fetchTopWins"
            >
              <t-radio-button value="level">按等级</t-radio-button>
              <t-radio-button value="amount">按金额</t-radio-button>
            </t-radio-group>
            <t-select
              v-model="topWinModeId"
              placeholder="全部模式"
              clearable
              size="small"
              style="width: 120px; margin-left: 8px"
              @change="fetchTopWins"
            >
              <t-option
                v-for="m in drawModes"
                :key="m.id"
                :label="m.name"
                :value="m.id"
              />
            </t-select>
          </div>
        </div>
      </template>

      <div v-if="topWinsLoading" class="top-wins-loading">
        <t-loading size="small" />
      </div>
      <div v-else-if="topWins.length === 0" class="top-wins-empty">
        暂无中奖记录
      </div>
      <div v-else class="top-wins-list">
        <div
          v-for="(item, idx) in topWins"
          :key="item.id"
          class="top-win-item"
          :class="{ 'top-win-item--claimable': item.claimable }"
        >
          <!-- 排名徽章 -->
          <div class="rank-badge" :class="`rank-badge--${idx + 1}`">
            {{ idx + 1 }}
          </div>
          <!-- 模式 + 期号 -->
          <div class="top-win-meta">
            <t-tag theme="primary" variant="light" size="small">{{
              item.modeName
            }}</t-tag>
            <span class="issue-no">{{ item.issueNo || "" }}</span>
          </div>
          <!-- 号码球 -->
          <div class="top-win-numbers">
            <span
              v-for="n in parseNumberStr(item.redNumbers)"
              :key="`r${n}`"
              class="number-ball number-ball--red number-ball--sm"
              >{{ String(n).padStart(2, "0") }}</span
            >
            <span
              v-if="parseNumberStr(item.blueNumbers).length"
              class="separator"
              >|</span
            >
            <span
              v-for="n in parseNumberStr(item.blueNumbers)"
              :key="`b${n}`"
              class="number-ball number-ball--blue number-ball--sm"
              >{{ String(n).padStart(2, "0") }}</span
            >
          </div>
          <!-- 等级 + 金额 -->
          <div class="top-win-prize">
            <span class="level-name">{{
              item.levelName || `${item.winLevel}等奖`
            }}</span>
            <span
              v-if="item.winAmount && Number(item.winAmount) > 0"
              class="win-amount"
            >
              ¥{{ Number(item.winAmount).toFixed(0) }}
            </span>
            <span v-else class="win-amount win-amount--pool">浮动奖金</span>
          </div>
          <!-- 兑奖期提示 -->
          <div v-if="item.claimable" class="claim-badge">
            <t-tag theme="warning" variant="light" size="small">
              🔔 兑奖期内 · 截止 {{ formatDate(item.claimDeadline) }}
            </t-tag>
          </div>
        </div>
      </div>
    </t-card>

    <!-- 搜索过滤 -->
    <t-card :bordered="false" style="margin-top: 12px">
      <t-form :data="filterForm" layout="inline" @submit="handleSearch">
        <t-form-item label="彩票模式">
          <t-select
            v-model="filterForm.modeId"
            placeholder="全部模式"
            clearable
            style="width: 140px"
          >
            <t-option
              v-for="m in modes"
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
        <t-form-item label="中奖状态">
          <t-select
            v-model="filterForm.winStatus"
            placeholder="全部状态"
            clearable
            style="width: 120px"
          >
            <t-option label="待开奖" value="PENDING" />
            <t-option label="未中奖" value="NO_WIN" />
            <t-option label="已中奖" value="WIN" />
          </t-select>
        </t-form-item>
        <t-form-item label="兑奖期内">
          <t-switch v-model="filterForm.claimableOnly" size="small" />
          <span style="margin-left: 6px; font-size: 12px; color: #8b949e"
            >优先显示兑奖期内</span
          >
        </t-form-item>
        <t-form-item label="排序方式">
          <t-radio-group
            v-model="filterForm.sortBy"
            variant="default-filled"
            size="small"
          >
            <t-radio-button value="created">创建时间</t-radio-button>
            <t-radio-button value="draw">开奖时间</t-radio-button>
          </t-radio-group>
        </t-form-item>
        <t-form-item>
          <t-button type="submit" theme="primary">搜索</t-button>
          <t-button @click="handleReset" style="margin-left: 8px"
            >重置</t-button
          >
        </t-form-item>
      </t-form>
    </t-card>

    <!-- 数据表格 -->
    <t-card :bordered="false" style="margin-top: 12px">
      <t-table
        :data="tickets"
        :columns="columns"
        :loading="loading"
        row-key="id"
        stripe
        hover
        :pagination="pagination"
        :row-class-name="getRowClassName"
        @page-change="handlePageChange"
      >
        <template #issueNo="{ row }">
          <div style="display: flex; align-items: center; gap: 6px">
            <span>{{ row.issueNo || "—" }}</span>
            <t-tag
              v-if="row.claimable"
              theme="warning"
              variant="light"
              size="small"
              style="flex-shrink: 0"
              >兑奖期内</t-tag
            >
          </div>
        </template>
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
              :class="[
                'number-ball',
                'number-ball--red',
                { 'number-ball--winning': isWinningNumber(row, n, 'red') },
              ]"
              >{{ String(n).padStart(2, "0") }}</span
            >
            <span v-if="parseNumbers(row.blueNumbers).length" class="separator"
              >|</span
            >
            <span
              v-for="n in parseNumbers(row.blueNumbers)"
              :key="`b${n}`"
              :class="[
                'number-ball',
                'number-ball--blue',
                { 'number-ball--winning': isWinningNumber(row, n, 'blue') },
              ]"
              >{{ String(n).padStart(2, "0") }}</span
            >
          </div>
        </template>
        <template #betAmount="{ row }"
          >¥{{ Number(row.betAmount).toFixed(0) }}</template
        >
        <template #winStatus="{ row }">
          <t-tag :theme="winStatusTheme(row.winStatus)" variant="light">
            {{ winStatusLabel(row.winStatus) }}
          </t-tag>
        </template>
        <template #winLevel="{ row }">
          <span v-if="row.winStatus === 'WIN'">
            {{ row.levelName || (row.winLevel ? `${row.winLevel}等奖` : "—") }}
          </span>
          <span v-else style="color: #8b949e">—</span>
        </template>
        <template #winAmount="{ row }">
          <span v-if="row.winStatus === 'WIN'">
            <span
              v-if="!row.winAmount || Number(row.winAmount) === 0"
              style="color: #e6a23c; font-size: 12px"
              >待填写</span
            >
            <span v-else style="color: #00a870">
              ¥{{ Number(row.winAmount).toFixed(0) }}
            </span>
          </span>
          <span v-else style="color: #8b949e">—</span>
        </template>
        <template #drawTime="{ row }">
          <span v-if="row.drawTime" style="font-size: 12px">{{
            formatDate(row.drawTime)
          }}</span>
          <span v-else style="color: #8b949e">—</span>
        </template>
        <template #isClaimed="{ row }">
          <div v-if="row.winStatus === 'WIN'" class="claim-status-container">
            <!-- 已兑奖状态 -->
            <div v-if="row.isClaimed === 1" class="claim-status claimed">
              <div class="status-main">
                <t-tag
                  theme="success"
                  variant="light"
                  size="small"
                  class="status-tag"
                >
                  <t-icon name="check" />
                  已兑奖
                </t-tag>
                <t-button
                  theme="default"
                  variant="outline"
                  size="small"
                  class="action-btn undo-btn"
                  @click="handleClaimStatusChange(row.id, false)"
                >
                  <t-icon name="arrow-left" />
                  撤销
                </t-button>
              </div>
            </div>

            <!-- 未兑奖-有效期内 -->
            <div v-else-if="row.claimable" class="claim-status claimable">
              <div class="status-main">
                <t-tag
                  theme="warning"
                  variant="light"
                  size="small"
                  class="status-tag"
                >
                  <t-icon name="time" />
                  未兑奖-有效期内
                </t-tag>
                <t-button
                  theme="success"
                  variant="outline"
                  size="small"
                  class="action-btn claim-btn"
                  @click="handleClaimStatusChange(row.id, true)"
                >
                  <t-icon name="check" />
                  确认兑奖
                </t-button>
              </div>
              <div class="deadline-info">
                <t-icon name="calendar" />
                截止: {{ formatDate(row.claimDeadline) }}
              </div>
            </div>

            <!-- 未兑奖-超过有效期 -->
            <div v-else class="claim-status expired">
              <div class="status-main">
                <t-tag
                  theme="default"
                  variant="light"
                  size="small"
                  class="status-tag"
                >
                  <t-icon name="close" />
                  未兑奖-已过期
                </t-tag>
                <t-button
                  theme="default"
                  variant="text"
                  size="small"
                  class="action-btn expired-btn"
                  @click="handleClaimStatusChange(row.id, true)"
                  title="特殊情况下仍可标记为已兑奖"
                >
                  <t-icon name="edit" />
                  标记兑奖
                </t-button>
              </div>
            </div>
          </div>
          <div v-else class="no-claim-status">
            <span>—</span>
          </div>
        </template>
        <template #op="{ row }">
          <t-space>
            <t-link theme="primary" @click="openEditDialog(row)">编辑</t-link>
            <t-link theme="success" @click="openWinDialog(row)"
              >设置中奖</t-link
            >
            <t-popconfirm
              content="确定删除该记录？"
              @confirm="handleDelete(row.id)"
            >
              <t-link theme="danger">删除</t-link>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <!-- 新增/编辑弹窗 -->
    <t-dialog
      v-model:visible="formDialogVisible"
      :header="isEditing ? '编辑摇奖票' : '新增摇奖票'"
      width="520px"
      :confirm-btn="{
        content: checking ? '校验中...' : '保存',
        loading: checking || submitting,
      }"
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
          <t-select
            v-model="form.modeId"
            placeholder="请选择彩票模式"
            @change="onModeChange"
          >
            <t-option
              v-for="m in drawModes"
              :key="m.id"
              :label="m.name"
              :value="m.id"
            />
          </t-select>
        </t-form-item>
        <t-form-item label="期号" name="issueNo">
          <t-input v-model="form.issueNo" placeholder="期号（可选）" />
        </t-form-item>
        <t-form-item
          label="红球号码"
          name="redNumbersInput"
          help="逗号分隔，如：1,7,12,18,25,33"
        >
          <t-input
            v-model="form.redNumbersInput"
            :placeholder="redPlaceholder"
          />
        </t-form-item>
        <t-form-item
          v-if="currentModeHasBlue"
          label="蓝球号码"
          name="blueNumbersInput"
        >
          <t-input
            v-model="form.blueNumbersInput"
            :placeholder="bluePlaceholder"
          />
        </t-form-item>
        <t-form-item label="投注金额" name="betAmount">
          <t-input-number
            v-model="form.betAmount"
            :min="0"
            :decimal-places="0"
            style="width: 100%"
          />
        </t-form-item>
        <t-form-item label="备注">
          <t-textarea
            v-model="form.remark"
            placeholder="备注（可选）"
            :autosize="{ minRows: 2 }"
          />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 设置中奖弹窗 -->
    <t-dialog
      v-model:visible="winDialogVisible"
      header="手动设置中奖状态"
      width="440px"
      :confirm-btn="{ content: '确认', loading: winSubmitting }"
      @confirm="handleWinSubmit"
    >
      <t-form :data="winForm" label-align="right" label-width="90px">
        <t-form-item label="中奖状态">
          <t-select v-model="winForm.winStatus" @change="onWinStatusChange">
            <t-option label="待开奖" value="PENDING" />
            <t-option label="未中奖" value="NO_WIN" />
            <t-option label="已中奖" value="WIN" />
          </t-select>
        </t-form-item>
        <template v-if="winForm.winStatus === 'WIN'">
          <t-form-item label="中奖等级">
            <t-select
              v-model="winForm.winLevel"
              placeholder="请选择等级"
              :loading="winRulesLoading"
              @change="onWinLevelChange"
            >
              <t-option
                v-for="rule in currentWinRules"
                :key="rule.winLevel"
                :label="rule.levelName"
                :value="rule.winLevel"
              />
            </t-select>
          </t-form-item>
          <t-form-item label="中奖金额">
            <t-input-number
              v-model="winForm.winAmount"
              :min="0"
              :decimal-places="0"
              style="width: 100%"
            />
            <div
              v-if="currentWinRulePrizeType === 'POOL'"
              style="font-size: 12px; color: #e6a23c; margin-top: 4px"
            >
              浮动奖金，请手动填写实际中奖金额
            </div>
            <div
              v-else-if="currentWinRulePrizeType === 'FIXED'"
              style="font-size: 12px; color: #8b949e; margin-top: 4px"
            >
              固定奖金已自动填入，可手动修改
            </div>
          </t-form-item>
        </template>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { MessagePlugin, DialogPlugin } from "tdesign-vue-next";
import { useLotteryModeStore } from "@/store/lotteryMode";
import { storeToRefs } from "pinia";
import { drawTicketApi, winRuleApi } from "@/api";
import type { DrawTicket, TopWin } from "@/types";

const lotteryModeStore = useLotteryModeStore();
const { modes } = storeToRefs(lotteryModeStore);
const drawModes = computed(() => modes.value.filter((m) => m.type === "DRAW"));

// ---- 历史最佳----
const topWins = ref<TopWin[]>([]);
const topWinsLoading = ref(false);
const topWinSortBy = ref<"level" | "amount">("level");
const topWinModeId = ref<number | null>(null);

async function fetchTopWins() {
  topWinsLoading.value = true;
  try {
    const res = await drawTicketApi.topWins({
      sortBy: topWinSortBy.value,
      topN: 5,
      modeId: topWinModeId.value ?? undefined,
    });
    topWins.value = res.data.data || [];
  } catch {
    topWins.value = [];
  } finally {
    topWinsLoading.value = false;
  }
}

function parseNumberStr(val: string | null | undefined): number[] {
  if (!val) return [];
  return val
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

// 列表
const loading = ref(false);
const tickets = ref<DrawTicket[]>([]);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });

const filterForm = reactive({
  modeId: null as number | null,
  issueNo: "",
  winStatus: "",
  claimableOnly: true,
  sortBy: "created" as "created" | "draw",
});

const columns = [
  { colKey: "issueNo", title: "期号", width: 120 },
  { colKey: "modeName", title: "彩票模式", width: 110 },
  { colKey: "numbers", title: "号码" },
  { colKey: "betAmount", title: "投注金额", width: 100 },
  { colKey: "winStatus", title: "中奖状态", width: 100 },
  { colKey: "winLevel", title: "中奖等级", width: 110 },
  { colKey: "winAmount", title: "中奖金额", width: 110 },
  { colKey: "drawTime", title: "开奖时间", width: 110 },
  { colKey: "isClaimed", title: "兑奖状态", width: 160 },
  { colKey: "op", title: "操作", width: 220, fixed: "right" },
];

function getModeName(modeId: number) {
  return modes.value.find((m) => m.id === modeId)?.name || `模式${modeId}`;
}

function getRowClassName({ row }: { row: DrawTicket }) {
  return row.claimable ? "claimable-row" : "";
}

function parseNumbers(val: unknown): number[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as number[];
  if (typeof val === "string") {
    return val
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  }
  return [];
}

/**
 * 判断指定号码是否为中奖号码
 * @param row 摇奖票数据
 * @param number 号码
 * @param type 号码类型：'red' 或 'blue'
 * @returns 是否为中奖号码
 */
function isWinningNumber(
  row: DrawTicket,
  number: number,
  type: "red" | "blue",
): boolean {
  // 如果没有中奖号码信息，返回false
  if (!row.winningNumbers) return false;

  // 如果winningNumbers是字符串，需要解析JSON
  let winningNumbers = row.winningNumbers;
  if (typeof winningNumbers === "string") {
    try {
      winningNumbers = JSON.parse(winningNumbers);
    } catch (e) {
      console.warn("解析中奖号码JSON失败:", e);
      return false;
    }
  }

  // 检查是否为中奖号码
  if (type === "red") {
    return winningNumbers.winningRedNumbers?.includes(number) || false;
  } else {
    return winningNumbers.winningBlueNumbers?.includes(number) || false;
  }
}

function winStatusTheme(status: string) {
  return status === "WIN"
    ? "success"
    : status === "NO_WIN"
      ? "danger"
      : "default";
}

function winStatusLabel(status: string) {
  if (status === "WIN") return "已中奖";
  if (status === "NO_WIN") return "未中奖";
  return "待开奖";
}

async function fetchTickets() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (filterForm.modeId) params.modeId = filterForm.modeId;
    if (filterForm.issueNo) params.issueNo = filterForm.issueNo;
    if (filterForm.winStatus) params.winStatus = filterForm.winStatus;
    // 传递 claimablePriority 参数给后端，由后端SQL实现全局排序
    if (filterForm.claimableOnly) {
      params.claimablePriority = true;
    }
    params.sortBy = filterForm.sortBy;
    const res = await drawTicketApi.list(params);
    const data = res.data.data;
    tickets.value = data.records || [];
    pagination.total = data.total || 0;
  } catch {
    /* ignore */
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchTickets();
}
function handleReset() {
  filterForm.modeId = null;
  filterForm.issueNo = "";
  filterForm.winStatus = "";
  filterForm.claimableOnly = true;
  filterForm.sortBy = "created";
  pagination.current = 1;
  fetchTickets();
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
  fetchTickets();
}

// 新增/编辑
const formDialogVisible = ref(false);
const isEditing = ref(false);
const currentId = ref<number | null>(null);
const formRef = ref();
const submitting = ref(false);
const checking = ref(false); // 重复校验中

const form = reactive({
  modeId: null as number | null,
  issueNo: "",
  redNumbersInput: "",
  blueNumbersInput: "",
  betAmount: 2,
  remark: "",
});

const formRules = {
  modeId: [{ required: true, message: "请选择彩票模式" }],
  redNumbersInput: [{ required: true, message: "请输入红球号码" }],
  betAmount: [{ required: true, message: "请输入投注金额" }],
};

const currentModeHasBlue = computed(() => {
  const m = modes.value.find((m) => m.id === form.modeId);
  return !!(m && m.blueCount && m.blueCount > 0);
});

const redPlaceholder = computed(() => {
  const m = modes.value.find((m) => m.id === form.modeId);
  return m
    ? `${m.redCount}个红球（${m.redMin}-${m.redMax}），逗号分隔`
    : "红球号码，逗号分隔";
});

const bluePlaceholder = computed(() => {
  const m = modes.value.find((m) => m.id === form.modeId);
  return m
    ? `${m.blueCount}个蓝球（${m.blueMin}-${m.blueMax}），逗号分隔`
    : "蓝球号码，逗号分隔";
});

function onModeChange() {
  form.redNumbersInput = "";
  form.blueNumbersInput = "";
}

function openAddDialog() {
  isEditing.value = false;
  currentId.value = null;
  Object.assign(form, {
    modeId: drawModes.value[0]?.id || null,
    issueNo: "",
    redNumbersInput: "",
    blueNumbersInput: "",
    betAmount: 2,
    remark: "",
  });
  formDialogVisible.value = true;
}

function openEditDialog(row: DrawTicket) {
  isEditing.value = true;
  currentId.value = row.id;
  Object.assign(form, {
    modeId: row.modeId,
    issueNo: row.issueNo || "",
    redNumbersInput: parseNumbers(row.redNumbers).join(","),
    blueNumbersInput: parseNumbers(row.blueNumbers).join(","),
    betAmount: Number(row.betAmount),
    remark: row.remark || "",
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
  if (!redNumbers.length) {
    MessagePlugin.warning("请输入有效的红球号码");
    return;
  }
  const blueNumbers = currentModeHasBlue.value
    ? form.blueNumbersInput
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n))
    : [];

  const payload = {
    modeId: form.modeId,
    issueNo: form.issueNo || undefined,
    redNumbers,
    blueNumbers: blueNumbers.length ? blueNumbers : undefined,
    betAmount: form.betAmount,
    remark: form.remark || undefined,
  };

  // 新增时检查重复
  if (!isEditing.value) {
    checking.value = true;
    try {
      const dupRes = await drawTicketApi.checkDuplicate(payload);
      const duplicates = dupRes.data.data as DrawTicket[];
      if (duplicates && duplicates.length > 0) {
        // 构建重复记录描述
        const dupDesc = duplicates
          .slice(0, 3)
          .map((d) => {
            const parts = [`红球: ${d.redNumbers}`];
            if (d.blueNumbers) parts.push(`蓝球: ${d.blueNumbers}`);
            if (d.issueNo) parts.push(`期号: ${d.issueNo}`);
            parts.push(`金额: ¥${Number(d.betAmount).toFixed(0)}`);
            return parts.join(" | ");
          })
          .join("\n");
        const extra =
          duplicates.length > 3 ? `\n...共 ${duplicates.length} 条重复` : "";
        const confirmed = await new Promise<boolean>((resolve) => {
          const dialog = DialogPlugin.confirm({
            header: "检测到重复记录",
            body: `以下记录与您要新增的摇奖票完全相同：\n\n${dupDesc}${extra}\n\n是否仍要继续保存？`,
            confirmBtn: "仍要保存",
            cancelBtn: "取消",
            onConfirm: () => {
              dialog.hide();
              resolve(true);
            },
            onCancel: () => {
              dialog.hide();
              resolve(false);
            },
            onClose: () => {
              resolve(false);
            },
          });
        });
        if (!confirmed) return;
      }
    } catch {
      // 检查失败不阻断流程，继续提交
    } finally {
      checking.value = false;
    }
  }

  submitting.value = true;
  try {
    if (isEditing.value && currentId.value) {
      await drawTicketApi.update(currentId.value, payload);
      MessagePlugin.success("更新成功");
    } else {
      const res = await drawTicketApi.create(payload);
      const ticket = res.data.data as DrawTicket;
      formDialogVisible.value = false;
      // 自动中奖核对结果提示
      if (ticket?.winStatus === "WIN") {
        const levelText = ticket.winLevel ? `${ticket.winLevel}等奖` : "中奖";
        const amountText =
          ticket.winAmount && Number(ticket.winAmount) > 0
            ? `，中奖金额¥${Number(ticket.winAmount).toFixed(0)}`
            : "";
        notifyWin(
          `🎉 恭喜！期号${ticket.issueNo} 已中奖！${levelText}${amountText}`,
        );
      } else if (ticket?.winStatus === "NO_WIN" && ticket.issueNo) {
        MessagePlugin.info(`期号 ${ticket.issueNo} 未中奖`);
      } else {
        MessagePlugin.success("新增成功");
      }
      fetchTickets();
      return;
    }
    formDialogVisible.value = false;
    fetchTickets();
  } catch {
    /* ignore */
  } finally {
    submitting.value = false;
  }
}

/** 中奖通知弹窗（比普通toast 更醒目） */
function notifyWin(message: string) {
  // 使用 MessagePlugin 的success 并配合较长的 duration
  MessagePlugin.success({
    content: message,
    duration: 8000,
    closeBtn: true,
  });
}

async function handleDelete(id: number) {
  try {
    await drawTicketApi.delete(id);
    MessagePlugin.success("删除成功");
    fetchTickets();
  } catch {
    /* ignore */
  }
}

/** 更新兑奖状态 */
async function handleClaimStatusChange(id: number, claimed: boolean) {
  try {
    await drawTicketApi.updateClaimStatus(id, claimed ? 1 : 0);
    const message = claimed ? "已标记为已兑奖" : "已撤销兑奖状态";
    MessagePlugin.success(message);
    fetchTickets();
  } catch {
    MessagePlugin.error("更新兑奖状态失败");
  }
}

// 设置中奖
const winDialogVisible = ref(false);
const winSubmitting = ref(false);
const winCurrentId = ref<number | null>(null);
const winCurrentModeId = ref<number | null>(null);
const winRulesLoading = ref(false);

interface WinRule {
  winLevel: number;
  levelName: string;
  prizeType: string;
  fixedAmount: number | null;
}
const currentWinRules = ref<WinRule[]>([]);

const winForm = reactive({
  winStatus: "PENDING",
  winLevel: null as number | null,
  winAmount: 0,
});

/** 当前选中等级的奖金类型*/
const currentWinRulePrizeType = computed(() => {
  if (!winForm.winLevel) return null;
  return (
    currentWinRules.value.find((r) => r.winLevel === winForm.winLevel)
      ?.prizeType ?? null
  );
});

async function openWinDialog(row: DrawTicket) {
  winCurrentId.value = row.id;
  winCurrentModeId.value = row.modeId;
  Object.assign(winForm, {
    winStatus: row.winStatus,
    winLevel: row.winLevel ?? null,
    winAmount: Number(row.winAmount) || 0,
  });
  winDialogVisible.value = true;
  // 加载该模式的中奖规则
  await loadWinRules(row.modeId);
}

async function loadWinRules(modeId: number) {
  winRulesLoading.value = true;
  try {
    const res = await winRuleApi.listByModeId(modeId);
    currentWinRules.value = res.data.data || [];
  } catch {
    currentWinRules.value = [];
  } finally {
    winRulesLoading.value = false;
  }
}

/** 切换中奖状态时重置等级和金*/
function onWinStatusChange(status: string) {
  if (status !== "WIN") {
    winForm.winLevel = null;
    winForm.winAmount = 0;
  }
}

/** 选择等级时，若为 FIXED 类型自动填入固定金额 */
function onWinLevelChange(level: number) {
  const rule = currentWinRules.value.find((r) => r.winLevel === level);
  if (rule && rule.prizeType === "FIXED" && rule.fixedAmount != null) {
    winForm.winAmount = rule.fixedAmount;
  } else if (rule && rule.prizeType === "POOL") {
    winForm.winAmount = 0; // 浮动奖金，清空等待用户填写
  }
}

async function handleWinSubmit() {
  if (!winCurrentId.value) return;
  winSubmitting.value = true;
  try {
    await drawTicketApi.updateWinStatus(winCurrentId.value, {
      winStatus: winForm.winStatus,
      winLevel: winForm.winStatus === "WIN" ? winForm.winLevel : undefined,
      winAmount: winForm.winStatus === "WIN" ? winForm.winAmount : undefined,
    });
    MessagePlugin.success("中奖状态已更新");
    winDialogVisible.value = false;
    fetchTickets();
  } catch {
    /* ignore */
  } finally {
    winSubmitting.value = false;
  }
}

// 同步历史中奖号码
const backfilling = ref(false);
async function handleBackfill() {
  backfilling.value = true;
  try {
    const res = await drawTicketApi.backfillWinningNumbers();
    const { total, updated, skipped } = res.data.data as {
      total: number;
      updated: number;
      skipped: number;
    };
    MessagePlugin.success(
      `同步完成：共 ${total} 条，更新 ${updated} 条，跳过 ${skipped} 条`,
    );
    fetchTickets();
  } catch {
    MessagePlugin.error("同步失败，请重试");
  } finally {
    backfilling.value = false;
  }
}

onMounted(() => {
  if (!modes.value.length) lotteryModeStore.fetchModes();
  fetchTickets();
  fetchTopWins();
});
</script>

<style scoped lang="scss">
.page-container {
}

/* 兑奖期内行高亮 */
:deep(.claimable-row) {
  background: linear-gradient(90deg, #fffbf0 0%, #ffffff 100%) !important;
  &:hover {
    background: linear-gradient(90deg, #fff9e6 0%, #fafafa 100%) !important;
  }
}

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
.header-actions {
  display: flex;
  gap: 8px;
}
.form-hint {
  font-size: 12px;
  color: #8b949e;
  margin-top: 4px;
}

/* 历史最佳区域 */
.top-wins-card :deep(.t-card__header) {
  padding: 14px 20px 10px;
  border-bottom: 1px solid #e7e7e7;
}
.top-wins-card :deep(.t-card__body) {
  padding: 16px 20px;
}
.top-wins-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-wrap: wrap;
  gap: 12px;
}
.top-wins-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 6px;
}
.top-wins-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.top-wins-loading,
.top-wins-empty {
  text-align: center;
  padding: 32px 0;
  color: #8b949e;
  font-size: 14px;
}
.top-wins-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0;
}
.top-win-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e7e7e7;
  flex: 1 1 calc(50% - 6px);
  min-width: 420px;
  transition: all 0.2s ease;
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #d0d0d0;
    transform: translateY(-1px);
  }
  &--claimable {
    border-color: #faad14;
    background: linear-gradient(135deg, #fffbf0 0%, #fff9e6 100%);
    box-shadow: 0 2px 8px rgba(250, 173, 20, 0.15);
  }
}
.rank-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  background: #e0e0e0;
  color: #666;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  &--1 {
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    color: #8b6914;
    box-shadow: 0 2px 6px rgba(255, 215, 0, 0.4);
  }
  &--2 {
    background: linear-gradient(135deg, #c0c0c0 0%, #d8d8d8 100%);
    color: #555;
    box-shadow: 0 2px 6px rgba(192, 192, 192, 0.4);
  }
  &--3 {
    background: linear-gradient(135deg, #cd7f32 0%, #e09856 100%);
    color: #fff;
    box-shadow: 0 2px 6px rgba(205, 127, 50, 0.4);
  }
}
.top-win-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 85px;
  flex-shrink: 0;
  align-items: center;
}
.issue-no {
  font-size: 12px;
  color: #999;
  font-weight: 500;
  text-align: center;
}
.top-win-numbers {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: nowrap;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  padding: 2px 0;
  &::-webkit-scrollbar {
    height: 5px;
  }
  &::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: #d0d0d0;
    border-radius: 3px;
    &:hover {
      background: #b0b0b0;
    }
  }
}
.top-win-prize {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: 95px;
  flex-shrink: 0;
}
.level-name {
  font-size: 13px;
  font-weight: 600;
  color: #f59e0b;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.win-amount {
  font-size: 14px;
  color: #10b981;
  font-weight: 700;
  &--pool {
    color: #999;
    font-weight: 500;
    font-size: 12px;
  }
}
.claim-badge {
  flex-shrink: 0;
  margin-left: auto;
}

/* 号码球 */
.number-ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease;
  position: relative;

  &:hover {
    transform: scale(1.1);
  }

  &--red {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }

  &--blue {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  }

  &--sm {
    width: 22px;
    height: 22px;
    font-size: 11px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }

  /* 中奖号码特殊样式 */
  &--winning {
    animation: winning-glow 2s ease-in-out infinite alternate;
    box-shadow:
      0 0 12px rgba(255, 215, 0, 0.8),
      0 2px 4px rgba(0, 0, 0, 0.15);

    &::after {
      content: "★";
      position: absolute;
      top: -2px;
      right: -2px;
      font-size: 8px;
      color: #ffd700;
      text-shadow: 0 0 3px rgba(255, 215, 0, 0.8);
    }
  }
}

@keyframes winning-glow {
  0% {
    box-shadow:
      0 0 8px rgba(255, 215, 0, 0.6),
      0 2px 4px rgba(0, 0, 0, 0.15);
  }
  100% {
    box-shadow:
      0 0 16px rgba(255, 215, 0, 1),
      0 2px 4px rgba(0, 0, 0, 0.15);
  }
}
.separator {
  color: #d0d0d0;
  margin: 0 3px;
  font-weight: 300;
  font-size: 14px;
}
.ticket-row {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
}

/* 兑奖状态样式 */
.claim-status-container {
  min-width: 140px;
  padding: 4px 0;
}

.claim-status {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .status-main {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .status-tag {
    flex-shrink: 0;

    .t-icon {
      margin-right: 4px;
    }
  }

  .action-btn {
    flex-shrink: 0;
    min-width: 70px;
    height: 24px;
    padding: 0 8px;
    font-size: 12px;
    border-radius: 4px;
    transition: all 0.2s ease;

    .t-icon {
      margin-right: 2px;
      font-size: 12px;
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }

  .claim-btn {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-color: #10b981;
    color: white;

    &:hover {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      border-color: #059669;
    }
  }

  .undo-btn {
    border-color: #d1d5db;
    color: #6b7280;

    &:hover {
      border-color: #9ca3af;
      color: #374151;
      background-color: #f9fafb;
    }
  }

  .expired-btn {
    color: #9ca3af;

    &:hover {
      color: #6b7280;
      background-color: #f9fafb;
    }
  }

  .deadline-info {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #f59e0b;
    background: #fffbeb;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #fde68a;

    .t-icon {
      font-size: 10px;
    }
  }

  &.claimed {
    .status-tag {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border-color: #10b981;
      color: #059669;
    }
  }

  &.claimable {
    .status-tag {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border-color: #f59e0b;
      color: #d97706;
    }
  }

  &.expired {
    .status-tag {
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-color: #d1d5db;
      color: #6b7280;
    }
  }
}

.no-claim-status {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  color: #9ca3af;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .top-win-item {
    min-width: 380px;
  }
}

@media (max-width: 1200px) {
  .top-win-item {
    flex: 1 1 100%;
    min-width: 320px;
  }
}

@media (max-width: 768px) {
  .top-wins-card :deep(.t-card__body) {
    padding: 12px 16px;
  }
  .top-wins-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .top-wins-controls {
    width: 100%;
    flex-wrap: wrap;
  }
  .top-win-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
  }
  .rank-badge {
    position: absolute;
    top: 12px;
    right: 12px;
  }
  .top-win-item {
    position: relative;
    padding-right: 48px;
  }
  .top-win-numbers {
    width: 100%;
    padding: 4px 0;
  }
  .top-win-prize {
    align-items: flex-start;
    width: 100%;
  }
  .claim-badge {
    margin-left: 0;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .top-win-item {
    min-width: 280px;
  }
  .number-ball--sm {
    width: 20px;
    height: 20px;
    font-size: 10px;
  }
}
</style>
