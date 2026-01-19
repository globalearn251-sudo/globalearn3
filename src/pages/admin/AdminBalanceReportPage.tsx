import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { transactionApi, profileApi } from '@/db/api';
import { Wallet, Search, IndianRupee, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Coins, Gift, Users as UsersIcon } from 'lucide-react';
import type { Transaction, Profile } from '@/types/types';

export default function AdminBalanceReportPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserTransactions(selectedUser.id);
    } else {
      setFilteredTransactions(transactions);
    }
  }, [selectedUser, transactions]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allTransactions, allUsers] = await Promise.all([
        transactionApi.getAllTransactionsWithUsers(),
        profileApi.getAllUsers(),
      ]);
      setTransactions(allTransactions);
      setFilteredTransactions(allTransactions);
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserTransactions = async (userId: string) => {
    try {
      const userTransactions = await transactionApi.getUserTransactionsWithBalance(userId);
      setFilteredTransactions(userTransactions);
    } catch (error) {
      console.error('Error loading user transactions:', error);
    }
  };

  const handleUserSelect = (user: Profile) => {
    setSelectedUser(user);
    setUserSearchTerm(user.username);
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setUserSearchTerm('');
    setFilteredTransactions(transactions);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'recharge':
        return <ArrowUpCircle className="h-5 w-5 text-success" />;
      case 'withdrawal':
        return <ArrowDownCircle className="h-5 w-5 text-destructive" />;
      case 'purchase':
        return <ArrowDownCircle className="h-5 w-5 text-primary" />;
      case 'earning':
        return <Coins className="h-5 w-5 text-success" />;
      case 'referral':
        return <UsersIcon className="h-5 w-5 text-success" />;
      case 'lucky_draw':
        return <Gift className="h-5 w-5 text-success" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'recharge':
      case 'earning':
      case 'referral':
      case 'lucky_draw':
        return 'text-success';
      case 'withdrawal':
      case 'purchase':
        return 'text-destructive';
      default:
        return 'text-foreground';
    }
  };

  const getTransactionSign = (type: string) => {
    switch (type) {
      case 'recharge':
      case 'earning':
      case 'referral':
      case 'lucky_draw':
        return '+';
      case 'withdrawal':
      case 'purchase':
        return '-';
      default:
        return '';
    }
  };

  const groupTransactionsByDate = () => {
    const grouped = new Map<string, Transaction[]>();
    
    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)?.push(transaction);
    });
    
    return Array.from(grouped.entries());
  };

  const calculateDayStats = (dayTransactions: Transaction[]) => {
    const credits = dayTransactions
      .filter((t) => ['recharge', 'earning', 'referral', 'lucky_draw'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const debits = dayTransactions
      .filter((t) => ['withdrawal', 'purchase'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { credits, debits, net: credits - debits };
  };

  const calculateOverallStats = () => {
    const totalCredits = filteredTransactions
      .filter((t) => ['recharge', 'earning', 'referral', 'lucky_draw'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalDebits = filteredTransactions
      .filter((t) => ['withdrawal', 'purchase'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalEarnings = filteredTransactions
      .filter((t) => t.type === 'earning')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const recharges = filteredTransactions.filter((t) => t.type === 'recharge').length;
    const withdrawals = filteredTransactions.filter((t) => t.type === 'withdrawal').length;
    const earnings = filteredTransactions.filter((t) => t.type === 'earning').length;
    
    return {
      totalCredits,
      totalDebits,
      totalEarnings,
      netBalance: totalCredits - totalDebits,
      recharges,
      withdrawals,
      earnings,
      totalTransactions: filteredTransactions.length,
    };
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const groupedTransactions = groupTransactionsByDate();
  const stats = calculateOverallStats();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Balance & Transaction Report</h1>
          <p className="text-muted-foreground">
            View all wallet transactions and balance history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Wallet className="h-8 w-8 text-primary" />
          <div>
            <p className="text-2xl font-bold">{stats.totalTransactions}</p>
            <p className="text-xs text-muted-foreground">Total Transactions</p>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-2xl font-bold text-success">
                  ₹{stats.totalCredits.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Total Debits</p>
                <p className="text-2xl font-bold text-destructive">
                  ₹{stats.totalDebits.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Coins className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Daily Earnings</p>
                <p className="text-2xl font-bold text-success">
                  ₹{stats.totalEarnings.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <IndianRupee className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Net Balance</p>
                <p className="text-2xl font-bold">₹{stats.netBalance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{stats.totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {selectedUser && (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
              <div>
                <p className="font-bold">{selectedUser.username}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                <p className="text-sm">
                  Current Balance: <span className="font-bold text-success">₹{selectedUser.balance.toFixed(2)}</span>
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearUser}>
                Clear
              </Button>
            </div>
          )}

          {!selectedUser && userSearchTerm && filteredUsers.length > 0 && (
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {filteredUsers.slice(0, 10).map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full p-3 text-left hover:bg-muted transition-colors border-b last:border-b-0"
                >
                  <p className="font-bold">{user.username}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-sm">Balance: ₹{user.balance.toFixed(2)}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Breakdown */}
      {selectedUser && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Recharges</p>
              <p className="text-xl font-bold">{stats.recharges}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Withdrawals</p>
              <p className="text-xl font-bold">{stats.withdrawals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Daily Earnings</p>
              <p className="text-xl font-bold">{stats.earnings}</p>
              <p className="text-xs text-success font-bold">₹{stats.totalEarnings.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Purchases</p>
              <p className="text-xl font-bold">
                {filteredTransactions.filter((t) => t.type === 'purchase').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Referrals</p>
              <p className="text-xl font-bold">
                {filteredTransactions.filter((t) => t.type === 'referral').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Lucky Draw</p>
              <p className="text-xl font-bold">
                {filteredTransactions.filter((t) => t.type === 'lucky_draw').length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Day-wise Transactions */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {selectedUser
              ? `No transactions found for ${selectedUser.username}`
              : 'No transactions yet'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedTransactions.map(([date, dayTransactions]) => {
            const dayStats = calculateDayStats(dayTransactions);
            
            return (
              <Card key={date}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{date}</CardTitle>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-success" />
                        <span className="text-success font-bold">
                          ₹{dayStats.credits.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-4 w-4 text-destructive" />
                        <span className="text-destructive font-bold">
                          ₹{dayStats.debits.toFixed(2)}
                        </span>
                      </div>
                      <Badge variant={dayStats.net >= 0 ? 'default' : 'destructive'}>
                        Net: {dayStats.net >= 0 ? '+' : ''}₹{dayStats.net.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dayTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {getTransactionIcon(transaction.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold capitalize">{transaction.type}</p>
                              {!selectedUser && transaction.user && (
                                <Badge variant="outline" className="text-xs">
                                  {transaction.user.username}
                                </Badge>
                              )}
                            </div>
                            {transaction.description && (
                              <p className="text-sm text-muted-foreground">
                                {transaction.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getTransactionColor(transaction.type)}`}>
                            {getTransactionSign(transaction.type)}₹{transaction.amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Balance: ₹{transaction.balance_after.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
