import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './schemas/notification.schema';

export interface CreateNotificationInput {
  userId: string | null;
  type: NotificationType;
  message: string;
  link?: string | null;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  create(input: CreateNotificationInput): Promise<NotificationDocument> {
    return this.notificationModel.create({
      userId: input.userId,
      type: input.type,
      message: input.message,
      link: input.link ?? null,
    });
  }

  private scopeFilter(userId: string, isAdmin: boolean) {
    return isAdmin ? { $or: [{ userId }, { userId: null }] } : { userId };
  }

  findForUser(userId: string, isAdmin: boolean): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find(this.scopeFilter(userId, isAdmin))
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  countUnread(userId: string, isAdmin: boolean): Promise<number> {
    return this.notificationModel
      .countDocuments({ ...this.scopeFilter(userId, isAdmin), isRead: false })
      .exec();
  }

  async markRead(id: string, userId: string, isAdmin: boolean): Promise<NotificationDocument> {
    const notification = await this.notificationModel.findById(id).exec();
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    const isMine = notification.userId?.toString() === userId;
    const isAdminBroadcast = notification.userId === null && isAdmin;
    if (!isMine && !isAdminBroadcast) {
      throw new NotFoundException('Notification not found');
    }
    notification.isRead = true;
    await notification.save();
    return notification;
  }

  async markAllRead(userId: string, isAdmin: boolean): Promise<void> {
    await this.notificationModel
      .updateMany(this.scopeFilter(userId, isAdmin), { isRead: true })
      .exec();
  }
}
