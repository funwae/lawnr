import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  final ApiService _apiService = ApiService();

  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;

    // Request permission
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // Initialize local notifications
      const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosSettings = DarwinInitializationSettings();
      const initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      await _localNotifications.initialize(
        initSettings,
        onDidReceiveNotificationResponse: _onNotificationTapped,
      );

      // Get FCM token
      String? token = await _firebaseMessaging.getToken();
      if (token != null) {
        await _registerToken(token);
      }

      // Listen for token refresh
      _firebaseMessaging.onTokenRefresh.listen(_registerToken);

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Handle background messages
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // Check for initial notification
      RemoteMessage? initialMessage = await _firebaseMessaging.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationTap(initialMessage);
      }

      _initialized = true;
    }
  }

  Future<void> _registerToken(String token) async {
    try {
      await _apiService.registerFCMToken(token);

      // Store token locally
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('fcm_token', token);
    } catch (e) {
      print('Error registering FCM token: $e');
    }
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    // Show local notification when app is in foreground
    await _showLocalNotification(
      message.notification?.title ?? 'Lawnr',
      message.notification?.body ?? '',
      message.data,
    );
  }

  Future<void> _handleNotificationTap(RemoteMessage message) async {
    // Handle notification tap - navigate to appropriate screen
    final data = message.data;
    final type = data['type'];
    final jobId = data['job_id'];

    // TODO: Navigate to appropriate screen based on notification type
    print('Notification tapped: $type, job_id: $jobId');
  }

  void _onNotificationTapped(NotificationResponse response) {
    // Handle local notification tap
    final payload = response.payload;
    if (payload != null) {
      // TODO: Parse payload and navigate
      print('Local notification tapped: $payload');
    }
  }

  Future<void> _showLocalNotification(
    String title,
    String body,
    Map<String, dynamic> data,
  ) async {
    const androidDetails = AndroidNotificationDetails(
      'lawnr_channel',
      'Lawnr Notifications',
      channelDescription: 'Notifications for jobs, quotes, and payments',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title,
      body,
      details,
      payload: data.toString(),
    );
  }

  Future<void> subscribeToTopic(String topic) async {
    await _firebaseMessaging.subscribeToTopic(topic);
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    await _firebaseMessaging.unsubscribeFromTopic(topic);
  }
}


