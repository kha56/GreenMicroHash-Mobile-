import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, Modal, ScrollView } from 'react-native';
import { X, TrendingUp } from 'lucide-react-native';

interface DailyReward {
  date: string;
  btcAmount: number;
  usdAmount: number;
}

interface BlockRewardsGraphProps {
  visible: boolean;
  onClose: () => void;
  dailyRewards: DailyReward[];
  btcPrice: number;
}

export default function BlockRewardsGraph({ 
  visible, 
  onClose, 
  dailyRewards,
  btcPrice 
}: BlockRewardsGraphProps) {
  const screenWidth = Dimensions.get('window').width;
  
  // Calculate max reward for scaling
  const maxReward = Math.max(...dailyRewards.map(r => r.btcAmount), 0.000001);
  
  // Calculate totals
  const totalBtc = dailyRewards.reduce((sum, r) => sum + r.btcAmount, 0);
  const totalUsd = totalBtc * btcPrice;
  const avgDailyBtc = dailyRewards.length > 0 ? totalBtc / dailyRewards.length : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-end">
        <View className="bg-gmh-dark rounded-t-3xl border-t border-gmh-border max-h-[85%]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gmh-border">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-gmh-lime/20 items-center justify-center">
                <TrendingUp size={20} color="#84CC16" />
              </View>
              <View>
                <Text className="text-white text-lg font-bold">Block Rewards</Text>
                <Text className="text-gmh-slate text-xs">Last 30 days history</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-gmh-card items-center justify-center"
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Summary Stats */}
            <View className="px-4 py-4">
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 bg-gmh-card border border-gmh-border rounded-xl p-3">
                  <Text className="text-gmh-slate text-xs mb-1">30 Day Total</Text>
                  <Text className="text-white text-lg font-bold">₿ {totalBtc.toFixed(6)}</Text>
                  <Text className="text-gmh-lime text-xs">${totalUsd.toFixed(2)}</Text>
                </View>
                <View className="flex-1 bg-gmh-card border border-gmh-border rounded-xl p-3">
                  <Text className="text-gmh-slate text-xs mb-1">Daily Average</Text>
                  <Text className="text-white text-lg font-bold">₿ {avgDailyBtc.toFixed(6)}</Text>
                  <Text className="text-gmh-purple-light text-xs">${(avgDailyBtc * btcPrice).toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Bar Chart */}
            <View className="px-4 pb-4">
              <Text className="text-white text-sm font-semibold mb-3">Daily Rewards</Text>
              <View className="bg-gmh-card border border-gmh-border rounded-xl p-4">
                {/* Chart Area */}
                <View className="h-48 flex-row items-end justify-between">
                  {dailyRewards.slice(-30).map((reward, index) => {
                    const barHeight = maxReward > 0 
                      ? Math.max((reward.btcAmount / maxReward) * 160, 4) 
                      : 4;
                    const isToday = index === dailyRewards.length - 1;
                    
                    return (
                      <View key={index} className="items-center flex-1">
                        <View 
                          className={`w-2 rounded-t-sm ${isToday ? 'bg-gmh-lime' : 'bg-gmh-purple'}`}
                          style={{ height: barHeight }}
                        />
                      </View>
                    );
                  })}
                </View>
                
                {/* X-axis labels */}
                <View className="flex-row justify-between mt-2 border-t border-gmh-border/50 pt-2">
                  <Text className="text-gmh-slate text-[10px]">30d ago</Text>
                  <Text className="text-gmh-slate text-[10px]">15d ago</Text>
                  <Text className="text-gmh-slate text-[10px]">Today</Text>
                </View>
              </View>
            </View>

            {/* Daily List */}
            <View className="px-4 pb-6">
              <Text className="text-white text-sm font-semibold mb-3">Recent Rewards</Text>
              <View className="bg-gmh-card border border-gmh-border rounded-xl overflow-hidden">
                {dailyRewards.slice(-10).reverse().map((reward, index) => (
                  <View 
                    key={index} 
                    className={`flex-row items-center justify-between px-4 py-3 ${
                      index < 9 ? 'border-b border-gmh-border/30' : ''
                    }`}
                  >
                    <View>
                      <Text className="text-white text-sm font-medium">{reward.date}</Text>
                      <Text className="text-gmh-slate text-xs">Block reward</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-gmh-lime text-sm font-bold">+₿ {reward.btcAmount.toFixed(6)}</Text>
                      <Text className="text-gmh-slate text-xs">${(reward.btcAmount * btcPrice).toFixed(2)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Bottom padding */}
            <View className="h-8" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
