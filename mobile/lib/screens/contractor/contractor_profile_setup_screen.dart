import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../components/media_upload_widget.dart';

class ContractorProfileSetupScreen extends StatefulWidget {
  const ContractorProfileSetupScreen({super.key});

  @override
  State<ContractorProfileSetupScreen> createState() => _ContractorProfileSetupScreenState();
}

class _ContractorProfileSetupScreenState extends State<ContractorProfileSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiService = ApiService();
  final _businessNameController = TextEditingController();
  final _descriptionController = TextEditingController();

  final List<String> _availableServices = [
    'mowing',
    'hedge_trimming',
    'cleanup',
    'fertilizing',
    'edging',
    'mulching',
  ];

  final Set<String> _selectedServices = {};
  double? _baseRatePerHour;
  Map<String, double> _perServiceRates = {};
  double? _serviceRadius;
  double? _latitude;
  double? _longitude;
  bool _isLoading = false;

  @override
  void dispose() {
    _businessNameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submitProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedServices.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one service')),
      );
      return;
    }

    if (_latitude == null || _longitude == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please set your service area')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final profileData = {
        'business_name': _businessNameController.text.trim(),
        'description': _descriptionController.text.trim(),
        'service_types': _selectedServices.toList(),
        'service_area': {
          'center': {'lat': _latitude, 'lon': _longitude},
          'radius_km': _serviceRadius ?? 20,
        },
        'base_rate_per_hour': _baseRatePerHour,
        'per_service_rate': _perServiceRates,
      };

      await _apiService.createContractorProfile(profileData);

      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile created successfully!'),
            backgroundColor: Color(0xFF00FF00),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error creating profile: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Setup Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Business name
              TextFormField(
                controller: _businessNameController,
                decoration: const InputDecoration(
                  labelText: 'Business Name *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.business),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Business name is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Description
              TextFormField(
                controller: _descriptionController,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Description *',
                  hintText: 'Tell customers about your services...',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.description),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Description is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),

              // Service types
              const Text(
                'Services Offered *',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _availableServices.map((service) {
                  final isSelected = _selectedServices.contains(service);
                  return FilterChip(
                    label: Text(service.replaceAll('_', ' ').toUpperCase()),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        if (selected) {
                          _selectedServices.add(service);
                        } else {
                          _selectedServices.remove(service);
                          _perServiceRates.remove(service);
                        }
                      });
                    },
                    selectedColor: const Color(0xFF00FF00).withOpacity(0.3),
                    checkmarkColor: const Color(0xFF00FF00),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),

              // Service area
              const Text(
                'Service Area *',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Radius (km)',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.place),
                      ),
                      onChanged: (value) {
                        setState(() {
                          _serviceRadius = double.tryParse(value);
                        });
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        // TODO: Open map to select center point
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Map selection coming soon'),
                          ),
                        );
                      },
                      icon: const Icon(Icons.map),
                      label: const Text('Set Location'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Base rate
              TextFormField(
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Base Rate Per Hour (Optional)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.attach_money),
                  prefixText: '\$',
                ),
                onChanged: (value) {
                  setState(() {
                    _baseRatePerHour = double.tryParse(value);
                  });
                },
              ),
              const SizedBox(height: 24),

              // Per-service rates
              if (_selectedServices.isNotEmpty) ...[
                const Text(
                  'Per-Service Rates (Optional)',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                ..._selectedServices.map((service) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: TextFormField(
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: '${service.replaceAll('_', ' ').toUpperCase()} Rate',
                        border: const OutlineInputBorder(),
                        prefixIcon: const Icon(Icons.attach_money),
                        prefixText: '\$',
                      ),
                      onChanged: (value) {
                        setState(() {
                          final rate = double.tryParse(value);
                          if (rate != null) {
                            _perServiceRates[service] = rate;
                          } else {
                            _perServiceRates.remove(service);
                          }
                        });
                      },
                    ),
                  );
                }).toList(),
                const SizedBox(height: 16),
              ],

              const SizedBox(height: 32),

              // Submit button
              ElevatedButton(
                onPressed: _isLoading ? null : _submitProfile,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Create Profile'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

