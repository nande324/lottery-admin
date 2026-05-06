<template>
  <div class="page-container">
    <t-row :gutter="16">
      <!-- 账户设置 -->
      <t-col :span="12">
        <t-card title="账户设置" :bordered="false">
          <t-descriptions :items="userInfoItems" layout="horizontal" />
          <t-divider />
          <h4 style="margin: 0 0 16px">修改密码</h4>
          <t-form
            ref="pwdFormRef"
            :data="pwdForm"
            :rules="pwdRules"
            label-align="right"
            label-width="90px"
          >
            <t-form-item label="原密码" name="oldPassword">
              <t-input
                v-model="pwdForm.oldPassword"
                type="password"
                placeholder="请输入原密码"
              />
            </t-form-item>
            <t-form-item label="新密码" name="newPassword">
              <t-input
                v-model="pwdForm.newPassword"
                type="password"
                placeholder="8位以上，含字母和数字"
              />
            </t-form-item>
            <t-form-item label="确认新密码" name="confirmNewPassword">
              <t-input
                v-model="pwdForm.confirmNewPassword"
                type="password"
                placeholder="再次输入新密码"
              />
            </t-form-item>
            <t-form-item>
              <t-button
                theme="primary"
                :loading="pwdLoading"
                @click="handleChangePwd"
                >修改密码</t-button
              >
            </t-form-item>
          </t-form>
        </t-card>
      </t-col>

      <!-- 彩票模式管理（ADMIN） -->
      <t-col :span="12">
        <t-card title="彩票模式管理" :bordered="false">
          <template v-if="userStore.isAdmin">
            <div style="margin-bottom: 12px">
              <t-button theme="primary" size="small" @click="openAddModeDialog">
                <template #icon><t-icon name="add" /></template>
                新增模式
              </t-button>
            </div>
            <t-table
              :data="modes"
              :columns="modeColumns"
              row-key="id"
              size="small"
              stripe
            >
              <template #type="{ row }">
                <t-tag
                  :theme="row.type === 'DRAW' ? 'primary' : 'warning'"
                  variant="light"
                  size="small"
                >
                  {{ row.type === "DRAW" ? "摇奖" : "刮刮乐" }}
                </t-tag>
              </template>
              <template #isPreset="{ row }">
                <t-tag
                  :theme="row.isPreset ? 'success' : 'default'"
                  variant="light"
                  size="small"
                >
                  {{ row.isPreset ? "预置" : "自定义" }}
                </t-tag>
              </template>
              <template #op="{ row }">
                <t-space>
                  <t-link theme="primary" @click="openEditModeDialog(row)"
                    >编辑</t-link
                  >
                  <t-popconfirm
                    v-if="!row.isPreset"
                    content="确定删除该模式？"
                    @confirm="handleDeleteMode(row.id)"
                  >
                    <t-link theme="danger">删除</t-link>
                  </t-popconfirm>
                </t-space>
              </template>
            </t-table>
          </template>
          <t-empty v-else description="仅管理员可管理彩票模式" />
        </t-card>
      </t-col>
    </t-row>

    <!-- 彩票模式弹窗 -->
    <t-dialog
      v-model:visible="modeDialogVisible"
      :header="isModeEditing ? '编辑彩票模式' : '新增彩票模式'"
      width="500px"
      :confirm-btn="{ content: '保存', loading: modeSubmitting }"
      @confirm="handleModeSubmit"
    >
      <t-form
        ref="modeFormRef"
        :data="modeForm"
        :rules="modeRules"
        label-align="right"
        label-width="90px"
      >
        <t-form-item label="名称" name="name"
          ><t-input v-model="modeForm.name" placeholder="如：双色球"
        /></t-form-item>
        <t-form-item label="编码" name="code"
          ><t-input
            v-model="modeForm.code"
            placeholder="如：SSQ"
            :disabled="isModeEditing"
        /></t-form-item>
        <t-form-item label="类型" name="type">
          <t-select v-model="modeForm.type">
            <t-option label="摇奖类" value="DRAW" />
            <t-option label="刮刮乐" value="SCRATCH" />
          </t-select>
        </t-form-item>
        <template v-if="modeForm.type === 'DRAW'">
          <t-form-item label="红球数量"
            ><t-input-number
              v-model="modeForm.redCount"
              :min="1"
              :max="10"
              style="width: 100%"
          /></t-form-item>
          <t-form-item label="红球范围">
            <t-space>
              <t-input-number
                v-model="modeForm.redMin"
                :min="0"
                placeholder="最小值"
                style="width: 120px"
              />
              <span>—</span>
              <t-input-number
                v-model="modeForm.redMax"
                :min="1"
                placeholder="最大值"
                style="width: 120px"
              />
            </t-space>
          </t-form-item>
          <t-form-item label="蓝球数量"
            ><t-input-number
              v-model="modeForm.blueCount"
              :min="0"
              :max="5"
              style="width: 100%"
          /></t-form-item>
          <template v-if="modeForm.blueCount > 0">
            <t-form-item label="蓝球范围">
              <t-space>
                <t-input-number
                  v-model="modeForm.blueMin"
                  :min="0"
                  placeholder="最小值"
                  style="width: 120px"
                />
                <span>—</span>
                <t-input-number
                  v-model="modeForm.blueMax"
                  :min="1"
                  placeholder="最大值"
                  style="width: 120px"
                />
              </t-space>
            </t-form-item>
          </template>
        </template>
        <t-form-item label="票价（元）"
          ><t-input-number
            v-model="modeForm.ticketPrice"
            :min="0"
            :decimal-places="0"
            style="width: 100%"
        /></t-form-item>
        <t-form-item label="说明"
          ><t-textarea
            v-model="modeForm.description"
            placeholder="规则说明（可选）"
            :autosize="{ minRows: 2 }"
        /></t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { MessagePlugin } from "tdesign-vue-next";
import { useUserStore } from "@/store/user";
import { useLotteryModeStore } from "@/store/lotteryMode";
import { storeToRefs } from "pinia";
import { authApi } from "@/api/auth";
import { lotteryModeApi } from "@/api";
import type { LotteryMode } from "@/types";

const userStore = useUserStore();
const lotteryModeStore = useLotteryModeStore();
const { modes } = storeToRefs(lotteryModeStore);

const userInfoItems = computed(() => [
  { label: "用户名", content: userStore.username },
  {
    label: "角色",
    content: userStore.role === "ADMIN" ? "管理员" : "普通用户",
  },
]);

// 修改密码
const pwdFormRef = ref();
const pwdLoading = ref(false);
const pwdForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmNewPassword: "",
});
const pwdRules = {
  oldPassword: [{ required: true, message: "请输入原密码" }],
  newPassword: [
    { required: true, message: "请输入新密码" },
    {
      pattern: /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/,
      message: "密码必须8位以上且包含字母和数字",
    },
  ],
  confirmNewPassword: [
    { required: true, message: "请确认新密码" },
    {
      validator: (val: string) =>
        val === pwdForm.newPassword || "两次密码不一致",
    },
  ],
};

async function handleChangePwd() {
  const valid = await pwdFormRef.value?.validate();
  if (valid !== true) return;
  pwdLoading.value = true;
  try {
    await authApi.changePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword,
      confirmNewPassword: pwdForm.confirmNewPassword,
    });
    MessagePlugin.success("密码修改成功");
    Object.assign(pwdForm, {
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
  } catch {
    /* ignore */
  } finally {
    pwdLoading.value = false;
  }
}

// 彩票模式管理
const modeColumns = [
  { colKey: "name", title: "名称", width: 80 },
  { colKey: "code", title: "编码", width: 70 },
  { colKey: "type", title: "类型", width: 80 },
  { colKey: "isPreset", title: "类别", width: 80 },
  { colKey: "op", title: "操作", width: 100 },
];

const modeDialogVisible = ref(false);
const isModeEditing = ref(false);
const currentModeId = ref<number | null>(null);
const modeFormRef = ref();
const modeSubmitting = ref(false);
const modeForm = reactive({
  name: "",
  code: "",
  type: "DRAW",
  redCount: 6,
  redMin: 1,
  redMax: 33,
  blueCount: 0,
  blueMin: 1,
  blueMax: 16,
  ticketPrice: 2,
  description: "",
});
const modeRules = {
  name: [{ required: true, message: "请输入名称" }],
  code: [{ required: true, message: "请输入编码" }],
  type: [{ required: true, message: "请选择类型" }],
};

function openAddModeDialog() {
  isModeEditing.value = false;
  currentModeId.value = null;
  Object.assign(modeForm, {
    name: "",
    code: "",
    type: "DRAW",
    redCount: 6,
    redMin: 1,
    redMax: 33,
    blueCount: 0,
    blueMin: 1,
    blueMax: 16,
    ticketPrice: 2,
    description: "",
  });
  modeDialogVisible.value = true;
}

function openEditModeDialog(row: LotteryMode) {
  isModeEditing.value = true;
  currentModeId.value = row.id;
  Object.assign(modeForm, {
    name: row.name,
    code: row.code,
    type: row.type,
    redCount: row.redCount ?? 6,
    redMin: row.redMin ?? 1,
    redMax: row.redMax ?? 33,
    blueCount: row.blueCount ?? 0,
    blueMin: row.blueMin ?? 1,
    blueMax: row.blueMax ?? 16,
    ticketPrice: row.ticketPrice,
    description: row.description || "",
  });
  modeDialogVisible.value = true;
}

async function handleModeSubmit() {
  const valid = await modeFormRef.value?.validate();
  if (valid !== true) return;
  modeSubmitting.value = true;
  try {
    const payload: Record<string, unknown> = {
      name: modeForm.name,
      code: modeForm.code,
      type: modeForm.type,
      ticketPrice: modeForm.ticketPrice,
      description: modeForm.description || null,
    };
    if (modeForm.type === "DRAW") {
      Object.assign(payload, {
        redCount: modeForm.redCount,
        redMin: modeForm.redMin,
        redMax: modeForm.redMax,
        blueCount: modeForm.blueCount,
      });
      if (modeForm.blueCount > 0)
        Object.assign(payload, {
          blueMin: modeForm.blueMin,
          blueMax: modeForm.blueMax,
        });
    }
    if (isModeEditing.value && currentModeId.value) {
      await lotteryModeApi.update(currentModeId.value, payload);
      MessagePlugin.success("更新成功");
    } else {
      await lotteryModeApi.create(payload);
      MessagePlugin.success("新增成功");
    }
    modeDialogVisible.value = false;
    lotteryModeStore.fetchModes();
  } catch {
    /* ignore */
  } finally {
    modeSubmitting.value = false;
  }
}

async function handleDeleteMode(id: number) {
  try {
    await lotteryModeApi.delete(id);
    MessagePlugin.success("删除成功");
    lotteryModeStore.fetchModes();
  } catch {
    /* ignore */
  }
}

onMounted(() => {
  if (!modes.value.length) lotteryModeStore.fetchModes();
});
</script>

<style scoped lang="scss">
h4 {
  font-size: 15px;
  color: #1a2035;
}
</style>
