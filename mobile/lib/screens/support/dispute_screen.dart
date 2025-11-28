import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../components/media_upload_widget.dart';

class DisputeScreen extends StatefulWidget {
  final String jobId;

  const DisputeScreen({super.key, required this.jobId});

  @override
  State<DisputeScreen> createState() => _DisputeScreenState();
}

class _DisputeScreenState extends State<DisputeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiService = ApiService();
  final _descriptionController = TextEditingController();

  String _disputeType = 'payment';
  bool _isSubmitting = false;
  List<String> _evidenceUrls = [];

  final List<Map<String, String>> _disputeTypes = [
    {'value': 'payment', 'label': 'Payment Issue'},
    {'value': 'quality', 'label': 'Quality Issue'},
    {'value': 'cancellation', 'label': 'Cancellation Dispute'},
    {'value': 'other', 'label': 'Other'},
  ];

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submitDispute() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await _apiService.createDispute(
        jobId: widget.jobId,
        disputeType: _disputeType,
        description: _descriptionController.text.trim(),
      );

      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Dispute submitted. Our team will review it shortly.'),
            backgroundColor: Color(0xFF00FF00),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error submitting dispute: $e')),
      );
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('File a Dispute'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Dispute Type *',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              ..._disputeTypes.map((type) {
                return RadioListTile<String>(
                  title: Text(type['label']!),
                  value: type['value']!,
                  groupValue: _disputeType,
                  onChanged: (value) {
                    setState(() {
                      _disputeType = value!;
                    });
                  },
                );
              }),
              const SizedBox(height: 24),

              TextFormField(
                controller: _descriptionController,
                maxLines: 6,
                decoration: const InputDecoration(
                  labelText: 'Description *',
                  hintText: 'Please describe the issue in detail...',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.description),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please provide a description';
                  }
                  if (value.length < 20) {
                    return 'Please provide more details (at least 20 characters)';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),

              const Text(
                'Evidence (Optional)',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Upload photos or documents to support your dispute',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
              const SizedBox(height: 16),

              // Note: Evidence upload would be handled separately after dispute creation
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Evidence can be added after submitting the dispute',
                  style: TextStyle(color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
              ),

              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitDispute,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Submit Dispute'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

