import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Activity, Clock, TrendingUp, BarChart3 } from 'lucide-react-native';

interface PoolStatisticsProps {
  poolHashrate: number;
  poolHashrateUnit: string;
  halvingBlocksRemaining: number;
  difficulty?: number;
  blockHeight?: number;
}

export default function PoolStatistics({ 
  poolHashrate, 
  poolHashrateUnit,
  halvingBlocksRemaining,
  difficulty = 0,
  blockHeight = 0
}: PoolStatisticsProps) {
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };
  
  const formatHashrate = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(2);
    }
    return num.toFixed(2);
  };
  
  // Calculate estimated time to halving (avg 10 min per block)
  const formatHalvingCountdown = (blocks: number) => {
    const minutes = blocks * 10;
    const days = Math.floor(minutes / (60 * 24));
    if (days > 365) {
      const years = (days / 365).toFixed(1);
      return `~${years} years`;
    }
    return `~${days} days`;
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
            <Text className="text-gmh-slate text-[10px]">Network Hashrate</Text>
          </View>
          <Text className="text-white text-lg font-bold">
            {formatHashrate(poolHashrate)} {poolHashrateUnit}
          </Text>
        </View>
        
        <View className="flex-1 min-w-[45%] bg-gmh-card border border-gmh-border rounded-lg p-3">
          <View className="flex-row items-center gap-2 mb-1">
            <Clock size={14} color="#A78BFA" />
            <Text className="text-gmh-slate text-[10px]">Halving Countdown</Text>
          </View>
          <Text className="text-white text-lg font-bold">
            {formatNumber(halvingBlocksRemaining)} blocks
          </Text>
          <Text className="text-gmh-slate text-[10px]">
            {formatHalvingCountdown(halvingBlocksRemaining)}
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
