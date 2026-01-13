import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, ScrollView, RefreshControl, Alert, ActivityIndicator, Text, Modal, TouchableOpacity, FlatList } from 'react-native';
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
import BlockRewardsGraph from '@/components/dashboard/BlockRewardsGraph';

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
  const [machines, setMachines] = useState<Array<{
    id: string;
    status: string;
    user_id: string;
  }>>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [unreadInvoiceCount, setUnreadInvoiceCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [invoices, setInvoices] = useState<Array<{
    id: string;
    invoice_number: string;
    amount: number;
    currency: string;
    status: string;
    description: string | null;
    due_date: string | null;
    is_read: boolean;
    created_at: string;
  }>>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showRewardsHistory, setShowRewardsHistory] = useState(false);
  const [networkStats, setNetworkStats] = useState<{
    difficulty: number;
    blockHeight: number;
    networkHashrate: number;
    halvingBlocksRemaining: number;
  }>({
    difficulty: 0,
    blockHeight: 0,
    networkHashrate: 0,
    halvingBlocksRemaining: 0,
  });
  
  // Calculate fleet status from machines table in Supabase
  const fleetStatus = useMemo(() => {
    const activeMachines = machines.filter((m) => m.status === "active").length;
    const inactiveMachines = machines.filter((m) => m.status === "inactive").length;
    const underRepairMachines = machines.filter((m) => m.status === "under_repair").length;
    const awaitingDeployment = machines.filter((m) => m.status === "awaiting_deployment").length;
    
    return {
      active: activeMachines,
      inactive: inactiveMachines,
      underRepair: underRepairMachines,
      awaitingDeployment: awaitingDeployment,
      total: machines.length,
    };
  }, [machines]);
  
  // Generate mock daily rewards data for last 30 days based on estimated reward
  const generateDailyRewards = useCallback(() => {
    const days = 30;
    const rewards = [];
    const baseReward = braiinsRewardData 
      ? parseFloat(braiinsRewardData.estimated_reward) / 24 
      : 0.000056;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Add some variance to make it look realistic
      const variance = 0.7 + Math.random() * 0.6; // 70% to 130% of base
      const btcAmount = baseReward * variance;
      
      rewards.push({
        date: dateStr,
        btcAmount,
        usdAmount: btcAmount * btcPrice,
      });
    }
    return rewards;
  }, [braiinsRewardData, btcPrice]);
  
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

  // Fetch Bitcoin network stats
  useEffect(() => {
    const fetchNetworkStats = async () => {
      try {
        // Fetch block height from mempool.space
        const blocksRes = await fetch('https://mempool.space/api/blocks/tip/height');
        const blockHeight = await blocksRes.json();
        
        // Fetch hashrate from mempool.space - returns hashrates array
        const hashrateRes = await fetch('https://mempool.space/api/v1/mining/hashrate/3d');
        const hashrateData = await hashrateRes.json();
        
        // Get the latest hashrate from the array (in H/s)
        let networkHashrateEH = 0;
        if (hashrateData?.hashrates && Array.isArray(hashrateData.hashrates) && hashrateData.hashrates.length > 0) {
          const latestHashrate = hashrateData.hashrates[hashrateData.hashrates.length - 1];
          // Convert from H/s to EH/s (divide by 10^18)
          networkHashrateEH = latestHashrate.avgHashrate / 1e18;
        } else if (hashrateData?.currentHashrate) {
          networkHashrateEH = hashrateData.currentHashrate / 1e18;
        }
        
        // Get difficulty from blockchain.info
        const diffRes = await fetch('https://blockchain.info/q/getdifficulty');
        const rawDifficulty = await diffRes.json();
        const difficultyInT = rawDifficulty / 1e12;
        
        // Calculate blocks remaining until next halving
        // Halvings occur every 210,000 blocks. Last halving was at block 840,000 (April 2024)
        // Next halving at block 1,050,000
        const currentBlock = typeof blockHeight === 'number' ? blockHeight : 0;
        const nextHalvingBlock = Math.ceil(currentBlock / 210000) * 210000;
        const halvingBlocksRemaining = nextHalvingBlock - currentBlock;
        
        console.log('Network stats:', { blockHeight, networkHashrateEH, difficultyInT, halvingBlocksRemaining, rawHashrateData: hashrateData });
        
        setNetworkStats({
          blockHeight: currentBlock,
          networkHashrate: networkHashrateEH,
          difficulty: difficultyInT,
          halvingBlocksRemaining: halvingBlocksRemaining,
        });
      } catch (error) {
        console.error('Failed to fetch network stats:', error);
      }
    };
    
    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, 60000); // Update every minute
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
        
        // Fetch machines for fleet status
        const { data: machinesData } = await supabase
          .from('machines')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (machinesData) {
          setMachines(machinesData);
        }
      }
    };
    fetchUser();
  }, []);

  // Set initial loading to false once all critical data is loaded
  useEffect(() => {
    if (hasInitiallyLoaded && userName) {
      // Give a slight delay to ensure UI is ready
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasInitiallyLoaded, userName]);

  // Fetch invoices and unread count, subscribe to realtime updates
  useEffect(() => {
    const fetchInvoices = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all invoices for the user (most recent first)
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && invoiceData) {
        setInvoices(invoiceData);
        const unreadCount = invoiceData.filter(inv => !inv.is_read).length;
        setUnreadInvoiceCount(unreadCount);
      }
    };

    fetchInvoices();

    // Subscribe to realtime changes on invoices table
    const channel = supabase
      .channel('invoice-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
        },
        (payload) => {
          console.log('Invoice change detected:', payload);
          // Refetch invoices when any change happens
          fetchInvoices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    
    // Refresh machines data
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: machinesData } = await supabase
        .from('machines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (machinesData) {
        setMachines(machinesData);
      }
    }
    
    setRefreshing(false);
  }, [fetchLiveHashrate]);

  // Separate handler for the button that prevents scroll position change
  const onButtonRefresh = useCallback(async () => {
    // Trigger haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Fetch live hashrate data without changing refreshing state (which can affect scroll)
    await fetchLiveHashrate();
  }, [fetchLiveHashrate]);

  const handleNotificationPress = () => {
    setShowNotifications(true);
  };

  const markInvoiceAsRead = async (invoiceId: string) => {
    const { error } = await supabase
      .from('invoices')
      .update({ is_read: true })
      .eq('id', invoiceId);

    if (!error) {
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId ? { ...inv, is_read: true } : inv
      ));
      setUnreadInvoiceCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('invoices')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setInvoices(prev => prev.map(inv => ({ ...inv, is_read: true })));
      setUnreadInvoiceCount(0);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const handleViewRewardsHistory = () => {
    setShowRewardsHistory(true);
  };

  const handleSeeFullList = () => {
    console.log('See full machine list');
  };

  // Loading screen while data is being fetched
  if (isInitialLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gmh-dark items-center justify-center">
        <StatusBar style="light" />
        <View className="items-center justify-center">
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text className="text-slate-400 mt-4 font-medium text-base">Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gmh-dark">
      <StatusBar style="light" />
      
      {/* Sticky Header */}
      <Header
        username={userName || data.username}
        notificationCount={unreadInvoiceCount}
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
          onRefresh={onButtonRefresh}
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
          currentBalance={braiinsRewardData ? parseFloat(braiinsRewardData.current_balance) : 0}
          currentBalanceUsd={braiinsRewardData && btcPrice > 0 ? parseFloat(braiinsRewardData.current_balance) * btcPrice : 0}
          todayReward={braiinsRewardData ? parseFloat(braiinsRewardData.today_reward) : 0}
          todayRewardUsd={braiinsRewardData && btcPrice > 0 ? parseFloat(braiinsRewardData.today_reward) * btcPrice : 0}
          est24hReward={braiinsRewardData ? parseFloat(braiinsRewardData.estimated_reward) : 0}
          est24hRewardUsd={braiinsRewardData && btcPrice > 0 ? parseFloat(braiinsRewardData.estimated_reward) * btcPrice : 0}
          onViewHistory={handleViewRewardsHistory}
        />
        
        {/* Fleet Highlights */}
        <WorkerStatus
          active={fleetStatus.active}
          inactive={fleetStatus.inactive}
          underRepair={fleetStatus.underRepair}
          awaitingDeployment={fleetStatus.awaitingDeployment}
          total={fleetStatus.total}
          onStatusPress={handleWorkerStatusPress}
        />
        
        {/* Network Stats */}
        <PoolStatistics
          poolHashrate={networkStats.networkHashrate > 0 ? networkStats.networkHashrate : data.pool.hashrate}
          poolHashrateUnit="EH/s"
          halvingBlocksRemaining={networkStats.halvingBlocksRemaining}
          difficulty={networkStats.difficulty > 0 ? networkStats.difficulty : data.pool.difficulty}
          blockHeight={networkStats.blockHeight > 0 ? networkStats.blockHeight : data.pool.blockHeight}
        />
        
        {/* Bottom padding for safe scrolling */}
        <View className="h-8" />
      </ScrollView>

      {/* Block Rewards History Modal */}
      <BlockRewardsGraph
        visible={showRewardsHistory}
        onClose={() => setShowRewardsHistory(false)}
        dailyRewards={generateDailyRewards()}
        btcPrice={btcPrice}
      />

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-gmh-dark rounded-t-3xl max-h-[80%]">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Text className="text-white text-xl font-semibold">Notifications</Text>
              <View className="flex-row items-center gap-3">
                {unreadInvoiceCount > 0 && (
                  <TouchableOpacity 
                    onPress={markAllAsRead}
                    className="px-3 py-1.5 bg-purple-600/20 rounded-full"
                  >
                    <Text className="text-purple-400 text-sm font-medium">Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  onPress={() => setShowNotifications(false)}
                  className="w-8 h-8 items-center justify-center rounded-full bg-slate-800"
                >
                  <Text className="text-white text-lg">✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Invoice List */}
            {invoices.length === 0 ? (
              <View className="py-16 items-center justify-center">
                <Text className="text-slate-500 text-4xl mb-3">🔔</Text>
                <Text className="text-slate-400 text-base font-medium">No notifications yet</Text>
                <Text className="text-slate-500 text-sm mt-1">New invoices will appear here</Text>
              </View>
            ) : (
              <FlatList
                data={invoices}
                keyExtractor={(item) => item.id}
                className="px-4 py-2"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => markInvoiceAsRead(item.id)}
                    className={`p-4 rounded-xl mb-3 ${item.is_read ? 'bg-slate-800/50' : 'bg-purple-600/20 border border-purple-500/30'}`}
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-row items-center gap-2">
                        {!item.is_read && (
                          <View className="w-2 h-2 bg-purple-500 rounded-full" />
                        )}
                        <Text className={`font-semibold ${item.is_read ? 'text-slate-400' : 'text-white'}`}>
                          New Invoice
                        </Text>
                      </View>
                      <Text className={`text-xs ${item.is_read ? 'text-slate-500' : 'text-slate-400'}`}>
                        {formatDate(item.created_at)}
                      </Text>
                    </View>
                    <Text className={`text-sm mb-1 ${item.is_read ? 'text-slate-500' : 'text-slate-300'}`}>
                      Invoice #{item.invoice_number}
                    </Text>
                    <View className="flex-row items-center justify-between mt-2">
                      <Text className={`text-lg font-bold ${item.is_read ? 'text-slate-400' : 'text-lime-400'}`}>
                        {item.currency === 'BTC' ? '₿' : '$'}{item.amount.toLocaleString()}
                      </Text>
                      <View className={`px-2 py-1 rounded-full ${
                        item.status === 'paid' ? 'bg-green-600/20' : 
                        item.status === 'pending' ? 'bg-amber-600/20' : 'bg-red-600/20'
                      }`}>
                        <Text className={`text-xs font-medium capitalize ${
                          item.status === 'paid' ? 'text-green-400' : 
                          item.status === 'pending' ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                    {item.description && (
                      <Text className={`text-xs mt-2 ${item.is_read ? 'text-slate-600' : 'text-slate-400'}`}>
                        {item.description}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
