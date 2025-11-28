import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../services/api_service.dart';
import '../../components/media_gallery_widget.dart';

class PropertyDetailScreen extends StatefulWidget {
  final String propertyId;

  const PropertyDetailScreen({
    super.key,
    required this.propertyId,
  });

  @override
  State<PropertyDetailScreen> createState() => _PropertyDetailScreenState();
}

class _PropertyDetailScreenState extends State<PropertyDetailScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _property;
  List<dynamic> _media = [];
  bool _isLoading = true;
  GoogleMapController? _mapController;

  @override
  void initState() {
    super.initState();
    _loadProperty();
    _loadMedia();
  }

  Future<void> _loadProperty() async {
    try {
      final response = await _apiService.getProperty(widget.propertyId);
      setState(() {
        _property = response['property'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading property: $e')),
        );
      }
    }
  }

  Future<void> _loadMedia() async {
    try {
      final response = await _apiService.getPropertyMedia(widget.propertyId);
      setState(() {
        _media = response['media'] ?? [];
      });
    } catch (e) {
      print('Error loading media: $e');
    }
  }

  String _formatAddress() {
    if (_property == null) return '';
    final parts = <String>[];
    if (_property!['address_line1'] != null) {
      parts.add(_property!['address_line1']);
    }
    if (_property!['address_line2'] != null) {
      parts.add(_property!['address_line2']);
    }
    if (_property!['city'] != null) parts.add(_property!['city']);
    if (_property!['province'] != null) parts.add(_property!['province']);
    if (_property!['postal_code'] != null) parts.add(_property!['postal_code']);
    return parts.join(', ');
  }

  LatLng? _getLocation() {
    if (_property == null || _property!['geo_location'] == null) {
      return null;
    }
    // Parse geo_location (format depends on how it's stored)
    // Assuming it's stored as POINT(lon lat) in PostGIS
    // For now, return null if we can't parse it
    return null; // TODO: Parse geo_location properly
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_property == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Property')),
        body: const Center(child: Text('Property not found')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Property Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              // TODO: Navigate to edit screen
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Address
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.home, size: 32, color: Color(0xFF00FF00)),
                  const SizedBox(height: 8),
                  Text(
                    _formatAddress(),
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (_property!['postal_code'] != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      _property!['postal_code'],
                      style: const TextStyle(color: Colors.grey),
                    ),
                  ],
                ],
              ),
            ),

            // Map view (if location available)
            if (_getLocation() != null)
              SizedBox(
                height: 200,
                child: GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: _getLocation()!,
                    zoom: 15,
                  ),
                  onMapCreated: (controller) {
                    _mapController = controller;
                  },
                  markers: {
                    Marker(
                      markerId: const MarkerId('property'),
                      position: _getLocation()!,
                    ),
                  },
                ),
              ),

            // Yard info
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_property!['yard_size_estimate'] != null) ...[
                    Row(
                      children: [
                        const Icon(Icons.landscape, color: Color(0xFF00FF00)),
                        const SizedBox(width: 8),
                        Text(
                          'Yard Size: ${_property!['yard_size_estimate'].toString().toUpperCase()}',
                          style: const TextStyle(fontSize: 16),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                  ],
                  if (_property!['yard_notes'] != null) ...[
                    const Text(
                      'Notes:',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _property!['yard_notes'],
                      style: const TextStyle(color: Colors.grey),
                    ),
                    const SizedBox(height: 16),
                  ],
                ],
              ),
            ),

            // Media gallery
            if (_media.isNotEmpty) ...[
              const Divider(),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: MediaGalleryWidget(
                  mediaUrls: _media.map((m) => m['media_url'] as String).toList(),
                  title: 'Property Photos',
                ),
              ),
            ],

            // Action buttons
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  ElevatedButton.icon(
                    onPressed: () {
                      // TODO: Navigate to service request
                    },
                    icon: const Icon(Icons.add_task),
                    label: const Text('Request Service'),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: () {
                      // TODO: Navigate to add media
                    },
                    icon: const Icon(Icons.add_photo_alternate),
                    label: const Text('Add Photos/Video'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

