import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Calendar, TrendingUp, Clock, CalendarDays, ArrowUpRight, TrendingDown } from 'lucide-react';

const Calculator = ({ currentBalance, dailySignals, selectedCurrency, exchangeRates, translations, selectedLanguage }) => {
  const [projectionMonths, setProjectionMonths] = useState(3);
  const [projectionData, setProjectionData] = useState([]);
  const [profitStats, setProfitStats] = useState({
    totalProfit: 0,
    dailyProfit: 0,
    monthlyProfit: 0
  });

  // Funkcja do generowania nazw miesięcy
  const getMonthNames = (months) => {
    const monthNames = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 
                       'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const result = [];
    
    for (let i = 0; i < months; i++) {
      const monthIndex = (currentMonth + i) % 12;
      result.push(monthNames[monthIndex]);
    }
    
    return result;
  };

  // Oblicz projekcję
  useEffect(() => {
    const dailyReturn = 0.006 * dailySignals; // 0.6% dziennego zwrotu na sygnał
    const monthNames = getMonthNames(projectionMonths);
    const data = [];
    let totalGrowth = 0;

    // Dodaj punkt początkowy
    data.push({
      month: 'Teraz',
      capital: currentBalance,
      growth: 0
    });

    let capital = currentBalance;
    for (let i = 1; i <= projectionMonths; i++) {
      const monthlyGrowth = capital * dailyReturn * 30; // 30 dni w miesiącu
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
    
    // Oblicz statystyki zysków
    const totalDays = projectionMonths * 30;
    setProfitStats({
      totalProfit: totalGrowth,
      dailyProfit: totalGrowth / totalDays,
      monthlyProfit: totalGrowth / projectionMonths
    });
  }, [currentBalance, dailySignals, projectionMonths]);

  // Funkcja do przeliczania wartości na USDT
  const convertToUSDT = (value) => {
    return value / exchangeRates[selectedCurrency];
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{translations[selectedLanguage].profitForecast}</h2>
        <div className="flex items-center space-x-4">
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
      </div>

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
              labelFormatter={(label) => `Miesiąc: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="capital" 
              stroke="#3B82F6" 
              name="Kapitał (USDT)"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="growth" 
              stroke="#10B981" 
              name="Wzrost (USDT)"
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
              <p className="text-2xl font-bold">{profitStats.dailyProfit.toFixed(2)} USDT</p>
              <p className="text-sm text-gray-500">{(profitStats.dailyProfit * exchangeRates[selectedCurrency]).toFixed(2)} {selectedCurrency}</p>
            </div>
            <Clock className="text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{translations[selectedLanguage].monthlyProfit}</p>
              <p className="text-2xl font-bold">{profitStats.monthlyProfit.toFixed(2)} USDT</p>
              <p className="text-sm text-gray-500">{(profitStats.monthlyProfit * exchangeRates[selectedCurrency]).toFixed(2)} {selectedCurrency}</p>
            </div>
            <CalendarDays className="text-purple-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator; 