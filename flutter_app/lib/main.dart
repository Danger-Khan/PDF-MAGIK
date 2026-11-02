import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

void main() {
  runApp(const PdfMagikApp());
}

/// Thin Flutter/Kotlin shell around the existing PDF Magik web app.
///
/// The app itself (React/TypeScript, built with Vite) is unchanged and
/// bundled as a Flutter asset under assets/web/ — this just displays it in a
/// WebView. No native rewrite, no network calls added: everything the web
/// build already does locally in the browser still happens locally here.
class PdfMagikApp extends StatelessWidget {
  const PdfMagikApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PDF Magik',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(useMaterial3: true),
      home: const PdfMagikWebView(),
    );
  }
}

class PdfMagikWebView extends StatefulWidget {
  const PdfMagikWebView({super.key});

  @override
  State<PdfMagikWebView> createState() => _PdfMagikWebViewState();
}

class _PdfMagikWebViewState extends State<PdfMagikWebView> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFF4F7F8))
      ..loadFlutterAsset('assets/web/index.html');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: WebViewWidget(controller: _controller),
      ),
    );
  }
}
