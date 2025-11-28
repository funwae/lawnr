import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class ReviewScreen extends StatefulWidget {
  final String jobId;
  final String contractorId;

  const ReviewScreen({
    super.key,
    required this.jobId,
    required this.contractorId,
  });

  @override
  State<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends State<ReviewScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiService = ApiService();
  final _reviewTextController = TextEditingController();

  int _rating = 0;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _reviewTextController.dispose();
    super.dispose();
  }

  Future<void> _submitReview() async {
    if (_rating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a rating')),
      );
      return;
    }

    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await _apiService.createReview(
        jobId: widget.jobId,
        rating: _rating,
        reviewText: _reviewTextController.text.trim().isEmpty
            ? null
            : _reviewTextController.text.trim(),
      );

      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Review submitted! Thank you.'),
            backgroundColor: Color(0xFF00FF00),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error submitting review: $e')),
      );
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Leave a Review'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'How was your experience?',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 24),

              // Star rating
              Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    final starIndex = index + 1;
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _rating = starIndex;
                        });
                      },
                      child: Icon(
                        starIndex <= _rating ? Icons.star : Icons.star_border,
                        size: 48,
                        color: starIndex <= _rating
                            ? const Color(0xFF00FF00)
                            : Colors.grey,
                      ),
                    );
                  }),
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  _rating == 0
                      ? 'Tap to rate'
                      : _rating == 1
                          ? 'Poor'
                          : _rating == 2
                              ? 'Fair'
                              : _rating == 3
                                  ? 'Good'
                                  : _rating == 4
                                      ? 'Very Good'
                                      : 'Excellent',
                  style: TextStyle(
                    fontSize: 16,
                    color: _rating == 0 ? Colors.grey : const Color(0xFF00FF00),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // Review text
              const Text(
                'Tell us more (Optional)',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _reviewTextController,
                maxLines: 6,
                decoration: const InputDecoration(
                  hintText: 'Share your experience...',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  // Optional field, no validation needed
                  return null;
                },
              ),

              const SizedBox(height: 32),

              // Submit button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitReview,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Submit Review'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

