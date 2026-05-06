<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <span class="login-logo">🎰</span>
        <h2>彩票管理系统</h2>
        <p>后台管理平台</p>
      </div>

      <t-form ref="formRef" :data="form" :rules="rules" label-align="top">
        <t-form-item label="用户名" name="username">
          <t-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
            clearable
          >
            <template #prefix-icon><t-icon name="user" /></template>
          </t-input>
        </t-form-item>

        <t-form-item label="密码" name="password">
          <t-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
          >
            <template #prefix-icon><t-icon name="lock" /></template>
          </t-input>
        </t-form-item>

        <t-alert
          v-if="errorMsg"
          theme="error"
          :message="errorMsg"
          style="margin-bottom: 16px"
        />

        <t-form-item>
          <t-button
            theme="primary"
            size="large"
            block
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </t-button>
        </t-form-item>
      </t-form>

      <div class="login-footer">
        <span>还没有账号？</span>
        <t-link theme="primary" @click="$router.push('/register')"
          >立即注册</t-link
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";
import { authApi } from "@/api/auth";
import { useLotteryModeStore } from "@/store/lotteryMode";

const router = useRouter();
const userStore = useUserStore();
const lotteryModeStore = useLotteryModeStore();

const formRef = ref();
const loading = ref(false);
const errorMsg = ref("");

const form = reactive({ username: "", password: "" });

const rules = {
  username: [{ required: true, message: "请输入用户名", type: "error" }],
  password: [{ required: true, message: "请输入密码", type: "error" }],
};

async function handleLogin() {
  errorMsg.value = "";
  // 手动触发表单校验
  const validateResult = await formRef.value?.validate();
  if (validateResult !== true) return;
  loading.value = true;
  try {
    const res = await authApi.login({
      username: form.username,
      password: form.password,
    });
    const data = res.data.data;
    userStore.login(data.token, {
      userId: data.userId,
      username: data.username,
      role: data.role,
    });
    await lotteryModeStore.fetchModes();
    router.push("/statistics");
  } catch (err: unknown) {
    const e = err as { message?: string };
    errorMsg.value = e.message || "用户名或密码错误";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0052d9 0%, #1a2035 100%);
}

.login-card {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  width: 420px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  .login-logo {
    font-size: 40px;
  }
  h2 {
    margin: 8px 0 4px;
    font-size: 22px;
    color: #1a2035;
  }
  p {
    color: #8b949e;
    font-size: 14px;
  }
}

.login-footer {
  text-align: center;
  margin-top: 16px;
  color: #8b949e;
  font-size: 14px;
}
</style>
