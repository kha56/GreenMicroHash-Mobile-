import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

import Header from '@/components/dashboard/Header';
import HashrateDisplay from '@/components/dashboard/HashrateDisplay';
import ActiveMachines from '@/components/dashboard/ActiveMachines';
import WorkerStatus from '@/components/dashboard/WorkerStatus';
import BitcoinAccount from '@/components/dashboard/BitcoinAccount';
import RewardsSection from '@/components/dashboard/RewardsSection';
import PoolStatistics from '@/components/dashboard/PoolStatistics';

// Mock data based on the reference dashboard design
const mockData = {
  username: 'ivankha',
  notificationCount: 2,
  hashrate: 506.7,
  hashrateUnit: 'TH/s',
  machines: [
    { id: 'I005J', site: 'WA', hashrate: null, isLive: false },
    { id: 'H016T', site: 'WA', hashrate: 285.23, isLive: true },
  ],
  fleet: {
    active: 1,
    inactive: 0,
    underRepair: 1,
    awaitingDeployment: 1,
    total: 3,
  },
  bitcoin: {
    btcBalance: 0.004494,
    usdBalance: 399.07,
    payoutThreshold: 0.0051,
    payoutCountdown: '2d 23h',
  },
  rewards: {
    currentBalance: 0.004494,
    currentBalanceUsd: 399.07,
    todayReward: 0.000056,
    todayRewardUsd: 5.01,
    est24hReward: 0.000204,
    est24hRewardUsd: 18.13,
  },
  pool: {
    hashrate: 13.66,
    hashrateUnit: 'Eh/s',
    activeWorkers: 106306,
    difficulty: 92.67,
    blockHeight: 879234,
  },
};

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(mockData);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Trigger haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Simulate data refresh
    setTimeout(() => {
      // Slightly randomize hashrate to show update
      setData(prev => ({
        ...prev,
        hashrate: parseFloat((prev.hashrate + (Math.random() - 0.5) * 20).toFixed(1)),
      }));
      setRefreshing(false);
    }, 1500);
  }, []);

  const handleNotificationPress = () => {
    console.log('Notifications pressed');
  };

  const handleSettingsPress = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          }
        },
      ]
    );
  };

  const handleMenuPress = () => {
    console.log('Menu pressed');
  };

  const handleWorkerStatusPress = (status: string) => {
    console.log(`Worker status pressed: ${status}`);
  };

  const handleBitcoinAccountPress = () => {
    console.log('Bitcoin account pressed');
  };

  const handleSeeFullList = () => {
    console.log('See full machine list');
  };

  return (
    <SafeAreaView className="flex-1 bg-gmh-dark">
      <StatusBar style="light" />
      
      {/* Sticky Header */}
      <Header
        username={data.username}
        notificationCount={data.notificationCount}
        onNotificationPress={handleNotificationPress}
        onSettingsPress={handleSettingsPress}
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#84CC16"
            progressBackgroundColor="#121214"
          />
        }
      >
        {/* Overview - Total Hashrate */}
        <HashrateDisplay
          hashrate={data.hashrate}
          unit={data.hashrateUnit}
          onRefresh={onRefresh}
          isRefreshing={refreshing}
        />
        
        {/* Active Machines Table */}
        <ActiveMachines
          machines={data.machines}
          onSeeFullList={handleSeeFullList}
        />
        
        {/* Next Payout Progress */}
        <BitcoinAccount
          btcBalance={data.bitcoin.btcBalance}
          usdBalance={data.bitcoin.usdBalance}
          payoutThreshold={data.bitcoin.payoutThreshold}
          payoutCountdown={data.bitcoin.payoutCountdown}
          onPress={handleBitcoinAccountPress}
        />
        
        {/* Rewards Cards */}
        <RewardsSection
          currentBalance={data.rewards.currentBalance}
          currentBalanceUsd={data.rewards.currentBalanceUsd}
          todayReward={data.rewards.todayReward}
          todayRewardUsd={data.rewards.todayRewardUsd}
          est24hReward={data.rewards.est24hReward}
          est24hRewardUsd={data.rewards.est24hRewardUsd}
        />
        
        {/* Fleet Highlights */}
        <WorkerStatus
          active={data.fleet.active}
          inactive={data.fleet.inactive}
          underRepair={data.fleet.underRepair}
          awaitingDeployment={data.fleet.awaitingDeployment}
          total={data.fleet.total}
          onStatusPress={handleWorkerStatusPress}
        />
        
        {/* Network Stats */}
        <PoolStatistics
          poolHashrate={data.pool.hashrate}
          poolHashrateUnit={data.pool.hashrateUnit}
          activeWorkers={data.pool.activeWorkers}
          difficulty={data.pool.difficulty}
          blockHeight={data.pool.blockHeight}
        />
        
        {/* Bottom padding for safe scrolling */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
