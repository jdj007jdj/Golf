#!/bin/bash

echo "================================================"
echo "    Verifying App Signatures"
echo "================================================"
echo

# Check if APKs exist
PHONE_APK="app/build/outputs/apk/debug/app-debug.apk"
WEAR_APK="wear/build/outputs/apk/debug/wear-debug.apk"

if [ ! -f "$PHONE_APK" ]; then
    echo "❌ Phone APK not found at $PHONE_APK"
    exit 1
fi

if [ ! -f "$WEAR_APK" ]; then
    echo "❌ Wear APK not found at $WEAR_APK"
    exit 1
fi

echo "📱 Phone App Signature:"
echo "----------------------"
keytool -list -printcert -jarfile "$PHONE_APK" 2>/dev/null | grep -E "Owner:|SHA256:"

echo
echo "⌚ Wear App Signature:"
echo "---------------------"
keytool -list -printcert -jarfile "$WEAR_APK" 2>/dev/null | grep -E "Owner:|SHA256:"

echo
echo "🔍 Checking if signatures match..."
echo

PHONE_SHA=$(keytool -list -printcert -jarfile "$PHONE_APK" 2>/dev/null | grep "SHA256:" | head -1)
WEAR_SHA=$(keytool -list -printcert -jarfile "$WEAR_APK" 2>/dev/null | grep "SHA256:" | head -1)

if [ "$PHONE_SHA" = "$WEAR_SHA" ]; then
    echo "✅ SIGNATURES MATCH! Apps are signed with the same certificate."
else
    echo "❌ SIGNATURES DO NOT MATCH!"
    echo "   This is why messages cannot be delivered."
    echo "   Both apps MUST be signed with the same keystore."
fi

echo
echo "================================================"