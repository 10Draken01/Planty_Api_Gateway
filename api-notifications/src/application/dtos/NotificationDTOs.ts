export interface SendNotificationToUserDTO {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface SendNotificationToUsersDTO {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface BroadcastNotificationDTO {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface NotificationResponseDTO {
  success: boolean;
  message: string;
  successCount?: number;
  failureCount?: number;
  details?: {
    userId?: string;
    sent: boolean;
    error?: string;
  }[];
}
