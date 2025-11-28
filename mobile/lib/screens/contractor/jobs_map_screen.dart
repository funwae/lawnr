import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter_map/flutter_map.dart';
import '../../components/map_widget.dart';
import '../../components/job_map_marker.dart';
import '../../services/api_service.dart';

class JobsMapScreen extends StatefulWidget {
  const JobsMapScreen({super.key});

  @override
  State<JobsMapScreen> createState() => _JobsMapScreenState();
}

class _JobsMapScreenState extends State<JobsMapScreen> {
  final ApiService _apiService = ApiService();
  final MapController _mapController = MapController();

  List<dynamic> _jobs = [];
  LatLng? _userLocation;
  String? _selectedJobId;
  dynamic _selectedJob;
  bool _loading = true;
  String? _statusFilter;

  @override
  void initState() {
    super.initState();
    _loadJobs();
    _getUserLocation();
  }

  Future<void> _getUserLocation() async {
    // In a real app, use geolocator to get current location
    setState(() {
      _userLocation = const LatLng(45.5017, -73.5673); // Montreal
    });
  }

  Future<void> _loadJobs() async {
    try {
      setState(() => _loading = true);
      final response = await _apiService.getJobs(
        status: _statusFilter,
      );
      setState(() {
        _jobs = response['jobs'] ?? [];
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

  List<Marker> _buildMarkers() {
    return _jobs.map((job) {
      // Get property location from job
      final lat = job['property']?['latitude'] as double?;
      final lon = job['property']?['longitude'] as double?;
      if (lat == null || lon == null) return null;

      return JobMapMarker.create(
        position: LatLng(lat, lon),
        jobId: job['id'] ?? '',
        status: job['status'] ?? 'scheduled',
        onTap: () {
          setState(() {
            _selectedJobId = job['id'];
            _selectedJob = job;
          });
        },
      );
    }).whereType<Marker>().toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Locations'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.green,
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              setState(() {
                _statusFilter = value == 'all' ? null : value;
              });
              _loadJobs();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'all', child: Text('All Statuses')),
              const PopupMenuItem(value: 'scheduled', child: Text('Scheduled')),
              const PopupMenuItem(value: 'on_way', child: Text('On the Way')),
              const PopupMenuItem(value: 'started', child: Text('Started')),
              const PopupMenuItem(value: 'completed', child: Text('Completed')),
            ],
          ),
        ],
      ),
      body: Stack(
        children: [
          MapWidget(
            center: _userLocation,
            zoom: 12.0,
            markers: _buildMarkers(),
          ),
          if (_selectedJob != null)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Card(
                margin: const EdgeInsets.all(16),
                color: Colors.black87,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Job ${_selectedJob['id']?.toString().substring(0, 8) ?? 'Unknown'}',
                            style: const TextStyle(
                              color: Colors.green,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, color: Colors.white),
                            onPressed: () {
                              setState(() {
                                _selectedJob = null;
                                _selectedJobId = null;
                              });
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Status: ${_selectedJob['status'] ?? 'Unknown'}',
                        style: const TextStyle(color: Colors.white70),
                      ),
                      if (_selectedJob['scheduled_date'] != null)
                        Text(
                          'Date: ${_selectedJob['scheduled_date']}',
                          style: const TextStyle(color: Colors.white70),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          if (_loading)
            const Center(
              child: CircularProgressIndicator(color: Colors.green),
            ),
        ],
      ),
    );
  }
}

