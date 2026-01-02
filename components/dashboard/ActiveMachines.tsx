import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Machine {
  id: string;
  site: string;
  hashrate: number | null;
  isLive?: boolean;
}

interface ActiveMachinesProps {
  machines: Machine[];
  onSeeFullList?: () => void;
}

export default function ActiveMachines({ machines, onSeeFullList }: ActiveMachinesProps) {
  return (
    <View className="px-4 py-4 border-t border-gmh-border">
      <View className="mb-3">
        <Text className="text-white text-sm font-medium">Overview</Text>
        <Text className="text-gmh-slate text-xs">Sample of Active Machines</Text>
      </View>
      
      {/* Table Header */}
      <View className="flex-row mb-2 pb-2 border-b border-gmh-border/50">
        <Text className="flex-1 text-gmh-slate text-xs">Machine ID</Text>
        <Text className="w-16 text-gmh-slate text-xs">Site</Text>
        <Text className="w-28 text-gmh-slate text-xs text-right">Hashrate (TH/s)</Text>
      </View>
      
      {/* Machine Rows */}
      {machines.map((machine, index) => (
        <View 
          key={machine.id} 
          className={`flex-row py-2.5 ${index < machines.length - 1 ? 'border-b border-gmh-border/30' : ''}`}
        >
          <Text className="flex-1 text-white text-sm font-mono">{machine.id}</Text>
          <Text className="w-16 text-white text-sm">{machine.site}</Text>
          <View className="w-28 items-end">
            {machine.hashrate !== null ? (
              <View className="flex-row items-center">
                <Text className="text-gmh-lime text-sm font-medium">
                  {machine.hashrate.toFixed(2)} TH/s
                </Text>
                {machine.isLive && (
                  <Text className="text-gmh-lime/70 text-xs ml-1">(Live)</Text>
                )}
              </View>
            ) : (
              <Text className="text-gmh-slate text-sm">-</Text>
            )}
          </View>
        </View>
      ))}
      
      {/* See Full List */}
      <TouchableOpacity onPress={onSeeFullList} className="mt-3 items-end">
        <Text className="text-gmh-lime text-sm font-medium">See full list</Text>
      </TouchableOpacity>
    </View>
  );
}
