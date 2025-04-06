const API_URL = 'http://localhost:5000/api';

// Funkcje pomocnicze do obsługi API
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Wystąpił błąd podczas wykonywania operacji');
  }
  return response.json();
};

// Funkcje autoryzacji
export const register = async (username, password) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(response);
};

export const login = async (username, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(response);
};

// Funkcje portfela
export const getPortfolio = async (token) => {
  const response = await fetch(`${API_URL}/portfolio`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

export const updatePortfolio = async (token, data) => {
  try {
    const response = await fetch(`${API_URL}/portfolio`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_balance: Number(data.current_balance),
        daily_signals: Number(data.daily_signals)
      }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Błąd podczas aktualizacji portfela:', error);
    throw error;
  }
};

// Funkcje transakcji
export const getTransactions = async (token) => {
  const response = await fetch(`${API_URL}/transactions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

export const addTransaction = async (token, transaction) => {
  try {
    const response = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: transaction.date,
        amount: Number(transaction.amount),
        type: transaction.type,
        description: transaction.description
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Wystąpił błąd podczas dodawania transakcji');
    }

    return await response.json();
  } catch (error) {
    console.error('Błąd podczas dodawania transakcji:', error);
    throw error;
  }
};

export const deleteTransaction = async (token, transactionId) => {
  const response = await fetch(`${API_URL}/transactions/${transactionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}; 