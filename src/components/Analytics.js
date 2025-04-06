import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

const Analytics = ({ history, currentBalance, dailySignals }) => {
  const [selectedPeriod, setSelectedPeriod] = useState(6); // Domyślnie 6 miesięcy
  const [selectedCurrency, setSelectedCurrency] = useState('USDT'); // Domyślnie USDT
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [dailyProfit, setDailyProfit] = useState(0);
  const [monthlyProfit, setMonthlyProfit] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  // Kursy wymiany
  const exchangeRates = {
    USDT: 1,
    PLN: 4.0,
    EUR: 0.92
  };

  // Funkcja do przeliczania kwoty na wybraną walutę
  const convertToCurrency = (amount) => {
    return (amount * exchangeRates[selectedCurrency]).toFixed(2);
  };

  // Oblicz dzienny zysk
  useEffect(() => {
    const dailyReturn = 0.006; // 0.6% dziennego zwrotu
    const profit = currentBalance * dailyReturn * dailySignals;
    setDailyProfit(profit);
    setMonthlyProfit(profit * 30); // Miesięczny zysk
  }, [currentBalance, dailySignals]);

  // Filtruj historię na podstawie wybranego okresu
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - selectedPeriod);

    const filtered = history.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });

    setFilteredHistory(filtered);

    // Oblicz statystyki
    const deposits = filtered.filter(entry => entry.type === 'deposit');
    const withdrawals = filtered.filter(entry => entry.type === 'withdrawal');
    
    setTotalDeposits(deposits.reduce((sum, entry) => sum + entry.amount, 0));
    setTotalWithdrawals(withdrawals.reduce((sum, entry) => sum + entry.amount, 0));
    setNetProfit(totalDeposits - totalWithdrawals);
  }, [history, selectedPeriod]);

  // Przygotuj dane dla wykresu
  const chartData = filteredHistory.map(entry => ({
    date: new Date(entry.date).toLocaleDateString('pl-PL'),
    balance: entry.balance * exchangeRates[selectedCurrency],
    deposits: entry.type === 'deposit' ? entry.amount * exchangeRates[selectedCurrency] : 0,
    withdrawals: entry.type === 'withdrawal' ? entry.amount * exchangeRates[selectedCurrency] : 0
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Analiza</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="text-gray-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="border rounded-md p-2"
            >
              <option value={1}>1 miesiąc</option>
              <option value={3}>3 miesiące</option>
              <option value={6}>6 miesięcy</option>
              <option value={12}>12 miesięcy</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="text-gray-500" />
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="border rounded-md p-2"
            >
              <option value="USDT">USDT</option>
              <option value="PLN">PLN</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dzienny zysk</p>
              <p className="text-2xl font-bold">{convertToCurrency(dailyProfit)} {selectedCurrency}</p>
            </div>
            <ArrowUpRight className="text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Miesięczny zysk</p>
              <p className="text-2xl font-bold">{convertToCurrency(monthlyProfit)} {selectedCurrency}</p>
            </div>
            <TrendingUp className="text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Łączne wpłaty</p>
              <p className="text-2xl font-bold">{convertToCurrency(totalDeposits)} {selectedCurrency}</p>
            </div>
            <DollarSign className="text-purple-500" />
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Łączne wypłaty</p>
              <p className="text-2xl font-bold">{convertToCurrency(totalWithdrawals)} {selectedCurrency}</p>
            </div>
            <TrendingDown className="text-red-500" />
          </div>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value) => [value.toFixed(2), '']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#3B82F6" 
              name={`Saldo (${selectedCurrency})`}
            />
            <Line 
              type="monotone" 
              dataKey="deposits" 
              stroke="#10B981" 
              name={`Wpłaty (${selectedCurrency})`}
            />
            <Line 
              type="monotone" 
              dataKey="withdrawals" 
              stroke="#F59E0B" 
              name={`Wypłaty (${selectedCurrency})`}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Analytics; 