import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthService extends ChangeNotifier {
  String? _token;
  String? _userId;
  String? _userRole;
  bool _isLoading = false;

  String? get token => _token;
  String? get userId => _userId;
  String? get userRole => _userRole;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _token != null;

  final ApiService _apiService = ApiService();

  AuthService() {
    _loadAuthState();
  }

  Future<void> _loadAuthState() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _userId = prefs.getString('user_id');
    _userRole = prefs.getString('user_role');
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.login(email: email, password: password);
      _token = response['token'];
      _userId = response['user']['id'];
      _userRole = response['user']['role'];

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String fullName,
    String? phoneNumber,
    required String role,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.register(
        email: email,
        password: password,
        fullName: fullName,
        phoneNumber: phoneNumber,
        role: role,
      );
      _token = response['token'];
      _userId = response['user']['id'];
      _userRole = response['user']['role'];

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _apiService.logout();
    _token = null;
    _userId = null;
    _userRole = null;
    notifyListeners();
  }
}

