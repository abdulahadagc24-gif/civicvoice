export type InfrastructureCategoryId =
  | 'streetlights'
  | 'roads'
  | 'parks'
  | 'water'
  | 'waste';

export type ProposalStatus =
  | 'Under Review'
  | 'Planned'
  | 'In Progress'
  | 'Completed';

export type ProposalPriority = 'High' | 'Medium' | 'Standard';

export type LightingMode = 'dusk' | 'day';

export type AppView = 'city' | 'citizen' | 'admin' | 'login' | 'signup';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'admin';
  district: string;
}

export interface CivicSuggestion {
  id: string;
  category: InfrastructureCategoryId;
  title: string;
  description: string;
  location: string;
  author: string;
  createdAt: string;
  status: ProposalStatus;
  votes: number;
  estimatedBudgetInr: number;
  hasVoted?: boolean;
  priority: ProposalPriority;
  department?: string;
  assignedTo?: string;
  adminNote?: string;
  isMine?: boolean;
  isBookmarked?: boolean;
  slaDays?: number;
}

export interface CategoryMeta {
  id: InfrastructureCategoryId;
  name: string;
  shortLabel: string;
  tagline: string;
  description: string;
  accentHex: string;
  assetSummary: string;
  efficiencyMetric: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
}

export interface HoveredAssetInfo {
  category: InfrastructureCategoryId;
  assetName: string;
  district: string;
  screenX: number;
  screenY: number;
}

export interface SelectedAssetInfo {
  category: InfrastructureCategoryId;
  assetName: string;
  district: string;
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'status' | 'vote' | 'system' | 'action';
  read: boolean;
  audience: 'citizen' | 'admin' | 'both';
  relatedProposalId?: string;
  category?: InfrastructureCategoryId;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  targetTitle: string;
  timestamp: string;
  department: string;
}
