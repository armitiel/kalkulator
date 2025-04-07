import React, { useState, useEffect } from 'react';
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
  selectedLanguage 
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

  // Funkcja do generowania nazw miesięcy
  const getMonthNames = (months) => {
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
  };
  
  // Obliczanie dziennego i miesięcznego zysku z wzrostem złożonym
  useEffect(() => {
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
  }, [currentBalance, dailySignals, projectionMonths, translations, selectedLanguage]);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Główne wskaźniki */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
        
        {/* Liczba sygnałów */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">{translations[selectedLanguage].signals}</p>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => {
                  if (dailySignals > 2) {
                    updateDailySignals(dailySignals - 1);
                  }
                }}
                className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200 rounded-full hover:border-blue-200 transition-colors"
                disabled={dailySignals <= 2}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="text-xl font-bold min-w-[2rem] text-center">{dailySignals}</span>
              <button 
                onClick={() => {
                  if (dailySignals < 5) {
                    updateDailySignals(dailySignals + 1);
                  }
                }}
                className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200 rounded-full hover:border-blue-200 transition-colors"
                disabled={dailySignals >= 5}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {translations[selectedLanguage].signalInfo} ({dailySignals} {translations[selectedLanguage].signals} = {(dailySignals * 0.6).toFixed(1)}% {selectedLanguage === 'pl' ? 'dziennie' : 'daily'})
          </div>
        </div>
      </div>
      
      {/* Informacje o stanie konta i wybór okresu projekcji */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h2 className="text-xl font-bold mr-4">{translations[selectedLanguage].profitForecast}</h2>
          <div className="flex items-center bg-blue-50 p-2 rounded-lg">
            <span className="text-sm mr-2">{translations[selectedLanguage].balance}:</span>
            {isEditingBalance ? (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-24 p-1 text-gray-800 border rounded"
                  step="0.01"
                  min="0"
                  autoFocus
                />
                <button
                  onClick={() => {
                    const newBalance = parseFloat(editValue);
                    if (!isNaN(newBalance) && newBalance >= 0) {
                      updateBalance(newBalance);
                      setIsEditingBalance(false);
                      setEditValue('');
                    }
                  }}
                  className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setIsEditingBalance(false);
                    setEditValue('');
                  }}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <span className="font-semibold mr-2">{currentBalance.toFixed(2)} USDT</span>
                <button
                  onClick={() => {
                    setEditValue(currentBalance.toString());
                    setIsEditingBalance(true);
                  }}
                  className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                  title={translations[selectedLanguage].editBalance}
                >
                  <Pencil className="text-blue-600" size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
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
      
      {/* Wykres projekcji */}
      <div className="h-96">
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
              tickFormatter={(value) => value.toFixed(0)}
              interval={0}
              width={40}
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
      
      {/* Statystyki zysków */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{translations[selectedLanguage].totalProfit}</p>
              <p className="text-2xl font-bold">{profitStats.totalProfit.toFixed(2)} USDT</p>
              <p className="text-sm text-gray-500">{(profitStats.totalProfit * exchangeRates[selectedCurrency]).toFixed(2)} {selectedCurrency}</p>
            </div>
            <TrendingUp className="text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{translations[selectedLanguage].dailyAverage}</p>
              <p className="text-2xl font-bold">{(profitStats.totalProfit / (projectionMonths * 30)).toFixed(2)} USDT</p>
              <p className="text-sm text-gray-500">{((profitStats.totalProfit / (projectionMonths * 30)) * exchangeRates[selectedCurrency]).toFixed(2)} {selectedCurrency}</p>
            </div>
            <Clock className="text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{translations[selectedLanguage].monthlyProfit}</p>
              <p className="text-2xl font-bold">{(profitStats.totalProfit / projectionMonths).toFixed(2)} USDT</p>
              <p className="text-sm text-gray-500">{((profitStats.totalProfit / projectionMonths) * exchangeRates[selectedCurrency]).toFixed(2)} {selectedCurrency}</p>
            </div>
            <CalendarDays className="text-purple-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;