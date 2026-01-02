import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface WorkerStatusProps {
  active: number;
  inactive: number;
  underRepair: number;
  awaitingDeployment: number;
  total: number;
  onStatusPress?: (status: string) => void;
}

interface FleetBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
  onPress?: () => void;
}

function FleetBar({ label, count, total, color, onPress }: FleetBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <TouchableOpacity onPress={onPress} className="flex-1">
      <View className="flex-row justify-between mb-1">
        <Text className="text-white text-xs font-medium">{label}</Text>
        <Text className="text-gmh-slate text-xs">{count} / {total}</Text>
      </View>
      <View className="h-2 bg-gmh-dark-secondary rounded-full overflow-hidden">
        <View 
          className="h-full rounded-full"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </TouchableOpacity>
  );
}

export default function WorkerStatus({ 
  active, 
  inactive,
  underRepair,
  awaitingDeployment,
  total,
  onStatusPress
}: WorkerStatusProps) {
  return (
    <View className="px-4 py-4 border-t border-gmh-border">
      <View className="mb-4">
        <Text className="text-white text-sm font-medium">Fleet Highlights</Text>
        <Text className="text-gmh-slate text-xs">See how many of your machines are active</Text>
      </View>
      
      <View className="gap-4">
        {/* Row 1 */}
        <View className="flex-row gap-4">
          <FleetBar
            label="Active"
            count={active}
            total={total}
            color="#84CC16"
            onPress={() => onStatusPress?.('active')}
          />
          <FleetBar
            label="Inactive"
            count={inactive}
            total={total}
            color="#64748B"
            onPress={() => onStatusPress?.('inactive')}
          />
        </View>
        
        {/* Row 2 */}
        <View className="flex-row gap-4">
          <FleetBar
            label="Under Repair"
            count={underRepair}
            total={total}
            color="#F59E0B"
            onPress={() => onStatusPress?.('underRepair')}
          />
          <FleetBar
            label="Awaiting Deployment"
            count={awaitingDeployment}
            total={total}
            color="#3B82F6"
            onPress={() => onStatusPress?.('awaitingDeployment')}
          />
        </View>
      </View>
    </View>
  );
}
