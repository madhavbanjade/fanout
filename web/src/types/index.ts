export type APIResponse<T = unknown> =
  | {
      success: true;
      data: T;
      error: null;
    }
  | {
      success: false;
      data: null;
      error: string;
    };

export type UserRole = "ADMIN" | "EMPLOYEE";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface StatMetric {
  value: number;
  deltaPct: number;
}

export interface LatencyMetric {
  value: number;
  deltaMs: number;
}

export interface DashboardStats {
  sentToday: StatMetric;
  delivered: StatMetric;
  failed: StatMetric;
  avgLatencyMs: LatencyMetric;
}

export interface VolumePoint {
  date: string;
  sent: number;
  delivered: number;
}

export type NotificationStatus = "PENDING" | "DELIVERED" | "FAILED" | "DEAD_LETTER";

export interface RecentDelivery {
  id: string;
  direction: "sent" | "received";
  sender: string;
  recipient: string;
  message: string;
  type: string;
  channel: string;
  status: NotificationStatus;
  createdAt: string;
}

export interface PaginatedRecent {
  items: RecentDelivery[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InboxNotification {
  id: string;
  userId: string;
  type: string;
  payload: { title?: string; message?: string };
  status: NotificationStatus;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  mentions: boolean;
  taskAssigned: boolean;
  taskUpdates: boolean;
  leaveUpdates: boolean;
  meetingUpdates: boolean;
  announcements: boolean;
  systemSecurity: boolean;
  quietHoursEnabled: boolean;
}