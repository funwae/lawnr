import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import '../../components/media_upload_widget.dart';
import '../../services/api_service.dart';

class AddPropertyScreen extends StatefulWidget {
  const AddPropertyScreen({super.key});

  @override
  State<AddPropertyScreen> createState() => _AddPropertyScreenState();
}

class _AddPropertyScreenState extends State<AddPropertyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiService = ApiService();
  final _addressLine1Controller = TextEditingController();
  final _addressLine2Controller = TextEditingController();
  final _cityController = TextEditingController();
  final _provinceController = TextEditingController();
  final _postalCodeController = TextEditingController();
  final _yardNotesController = TextEditingController();

  String? _yardSize;
  double? _latitude;
  double? _longitude;
  bool _isLoading = false;
  bool _isGeocoding = false;
  List<String> _uploadedMediaUrls = [];

  final List<String> _yardSizes = ['small', 'medium', 'large', 'other'];

  @override
  void dispose() {
    _addressLine1Controller.dispose();
    _addressLine2Controller.dispose();
    _cityController.dispose();
    _provinceController.dispose();
    _postalCodeController.dispose();
    _yardNotesController.dispose();
    super.dispose();
  }

  Future<void> _geocodeAddress() async {
    if (_addressLine1Controller.text.isEmpty ||
        _cityController.text.isEmpty ||
        _provinceController.text.isEmpty) {
      return;
    }

    setState(() => _isGeocoding = true);

    try {
      final address = '${_addressLine1Controller.text}, ${_cityController.text}, ${_provinceController.text}';
      final locations = await locationFromAddress(address);

      if (locations.isNotEmpty) {
        setState(() {
          _latitude = locations.first.latitude;
          _longitude = locations.first.longitude;
        });
        _showSnackBar('Location found');
      }
    } catch (e) {
      _showSnackBar('Could not find location. Please check address.');
    } finally {
      setState(() => _isGeocoding = false);
    }
  }

  Future<void> _useCurrentLocation() async {
    setState(() => _isGeocoding = true);

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _showSnackBar('Location services are disabled');
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _showSnackBar('Location permissions denied');
          return;
        }
      }

      Position position = await Geolocator.getCurrentPosition();

      // Reverse geocode to get address
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        final place = placemarks.first;
        setState(() {
          _latitude = position.latitude;
          _longitude = position.longitude;
          _addressLine1Controller.text = '${place.street ?? ''}';
          _cityController.text = place.locality ?? '';
          _provinceController.text = place.administrativeArea ?? '';
          _postalCodeController.text = place.postalCode ?? '';
        });
        _showSnackBar('Location set');
      }
    } catch (e) {
      _showSnackBar('Error getting location: $e');
    } finally {
      setState(() => _isGeocoding = false);
    }
  }

  Future<void> _submitProperty() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_latitude == null || _longitude == null) {
      _showSnackBar('Please set location for the property');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final propertyData = {
        'address': {
          'line1': _addressLine1Controller.text.trim(),
          'line2': _addressLine2Controller.text.trim().isEmpty
              ? null
              : _addressLine2Controller.text.trim(),
          'city': _cityController.text.trim(),
          'province': _provinceController.text.trim(),
          'postal_code': _postalCodeController.text.trim(),
          'country': 'Canada',
        },
        'geo_location': {
          'lat': _latitude,
          'lon': _longitude,
        },
        'yard_size_estimate': _yardSize,
        'yard_notes': _yardNotesController.text.trim().isEmpty
            ? null
            : _yardNotesController.text.trim(),
      };

      final response = await _apiService.createProperty(propertyData);
      final propertyId = response['property']['id'];

      // Upload media if any
      // Note: Media upload would be handled separately after property creation
      // For now, we'll just show success

      if (mounted) {
        Navigator.pop(context, response['property']);
        _showSnackBar('Property added successfully');
      }
    } catch (e) {
      _showSnackBar('Error adding property: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFF00FF00),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Property'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Address fields
              TextFormField(
                controller: _addressLine1Controller,
                decoration: const InputDecoration(
                  labelText: 'Address Line 1 *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.home),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter address';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _addressLine2Controller,
                decoration: const InputDecoration(
                  labelText: 'Address Line 2 (Optional)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _cityController,
                      decoration: const InputDecoration(
                        labelText: 'City *',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Required';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _provinceController,
                      decoration: const InputDecoration(
                        labelText: 'Province *',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Required';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _postalCodeController,
                decoration: const InputDecoration(
                  labelText: 'Postal Code',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 24),

              // Location buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _isGeocoding ? null : _geocodeAddress,
                      icon: _isGeocoding
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.search),
                      label: const Text('Find Location'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _isGeocoding ? null : _useCurrentLocation,
                      icon: const Icon(Icons.my_location),
                      label: const Text('Use Current'),
                    ),
                  ),
                ],
              ),

              if (_latitude != null && _longitude != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    'Location: ${_latitude!.toStringAsFixed(6)}, ${_longitude!.toStringAsFixed(6)}',
                    style: const TextStyle(color: Color(0xFF00FF00), fontSize: 12),
                  ),
                ),

              const SizedBox(height: 24),

              // Yard size
              DropdownButtonFormField<String>(
                value: _yardSize,
                decoration: const InputDecoration(
                  labelText: 'Yard Size Estimate',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.landscape),
                ),
                items: _yardSizes.map((size) {
                  return DropdownMenuItem(
                    value: size,
                    child: Text(size[0].toUpperCase() + size.substring(1)),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _yardSize = value;
                  });
                },
              ),
              const SizedBox(height: 16),

              // Yard notes
              TextFormField(
                controller: _yardNotesController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Yard Notes (Optional)',
                  hintText: 'Gate code, pets, special instructions...',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.note),
                ),
              ),
              const SizedBox(height: 24),

              // Media upload section
              const Text(
                'Property Photos/Video (Optional)',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Upload photos or a video tour of your yard to help contractors provide accurate quotes.',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
              const SizedBox(height: 16),

              // Note: Media upload widget would be integrated here
              // For now, we'll add it after property creation

              const SizedBox(height: 32),

              // Submit button
              ElevatedButton(
                onPressed: _isLoading ? null : _submitProperty,
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Add Property'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

