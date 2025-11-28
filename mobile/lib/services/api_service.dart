import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:3000/api';

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  Future<Map<String, String>> _getHeaders({bool includeAuth = true}) async {
    final headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      final token = await _getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  Future<Map<String, dynamic>> _handleResponse(http.Response response) async {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return json.decode(response.body);
    } else {
      final error = json.decode(response.body);
      throw Exception(error['error']?['message'] ?? 'Request failed');
    }
  }

  // Auth endpoints
  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String fullName,
    String? phoneNumber,
    required String role,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: await _getHeaders(includeAuth: false),
      body: json.encode({
        'email': email,
        'password': password,
        'full_name': fullName,
        'phone_number': phoneNumber,
        'role': role,
      }),
    );

    final data = await _handleResponse(response);

    // Store token
    if (data['token'] != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', data['token']);
      await prefs.setString('user_id', data['user']['id']);
      await prefs.setString('user_role', data['user']['role']);
    }

    return data;
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/forgot-password'),
      headers: await _getHeaders(includeAuth: false),
      body: json.encode({'email': email}),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/reset-password'),
      headers: await _getHeaders(includeAuth: false),
      body: json.encode({
        'token': token,
        'new_password': newPassword,
      }),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: await _getHeaders(includeAuth: false),
      body: json.encode({
        'email': email,
        'password': password,
      }),
    );

    final data = await _handleResponse(response);

    // Store token
    if (data['token'] != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', data['token']);
      await prefs.setString('user_id', data['user']['id']);
      await prefs.setString('user_role', data['user']['role']);
    }

    return data;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_id');
    await prefs.remove('user_role');
  }

  // Property endpoints
  Future<Map<String, dynamic>> createProperty(Map<String, dynamic> propertyData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/properties'),
      headers: await _getHeaders(),
      body: json.encode(propertyData),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getProperties() async {
    final response = await http.get(
      Uri.parse('$baseUrl/properties'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getProperty(String propertyId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/properties/$propertyId'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getPropertyMedia(String propertyId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/properties/$propertyId/media'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  // Service Request endpoints
  Future<Map<String, dynamic>> createServiceRequest(Map<String, dynamic> requestData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/requests'),
      headers: await _getHeaders(),
      body: json.encode(requestData),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getServiceRequests() async {
    final response = await http.get(
      Uri.parse('$baseUrl/requests'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getServiceRequest(String requestId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/requests/$requestId'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> acceptQuote(
    String requestId,
    String quoteId,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/requests/$requestId/accept-quote/$quoteId'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  // Contractor endpoints
  Future<Map<String, dynamic>> searchContractors({
    List<String>? serviceTypes,
    double? lat,
    double? lon,
    double? radiusKm,
    double? minRating,
  }) async {
    final uri = Uri.parse('$baseUrl/contractors/search').replace(
      queryParameters: {
        if (serviceTypes != null) 'service_types': serviceTypes.join(','),
        if (lat != null) 'lat': lat.toString(),
        if (lon != null) 'lon': lon.toString(),
        if (radiusKm != null) 'radius_km': radiusKm.toString(),
        if (minRating != null) 'min_rating': minRating.toString(),
      },
    );

    final response = await http.get(
      uri,
      headers: await _getHeaders(includeAuth: false),
    );
    return _handleResponse(response);
  }

  // Job endpoints
  Future<Map<String, dynamic>> getJobs({String? status}) async {
    final queryParams = status != null ? '?status=$status' : '';
    final response = await http.get(
      Uri.parse('$baseUrl/jobs$queryParams'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> optimizeRoute({
    required List<String> jobIds,
    int? startIndex,
    bool? use2Opt,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/routes/optimize'),
      headers: await _getHeaders(),
      body: json.encode({
        'job_ids': jobIds,
        if (startIndex != null) 'start_index': startIndex,
        if (use2Opt != null) 'use_2opt': use2Opt,
      }),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getJob(String jobId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/jobs/$jobId'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> updateJobStatus(String jobId, String status, {
    List<String>? afterMedia,
    Map<String, dynamic>? costLog,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/jobs/$jobId/$status'),
      headers: await _getHeaders(),
      body: json.encode({
        if (afterMedia != null) 'after_media': afterMedia,
        if (costLog != null) 'cost_log': costLog,
      }),
    );
    return _handleResponse(response);
  }

  // Notification endpoints
  Future<Map<String, dynamic>> getNotifications({bool unreadOnly = false}) async {
    final uri = Uri.parse('$baseUrl/notifications').replace(
      queryParameters: {
        if (unreadOnly) 'unread_only': 'true',
      },
    );
    final response = await http.get(uri, headers: await _getHeaders());
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getUnreadNotificationCount() async {
    final response = await http.get(
      Uri.parse('$baseUrl/notifications/unread/count'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> markNotificationAsRead(String notificationId) async {
    final response = await http.put(
      Uri.parse('$baseUrl/notifications/$notificationId/read'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> markAllNotificationsAsRead() async {
    final response = await http.put(
      Uri.parse('$baseUrl/notifications/read/all'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> registerFCMToken(String token) async {
    final response = await http.post(
      Uri.parse('$baseUrl/notifications/fcm-token'),
      headers: await _getHeaders(),
      body: json.encode({'fcm_token': token}),
    );
    return _handleResponse(response);
  }

  // Payment endpoints
  Future<Map<String, dynamic>> processPayment({
    required String jobId,
    required String paymentToken,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/payments'),
      headers: await _getHeaders(),
      body: json.encode({
        'job_id': jobId,
        'payment_method': 'card',
        'payment_token': paymentToken,
      }),
    );
    return _handleResponse(response);
  }

  // Review endpoints
  Future<Map<String, dynamic>> createReview({
    required String jobId,
    required int rating,
    String? reviewText,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/reviews/jobs/$jobId'),
      headers: await _getHeaders(),
      body: json.encode({
        'rating': rating,
        'review_text': reviewText,
      }),
    );
    return _handleResponse(response);
  }

  // Contractor endpoints
  Future<Map<String, dynamic>> createContractorProfile(
    Map<String, dynamic> profileData,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/contractors/profile'),
      headers: await _getHeaders(),
      body: json.encode(profileData),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getAvailableRequests() async {
    final response = await http.get(
      Uri.parse('$baseUrl/requests/available/list'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> submitQuote({
    required String requestId,
    required double quotedPrice,
    Map<String, dynamic>? breakdown,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/requests/$requestId/quote'),
      headers: await _getHeaders(),
      body: json.encode({
        'quoted_price': quotedPrice,
        'breakdown': breakdown,
      }),
    );
    return _handleResponse(response);
  }

  // Subscription endpoints
  Future<Map<String, dynamic>> createSubscription(Map<String, dynamic> subscriptionData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/subscriptions'),
      headers: await _getHeaders(),
      body: json.encode(subscriptionData),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getSubscriptions() async {
    final response = await http.get(
      Uri.parse('$baseUrl/subscriptions'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getSubscription(String subscriptionId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/subscriptions/$subscriptionId'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> pauseSubscription(String subscriptionId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/subscriptions/$subscriptionId/pause'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> resumeSubscription(String subscriptionId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/subscriptions/$subscriptionId/resume'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> cancelSubscription(String subscriptionId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/subscriptions/$subscriptionId/cancel'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  // Expense endpoints
  Future<Map<String, dynamic>> createExpense(Map<String, dynamic> expenseData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/expenses'),
      headers: await _getHeaders(),
      body: json.encode(expenseData),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getExpenses({
    String? startDate,
    String? endDate,
    String? expenseType,
    String? jobId,
  }) async {
    final queryParams = <String, String>{};
    if (startDate != null) queryParams['start_date'] = startDate;
    if (endDate != null) queryParams['end_date'] = endDate;
    if (expenseType != null) queryParams['expense_type'] = expenseType;
    if (jobId != null) queryParams['job_id'] = jobId;

    final uri = Uri.parse('$baseUrl/expenses').replace(queryParameters: queryParams);
    final response = await http.get(uri, headers: await _getHeaders());
    return _handleResponse(response);
  }

  // Analytics endpoints
  Future<Map<String, dynamic>> getAnalytics(String startDate, String endDate) async {
    final response = await http.get(
      Uri.parse('$baseUrl/analytics?start_date=$startDate&end_date=$endDate'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getTopClients({int limit = 10}) async {
    final response = await http.get(
      Uri.parse('$baseUrl/analytics/top-clients?limit=$limit'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getRevenueTrends({
    String period = 'monthly',
    int months = 6,
  }) async {
    final response = await http.get(
      Uri.parse('$baseUrl/analytics/revenue-trends?period=$period&months=$months'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  // Referral endpoints
  Future<Map<String, dynamic>> getMyReferralCode() async {
    final response = await http.get(
      Uri.parse('$baseUrl/referrals/my-code'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getMyReferrals() async {
    final response = await http.get(
      Uri.parse('$baseUrl/referrals/my-referrals'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> applyReferralCode(String code) async {
    final response = await http.post(
      Uri.parse('$baseUrl/referrals/apply'),
      headers: await _getHeaders(),
      body: json.encode({'referral_code': code}),
    );
    return _handleResponse(response);
  }

  // Promotion endpoints
  Future<Map<String, dynamic>> validatePromotionCode({
    required String code,
    double? orderValue,
    List<String>? serviceTypes,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/promotions/validate'),
      headers: await _getHeaders(),
      body: json.encode({
        'code': code,
        'order_value': orderValue,
        'service_types': serviceTypes,
      }),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getPromotionCodes() async {
    final response = await http.get(
      Uri.parse('$baseUrl/promotions'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  // Dispute endpoints
  Future<Map<String, dynamic>> createDispute({
    required String jobId,
    required String disputeType,
    required String description,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/disputes'),
      headers: await _getHeaders(),
      body: json.encode({
        'job_id': jobId,
        'dispute_type': disputeType,
        'description': description,
      }),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getDisputes() async {
    final response = await http.get(
      Uri.parse('$baseUrl/disputes'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<String> exportRevenueCSV(String startDate, String endDate) async {
    final response = await http.get(
      Uri.parse('$baseUrl/analytics/export/revenue?start_date=$startDate&end_date=$endDate'),
      headers: await _getHeaders(),
    );
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response.body;
    } else {
      throw Exception('Failed to export revenue CSV');
    }
  }

  Future<String> exportExpensesCSV(String startDate, String endDate) async {
    final response = await http.get(
      Uri.parse('$baseUrl/analytics/export/expenses?start_date=$startDate&end_date=$endDate'),
      headers: await _getHeaders(),
    );
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response.body;
    } else {
      throw Exception('Failed to export expenses CSV');
    }
  }

  // Notification preferences
  Future<Map<String, dynamic>> getNotificationPreferences() async {
    final response = await http.get(
      Uri.parse('$baseUrl/notification-preferences'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> updateNotificationPreferences(
    Map<String, dynamic> preferences,
  ) async {
    final response = await http.put(
      Uri.parse('$baseUrl/notification-preferences'),
      headers: await _getHeaders(),
      body: json.encode(preferences),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getTicketMessages(String ticketId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/messages/ticket/$ticketId'),
      headers: await _getHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> sendMessage({
    required String ticketId,
    required String messageText,
    String? mediaUrl,
    String? messageType,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/messages'),
      headers: await _getHeaders(),
      body: json.encode({
        'ticket_id': ticketId,
        'message_text': messageText,
        if (mediaUrl != null) 'media_url': mediaUrl,
        if (messageType != null) 'message_type': messageType,
      }),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getFAQs([String query = '']) async {
    final response = await http.get(
      Uri.parse('$baseUrl/faqs$query'),
      headers: await _getHeaders(includeAuth: false),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getFAQsCategories() async {
    final response = await http.get(
      Uri.parse('$baseUrl/faqs/categories'),
      headers: await _getHeaders(includeAuth: false),
    );
    return _handleResponse(response);
  }
}

