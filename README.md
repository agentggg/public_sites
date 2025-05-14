# 🗑️ Account Deletion Page

This HTML page provides a dynamic, app-aware interface for users to **securely delete their account** from any of the following apps built by **Tech & Faith**:

- RAW
- Revealed Mysteries
- All Nations

The page allows users to verify their identity, confirms deletion with a warning, and sends the deactivation request to the appropriate backend service.

---

## 🧠 Features

- 🔐 **Identity Verification** before deletion
- ⚠️ **Final confirmation** step with warning
- 🧹 **Removes personal data** (name, email, phone, activity)
- 🔒 **Retains minimal logs** for 30 days only if needed for legal or operational purposes
- ✅ GDPR & CCPA compliant
- 📧 Dynamic contact info display
- 🎯 App-specific logic using query param (`?app=raw`, `?app=revealed`, or `?app=allnation`)

---

## 🔗 Supported Backends

| App        | Login Verification Endpoint                                       | Deactivate Endpoint                                         |
|------------|-------------------------------------------------------------------|-------------------------------------------------------------|
| RAW        | `https://raw-agentofgod.pythonanywhere.com/login_verification`   | `https://raw-agentofgod.pythonanywhere.com/deactivate`      |
| Revealed   | `https://revealed-agentofgod.pythonanywhere.com/login_verification` | `https://revealed-agentofgod.pythonanywhere.com/deactivate` |
| All Nation | `https://allnations-agentofgod.pythonanywhere.com/login_verification` | `https://allnations-agentofgod.pythonanywhere.com/deactivate` |

---

## 🚀 Usage

1. Host the `deletion.html` file on a public domain or internal service.
2. Append the `app` query parameter to determine which app the page is handling:

```bash
https://yourdomain.com/deletion.html?app=raw
https://yourdomain.com/deletion.html?app=revealed
https://yourdomain.com/deletion.html?app=allnation
```

3. The page will:
   - Automatically update the UI with the app name
   - Send login verification to the correct endpoint
   - Handle final deletion and show confirmation screen

---

## 🔐 Security Notes

- Password is sent only over HTTPS to the backend
- Username is stored temporarily for deletion request only
- Page validates the user before deletion can proceed
- Final confirmation screen must be clicked before any action is taken

---

## 📄 Deletion Summary

### ✅ Data Deleted
- Personal info (name, email, phone)
- Preferences and settings
- Activity logs and usage data

### ⚠️ Data Retained
- Anonymized records or logs may be retained for **up to 30 days** for:
  - Legal compliance
  - Abuse prevention
  - Operational diagnostics

---

## 📬 Support

Users can contact the support team at:

```
tech.and.faith.contact@gmail.com
```

This is displayed dynamically on the form based on the app being used.

---

## 📜 Legal Disclaimer

This deletion form complies with major data protection regulations:

- **GDPR**
- **CCPA**
- **Google Play Account Deletion Policies**

By submitting the form, users confirm they understand this action is final and irreversible. Tech & Faith assumes no responsibility for deleted data or loss of service once deletion is confirmed.

---

## 🎨 Customization

You can modify:

- CSS variables (e.g., `--primary`, `--danger`, `--bg`, etc.)
- Contact email
- Supported apps by editing the `loginEndpoints` and `deactivateEndpoints` in the script

---

## 🧩 Related Files

- `deletion.html`: The main HTML UI file
- `public_sites/`: Folder where the deletion page and other public utilities are stored

---

## 🔗 Related Resources

- [RAW App](https://github.com/agentggg/RAW-APP)
- [Revealed Mysteries App](https://github.com/agentggg/Revealed-App)
- [All Nations App](https://github.com/agentggg/All-Nation-App)

---

## 📁 Additional Files

### `event.ics`
A calendar invite file for the RAW Lounge event.

- **Summary:** RAW Lounge Night
- **Start:** July 19, 2025, 7:00 PM (America/New_York)
- **End:** July 19, 2025, 11:00 PM
- **Location:** Antioch Winder
- **Description:** A chill night of music, food, and fun for believers.
- **Reminders:**
  - 7 days before
  - 3 days before
  - Same day

This file is referenced by the event landing page (`calendar-link`) for download and import into users' calendar apps.

---

### `event_info.json`
This JSON file holds dynamic event metadata for the flyer page. It defines:

- Title, subtitle
- Location, date, time
- Event image
- Calendar link (`ics`)
- YouTube or video redirect
- Theme and color configuration

Used by the flyer UI (`flyer.html` or equivalent) to populate details dynamically on load.

---

## Links
- **events:** https://agentggg.github.io/public_sites/event.html
- **events:** https://agentggg.github.io/public_sites/deletion?app=raw