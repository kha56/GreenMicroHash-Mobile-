import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface BitcoinAccountProps {
  btcBalance: number;
  usdBalance: number;
  payoutThreshold: number;
  payoutCountdown: string;
  onPress?: () => void;
}

export default function BitcoinAccount({ 
  btcBalance, 
  usdBalance, 
  payoutThreshold,
  payoutCountdown,
  onPress
}: BitcoinAccountProps) {
  const progress = Math.min((btcBalance / payoutThreshold) * 100, 100);
  
  return (
    <TouchableOpacity onPress={onPress} className="px-4 py-4 border-t border-gmh-border">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-white text-sm font-medium">Next Payout</Text>
          <Text className="text-gmh-slate text-xs">Threshold: {payoutThreshold} BTC</Text>
        </View>
        <View className="items-end">
          <Text className="text-gmh-lime text-lg font-bold">{payoutCountdown}</Text>
          <Text className="text-gmh-slate text-xs">until threshold</Text>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View className="h-3 bg-gmh-dark-secondary rounded-full overflow-hidden mb-2">
        <View 
          className="h-full rounded-full"
          style={{ 
            width: `${progress}%`,
            backgroundColor: '#84CC16',
          }}
        />
        {/* Progress indicator dot */}
        <View 
          className="absolute top-0 bottom-0 w-3 h-3 bg-white rounded-full border-2 border-gmh-lime"
          style={{ left: `${progress}%`, marginLeft: -6 }}
        />
      </View>
      
      {/* Progress Labels */}
      <View className="flex-row justify-between mt-1">
        <Text className="text-gmh-slate text-xs">₿ 0</Text>
        <Text className="text-gmh-slate text-xs">₿ {payoutThreshold} (Payout)</Text>
      </View>
    </TouchableOpacity>
  );
}
