import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter_map/flutter_map.dart';
import '../../components/map_widget.dart';
import '../../components/contractor_map_marker.dart';
import '../../components/contractor_map_card.dart';
import '../../services/api_service.dart';

class ContractorMapScreen extends StatefulWidget {
  const ContractorMapScreen({super.key});

  @override
  State<ContractorMapScreen> createState() => _ContractorMapScreenState();
}

class _ContractorMapScreenState extends State<ContractorMapScreen> {
  final ApiService _apiService = ApiService();
  final MapController _mapController = MapController();

  List<dynamic> _contractors = [];
  LatLng? _userLocation;
  String? _selectedContractorId;
  dynamic _selectedContractor;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadContractors();
    _getUserLocation();
  }

  Future<void> _getUserLocation() async {
    // In a real app, use geolocator to get current location
    // For now, use a default location
    setState(() {
      _userLocation = const LatLng(45.5017, -73.5673); // Montreal
    });
  }

  Future<void> _loadContractors() async {
    try {
      setState(() => _loading = true);
      final response = await _apiService.searchContractors();
      setState(() {
        _contractors = response['contractors'] ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading contractors: $e')),
        );
      }
    }
  }

  List<Marker> _buildMarkers() {
    return _contractors.map((contractor) {
      final lat = contractor['latitude'] as double?;
      final lon = contractor['longitude'] as double?;
      if (lat == null || lon == null) return null;

      return ContractorMapMarker.create(
        position: LatLng(lat, lon),
        contractorId: contractor['id'] ?? '',
        businessName: contractor['business_name'] ?? 'Unknown',
        rating: contractor['rating_avg'] != null
            ? double.tryParse(contractor['rating_avg'].toString())
            : null,
        onTap: () {
          setState(() {
            _selectedContractorId = contractor['id'];
            _selectedContractor = contractor;
          });
        },
      );
    }).whereType<Marker>().toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Find Contractors'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.green,
      ),
      body: Stack(
        children: [
          MapWidget(
            center: _userLocation,
            zoom: 13.0,
            markers: _buildMarkers(),
          ),
          if (_selectedContractor != null)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: ContractorMapCard(
                businessName: _selectedContractor['business_name'] ?? 'Unknown',
                description: _selectedContractor['description'],
                rating: _selectedContractor['rating_avg'] != null
                    ? double.tryParse(_selectedContractor['rating_avg'].toString())
                    : null,
                ratingCount: _selectedContractor['rating_count'] ?? 0,
                baseRate: _selectedContractor['base_rate_per_hour'] != null
                    ? double.tryParse(_selectedContractor['base_rate_per_hour'].toString())
                    : null,
                serviceTypes: List<String>.from(
                  _selectedContractor['service_types'] ?? [],
                ),
                onViewDetails: () {
                  // Navigate to contractor detail screen
                  Navigator.pop(context, _selectedContractor);
                },
                onClose: () {
                  setState(() {
                    _selectedContractor = null;
                    _selectedContractorId = null;
                  });
                },
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

