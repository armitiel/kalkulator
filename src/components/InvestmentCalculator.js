import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const InvestmentCalculator = ({ currentBalance, dailySignals, onUpdate }) => {
  const [predictionData, setPredictionData] = useState([]);
  const [timeRange, setTimeRange] = useState(30); // dni
  const [dailyProfit, setDailyProfit] = useState(0);

  useEffect(() => {
    calculatePrediction();
  }, [currentBalance, dailySignals, timeRange]);

  const calculatePrediction = () => {
    const data = [];
    let balance = parseFloat(currentBalance);
    const dailyReturn = 0.006 * dailySignals; // 0.6% na sygnał
    const dailyIncrease = balance * dailyReturn;

    // Oblicz aktualny dzienny zysk
    setDailyProfit(dailyIncrease);

    for (let day = 0; day <= timeRange; day++) {
      data.push({
        day: `Dzień ${day}`,
        balance: parseFloat(balance.toFixed(2))
      });
      balance += dailyIncrease;
    }

    setPredictionData(data);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Panel ustawień */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Ustawienia kalkulatora</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stan konta (USDT)
            </label>
            <input
              type="number"
              value={currentBalance}
              onChange={(e) => onUpdate('currentBalance', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Liczba sygnałów dziennie
            </label>
            <input
              type="number"
              value={dailySignals}
              onChange={(e) => onUpdate('dailySignals', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zakres czasu (dni)
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value={7}>7 dni</option>
              <option value={14}>14 dni</option>
              <option value={30}>30 dni</option>
              <option value={60}>60 dni</option>
              <option value={90}>90 dni</option>
            </select>
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Przewidywane wyniki:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Dzienny zysk</div>
                <div className="text-lg font-semibold">{dailyProfit.toFixed(2)} USDT</div>
                <div className="text-sm text-green-600">+{(dailyProfit / currentBalance * 100).toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Zysk w okresie</div>
                <div className="text-lg font-semibold">
                  {(dailyProfit * timeRange).toFixed(2)} USDT
                </div>
                <div className="text-sm text-green-600">+{(dailyProfit * timeRange / currentBalance * 100).toFixed(2)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wykres predykcji */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Przewidywany wzrost kapitału</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={predictionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#3B82F6"
              name="Stan konta (USDT)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InvestmentCalculator; 