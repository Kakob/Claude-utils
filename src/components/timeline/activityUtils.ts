import type { ActivityType } from '../../types';

export const activityLabels: Record<ActivityType, string> = {
  message_sent: 'Message Sent',
  message_received: 'Response',
  artifact_created: 'Artifact',
  code_block: 'Code',
  tool_use: 'Tool Use',
  tool_result: 'Tool Result',
};

export function getActivityLabel(type: ActivityType): string {
  return activityLabels[type];
}
