# Zimbra Vulnerability PoC

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start both servers:

**Terminal 1:**
```bash
node server.js
```

**Terminal 2:**
```bash
python server.py
```

3. Run the exploit:
   - Go to a Zimbra webmail instance
   - Open browser console (F12)
   - Copy and paste the contents of `script.js`
   - Execute the script

The exploit will capture authentication tokens and credentials, sending them to the Python server for logging.