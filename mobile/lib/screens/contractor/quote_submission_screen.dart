import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class QuoteSubmissionScreen extends StatefulWidget {
  final String requestId;

  const QuoteSubmissionScreen({
    super.key,
    required this.requestId,
  });

  @override
  State<QuoteSubmissionScreen> createState() => _QuoteSubmissionScreenState();
}

class _QuoteSubmissionScreenState extends State<QuoteSubmissionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiService = ApiService();
  final _priceController = TextEditingController();
  final _hoursController = TextEditingController();
  final _materialsController = TextEditingController();
  final _extrasController = TextEditingController();

  bool _isSubmitting = false;

  @override
  void dispose() {
    _priceController.dispose();
    _hoursController.dispose();
    _materialsController.dispose();
    _extrasController.dispose();
    super.dispose();
  }

  Future<void> _submitQuote() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final breakdown = {
        'hours': double.tryParse(_hoursController.text) ?? 0,
        'materials': double.tryParse(_materialsController.text) ?? 0,
        'extras': double.tryParse(_extrasController.text) ?? 0,
      };

      await _apiService.submitQuote(
        requestId: widget.requestId,
        quotedPrice: double.parse(_priceController.text),
        breakdown: breakdown,
      );

      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Quote submitted successfully!'),
            backgroundColor: Color(0xFF00FF00),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error submitting quote: $e')),
      );
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  void _calculateTotal() {
    final hours = double.tryParse(_hoursController.text) ?? 0;
    final materials = double.tryParse(_materialsController.text) ?? 0;
    final extras = double.tryParse(_extrasController.text) ?? 0;

    // Simple calculation - in production, use contractor's base rate
    final estimatedTotal = (hours * 50) + materials + extras;

    if (estimatedTotal > 0 && _priceController.text.isEmpty) {
      setState(() {
        _priceController.text = estimatedTotal.toStringAsFixed(2);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Submit Quote'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Quote Details',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 24),

              // Total price
              TextFormField(
                controller: _priceController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Total Price *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.attach_money),
                  prefixText: '\$',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Price is required';
                  }
                  final price = double.tryParse(value);
                  if (price == null || price <= 0) {
                    return 'Please enter a valid price';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),

              // Breakdown (optional)
              const Text(
                'Breakdown (Optional)',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Help the homeowner understand your pricing',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _hoursController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Estimated Hours',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.access_time),
                ),
                onChanged: (_) => _calculateTotal(),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _materialsController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Materials Cost',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.attach_money),
                  prefixText: '\$',
                ),
                onChanged: (_) => _calculateTotal(),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _extrasController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Extras/Additional Services',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.add_circle),
                  prefixText: '\$',
                ),
                onChanged: (_) => _calculateTotal(),
              ),

              const SizedBox(height: 32),

              // Submit button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitQuote,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Submit Quote'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

