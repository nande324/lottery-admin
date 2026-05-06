<template>
  <div class="page-container">
    <t-card :bordered="false" class="page-header-card">
      <div class="page-header">
        <div>
          <h3>刮刮乐管理</h3>
          <p>记录刮刮乐消费与中奖情况</p>
        </div>
        <t-button theme="primary" @click="openAddDialog">
          <template #icon><t-icon name="add" /></template>
          新增记录
        </t-button>
      </div>
    </t-card>

    <!-- 搜索 -->
    <t-card :bordered="false" style="margin-top: 12px">
      <t-form :data="filterForm" layout="inline">
        <t-form-item label="日期范围">
          <t-date-range-picker
            v-model="filterForm.dateRange"
            style="width: 240px"
          />
        </t-form-item>
        <t-form-item label="类型">
          <t-input
            v-model="filterForm.scratchType"
            placeholder="刮刮乐类型"
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
        :data="tickets"
        :columns="columns"
        :loading="loading"
        row-key="id"
        stripe
        hover
        :pagination="pagination"
        @page-change="handlePageChange"
      >
        <template #unitPrice="{ row }">
          <span v-if="row.unitPrice != null"
            >¥{{ Number(row.unitPrice).toFixed(0) }}</span
          >
          <span v-else style="color: #8b949e">—</span>
        </template>
        <template #costAmount="{ row }">
          <span class="loss">¥{{ Number(row.costAmount).toFixed(0) }}</span>
        </template>
        <template #winAmount="{ row }">
          <span class="profit">¥{{ Number(row.winAmount).toFixed(0) }}</span>
        </template>
        <template #netProfit="{ row }">
          <span
            :class="
              Number(row.winAmount) - Number(row.costAmount) >= 0
                ? 'profit'
                : 'loss'
            "
          >
            {{
              Number(row.winAmount) - Number(row.costAmount) >= 0 ? "+" : ""
            }}¥{{ (Number(row.winAmount) - Number(row.costAmount)).toFixed(0) }}
          </span>
        </template>
        <template #op="{ row }">
          <t-space>
            <t-link theme="primary" @click="openEditDialog(row)">编辑</t-link>
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
      :header="isEditing ? '编辑刮刮乐记录' : '新增刮刮乐记录'"
      width="480px"
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
        <t-form-item label="刮奖日期" name="scratchDate">
          <t-date-picker v-model="form.scratchDate" style="width: 100%" />
        </t-form-item>
        <t-form-item label="类型" name="scratchType">
          <t-input v-model="form.scratchType" placeholder="刮刮乐类型/名称" />
        </t-form-item>
        <t-form-item label="单张面额" name="unitPrice">
          <t-input-number
            v-model="form.unitPrice"
            :min="0"
            :decimal-places="0"
            style="width: 100%"
            @change="calcCostAmount"
          />
        </t-form-item>
        <t-form-item label="购买张数" name="quantity">
          <t-input-number
            v-model="form.quantity"
            :min="1"
            :decimal-places="0"
            style="width: 100%"
            @change="calcCostAmount"
          />
        </t-form-item>
        <t-form-item label="消费金额">
          <t-input
            :value="`¥${form.unitPrice * form.quantity}`"
            readonly
            style="width: 100%; background: #f5f5f5; color: #555"
          />
        </t-form-item>
        <t-form-item label="中奖金额" name="winAmount">
          <t-input-number
            v-model="form.winAmount"
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { MessagePlugin } from "tdesign-vue-next";
import { scratchTicketApi } from "@/api";
import type { ScratchTicket } from "@/types";

const loading = ref(false);
const tickets = ref<ScratchTicket[]>([]);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });
const filterForm = reactive({ dateRange: [] as string[], scratchType: "" });

const columns = [
  { colKey: "scratchDate", title: "刮奖日期", width: 120 },
  { colKey: "scratchType", title: "类型", width: 140 },
  { colKey: "unitPrice", title: "单张面额", width: 100 },
  { colKey: "quantity", title: "张数", width: 80 },
  { colKey: "costAmount", title: "消费金额", width: 110 },
  { colKey: "winAmount", title: "中奖金额", width: 110 },
  { colKey: "netProfit", title: "净盈亏", width: 110 },
  { colKey: "remark", title: "备注", ellipsis: true },
  { colKey: "op", title: "操作", width: 120, fixed: "right" },
];

async function fetchTickets() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (filterForm.scratchType) params.scratchType = filterForm.scratchType;
    if (filterForm.dateRange?.length === 2) {
      params.startDate = filterForm.dateRange[0];
      params.endDate = filterForm.dateRange[1];
    }
    const res = await scratchTicketApi.list(params);
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
  filterForm.dateRange = [];
  filterForm.scratchType = "";
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

const formDialogVisible = ref(false);
const isEditing = ref(false);
const currentId = ref<number | null>(null);
const formRef = ref();
const submitting = ref(false);
const form = reactive({
  scratchDate: "",
  scratchType: "",
  unitPrice: 0 as number,
  quantity: 1 as number,
  winAmount: 0,
  remark: "",
});

function calcCostAmount() {
  // 触发响应式更新（form.unitPrice * form.quantity 直接在模板里计算）
}
const formRules = {
  scratchDate: [{ required: true, message: "请选择刮奖日期" }],
  scratchType: [{ required: true, message: "请输入刮刮乐类型" }],
  unitPrice: [{ required: true, message: "请输入单张面额" }],
  quantity: [{ required: true, message: "请输入购买张数" }],
};

function openAddDialog() {
  isEditing.value = false;
  currentId.value = null;
  Object.assign(form, {
    scratchDate: "",
    scratchType: "",
    unitPrice: 0,
    quantity: 1,
    winAmount: 0,
    remark: "",
  });
  formDialogVisible.value = true;
}

function openEditDialog(row: ScratchTicket) {
  isEditing.value = true;
  currentId.value = row.id;
  Object.assign(form, {
    scratchDate: row.scratchDate,
    scratchType: row.scratchType,
    unitPrice: Number(row.unitPrice) || 0,
    quantity: Number(row.quantity) || 1,
    winAmount: Number(row.winAmount),
    remark: row.remark || "",
  });
  formDialogVisible.value = true;
}

async function handleFormSubmit() {
  const valid = await formRef.value?.validate();
  if (valid !== true) return;
  submitting.value = true;
  try {
    const payload = {
      scratchDate: form.scratchDate,
      scratchType: form.scratchType,
      unitPrice: form.unitPrice,
      quantity: form.quantity,
      // costAmount 由后端自动计算：unitPrice × quantity
      winAmount: form.winAmount,
      remark: form.remark || undefined,
    };
    if (isEditing.value && currentId.value) {
      await scratchTicketApi.update(currentId.value, payload);
      MessagePlugin.success("更新成功");
    } else {
      await scratchTicketApi.create(payload);
      MessagePlugin.success("新增成功");
    }
    formDialogVisible.value = false;
    fetchTickets();
  } catch {
    /* ignore */
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(id: number) {
  try {
    await scratchTicketApi.delete(id);
    MessagePlugin.success("删除成功");
    fetchTickets();
  } catch {
    /* ignore */
  }
}

onMounted(() => fetchTickets());
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
