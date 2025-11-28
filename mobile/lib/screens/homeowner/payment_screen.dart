import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class PaymentScreen extends StatefulWidget {
  final String jobId;
  final double amount;

  const PaymentScreen({
    super.key,
    required this.jobId,
    required this.amount,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiService = ApiService();
  final _cardNumberController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvvController = TextEditingController();
  final _nameController = TextEditingController();

  bool _isProcessing = false;
  bool _saveCard = false;

  @override
  void dispose() {
    _cardNumberController.dispose();
    _expiryController.dispose();
    _cvvController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _processPayment() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isProcessing = true);

    try {
      // In production, use Stripe tokenization
      // For now, we'll simulate payment processing
      final response = await _apiService.processPayment(
        jobId: widget.jobId,
        paymentToken: 'tok_test_123', // Would be real token from Stripe
      );

      if (mounted) {
        Navigator.pop(context, response);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment processed successfully!'),
            backgroundColor: Color(0xFF00FF00),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Payment failed: $e')),
      );
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  String _formatCardNumber(String input) {
    // Format as XXXX XXXX XXXX XXXX
    final cleaned = input.replaceAll(RegExp(r'[^\d]'), '');
    final buffer = StringBuffer();
    for (int i = 0; i < cleaned.length; i++) {
      if (i > 0 && i % 4 == 0) {
        buffer.write(' ');
      }
      buffer.write(cleaned[i]);
    }
    return buffer.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Amount display
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF00FF00).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    const Text(
                      'Total Amount',
                      style: TextStyle(color: Colors.grey),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '\$${widget.amount.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00FF00),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Card details
              const Text(
                'Card Information',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _cardNumberController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Card Number',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.credit_card),
                  hintText: '1234 5678 9012 3456',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Card number is required';
                  }
                  final cleaned = value.replaceAll(RegExp(r'[^\d]'), '');
                  if (cleaned.length < 13 || cleaned.length > 19) {
                    return 'Invalid card number';
                  }
                  return null;
                },
                onChanged: (value) {
                  final formatted = _formatCardNumber(value);
                  if (formatted != value) {
                    _cardNumberController.value = TextEditingValue(
                      text: formatted,
                      selection: TextSelection.collapsed(
                        offset: formatted.length,
                      ),
                    );
                  }
                },
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _expiryController,
                      decoration: const InputDecoration(
                        labelText: 'MM/YY',
                        border: OutlineInputBorder(),
                        hintText: '12/25',
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Required';
                        }
                        if (!RegExp(r'^\d{2}/\d{2}$').hasMatch(value)) {
                          return 'Invalid format';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _cvvController,
                      keyboardType: TextInputType.number,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'CVV',
                        border: OutlineInputBorder(),
                        hintText: '123',
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Required';
                        }
                        if (value.length < 3 || value.length > 4) {
                          return 'Invalid CVV';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Cardholder Name',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Name is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              CheckboxListTile(
                value: _saveCard,
                onChanged: (value) {
                  setState(() {
                    _saveCard = value ?? false;
                  });
                },
                title: const Text('Save card for future payments'),
                controlAffinity: ListTileControlAffinity.leading,
              ),

              const SizedBox(height: 32),

              // Security notice
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.lock, color: Colors.blue),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Your payment is secure and encrypted.',
                        style: TextStyle(color: Colors.blue.shade700),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Pay button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isProcessing ? null : _processPayment,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isProcessing
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text('Pay \$${widget.amount.toStringAsFixed(2)}'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

