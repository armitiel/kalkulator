import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Calendar, AlertTriangle, RotateCcw } from 'lucide-react';

export default function WithdrawalPlanner({ 
  currentBalance, 
  dailySignals, 
  selectedCurrency, 
  exchangeRates, 
  deposits,
  withdrawalPlan,
  setWithdrawalPlan,
  translations,
  selectedLanguage
}) {
  // Funkcje pomocnicze do aktualizacji stanu
  const updateWithdrawalPlan = (updates) => {
    const newPlan = {
      ...withdrawalPlan,
      ...updates
    };
    setWithdrawalPlan(newPlan);
    
    // Zapisz do localStorage tylko potrzebne dane, bez projectionData
    const planToSave = {
      ...newPlan,
      projectionData: [] // Nie zapisujemy danych projekcji
    };
    localStorage.setItem('withdrawalPlan', JSON.stringify(planToSave));
  };

  // Funkcja do generowania nazw miesięcy z rokiem
  const getMonthName = (monthsAhead) => {
    const months = {
      pl: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 
           'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'],
      en: ['January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November', 'December']
    };
    const currentDate = new Date();
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthsAhead, 1);
    const monthName = months[selectedLanguage][targetDate.getMonth()];
    const year = targetDate.getFullYear();
    return `${monthName} ${year}`;
  };

  // Oblicz minimalną możliwą wypłatę (20 000 PLN miesięcznie)
  const calculateMinimalWithdrawal = () => {
    const dailyReturn = 0.006 * dailySignals; // 0.6% dziennego zwrotu na sygnał
    const monthlyGrowth = currentBalance * dailyReturn * 30; // 30 dni w miesiącu
    return 20000 / exchangeRates['PLN']; // Konwertuj 20 000 PLN na USDT
  };

  // Oblicz miesiąc, od którego wypłata będzie możliwa
  const calculatePossibleMonth = (withdrawalAmount) => {
    const dailyReturn = 0.006 * dailySignals;
    let capital = currentBalance;
    let month = 1;
    
    while (true) {
      const monthlyGrowth = capital * dailyReturn * 30;
      const possibleWithdrawal = (capital + monthlyGrowth) * dailyReturn * 30;
      
      if (possibleWithdrawal >= withdrawalAmount) {
        return month;
      }
      
      capital += monthlyGrowth;
      month++;
      
      if (month > 12) break; // Ogranicz do 12 miesięcy
    }
    
    return null; // Jeśli nie jest możliwe w ciągu roku
  };

  // Oblicz status obrotu dla wszystkich wpłat
  const calculateTotalTurnoverStatus = (targetDate) => {
    const ratePerSignal = 0.006; // 0,6% na sygnał
    const totalDailyRate = ratePerSignal * dailySignals;
    let totalDeposits = 0;
    let totalTurnover = 0;
    let activeDeposits = [];

    if (!deposits || !Array.isArray(deposits)) {
      return {
        totalDeposits: 0,
        completedTurnover: 0,
        activeDeposits: [],
        hasActiveDeposits: false
      };
    }

    // Oblicz dzienny zysk z całego kapitału
    const dailyProfit = currentBalance * totalDailyRate;

    deposits.forEach(deposit => {
      const depositDate = new Date(deposit.date);
      const daysSinceDeposit = Math.floor((targetDate - depositDate) / (1000 * 60 * 60 * 24));
      
      // Oblicz dni potrzebne do obrotu
      const daysToTurnover = dailyProfit > 0 ? Math.ceil(deposit.amount / dailyProfit) : Math.ceil(1 / totalDailyRate);
      
      // Oblicz udział tej wpłaty w całkowitym kapitale (z zabezpieczeniem przed dzieleniem przez zero)
      const depositShare = currentBalance > 0 ? deposit.amount / currentBalance : 1;
      
      // Oblicz dzienny zysk dla tej konkretnej wpłaty
      const dailyProfitForDeposit = dailyProfit * depositShare;
      
      // Oblicz całkowity zysk z tej wpłaty na dzisiaj
      const totalProfit = dailyProfitForDeposit * daysSinceDeposit;
      
      // Zysk z obrotu to całkowity zysk bez ograniczenia do kwoty wpłaty
      const turnoverForDeposit = totalProfit;
      
      // Sprawdź czy obrót jest zakończony (gdy zysk osiągnął wartość wpłaty)
      const isCompleted = totalProfit >= deposit.amount;
      
      if (!isCompleted) {
        // Oblicz pozostałe dni do obrotu
        const daysLeft = Math.max(0, daysToTurnover - daysSinceDeposit);
        
        // Oblicz przewidywany przyszły zysk (pozostałe dni * dzienny zysk z wpłaty)
        const projectedFutureProfit = daysLeft * dailyProfitForDeposit;
        
        // Oblicz szacowaną datę zakończenia obrotu
        const estimatedCompletionDate = new Date(depositDate);
        estimatedCompletionDate.setDate(depositDate.getDate() + daysToTurnover);
        
        activeDeposits.push({
          amount: deposit.amount,
          remainingTurnover: deposit.amount - turnoverForDeposit,
          daysLeft: daysLeft,
          projectedFutureProfit: parseFloat(projectedFutureProfit.toFixed(2)),
          dailyProfitForDeposit: parseFloat(dailyProfitForDeposit.toFixed(2)),
          estimatedCompletionDate: estimatedCompletionDate
        });
      }
      
      totalDeposits += deposit.amount;
      totalTurnover += turnoverForDeposit;
    });

    return {
      totalDeposits,
      completedTurnover: totalTurnover,
      activeDeposits,
      hasActiveDeposits: activeDeposits.length > 0
    };
  };

  // Dodaj funkcję resetowania
  const handleReset = () => {
    updateWithdrawalPlan({
      monthlyWithdrawal: 0,
      inputValue: '',
      startMonth: 0,
      projectionMonths: 12,
      projectionData: [],
      error: '',
      withdrawalFee: { rate: 0.05, amount: 0 },
      possibleStartMonth: 0
    });
  };

  // Zmodyfikuj funkcję calculatePossibleStartMonth
  const calculatePossibleStartMonth = (amount) => {
    if (amount <= 0) return { month: 0, year: new Date().getFullYear() };

    const dailyReturn = 0.006 * dailySignals;
    const monthlyReturn = Math.pow(1 + dailyReturn, 30) - 1;
    let capital = currentBalance;
    let month = 0;
    const startDate = new Date();

    // Sprawdź aktualny miesiąc
    const currentMonthlyGrowth = capital * monthlyReturn;
    if (currentMonthlyGrowth >= amount) return { month: 0, year: startDate.getFullYear() };

    // Symuluj wzrost kapitału przez 5 lat (60 miesięcy)
    while (month < 60) {
      month++;
      capital = capital * (1 + monthlyReturn);
      const possibleWithdrawal = capital * monthlyReturn;
      
      if (possibleWithdrawal >= amount) {
        const targetDate = new Date(startDate.getFullYear(), startDate.getMonth() + month, 1);
        return {
          month: month,
          year: targetDate.getFullYear(),
          totalMonths: month
        };
      }
    }

    return { month: -1, year: startDate.getFullYear() + 5 };
  };

  // Aktualizuj możliwy miesiąc przy zmianie kwoty
  useEffect(() => {
    const possibleDate = calculatePossibleStartMonth(withdrawalPlan.monthlyWithdrawal);
    
    if (possibleDate.month === -1) {
      updateWithdrawalPlan({
        possibleStartMonth: possibleDate.month,
        error: translations[selectedLanguage].withdrawalNotPossible
      });
      
      // Ustaw miesiąc początkowy na pierwszy miesiąc, jeśli obecny jest niedozwolony
      if (withdrawalPlan.startMonth === 0) {
        updateWithdrawalPlan({
          startMonth: 1
        });
      }
    } else if (possibleDate.month > 0) {
      const monthText = getMonthName(possibleDate.month);
      const monthsText = translations[selectedLanguage].months[possibleDate.totalMonths > 4 ? 5 : possibleDate.totalMonths];
      const errorMessage = `${translations[selectedLanguage].withdrawalPossibleFrom}: ${monthText} (${possibleDate.totalMonths} ${monthsText})`;
      
      updateWithdrawalPlan({
        possibleStartMonth: possibleDate.month,
        error: errorMessage
      });
      
      // Ustaw miesiąc początkowy na możliwy miesiąc, jeśli obecny jest niedozwolony
      if (withdrawalPlan.startMonth < possibleDate.month) {
        updateWithdrawalPlan({
          startMonth: possibleDate.month
        });
      }
    } else {
      updateWithdrawalPlan({
        possibleStartMonth: possibleDate.month,
        error: ''
      });
    }
  }, [withdrawalPlan.monthlyWithdrawal, currentBalance, dailySignals]);

  // Oblicz projekcję
  useEffect(() => {
    if (withdrawalPlan.monthlyWithdrawal <= 0) {
      updateWithdrawalPlan({
        projectionData: [],
        error: ''
      });
      return;
    }

    const dailyReturn = 0.006 * dailySignals;
    // Wzrost złożony miesięczny: (1 + dailyReturn)^30 - 1
    const monthlyReturn = Math.pow(1 + dailyReturn, 30) - 1;
    
    if (withdrawalPlan.startMonth < withdrawalPlan.possibleStartMonth && withdrawalPlan.possibleStartMonth !== -1) {
      updateWithdrawalPlan({
        projectionData: [],
        error: `Wypłata ${withdrawalPlan.monthlyWithdrawal.toFixed(2)} USDT będzie możliwa dopiero od ${getMonthName(withdrawalPlan.possibleStartMonth)}`
      });
      return;
    }

    const data = [];
    let capital = currentBalance;
    let baseCapital = currentBalance;
    let accumulatedGrowth = 0;
    let capitalDeclineMonth = null;
    let previousCapital = capital;

    // Dodaj punkt początkowy
    data.push({
      month: 'Teraz',
      capital: capital,
      withdrawal: 0,
      growth: 0,
      fee: 0,
      warning: '',
      planned: 0
    });

    // Oblicz dla każdego miesiąca
    for (let i = 1; i <= withdrawalPlan.projectionMonths; i++) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() + i);
      
      const turnoverStatus = calculateTotalTurnoverStatus(monthDate);
      const monthlyGrowth = capital * monthlyReturn;
      const plannedWithdrawal = i >= withdrawalPlan.startMonth ? withdrawalPlan.monthlyWithdrawal : 0;
      let actualWithdrawal = plannedWithdrawal;
      let warning = '';
      let fee = 0;

      // Sprawdź czy stać nas na wypłatę
      if (actualWithdrawal > monthlyGrowth) {
        warning = `${translations[selectedLanguage].withdrawalWarning} (${monthlyGrowth.toFixed(2)} USDT)`;
        actualWithdrawal = monthlyGrowth; // Ogranicz wypłatę do miesięcznego zysku
      }

      // Sprawdź czy wypłata wpłynie na aktywne obroty
      if (actualWithdrawal > 0 && turnoverStatus.hasActiveDeposits) {
        const activeDepositsInfo = turnoverStatus.activeDeposits
          .map(d => `${d.amount} USDT (${translations[selectedLanguage].completionDate}: ${d.estimatedCompletionDate.toLocaleDateString()})`)
          .join(', ');
        
        const activeTurnoversMessage = `${translations[selectedLanguage].activeTurnovers}: ${activeDepositsInfo}`;
        warning = warning ? `${warning}\n${activeTurnoversMessage}` : activeTurnoversMessage;
        fee = actualWithdrawal * 0.20; // 20% opłaty przy aktywnych obrotach
      } else {
        fee = actualWithdrawal * 0.05; // 5% standardowej opłaty
      }

      capital = capital + monthlyGrowth - actualWithdrawal - fee;
      accumulatedGrowth += monthlyGrowth;
      
      // Sprawdź czy kapitał zaczyna spadać poniżej poprzedniej wartości
      if (i >= withdrawalPlan.startMonth && capital < previousCapital && capitalDeclineMonth === null) {
        capitalDeclineMonth = i;
      }
      
      // Zaktualizuj poprzedni kapitał dla następnej iteracji
      previousCapital = capital;

      data.push({
        month: getMonthName(i),
        capital: capital,
        withdrawal: actualWithdrawal,
        growth: monthlyGrowth,
        fee: fee,
        warning: warning,
        planned: plannedWithdrawal
      });
    }

    updateWithdrawalPlan({
      projectionData: data,
      error: '',
      capitalDeclineMonth: capitalDeclineMonth
    });
  }, [currentBalance, dailySignals, withdrawalPlan.monthlyWithdrawal, withdrawalPlan.startMonth, withdrawalPlan.projectionMonths, withdrawalPlan.possibleStartMonth, translations, selectedLanguage]);

  // Oblicz dzienny zysk
  useEffect(() => {
    const dailyReturn = 0.006; // 0.6% dziennego zwrotu
    const profit = currentBalance * dailyReturn * dailySignals;
    updateWithdrawalPlan({ dailyProfit: profit });
  }, [currentBalance, dailySignals]);

  // Oblicz opłatę za wypłatę
  const calculateWithdrawalFee = (amount) => {
    if (amount <= 0) return { rate: 0.05, amount: 0 };
    
    // Sprawdź status obrotu na datę pierwszej wypłaty
    const withdrawalDate = new Date();
    withdrawalDate.setMonth(withdrawalDate.getMonth() + withdrawalPlan.startMonth);
    
    const turnoverStatus = calculateTotalTurnoverStatus(withdrawalDate);
    
    // Jeśli są aktywne obroty w momencie planowanej wypłaty
    if (turnoverStatus.hasActiveDeposits) {
      return { rate: 0.20, amount: amount * 0.20 }; // 20% opłaty
    } else {
      return { rate: 0.05, amount: amount * 0.05 }; // 5% opłaty
    }
  };

  // Aktualizuj opłatę przy zmianie kwoty wypłaty
  useEffect(() => {
    const fee = calculateWithdrawalFee(withdrawalPlan.monthlyWithdrawal);
    updateWithdrawalPlan({ withdrawalFee: fee });
  }, [withdrawalPlan.monthlyWithdrawal, deposits, dailySignals, withdrawalPlan.startMonth]);

  const chartData = {
    labels: withdrawalPlan.projectionData.map(data => data.month),
    datasets: [
      {
        label: `Kapitał (${selectedCurrency})`,
        data: withdrawalPlan.projectionData.map(data => data.capital * exchangeRates[selectedCurrency]),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: `Wypłaty (${selectedCurrency})`,
        data: withdrawalPlan.projectionData.map(data => data.withdrawal * exchangeRates[selectedCurrency]),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      }
    ]
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{translations[selectedLanguage].withdrawalPlanning}</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleReset}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title={translations[selectedLanguage].reset || "Reset"}
          >
            <RotateCcw size={20} />
          </button>
          <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg">
            <Calendar className="text-blue-600" size={20} />
            <select
              value={withdrawalPlan.projectionMonths}
              onChange={(e) => updateWithdrawalPlan({ projectionMonths: Number(e.target.value) })}
              className="border-2 border-blue-200 rounded-md p-2 bg-white text-blue-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={3}>3 {translations[selectedLanguage].months[3]}</option>
              <option value={6}>6 {translations[selectedLanguage].months[5]}</option>
              <option value={12}>12 {translations[selectedLanguage].months[5]}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {translations[selectedLanguage].monthlyWithdrawal} ({selectedCurrency})
          </label>
          <div className="relative">
            <input
              type="text"
              value={withdrawalPlan.inputValue}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d.]/g, '');
                const parts = value.split('.');
                if (parts.length > 2) return;
                if (parts[1] && parts[1].length > 2) return;
                
                const numericValue = parseFloat(value) || 0;
                updateWithdrawalPlan({
                  inputValue: value,
                  monthlyWithdrawal: numericValue / exchangeRates[selectedCurrency],
                  projectionData: [] // Wymuszamy przeliczenie projekcji
                });
              }}
              onBlur={(e) => {
                const value = parseFloat(e.target.value) || 0;
                updateWithdrawalPlan({
                  inputValue: value.toFixed(2),
                  monthlyWithdrawal: value / exchangeRates[selectedCurrency],
                  projectionData: [] // Wymuszamy przeliczenie projekcji
                });
              }}
              className="w-full p-2 border rounded-md pr-12"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-2 text-gray-500">
              {selectedCurrency}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {translations[selectedLanguage].valueInUSDT}: {withdrawalPlan.monthlyWithdrawal.toFixed(2)}
          </p>
          {withdrawalPlan.monthlyWithdrawal > 0 && (
            <div className="mt-2 p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="text-amber-500 mr-2" size={16} />
                <p className="text-sm text-gray-700">
                  {translations[selectedLanguage].withdrawalFee}: {withdrawalPlan.withdrawalFee.rate * 100}% ({(withdrawalPlan.withdrawalFee.amount * exchangeRates[selectedCurrency]).toFixed(2)} {selectedCurrency})
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {withdrawalPlan.withdrawalFee.rate === 0.20 ? 
                  translations[selectedLanguage].higherFeeDueToIncompleteTurnover : 
                  translations[selectedLanguage].standardFeeFullTurnover
                }
              </p>
              {withdrawalPlan.possibleStartMonth > 0 && withdrawalPlan.possibleStartMonth !== -1 && (
                <div className="mt-2 flex items-center text-amber-600">
                  <AlertTriangle className="mr-1" size={16} />
                  <p className="text-sm">
                    {withdrawalPlan.error}
                  </p>
                </div>
              )}
              {withdrawalPlan.possibleStartMonth === -1 && (
                <div className="mt-2 flex items-center text-red-600">
                  <AlertTriangle className="mr-1" size={16} />
                  <p className="text-sm">
                    {withdrawalPlan.error}
                  </p>
                </div>
              )}
              {withdrawalPlan.capitalDeclineMonth && withdrawalPlan.monthlyWithdrawal > 0 && (
                <div className="mt-2 flex items-center text-amber-600">
                  <AlertTriangle className="mr-1" size={16} />
                  <p className="text-sm">
                    {translations[selectedLanguage].capitalDecline || 'Kapitał zacznie maleć od'}: {getMonthName(withdrawalPlan.capitalDeclineMonth)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {translations[selectedLanguage].startWithdrawalsFromMonth}
          </label>
          <select
            value={withdrawalPlan.startMonth}
            onChange={(e) => {
              const newStartMonth = Number(e.target.value);
              updateWithdrawalPlan({ 
                startMonth: newStartMonth,
                projectionData: [] // Wymuszamy przeliczenie projekcji
              });
            }}
            className={`w-full p-2 border rounded-md ${withdrawalPlan.startMonth < withdrawalPlan.possibleStartMonth ? 'border-red-500' : ''}`}
          >
            <option 
              value={0} 
              disabled={withdrawalPlan.possibleStartMonth !== 0}
            >
              {translations[selectedLanguage].immediately}
              {withdrawalPlan.possibleStartMonth !== 0 && ` (${translations[selectedLanguage].tooEarly})`}
            </option>
            {Array.from({ length: 12 }, (_, i) => (
              <option 
                key={i + 1} 
                value={i + 1}
                disabled={withdrawalPlan.possibleStartMonth > 0 && i + 1 < withdrawalPlan.possibleStartMonth}
              >
                {getMonthName(i + 1)}
                {withdrawalPlan.possibleStartMonth > 0 && i + 1 < withdrawalPlan.possibleStartMonth && ` (${translations[selectedLanguage].tooEarly})`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-96 mt-6 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={withdrawalPlan.projectionData.map(item => ({
              ...item,
              capital: item.capital * exchangeRates[selectedCurrency],
              withdrawal: item.withdrawal * exchangeRates[selectedCurrency],
              planned: item.planned * exchangeRates[selectedCurrency],
              growth: item.growth * exchangeRates[selectedCurrency],
              month: item.month
            }))}
            margin={{ top: 5, right: 20, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              dy={10}
              position="bottom"
              tick={{ fontSize: 12 }}
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
            <Tooltip formatter={(value) => value.toFixed(2)} />
            <Legend verticalAlign="top" />
            <Line 
              type="monotone" 
              dataKey="capital" 
              stroke="#3B82F6" 
              name={`${translations[selectedLanguage].capital} (${selectedCurrency})`}
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="planned" 
              stroke="#EF4444" 
              name={`${translations[selectedLanguage].withdrawals} (${selectedCurrency})`}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {withdrawalPlan.projectionData.length > 0 && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 mobile-responsive-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{translations[selectedLanguage].month}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{translations[selectedLanguage].capital}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{translations[selectedLanguage].growth}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{translations[selectedLanguage].withdrawal}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{translations[selectedLanguage].fee}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawalPlan.projectionData.map((data, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label={translations[selectedLanguage].month}>{data.month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" data-label={translations[selectedLanguage].capital}>
                      {data.capital.toFixed(2)} USDT
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600" data-label={translations[selectedLanguage].growth}>
                      +{data.growth.toFixed(2)} USDT
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600" data-label={translations[selectedLanguage].withdrawal}>
                      {data.withdrawal > 0 ? `-${data.withdrawal.toFixed(2)} USDT` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label={translations[selectedLanguage].fee}>
                      <div className="text-sm text-gray-900">{data.fee.toFixed(2)} USDT</div>
                      {data.warning && (
                        <div className="text-xs text-amber-600 mt-1 whitespace-normal break-words">
                          {data.warning.split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                              {line}
                              {i < data.warning.split('\n').length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 