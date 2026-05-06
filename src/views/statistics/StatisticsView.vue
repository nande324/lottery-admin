<template>
  <div class="page-container">
    <!-- 筛选栏 -->
    <t-card :bordered="false" class="filter-card">
      <div class="filter-row">
        <div class="filter-left">
          <!-- 时间范围 -->
          <t-radio-group
            v-model="filterForm.timeRange"
            variant="default-filled"
            @change="handleSearch"
          >
            <t-radio-button value="ALL">全部</t-radio-button>
            <t-radio-button value="YEAR">本年</t-radio-button>
            <t-radio-button value="MONTH">本月</t-radio-button>
            <t-radio-button value="WEEK">本周</t-radio-button>
          </t-radio-group>
          <!-- 彩票模式 -->
          <t-select
            v-model="filterForm.modeId"
            placeholder="全部模式"
            clearable
            style="width: 140px; margin-left: 12px"
            @change="handleSearch"
          >
            <t-option
              v-for="m in modes"
              :key="m.id"
              :label="m.name"
              :value="m.id"
            />
          </t-select>
        </div>
        <!-- 刷新按钮：图标+文字，更明显 -->
        <t-button
          theme="primary"
          variant="outline"
          :loading="loading"
          @click="handleSearch"
        >
          🔄 刷新数据
        </t-button>
      </div>
    </t-card>

    <!-- Tab 切换 -->
    <t-tabs v-model="activeTab" style="margin-top: 12px">
      <!-- ===== Tab 1: 核心指标 ===== -->
      <t-tab-panel value="overview" label="📊 核心指标">
        <div class="tab-content">
          <!-- 财务概览 4 大卡片 -->
          <t-row :gutter="[12, 12]">
            <t-col :span="6">
              <div class="metric-card metric-card--cost">
                <div class="metric-icon">💸</div>
                <div class="metric-body">
                  <div class="metric-label">历史总投入</div>
                  <div class="metric-value">¥{{ fmt(adv.totalCost) }}</div>
                </div>
              </div>
            </t-col>
            <t-col :span="6">
              <div class="metric-card metric-card--win">
                <div class="metric-icon">🏆</div>
                <div class="metric-body">
                  <div class="metric-label">历史总中奖</div>
                  <div class="metric-value">¥{{ fmt(adv.totalWin) }}</div>
                </div>
              </div>
            </t-col>
            <t-col :span="6">
              <div
                class="metric-card"
                :class="
                  Number(adv.netProfit) >= 0
                    ? 'metric-card--profit'
                    : 'metric-card--loss'
                "
              >
                <div class="metric-icon">
                  {{ Number(adv.netProfit) >= 0 ? "📈" : "📉" }}
                </div>
                <div class="metric-body">
                  <div class="metric-label">净盈亏</div>
                  <div class="metric-value">
                    {{ Number(adv.netProfit) >= 0 ? "+" : "" }}¥{{
                      fmt(adv.netProfit)
                    }}
                  </div>
                </div>
              </div>
            </t-col>
            <t-col :span="6">
              <div
                class="metric-card"
                :class="
                  Number(adv.roi) >= 0
                    ? 'metric-card--profit'
                    : 'metric-card--loss'
                "
              >
                <div class="metric-icon">📐</div>
                <div class="metric-body">
                  <div class="metric-label">ROI 收益率</div>
                  <div class="metric-value">
                    {{ Number(adv.roi) >= 0 ? "+" : ""
                    }}{{ Number(adv.roi).toFixed(1) }}%
                  </div>
                </div>
              </div>
            </t-col>
          </t-row>

          <!-- 次级指标网格 -->
          <div class="metrics-grid" style="margin-top: 12px">
            <div
              class="mini-metric"
              v-for="m in secondaryMetrics"
              :key="m.label"
            >
              <div class="mini-icon">{{ m.icon }}</div>
              <div class="mini-label">{{ m.label }}</div>
              <div class="mini-value" :class="m.class">{{ m.value }}</div>
            </div>
          </div>

          <!-- 图表行：趋势图独占一行 -->
          <t-card title="盈亏趋势图" :bordered="false" style="margin-top: 12px">
            <t-empty v-if="!trendData.length" description="暂无数据" />
            <!-- v-show 保持 DOM 存在，避免 ref 在 nextTick 后仍为 null -->
            <div
              v-show="trendData.length > 0"
              ref="trendRef"
              style="height: 360px"
            />
          </t-card>

          <!-- 投入产出对比 -->
          <t-card
            title="投入产出对比"
            :bordered="false"
            style="margin-top: 12px"
          >
            <t-empty
              v-if="Number(adv.totalCost) === 0 && Number(adv.totalWin) === 0"
              description="暂无数据"
            />
            <div
              v-show="Number(adv.totalCost) > 0 || Number(adv.totalWin) > 0"
              ref="barRef"
              style="height: 280px"
            />
          </t-card>
        </div>
      </t-tab-panel>

      <!-- ===== Tab 2: 摇奖分析 ===== -->
      <t-tab-panel value="win" label="🎫 摇奖分析">
        <div class="tab-content">
          <!-- 摇奖专属指标网格 -->
          <div class="metrics-grid">
            <div class="mini-metric" v-for="m in winMetrics" :key="m.label">
              <div class="mini-icon">{{ m.icon }}</div>
              <div class="mini-label">{{ m.label }}</div>
              <div class="mini-value" :class="m.class">{{ m.value }}</div>
              <div
                v-if="m.sub"
                style="font-size: 11px; color: #aaa; margin-top: 2px"
              >
                {{ m.sub }}
              </div>
            </div>
          </div>

          <!-- 各等奖分布 + 奖项分布图 -->
          <t-row :gutter="12" style="margin-top: 12px">
            <t-col :span="12">
              <t-card title="各等奖中奖次数" :bordered="false">
                <t-empty v-if="!hasWinLevels" description="暂无中奖记录" />
                <div v-else class="win-level-list">
                  <div
                    v-for="[level, count] in winLevelEntries"
                    :key="level"
                    class="win-level-item"
                  >
                    <span class="level-badge">{{
                      adv.winLevelNames?.[level] || level + "等奖"
                    }}</span>
                    <div class="level-bar-wrap">
                      <div
                        class="level-bar"
                        :style="{ width: (count / maxLevelCount) * 100 + '%' }"
                      />
                    </div>
                    <span class="level-count">{{ count }} 次</span>
                  </div>
                </div>
              </t-card>
            </t-col>
            <t-col :span="12">
              <t-card title="奖项分布图" :bordered="false">
                <t-empty v-if="!hasWinLevels" description="暂无中奖记录" />
                <div v-show="hasWinLevels" ref="pieRef" style="height: 260px" />
              </t-card>
            </t-col>
          </t-row>

          <!-- 各模式消费占比 -->
          <t-card
            title="各模式消费占比"
            :bordered="false"
            style="margin-top: 12px"
          >
            <t-empty v-if="!modeData.length" description="暂无数据" />
            <div
              v-show="modeData.length > 0"
              ref="modePieRef"
              style="height: 260px"
            />
          </t-card>
        </div>
      </t-tab-panel>

      <!-- ===== Tab 3: 刮刮乐分析 ===== -->
      <t-tab-panel value="scratch" label="🎰 刮刮乐">
        <div class="tab-content">
          <t-row :gutter="[12, 12]">
            <t-col :span="6">
              <div class="metric-card metric-card--cost">
                <div class="metric-icon">💸</div>
                <div class="metric-body">
                  <div class="metric-label">刮刮乐总投入</div>
                  <div class="metric-value">
                    ¥{{ fmt(adv.scratchTotalCost) }}
                  </div>
                </div>
              </div>
            </t-col>
            <t-col :span="6">
              <div class="metric-card metric-card--win">
                <div class="metric-icon">🎊</div>
                <div class="metric-body">
                  <div class="metric-label">刮刮乐总中奖</div>
                  <div class="metric-value">
                    ¥{{ fmt(adv.scratchTotalWin) }}
                  </div>
                </div>
              </div>
            </t-col>
            <t-col :span="6">
              <div
                class="metric-card"
                :class="
                  Number(adv.scratchNetProfit) >= 0
                    ? 'metric-card--profit'
                    : 'metric-card--loss'
                "
              >
                <div class="metric-icon">
                  {{ Number(adv.scratchNetProfit) >= 0 ? "📈" : "📉" }}
                </div>
                <div class="metric-body">
                  <div class="metric-label">刮刮乐净盈亏</div>
                  <div class="metric-value">
                    {{ Number(adv.scratchNetProfit) >= 0 ? "+" : "" }}¥{{
                      fmt(adv.scratchNetProfit)
                    }}
                  </div>
                </div>
              </div>
            </t-col>
            <t-col :span="6">
              <div class="metric-card metric-card--neutral">
                <div class="metric-icon">📐</div>
                <div class="metric-body">
                  <div class="metric-label">刮刮乐中奖率</div>
                  <div class="metric-value">
                    {{ fmtPct(adv.scratchWinRate) }}
                  </div>
                </div>
              </div>
            </t-col>
          </t-row>

          <div class="metrics-grid" style="margin-top: 12px">
            <div class="mini-metric">
              <div class="mini-icon">🎫</div>
              <div class="mini-label">总张数</div>
              <div class="mini-value">{{ adv.scratchTotalQuantity }}</div>
            </div>
            <div class="mini-metric">
              <div class="mini-icon">🏅</div>
              <div class="mini-label">中奖次数</div>
              <div class="mini-value text-win">{{ adv.scratchWinCount }}</div>
            </div>
            <div class="mini-metric">
              <div class="mini-icon">💰</div>
              <div class="mini-label">最高单笔中奖</div>
              <div class="mini-value text-win">
                ¥{{ fmt(adv.scratchMaxSingleWin) }}
              </div>
            </div>
            <div class="mini-metric">
              <div class="mini-icon">💎</div>
              <div class="mini-label">大额中奖次数</div>
              <div class="mini-value text-win">
                {{ adv.scratchBigWinCount }}
              </div>
            </div>
          </div>

          <!-- 刮刮乐趋势图 -->
          <t-card
            title="刮刮乐盈亏趋势"
            :bordered="false"
            style="margin-top: 12px"
          >
            <t-empty v-if="!scratchTrendData.length" description="暂无数据" />
            <div
              v-show="scratchTrendData.length > 0"
              ref="scratchTrendRef"
              style="height: 300px"
            />
          </t-card>
        </div>
      </t-tab-panel>

      <!-- ===== Tab 4: 成就徽章墙 ===== -->
      <t-tab-panel value="achievements" label="🏅 成就徽章">
        <div class="tab-content">
          <div class="achievement-wall">
            <div
              v-for="badge in adv.achievements"
              :key="badge.id"
              class="badge-card"
              :class="{
                'badge-card--unlocked': badge.unlocked,
                'badge-card--locked': !badge.unlocked,
              }"
            >
              <div class="badge-icon">{{ badge.icon }}</div>
              <div class="badge-name">{{ badge.name }}</div>
              <div class="badge-desc">{{ badge.description }}</div>
              <div v-if="badge.unlocked && badge.unlockedAt" class="badge-date">
                {{ fmtDate(badge.unlockedAt) }}
              </div>
              <div v-if="!badge.unlocked" class="badge-locked-tip">
                🔒 未解锁
              </div>
            </div>
          </div>
        </div>
      </t-tab-panel>

      <!-- ===== Tab 4: 高光时间轴 ===== -->
      <t-tab-panel value="timeline" label="⭐ 高光时刻">
        <div class="tab-content">
          <t-empty
            v-if="!adv.highlights?.length"
            description="暂无高光时刻，继续加油！"
          />
          <div v-else class="timeline">
            <div
              v-for="(event, idx) in adv.highlights"
              :key="idx"
              class="timeline-item"
            >
              <div class="timeline-dot" />
              <div class="timeline-content">
                <div class="timeline-title">{{ event.title }}</div>
                <div class="timeline-desc">{{ event.description }}</div>
                <div class="timeline-meta">
                  <span v-if="event.issueNo">期号：{{ event.issueNo }}</span>
                  <span v-if="event.amount && Number(event.amount) > 0">
                    金额：¥{{ fmt(event.amount) }}
                  </span>
                  <span v-if="event.time">{{ fmtDate(event.time) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </t-tab-panel>
    </t-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from "vue";
import * as echarts from "echarts";
import { useLotteryModeStore } from "@/store/lotteryMode";
import { storeToRefs } from "pinia";
import { statisticsApi } from "@/api";
import type { AdvancedStatistics, TrendPoint, ModeDistribution } from "@/types";

const lotteryModeStore = useLotteryModeStore();
const { modes } = storeToRefs(lotteryModeStore);

const activeTab = ref("overview");
const loading = ref(false);

const filterForm = reactive({
  modeId: null as number | null,
  timeRange: "ALL",
});

// 默认空数据
const emptyAdv: AdvancedStatistics = {
  totalCost: 0,
  totalWin: 0,
  netProfit: 0,
  roi: 0,
  totalIssues: 0,
  totalTickets: 0,
  avgCostPerIssue: 0,
  currentBlankStreak: 0,
  maxWinStreak: 0,
  maxBlankStreak: 0,
  firstWinTime: null,
  firstWinIssueNo: null,
  lastWinTime: null,
  lastWinIssueNo: null,
  maxSingleWin: 0,
  bestWinLevel: null,
  bestWinLevelName: null,
  maxBetAmount: 0,
  winRate: 0,
  winTickets: 0,
  avgWinInterval: 0,
  bigWinCount: 0,
  winLevelDistribution: {},
  winLevelNames: {},
  achievements: [],
  highlights: [],
  scratchTotalCost: 0,
  scratchTotalWin: 0,
  scratchNetProfit: 0,
  scratchTotalQuantity: 0,
  scratchWinCount: 0,
  scratchWinRate: 0,
  scratchMaxSingleWin: 0,
  scratchBigWinCount: 0,
};

const adv = ref<AdvancedStatistics>({ ...emptyAdv });
const trendData = ref<TrendPoint[]>([]);
const modeData = ref<ModeDistribution[]>([]);
const scratchTrendData = ref<TrendPoint[]>([]);

const trendRef = ref<HTMLDivElement>();
const barRef = ref<HTMLDivElement>();
const pieRef = ref<HTMLDivElement>();
const modePieRef = ref<HTMLDivElement>();
const scratchTrendRef = ref<HTMLDivElement>();

// ---- 格式化工具 ----
function fmt(val: number | string | null | undefined): string {
  if (val == null) return "0";
  const n = Number(val);
  return Number.isInteger(n) ? String(n) : n.toFixed(0);
}
function fmtDate(val: string | null | undefined): string {
  if (!val) return "";
  return val.slice(0, 10);
}
function fmtPct(val: number): string {
  return (Number(val) * 100).toFixed(1) + "%";
}

// ---- 核心指标次级指标（全品类合并）----
const secondaryMetrics = computed(() => {
  // 合并中奖次数和中奖率（摇奖+刮刮乐）
  const totalWinCount = adv.value.winTickets + adv.value.scratchWinCount;
  const totalAllCount = adv.value.totalTickets + adv.value.scratchTotalQuantity;
  const combinedWinRate = totalAllCount > 0 ? totalWinCount / totalAllCount : 0;
  // 合并最高单笔
  const maxWin = Math.max(
    Number(adv.value.maxSingleWin),
    Number(adv.value.scratchMaxSingleWin),
  );
  // 合并大额中奖次数
  const bigWinTotal = adv.value.bigWinCount + adv.value.scratchBigWinCount;

  return [
    {
      icon: "🎫",
      label: "摇奖总注数",
      value: String(adv.value.totalTickets),
      class: "",
    },
    {
      icon: "🎰",
      label: "刮刮乐总张数",
      value: String(adv.value.scratchTotalQuantity),
      class: "",
    },
    {
      icon: "🏅",
      label: "合计中奖次数",
      value: String(totalWinCount),
      class: "text-win",
    },
    {
      icon: "📊",
      label: "合计中奖率",
      value: fmtPct(combinedWinRate),
      class: "",
    },
    {
      icon: "💰",
      label: "最高单笔中奖",
      value: "¥" + fmt(maxWin),
      class: "text-win",
    },
    {
      icon: "💎",
      label: "大额中奖次数",
      value: String(bigWinTotal),
      class: bigWinTotal > 0 ? "text-win" : "",
    },
    {
      icon: "💸",
      label: "刮刮乐净盈亏",
      value:
        (Number(adv.value.scratchNetProfit) >= 0 ? "+" : "") +
        "¥" +
        fmt(adv.value.scratchNetProfit),
      class: Number(adv.value.scratchNetProfit) >= 0 ? "text-win" : "text-loss",
    },
    {
      icon: "📉",
      label: "摇奖净盈亏",
      value: (() => {
        const drawProfit =
          Number(adv.value.netProfit) - Number(adv.value.scratchNetProfit);
        return (drawProfit >= 0 ? "+" : "") + "¥" + fmt(drawProfit);
      })(),
      class: (() => {
        const drawProfit =
          Number(adv.value.netProfit) - Number(adv.value.scratchNetProfit);
        return drawProfit >= 0 ? "text-win" : "text-loss";
      })(),
    },
    {
      icon: "📐",
      label: "摇奖中奖率",
      value: fmtPct(adv.value.winRate),
      class: "",
    },
    {
      icon: "🎰",
      label: "刮刮乐中奖率",
      value: fmtPct(adv.value.scratchWinRate),
      class: "",
    },
  ];
});

// ---- 摇奖分析指标 ----
const winMetrics = computed(() => [
  // 基础数量
  {
    icon: "📅",
    label: "总期数",
    value: String(adv.value.totalIssues),
    class: "",
    sub: "不同期号数量",
  },
  {
    icon: "🎫",
    label: "总注数",
    value: String(adv.value.totalTickets),
    class: "",
    sub: null,
  },
  {
    icon: "💵",
    label: "平均每期投入",
    value: (() => {
      if (!adv.value.totalIssues) return "—";
      const drawCost =
        Number(adv.value.totalCost) - Number(adv.value.scratchTotalCost);
      return "¥" + fmt(drawCost / adv.value.totalIssues);
    })(),
    class: "",
    sub: "仅摇奖投入",
  },
  {
    icon: "📊",
    label: "摇奖中奖率",
    value: fmtPct(adv.value.winRate),
    class: "",
    sub: String(adv.value.winTickets) + " 注中奖",
  },
  // 连中/空窗
  {
    icon: "🥇",
    label: "最高中奖等级",
    value: adv.value.bestWinLevelName || "—",
    class: "text-win",
    sub: null,
  },
  {
    icon: "🔥",
    label: "最长连中",
    value: adv.value.maxWinStreak + " 注",
    class: adv.value.maxWinStreak >= 3 ? "text-win" : "",
    sub: null,
  },
  {
    icon: "❄️",
    label: "最长空窗",
    value: adv.value.maxBlankStreak + " 注",
    class: "",
    sub: null,
  },
  {
    icon: "⚠️",
    label: "当前空窗",
    value: adv.value.currentBlankStreak + " 注",
    class: adv.value.currentBlankStreak > 10 ? "text-loss" : "",
    sub: null,
  },
  // 中奖记录
  {
    icon: "🌅",
    label: "首次中奖",
    value: adv.value.firstWinIssueNo || "—",
    class: "",
    sub: adv.value.firstWinTime ? fmtDate(adv.value.firstWinTime) : null,
  },
  {
    icon: "⭐",
    label: "最近中奖",
    value: adv.value.lastWinIssueNo || "—",
    class: "",
    sub: adv.value.lastWinTime ? fmtDate(adv.value.lastWinTime) : null,
  },
  {
    icon: "⏱️",
    label: "平均中奖间隔",
    value:
      adv.value.avgWinInterval > 0
        ? Number(adv.value.avgWinInterval).toFixed(1) + " 注"
        : "—",
    class: "",
    sub: null,
  },
  {
    icon: "📌",
    label: "最大单注金额",
    value: "¥" + fmt(adv.value.maxBetAmount),
    class: "",
    sub: null,
  },
]);

// ---- 各等奖分布 ----
const winLevelEntries = computed(() =>
  Object.entries(adv.value.winLevelDistribution || {})
    .map(([k, v]) => [Number(k), Number(v)] as [number, number])
    .sort((a, b) => a[0] - b[0]),
);
const hasWinLevels = computed(() => winLevelEntries.value.length > 0);
const maxLevelCount = computed(() =>
  winLevelEntries.value.reduce((m, [, c]) => Math.max(m, c), 1),
);

// ---- 数据获取 ----
async function handleSearch() {
  loading.value = true;
  const params: Record<string, unknown> = { timeRange: filterForm.timeRange };
  if (filterForm.modeId) params.modeId = filterForm.modeId;
  try {
    const [advRes, trRes, mdRes] = await Promise.all([
      statisticsApi.advanced(params),
      statisticsApi.trend(params),
      statisticsApi.modeDistribution(params),
    ]);
    adv.value = advRes.data.data || { ...emptyAdv };
    trendData.value = trRes.data.data || [];
    modeData.value = mdRes.data.data || [];
    // 刮刮乐趋势（单独接口，传 scratchOnly 标记）
    try {
      const scratchTrRes = await statisticsApi.scratchTrend(params);
      scratchTrendData.value = scratchTrRes.data.data || [];
    } catch {
      scratchTrendData.value = [];
    }
    // 等两个 tick：第一个让 v-show 生效，第二个让容器尺寸稳定
    await nextTick();
    await nextTick();
    renderCharts();
  } catch {
    /* ignore */
  } finally {
    loading.value = false;
  }
}

// ---- 图表渲染 ----
let trendChart: echarts.ECharts | null = null;
let barChart: echarts.ECharts | null = null;
let pieChart: echarts.ECharts | null = null;
let modePieChart: echarts.ECharts | null = null;
let scratchTrendChart: echarts.ECharts | null = null;

/** 销毁并重建 ECharts 实例，避免 DOM 重建后旧实例失效 */
function initChart(
  existing: echarts.ECharts | null,
  el: HTMLDivElement | undefined,
): echarts.ECharts | null {
  if (!el) return null;
  if (existing) {
    try {
      existing.dispose();
    } catch {
      /* ignore */
    }
  }
  const chart = echarts.init(el);
  window.addEventListener("resize", () => chart.resize());
  return chart;
}

function renderCharts() {
  renderTrend();
  renderBar();
  renderPie();
  renderModePie();
  renderScratchTrend();
}

function renderTrend() {
  if (!trendRef.value || !trendData.value.length) return;
  trendChart = initChart(trendChart, trendRef.value);
  if (!trendChart) return;
  const periods = trendData.value.map((d) => d.period);
  const costs = trendData.value.map((d) => Number(d.cost));
  const wins = trendData.value.map((d) => Number(d.win));
  const profits = costs.map((c, i) => Math.round(wins[i] - c));
  trendChart.setOption({
    tooltip: { trigger: "axis" },
    legend: {
      data: ["总投入（摇奖+刮刮乐）", "总中奖（摇奖+刮刮乐）", "净盈亏"],
      bottom: 0,
    },
    grid: { left: "3%", right: "4%", bottom: "18%", containLabel: true },
    xAxis: { type: "category", data: periods },
    yAxis: { type: "value" },
    series: [
      {
        name: "总投入（摇奖+刮刮乐）",
        type: "line",
        smooth: true,
        data: costs,
        itemStyle: { color: "#e34d59" },
        areaStyle: { opacity: 0.1 },
      },
      {
        name: "总中奖（摇奖+刮刮乐）",
        type: "line",
        smooth: true,
        data: wins,
        itemStyle: { color: "#00a870" },
        areaStyle: { opacity: 0.1 },
      },
      {
        name: "净盈亏",
        type: "bar",
        data: profits,
        itemStyle: {
          color: (p: { value: number }) =>
            p.value >= 0 ? "#00a870" : "#e34d59",
        },
      },
    ],
  });
}

function renderBar() {
  if (!barRef.value) return;
  const totalCost = Number(adv.value.totalCost);
  const totalWin = Number(adv.value.totalWin);
  if (totalCost === 0 && totalWin === 0) return;
  barChart = initChart(barChart, barRef.value);
  if (!barChart) return;
  barChart.setOption({
    tooltip: { trigger: "item", formatter: "¥{c}" },
    series: [
      {
        type: "pie",
        radius: ["35%", "65%"],
        data: [
          { name: "总投入", value: totalCost, itemStyle: { color: "#e34d59" } },
          { name: "总中奖", value: totalWin, itemStyle: { color: "#00a870" } },
        ],
        label: { formatter: "{b}\n¥{c}" },
      },
    ],
  });
}

function renderPie() {
  if (!pieRef.value || !hasWinLevels.value) return;
  pieChart = initChart(pieChart, pieRef.value);
  if (!pieChart) return;
  const data = winLevelEntries.value.map(([level, count]) => ({
    name: adv.value.winLevelNames?.[level] || level + "等奖",
    value: count,
  }));
  pieChart.setOption({
    tooltip: { trigger: "item", formatter: "{b}: {c}次 ({d}%)" },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        data,
        label: { formatter: "{b}\n{c}次" },
      },
    ],
  });
}

function renderModePie() {
  if (!modePieRef.value || !modeData.value.length) return;
  modePieChart = initChart(modePieChart, modePieRef.value);
  if (!modePieChart) return;
  modePieChart.setOption({
    tooltip: { trigger: "item", formatter: "{b}: ¥{c} ({d}%)" },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        data: modeData.value.map((d) => ({
          name: d.modeName,
          value: Number(d.totalCost),
        })),
      },
    ],
  });
}

function renderScratchTrend() {
  if (!scratchTrendRef.value || !scratchTrendData.value.length) return;
  scratchTrendChart = initChart(scratchTrendChart, scratchTrendRef.value);
  if (!scratchTrendChart) return;
  const periods = scratchTrendData.value.map((d) => d.period);
  const costs = scratchTrendData.value.map((d) => Number(d.cost));
  const wins = scratchTrendData.value.map((d) => Number(d.win));
  const profits = costs.map((c, i) => Math.round(wins[i] - c));
  scratchTrendChart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["投入", "中奖", "净盈亏"], bottom: 0 },
    grid: { left: "3%", right: "4%", bottom: "14%", containLabel: true },
    xAxis: { type: "category", data: periods },
    yAxis: { type: "value" },
    series: [
      {
        name: "投入",
        type: "line",
        smooth: true,
        data: costs,
        itemStyle: { color: "#e34d59" },
        areaStyle: { opacity: 0.1 },
      },
      {
        name: "中奖",
        type: "line",
        smooth: true,
        data: wins,
        itemStyle: { color: "#00a870" },
        areaStyle: { opacity: 0.1 },
      },
      {
        name: "净盈亏",
        type: "bar",
        data: profits,
        itemStyle: {
          color: (p: { value: number }) =>
            p.value >= 0 ? "#00a870" : "#e34d59",
        },
      },
    ],
  });
}

// Tab 切换时重新渲染图表（DOM 可能刚挂载）
watch(activeTab, async () => {
  await nextTick();
  renderCharts();
});

onMounted(() => {
  if (!modes.value.length) lotteryModeStore.fetchModes();
  handleSearch();
});
</script>

<style scoped lang="scss">
.filter-card :deep(.t-card__body) {
  padding: 12px 20px;
}
.filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.filter-left {
  display: flex;
  align-items: center;
}
.tab-content {
  padding: 16px 0;
}

/* 大指标卡片 */
.metric-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e7e7e7;
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .metric-icon {
    font-size: 28px;
    flex-shrink: 0;
  }
  .metric-label {
    font-size: 13px;
    color: #8b949e;
    margin-bottom: 4px;
  }
  .metric-value {
    font-size: 22px;
    font-weight: 700;
  }
  .metric-sub {
    font-size: 12px;
    color: #aaa;
    margin-top: 2px;
  }

  &--cost {
    border-left: 4px solid #e34d59;
  }
  &--win {
    border-left: 4px solid #00a870;
    .metric-value {
      color: #00a870;
    }
  }
  &--profit {
    border-left: 4px solid #00a870;
    .metric-value {
      color: #00a870;
    }
  }
  &--loss {
    border-left: 4px solid #e34d59;
    .metric-value {
      color: #e34d59;
    }
  }
  &--neutral {
    border-left: 4px solid #0052d9;
  }
}

/* 次级指标网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.mini-metric {
  background: #fff;
  border: 1px solid #e7e7e7;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  .mini-icon {
    font-size: 20px;
  }
  .mini-label {
    font-size: 12px;
    color: #8b949e;
  }
  .mini-value {
    font-size: 18px;
    font-weight: 600;
  }
}

.text-win {
  color: #00a870;
}
.text-loss {
  color: #e34d59;
}

/* 各等奖分布 */
.win-level-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0;
}
.win-level-item {
  display: flex;
  align-items: center;
  gap: 10px;
  .level-badge {
    width: 70px;
    font-size: 13px;
    font-weight: 600;
    color: #f59e0b;
    flex-shrink: 0;
  }
  .level-bar-wrap {
    flex: 1;
    height: 10px;
    background: #f3f4f6;
    border-radius: 5px;
    overflow: hidden;
  }
  .level-bar {
    height: 100%;
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
    border-radius: 5px;
    transition: width 0.6s ease;
  }
  .level-count {
    font-size: 13px;
    color: #555;
    width: 40px;
    text-align: right;
    flex-shrink: 0;
  }
}

/* 成就徽章墙 */
.achievement-wall {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}
.badge-card {
  border-radius: 14px;
  padding: 20px 14px;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.2s;
  .badge-icon {
    font-size: 36px;
    margin-bottom: 8px;
  }
  .badge-name {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .badge-desc {
    font-size: 12px;
    color: #8b949e;
    line-height: 1.4;
  }
  .badge-date {
    font-size: 11px;
    color: #aaa;
    margin-top: 6px;
  }
  .badge-locked-tip {
    font-size: 12px;
    color: #bbb;
    margin-top: 6px;
  }

  &--unlocked {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    border-color: #f59e0b;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(245, 158, 11, 0.3);
    }
  }
  &--locked {
    background: #f9fafb;
    border-color: #e5e7eb;
    opacity: 0.6;
    filter: grayscale(0.5);
  }
}

/* 高光时间轴 */
.timeline {
  position: relative;
  padding-left: 28px;
  &::before {
    content: "";
    position: absolute;
    left: 8px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(180deg, #f59e0b, #0052d9);
  }
}
.timeline-item {
  position: relative;
  margin-bottom: 24px;
  .timeline-dot {
    position: absolute;
    left: -24px;
    top: 4px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #f59e0b;
    border: 2px solid #fff;
    box-shadow: 0 0 0 2px #f59e0b;
  }
  .timeline-content {
    background: #fff;
    border: 1px solid #e7e7e7;
    border-radius: 10px;
    padding: 14px 16px;
    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }
  .timeline-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .timeline-desc {
    font-size: 13px;
    color: #555;
    margin-bottom: 6px;
  }
  .timeline-meta {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: #8b949e;
  }
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .achievement-wall {
    grid-template-columns: repeat(4, 1fr);
  }
}
@media (max-width: 900px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .achievement-wall {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
