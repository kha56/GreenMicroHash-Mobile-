import React from 'react';
import { View, Text } from 'react-native';
import { Wallet, TrendingUp, Zap } from 'lucide-react-native';

interface RewardsSectionProps {
  currentBalance: number;
  currentBalanceUsd: number;
  todayReward: number;
  todayRewardUsd: number;
  est24hReward: number;
  est24hRewardUsd: number;
}

export default function RewardsSection({
  currentBalance,
  currentBalanceUsd,
  todayReward,
  todayRewardUsd,
  est24hReward,
  est24hRewardUsd,
}: RewardsSectionProps) {
  return (
    <View className="px-4 py-4">
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-white text-sm font-semibold">Rewards</Text>
      </View>
      
      {/* Main Balance Card */}
      <View className="bg-gradient-to-br from-gmh-purple/20 to-gmh-lime/10 border border-gmh-purple/30 rounded-2xl p-4 mb-3">
        <View className="flex-row items-center gap-2 mb-2">
          <View className="w-8 h-8 rounded-full bg-gmh-purple/30 items-center justify-center">
            <Wallet size={16} color="#A78BFA" />
          </View>
          <Text className="text-gmh-slate text-xs">Current Balance</Text>
        </View>
        <Text className="text-white text-2xl font-bold mb-1">
          ₿ {currentBalance.toFixed(6)}
        </Text>
        <Text className="text-gmh-lime text-sm font-medium">
          ≈ ${currentBalanceUsd.toFixed(2)} USD
        </Text>
      </View>
      
      {/* Two Column Stats */}
      <View className="flex-row gap-3">
        {/* Today's Reward */}
        <View className="flex-1 bg-gmh-card border border-gmh-border rounded-xl p-3">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="w-6 h-6 rounded-lg bg-gmh-lime/20 items-center justify-center">
              <TrendingUp size={12} color="#84CC16" />
            </View>
            <Text className="text-gmh-slate text-[10px]">Today</Text>
          </View>
          <Text className="text-white text-base font-bold">
            ₿ {todayReward.toFixed(6)}
          </Text>
          <Text className="text-gmh-lime text-xs">${todayRewardUsd.toFixed(2)}</Text>
        </View>
        
        {/* Est 24h Reward */}
        <View className="flex-1 bg-gmh-card border border-gmh-border rounded-xl p-3">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="w-6 h-6 rounded-lg bg-gmh-purple/20 items-center justify-center">
              <Zap size={12} color="#A78BFA" />
            </View>
            <Text className="text-gmh-slate text-[10px]">Est. 24h</Text>
          </View>
          <Text className="text-white text-base font-bold">
            ₿ {est24hReward.toFixed(6)}
          </Text>
          <Text className="text-gmh-purple-light text-xs">${est24hRewardUsd.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}
