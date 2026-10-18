
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000/api/transactions";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Food");

  async function fetchTransactions() {
    try {
      setError("");
      const response = await axios.get(API);
      setTransactions(response.data);
    } catch (err) {
      setError("Could not load transactions. Check your backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;

  async function addTransaction(e) {
    e.preventDefault();
    console.log("Amount entered:", amount);
    console.log("Amount sent:", Number(amount));

    try {
      await axios.post(API, {
        title,
        amount: Number(amount),
        type,
        category,
        date: new Date().toISOString(),
      });

      setTitle("");
      setAmount("");
      await fetchTransactions();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add transaction.");
    }
  }

  async function deleteTransaction(id) {
    try {
      await axios.delete(`${API}/${id}`);
      await fetchTransactions();
    } catch (err) {
      setError("Could not delete transaction.");
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Expense Tracker</h1>
        <p>Manage your money, one transaction at a time.</p>
      </header>

      <section className="summary">
        <div className="card">
          <h3>Total Balance</h3>
          <h2>₹{balance.toFixed(2)}</h2>
        </div>

        <div className="card">
          <h3>Total Income</h3>
          <h2 className="income">₹{income.toFixed(2)}</h2>
        </div>

        <div className="card">
          <h3>Total Expenses</h3>
          <h2 className="expense">₹{expenses.toFixed(2)}</h2>
        </div>
      </section>

      <section className="transactions">
        <h2>Add Transaction</h2>

        <form onSubmit={addTransaction} className="transaction-form">
          <input
            placeholder="Transaction title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Amount (₹)"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Food</option>
            <option>Travel</option>
            <option>Shopping</option>
            <option>Salary</option>
            <option>Education</option>
            <option>Other</option>
          </select>

          <button type="submit">Add Transaction</button>
        </form>

        {error && <p className="error">{error}</p>}
      </section>

      <section className="transactions">
        <h2>Recent Transactions</h2>

        {loading ? (
          <p>Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p>No transactions yet. Add one above!</p>
        ) : (
          transactions.map((t) => (
            <div className="transaction" key={t._id}>
              <div>
                <strong>{t.title}</strong>
                <p>{t.category} · {t.type}</p>
              </div>

              <div className="transaction-actions">
                <strong className={t.type === "income" ? "income" : "expense"}>
                  {t.type === "income" ? "+" : "-"}₹{t.amount.toFixed(2)}
                </strong>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteTransaction(t._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default App;
