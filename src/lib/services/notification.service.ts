/**
 * Notification Service
 * Handles Web Notifications API and in-app toast notifications
 * Supports both browser notifications and PWA installed app notifications
 */

export type NotificationType = 'note' | 'todo';

export interface NotificationPayload {
	type: NotificationType;
	title: string;
	message: string;
}

class NotificationService {
	private static permission: NotificationPermission = 'default';

	/**
	 * Initialize notification service
	 * Check current permission status
	 */
	static async initialize(): Promise<void> {
		if ('Notification' in window) {
			this.permission = Notification.permission;
		}
	}

	/**
	 * Request notification permission from user
	 * Required for browser and PWA notifications
	 */
	static async requestPermission(): Promise<NotificationPermission> {
		if (!('Notification' in window)) {
			console.warn('Notifications not supported in this browser');
			return 'denied';
		}

		// Already granted
		if (this.permission === 'granted') {
			return 'granted';
		}

		// Request permission
		try {
			this.permission = await Notification.requestPermission();
			return this.permission;
		} catch (error) {
			console.error('Error requesting notification permission:', error);
			return 'denied';
		}
	}

	/**
	 * Show browser/PWA notification with sound
	 * Falls back gracefully if permission denied
	 */
	static async showNotification(payload: NotificationPayload): Promise<void> {
		const { type, title } = payload;

		// Try to show native notification
		if (this.permission === 'granted' && 'Notification' in window) {
			try {
				const notification = new Notification(`Tartalom frissítés érkezett!`, {
					body: `${type === 'note' ? 'Jegyzet' : 'TODO'}: ${title}`,
					icon: '/pwa-192x192.png',
					badge: '/pwa-192x192.png',
					tag: `sync-${type}-${Date.now()}`,
					requireInteraction: false,
					silent: false, // Play default notification sound
				});

				// Auto-close after 5 seconds
				setTimeout(() => notification.close(), 5000);
			} catch (error) {
				console.error('Error showing notification:', error);
			}
		}

		// Play notification sound (fallback for in-app toast)
		this.playNotificationSound();
	}

	/**
	 * Play notification sound using Audio API
	 * Uses system notification sound on mobile
	 */
	private static playNotificationSound(): void {
		try {
			// Create audio context for notification sound
			// Using data URI for a simple notification beep
			const audioContext = new (window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);

			// Notification beep: 800Hz, 150ms
			oscillator.frequency.value = 800;
			oscillator.type = 'sine';

			gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

			oscillator.start(audioContext.currentTime);
			oscillator.stop(audioContext.currentTime + 0.15);
		} catch (error) {
			console.error('Error playing notification sound:', error);
		}
	}

	/**
	 * Check if notifications are supported
	 */
	static isSupported(): boolean {
		return 'Notification' in window;
	}

	/**
	 * Get current permission status
	 */
	static getPermission(): NotificationPermission {
		return this.permission;
	}
}

export default NotificationService;
