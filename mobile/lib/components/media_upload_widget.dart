import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/media_service.dart';

class MediaUploadWidget extends StatefulWidget {
  final Function(List<String>)? onMediaSelected;
  final bool allowVideo;
  final int maxFiles;
  final String? propertyId;
  final String? jobId;
  final String? mediaType; // 'before' or 'after' for jobs

  const MediaUploadWidget({
    super.key,
    this.onMediaSelected,
    this.allowVideo = true,
    this.maxFiles = 5,
    this.propertyId,
    this.jobId,
    this.mediaType,
  }) : assert(
          (propertyId != null) || (jobId != null && mediaType != null),
          'Either propertyId or (jobId and mediaType) must be provided',
        );

  @override
  State<MediaUploadWidget> createState() => _MediaUploadWidgetState();
}

class _MediaUploadWidgetState extends State<MediaUploadWidget> {
  final MediaService _mediaService = MediaService();
  final List<File> _selectedFiles = [];
  final List<String> _uploadedUrls = [];
  bool _isUploading = false;
  double? _uploadProgress;

  Future<void> _pickImage(ImageSource source) async {
    if (_selectedFiles.length >= widget.maxFiles) {
      _showSnackBar('Maximum ${widget.maxFiles} files allowed');
      return;
    }

    final file = await _mediaService.pickImage(source: source);
    if (file != null) {
      setState(() {
        _selectedFiles.add(file);
      });
    }
  }

  Future<void> _pickVideo() async {
    if (_selectedFiles.length >= widget.maxFiles) {
      _showSnackBar('Maximum ${widget.maxFiles} files allowed');
      return;
    }

    final file = await _mediaService.pickVideo();
    if (file != null) {
      setState(() {
        _selectedFiles.add(file);
      });
    }
  }

  Future<void> _uploadFiles() async {
    if (_selectedFiles.isEmpty) return;

    setState(() {
      _isUploading = true;
      _uploadProgress = 0.0;
    });

    try {
      for (int i = 0; i < _selectedFiles.length; i++) {
        final file = _selectedFiles[i];
        Map<String, dynamic> result;

        if (widget.propertyId != null) {
          result = await _mediaService.uploadPropertyMedia(
            propertyId: widget.propertyId!,
            file: file,
          );
        } else if (widget.jobId != null && widget.mediaType != null) {
          result = await _mediaService.uploadJobMedia(
            jobId: widget.jobId!,
            file: file,
            type: widget.mediaType!,
          );
        } else {
          throw Exception('Property ID or Job ID required');
        }

        _uploadedUrls.add(result['media']['url']);

        setState(() {
          _uploadProgress = (i + 1) / _selectedFiles.length;
        });
      }

      if (widget.onMediaSelected != null) {
        widget.onMediaSelected!(_uploadedUrls);
      }

      setState(() {
        _selectedFiles.clear();
        _isUploading = false;
        _uploadProgress = null;
      });

      _showSnackBar('Files uploaded successfully');
    } catch (e) {
      setState(() {
        _isUploading = false;
        _uploadProgress = null;
      });
      _showSnackBar('Upload failed: ${e.toString()}');
    }
  }

  void _removeFile(int index) {
    setState(() {
      _selectedFiles.removeAt(index);
    });
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Selected files preview
        if (_selectedFiles.isNotEmpty)
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _selectedFiles.length,
              itemBuilder: (context, index) {
                final file = _selectedFiles[index];
                final isImage = file.path.toLowerCase().endsWith('.jpg') ||
                    file.path.toLowerCase().endsWith('.jpeg') ||
                    file.path.toLowerCase().endsWith('.png') ||
                    file.path.toLowerCase().endsWith('.gif');

                return Container(
                  margin: const EdgeInsets.only(right: 8),
                  width: 100,
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: isImage
                            ? Image.file(
                                file,
                                fit: BoxFit.cover,
                                width: 100,
                                height: 100,
                              )
                            : const Icon(
                                Icons.videocam,
                                size: 50,
                                color: Colors.white,
                              ),
                      ),
                      Positioned(
                        top: 4,
                        right: 4,
                        child: GestureDetector(
                          onTap: () => _removeFile(index),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.close,
                              size: 16,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

        const SizedBox(height: 16),

        // Upload buttons
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _isUploading ? null : () => _pickImage(ImageSource.gallery),
                icon: const Icon(Icons.photo_library),
                label: const Text('Gallery'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _isUploading ? null : () => _pickImage(ImageSource.camera),
                icon: const Icon(Icons.camera_alt),
                label: const Text('Camera'),
              ),
            ),
            if (widget.allowVideo) ...[
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _isUploading ? null : _pickVideo,
                  icon: const Icon(Icons.videocam),
                  label: const Text('Video'),
                ),
              ),
            ],
          ],
        ),

        // Upload button
        if (_selectedFiles.isNotEmpty) ...[
          const SizedBox(height: 16),
          if (_isUploading)
            Column(
              children: [
                LinearProgressIndicator(value: _uploadProgress),
                const SizedBox(height: 8),
                Text(
                  'Uploading... ${((_uploadProgress ?? 0) * 100).toInt()}%',
                  style: const TextStyle(color: Colors.grey),
                ),
              ],
            )
          else
            ElevatedButton(
              onPressed: _uploadFiles,
              child: const Text('Upload Files'),
            ),
        ],
      ],
    );
  }
}

