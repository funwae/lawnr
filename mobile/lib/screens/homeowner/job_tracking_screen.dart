import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../components/media_gallery_widget.dart';

class JobTrackingScreen extends StatefulWidget {
  final String jobId;

  const JobTrackingScreen({
    super.key,
    required this.jobId,
  });

  @override
  State<JobTrackingScreen> createState() => _JobTrackingScreenState();
}

class _JobTrackingScreenState extends State<JobTrackingScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _job;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadJob();
    // Refresh every 10 seconds
    // In production, use WebSocket or polling
  }

  Future<void> _loadJob() async {
    try {
      final response = await _apiService.getJob(widget.jobId);
      setState(() {
        _job = response['job'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading job: $e')),
        );
      }
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'on_way':
        return 'Contractor On The Way';
      case 'started':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'scheduled':
        return Colors.blue;
      case 'on_way':
        return Colors.orange;
      case 'started':
        return const Color(0xFF00FF00);
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'scheduled':
        return Icons.calendar_today;
      case 'on_way':
        return Icons.directions_car;
      case 'started':
        return Icons.build;
      case 'completed':
        return Icons.check_circle;
      case 'cancelled':
        return Icons.cancel;
      default:
        return Icons.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_job == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Job')),
        body: const Center(child: Text('Job not found')),
      );
    }

    final status = _job!['status'] ?? 'scheduled';
    final scheduledDate = _job!['scheduled_date'];
    final scheduledTimeFrom = _job!['scheduled_time_from'];
    final scheduledTimeTo = _job!['scheduled_time_to'];
    final contractorName = _job!['contractor_name'] ?? 'Contractor';
    final address = _job!['address_line1'] ?? '';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Status'),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status card
            Container(
              width: double.infinity,
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: _getStatusColor(status).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _getStatusColor(status),
                  width: 2,
                ),
              ),
              child: Column(
                children: [
                  Icon(
                    _getStatusIcon(status),
                    size: 48,
                    color: _getStatusColor(status),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _getStatusText(status),
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: _getStatusColor(status),
                    ),
                  ),
                ],
              ),
            ),

            // Job details
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildDetailRow(
                    Icons.person,
                    'Contractor',
                    contractorName,
                  ),
                  const SizedBox(height: 12),
                  _buildDetailRow(
                    Icons.home,
                    'Property',
                    address,
                  ),
                  if (scheduledDate != null) ...[
                    const SizedBox(height: 12),
                    _buildDetailRow(
                      Icons.calendar_today,
                      'Date',
                      scheduledDate,
                    ),
                  ],
                  if (scheduledTimeFrom != null) ...[
                    const SizedBox(height: 12),
                    _buildDetailRow(
                      Icons.access_time,
                      'Time',
                      scheduledTimeTo != null
                          ? '$scheduledTimeFrom - $scheduledTimeTo'
                          : scheduledTimeFrom,
                    ),
                  ],
                ],
              ),
            ),

            // Before/After gallery
            if (_job!['before_media'] != null ||
                _job!['after_media'] != null) ...[
              const Divider(),
              if (_job!['before_media'] != null) ...[
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: MediaGalleryWidget(
                    mediaUrls: List<String>.from(_job!['before_media']),
                    title: 'Before',
                  ),
                ),
              ],
              if (_job!['after_media'] != null) ...[
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: MediaGalleryWidget(
                    mediaUrls: List<String>.from(_job!['after_media']),
                    title: 'After',
                  ),
                ),
              ],
            ],

            // Actions
            if (status == 'completed') ...[
              const Divider(),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    ElevatedButton.icon(
                      onPressed: () {
                        // TODO: Navigate to review screen
                      },
                      icon: const Icon(Icons.star),
                      label: const Text('Leave Review'),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton.icon(
                      onPressed: () {
                        // TODO: Navigate to payment screen
                      },
                      icon: const Icon(Icons.payment),
                      label: const Text('Pay Now'),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF00FF00)),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: Colors.grey,
                  fontSize: 12,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

