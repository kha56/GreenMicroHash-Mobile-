import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Activity, Cpu, TrendingUp, BarChart3 } from 'lucide-react-native';

interface PoolStatisticsProps {
  poolHashrate: number;
  poolHashrateUnit: string;
  activeWorkers: number;
  difficulty?: number;
  blockHeight?: number;
}

export default function PoolStatistics({ 
  poolHashrate, 
  poolHashrateUnit,
  activeWorkers,
  difficulty = 92.67,
  blockHeight = 879234
}: PoolStatisticsProps) {
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };
  
  return (
    <View className="px-4 py-4 border-t border-gmh-border bg-gmh-dark-secondary">
      <View className="mb-4">
        <Text className="text-white text-sm font-medium">Network Stats</Text>
        <Text className="text-gmh-slate text-xs">Bitcoin network overview</Text>
      </View>
      
      <View className="flex-row flex-wrap gap-3">
        <View className="flex-1 min-w-[45%] bg-gmh-card border border-gmh-border rounded-lg p-3">
          <View className="flex-row items-center gap-2 mb-1">
            <Activity size={14} color="#84CC16" />
            <Text className="text-gmh-slate text-[10px]">Pool Hashrate</Text>
          </View>
          <Text className="text-white text-lg font-bold">
            {poolHashrate} {poolHashrateUnit}
          </Text>
        </View>
        
        <View className="flex-1 min-w-[45%] bg-gmh-card border border-gmh-border rounded-lg p-3">
          <View className="flex-row items-center gap-2 mb-1">
            <Cpu size={14} color="#84CC16" />
            <Text className="text-gmh-slate text-[10px]">Active Workers</Text>
          </View>
          <Text className="text-white text-lg font-bold">
            {formatNumber(activeWorkers)}
          </Text>
        </View>
        
        <View className="flex-1 min-w-[45%] bg-gmh-card border border-gmh-border rounded-lg p-3">
          <View className="flex-row items-center gap-2 mb-1">
            <TrendingUp size={14} color="#F59E0B" />
            <Text className="text-gmh-slate text-[10px]">Difficulty (T)</Text>
          </View>
          <Text className="text-white text-lg font-bold">
            {difficulty.toFixed(2)}
          </Text>
        </View>
        
        <View className="flex-1 min-w-[45%] bg-gmh-card border border-gmh-border rounded-lg p-3">
          <View className="flex-row items-center gap-2 mb-1">
            <BarChart3 size={14} color="#3B82F6" />
            <Text className="text-gmh-slate text-[10px]">Block Height</Text>
          </View>
          <Text className="text-white text-lg font-bold">
            {formatNumber(blockHeight)}
          </Text>
        </View>
      </View>
    </View>
  );
}
