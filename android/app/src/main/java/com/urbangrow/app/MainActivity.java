package com.urbangrow.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
    
    @Override
    public void onStart() {
        super.onStart();
        
        // Enable WebXR after activity starts
        enableWebXR();
    }
    
    private void enableWebXR() {
        try {
            // Wait for bridge to be ready
            if (getBridge() != null) {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    // Enable necessary WebView settings for WebXR
                    webView.getSettings().setJavaScriptEnabled(true);
                    webView.getSettings().setDomStorageEnabled(true);
                    webView.getSettings().setAllowFileAccess(true);
                    webView.getSettings().setAllowContentAccess(true);
                    
                    // Set WebViewClient to handle navigation
                    webView.setWebViewClient(new WebViewClient());
                    
                    // The WebXR polyfill in index.html will handle the rest
                }
            }
        } catch (Exception e) {
            // Silently handle errors - polyfill will still work
        }
    }
}
