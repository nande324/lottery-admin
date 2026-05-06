export interface UserInfo {
  userId: number;
  username: string;
  role: string;
}

export interface LotteryMode {
  id: number;
  name: string;
  code: string;
  type: "DRAW" | "SCRATCH";
  redCount: number | null;
  redMin: number | null;
  redMax: number | null;
  blueCount: number | null;
  blueMin: number | null;
  blueMax: number | null;
  ticketPrice: number;
  description: string | null;
  sortOrder: number;
  isPreset: number;
}

/** 中奖号码信息 */
export interface WinningNumbersInfo {
  /** 中奖的红球号码列表 */
  winningRedNumbers: number[];
  /** 中奖的蓝球号码列表 */
  winningBlueNumbers: number[];
  /** 红球中奖个数 */
  redCount: number;
  /** 蓝球中奖个数 */
  blueCount: number;
}

export interface DrawTicket {
  id: number;
  userId: number;
  modeId: number;
  issueNo: string | null;
  redNumbers: number[];
  blueNumbers: number[];
  betAmount: number;
  betTime: string;
  winStatus: "PENDING" | "NO_WIN" | "WIN";
  winLevel: number | null;
  /** 中奖等级名称（如"三等奖"），由后端从规则表填充 */
  levelName: string | null;
  winAmount: number | null;
  /** 开奖时间（匹配开奖结果时自动保存） */
  drawTime: string | null;
  /** 是否已兑奖：0未兑奖 1已兑奖 */
  isClaimed: number;
  /** 中奖号码信息（包含红球和蓝球的中奖情况），可能是JSON字符串或对象 */
  winningNumbers: WinningNumbersInfo | string | null;
  isFixed: number;
  remark: string | null;
  createdTime: string;
  /** 是否在兑奖期内（WIN 且投注时间距今 ≤ 60 天） */
  claimable: boolean;
  /** 兑奖截止日期 */
  claimDeadline: string | null;
}

/** 中奖规则 */
export interface WinRule {
  id: number;
  modeId: number;
  winLevel: number;
  levelName: string;
  redHit: number;
  blueHit: number;
  hitCondition: string | null;
  prizeType: "FIXED" | "POOL";
  fixedAmount: number | null;
  description: string | null;
}

/** 历史最佳中奖记录 */
export interface TopWin {
  id: number;
  modeId: number;
  modeName: string;
  issueNo: string | null;
  redNumbers: string;
  blueNumbers: string | null;
  winLevel: number;
  levelName: string | null;
  winAmount: number | null;
  betTime: string;
  claimable: boolean;
  claimDeadline: string | null;
}

export interface DrawResult {
  id: number;
  userId: number;
  modeId: number;
  issueNo: string;
  drawDate: string;
  redNumbers: number[];
  blueNumbers: number[];
  prizePool: number | null;
  source: string;
  createdTime: string;
}

export interface ScratchTicket {
  id: number;
  userId: number;
  scratchDate: string;
  scratchType: string;
  /** 单张面额（元） */
  unitPrice: number;
  /** 购买张数 */
  quantity: number;
  costAmount: number;
  winAmount: number;
  remark: string | null;
  createdTime: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PageResult<T> {
  total: number;
  pageNum: number;
  pageSize: number;
  records: T[];
}

export interface StatisticsOverview {
  totalCost: number;
  totalWin: number;
  netProfit: number;
  totalTickets: number;
  winTickets: number;
  winRate: number;
}

export interface AchievementBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface HighlightEvent {
  type: string;
  title: string;
  description: string;
  time: string | null;
  issueNo: string | null;
  amount: number | null;
}

export interface AdvancedStatistics {
  totalCost: number;
  totalWin: number;
  netProfit: number;
  roi: number;
  totalIssues: number;
  totalTickets: number;
  avgCostPerIssue: number;
  currentBlankStreak: number;
  maxWinStreak: number;
  maxBlankStreak: number;
  firstWinTime: string | null;
  firstWinIssueNo: string | null;
  lastWinTime: string | null;
  lastWinIssueNo: string | null;
  maxSingleWin: number;
  bestWinLevel: number | null;
  bestWinLevelName: string | null;
  maxBetAmount: number;
  winRate: number;
  winTickets: number;
  avgWinInterval: number;
  bigWinCount: number;
  winLevelDistribution: Record<string, number>;
  winLevelNames: Record<string, string>;
  achievements: AchievementBadge[];
  highlights: HighlightEvent[];
  // 刮刮乐专属
  scratchTotalCost: number;
  scratchTotalWin: number;
  scratchNetProfit: number;
  scratchTotalQuantity: number;
  scratchWinCount: number;
  scratchWinRate: number;
  scratchMaxSingleWin: number;
  scratchBigWinCount: number;
}

export interface TrendPoint {
  period: string;
  cost: number;
  win: number;
}

export interface ModeDistribution {
  modeId: number;
  modeName: string;
  totalCost: number;
  percentage: number;
}

export interface NumberFrequency {
  number: number;
  frequency: number;
}
