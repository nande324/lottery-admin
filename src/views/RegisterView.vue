<template>
  <div class="register-page">
    <div class="register-card">
      <div class="register-header">
        <span class="register-logo">🎰</span>
        <h2>彩票管理系统</h2>
        <p>用户注册</p>
      </div>

      <t-form ref="formRef" :data="form" :rules="rules" label-align="top">
        <t-form-item label="用户名" name="username">
          <t-input
            v-model="form.username"
            placeholder="4-20位字母数字，如：admin123"
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
            placeholder="至少8位，必须包含字母和数字"
            size="large"
          >
            <template #prefix-icon><t-icon name="lock" /></template>
          </t-input>
        </t-form-item>

        <t-form-item label="确认密码" name="confirmPassword">
          <t-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
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

        <t-alert
          v-if="successMsg"
          theme="success"
          :message="successMsg"
          style="margin-bottom: 16px"
        />

        <t-form-item>
          <t-button
            theme="primary"
            size="large"
            block
            :loading="loading"
            @click="handleRegister"
          >
            注 册
          </t-button>
        </t-form-item>
      </t-form>

      <div class="register-footer">
        <span>已有账号？</span>
        <t-link theme="primary" @click="$router.push('/login')"
          >立即登录</t-link
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { authApi } from "@/api/auth";

const router = useRouter();

const formRef = ref();
const loading = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

const form = reactive({
  username: "",
  password: "",
  confirmPassword: "",
});

const rules = {
  username: [
    { required: true, message: "请输入用户名", type: "error" },
    { min: 4, message: "用户名至少4个字符", type: "error" },
    { max: 20, message: "用户名最多20个字符", type: "error" },
    {
      pattern: /^[a-zA-Z0-9]{4,20}$/,
      message: "用户名只能包含字母和数字",
      type: "error",
    },
  ],
  password: [
    { required: true, message: "请输入密码", type: "error" },
    { min: 8, message: "密码至少8个字符", type: "error" },
    {
      pattern: /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/,
      message: "密码必须包含字母和数字",
      type: "error",
    },
  ],
  confirmPassword: [
    { required: true, message: "请确认密码", type: "error" },
    {
      validator: (val: string) => val === form.password,
      message: "两次输入的密码不一致",
      type: "error",
    },
  ],
};

async function handleRegister() {
  errorMsg.value = "";
  successMsg.value = "";

  // 手动触发表单校验
  const validateResult = await formRef.value?.validate();
  if (validateResult !== true) return;

  loading.value = true;
  try {
    await authApi.register({
      username: form.username,
      password: form.password,
      confirmPassword: form.confirmPassword,
    });

    successMsg.value = "注册成功！3秒后跳转到登录页面...";

    // 3秒后跳转到登录页面
    setTimeout(() => {
      router.push("/login");
    }, 3000);
  } catch (err: unknown) {
    const e = err as { message?: string };
    errorMsg.value = e.message || "注册失败，请重试";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0052d9 0%, #1a2035 100%);
}

.register-card {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  width: 420px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;

  .register-logo {
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

.register-footer {
  text-align: center;
  margin-top: 16px;
  color: #8b949e;
  font-size: 14px;
}
</style>
