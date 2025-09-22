import { Expo } from "expo-server-sdk";

// Create an Expo client
let expo = new Expo();

// Send notification function
export async function sendNotification(pushToken, message) {
  try {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error("Invalid Expo push token:", pushToken);
      return;
    }

    // Build the message
    let messages = [
      {
        to: pushToken,
        sound: "default",
        body: message,
        data: { extra: "data" },
      },
    ];

    // Send it
    let ticketChunk = await expo.sendPushNotificationsAsync(messages);
    console.log("Notification sent:", ticketChunk);
  } catch (err) {
    console.error("Error sending notification:", err);
  }
}
