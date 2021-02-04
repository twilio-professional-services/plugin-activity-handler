import { Manager, Notifications, NotificationType } from '@twilio/flex-ui';

import { FlexNotification } from '../enums';

const manager = Manager.getInstance();

manager.strings[FlexNotification.activityChangeDelayed] = (
  'You will be set to "{{activityName}}" when all tasks are completed'
);

manager.strings[FlexNotification.restrictedActivities] = (
  'Status "{{activityName}}" cannot be manually selected'
);

Notifications.registerNotification({
  id: FlexNotification.activityChangeDelayed,
  closeButton: true,
  content: FlexNotification.activityChangeDelayed,
  timeout: 5000,
  type: NotificationType.success,
});

Notifications.registerNotification({
  id: FlexNotification.restrictedActivities,
  closeButton: true,
  content: FlexNotification.restrictedActivities,
  type: NotificationType.warning,
  timeout: 5000
});	
