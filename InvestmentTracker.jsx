import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, Clock, DollarSign, TrendingUp, BarChart2, Settings, PieChart, AlertTriangle } from 'lucide-react';

const InvestmentDashboard = () => {
  // Stan aplikacji - w rzeczywistej aplikacji byłby pobierany z bazy danych
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(3870.40);
  
  // Przykładowe dane
  const capitalData = [
    { date: '01.02.2024', amount: 2000 },
    { date: '15.02.2024', amount: 2131.84 },
    { date: '29.02.2024', amount: 2292 },
    { date: '15.03.2024', amount: 2765.41 },
    { date: '31.03.2024', amount: 3199.29 },
    { date: '15.04.2024', amount: 3870.40 },
    { date: '30.04.2024', amount: 5100 },
    { date: '15.05.2024', amount: 7100 },
    { date: '31.05.2024', amount: 9400 },
  ];
  
  const deposits = [
    { id: 1, date: '01.02.2024', amount: 2000, status: 'completed', requiredTurnoverDays: 30, turnoverCompleted: true, completionDate: '03.03.2024' },
    { id: 2, date: '15.03.2024', amount: 500, status: 'active', requiredTurnoverDays: 30, turnoverCompleted: false, daysLeft: 10, completionDate: '14.04.2024' },
    { id: 3, date: '01.04.2024', amount: 800, status: 'active', requiredTurnoverDays: 30, turnoverCompleted: false, daysLeft: 27, completionDate: '01.05.2024' },
  ];
  
  const plannedWithdrawals = [
    { id: 1, date: '01.07.2024', amount: 3040, status: 'planned', comment: 'Pierwsza wypłata' },
    { id: 2, date: '01.08.2024', amount: 5060, status: 'planned', comment: 'Druga wypłata' },
  ];
  
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Nagłówek */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Investment Tracker</h1>
          <div className="flex items-center space-x-2">
            <div className="bg-blue-500 p-2 rounded-md">
              <span className="font-semibold">Stan konta:</span> {capitalData[capitalData.length-1].amount.toFixed(2)} USDT ({(capitalData[capitalData.length-1].amount * 3.95).toFixed(0)} PLN)
            </div>
            <button className="bg-blue-700 p-2 rounded-md">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>
      
      {/* Menu nawigacyjne */}
      <nav className="bg-white shadow-md">
        <div className="flex p-1">
          <button 
            className={`flex items-center space-x-1 p-3 ${activeTab === 'dashboard' ? 'bg-blue-100 text-blue-600 rounded-md' : 'text-gray-600'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <TrendingUp size={18} />
            <span>Dashboard</span>
          </button>
          <button 
            className={`flex items-center space-x-1 p-3 ${activeTab === 'deposits' ? 'bg-blue-100 text-blue-600 rounded-md' : 'text-gray-600'}`}
            onClick={() => setActiveTab('deposits')}
          >
            <DollarSign size={18} />
            <span>Wpłaty</span>
          </button>
          <button 
            className={`flex items-center space-x-1 p-3 ${activeTab === 'withdrawals' ? 'bg-blue-100 text-blue-600 rounded-md' : 'text-gray-600'}`}
            onClick={() => setActiveTab('withdrawals')}
          >
            <Calendar size={18} />
            <span>Wypłaty</span>
          </button>
          <button 
            className={`flex items-center space-x-1 p-3 ${activeTab === 'analytics' ? 'bg-blue-100 text-blue-600 rounded-md' : 'text-gray-600'}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart2 size={18} />
            <span>Analityka</span>
          </button>
        </div>
      </nav>
      
      {/* Główna zawartość */}
      <main className="flex-1 p-4 overflow-auto">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stan aktualny */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Stan aktualny</h2>
                <button 
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  onClick={() => setIsEditingBalance(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edytuj stan konta
                </button>
              </div>
              
              {isEditingBalance ? (
                <div className="bg-blue-500 text-white p-5 rounded-md text-center mb-3">
                  <div className="text-sm mb-1">Łączny kapitał</div>
                  <div className="mb-2">
                    <input 
                      type="number" 
                      value={currentBalance}
                      onChange={(e) => setCurrentBalance(parseFloat(e.target.value))}
                      className="text-2xl font-bold text-gray-800 w-48 p-2 rounded text-center mx-auto"
                      step="0.01"
                    />
                    <div className="text-sm mt-1">USDT</div>
                  </div>
                  <div className="flex justify-center space-x-2">
                    <button 
                      className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded"
                      onClick={() => setIsEditingBalance(false)}
                    >
                      Zapisz
                    </button>
                    <button 
                      className="bg-gray-600 hover:bg-gray-700 px-4 py-1 rounded"
                      onClick={() => {
                        setCurrentBalance(3870.40);
                        setIsEditingBalance(false);
                      }}
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-500 text-white p-5 rounded-md text-center mb-3">
                  <div className="text-sm mb-1">Łączny kapitał</div>
                  <div className="text-3xl font-bold">
                    {currentBalance.toFixed(2)} USDT
                  </div>
                  <div className="text-lg">({(currentBalance * 3.95).toFixed(0)} PLN)</div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="p-3 bg-green-500 text-white rounded-md text-center">
                  <div className="text-sm">Zysk całkowity</div>
                  <div className="text-xl font-semibold">1,870.40 USDT</div>
                  <div className="text-sm">(7,388 PLN)</div>
                </div>
                <div className="p-3 bg-purple-500 text-white rounded-md text-center">
                  <div className="text-sm">Wzrost od początku</div>
                  <div className="text-xl font-semibold">93.5%</div>
                </div>
              </div>
            </div>
            
            {/* Wykres kapitału */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Wzrost kapitału</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={capitalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="amount" stroke="#3B82F6" fill="#93C5FD" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Aktywne wpłaty wymagające obrotu */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Aktywne wpłaty wymagające obrotu</h2>
              {deposits.filter(d => !d.turnoverCompleted).map(deposit => (
                <div key={deposit.id} className="mb-4 p-3 border rounded-md">
                  <div className="flex justify-between">
                    <span className="font-medium">{deposit.amount} USDT</span>
                    <span className="text-gray-500">{deposit.date}</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm">
                      <span>Pozostało dni:</span>
                      <span className="font-medium">{deposit.daysLeft}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${((30 - deposit.daysLeft) / 30) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Szacowana data zakończenia: {deposit.completionDate}
                  </div>
                </div>
              ))}
              <button className="w-full mt-2 p-2 bg-blue-500 text-white rounded-md">+ Dodaj nową wpłatę</button>
            </div>
            
            {/* Zaplanowane wypłaty */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Zaplanowane wypłaty</h2>
              {plannedWithdrawals.map(withdrawal => (
                <div key={withdrawal.id} className="mb-3 p-3 border rounded-md">
                  <div className="flex justify-between">
                    <span className="font-medium">{withdrawal.amount} USDT</span>
                    <span className="text-gray-500">{withdrawal.date}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {withdrawal.comment}
                  </div>
                </div>
              ))}
              <button className="w-full mt-2 p-2 bg-blue-500 text-white rounded-md">+ Zaplanuj wypłatę</button>
            </div>
            
            {/* Statystyki */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Statystyki inwestycji</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-md">
                  <div className="text-sm text-gray-600">Dzienny przyrost</div>
                  <div className="text-xl font-semibold">69.84 USDT</div>
                  <div className="text-sm text-green-600">+1.8% (276 PLN)</div>
                </div>
                <div className="p-3 bg-green-50 rounded-md">
                  <div className="text-sm text-gray-600">Miesięczny zysk</div>
                  <div className="text-xl font-semibold">2,094 USDT</div>
                  <div className="text-sm text-green-600">+54% (8,271 PLN)</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-md">
                  <div className="text-sm text-gray-600">Aktywne sygnały</div>
                  <div className="text-xl font-semibold">3 dziennie</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-md">
                  <div className="text-sm text-gray-600">Kurs USDT/PLN</div>
                  <div className="text-xl font-semibold">3.95 PLN</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'deposits' && (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Historia wpłat</h2>
              <button className="p-2 bg-blue-500 text-white rounded-md">+ Dodaj wpłatę</button>
            </div>
            
            {/* Formularz nowej wpłaty */}
            <div className="mb-6 p-4 border rounded-md bg-gray-50">
              <h3 className="text-md font-medium mb-3">Nowa wpłata</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Kwota (USDT)</label>
                  <input type="number" className="w-full p-2 border rounded-md" placeholder="500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Data wpłaty</label>
                  <input type="date" className="w-full p-2 border rounded-md" />
                </div>
                <div className="flex items-end">
                  <button className="w-full p-2 bg-green-500 text-white rounded-md">Dodaj wpłatę</button>
                </div>
              </div>
              <div className="mt-3 text-sm">
                <div className="flex items-center text-gray-700">
                  <AlertTriangle size={16} className="mr-1 text-yellow-500" />
                  <span>Wymagany 100% obrót przez 30 dni aby uniknąć 20% opłaty przy wypłacie</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium text-gray-500">Data</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-500">Kwota</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-500">Status obrotu</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-500">Pozostało dni</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-500">Data zakończenia</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-500">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {deposits.map(deposit => (
                    <tr key={deposit.id}>
                      <td className="p-3 text-sm">{deposit.date}</td>
                      <td className="p-3 text-sm font-medium">{deposit.amount} USDT</td>
                      <td className="p-3 text-sm">
                        {deposit.turnoverCompleted ? 
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Zakończony</span> : 
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">W trakcie</span>
                        }
                      </td>
                      <td className="p-3 text-sm">{deposit.turnoverCompleted ? '-' : deposit.daysLeft}</td>
                      <td className="p-3 text-sm">{deposit.completionDate}</td>
                      <td className="p-3 text-sm">
                        <button className="text-blue-500 hover:text-blue-700">Szczegóły</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'withdrawals' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Planowane wypłaty</h2>
                <button className="p-2 bg-blue-500 text-white rounded-md">+ Zaplanuj wypłatę</button>
              </div>
              
              {/* Formularz nowej wypłaty */}
              <div className="mb-6 p-4 border rounded-md bg-gray-50">
                <h3 className="text-md font-medium mb-3">Zaplanuj wypłatę</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Kwota (USDT)</label>
                    <input type="number" className="w-full p-2 border rounded-md" placeholder="3000" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Data wypłaty</label>
                    <input type="date" className="w-full p-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Komentarz</label>
                    <input type="text" className="w-full p-2 border rounded-md" placeholder="Opis wypłaty" />
                  </div>
                </div>
                <div className="mt-3">
                  <button className="w-full p-2 bg-green-500 text-white rounded-md">Zaplanuj wypłatę</button>
                </div>
              </div>
              
              <div className="space-y-3">
                {plannedWithdrawals.map(withdrawal => (
                  <div key={withdrawal.id} className="p-3 border rounded-md">
                    <div className="flex justify-between">
                      <span className="font-medium">{withdrawal.amount} USDT</span>
                      <span className="text-gray-500">{withdrawal.date}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {withdrawal.comment}
                    </div>
                    <div className="mt-2 flex space-x-2">
                      <button className="text-sm text-blue-500">Edytuj</button>
                      <button className="text-sm text-red-500">Usuń</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Kalkulator bezpiecznej wypłaty</h2>
              <div className="p-4 border rounded-md">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Data planowanej wypłaty</label>
                    <input type="date" className="w-full p-2 border rounded-md" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Liczba sygnałów dziennie</label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="2">2 sygnały (1.2%)</option>
                        <option value="3" selected>3 sygnały (1.8%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">% zysku na reinwestycję</label>
                      <input type="number" className="w-full p-2 border rounded-md" placeholder="30" />
                    </div>
                  </div>
                  <button className="w-full p-2 bg-blue-500 text-white rounded-md">Oblicz bezpieczną wypłatę</button>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <h3 className="font-medium mb-2">Wyniki kalkulacji:</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">Przewidywany kapitał:</div>
                    <div className="font-medium">17,600 USDT</div>
                    
                    <div className="text-gray-600">Przewidywany zysk:</div>
                    <div className="font-medium">10,200 USDT</div>
                    
                    <div className="text-gray-600">Bezpieczna wypłata:</div>
                    <div className="font-medium text-green-600">7,140 USDT (28,200 PLN)</div>
                    
                    <div className="text-gray-600">Pozostaje na wzrost:</div>
                    <div className="font-medium">3,060 USDT</div>
                    
                    <div className="text-gray-600">% wzrostu kapitału:</div>
                    <div className="font-medium">17.4%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Wzrost kapitału</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={capitalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#3B82F6" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Dzienne przyrosty</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={capitalData.slice(1).map((item, index) => ({
                  date: item.date,
                  growth: item.amount - capitalData[index].amount
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="growth" fill="#4ADE80" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md col-span-1 md:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Projekcje przyszłego wzrostu</h2>
              <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 mb-4">
                <select className="p-2 border rounded-md">
                  <option>3 miesiące</option>
                  <option>6 miesięcy</option>
                  <option>12 miesięcy</option>
                </select>
                <select className="p-2 border rounded-md">
                  <option>2 sygnały dziennie (1.2%)</option>
                  <option selected>3 sygnały dziennie (1.8%)</option>
                </select>
                <select className="p-2 border rounded-md">
                  <option>Bez wypłat</option>
                  <option>12,000 PLN miesięcznie</option>
                  <option>30% zysku miesięcznie</option>
                </select>
                <button className="p-2 bg-blue-500 text-white rounded-md">Przelicz</button>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#3B82F6" name="Bez wypłat" />
                  <Line type="monotone" dataKey="value" stroke="#F59E0B" name="Z wypłatami" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default InvestmentDashboard;