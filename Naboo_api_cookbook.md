# ACCEPTING PAYMENT
***
Payment with customer info:
const payment = await fetch('https://api.naboopay.com/api/v2/transactions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    method_of_payment: ['wave', 'orange_money'],
    products: [{
      name: 'Order #1234',
      category: 'order',
      price: 50000,
      quantity: 1
    }],
    customer: {
      name: 'Amadou Diallo',
      email: 'amadou@example.com',
      phone: '+221771234567'
    },
    success_url: 'https://yoursite.com/success',
    error_url: 'https://yoursite.com/error'
  })
}).then(r => r.json());

# SENDING PAYMENT
***
Sending payout to wave:
const payout = await fetch('https://api.naboopay.com/api/v2/payouts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    full_name: 'Fatou Ndiaye',
    phone_number: '+221771234567',
    amount: 10000,
    method_of_payment: 'wave'
  })
}).then(r => r.json());

console.log(payout.payout_id); // payout_xyz789
console.log(payout.status);    // 'pending' or 'completed'

***
Sending payout to orange money:
const payout = await fetch('https://api.naboopay.com/api/v2/payouts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    full_name: 'Ousmane Ba',
    phone_number: '+221761234567',
    amount: 25000,
    method_of_payment: 'orange_money'
  })
}).then(r => r.json());

***
Check balance before payout
async function sendPayout(recipient, amount, method) {
  // 1. Check balance
  const accounts = await fetch('https://api.naboopay.com/api/v2/accounts', {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  }).then(r => r.json());

  const balance = accounts.accounts[0].balance;

  if (balance < amount) {
    throw new Error(`Insufficient balance: ${balance} XOF (need ${amount} XOF)`);
  }

  // 2. Send payout
  const payout = await fetch('https://api.naboopay.com/api/v2/payouts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      full_name: recipient.name,
      phone_number: recipient.phone,
      amount: amount,
      method_of_payment: method
    })
  }).then(r => r.json());

  return payout;
}

// Usage
await sendPayout(
  { name: 'Fatou Ndiaye', phone: '+221771234567' },
  10000,
  'wave'
);

# MANAGING TRANSACTIONS
***List recent transactions
const transactions = await fetch(
  'https://api.naboopay.com/api/v2/transactions?limit=20',
  { headers: { 'Authorization': `Bearer ${API_KEY}` } }
).then(r => r.json());

transactions.forEach(t => {
  console.log(`${t.order_id}: ${t.status} - ${t.amount} XOF`);
});

***
Filter by status
// Get only paid transactions
const paid = await fetch(
  'https://api.naboopay.com/api/v2/transactions?status=paid',
  { headers: { 'Authorization': `Bearer ${API_KEY}` } }
).then(r => r.json());

// Get pending transactions
const pending = await fetch(
  'https://api.naboopay.com/api/v2/transactions?status=pending',
  { headers: { 'Authorization': `Bearer ${API_KEY}` } }
).then(r => r.json());

***Filter by date range
const startDate = '2024-01-01';
const endDate = '2024-01-31';

const januaryTransactions = await fetch(
  `https://api.naboopay.com/api/v2/transactions?start_date=${startDate}&end_date=${endDate}`,
  { headers: { 'Authorization': `Bearer ${API_KEY}` } }
).then(r => r.json());

# ACCOUNT MANAGEMENT
*** Get acount balance
const accounts = await fetch('https://api.naboopay.com/api/v2/accounts', {
  headers: { 'Authorization': `Bearer ${API_KEY}` }
}).then(r => r.json());

const currentAccount = accounts.accounts.find(a => a.type === 'current');
console.log(`Balance: ${currentAccount.balance} XOF`);

***Get account statistics
const stats = await fetch(
  `https://api.naboopay.com/api/v2/accounts/${accountId}/stats`,
  { headers: { 'Authorization': `Bearer ${API_KEY}` } }
).then(r => r.json());

console.log('Total received:', stats.total_received);
console.log('Total sent:', stats.total_sent);

# ERROR HANDLLINGS
***Wrap api calls
async function nabooPayRequest(endpoint, options = {}) {
  const response = await fetch(`https://api.naboopay.com/api/v2${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'API request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Usage with error handling
try {
  const payment = await nabooPayRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      method_of_payment: ['wave'],
      products: [{ name: 'Test', category: 'test', price: 1000, quantity: 1 }],
      success_url: 'https://example.com/success',
      error_url: 'https://example.com/error'
    })
  });
} catch (error) {
  if (error.status === 401) {
    console.error('Invalid API key');
  } else if (error.status === 429) {
    console.error('Rate limited - slow down requests');
  } else {
    console.error('Error:', error.message);
  }
}

# Handle errors in code
async function createPayment(data) {
  const response = await fetch('https://api.naboopay.com/api/v2/transactions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!response.ok) {
    switch (response.status) {
      case 400:
        throw new Error(`Invalid request: ${result.error}`);
      case 401:
        throw new Error('Invalid API key - check your credentials');
      case 429:
        throw new Error('Rate limited - please retry later');
      default:
        throw new Error(result.error || 'Unknown error');
    }
  }

  return result;
}

# DEBUGGING TIPS
*** Log request and response
async function apiCall(endpoint, options) {
  console.log('Request:', endpoint, options);

  const response = await fetch(`https://api.naboopay.com/api/v2${endpoint}`, options);
  const data = await response.json();

  console.log('Response:', response.status, data);

  return { response, data };
}

*** Validate before sending
function validateTransaction(data) {
  const errors = [];

  if (!data.products || data.products.length === 0) {
    errors.push('products is required');
  }

  if (!data.method_of_payment || data.method_of_payment.length === 0) {
    errors.push('method_of_payment is required');
  }

  if (!data.success_url) {
    errors.push('success_url is required');
  }

  data.products?.forEach((p, i) => {
    if (p.amount <= 10) {
      errors.push(`products[${i}].amount must be > 10 XOF`);
    }
  });

  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
}
