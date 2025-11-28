import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';

class NotificationCenterScreen extends StatefulWidget {
  const NotificationCenterScreen({super.key});

  @override
  State<NotificationCenterScreen> createState() => _NotificationCenterScreenState();
}

class _NotificationCenterScreenState extends State<NotificationCenterScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = true;
  bool _showUnreadOnly = false;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    _loadUnreadCount();
  }

  Future<void> _loadNotifications() async {
    try {
      setState(() => _isLoading = true);
      final response = await _apiService.getNotifications(
        unreadOnly: _showUnreadOnly,
      );
      setState(() {
        _notifications = response['notifications'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading notifications: $e')),
        );
      }
    }
  }

  Future<void> _loadUnreadCount() async {
    try {
      final response = await _apiService.getUnreadNotificationCount();
      setState(() {
        _unreadCount = response['count'] ?? 0;
      });
    } catch (e) {
      print('Error loading unread count: $e');
    }
  }

  Future<void> _markAsRead(String notificationId) async {
    try {
      await _apiService.markNotificationAsRead(notificationId);
      await _loadNotifications();
      await _loadUnreadCount();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error marking as read: $e')),
        );
      }
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      await _apiService.markAllNotificationsAsRead();
      await _loadNotifications();
      await _loadUnreadCount();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error marking all as read: $e')),
        );
      }
    }
  }

  String _getNotificationIcon(String type) {
    switch (type) {
      case 'reminder_24h':
      case 'reminder_1h':
        return '⏰';
      case 'on_my_way':
      case 'arrival_eta':
        return '🚗';
      case 'job_complete':
        return '✅';
      case 'payment_due':
      case 'payment_received':
        return '💳';
      case 'quote_received':
      case 'quote_accepted':
        return '💰';
      case 'job_scheduled':
        return '📅';
      default:
        return '🔔';
    }
  }

  Color _getNotificationColor(String type) {
    switch (type) {
      case 'job_complete':
      case 'quote_accepted':
        return const Color(0xFF00FF00);
      case 'payment_due':
        return Colors.orange;
      case 'payment_received':
        return Colors.green;
      default:
        return Colors.blue;
    }
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inDays == 0) {
        if (difference.inHours == 0) {
          if (difference.inMinutes == 0) {
            return 'Just now';
          }
          return '${difference.inMinutes}m ago';
        }
        return '${difference.inHours}h ago';
      } else if (difference.inDays == 1) {
        return 'Yesterday';
      } else if (difference.inDays < 7) {
        return '${difference.inDays}d ago';
      } else {
        return DateFormat('MMM d, y').format(date);
      }
    } catch (e) {
      return dateString;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (_unreadCount > 0)
            TextButton(
              onPressed: _markAllAsRead,
              child: const Text('Mark all read'),
            ),
          IconButton(
            icon: Icon(_showUnreadOnly ? Icons.filter_list : Icons.filter_list_off),
            onPressed: () {
              setState(() {
                _showUnreadOnly = !_showUnreadOnly;
              });
              _loadNotifications();
            },
            tooltip: _showUnreadOnly ? 'Show all' : 'Show unread only',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.notifications_none,
                        size: 64,
                        color: Colors.grey,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _showUnreadOnly ? 'No unread notifications' : 'No notifications',
                        style: const TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadNotifications,
                  child: ListView.builder(
                    itemCount: _notifications.length,
                    itemBuilder: (context, index) {
                      final notification = _notifications[index];
                      final isUnread = notification['status'] != 'read';
                      final type = notification['type'] ?? '';
                      final payload = notification['payload'] ?? {};

                      return Dismissible(
                        key: Key(notification['id']),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          color: Colors.red,
                          child: const Icon(Icons.delete, color: Colors.white),
                        ),
                        onDismissed: (direction) async {
                          // TODO: Implement delete
                        },
                        child: InkWell(
                          onTap: () {
                            if (isUnread) {
                              _markAsRead(notification['id']);
                            }
                            // TODO: Navigate to relevant screen
                          },
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isUnread
                                  ? const Color(0xFF1A1A1A)
                                  : Colors.transparent,
                              border: Border(
                                bottom: BorderSide(
                                  color: Colors.grey.withOpacity(0.2),
                                  width: 1,
                                ),
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: _getNotificationColor(type).withOpacity(0.2),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Center(
                                    child: Text(
                                      _getNotificationIcon(type),
                                      style: const TextStyle(fontSize: 24),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _getNotificationTitle(type, payload),
                                        style: TextStyle(
                                          fontWeight: isUnread
                                              ? FontWeight.bold
                                              : FontWeight.normal,
                                          fontSize: 16,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        _getNotificationBody(type, payload),
                                        style: TextStyle(
                                          color: Colors.grey,
                                          fontSize: 14,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        _formatDate(notification['created_at']),
                                        style: TextStyle(
                                          color: Colors.grey.withOpacity(0.7),
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (isUnread)
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF00FF00),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  String _getNotificationTitle(String type, Map<String, dynamic> payload) {
    switch (type) {
      case 'reminder_24h':
        return 'Job Reminder';
      case 'reminder_1h':
        return 'Job Starting Soon';
      case 'on_my_way':
        return 'Contractor On The Way';
      case 'arrival_eta':
        return 'Arrival Update';
      case 'job_complete':
        return 'Job Completed';
      case 'payment_due':
        return 'Payment Due';
      case 'payment_received':
        return 'Payment Received';
      case 'quote_received':
        return 'New Quote';
      case 'quote_accepted':
        return 'Quote Accepted';
      case 'job_scheduled':
        return 'Job Scheduled';
      default:
        return 'Notification';
    }
  }

  String _getNotificationBody(String type, Map<String, dynamic> payload) {
    switch (type) {
      case 'reminder_24h':
        return 'You have a job scheduled for tomorrow.';
      case 'reminder_1h':
        return 'Your job is starting in 1 hour.';
      case 'on_my_way':
        return 'Your contractor is on the way.';
      case 'arrival_eta':
        return payload['eta'] != null
            ? 'Arriving in ${payload['eta']} minutes.'
            : 'Arriving soon.';
      case 'job_complete':
        return 'Your job has been completed. Please review and pay.';
      case 'payment_due':
        return 'Payment is due for your completed job.';
      case 'payment_received':
        return 'Payment of \$${payload['amount'] ?? 'N/A'} received.';
      case 'quote_received':
        return 'You received a new quote for \$${payload['price'] ?? 'N/A'}.';
      case 'quote_accepted':
        return 'Your quote has been accepted!';
      case 'job_scheduled':
        return 'A new job has been scheduled for you.';
      default:
        return 'You have a new notification.';
    }
  }
}

