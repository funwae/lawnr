import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../components/job_calendar.dart';
import '../../services/api_service.dart';

class ContractorJobCalendarScreen extends StatefulWidget {
  const ContractorJobCalendarScreen({super.key});

  @override
  State<ContractorJobCalendarScreen> createState() =>
      _ContractorJobCalendarScreenState();
}

class _ContractorJobCalendarScreenState
    extends State<ContractorJobCalendarScreen> {
  final ApiService _apiService = ApiService();
  Map<DateTime, List<dynamic>> _jobsByDate = {};
  List<dynamic> _selectedDayJobs = [];
  DateTime? _selectedDay;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadJobs();
  }

  Future<void> _loadJobs() async {
    setState(() => _loading = true);

    try {
      final response = await _apiService.getJobs();
      final jobs = List<Map<String, dynamic>>.from(response['jobs'] ?? []);

      // Group jobs by date
      final jobsByDate = <DateTime, List<dynamic>>{};
      for (final job in jobs) {
        if (job['scheduled_date'] != null) {
          try {
            final dateStr = job['scheduled_date'].toString();
            final date = DateTime.parse(dateStr);
            final dateOnly = DateTime(date.year, date.month, date.day);

            if (!jobsByDate.containsKey(dateOnly)) {
              jobsByDate[dateOnly] = [];
            }
            jobsByDate[dateOnly]!.add(job);
          } catch (e) {
            // Skip invalid dates
            continue;
          }
        }
      }

      setState(() {
        _jobsByDate = jobsByDate;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading jobs: $e')),
        );
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'completed':
        return Colors.green;
      case 'started':
      case 'on_way':
        return Colors.orange;
      case 'scheduled':
        return Colors.blue;
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
        title: const Text('Job Calendar'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.green,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadJobs,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Colors.green))
          : Column(
              children: [
                JobCalendar(
                  jobsByDate: _jobsByDate,
                  onDaySelected: (day, jobs) {
                    setState(() {
                      _selectedDay = day;
                      _selectedDayJobs = jobs;
                    });
                  },
                ),
                if (_selectedDay != null && _selectedDayJobs.isNotEmpty)
                  Expanded(
                    child: Container(
                      color: Colors.black87,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Text(
                              'Jobs on ${DateFormat('MMMM d, y').format(_selectedDay!)}',
                              style: const TextStyle(
                                color: Colors.green,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          Expanded(
                            child: ListView.builder(
                              itemCount: _selectedDayJobs.length,
                              itemBuilder: (context, index) {
                                final job = _selectedDayJobs[index];
                                return Card(
                                  margin: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 8,
                                  ),
                                  color: Colors.grey[900],
                                  child: ListTile(
                                    leading: Container(
                                      width: 12,
                                      height: 12,
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(
                                          job['status'] ?? 'scheduled',
                                        ),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    title: Text(
                                      job['property']?['address_line1'] ??
                                          'Unknown Address',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    subtitle: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Status: ${job['status'] ?? 'Unknown'}',
                                          style: const TextStyle(
                                            color: Colors.white70,
                                          ),
                                        ),
                                        if (job['scheduled_time_from'] != null)
                                          Text(
                                            'Time: ${job['scheduled_time_from']}',
                                            style: const TextStyle(
                                              color: Colors.white70,
                                            ),
                                          ),
                                      ],
                                    ),
                                    trailing: const Icon(
                                      Icons.chevron_right,
                                      color: Colors.green,
                                    ),
                                    onTap: () {
                                      // Navigate to job detail
                                    },
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else if (_selectedDay != null)
                  Container(
                    padding: const EdgeInsets.all(32),
                    color: Colors.black87,
                    child: Center(
                      child: Text(
                        'No jobs scheduled for ${DateFormat('MMMM d').format(_selectedDay!)}',
                        style: const TextStyle(color: Colors.white70),
                      ),
                    ),
                  ),
              ],
            ),
    );
  }
}

