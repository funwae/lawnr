import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

class MediaGalleryWidget extends StatelessWidget {
  final List<String> mediaUrls;
  final List<String>? thumbnailUrls;
  final String? title;

  const MediaGalleryWidget({
    super.key,
    required this.mediaUrls,
    this.thumbnailUrls,
    this.title,
  });

  @override
  Widget build(BuildContext context) {
    if (mediaUrls.isEmpty) {
      return const Center(
        child: Text(
          'No media available',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) ...[
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              title!,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 4,
            mainAxisSpacing: 4,
          ),
          itemCount: mediaUrls.length,
          itemBuilder: (context, index) {
            final url = mediaUrls[index];
            final thumbnailUrl = thumbnailUrls != null && index < thumbnailUrls!.length
                ? thumbnailUrls![index]
                : null;

            return GestureDetector(
              onTap: () => _showFullScreen(context, url, index),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(
                    color: const Color(0xFF00FF00),
                    width: 2,
                  ),
                ),
                child: CachedNetworkImage(
                  imageUrl: thumbnailUrl ?? url,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => const Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFF00FF00),
                    ),
                  ),
                  errorWidget: (context, url, error) => const Icon(
                    Icons.error,
                    color: Colors.red,
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  void _showFullScreen(BuildContext context, String url, int initialIndex) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => _FullScreenGallery(
          mediaUrls: mediaUrls,
          initialIndex: initialIndex,
        ),
      ),
    );
  }
}

class _FullScreenGallery extends StatefulWidget {
  final List<String> mediaUrls;
  final int initialIndex;

  const _FullScreenGallery({
    required this.mediaUrls,
    required this.initialIndex,
  });

  @override
  State<_FullScreenGallery> createState() => _FullScreenGalleryState();
}

class _FullScreenGalleryState extends State<_FullScreenGallery> {
  late PageController _pageController;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          '${_currentIndex + 1} / ${widget.mediaUrls.length}',
          style: const TextStyle(color: Colors.white),
        ),
      ),
      body: PageView.builder(
        controller: _pageController,
        itemCount: widget.mediaUrls.length,
        onPageChanged: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        itemBuilder: (context, index) {
          return Center(
            child: CachedNetworkImage(
              imageUrl: widget.mediaUrls[index],
              fit: BoxFit.contain,
              placeholder: (context, url) => const CircularProgressIndicator(
                color: Color(0xFF00FF00),
              ),
              errorWidget: (context, url, error) => const Icon(
                Icons.error,
                color: Colors.red,
                size: 50,
              ),
            ),
          );
        },
      ),
    );
  }
}

