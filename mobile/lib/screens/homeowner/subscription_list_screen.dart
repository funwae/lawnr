import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'create_subscription_screen.dart';

class SubscriptionListScreen extends StatefulWidget {
  const SubscriptionListScreen({super.key});

  @override
  State<SubscriptionListScreen> createState() => _SubscriptionListScreenState();
}

class _SubscriptionListScreenState extends State<SubscriptionListScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _subscriptions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSubscriptions();
  }

  Future<void> _loadSubscriptions() async {
    try {
      final response = await _apiService.getSubscriptions();
      setState(() {
        _subscriptions = response['subscriptions'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading subscriptions: $e')),
        );
      }
    }
  }

  String _formatFrequency(dynamic subscription) {
    final freq = subscription['frequency'] ?? 'weekly';
    final value = subscription['frequency_value'];

    switch (freq) {
      case 'weekly':
        return 'Weekly';
      case 'biweekly':
        return 'Bi-weekly';
      case 'monthly':
        return 'Monthly';
      case 'custom':
        return 'Every ${value ?? 1} week${value != 1 ? 's' : ''}';
      default:
        return freq;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'active':
        return const Color(0xFF00FF00);
      case 'paused':
        return Colors.orange;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recurring Services'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const CreateSubscriptionScreen(),
                ),
              );
              if (result == true) {
                _loadSubscriptions();
              }
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _subscriptions.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.repeat,
                        size: 64,
                        color: Colors.grey,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'No recurring services',
                        style: TextStyle(fontSize: 18, color: Colors.grey),
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton.icon(
                        onPressed: () async {
                          final result = await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const CreateSubscriptionScreen(),
                            ),
                          );
                          if (result == true) {
                            _loadSubscriptions();
                          }
                        },
                        icon: const Icon(Icons.add),
                        label: const Text('Create Recurring Service'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadSubscriptions,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _subscriptions.length,
                    itemBuilder: (context, index) {
                      final subscription = _subscriptions[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        child: InkWell(
                          onTap: () {
                            // TODO: Navigate to subscription detail
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            subscription['address_line1'] ?? 'Property',
                                            style: const TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          if (subscription['city'] != null)
                                            Text(
                                              '${subscription['city']}, ${subscription['province'] ?? ''}',
                                              style: const TextStyle(color: Colors.grey),
                                            ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(
                                          subscription['status'] ?? 'active',
                                        ).withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        (subscription['status'] ?? 'active').toUpperCase(),
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: _getStatusColor(
                                            subscription['status'] ?? 'active',
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    const Icon(Icons.repeat, size: 16, color: Colors.grey),
                                    const SizedBox(width: 8),
                                    Text(
                                      _formatFrequency(subscription),
                                      style: const TextStyle(color: Colors.grey),
                                    ),
                                    const Spacer(),
                                    if (subscription['next_service_date'] != null) ...[
                                      const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                                      const SizedBox(width: 8),
                                      Text(
                                        subscription['next_service_date'],
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                if (subscription['contractor_name'] != null) ...[
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      const Icon(Icons.person, size: 16, color: Colors.grey),
                                      const SizedBox(width: 8),
                                      Text(
                                        subscription['contractor_name'],
                                        style: const TextStyle(color: Colors.grey),
                                      ),
                                    ],
                                  ),
                                ],
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
}

