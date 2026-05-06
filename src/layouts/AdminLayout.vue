<template>
  <t-layout class="admin-layout">
    <!-- 侧边栏 -->
    <t-aside
      class="admin-aside"
      :style="{ width: collapsed ? '64px' : '200px' }"
    >
      <!-- Logo -->
      <div class="logo-area">
        <span class="logo-icon">🎰</span>
        <span v-if="!collapsed" class="logo-text">彩票管理系统</span>
      </div>

      <!-- 导航菜单 -->
      <t-menu
        :value="activeMenu"
        theme="dark"
        :collapsed="collapsed"
        @change="handleMenuChange"
      >
        <t-menu-item value="/statistics"> 📊 统计分析 </t-menu-item>
        <t-menu-item value="/draw-tickets"> 🎫 摇奖管理 </t-menu-item>
        <t-menu-item value="/draw-tickets/generate"> 🎲 号码生成 </t-menu-item>
        <t-menu-item value="/scratch-tickets"> 🎰 刮刮乐管理 </t-menu-item>
        <t-menu-item value="/draw-results"> 🏆 开奖记录 </t-menu-item>
        <t-menu-item value="/draw-results/official-sync">
          ⬇️ 历史数据同步
        </t-menu-item>
        <t-menu-item value="/settings"> ⚙️ 系统设置 </t-menu-item>
      </t-menu>

      <!-- 折叠按钮（固定在侧边栏底部） -->
      <div class="collapse-btn" @click.stop="toggleCollapse">
        <t-icon :name="collapsed ? 'chevron-right' : 'chevron-left'" />
        <span v-if="!collapsed">收起</span>
      </div>
    </t-aside>

    <t-layout>
      <!-- 顶部 Header -->
      <t-header class="admin-header">
        <div class="header-left">
          <!-- 顶部折叠按钮（备用，点击更可靠） -->
          <t-button variant="text" shape="square" @click.stop="toggleCollapse">
            <template #icon>
              <t-icon :name="collapsed ? 'chevron-right' : 'chevron-left'" />
            </template>
          </t-button>
          <!-- 面包屑 -->
          <t-breadcrumb>
            <t-breadcrumb-item>首页</t-breadcrumb-item>
            <t-breadcrumb-item>{{ currentTitle }}</t-breadcrumb-item>
          </t-breadcrumb>
        </div>

        <div class="header-right">
          <t-dropdown :options="userMenuOptions" @click="handleUserMenu">
            <t-button variant="text">
              <template #icon><t-icon name="user-circle" /></template>
              {{ userStore.username }}
              <t-icon name="chevron-down" />
            </t-button>
          </t-dropdown>
        </div>
      </t-header>

      <!-- 主内容区 -->
      <t-content class="admin-content">
        <router-view />
      </t-content>
    </t-layout>
  </t-layout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/store/user";
import { authApi } from "@/api/auth";
import { MessagePlugin } from "tdesign-vue-next";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const collapsed = ref(false);
const activeMenu = computed(() => route.path);
const currentTitle = computed(() => (route.meta.title as string) || "");

// 用独立函数切换，避免事件冒泡导致 t-menu 拦截点击
function toggleCollapse() {
  collapsed.value = !collapsed.value;
}

const userMenuOptions = [
  { content: "🔒 修改密码", value: "password" },
  { content: "🚪 退出登录", value: "logout" },
];

function handleMenuChange(value: string) {
  router.push(value);
}

async function handleUserMenu({ value }: { value: string }) {
  if (value === "logout") {
    try {
      await authApi.logout();
    } catch {}
    userStore.logout();
    router.push("/login");
    MessagePlugin.success("已退出登录");
  } else if (value === "password") {
    router.push("/settings");
  }
}
</script>

<style scoped lang="scss">
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

.admin-aside {
  background: #1a2035;
  /* 用 transition 平滑过渡，overflow 改为 visible 避免折叠按钮被裁剪 */
  transition: width 0.2s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  :deep(.t-menu) {
    background: transparent;
    border-right: none;
    flex: 1;
  }

  :deep(.t-menu__item) {
    color: rgba(255, 255, 255, 0.7);

    &:hover,
    &.t-is-active {
      color: #fff;
      background: rgba(0, 82, 217, 0.6);
    }
  }

  /* 折叠状态下菜单项图标居中 */
  :deep(.t-menu--collapsed .t-menu__item) {
    justify-content: center;
    padding: 0;
  }
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  height: 56px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  white-space: nowrap;
  flex-shrink: 0;

  .logo-icon {
    font-size: 22px;
    flex-shrink: 0;
  }
  .logo-text {
    color: #fff;
    font-size: 15px;
    font-weight: 600;
  }
}

.admin-header {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e7e7e7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;

  .header-left,
  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.admin-content {
  flex: 1;
  overflow-y: auto;
  background: #f3f4f6;
  padding: 20px;
}

/* 折叠按钮固定在侧边栏底部 */
.collapse-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  white-space: nowrap;
  overflow: hidden;
  flex-shrink: 0;
  /* 确保点击区域不被遮挡 */
  position: relative;
  z-index: 10;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
