import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:io';
import '../../services/api_service.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _analytics;
  List<dynamic> _topClients = [];
  List<dynamic> _revenueTrends = [];
  bool _isLoading = true;
  String _period = 'monthly';

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    try {
      setState(() => _isLoading = true);

      final now = DateTime.now();
      final startDate = DateTime(now.year, now.month - 1, 1);
      final endDate = DateTime(now.year, now.month, 0);

      final analyticsResponse = await _apiService.getAnalytics(
        startDate.toIso8601String().split('T')[0],
        endDate.toIso8601String().split('T')[0],
      );

      final clientsResponse = await _apiService.getTopClients();
      final trendsResponse = await _apiService.getRevenueTrends(period: _period);

      setState(() {
        _analytics = analyticsResponse['analytics'];
        _topClients = clientsResponse['clients'] ?? [];
        _revenueTrends = trendsResponse['trends'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading analytics: $e')),
        );
      }
    }
  }

  String _formatCurrency(double amount) {
    return '\$${amount.toStringAsFixed(2)}';
  }

  Future<void> _exportRevenue() async {
    try {
      final now = DateTime.now();
      final startDate = DateTime(now.year, now.month - 1, 1);
      final endDate = DateTime(now.year, now.month, 0);

      final response = await _apiService.exportRevenueCSV(
        startDate.toIso8601String().split('T')[0],
        endDate.toIso8601String().split('T')[0],
      );

      // Save to temporary file and share
      final tempDir = Directory.systemTemp;
      final file = File('${tempDir.path}/revenue_${DateTime.now().millisecondsSinceEpoch}.csv');
      await file.writeAsString(response);

      if (mounted) {
        await Share.shareXFiles([XFile(file.path)], text: 'Revenue Export');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error exporting revenue: $e')),
        );
      }
    }
  }

  Future<void> _exportExpenses() async {
    try {
      final now = DateTime.now();
      final startDate = DateTime(now.year, now.month - 1, 1);
      final endDate = DateTime(now.year, now.month, 0);

      final response = await _apiService.exportExpensesCSV(
        startDate.toIso8601String().split('T')[0],
        endDate.toIso8601String().split('T')[0],
      );

      // Save to temporary file and share
      final tempDir = Directory.systemTemp;
      final file = File('${tempDir.path}/expenses_${DateTime.now().millisecondsSinceEpoch}.csv');
      await file.writeAsString(response);

      if (mounted) {
        await Share.shareXFiles([XFile(file.path)], text: 'Expenses Export');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error exporting expenses: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_analytics == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Analytics')),
        body: const Center(child: Text('No analytics data available')),
      );
    }

    final revenue = _analytics!['revenue'] ?? {};
    final expenses = _analytics!['expenses'] ?? {};
    final profit = _analytics!['profit'] ?? {};
    final jobs = _analytics!['jobs'] ?? {};

    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) async {
              if (value == 'export_revenue') {
                await _exportRevenue();
              } else if (value == 'export_expenses') {
                await _exportExpenses();
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'export_revenue',
                child: Row(
                  children: [
                    Icon(Icons.file_download, size: 20),
                    SizedBox(width: 8),
                    Text('Export Revenue (CSV)'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'export_expenses',
                child: Row(
                  children: [
                    Icon(Icons.file_download, size: 20),
                    SizedBox(width: 8),
                    Text('Export Expenses (CSV)'),
                  ],
                ),
              ),
            ],
            icon: const Icon(Icons.more_vert),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadAnalytics,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadAnalytics,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Period selector
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'weekly', label: Text('Week')),
                  ButtonSegment(value: 'monthly', label: Text('Month')),
                ],
                selected: {_period},
                onSelectionChanged: (Set<String> newSelection) {
                  setState(() {
                    _period = newSelection.first;
                  });
                  _loadAnalytics();
                },
              ),
              const SizedBox(height: 24),

              // Summary cards
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      'Revenue',
                      _formatCurrency(revenue['total'] ?? 0.0),
                      Icons.attach_money,
                      const Color(0xFF00FF00),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard(
                      'Expenses',
                      _formatCurrency(expenses['total'] ?? 0.0),
                      Icons.trending_down,
                      Colors.orange,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      'Profit',
                      _formatCurrency(profit['total'] ?? 0.0),
                      Icons.trending_up,
                      profit['total'] != null && profit['total'] > 0
                          ? Colors.green
                          : Colors.red,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard(
                      'Jobs',
                      '${jobs['completed'] ?? 0}',
                      Icons.work,
                      Colors.blue,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Profit margin
              if (profit['margin_percent'] != null) ...[
                const Text(
                  'Profit Margin',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: (profit['margin_percent'] ?? 0) / 100,
                  backgroundColor: Colors.grey[300],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    profit['margin_percent'] != null && profit['margin_percent'] > 0
                        ? Colors.green
                        : Colors.red,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${profit['margin_percent']?.toStringAsFixed(1) ?? 0}%',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 24),
              ],

              // Top clients
              if (_topClients.isNotEmpty) ...[
                const Text(
                  'Top Clients',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                ..._topClients.take(5).map((client) {
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: const Color(0xFF00FF00),
                        child: Text(
                          (client['full_name'] ?? 'C')[0].toUpperCase(),
                          style: const TextStyle(color: Colors.black),
                        ),
                      ),
                      title: Text(client['full_name'] ?? 'Client'),
                      subtitle: Text(
                        '${client['job_count']} job${client['job_count'] != 1 ? 's' : ''}',
                      ),
                      trailing: Text(
                        _formatCurrency(client['total_spent'] ?? 0.0),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF00FF00),
                        ),
                      ),
                    ),
                  );
                }).toList(),
                const SizedBox(height: 24),
              ],

              // Expense breakdown
              if (expenses['breakdown'] != null &&
                  (expenses['breakdown'] as List).isNotEmpty) ...[
                const Text(
                  'Expense Breakdown',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                ...(expenses['breakdown'] as List).map((item) {
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      title: Text(
                        (item['expense_type'] ?? '').toString().toUpperCase(),
                      ),
                      subtitle: Text('${item['count']} expense${item['count'] != 1 ? 's' : ''}'),
                      trailing: Text(
                        _formatCurrency(item['total'] ?? 0.0),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  );
                }).toList(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                color: Colors.grey,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

