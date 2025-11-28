import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:image_picker/image_picker.dart';
import 'package:http_parser/http_parser.dart';

class MediaService {
  static const String baseUrl = 'http://localhost:3000/api';

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  Future<Map<String, String>> _getHeaders({bool includeAuth = true}) async {
    final headers = <String, String>{};

    if (includeAuth) {
      final token = await _getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  /// Upload property media (photo or video)
  Future<Map<String, dynamic>> uploadPropertyMedia({
    required String propertyId,
    required File file,
  }) async {
    final uri = Uri.parse('$baseUrl/media/properties/$propertyId');
    final token = await _getToken();

    if (token == null) {
      throw Exception('Not authenticated');
    }

    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $token';

    // Determine file type
    final fileExtension = file.path.split('.').last.toLowerCase();
    final isImage = ['jpg', 'jpeg', 'png', 'gif'].contains(fileExtension);
    final contentType = isImage
        ? MediaType('image', fileExtension)
        : MediaType('video', fileExtension);

    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        file.path,
        contentType: contentType,
      ),
    );

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return json.decode(response.body);
    } else {
      final error = json.decode(response.body);
      throw Exception(error['error']?['message'] ?? 'Upload failed');
    }
  }

  /// Upload job media (before or after)
  Future<Map<String, dynamic>> uploadJobMedia({
    required String jobId,
    required File file,
    required String type, // 'before' or 'after'
  }) async {
    final uri = Uri.parse('$baseUrl/media/jobs/$jobId');
    final token = await _getToken();

    if (token == null) {
      throw Exception('Not authenticated');
    }

    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $token';

    // Add type field
    request.fields['type'] = type;

    // Determine file type
    final fileExtension = file.path.split('.').last.toLowerCase();
    final isImage = ['jpg', 'jpeg', 'png', 'gif'].contains(fileExtension);
    final contentType = isImage
        ? MediaType('image', fileExtension)
        : MediaType('video', fileExtension);

    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        file.path,
        contentType: contentType,
      ),
    );

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return json.decode(response.body);
    } else {
      final error = json.decode(response.body);
      throw Exception(error['error']?['message'] ?? 'Upload failed');
    }
  }

  /// Upload contractor portfolio image
  Future<Map<String, dynamic>> uploadContractorPortfolio({
    required File file,
  }) async {
    final uri = Uri.parse('$baseUrl/media/contractors/portfolio');
    final token = await _getToken();

    if (token == null) {
      throw Exception('Not authenticated');
    }

    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $token';

    final fileExtension = file.path.split('.').last.toLowerCase();
    final contentType = MediaType('image', fileExtension);

    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        file.path,
        contentType: contentType,
      ),
    );

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return json.decode(response.body);
    } else {
      final error = json.decode(response.body);
      throw Exception(error['error']?['message'] ?? 'Upload failed');
    }
  }

  /// Pick image from gallery or camera
  Future<File?> pickImage({ImageSource source = ImageSource.gallery}) async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: source);

    if (pickedFile != null) {
      return File(pickedFile.path);
    }
    return null;
  }

  /// Pick video from gallery
  Future<File?> pickVideo() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickVideo(source: ImageSource.gallery);

    if (pickedFile != null) {
      return File(pickedFile.path);
    }
    return null;
  }
}

