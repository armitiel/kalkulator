// Dynamicznie określ bazowy URL API na podstawie środowiska
const API_URL = process.env.NODE_ENV === 'production'
  ? `${window.location.origin}/api`
  : 'http://localhost:5000/api';

// Funkcje pomocnicze do obsługi API
const handleResponse = async (response) => {
  // Sprawdź, czy odpowiedź jest OK
  if (!response.ok) {
    // Próbuj odczytać odpowiedź jako JSON
    try {
      const contentType = response.headers.get('content-type');
      
      // Jeśli odpowiedź to JSON, odczytaj szczegóły błędu
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Wystąpił błąd podczas wykonywania operacji');
      }
      // Jeśli to nie JSON, spróbuj odczytać jako tekst
      else {
        const errorText = await response.text();
        throw new Error(errorText || `Błąd HTTP: ${response.status} ${response.statusText}`);
      }
    } catch (jsonError) {
      // Jeśli nie udało się przetworzyć odpowiedzi, rzuć oryginalny błąd HTTP
      if (jsonError instanceof Error && jsonError.message) {
        throw jsonError;
      } else {
        throw new Error(`Błąd HTTP: ${response.status} ${response.statusText}`);
      }
    }
  }
  
  // Próbuj odczytać odpowiedź jako JSON
  try {
    const contentType = response.headers.get('content-type');
    
    // Jeśli odpowiedź to JSON, parsuj ją
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    // Jeśli to nie JSON, zwróć tekst
    else {
      const text = await response.text();
      try {
        // Spróbuj sparsować jako JSON (czasem serwer nie ustawia prawidłowego Content-Type)
        return JSON.parse(text);
      } catch (e) {
        // Jeśli nie da się sparsować, zwróć tekst
        return { message: text };
      }
    }
  } catch (error) {
    console.error('Błąd podczas parsowania odpowiedzi:', error);
    throw new Error('Nieprawidłowy format odpowiedzi z serwera');
  }
};

// Funkcja pomocnicza do obsługi zapytań z obsługą błędów
const fetchWithErrorHandling = async (url, options = {}) => {
  try {
    // Dodajemy timeout dla zapytania
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 sekund timeout
    
    const fetchOptions = {
      ...options,
      signal: controller.signal
    };
    
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    
    return await handleResponse(response);
  } catch (error) {
    console.error(`Błąd podczas zapytania do ${url}:`, error);
    
    // Lepsze komunikaty błędów
    if (error.name === 'AbortError') {
      throw new Error('Przekroczono czas oczekiwania na odpowiedź serwera.');
    } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      throw new Error('Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.');
    }
    
    throw error;
  }
};

// Funkcje autoryzacji
export const register = async (username, password) => {
  return fetchWithErrorHandling(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
};

export const login = async (username, password) => {
  // Zapewniamy, że dane są odpowiednio sformatowane
  const sanitizedUsername = username.trim();
  
  return fetchWithErrorHandling(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json', // Dodanie nagłówka Accept
    },
    body: JSON.stringify({
      username: sanitizedUsername,
      password
    }),
  });
};

// Funkcje portfela
export const getPortfolio = async (token) => {
  try {
    return await fetchWithErrorHandling(`${API_URL}/portfolio`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Nie udało się pobrać danych portfela. Używam danych lokalnych.');
    // Zwróć null, aby aplikacja mogła użyć lokalnych danych
    return null;
  }
};

export const updatePortfolio = async (token, data) => {
  try {
    return await fetchWithErrorHandling(`${API_URL}/portfolio`, {
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
  } catch (error) {
    console.error('Błąd podczas aktualizacji portfela:', error);
    // Rzuć błąd, aby aplikacja mogła go obsłużyć
    throw error;
  }
};

// Funkcje transakcji
export const getTransactions = async (token) => {
  try {
    return await fetchWithErrorHandling(`${API_URL}/transactions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Nie udało się pobrać transakcji. Używam danych lokalnych.');
    // Zwróć pustą tablicę, aby aplikacja mogła użyć lokalnych danych
    return [];
  }
};

export const addTransaction = async (token, transaction) => {
  try {
    return await fetchWithErrorHandling(`${API_URL}/transactions`, {
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
  } catch (error) {
    console.error('Błąd podczas dodawania transakcji:', error);
    throw error;
  }
};

export const deleteTransaction = async (token, transactionId) => {
  return fetchWithErrorHandling(`${API_URL}/transactions/${transactionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
};

// Funkcje resetowania hasła
export const requestPasswordReset = async (email) => {
  return fetchWithErrorHandling(`${API_URL}/reset-password-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
};

export const resetPassword = async (token, newPassword) => {
  return fetchWithErrorHandling(`${API_URL}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  });
};

// Funkcje do obsługi wpłat
export const getDeposits = async (token) => {
  try {
    const response = await fetch(`${API_URL}/deposits`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch deposits');
    return await response.json();
  } catch (error) {
    console.error('Error fetching deposits:', error);
    throw error;
  }
};

export const addDeposit = async (token, depositData) => {
  try {
    const response = await fetch(`${API_URL}/deposits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(depositData)
    });
    if (!response.ok) throw new Error('Failed to add deposit');
    return await response.json();
  } catch (error) {
    console.error('Error adding deposit:', error);
    throw error;
  }
};

export const updateDepositStatus = async (token, depositId, status) => {
  try {
    const response = await fetch(`${API_URL}/deposits/${depositId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update deposit status');
    return await response.json();
  } catch (error) {
    console.error('Error updating deposit status:', error);
    throw error;
  }
};

export const getDepositHistory = async (token, depositId) => {
  try {
    const response = await fetch(`${API_URL}/deposits/${depositId}/history`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch deposit history');
    return await response.json();
  } catch (error) {
    console.error('Error fetching deposit history:', error);
    throw error;
  }
}; 