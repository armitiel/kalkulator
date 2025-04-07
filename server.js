const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'tsq-investment-secret-key'; // W produkcji należy użyć zmiennej środowiskowej
const PASSWORD_RESET_SECRET = 'tsq-password-reset-secret-key'; // Osobny sekret dla tokenów resetowania hasła

// Konfiguracja transportera poczty
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true dla 465, false dla innych portów
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com', // w produkcji użyj zmiennych środowiskowych
    pass: process.env.EMAIL_PASS || 'password', // w produkcji użyj zmiennych środowiskowych
  },
});

// Funkcja wysyłająca email resetowania hasła
async function sendPasswordResetEmail(email, resetToken) {
  // URL do strony resetowania hasła (w aplikacji frontendowej)
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  try {
    // W środowisku produkcyjnym wysyłamy email
    if (process.env.NODE_ENV === 'production') {
      await transporter.sendMail({
        from: '"Investment Tracker" <noreply@investment-tracker.com>',
        to: email,
        subject: 'Resetowanie hasła',
        text: `Aby zresetować hasło, kliknij w poniższy link: ${resetUrl}`,
        html: `
          <div>
            <h1>Resetowanie hasła</h1>
            <p>Aby zresetować swoje hasło, kliknij w poniższy link:</p>
            <p><a href="${resetUrl}">Resetuj hasło</a></p>
            <p>Link jest ważny przez 1 godzinę.</p>
            <p>Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.</p>
          </div>
        `,
      });
      return { success: true };
    } 
    // W środowisku deweloperskim, zwracamy token i logujemy do konsoli
    else {
      console.log(`[DEV MODE] Sending password reset email to ${email}`);
      console.log(`[DEV MODE] Reset URL: ${resetUrl}`);
      console.log(`[DEV MODE] Reset token: ${resetToken}`);
      return { success: true, resetToken, resetUrl };
    }
  } catch (error) {
    console.error('Błąd podczas wysyłania emaila:', error);
    return { success: false, error: error.message };
  }
}

// Middleware
// Obsługa formularzy dla alternatywnej metody logowania na iOS
app.use(bodyParser.urlencoded({ extended: true }));

// Rozszerzona konfiguracja CORS dla lepszej obsługi urządzeń iOS
app.use(cors({
  origin: '*', // W produkcji należy określić dozwolone domeny
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

// Dodajemy obsługę błędów parsowania JSON
app.use(bodyParser.json({
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ message: 'Invalid JSON format' });
      throw new Error('Invalid JSON format');
    }
  }
}));

// Inicjalizacja bazy danych
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Błąd podczas otwierania bazy danych:', err);
  } else {
    console.log('Połączono z bazą danych SQLite');
    initializeDatabase();
  }
});

// Inicjalizacja tabel w bazie danych
function initializeDatabase() {
  db.serialize(() => {
    // Tabela użytkowników
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabela portfeli
    db.run(`CREATE TABLE IF NOT EXISTS portfolios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      current_balance REAL NOT NULL,
      daily_signals INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Tabela historii transakcji
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      portfolio_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (portfolio_id) REFERENCES portfolios (id)
    )`);
  });
}

// Middleware do weryfikacji tokenu JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Brak tokenu autoryzacji' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Nieprawidłowy token' });
    }
    req.user = user;
    next();
  });
};

// Endpointy API

// Rejestracja użytkownika
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Nazwa użytkownika i hasło są wymagane' });
  }

  // Walidacja formatu adresu email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(username)) {
    return res.status(400).json({ message: 'Podaj prawidłowy adres email' });
  }

  // Walidacja hasła
  if (password.length < 8) {
    return res.status(400).json({ message: 'Hasło musi mieć co najmniej 8 znaków' });
  }

  // Sprawdzenie, czy hasło zawiera:
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!(hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar)) {
    return res.status(400).json({ 
      message: 'Hasło musi zawierać dużą literę, małą literę, cyfrę i znak specjalny' 
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ message: 'Użytkownik o tej nazwie już istnieje' });
        }
        return res.status(500).json({ message: 'Błąd podczas rejestracji użytkownika' });
      }
      
      const userId = this.lastID;
      
      // Utworzenie portfela dla nowego użytkownika
      db.run('INSERT INTO portfolios (user_id, current_balance, daily_signals) VALUES (?, ?, ?)', 
        [userId, 0, 3], (err) => {
          if (err) {
            return res.status(500).json({ message: 'Błąd podczas tworzenia portfela' });
          }
          
          const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '24h' });
          res.status(201).json({ token, userId, username });
        });
      });
      
      // Specjalny endpoint do debugowania problemów z logowaniem na iOS
      if (process.env.NODE_ENV !== 'production') {
        app.post('/api/login-debug', (req, res) => {
          console.log('Debug login request headers:', req.headers);
          console.log('Debug login request body:', req.body);
          
          try {
            // Zwracamy informacje o otrzymanym żądaniu
            res.json({
              received: {
                headers: req.headers,
                body: req.body,
                userAgent: req.headers['user-agent']
              },
              message: 'Debug endpoint działa poprawnie'
            });
          } catch (error) {
            console.error('Błąd w endpoint debug:', error);
            res.status(500).json({ error: error.message });
          }
        });
      }
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
  
  // Alternatywny endpoint logowania specjalnie dla urządzeń iOS
  app.post('/api/login-ios', (req, res) => {
    console.log('Otrzymano żądanie logowania iOS');
    console.log('Content-Type:', req.headers['content-type']);
    const username = req.body.username;
    const password = req.body.password;
  
    // Sprawdzamy, czy dane są poprawne
    if (!username || !password) {
      return res.status(400).json({ message: 'Nazwa użytkownika i hasło są wymagane' });
    }
  
    // Sanityzacja danych wejściowych
    const sanitizedUsername = username.trim();
  
    // Logika logowania identyczna jak w głównym endpoincie
    db.get('SELECT * FROM users WHERE username = ?', [sanitizedUsername], async (err, user) => {
      if (err) {
        console.error('Błąd bazy danych podczas logowania iOS:', err);
        return res.status(500).json({ message: 'Błąd podczas logowania' });
      }
      
      if (!user) {
        return res.status(401).json({ message: 'Nieprawidłowa nazwa użytkownika lub hasło' });
      }
      
      try {
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(401).json({ message: 'Nieprawidłowa nazwa użytkownika lub hasło' });
        }
        
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, userId: user.id, username: user.username });
      } catch (error) {
        console.error('Błąd podczas weryfikacji hasła:', error);
        return res.status(500).json({ message: 'Błąd podczas logowania' });
      }
    });
  });
});
// Logowanie użytkownika
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Sprawdzamy, czy dane są poprawnego typu
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      message: 'Nieprawidłowy format danych. Username i password muszą być typu string.'
    });
  }

  // Sanityzacja danych wejściowych
  const sanitizedUsername = username ? username.trim() : '';

  if (!sanitizedUsername || !password) {
    return res.status(400).json({ message: 'Nazwa użytkownika i hasło są wymagane' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [sanitizedUsername], async (err, user) => {
    if (err) {
      console.error('Błąd bazy danych podczas logowania:', err);
      return res.status(500).json({ message: 'Błąd podczas logowania' });
    }
    
    
    if (!user) {
      return res.status(401).json({ message: 'Nieprawidłowa nazwa użytkownika lub hasło' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Nieprawidłowa nazwa użytkownika lub hasło' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, userId: user.id, username: user.username });
  });
});

// Pobieranie danych portfela
app.get('/api/portfolio', authenticateToken, (req, res) => {
  db.get('SELECT * FROM portfolios WHERE user_id = ?', [req.user.id], (err, portfolio) => {
    if (err) {
      return res.status(500).json({ message: 'Błąd podczas pobierania danych portfela' });
    }
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfel nie znaleziony' });
    }
    
    res.json(portfolio);
  });
});

// Endpoint do aktualizacji portfela
app.put('/api/portfolio', authenticateToken, async (req, res) => {
  try {
    const { current_balance, daily_signals } = req.body;
    
    // Walidacja danych
    if (typeof current_balance !== 'number' || typeof daily_signals !== 'number') {
      return res.status(400).json({ 
        message: 'Nieprawidłowy format danych. Wymagane są wartości numeryczne.' 
      });
    }

    if (current_balance < 0 || daily_signals < 0) {
      return res.status(400).json({ 
        message: 'Wartości nie mogą być ujemne.' 
      });
    }

    const userId = req.user.id;
    
    // Aktualizacja portfela
    db.run(
      'UPDATE portfolios SET current_balance = ?, daily_signals = ? WHERE user_id = ?',
      [current_balance, daily_signals, userId],
      function(err) {
        if (err) {
          console.error('Błąd podczas aktualizacji portfela:', err);
          return res.status(500).json({ 
            message: 'Wystąpił błąd podczas aktualizacji portfela' 
          });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ 
            message: 'Nie znaleziono portfela dla tego użytkownika' 
          });
        }
        
        res.json({ 
          message: 'Portfel został zaktualizowany',
          current_balance,
          daily_signals
        });
      }
    );
  } catch (error) {
    console.error('Błąd podczas aktualizacji portfela:', error);
    res.status(500).json({ 
      message: 'Wystąpił błąd podczas aktualizacji portfela' 
    });
  }
});

// Pobieranie historii transakcji
app.get('/api/transactions', authenticateToken, (req, res) => {
  db.all(
    `SELECT t.* FROM transactions t
     JOIN portfolios p ON t.portfolio_id = p.id
     WHERE p.user_id = ?
     ORDER BY t.date DESC`,
    [req.user.id],
    (err, transactions) => {
      if (err) {
        return res.status(500).json({ message: 'Błąd podczas pobierania historii transakcji' });
      }
      res.json(transactions);
    }
  );
});

// Endpoint do dodawania transakcji
app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { date, amount, type, description } = req.body;
    const userId = req.user.id;

    // Walidacja danych
    if (!date || !amount || !type || !description) {
      return res.status(400).json({ 
        message: 'Wszystkie pola są wymagane' 
      });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ 
        message: 'Kwota musi być dodatnią liczbą' 
      });
    }

    if (!['deposit', 'withdrawal'].includes(type)) {
      return res.status(400).json({ 
        message: 'Nieprawidłowy typ transakcji' 
      });
    }

    // Rozpocznij transakcję
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Dodaj transakcję
      db.run(
        'INSERT INTO transactions (user_id, date, amount, type, description) VALUES (?, ?, ?, ?, ?)',
        [userId, date, amount, type, description],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            console.error('Błąd podczas dodawania transakcji:', err);
            return res.status(500).json({ 
              message: 'Wystąpił błąd podczas dodawania transakcji' 
            });
          }

          const transactionId = this.lastID;

          // Aktualizuj stan portfela
          const balanceChange = type === 'deposit' ? amount : -amount;
          db.run(
            'UPDATE portfolios SET current_balance = current_balance + ? WHERE user_id = ?',
            [balanceChange, userId],
            function(err) {
              if (err) {
                db.run('ROLLBACK');
                console.error('Błąd podczas aktualizacji portfela:', err);
                return res.status(500).json({ 
                  message: 'Wystąpił błąd podczas aktualizacji portfela' 
                });
              }

              if (this.changes === 0) {
                db.run('ROLLBACK');
                return res.status(404).json({ 
                  message: 'Nie znaleziono portfela dla tego użytkownika' 
                });
              }

              // Zatwierdź transakcję
              db.run('COMMIT', (err) => {
                if (err) {
                  console.error('Błąd podczas zatwierdzania transakcji:', err);
                  return res.status(500).json({ 
                    message: 'Wystąpił błąd podczas zapisywania transakcji' 
                  });
                }

                // Pobierz zaktualizowany stan portfela
                db.get(
                  'SELECT current_balance FROM portfolios WHERE user_id = ?',
                  [userId],
                  (err, row) => {
                    if (err) {
                      console.error('Błąd podczas pobierania stanu portfela:', err);
                      return res.status(500).json({ 
                        message: 'Wystąpił błąd podczas pobierania stanu portfela' 
                      });
                    }

                    res.status(201).json({
                      id: transactionId,
                      date,
                      amount,
                      type,
                      description,
                      current_balance: row.current_balance
                    });
                  }
                );
              });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Błąd podczas dodawania transakcji:', error);
    res.status(500).json({ 
      message: 'Wystąpił błąd podczas dodawania transakcji' 
    });
  }
});

// Usuwanie transakcji
app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
  const transactionId = req.params.id;
  
  db.get(
    `SELECT t.*, p.user_id FROM transactions t
     JOIN portfolios p ON t.portfolio_id = p.id
     WHERE t.id = ?`,
    [transactionId],
    (err, transaction) => {
      if (err) {
        return res.status(500).json({ message: 'Błąd podczas usuwania transakcji' });
      }
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transakcja nie znaleziona' });
      }
      
      if (transaction.user_id !== req.user.id) {
        return res.status(403).json({ message: 'Brak uprawnień do usunięcia tej transakcji' });
      }
      
      db.run('DELETE FROM transactions WHERE id = ?', [transactionId], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Błąd podczas usuwania transakcji' });
        }
        
        // Aktualizacja stanu portfela
        const balanceChange = transaction.type === 'deposit' ? -transaction.amount : transaction.amount;
        db.run(
          'UPDATE portfolios SET current_balance = current_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [balanceChange, transaction.portfolio_id],
          (err) => {
            if (err) {
              return res.status(500).json({ message: 'Błąd podczas aktualizacji stanu portfela' });
            }
            res.json({ message: 'Transakcja usunięta pomyślnie' });
          }
        );
      });
    }
  );
});

// Endpoint żądania resetowania hasła
app.post('/api/reset-password-request', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Adres email jest wymagany' });
  }
  
  // Walidacja formatu adresu email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Podaj prawidłowy adres email' });
  }
  
  try {
    // Znajdź użytkownika po emailu
    db.get('SELECT * FROM users WHERE username = ?', [email], async (err, user) => {
      // Zawsze zwracaj sukces, nawet jeśli użytkownik nie istnieje (względy bezpieczeństwa)
      if (err || !user) {
        console.log(`Próba resetowania hasła dla nieistniejącego konta: ${email}`);
        return res.json({ message: 'Jeśli konto istnieje, instrukcje resetowania hasła zostały wysłane na podany adres email.' });
      }
      
      // Generuj token resetowania (ważny przez 1 godzinę)
      const resetToken = jwt.sign(
        { id: user.id, username: user.username, type: 'password_reset' }, 
        PASSWORD_RESET_SECRET, 
        { expiresIn: '1h' }
      );
      
      // Wyślij email z instrukcjami resetowania hasła
      const emailResult = await sendPasswordResetEmail(user.username, resetToken);
      
      res.json({ 
        message: 'Jeśli konto istnieje, instrukcje resetowania hasła zostały wysłane na podany adres email.',
        // W trybie deweloperskim zwracamy również token i URL do testów
        ...(!process.env.NODE_ENV === 'production' ? { 
          resetToken, 
          resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
        } : {})
      });
    });
  } catch (error) {
    console.error('Błąd podczas przetwarzania żądania resetowania hasła:', error);
    res.status(500).json({ message: 'Wystąpił błąd serwera' });
  }
});

// Endpoint do ustawiania nowego hasła
app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token i nowe hasło są wymagane' });
  }
  
  // Walidacja hasła
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Hasło musi mieć co najmniej 8 znaków' });
  }
  
  // Sprawdzenie, czy hasło zawiera:
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasDigit = /\d/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  
  if (!(hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar)) {
    return res.status(400).json({ 
      message: 'Hasło musi zawierać dużą literę, małą literę, cyfrę i znak specjalny' 
    });
  }
  
  try {
    // Weryfikuj token resetowania hasła
    const decoded = jwt.verify(token, PASSWORD_RESET_SECRET);
    
    // Sprawdź, czy token jest typu password_reset
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ message: 'Nieprawidłowy token resetowania hasła' });
    }
    
    // Hashuj nowe hasło
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Aktualizuj hasło w bazie danych
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.id], function(err) {
      if (err) {
        console.error('Błąd podczas aktualizacji hasła:', err);
        return res.status(500).json({ message: 'Błąd podczas aktualizacji hasła' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
      }
      
      res.json({ message: 'Hasło zostało zresetowane pomyślnie' });
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Token resetowania hasła wygasł' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Nieprawidłowy token resetowania hasła' });
    }
    console.error('Błąd podczas resetowania hasła:', error);
    res.status(500).json({ message: 'Wystąpił błąd serwera' });
  }
});

// Serwowanie statycznych plików w produkcji
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
}); 