import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface BraiinsWorker {
  worker_name: string;
  hashrate_5m: number;
  hashrate_1h: number;
  hashrate_24h: number;
  last_share: string;
  state: string;
}

interface ActiveMachinesProps {
  workers: BraiinsWorker[];
  isInitialLoading?: boolean;
  onSeeFullList?: () => void;
}

export default function ActiveMachines({
  workers,
  isInitialLoading,
  onSeeFullList,
}: ActiveMachinesProps) {
  // Get the first 3 workers to display as a sample
  const displayWorkers = workers.slice(0, 3);

  return (
    <View className="px-4 py-4 border-t border-gmh-border">
      <View className="mb-3">
        <Text className="text-white text-sm font-medium">Overview</Text>
      </View>
      {/* Table Header */}
      <View className="flex-row mb-2 pb-2 border-b border-gmh-border/50">
        <Text className="flex-1 text-gmh-slate text-xs">Worker Name</Text>
        <Text className="w-16 text-gmh-slate text-xs text-center">Status</Text>
        <Text className="w-24 text-gmh-slate text-xs text-right">Hashrate</Text>
      </View>
      {/* Loading State - only show on initial load */}
      {isInitialLoading && workers.length === 0 && (
        <View className="py-4">
          <Text className="text-gmh-slate text-sm text-center">
            Loading workers...
          </Text>
        </View>
      )}
      {/* No Workers State */}
      {!isInitialLoading && workers.length === 0 && (
        <View className="py-4">
          <Text className="text-gmh-slate text-sm text-center">
            No workers found
          </Text>
        </View>
      )}
      {/* Worker Rows */}
      {displayWorkers.map((worker, index) => {
        // Convert hashrate from Gh/s to TH/s (divide by 1000)
        const hashrateInTH = worker.hashrate_5m / 1000;
        // Worker is active if it has hashrate > 0 OR state is ok/alive
        const isActive =
          hashrateInTH > 0 || worker.state === "ok" || worker.state === "alive";

        return (
          <View
            key={worker.worker_name}
            className={`flex-row py-2.5 items-center ${index < displayWorkers.length - 1 ? "border-b border-gmh-border/30" : ""}`}
          >
            <Text
              className="flex-1 text-white text-sm font-mono"
              numberOfLines={1}
            >
              {worker.worker_name}
            </Text>
            <View className="w-16 items-center">
              <View
                className={`px-2 py-0.5 rounded-full ${isActive ? "bg-gmh-lime/20" : "bg-red-500/20"}`}
              >
                <Text
                  className={`text-xs ${isActive ? "text-gmh-lime" : "text-red-400"}`}
                >
                  {isActive ? "Active" : "Offline"}
                </Text>
              </View>
            </View>
            <View className="w-24 items-end">
              {hashrateInTH > 0 ? (
                <Text className="text-gmh-lime text-sm font-medium">
                  {hashrateInTH.toFixed(2)} TH/s
                </Text>
              ) : (
                <Text className="text-gmh-slate text-sm">-</Text>
              )}
            </View>
          </View>
        );
      })}
      {/* See Full List */}
      {workers.length > 3 && (
        <TouchableOpacity onPress={onSeeFullList} className="mt-3 items-end">
          <Text className="text-gmh-lime text-sm font-medium">
            See full list ({workers.length} workers)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
