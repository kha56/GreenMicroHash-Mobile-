import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Bell, Settings, Menu } from "lucide-react-native";

interface HeaderProps {
  username: string;
  notificationCount?: number;
  onNotificationPress?: () => void;
  onSettingsPress?: () => void;
  onMenuPress?: () => void;
}

export default function Header({
  username,
  notificationCount = 0,
  onNotificationPress,
  onSettingsPress,
  onMenuPress,
}: HeaderProps) {
  return (
    <View className="bg-gmh-dark border-b border-gmh-border">
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-3">
          <View className={"flex-row items-center gap-2"}>
            <View
              className={
                "w-8 h-8 rounded-full bg-gmh-lime/20 items-center justify-center"
              }
            >
              <Text className={"text-gmh-lime font-bold text-sm"}>G</Text>
            </View>
            <Text className={"text-white text-base font-semibold"}>
              GreenMicroHash
            </Text>
          </View>
          <TouchableOpacity onPress={onMenuPress}></TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={onNotificationPress}
            className="relative p-1"
          >
            <Bell size={20} color="#64748B" />
            {notificationCount > 0 && (
              <View className="absolute top-0 right-0 bg-gmh-lime w-4 h-4 rounded-full items-center justify-center">
                <Text className="text-gmh-dark text-[10px] font-bold">
                  {notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onSettingsPress} className="p-1">
            <Settings size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>
      {/* User greeting bar */}
      <View className="px-4 pb-3">
        <Text className="text-gmh-slate text-xs">Welcome back,</Text>
        <Text className="text-white text-sm font-medium">{username}</Text>
      </View>
    </View>
  );
}
