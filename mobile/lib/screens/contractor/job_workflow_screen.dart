import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../components/media_upload_widget.dart';

class JobWorkflowScreen extends StatefulWidget {
  final String jobId;

  const JobWorkflowScreen({
    super.key,
    required this.jobId,
  });

  @override
  State<JobWorkflowScreen> createState() => _JobWorkflowScreenState();
}

class _JobWorkflowScreenState extends State<JobWorkflowScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _job;
  bool _isLoading = true;
  final _fuelController = TextEditingController();
  final _materialsController = TextEditingController();
  final _hoursController = TextEditingController();
  List<String> _afterMediaUrls = [];

  @override
  void initState() {
    super.initState();
    _loadJob();
  }

  @override
  void dispose() {
    _fuelController.dispose();
    _materialsController.dispose();
    _hoursController.dispose();
    super.dispose();
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
    }
  }

  Future<void> _updateJobStatus(String status) async {
    try {
      Map<String, dynamic>? costLog;
      List<String>? afterMedia;

      if (status == 'complete') {
        costLog = {
          'fuel': double.tryParse(_fuelController.text) ?? 0,
          'materials': double.tryParse(_materialsController.text) ?? 0,
          'hours': double.tryParse(_hoursController.text) ?? 0,
        };
        afterMedia = _afterMediaUrls.isNotEmpty ? _afterMediaUrls : null;
      }

      await _apiService.updateJobStatus(
        widget.jobId,
        status,
        afterMedia: afterMedia,
        costLog: costLog,
      );

      await _loadJob();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Job status updated to $status'),
            backgroundColor: const Color(0xFF00FF00),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating job: $e')),
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

    if (_job == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Job')),
        body: const Center(child: Text('Job not found')),
      );
    }

    final status = _job!['status'] ?? 'scheduled';
    final scheduledDate = _job!['scheduled_date'];
    final address = _job!['address_line1'] ?? '';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Workflow'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Job info card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.home, color: Color(0xFF00FF00)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            address,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (scheduledDate != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                          const SizedBox(width: 8),
                          Text(
                            scheduledDate,
                            style: const TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00FF00).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        status.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Status actions
            if (status == 'scheduled') ...[
              const Text(
                'Ready to start?',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => _updateJobStatus('on_way'),
                icon: const Icon(Icons.directions_car),
                label: const Text('Mark On The Way'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ],

            if (status == 'on_way') ...[
              const Text(
                'Arrived at location?',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => _updateJobStatus('started'),
                icon: const Icon(Icons.play_arrow),
                label: const Text('Start Job'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ],

            if (status == 'started') ...[
              const Text(
                'Complete Job',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),

              // After photos
              const Text('After Photos *'),
              const SizedBox(height: 8),
              MediaUploadWidget(
                jobId: widget.jobId,
                mediaType: 'after',
                onMediaSelected: (urls) {
                  setState(() {
                    _afterMediaUrls = urls;
                  });
                },
              ),

              const SizedBox(height: 24),

              // Cost log
              const Text('Cost Log (Optional)'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _fuelController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Fuel Cost',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.local_gas_station),
                  prefixText: '\$',
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _materialsController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Materials Cost',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.construction),
                  prefixText: '\$',
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _hoursController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Hours Worked',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.access_time),
                ),
              ),

              const SizedBox(height: 24),

              ElevatedButton.icon(
                onPressed: _afterMediaUrls.isEmpty
                    ? null
                    : () => _updateJobStatus('complete'),
                icon: const Icon(Icons.check_circle),
                label: const Text('Complete Job'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ],

            if (status == 'completed') ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.green),
                    SizedBox(width: 8),
                    Text(
                      'Job completed! Waiting for payment.',
                      style: TextStyle(color: Colors.green),
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
}

