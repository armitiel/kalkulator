import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Calendar, TrendingUp, Clock, CalendarDays, Pencil } from 'lucide-react';

const Dashboard = ({ 
  currentBalance, 
  updateBalance, 
  dailySignals, 
  updateDailySignals, 
  selectedCurrency, 
  exchangeRates, 
  translations, 
  selectedLanguage,
  history
}) => {
  // Stan komponentu
  const [projectionMonths, setProjectionMonths] = useState(3);
  const [projectionData, setProjectionData] = useState([]);
  const [profitStats, setProfitStats] = useState({
    totalProfit: 0,
    dailyProfit: 0,
    monthlyProfit: 0
  });
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isEditingSignals, setIsEditingSignals] = useState(false);
  const [editSignalsValue, setEditSignalsValue] = useState('3');

  // Funkcja do generowania nazw miesięcy za pomocą useCallback
  const getMonthNames = useCallback((months) => {
    const monthNames = {
      pl: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 
           'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'],
      en: ['January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November', 'December']
    };
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const result = [];
    
    for (let i = 0; i < months; i++) {
      const monthIndex = (currentMonth + i) % 12;
      result.push(monthNames[selectedLanguage][monthIndex]);
    }
    
    return result;
  }, [selectedLanguage]);
  
  // Używamy tylko jednego useEffect do generowania danych projekcji i obliczania statystyk
  useEffect(() => {
    if (currentBalance <= 0) {
      setProjectionData([]);
      setProfitStats({
        totalProfit: 0,
        dailyProfit: 0,
        monthlyProfit: 0
      });
      return;
    }

    const dailyReturn = 0.006 * dailySignals;
    const monthlyReturn = Math.pow(1 + dailyReturn, 30) - 1; // Wzrost złożony
    
    // Dzienny zysk
    const dailyProfit = currentBalance * dailyReturn;
    
    // Miesięczny zysk (złożony)
    const monthlyProfit = currentBalance * monthlyReturn;
    
    // Projekcja na wybrane miesiące
    const monthNames = getMonthNames(projectionMonths);
    const data = [];
    let totalGrowth = 0;
    
    // Punkt początkowy
    data.push({
      month: translations[selectedLanguage].currently || 'Now',
      capital: currentBalance,
      growth: 0
    });
    
    // Obliczenia dla kolejnych miesięcy
    let capital = currentBalance;
    for (let i = 1; i <= projectionMonths; i++) {
      const monthlyGrowth = capital * monthlyReturn; // Wzrost złożony
      const newCapital = capital + monthlyGrowth;
      totalGrowth += monthlyGrowth;
      
      data.push({
        month: monthNames[i - 1],
        capital: newCapital,
        growth: monthlyGrowth
      });
      
      capital = newCapital;
    }
    
    setProjectionData(data);
    
    // Statystyki zysków
    setProfitStats({
      totalProfit: totalGrowth,
      dailyProfit: dailyProfit,
      monthlyProfit: monthlyProfit
    });
  }, [currentBalance, dailySignals, projectionMonths, translations, selectedLanguage, getMonthNames]);
  
  // Funkcja do obliczania statusu obrotu dla wpłaty
  const calculateTurnoverStatus = (deposit) => {
    if (!deposit || !deposit.date || !deposit.amount) return null;
    
    const depositDate = new Date(deposit.date);
    const currentDate = new Date();
    const depositAmount = parseFloat(deposit.amount);
    const ratePerSignal = 0.006;
    const totalDailyRate = ratePerSignal * dailySignals;
    const daysSinceDeposit = Math.max(1, Math.floor((currentDate - depositDate) / (1000 * 60 * 60 * 24)));
    
    // Oblicz dni potrzebne do obrotu z uwzględnieniem wzrostu złożonego
    const daysToTurnover = Math.ceil(
      Math.log(1 + (depositAmount/currentBalance)) / 
      Math.log(1 + totalDailyRate)
    );

    // Obliczenia dla kapitału
    const capitalWithoutDeposit = (currentBalance - depositAmount) * Math.pow(1 + totalDailyRate, daysToTurnover);
    const capitalWithDeposit = currentBalance * Math.pow(1 + totalDailyRate, daysToTurnover);
    const actualDepositProfit = (capitalWithDeposit - capitalWithoutDeposit) - depositAmount;

    // Pozostałe obliczenia
    const daysLeft = Math.max(0, daysToTurnover - daysSinceDeposit);
    const turnoverProgress = Math.min(100, (daysSinceDeposit / daysToTurnover) * 100);
    const completionDate = new Date(depositDate);
    completionDate.setDate(depositDate.getDate() + daysToTurnover);

    return {
      daysSinceDeposit,
      daysToTurnover,
      daysLeft,
      completionDate,
      depositAmount,
      capitalWithoutDeposit: parseFloat(capitalWithoutDeposit.toFixed(2)),
      capitalWithDeposit: parseFloat(capitalWithDeposit.toFixed(2)),
      actualDepositProfit: parseFloat(actualDepositProfit.toFixed(2)),
      turnoverProgressPercent: parseFloat(turnoverProgress.toFixed(1))
    };
  };

  return (
    <div className="space-y-6">
      {/* Liczba sygnałów */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">{translations[selectedLanguage].signals}</h2>
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex flex-col items-center justify-center">
            <div className="text-center mb-4">
              <p className="text-lg font-medium text-gray-700 mb-2">{translations[selectedLanguage].signals}</p>
              <div className="flex items-center justify-center space-x-4">
                <button 
                  onClick={() => {
                    if (dailySignals > 2) {
                      updateDailySignals(dailySignals - 1);
                    }
                  }}
                  className="p-3 text-gray-700 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed border-2 border-gray-300 rounded-full hover:border-blue-300 hover:bg-blue-50 transition-all transform hover:scale-110"
                  disabled={dailySignals <= 2}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <span className="text-4xl font-bold min-w-[4rem] text-center text-blue-600">{dailySignals}</span>
                <button 
                  onClick={() => {
                    if (dailySignals < 5) {
                      updateDailySignals(dailySignals + 1);
                    }
                  }}
                  className="p-3 text-gray-700 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed border-2 border-gray-300 rounded-full hover:border-blue-300 hover:bg-blue-50 transition-all transform hover:scale-110"
                  disabled={dailySignals >= 5}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg text-gray-900 mb-2">
                {(dailySignals * 0.6).toFixed(1)}% {selectedLanguage === 'pl' ? 'dziennie' : 'daily'}
              </div>
              <p className="text-sm text-gray-600">
                {translations[selectedLanguage].signalInfo}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statystyki zysków */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 dashboard-stats">
        <h2 className="text-xl font-bold mb-4">{translations[selectedLanguage].profitStatistics}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Całkowity zysk */}
          <div className="bg-blue-50/50 p-4 rounded-lg border-2 border-blue-100 dashboard-stats-card dashboard-stats-total">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{translations[selectedLanguage].totalProfit}</p>
                <p className="text-2xl font-bold text-blue-600 !text-blue-600 dashboard-stats-value">{profitStats.totalProfit.toFixed(2)} USDT</p>
                <p className="text-sm text-gray-500">{(profitStats.totalProfit * exchangeRates[selectedCurrency]).toFixed(2)} {selectedCurrency}</p>
              </div>
              <TrendingUp className="text-blue-500 !text-blue-500 dashboard-stats-icon" size={24} />
            </div>
          </div>

          {/* Średni dzienny zysk */}
          <div className="bg-green-50/50 p-4 rounded-lg border-2 border-green-100 dashboard-stats-card dashboard-stats-daily">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{translations[selectedLanguage].dailyProfit}</p>
                <p className="text-2xl font-bold text-green-600 !text-green-600 dashboard-stats-value">{profitStats.dailyProfit.toFixed(2)} USDT</p>
                <p className="text-sm text-gray-500">{(profitStats.dailyProfit * exchangeRates[selectedCurrency]).toFixed(2)} {selectedCurrency}</p>
              </div>
              <Clock className="text-green-500 !text-green-500 dashboard-stats-icon" size={24} />
            </div>
          </div>

          {/* Miesięczny zysk */}
          <div className="bg-purple-50/50 p-4 rounded-lg border-2 border-purple-100 dashboard-stats-card dashboard-stats-monthly">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{translations[selectedLanguage].monthlyProfit}</p>
                <p className="text-2xl font-bold text-purple-600 !text-purple-600 dashboard-stats-value">{profitStats.monthlyProfit.toFixed(2)} USDT</p>
                <p className="text-sm text-gray-500">{(profitStats.monthlyProfit * exchangeRates[selectedCurrency]).toFixed(2)} {selectedCurrency}</p>
              </div>
              <CalendarDays className="text-purple-500 !text-purple-500 dashboard-stats-icon" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Prognoza zysków */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{translations[selectedLanguage].profitForecast}</h2>
          <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg">
            <Calendar className="text-blue-600" size={20} />
            <select
              value={projectionMonths}
              onChange={(e) => setProjectionMonths(Number(e.target.value))}
              className="border-2 border-blue-200 rounded-md p-2 bg-white text-blue-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[1, 2, 3, 6, 9, 12].map((month) => (
                <option key={month} value={month}>
                  {month} {translations[selectedLanguage].months[month]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={projectionData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                interval={0}
                tick={{ fontSize: 12 }}
                domain={[0, projectionMonths]}
              />
              <YAxis 
                tickFormatter={(value) => {
                  if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}K`;
                  }
                  return value.toFixed(0);
                }}
                interval={0}
                width={40}
                domain={['auto', 'auto']}
                scale="linear"
                allowDataOverflow={false}
                tickCount={5}
              />
              <Tooltip 
                formatter={(value) => value.toFixed(2)}
                labelFormatter={(label) => `${translations[selectedLanguage].month}: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="capital" 
                stroke="#3B82F6" 
                name={`${translations[selectedLanguage].capital} (USDT)`}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="growth" 
                stroke="#10B981" 
                name={`${translations[selectedLanguage].growth} (USDT)`}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Aktywne wpłaty */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">{translations[selectedLanguage].activeDeposits}</h2>
        <div className="space-y-4">
          {history && history.filter(deposit => {
            const status = calculateTurnoverStatus(deposit);
            return status && status.daysLeft > 0;
          }).map(deposit => {
            const status = calculateTurnoverStatus(deposit);
            return (
              <div key={deposit.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-lg font-bold">{deposit.amount} USDT</div>
                    <div className="text-sm text-gray-500">{deposit.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{translations[selectedLanguage].remainingDays}:</div>
                    <div className="text-lg font-bold text-blue-600">{status.daysLeft}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${status.turnoverProgressPercent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{translations[selectedLanguage].progress}: {status.turnoverProgressPercent}%</span>
                    <span>{translations[selectedLanguage].completionDate}: {status.completionDate.toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    {translations[selectedLanguage].expectedProfit}: {status.actualDepositProfit} USDT
                  </div>
                </div>
              </div>
            );
          })}
          {(!history || history.length === 0 || !history.some(deposit => {
            const status = calculateTurnoverStatus(deposit);
            return status && status.daysLeft > 0;
          })) && (
            <div className="text-center text-gray-500 py-4">
              {translations[selectedLanguage].noActiveDeposits}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;