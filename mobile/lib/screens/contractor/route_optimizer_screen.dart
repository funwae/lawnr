import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import '../../components/optimized_route_display.dart';
import '../../services/api_service.dart';
import '../../services/route_service.dart';

class RouteOptimizerScreen extends StatefulWidget {
  final List<String>? jobIds;

  const RouteOptimizerScreen({super.key, this.jobIds});

  @override
  State<RouteOptimizerScreen> createState() => _RouteOptimizerScreenState();
}

class _RouteOptimizerScreenState extends State<RouteOptimizerScreen> {
  final ApiService _apiService = ApiService();
  List<Map<String, dynamic>> _jobs = [];
  List<LatLng> _optimizedWaypoints = [];
  double _totalDistance = 0;
  int _estimatedTime = 0;
  bool _loading = false;
  bool _optimized = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadJobs();
  }

  Future<void> _loadJobs() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final response = await _apiService.getJobs(status: 'scheduled');
      final jobs = List<Map<String, dynamic>>.from(response['jobs'] ?? []);

      // Filter by jobIds if provided
      final filteredJobs = widget.jobIds != null
          ? jobs.where((job) => widget.jobIds!.contains(job['id'])).toList()
          : jobs;

      setState(() {
        _jobs = filteredJobs;
        _loading = false;
      });

      if (_jobs.length >= 2) {
        _optimizeRoute();
      } else {
        setState(() {
          _error = 'At least 2 jobs are required for route optimization';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error loading jobs: $e';
        _loading = false;
      });
    }
  }

  Future<void> _optimizeRoute() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // Extract waypoints from jobs
      final waypoints = _jobs
          .where((job) =>
              job['property']?['latitude'] != null &&
              job['property']?['longitude'] != null)
          .map((job) => {
            return {
              'id': job['id'],
              'latitude': double.parse(job['property']['latitude'].toString()),
              'longitude': double.parse(job['property']['longitude'].toString()),
            };
          })
          .toList();

      if (waypoints.length < 2) {
        setState(() {
          _error = 'Insufficient job locations for optimization';
          _loading = false;
        });
        return;
      }

      // Call optimization API
      final response = await _apiService.optimizeRoute(
        jobIds: _jobs.map((j) => j['id'].toString()).toList(),
      );

      final optimizedRoute = response['optimized_route'] as List;
      final optimizedWaypoints = optimizedRoute.map((wp) {
        return LatLng(
          double.parse(wp['latitude'].toString()),
          double.parse(wp['longitude'].toString()),
        );
      }).toList();

      setState(() {
        _optimizedWaypoints = optimizedWaypoints;
        _totalDistance = double.parse(response['total_distance_km'].toString());
        _estimatedTime = int.parse(response['estimated_time_minutes'].toString());
        _optimized = true;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Error optimizing route: $e';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Route Optimizer'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.green,
        actions: [
          if (_jobs.length >= 2 && !_loading)
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _optimizeRoute,
              tooltip: 'Re-optimize',
            ),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Colors.green),
            )
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.red,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _error!,
                          style: const TextStyle(color: Colors.white),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: _loadJobs,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.black,
                          ),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : _optimized && _optimizedWaypoints.isNotEmpty
                  ? OptimizedRouteDisplay(
                      jobs: _jobs,
                      optimizedWaypoints: _optimizedWaypoints,
                      totalDistance: _totalDistance,
                      estimatedTime: _estimatedTime,
                    )
                  : Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.route,
                              size: 64,
                              color: Colors.green,
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'No jobs available for optimization',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'You need at least 2 scheduled jobs',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
    );
  }
}

