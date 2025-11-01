package com.urbangrow.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    private static final String TAG = "MainActivity";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
    
    @Override
    public void onStart() {
        super.onStart();
    }
    
    @Override
    public void onResume() {
        super.onResume();
        
        // Configure WebView settings after bridge is fully initialized
        // Use a handler to ensure bridge is ready
        new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override
            public void run() {
                configureWebView();
            }
        }, 500); // Delay to ensure bridge is ready
    }
    
    private void configureWebView() {
        try {
            if (getBridge() != null) {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    // Capacitor already enables JavaScript, but we ensure these are set
                    webView.getSettings().setDomStorageEnabled(true);
                    webView.getSettings().setAllowFileAccess(true);
                    webView.getSettings().setAllowContentAccess(true);
                    webView.getSettings().setAllowUniversalAccessFromFileURLs(true);
                    webView.getSettings().setAllowFileAccessFromFileURLs(true);
                    
                    // DO NOT override WebViewClient - Capacitor handles this internally
                    // Setting a new WebViewClient breaks Capacitor's navigation
                    
                    Log.d(TAG, "WebView configured successfully");
                } else {
                    Log.w(TAG, "WebView is null, retrying...");
                    // Retry once more if WebView isn't ready
                    new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            configureWebView();
                        }
                    }, 1000);
                }
            } else {
                Log.w(TAG, "Bridge is null, retrying...");
                // Retry once more if bridge isn't ready
                new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        configureWebView();
                    }
                }, 1000);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error configuring WebView: " + e.getMessage(), e);
            // Don't crash the app, WebXR polyfill will still work
        }
    }
}
