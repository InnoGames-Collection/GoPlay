/**
 * Notification Toast Component
 */

import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, Info, AlertTriangle, XCircle, Coins, X } from 'lucide-react';

interface NotificationToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = () => {
  // Completely eliminates floating toast popups from covering the gameplay or UI area
  return null;
};

