# Backend Updates for Live Activities

## Overview
There are 3 ways to update Live Activities:

### 1. From the App (Local)
```typescript
// Update locally from React Native
await updateLiveActivity(activityId, 'New message from app');
```

### 2. From Backend (Remote Push)
Your backend sends push notifications to update the Live Activity remotely.

### 3. Background Fetch
App fetches data and updates locally.

---

## Backend Implementation (Option 2)

### Step 1: Get Push Token from App
```typescript
const result = await startLiveActivity('Initial message');
console.log('Push Token:', result.pushToken);

// Send this push token to your backend
await fetch('https://your-api.com/live-activity/register', {
  method: 'POST',
  body: JSON.stringify({
    activityId: result.activityId,
    pushToken: result.pushToken,
    userId: currentUser.id
  })
});
```

### Step 2: Backend Sends Push Notification

#### Node.js Example (using apn)
```javascript
const apn = require('apn');

// Configure APNs
const options = {
  token: {
    key: './AuthKey_XXXXXXXXXX.p8',  // Your APNs auth key
    keyId: 'XXXXXXXXXX',              // Key ID
    teamId: 'XXXXXXXXXX'              // Team ID
  },
  production: false  // Use true for production
};

const apnProvider = new apn.Provider(options);

// Send update to Live Activity
async function updateLiveActivity(pushToken, newMessage) {
  const notification = new apn.Notification();

  notification.topic = 'com.shapeShift.shapeShift.push-type.liveactivity';
  notification.pushType = 'liveactivity';
  notification.payload = {
    aps: {
      timestamp: Math.floor(Date.now() / 1000),
      event: 'update',
      'content-state': {
        message: newMessage
      }
    }
  };

  const result = await apnProvider.send(notification, pushToken);
  console.log('APNs result:', result);
}

// Example: Update when price changes
async function onPriceChange(userId, asset, newPrice) {
  const pushToken = await db.getUserLiveActivityToken(userId);
  if (pushToken) {
    await updateLiveActivity(
      pushToken,
      `${asset} price: $${newPrice}`
    );
  }
}
```

#### Python Example (using aioapns)
```python
from aioapns import APNs, NotificationRequest

async def update_live_activity(push_token: str, new_message: str):
    apns = APNs(
        key_path='./AuthKey_XXXXXXXXXX.p8',
        key_id='XXXXXXXXXX',
        team_id='XXXXXXXXXX',
        topic='com.shapeShift.shapeShift.push-type.liveactivity',
        use_sandbox=True
    )

    request = NotificationRequest(
        device_token=push_token,
        message={
            'aps': {
                'timestamp': int(time.time()),
                'event': 'update',
                'content-state': {
                    'message': new_message
                }
            }
        }
    )

    await apns.send_notification(request)

# Example: WebSocket updates
async def on_websocket_message(user_id, data):
    push_token = await get_user_push_token(user_id)
    if push_token:
        await update_live_activity(
            push_token,
            f"New transaction: {data['amount']} {data['asset']}"
        )
```

#### cURL Example (for testing)
```bash
# Get JWT token first
JWT_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const fs = require('fs');
const key = fs.readFileSync('./AuthKey_XXXXXXXXXX.p8');
const token = jwt.sign({}, key, {
  algorithm: 'ES256',
  keyid: 'XXXXXXXXXX',
  issuer: 'XXXXXXXXXX'
});
console.log(token);
")

# Send push notification
curl -v \
  -H "authorization: bearer $JWT_TOKEN" \
  -H "apns-push-type: liveactivity" \
  -H "apns-topic: com.shapeShift.shapeShift.push-type.liveactivity" \
  --http2 \
  -d '{
    "aps": {
      "timestamp": '$(date +%s)',
      "event": "update",
      "content-state": {
        "message": "Updated from backend via cURL!"
      }
    }
  }' \
  https://api.sandbox.push.apple.com:443/3/device/YOUR_PUSH_TOKEN_HERE
```

---

## Data Structure

### ContentState (what you can update)
```swift
// In iOS code (already defined)
struct ContentState: Codable, Hashable {
    var message: String
    // Add more fields as needed:
    // var price: Double
    // var asset: String
    // var timestamp: Date
}
```

### Push Payload Format
```json
{
  "aps": {
    "timestamp": 1234567890,
    "event": "update",
    "content-state": {
      "message": "Your custom message here"
    }
  }
}
```

---

## Real-World Use Cases

### 1. **Crypto Price Updates**
```typescript
// App
const result = await startLiveActivity('BTC: $45,000');

// Backend (on price change)
await updateLiveActivity(pushToken, 'BTC: $46,200 📈');
```

### 2. **Transaction Status**
```typescript
// App
const result = await startLiveActivity('Sending transaction...');

// Backend (on confirmation)
await updateLiveActivity(pushToken, 'Transaction confirmed! ✅');
```

### 3. **DEX Swap Progress**
```typescript
// App
const result = await startLiveActivity('Swapping ETH → USDC');

// Backend updates
await updateLiveActivity(pushToken, 'Waiting for approval...');
// ... later ...
await updateLiveActivity(pushToken, 'Swap complete! 🎉');
```

---

## Frequency Limits

- **Budget-based**: iOS gives you a limited budget for updates
- **Recommended**: Max 1-2 updates per minute
- **Best practice**: Only send updates when data actually changes

---

## Testing

1. **Local test** (from app):
```typescript
const result = await startLiveActivity('Test message');
await new Promise(resolve => setTimeout(resolve, 3000));
await updateLiveActivity(result.activityId, 'Updated locally!');
```

2. **Backend test**: Use the cURL example above with your push token

3. **Monitor logs**: Check Xcode console for `[Live Activity]` logs

---

## APNs Setup Required

1. Create an **APNs Auth Key** in Apple Developer Portal
2. Download the `.p8` file
3. Note your **Key ID** and **Team ID**
4. Add to your backend configuration

---

## Security Notes

- **Never expose** your `.p8` key file
- **Store push tokens securely** in your database
- **Validate** push token before sending
- **Rate limit** backend updates to prevent abuse
