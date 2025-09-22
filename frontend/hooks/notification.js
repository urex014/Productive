import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useEffect } from "react";

async function registerForPushNotificationsAsync() {
    const BASE_URL = "http://192.168.100.30:5000";

  if (!Device.isDevice) {
    alert("Push notifications only work on a physical device");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Failed to get push token!");
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("Expo Push Token:", token);

  return token;
}

export default function App() {
  useEffect(() => {
    (async () => {
      const token = await registerForPushNotificationsAsync();

      if (token) {
        // Send to your backend
        await fetch(`${BASE_URL}/api/users/push-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`, // your auth
          },
          body: JSON.stringify({ expoPushToken: token }),
        });
      }
    })();
  }, []);

  return null;
}
