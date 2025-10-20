import * as React from 'react';
import { View, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const data = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      data: [400, 450, 420, 480, 500, 530],
      color: (opacity = 1) => `rgba(34,197,94, ${opacity})`, // green line
      strokeWidth: 2
    }
  ],
  // You can add legends etc if you want
};

const MyLineChart = () => {
  return (
    <View>
      <LineChart
        data={data}
        width={screenWidth - 40}
        height={220}
        chartConfig={{
          backgroundColor: "#000",
          backgroundGradientFrom: "#000",
          backgroundGradientTo: "#000",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(34,197,94, ${opacity})`,
          labelColor: () => "#aaa",
        }}
        style={{
          borderRadius: 16,
        }}
        bezier
      />
    </View>
  );
};

export default MyLineChart;
