import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { RefreshCw } from "lucide-react-native";

interface HashrateDisplayProps {
  hashrate: number | null;
  unit: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function HashrateDisplay({
  hashrate,
  unit,
  onRefresh,
  isRefreshing,
}: HashrateDisplayProps) {
  const isInitialLoading = hashrate === null;
  const displayHashrate =
    typeof hashrate === "number" && !isNaN(hashrate) ? hashrate : 0;

  return (
    <View className="px-4 py-4">
      <View className="flex-row items-center justify-between mb-1">
        <View>
          <Text className="text-white text-sm font-medium">Overview</Text>
          <Text className="text-gmh-slate text-xs">Total Hashrate</Text>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          className="p-2"
          disabled={isRefreshing}
        >
          <RefreshCw
            size={18}
            color="#64748B"
            style={
              isRefreshing ? { transform: [{ rotate: "45deg" }] } : undefined
            }
          />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-baseline mt-2">
        <Text className="text-gmh-lime text-4xl font-bold tracking-tight">
          {isInitialLoading ? "Loading..." : displayHashrate.toFixed(1)}
        </Text>
        {!isInitialLoading && (
          <Text className="text-gmh-lime text-xl ml-2 font-medium">{unit}</Text>
        )}
      </View>
    </View>
  );
}
