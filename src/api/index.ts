import request from "@/utils/request";

export const lotteryModeApi = {
  list: () => request.get("/lottery-modes"),
  getById: (id: number) => request.get(`/lottery-modes/${id}`),
  create: (data: Record<string, unknown>) =>
    request.post("/lottery-modes", data),
  update: (id: number, data: Record<string, unknown>) =>
    request.put(`/lottery-modes/${id}`, data),
  delete: (id: number) => request.delete(`/lottery-modes/${id}`),
};

/**
 * 中奖规则 API
 * 用于获取各彩票模式的中奖等级列表，供手动设置中奖弹窗的等级下拉使用
 */
export const winRuleApi = {
  /** 获取指定彩票模式的中奖规则列表（按等级升序） */
  listByModeId: (modeId: number) => request.get(`/win-rules/${modeId}`),
  /** 获取所有中奖规则，可按 modeId 过滤 */
  listAll: (modeId?: number) =>
    request.get("/win-rules", { params: modeId ? { modeId } : {} }),
  /** 新增中奖规则（仅 ADMIN） */
  create: (data: Record<string, unknown>) => request.post("/win-rules", data),
  /** 更新中奖规则（仅 ADMIN） */
  update: (id: number, data: Record<string, unknown>) =>
    request.put(`/win-rules/${id}`, data),
  /** 删除中奖规则（仅 ADMIN） */
  delete: (id: number) => request.delete(`/win-rules/${id}`),
};

export const numbersApi = {
  generate: (data: { modeId: number; count?: number }) =>
    request.post("/numbers/generate", data),
  generateBatch: (data: { modeId: number; count: number }) =>
    request.post("/numbers/generate-batch", data),
  validate: (data: {
    modeId: number;
    redNumbers: number[];
    blueNumbers?: number[];
  }) => request.post("/numbers/validate", data),
};

export const drawTicketApi = {
  list: (params: Record<string, unknown>) =>
    request.get("/draw-tickets", { params }),
  getById: (id: number) => request.get(`/draw-tickets/${id}`),
  create: (data: Record<string, unknown>) =>
    request.post("/draw-tickets", data),
  createBatch: (data: Record<string, unknown>[]) =>
    request.post("/draw-tickets/batch", data),
  update: (id: number, data: Record<string, unknown>) =>
    request.put(`/draw-tickets/${id}`, data),
  delete: (id: number) => request.delete(`/draw-tickets/${id}`),
  updateWinStatus: (id: number, data: Record<string, unknown>) =>
    request.put(`/draw-tickets/${id}/win-status`, data),
  /** 更新兑奖状态 */
  updateClaimStatus: (id: number, isClaimed: number) =>
    request.put(`/draw-tickets/${id}/claim-status`, null, {
      params: { isClaimed },
    }),
  /** 历史最佳中奖 Top N：sortBy=level|amount，topN 默认5，modeId 可选 */
  topWins: (params: { sortBy?: string; topN?: number; modeId?: number }) =>
    request.get("/draw-tickets/top-wins", { params }),
  /** 批量补填历史摇奖票的中奖号码 */
  backfillWinningNumbers: () =>
    request.post("/draw-tickets/backfill-winning-numbers"),
  /** 检查是否存在重复的摇奖票 */
  checkDuplicate: (data: Record<string, unknown>) =>
    request.post("/draw-tickets/check-duplicate", data),
};

export const drawResultApi = {
  list: (params: Record<string, unknown>) =>
    request.get("/draw-results", { params }),
  getById: (id: number) => request.get(`/draw-results/${id}`),
  create: (data: Record<string, unknown>) =>
    request.post("/draw-results", data),
  update: (id: number, data: Record<string, unknown>) =>
    request.put(`/draw-results/${id}`, data),
  winCheck: (id: number) => request.post(`/draw-results/${id}/win-check`),
};

export const scratchTicketApi = {
  list: (params: Record<string, unknown>) =>
    request.get("/scratch-tickets", { params }),
  create: (data: Record<string, unknown>) =>
    request.post("/scratch-tickets", data),
  update: (id: number, data: Record<string, unknown>) =>
    request.put(`/scratch-tickets/${id}`, data),
  delete: (id: number) => request.delete(`/scratch-tickets/${id}`),
};

export const statisticsApi = {
  overview: (params: Record<string, unknown>) =>
    request.get("/statistics/overview", { params }),
  trend: (params: Record<string, unknown>) =>
    request.get("/statistics/trend", { params }),
  modeDistribution: (params: Record<string, unknown>) =>
    request.get("/statistics/mode-distribution", { params }),
  numberFrequency: (modeId: number, params: Record<string, unknown>) =>
    request.get("/statistics/number-frequency", {
      params: { modeId, ...params },
    }),
  advanced: (params: Record<string, unknown>) =>
    request.get("/statistics/advanced", { params }),
  scratchTrend: (params: Record<string, unknown>) =>
    request.get("/statistics/scratch-trend", { params }),
};

export const officialDrawApi = {
  // 同步2022年至今的全量历史数据
  syncHistory: () => request.post("/official-draw/sync"),
  // 同步指定期号范围
  syncRange: (startIssue: string, endIssue: string) =>
    request.post("/official-draw/sync/range", null, {
      params: { startIssue, endIssue },
    }),
  // 分页查询官方历史开奖数据
  list: (params: { issueNo?: string; pageNum?: number; pageSize?: number }) =>
    request.get("/official-draw", { params }),
};
