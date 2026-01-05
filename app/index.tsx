import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, ScrollView, RefreshControl, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

interface BraiinsWorker {
  worker_name: string;
  hashrate_5m: number;
  hashrate_1h: number;
  hashrate_24h: number;
  last_share: string;
  state: string;
}

interface BraiinsData {
  workers: BraiinsWorker[];
  hashrate_5m: number;
  current_balance: string;
  today_reward: string;
  estimated_reward: string;
  error?: string;
  details?: string;
}

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
  const [userName, setUserName] = useState('');
  const [liveHashrate, setLiveHashrate] = useState<number | null>(null);
  const [isLoadingHashrate, setIsLoadingHashrate] = useState(true);
  const [braiinsWorkers, setBraiinsWorkers] = useState<BraiinsWorker[]>([]);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [braiinsRewardData, setBraiinsRewardData] = useState<{
    current_balance: string;
    today_reward: string;
    estimated_reward: string;
  } | null>(null);
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [payoutProgress, setPayoutProgress] = useState<number>(0);
  const [nextPayoutEta, setNextPayoutEta] = useState<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const PAYOUT_THRESHOLD = 0.0051; // BTC minimum payout threshold

  const fetchLiveHashrate = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        console.log("No session token available");
        setIsLoadingHashrate(false);
        return;
      }

      const { data: braiinsData, error } = await supabase.functions.invoke<BraiinsData>(
        'supabase-functions-fetch-braiins-data',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (error) {
        console.error('Error fetching hashrate:', error);
        setBraiinsWorkers([]);
        setLiveHashrate(0);
        setBraiinsRewardData(null);
        return;
      }

      console.log('Braiins response:', JSON.stringify(braiinsData, null, 2));

      if (braiinsData?.error) {
        console.warn('Braiins API error:', braiinsData.error, braiinsData.details);
      }

      if (braiinsData) {
        console.log('Raw braiinsData:', braiinsData);
        console.log('hashrate_5m raw value:', braiinsData.hashrate_5m, 'type:', typeof braiinsData.hashrate_5m);
        
        // Set workers
        const newWorkers = braiinsData.workers && Array.isArray(braiinsData.workers) ? braiinsData.workers : [];
        setBraiinsWorkers(newWorkers);
        
        // Set hashrate - convert from Gh/s to TH/s (divide by 1000)
        // Parse as number in case it comes as string
        const rawHashrate = typeof braiinsData.hashrate_5m === 'string' 
          ? parseFloat(braiinsData.hashrate_5m) 
          : (braiinsData.hashrate_5m || 0);
        const hashrateInTH = rawHashrate / 1000;
        console.log('Calculated hashrate in TH:', hashrateInTH);
        setLiveHashrate(hashrateInTH);
        
        // Set reward data - always set it if we have braiinsData without error
        if (!braiinsData.error) {
          const newRewardData = {
            current_balance: braiinsData.current_balance || "0",
            today_reward: braiinsData.today_reward || "0",
            estimated_reward: braiinsData.estimated_reward || "0",
          };
          console.log('Setting reward data:', newRewardData);
          setBraiinsRewardData(newRewardData);
        } else {
          console.log('Braiins returned error, not setting reward data');
          setBraiinsRewardData(null);
        }
        
        console.log("State after update - workers:", newWorkers.length, "hashrate TH/s:", hashrateInTH);
      }
    } catch (err) {
      console.error('Failed to fetch live hashrate:', err);
      setBraiinsWorkers([]);
      setLiveHashrate(0);
      setBraiinsRewardData(null);
    } finally {
      setIsLoadingHashrate(false);
      setHasInitiallyLoaded(true);
    }
  }, []);

  // Fetch BTC price
  useEffect(() => {
    const fetchBtcPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const data = await response.json();
        if (data?.bitcoin?.usd) {
          setBtcPrice(data.bitcoin.usd);
        }
      } catch (error) {
        console.error('Failed to fetch BTC price:', error);
      }
    };
    
    fetchBtcPrice();
    const interval = setInterval(fetchBtcPrice, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch full_name from public.users table
        const { data: userData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        const fullName = userData?.full_name || 
                        user.user_metadata?.full_name || 
                        user.email?.split('@')[0] || 
                        'User';
        setUserName(fullName);
      }
    };
    fetchUser();
  }, []);

  // Calculate time until reaching payout threshold (0.0051 BTC)
  useEffect(() => {
    const calculatePayoutEta = () => {
      if (!braiinsRewardData) {
        setNextPayoutEta("—");
        setPayoutProgress(0);
        return;
      }

      const currentBalance = parseFloat(braiinsRewardData.current_balance) || 0;
      const estimatedDaily = parseFloat(braiinsRewardData.estimated_reward) || 0;
      
      // Already at or above threshold
      if (currentBalance >= PAYOUT_THRESHOLD) {
        setNextPayoutEta("Ready!");
        setPayoutProgress(100);
        return;
      }
      
      // Can't calculate if no mining rate
      if (estimatedDaily <= 0) {
        setNextPayoutEta("—");
        setPayoutProgress((currentBalance / PAYOUT_THRESHOLD) * 100);
        return;
      }
      
      // Calculate remaining BTC needed
      const remaining = PAYOUT_THRESHOLD - currentBalance;
      
      // Calculate hours until threshold based on estimated daily reward
      const hoursPerBtc = 24 / estimatedDaily;
      const hoursToThreshold = remaining * hoursPerBtc;
      
      const days = Math.floor(hoursToThreshold / 24);
      const hours = Math.floor(hoursToThreshold % 24);
      const minutes = Math.floor((hoursToThreshold % 1) * 60);
      
      if (days > 0) {
        setNextPayoutEta(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setNextPayoutEta(`${hours}h ${minutes}m`);
      } else {
        setNextPayoutEta(`${minutes}m`);
      }
      
      // Progress based on balance vs threshold
      setPayoutProgress((currentBalance / PAYOUT_THRESHOLD) * 100);
    };

    calculatePayoutEta();
    const interval = setInterval(calculatePayoutEta, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [braiinsRewardData]);

  // Fetch live hashrate on mount and every 30 seconds
  useEffect(() => {
    fetchLiveHashrate();

    intervalRef.current = setInterval(() => {
      fetchLiveHashrate();
    }, 30000); // 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchLiveHashrate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Trigger haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Fetch live hashrate data
    await fetchLiveHashrate();
    setRefreshing(false);
  }, [fetchLiveHashrate]);

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
        username={userName || data.username}
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
          hashrate={liveHashrate}
          unit={data.hashrateUnit}
          onRefresh={onRefresh}
          isRefreshing={refreshing || isLoadingHashrate}
        />
        
        {/* Active Machines Table */}
        <ActiveMachines
          workers={braiinsWorkers}
          isInitialLoading={!hasInitiallyLoaded}
          onSeeFullList={handleSeeFullList}
        />
        
        {/* Next Payout Progress */}
        <BitcoinAccount
          btcBalance={braiinsRewardData ? parseFloat(braiinsRewardData.current_balance) : data.bitcoin.btcBalance}
          usdBalance={braiinsRewardData && btcPrice > 0 ? parseFloat(braiinsRewardData.current_balance) * btcPrice : data.bitcoin.usdBalance}
          payoutThreshold={PAYOUT_THRESHOLD}
          payoutCountdown={nextPayoutEta || data.bitcoin.payoutCountdown}
          payoutProgress={payoutProgress}
          onPress={handleBitcoinAccountPress}
        />
        
        {/* Rewards Cards */}
        <RewardsSection
          currentBalance={braiinsRewardData ? parseFloat(braiinsRewardData.current_balance) : data.rewards.currentBalance}
          currentBalanceUsd={braiinsRewardData && btcPrice > 0 ? parseFloat(braiinsRewardData.current_balance) * btcPrice : data.rewards.currentBalanceUsd}
          todayReward={braiinsRewardData ? parseFloat(braiinsRewardData.today_reward) : data.rewards.todayReward}
          todayRewardUsd={braiinsRewardData && btcPrice > 0 ? parseFloat(braiinsRewardData.today_reward) * btcPrice : data.rewards.todayRewardUsd}
          est24hReward={braiinsRewardData ? parseFloat(braiinsRewardData.estimated_reward) : data.rewards.est24hReward}
          est24hRewardUsd={braiinsRewardData && btcPrice > 0 ? parseFloat(braiinsRewardData.estimated_reward) * btcPrice : data.rewards.est24hRewardUsd}
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
