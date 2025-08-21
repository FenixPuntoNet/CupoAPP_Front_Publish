package com.cupo.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.microsoft.clarity.Clarity;
import com.microsoft.clarity.ClarityConfig;
import com.microsoft.clarity.models.LogLevel;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Initialize Microsoft Clarity
        ClarityConfig config = new ClarityConfig("syggw2wqqd");
        config.setLogLevel(LogLevel.None); // Use LogLevel.Verbose while testing to debug initialization issues
        Clarity.initialize(getApplicationContext(), config);
    }
}
